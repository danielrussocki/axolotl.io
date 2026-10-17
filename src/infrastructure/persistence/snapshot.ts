import type { ActionType, GameState, QueuedActionStatus } from '../../domain/contracts'

export const CURRENT_PERSISTED_FORMAT_VERSION = 1

const minimumQueueLimit = 0
const maximumQueueLimit = 200
const minimumNeed = 0
const maximumNeed = 100

const actionTypes: readonly ActionType[] = ['feed', 'clean', 'pet', 'play', 'sleep']
const queuedActionStatuses: readonly QueuedActionStatus[] = ['pending', 'executing', 'waiting-energy']

/** Estado de mascota que se conserva entre sesiones. */
export interface PersistedPetState {
  needs: {
    hunger: number
    happiness: number
    cleanliness: number
    energy: number
  }
  isSleeping: boolean
  needsCleaning: boolean
  hungrySinceMs: number | null
}

/** Acción conservada para reanudar la cola en una sesión posterior. */
export interface PersistedQueuedAction {
  id: string
  type: ActionType
  createdAtMs: number
  status: QueuedActionStatus
}

/** Preferencias y acciones pendientes que forman la cola persistida. */
export interface PersistedActionQueue {
  limit: number
  isVisible: boolean
  items: PersistedQueuedAction[]
}

/** Instantánea versionada del progreso, independiente del adaptador de almacenamiento. */
export interface PersistedSnapshot {
  formatVersion: typeof CURRENT_PERSISTED_FORMAT_VERSION
  savedAtMs: number
  pet: PersistedPetState
  queue: PersistedActionQueue
}

/** Convierte el estado de juego en una instantánea apta para persistir. */
export const serializeGameState = (state: GameState, savedAtMs: number): PersistedSnapshot => ({
  formatVersion: CURRENT_PERSISTED_FORMAT_VERSION,
  savedAtMs,
  pet: {
    needs: { ...state.pet.needs },
    isSleeping: state.pet.isSleeping,
    needsCleaning: state.pet.needsCleaning,
    hungrySinceMs: state.pet.hungrySinceMs,
  },
  queue: {
    limit: state.queue.limit,
    isVisible: state.queue.isVisible,
    items: state.queue.items.map(({ id, type, createdAtMs, status }) => ({ id, type, createdAtMs, status })),
  },
})

/** Restaura el estado de juego desde una instantánea ya validada. */
export const restoreGameState = (snapshot: PersistedSnapshot): GameState => ({
  pet: {
    needs: { ...snapshot.pet.needs },
    isSleeping: snapshot.pet.isSleeping,
    needsCleaning: snapshot.pet.needsCleaning,
    hungrySinceMs: snapshot.pet.hungrySinceMs,
  },
  queue: {
    limit: snapshot.queue.limit,
    isVisible: snapshot.queue.isVisible,
    items: snapshot.queue.items.map((action) => ({ ...action, source: 'local' })),
  },
})

/**
 * Valida la estructura y los rangos de una instantánea en el formato actual.
 * La lectura de JSON, la restauración y las migraciones pertenecen a tareas posteriores.
 */
export const validatePersistedSnapshot = (value: unknown): PersistedSnapshot | null => {
  if (!isRecord(value) || value.formatVersion !== CURRENT_PERSISTED_FORMAT_VERSION || !isTimestamp(value.savedAtMs)) {
    return null
  }

  const pet = validatePersistedPetState(value.pet)
  const queue = validatePersistedActionQueue(value.queue)

  if (pet === null || queue === null) {
    return null
  }

  return {
    formatVersion: CURRENT_PERSISTED_FORMAT_VERSION,
    savedAtMs: value.savedAtMs,
    pet,
    queue,
  }
}

/**
 * Adapta formatos anteriores compatibles antes de restaurar el progreso.
 * La versión 0 conserva la misma estructura que la versión actual; solo se
 * actualiza su marca de formato para pasar por la validación vigente.
 */
export const migratePersistedSnapshot = (value: unknown): PersistedSnapshot | null => {
  if (!isRecord(value)) {
    return null
  }

  if (value.formatVersion === CURRENT_PERSISTED_FORMAT_VERSION) {
    return validatePersistedSnapshot(value)
  }

  if (value.formatVersion === 0) {
    return validatePersistedSnapshot({ ...value, formatVersion: CURRENT_PERSISTED_FORMAT_VERSION })
  }

  return null
}

const validatePersistedPetState = (value: unknown): PersistedPetState | null => {
  if (!isRecord(value) || !isRecord(value.needs)) {
    return null
  }

  const { hunger, happiness, cleanliness, energy } = value.needs

  if (
    !isNeed(hunger) ||
    !isNeed(happiness) ||
    !isNeed(cleanliness) ||
    !isNeed(energy) ||
    typeof value.isSleeping !== 'boolean' ||
    typeof value.needsCleaning !== 'boolean' ||
    (value.hungrySinceMs !== null && !isTimestamp(value.hungrySinceMs))
  ) {
    return null
  }

  return {
    needs: { hunger, happiness, cleanliness, energy },
    isSleeping: value.isSleeping,
    needsCleaning: value.needsCleaning,
    hungrySinceMs: value.hungrySinceMs,
  }
}

const validatePersistedActionQueue = (value: unknown): PersistedActionQueue | null => {
  if (
    !isRecord(value) ||
    !isQueueLimit(value.limit) ||
    typeof value.isVisible !== 'boolean' ||
    !Array.isArray(value.items)
  ) {
    return null
  }

  const items = value.items.map(validatePersistedQueuedAction)

  if (items.some((item) => item === null)) {
    return null
  }

  return { limit: value.limit, isVisible: value.isVisible, items: items as PersistedQueuedAction[] }
}

const validatePersistedQueuedAction = (value: unknown): PersistedQueuedAction | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    value.id.length === 0 ||
    !isActionType(value.type) ||
    !isTimestamp(value.createdAtMs) ||
    !isQueuedActionStatus(value.status)
  ) {
    return null
  }

  return {
    id: value.id,
    type: value.type,
    createdAtMs: value.createdAtMs,
    status: value.status,
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const isNeed = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= minimumNeed && value <= maximumNeed

const isTimestamp = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0

const isQueueLimit = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= minimumQueueLimit &&
  value <= maximumQueueLimit

const isActionType = (value: unknown): value is ActionType =>
  typeof value === 'string' && actionTypes.includes(value as ActionType)

const isQueuedActionStatus = (value: unknown): value is QueuedActionStatus =>
  typeof value === 'string' && queuedActionStatuses.includes(value as QueuedActionStatus)
