import type { Message, PersistencePort } from '../../application/contracts'
import type { GameState } from '../../domain/contracts'
import { createInitialPetState } from '../../domain/pet'
import { createInitialActionQueue } from '../../domain/queue'
import {
  migratePersistedSnapshot,
  restoreGameState,
  serializeGameState,
  type PersistedSnapshot,
} from './snapshot'

export interface RestoreProgressResult {
  state: GameState
  notification: Message | null
}

interface RestoredProgressWithTimestamp extends RestoreProgressResult {
  savedAtMs: number | null
}

export interface SaveProgressResult {
  snapshot: PersistedSnapshot
  notification: Message | null
}

/** Crea un progreso seguro cuando no puede recuperarse una instantánea utilizable. */
export const createInitialGameState = (): GameState => ({
  pet: createInitialPetState(),
  queue: createInitialActionQueue(),
})

/**
 * Recupera el progreso sin dejar que datos corruptos o un adaptador inaccesible
 * interrumpan la sesión actual.
 */
export const restoreGameStateSafely = async (persistence: PersistencePort): Promise<RestoreProgressResult> => {
  const { state, notification } = await restoreGameStateWithTimestamp(persistence)

  return { state, notification }
}

/** Recupera además la marca temporal necesaria para reanudar el reloj de juego. */
export const restoreGameStateWithTimestamp = async (
  persistence: PersistencePort,
): Promise<RestoredProgressWithTimestamp> => {
  try {
    const persistedValue = await persistence.load()

    if (persistedValue === null) {
      return { state: createInitialGameState(), notification: null, savedAtMs: null }
    }

    const snapshot = migratePersistedSnapshot(parsePersistedValue(persistedValue))

    if (snapshot !== null) {
      return {
        state: normalizeInterruptedActions(restoreGameState(snapshot)),
        notification: null,
        savedAtMs: snapshot.savedAtMs,
      }
    }
  } catch {
    // El almacenamiento puede estar bloqueado o contener JSON ilegible.
  }

  return {
    state: createInitialGameState(),
    notification: { key: 'progress-invalid' },
    savedAtMs: null,
  }
}

/** Guarda una instantánea sin impedir que la sesión continúe si el adaptador falla. */
export const saveGameStateSafely = async (
  persistence: PersistencePort,
  state: GameState,
  savedAtMs: number,
): Promise<SaveProgressResult> => {
  const snapshot = serializeGameState(state, savedAtMs)

  try {
    await persistence.save(snapshot)
    return { snapshot, notification: null }
  } catch {
    return { snapshot, notification: { key: 'progress-save-failed' } }
  }
}

const parsePersistedValue = (value: unknown): unknown => (typeof value === 'string' ? JSON.parse(value) : value)

/** Devuelve a pendientes las acciones que una sesión cerrada dejó en ejecución. */
const normalizeInterruptedActions = (state: GameState): GameState => {
  const items = state.queue.items.map((action) =>
    action.status === 'executing' ? { ...action, status: 'pending' as const } : action,
  )

  return { ...state, queue: { ...state.queue, items } }
}
