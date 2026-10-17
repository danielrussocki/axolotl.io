import type { ActionQueue, PetState, QueuedAction, QueuedActionStatus } from './contracts'
import { hasEnoughEnergyForMinigame } from './minigame'
import { toggleSleep } from './pet'

export type NewQueuedAction = Omit<QueuedAction, 'status'>

/** Resultado de una modificación de cola, incluidos los descartes que deben notificarse. */
export interface QueueUpdateResult {
  queue: ActionQueue
  droppedActions: QueuedAction[]
}

/** Indica si un efecto temporal bloquea el inicio de la siguiente acción. */
export interface QueueProcessingActivity {
  isActionAnimationActive: boolean
  isMinigameActive: boolean
}

/** Resultado de elegir la próxima acción lista para iniciar. */
export interface NextProcessableActionResult {
  queue: ActionQueue
  pet: PetState
  action: QueuedAction | null
}

const defaultQueueLimit = 20
const minimumQueueLimit = 0
const maximumQueueLimit = 200

/** Crea la configuración inicial visible de la cola de acciones. */
export const createInitialActionQueue = (): ActionQueue => ({
  limit: defaultQueueLimit,
  isVisible: true,
  items: [],
})

/** Añade una acción nueva como pendiente al final de la cola. */
export const enqueueAction = (queue: ActionQueue, action: NewQueuedAction): ActionQueue =>
  enqueueActionWithOverflow(queue, action).queue

/**
 * Añade una acción y, si las pendientes ya alcanzaron el límite, descarta
 * primero la pendiente más próxima a ejecutarse.
 */
export const enqueueActionWithOverflow = (
  queue: ActionQueue,
  action: NewQueuedAction,
): QueueUpdateResult => {
  if (queue.limit === minimumQueueLimit) {
    return { queue, droppedActions: [] }
  }

  const pendingActions = queue.items.filter((queuedAction) => queuedAction.status === 'pending')
  const { queue: queueWithoutOverflow, droppedActions } =
    pendingActions.length >= queue.limit ? discardEarliestPendingActions(queue, 1) : { queue, droppedActions: [] }

  return {
    queue: {
      ...queueWithoutOverflow,
      items: [...queueWithoutOverflow.items, { ...action, status: 'pending' }],
    },
    droppedActions,
  }
}

/** Actualiza el máximo de acciones permitido dentro del rango configurable. */
export const setQueueLimit = (queue: ActionQueue, limit: number): ActionQueue =>
  setQueueLimitWithOverflow(queue, limit).queue

/** Actualiza el límite y descarta las pendientes más próximas hasta respetarlo. */
export const setQueueLimitWithOverflow = (queue: ActionQueue, limit: number): QueueUpdateResult => {
  if (!Number.isInteger(limit) || limit < minimumQueueLimit || limit > maximumQueueLimit) {
    throw new RangeError(`El límite de la cola debe estar entre ${minimumQueueLimit} y ${maximumQueueLimit}.`)
  }

  const pendingActionCount = queue.items.filter((action) => action.status === 'pending').length
  const { queue: queueWithoutOverflow, droppedActions } = discardEarliestPendingActions(
    queue,
    Math.max(pendingActionCount - limit, 0),
  )

  return { queue: { ...queueWithoutOverflow, limit }, droppedActions }
}

/** Actualiza el estado visible de una acción sin alterar las demás. */
export const markActionStatus = (
  queue: ActionQueue,
  actionId: string,
  status: QueuedActionStatus,
): ActionQueue => ({
  ...queue,
  items: queue.items.map((action) => (action.id === actionId ? { ...action, status } : action)),
})

/** Retira una acción completada o descartada de la cola. */
export const removeQueuedAction = (queue: ActionQueue, actionId: string): ActionQueue => ({
  ...queue,
  items: queue.items.filter((action) => action.id !== actionId),
})

/**
 * Selecciona la siguiente acción que puede empezar sin ejecutar sus efectos.
 * Las acciones de juego sin energía esperan en la cola para que puedan pasar
 * acciones posteriores que no dependan de energía.
 */
export const selectNextProcessableAction = (
  queue: ActionQueue,
  pet: PetState,
  activity: QueueProcessingActivity = { isActionAnimationActive: false, isMinigameActive: false },
): NextProcessableActionResult => {
  if (
    activity.isActionAnimationActive ||
    activity.isMinigameActive ||
    queue.items.some((action) => action.status === 'executing')
  ) {
    return { queue, pet, action: null }
  }

  let items = queue.items

  for (const action of queue.items) {
    if (action.type === 'play' && (action.status === 'pending' || action.status === 'waiting-energy')) {
      if (!hasEnoughEnergyForMinigame(pet)) {
        if (action.status === 'pending') {
          items = replaceActionStatus(items, action.id, 'waiting-energy')
        }
        continue
      }

      return selectActionForExecution(queue, items, action, pet)
    }

    if (action.status === 'pending') {
      return selectActionForExecution(queue, items, action, pet)
    }
  }

  return { queue: items === queue.items ? queue : { ...queue, items }, pet, action: null }
}

/** Prepara una acción para ejecutarse y despierta a Mochi si no es una acción de descanso. */
const selectActionForExecution = (
  queue: ActionQueue,
  items: QueuedAction[],
  action: QueuedAction,
  pet: PetState,
): NextProcessableActionResult => ({
  queue: { ...queue, items: replaceActionStatus(items, action.id, 'executing') },
  pet: pet.isSleeping && action.type !== 'sleep' ? toggleSleep(pet) : pet,
  action: { ...action, status: 'executing' },
})

const discardEarliestPendingActions = (queue: ActionQueue, count: number): QueueUpdateResult => {
  const droppedActions: QueuedAction[] = []
  const items = queue.items.filter((action) => {
    if (action.status === 'pending' && droppedActions.length < count) {
      droppedActions.push(action)
      return false
    }

    return true
  })

  return droppedActions.length === 0 ? { queue, droppedActions } : { queue: { ...queue, items }, droppedActions }
}

const replaceActionStatus = (
  actions: QueuedAction[],
  actionId: string,
  status: QueuedActionStatus,
): QueuedAction[] => actions.map((action) => (action.id === actionId ? { ...action, status } : action))
