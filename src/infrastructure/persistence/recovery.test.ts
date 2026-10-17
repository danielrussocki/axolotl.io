import { describe, expect, it } from 'vitest'

import type { PersistencePort } from '../../application/contracts'
import type { GameState } from '../../domain/contracts'
import { selectNextProcessableAction } from '../../domain/queue'
import { serializeGameState } from './snapshot'
import { restoreGameStateSafely, saveGameStateSafely } from './recovery'

const initialState: GameState = {
  pet: {
    needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 75 },
    isSleeping: false,
    needsCleaning: false,
    hungrySinceMs: null,
  },
  queue: {
    limit: 20,
    isVisible: true,
    items: [],
  },
}

const createPersistencePort = (overrides: Partial<PersistencePort> = {}): PersistencePort => ({
  load: async () => null,
  save: async () => undefined,
  clear: async () => undefined,
  ...overrides,
})

describe('recuperación segura de progreso', () => {
  it('descarta datos corruptos, restaura un estado seguro y avisa', async () => {
    const persistence = createPersistencePort({ load: async () => '{ datos corruptos' })

    await expect(restoreGameStateSafely(persistence)).resolves.toEqual({
      state: initialState,
      notification: { key: 'progress-invalid' },
    })
  })

  it('restaura datos persistidos válidos sin aviso', async () => {
    const persistedState: GameState = {
      ...initialState,
      pet: { ...initialState.pet, needs: { ...initialState.pet.needs, hunger: 42 } },
    }
    const persistence = createPersistencePort({ load: async () => serializeGameState(persistedState, 1_000) })

    await expect(restoreGameStateSafely(persistence)).resolves.toEqual({
      state: persistedState,
      notification: null,
    })
  })

  it('migra el progreso compatible de la versión 0 antes de restaurarlo', async () => {
    const legacyState: GameState = {
      ...initialState,
      pet: { ...initialState.pet, isSleeping: true },
      queue: {
        ...initialState.queue,
        limit: 7,
        isVisible: false,
        items: [{ id: 'action-001', type: 'clean', createdAtMs: 1_000, source: 'local', status: 'pending' }],
      },
    }
    const legacySnapshot = { ...serializeGameState(legacyState, 2_000), formatVersion: 0 }
    const persistence = createPersistencePort({ load: async () => JSON.stringify(legacySnapshot) })

    await expect(restoreGameStateSafely(persistence)).resolves.toEqual({
      state: legacyState,
      notification: null,
    })
  })

  it('restaura un estado seguro y avisa si el almacenamiento está bloqueado al leer', async () => {
    const persistence = createPersistencePort({
      load: async () => {
        throw new Error('Almacenamiento bloqueado')
      },
    })

    await expect(restoreGameStateSafely(persistence)).resolves.toEqual({
      state: initialState,
      notification: { key: 'progress-invalid' },
    })
  })

  it('normaliza una acción interrumpida como pendiente para que vuelva a procesarse', async () => {
    const interruptedState: GameState = {
      ...initialState,
      queue: {
        ...initialState.queue,
        items: [
          { id: 'action-001', type: 'feed', createdAtMs: 1_000, source: 'local', status: 'executing' },
          { id: 'action-002', type: 'clean', createdAtMs: 2_000, source: 'local', status: 'waiting-energy' },
        ],
      },
    }
    const persistence = createPersistencePort({ load: async () => serializeGameState(interruptedState, 3_000) })

    const { state, notification } = await restoreGameStateSafely(persistence)
    const next = selectNextProcessableAction(state.queue, state.pet)

    expect(notification).toBeNull()
    expect(state.queue.items).toEqual([
      { ...interruptedState.queue.items[0], status: 'pending' },
      interruptedState.queue.items[1],
    ])
    expect(next.action).toEqual({ ...interruptedState.queue.items[0], status: 'executing' })
  })
})

describe('guardado tolerante a fallos', () => {
  it('permite continuar con el estado actual y avisa si el almacenamiento falla', async () => {
    const save = async (): Promise<void> => {
      throw new Error('Almacenamiento bloqueado')
    }
    const persistence = createPersistencePort({ save })

    await expect(saveGameStateSafely(persistence, initialState, 1_000)).resolves.toEqual({
      snapshot: serializeGameState(initialState, 1_000),
      notification: { key: 'progress-save-failed' },
    })
  })

  it('guarda la instantánea y no avisa cuando el almacenamiento está disponible', async () => {
    const savedSnapshots: unknown[] = []
    const persistence = createPersistencePort({
      save: async (snapshot) => {
        savedSnapshots.push(snapshot)
      },
    })

    await expect(saveGameStateSafely(persistence, initialState, 1_000)).resolves.toEqual({
      snapshot: serializeGameState(initialState, 1_000),
      notification: null,
    })
    expect(savedSnapshots).toEqual([serializeGameState(initialState, 1_000)])
  })
})
