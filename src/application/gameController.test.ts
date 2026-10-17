import { describe, expect, it } from 'vitest'
import { GameController } from './gameController'
import type { ClockPort, PersistencePort } from './contracts'

const createPersistence = (loadedSnapshot: unknown = null): PersistencePort & { savedSnapshots: unknown[] } => {
  const savedSnapshots: unknown[] = []

  return {
    savedSnapshots,
    load: async () => loadedSnapshot,
    save: async (snapshot) => {
      savedSnapshots.push(snapshot)
    },
    clear: async () => {},
  }
}

const createFailingPersistence = (): PersistencePort => ({
  load: async () => null,
  save: async () => {
    throw new Error('Almacenamiento no disponible')
  },
  clear: async () => {},
})

const createClock = (currentTimeMs: number): ClockPort & { setTime: (timeMs: number) => void; foreground: () => void } => {
  let now = currentTimeMs
  let foregroundListener: (() => void) | null = null

  return {
    now: () => now,
    setTime: (timeMs) => {
      now = timeMs
    },
    foreground: () => {
      foregroundListener?.()
    },
    onForeground: (listener) => {
      foregroundListener = listener
      return () => {
        foregroundListener = null
      }
    },
  }
}

describe('GameController', () => {
  it('reanuda el procesamiento de las acciones pendientes restauradas', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 0,
      pet: {
        needs: { hunger: 50, happiness: 86, cleanliness: 82, energy: 75 },
        isSleeping: false,
        needsCleaning: false,
        hungrySinceMs: null,
      },
      queue: {
        limit: 20,
        isVisible: true,
        items: [{ id: 'feed-1', type: 'feed', createdAtMs: 0, status: 'pending' }],
      },
    })

    const controller = await GameController.create({ persistence, clock: createClock(500) })

    expect(controller.getState().pet.needs.hunger).toBe(79.875)
    expect(controller.getState().queue.items).toEqual([])
    expect(persistence.savedSnapshots).toHaveLength(1)
  })

  it('encola, procesa y guarda una acción usando las reglas del dominio', async () => {
    const persistence = createPersistence()
    const controller = await GameController.create({ persistence, clock: createClock(1_000) })

    const result = await controller.dispatch({
      type: 'feed',
      id: 'feed-1',
      createdAtMs: 1_000,
      source: 'local',
    })

    expect(result.state.pet.needs).toMatchObject({ hunger: 100, cleanliness: 77 })
    expect(result.state.queue.items).toEqual([])
    expect(result.message).toEqual({ key: 'action-completed', parameters: { actionType: 'feed' } })
    expect(result.effects).toEqual([{ type: 'feed', actionId: 'feed-1' }])
    expect(persistence.savedSnapshots).toHaveLength(1)
  })

  it('aplaza un juego sin energía y procesa una acción independiente posterior', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 0,
      pet: {
        needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 11 },
        isSleeping: false,
        needsCleaning: false,
        hungrySinceMs: null,
      },
      queue: { limit: 20, isVisible: true, items: [] },
    })
    const controller = await GameController.create({ persistence, clock: createClock(2_000) })

    await controller.dispatch({
      type: 'play',
      id: 'play-1',
      createdAtMs: 2_000,
      source: 'local',
    })
    const result = await controller.dispatch({
      type: 'pet',
      id: 'pet-1',
      createdAtMs: 2_001,
      source: 'local',
    })

    expect(result.state.pet.needs.happiness).toBe(100)
    expect(result.state.queue.items).toEqual([
      expect.objectContaining({ id: 'play-1', status: 'waiting-energy' }),
    ])
    expect(result.notifications).toContainEqual({ key: 'energy-insufficient' })
  })

  it('inicia un minijuego, aplica corazones y libera la cola al terminar', async () => {
    const persistence = createPersistence()
    const controller = await GameController.create({ persistence, clock: createClock(3_000) })

    await controller.dispatch({ type: 'play', id: 'play-1', createdAtMs: 3_000, source: 'local' })
    expect(controller.getActiveMinigame()).toEqual({ startedAtMs: 3_000, capturedHearts: 0 })

    controller.captureHeart()
    const result = await controller.finishMinigame(8_000)

    expect(result.state.pet.needs).toMatchObject({ hunger: 70, happiness: 100, energy: 60 })
    expect(result.state.queue.items).toEqual([])
    expect(controller.getActiveMinigame()).toBeNull()
  })

  it('informa que la cola está desactivada sin guardar una acción', async () => {
    const persistence = createPersistence()
    const controller = await GameController.create({ persistence, clock: createClock(4_000) })
    await controller.dispatch({ type: 'setQueueLimit', limit: 0 })

    const result = await controller.dispatch({
      type: 'clean',
      id: 'clean-1',
      createdAtMs: 4_000,
      source: 'local',
    })

    expect(result.message).toEqual({ key: 'queue-disabled' })
    expect(result.state.queue.items).toEqual([])
    expect(persistence.savedSnapshots).toHaveLength(1)
  })

  it('informa el descarte de la cola y conserva la acción pendiente posterior', async () => {
    const persistence = createPersistence()
    const controller = await GameController.create({ persistence, clock: createClock(4_000) })

    await controller.dispatch({ type: 'play', id: 'play-1', createdAtMs: 4_000, source: 'local' })
    await controller.dispatch({ type: 'feed', id: 'feed-1', createdAtMs: 4_001, source: 'local' })
    await controller.dispatch({ type: 'clean', id: 'clean-1', createdAtMs: 4_002, source: 'local' })
    const result = await controller.dispatch({ type: 'setQueueLimit', limit: 1 })

    expect(result.notifications).toEqual([{ key: 'action-dropped', parameters: { actionType: 'feed' } }])
    expect(result.state.queue.items).toEqual([
      expect.objectContaining({ id: 'play-1', status: 'executing' }),
      expect.objectContaining({ id: 'clean-1', status: 'pending' }),
    ])
  })

  it('avisa si el guardado falla sin perder el efecto ni el progreso de la acción', async () => {
    const controller = await GameController.create({
      persistence: createFailingPersistence(),
      clock: createClock(4_000),
    })

    const result = await controller.dispatch({
      type: 'clean',
      id: 'clean-1',
      createdAtMs: 4_000,
      source: 'local',
    })

    expect(result.state.pet.needs).toMatchObject({ happiness: 91, cleanliness: 100 })
    expect(result.effects).toEqual([{ type: 'clean', actionId: 'clean-1' }])
    expect(result.message).toEqual({ key: 'action-completed', parameters: { actionType: 'clean' } })
    expect(result.notifications).toEqual([{ key: 'progress-save-failed' }])
  })

  it('aplica el tiempo en primer plano antes de procesar una acción nueva', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 1_000,
      pet: {
        needs: { hunger: 50, happiness: 86, cleanliness: 82, energy: 75 },
        isSleeping: false,
        needsCleaning: false,
        hungrySinceMs: null,
      },
      queue: { limit: 20, isVisible: true, items: [] },
    })
    const clock = createClock(1_000)
    const controller = await GameController.create({ persistence, clock })

    clock.setTime(2_000)
    clock.foreground()
    const result = await controller.dispatch({ type: 'feed', id: 'feed-1', createdAtMs: 2_000, source: 'local' })

    expect(result.state.pet.needs).toEqual({
      hunger: 79.75,
      happiness: 85.85,
      cleanliness: 76.88,
      energy: 74.92,
    })
  })

  it('resuelve el minijuego al volver a primer plano antes de aceptar acciones', async () => {
    const persistence = createPersistence()
    const clock = createClock(1_000)
    const controller = await GameController.create({ persistence, clock })

    await controller.dispatch({ type: 'play', id: 'play-1', createdAtMs: 1_000, source: 'local' })
    controller.captureHeart()
    clock.setTime(6_000)
    clock.foreground()
    const result = await controller.dispatch({ type: 'feed', id: 'feed-1', createdAtMs: 6_000, source: 'local' })

    expect(controller.getActiveMinigame()).toBeNull()
    expect(result.state.queue.items).toEqual([])
    expect(result.state.pet.needs).toMatchObject({ hunger: 100, happiness: 100, energy: 60 })
  })

  it('solicita confirmación y permite cancelar un reinicio sin modificar el progreso', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 1_000,
      pet: {
        needs: { hunger: 12, happiness: 24, cleanliness: 36, energy: 48 },
        isSleeping: true,
        needsCleaning: true,
        hungrySinceMs: 900,
      },
      queue: {
        limit: 3,
        isVisible: false,
        items: [{ id: 'feed-1', type: 'feed', createdAtMs: 1_000, status: 'pending' }],
      },
    })
    const controller = await GameController.create({ persistence, clock: createClock(1_000) })
    const stateBeforeReset = controller.getState()
    const savedSnapshotCount = persistence.savedSnapshots.length

    const requested = await controller.dispatch({ type: 'reset' })
    const cancelled = await controller.dispatch({ type: 'cancelReset' })

    expect(requested.message).toEqual({ key: 'reset-confirmation-requested' })
    expect(cancelled.message).toBeNull()
    expect(cancelled.state).toEqual(stateBeforeReset)
    expect(persistence.savedSnapshots).toHaveLength(savedSnapshotCount)
  })

  it('reinicia el progreso confirmado, elimina la cola y restaura sus preferencias', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 1_000,
      pet: {
        needs: { hunger: 12, happiness: 24, cleanliness: 36, energy: 48 },
        isSleeping: true,
        needsCleaning: true,
        hungrySinceMs: 900,
      },
      queue: {
        limit: 3,
        isVisible: false,
        items: [{ id: 'feed-1', type: 'feed', createdAtMs: 1_000, status: 'pending' }],
      },
    })
    const controller = await GameController.create({ persistence, clock: createClock(1_000) })
    const savedSnapshotCount = persistence.savedSnapshots.length

    await controller.dispatch({ type: 'reset' })
    const result = await controller.dispatch({ type: 'confirmReset', keepPendingActions: false })

    expect(result.state).toEqual({
      pet: {
        needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 75 },
        isSleeping: false,
        needsCleaning: false,
        hungrySinceMs: null,
      },
      queue: { limit: 20, isVisible: true, items: [] },
    })
    expect(persistence.savedSnapshots).toHaveLength(savedSnapshotCount + 1)
  })

  it('reinicia el progreso confirmado y conserva las acciones pendientes elegidas', async () => {
    const persistence = createPersistence({
      formatVersion: 1,
      savedAtMs: 1_000,
      pet: {
        needs: { hunger: 12, happiness: 24, cleanliness: 36, energy: 11 },
        isSleeping: true,
        needsCleaning: true,
        hungrySinceMs: 900,
      },
      queue: {
        limit: 3,
        isVisible: false,
        items: [{ id: 'play-1', type: 'play', createdAtMs: 1_000, status: 'waiting-energy' }],
      },
    })
    const controller = await GameController.create({ persistence, clock: createClock(1_000) })
    const savedSnapshotCount = persistence.savedSnapshots.length

    await controller.dispatch({ type: 'reset' })
    const result = await controller.dispatch({ type: 'confirmReset', keepPendingActions: true })

    expect(result.state.pet).toEqual({
      needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 75 },
      isSleeping: false,
      needsCleaning: false,
      hungrySinceMs: null,
    })
    expect(result.state.queue).toEqual({
      limit: 20,
      isVisible: true,
      items: [{ id: 'play-1', type: 'play', createdAtMs: 1_000, source: 'local', status: 'waiting-energy' }],
    })
    expect(persistence.savedSnapshots).toHaveLength(savedSnapshotCount + 1)
  })
})
