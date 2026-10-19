import type { GameCommand, GameResult } from '../../application/contracts'
import { GameController } from '../../application/gameController'
import { getMessageText } from '../../domain/messages'
import type { GameState, MinigameState } from '../../domain/contracts'

export interface GameUiSnapshot {
  state: GameState
  message: string
  notifications: readonly string[]
}

export interface GameUiStore {
  getSnapshot(): GameUiSnapshot
  subscribe(listener: () => void): () => void
  dispatch(command: GameCommand): Promise<GameResult>
  captureHeart(): GameResult
  finishMinigame(): Promise<GameResult>
  getActiveMinigame(): MinigameState | null
  dispose(): void
}

const defaultMessage = '¡Cuida a Mochi! Necesita comer, jugar y baños.'

/**
 * Adapta las instantáneas y los resultados del controlador al modelo de
 * suscripción que consume React. No reproduce reglas del dominio.
 */
export const createGameUiStore = (controller: GameController): GameUiStore => {
  let snapshot: GameUiSnapshot = {
    state: controller.getState(),
    message: defaultMessage,
    notifications: controller.getInitialNotifications().map(getMessageText),
  }
  const listeners = new Set<() => void>()

  const publish = (result: GameResult) => {
    snapshot = {
      state: result.state,
      message: result.message === null ? snapshot.message : getMessageText(result.message),
      notifications: result.notifications.map(getMessageText),
    }
    listeners.forEach((listener) => listener())
  }

  const unsubscribeFromController = controller.subscribe(publish)

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    dispatch: (command) => controller.dispatch(command),
    captureHeart: () => controller.captureHeart(),
    finishMinigame: () => controller.finishMinigame(),
    getActiveMinigame: () => controller.getActiveMinigame(),
    dispose: () => {
      unsubscribeFromController()
      listeners.clear()
      controller.dispose()
    },
  }
}
