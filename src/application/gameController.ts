import type { GameState, MinigameState, QueuedAction } from '../domain/contracts'
import { captureHeart, resolveMinigame, startMinigame } from '../domain/minigame'
import { applyClean, applyFeed, applyHeart, applyPet, applyPetNeedRates, applyPlay, toggleSleep } from '../domain/pet'
import {
  enqueueActionWithOverflow,
  removeQueuedAction,
  selectNextProcessableAction,
  setQueueLimitWithOverflow,
} from '../domain/queue'
import { calculateElapsedTimeMs } from '../domain/time'
import {
  createInitialGameState,
  restoreGameStateWithTimestamp,
  saveGameStateSafely,
} from '../infrastructure/persistence/recovery'
import type { ActionCommand, ClockPort, GameCommand, GameEffect, GameResult, Message, PersistencePort } from './contracts'

export interface GameControllerOptions {
  persistence: PersistencePort
  clock: ClockPort
}

interface ProcessingResult {
  message: Message | null
  notifications: Message[]
  effects: GameEffect[]
}

/**
 * Coordina comandos y adaptadores; todos los cambios de necesidades continúan
 * delegados a las funciones puras del dominio.
 */
export class GameController {
  private state: GameState
  private activeMinigame: MinigameState | null = null
  private readonly persistence: PersistencePort
  private readonly clock: ClockPort
  private lastProgressMs: number
  private isResetConfirmationPending = false
  private foregroundUpdate: Promise<void> = Promise.resolve()
  private readonly unsubscribeFromForeground: () => void

  private constructor(persistence: PersistencePort, clock: ClockPort, state: GameState, lastProgressMs: number) {
    this.persistence = persistence
    this.clock = clock
    this.state = state
    this.lastProgressMs = lastProgressMs
    this.unsubscribeFromForeground = clock.onForeground(() => {
      this.foregroundUpdate = this.applyForegroundProgress()
    })
  }

  /** Restaura una sesión segura antes de aceptar comandos. */
  static async create(options: GameControllerOptions): Promise<GameController> {
    const restored = await restoreGameStateWithTimestamp(options.persistence)
    const currentTimeMs = options.clock.now()
    const controller = new GameController(
      options.persistence,
      options.clock,
      restored.state,
      restored.savedAtMs ?? currentTimeMs,
    )
    const appliedElapsedTime = controller.applyElapsedTime(currentTimeMs)
    const hadRestoredActions = controller.state.queue.items.length > 0
    controller.processQueue()

    if (hadRestoredActions || appliedElapsedTime) {
      await saveGameStateSafely(options.persistence, controller.state, controller.lastProgressMs)
    }

    return controller
  }

  /** Devuelve una instantánea que los adaptadores pueden representar sin mutarla. */
  getState(): GameState {
    return this.state
  }

  /** Expone el minijuego temporal para el adaptador de escena. */
  getActiveMinigame(): MinigameState | null {
    return this.activeMinigame
  }

  /** Libera la suscripción al reloj cuando el adaptador destruye la sesión. */
  dispose(): void {
    this.unsubscribeFromForeground()
  }

  /** Recibe un único comando tipado procedente de la interfaz o de un adaptador. */
  async dispatch(command: GameCommand): Promise<GameResult> {
    await this.foregroundUpdate

    if (isActionCommand(command)) {
      return this.requestAction(command)
    }

    if (command.type === 'setQueueLimit') {
      const update = setQueueLimitWithOverflow(this.state.queue, command.limit)
      this.state = { ...this.state, queue: update.queue }
      const notifications = update.droppedActions.map(createDroppedMessage)

      return this.saveAndCreateResult(null, notifications, [])
    }

    if (command.type === 'setQueueVisibility') {
      this.state = { ...this.state, queue: { ...this.state.queue, isVisible: command.isVisible } }

      return this.saveAndCreateResult(null, [], [])
    }

    if (command.type === 'reset') {
      this.isResetConfirmationPending = true
      return this.createResult({ key: 'reset-confirmation-requested' }, [], [])
    }

    if (command.type === 'cancelReset') {
      this.isResetConfirmationPending = false
      return this.createResult(null, [], [])
    }

    if (command.type === 'confirmReset' && this.isResetConfirmationPending) {
      const pendingActions = command.keepPendingActions ? this.state.queue.items : []
      const initialState = createInitialGameState()
      this.state = {
        ...initialState,
        queue: { ...initialState.queue, items: pendingActions },
      }
      this.activeMinigame = null
      this.lastProgressMs = this.clock.now()
      this.isResetConfirmationPending = false

      return this.saveAndCreateResult(null, [], [])
    }

    // El adaptador de audio se implementa en una tarea posterior.
    return this.createResult(null, [], [])
  }

  /** Registra un corazón únicamente mientras el minijuego está activo. */
  captureHeart(): GameResult {
    if (this.activeMinigame === null) {
      return this.createResult(null, [], [])
    }

    this.activeMinigame = captureHeart(this.activeMinigame)
    this.state = { ...this.state, pet: applyHeart(this.state.pet) }

    return this.createResult(null, [], [{ type: 'heart-captured' }])
  }

  /** Finaliza el minijuego cuando alcanza su duración y reanuda la cola. */
  async finishMinigame(currentTimeMs = this.clock.now()): Promise<GameResult> {
    await this.foregroundUpdate

    if (this.activeMinigame === null || resolveMinigame(this.activeMinigame, currentTimeMs) === null) {
      return this.createResult(null, [], [])
    }

    const action = this.state.queue.items.find((item) => item.status === 'executing' && item.type === 'play')
    this.activeMinigame = null

    if (action !== undefined) {
      this.state = { ...this.state, queue: removeQueuedAction(this.state.queue, action.id) }
    }

    const processed = this.processQueue()

    return this.saveAndCreateResult(
      { key: 'action-completed', parameters: { actionType: 'play' } },
      processed.notifications,
      [{ type: 'play-completed', actionId: action?.id }, ...processed.effects],
    )
  }

  private async requestAction(action: ActionCommand): Promise<GameResult> {
    if (this.state.queue.limit === 0) {
      return this.createResult({ key: 'queue-disabled' }, [], [])
    }

    const update = enqueueActionWithOverflow(this.state.queue, action)
    this.state = { ...this.state, queue: update.queue }
    const processed = this.processQueue()

    return this.saveAndCreateResult(
      processed.message,
      [...update.droppedActions.map(createDroppedMessage), ...processed.notifications],
      processed.effects,
    )
  }

  private processQueue(): ProcessingResult {
    const notifications: Message[] = []
    const effects: GameEffect[] = []
    let message: Message | null = null

    while (this.activeMinigame === null) {
      const selected = selectNextProcessableAction(this.state.queue, this.state.pet)
      this.state = { pet: selected.pet, queue: selected.queue }

      if (selected.action === null) {
        const hasWaitingGame = this.state.queue.items.some((item) => item.status === 'waiting-energy')
        if (hasWaitingGame) {
          notifications.push({ key: 'energy-insufficient' })
        }
        break
      }

      if (selected.action.type === 'play') {
        this.state = { ...this.state, pet: applyPlay(this.state.pet) }
        this.activeMinigame = startMinigame(this.clock.now())
        effects.push({ type: 'play', actionId: selected.action.id })
        message = { key: 'action-completed', parameters: { actionType: 'play' } }
        break
      }

      this.completeInstantAction(selected.action)
      effects.push({ type: selected.action.type, actionId: selected.action.id })
      message = { key: 'action-completed', parameters: { actionType: selected.action.type } }
    }

    return { message, notifications, effects }
  }

  private completeInstantAction(action: QueuedAction): void {
    const pet = applyAction(this.state.pet, action)
    this.state = {
      pet,
      queue: removeQueuedAction(this.state.queue, action.id),
    }
  }

  private async saveAndCreateResult(
    message: Message | null,
    notifications: Message[],
    effects: GameEffect[],
  ): Promise<GameResult> {
    const saved = await saveGameStateSafely(this.persistence, this.state, this.lastProgressMs)

    return this.createResult(message, saved.notification === null ? notifications : [...notifications, saved.notification], effects)
  }

  private createResult(message: Message | null, notifications: Message[], effects: GameEffect[]): GameResult {
    return { state: this.state, message, notifications, effects }
  }

  /** Aplica el tiempo ausente y resuelve el minijuego antes de procesar la cola. */
  private async applyForegroundProgress(): Promise<void> {
    const currentTimeMs = this.clock.now()

    if (this.activeMinigame !== null) {
      if (resolveMinigame(this.activeMinigame, currentTimeMs) === null) {
        return
      }

      const action = this.state.queue.items.find((item) => item.status === 'executing' && item.type === 'play')
      this.activeMinigame = null

      if (action !== undefined) {
        this.state = { ...this.state, queue: removeQueuedAction(this.state.queue, action.id) }
      }

      this.lastProgressMs = currentTimeMs
      this.processQueue()
      await saveGameStateSafely(this.persistence, this.state, this.lastProgressMs)
      return
    }

    if (!this.applyElapsedTime(currentTimeMs)) {
      return
    }

    this.processQueue()
    await saveGameStateSafely(this.persistence, this.state, this.lastProgressMs)
  }

  /** Delega el deterioro al dominio y conserva una marca temporal válida. */
  private applyElapsedTime(currentTimeMs: number): boolean {
    const elapsedTimeMs = calculateElapsedTimeMs(this.lastProgressMs, currentTimeMs)

    if (elapsedTimeMs === 0) {
      return false
    }

    this.state = {
      ...this.state,
      pet: applyPetNeedRates(this.state.pet, elapsedTimeMs / 1_000, currentTimeMs),
    }
    this.lastProgressMs = currentTimeMs

    return true
  }
}

const isActionCommand = (command: GameCommand): command is ActionCommand =>
  ['feed', 'clean', 'pet', 'play', 'sleep'].includes(command.type)

const applyAction = (pet: GameState['pet'], action: QueuedAction): GameState['pet'] => {
  switch (action.type) {
    case 'feed':
      return applyFeed(pet)
    case 'clean':
      return applyClean(pet)
    case 'pet':
      return applyPet(pet)
    case 'sleep':
      return toggleSleep(pet)
    case 'play':
      return applyPlay(pet)
  }
}

const createDroppedMessage = (action: QueuedAction): Message => ({
  key: 'action-dropped',
  parameters: { actionType: action.type },
})
