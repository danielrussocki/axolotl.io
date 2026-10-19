import { describe, expect, it } from 'vitest'

import { GameController } from '../../application/gameController'
import type { ClockPort, PersistencePort } from '../../application/contracts'
import { createGameUiStore } from './gameUiStore'

const createPersistence = (): PersistencePort => ({
  load: async () => null,
  save: async () => {},
  clear: async () => {},
})

const createClock = (currentTimeMs: number): ClockPort => ({
  now: () => currentTimeMs,
  onForeground: () => () => {},
})

describe('createGameUiStore', () => {
  it('expone la instantánea inicial del controlador', async () => {
    const controller = await GameController.create({
      persistence: createPersistence(),
      clock: createClock(1_000),
    })
    const store = createGameUiStore(controller)

    expect(store.getSnapshot()).toMatchObject({
      state: {
        pet: { needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 75 } },
        queue: { limit: 20, isVisible: true, items: [] },
      },
      message: '¡Cuida a Mochi! Necesita comer, jugar y baños.',
    })

    store.dispose()
  })

  it('actualiza estado y mensaje en español al recibir un resultado del controlador', async () => {
    const controller = await GameController.create({
      persistence: createPersistence(),
      clock: createClock(1_000),
    })
    const store = createGameUiStore(controller)
    const listener = { calls: 0 }
    const unsubscribe = store.subscribe(() => {
      listener.calls += 1
    })

    await store.dispatch({ type: 'feed', id: 'feed-1', createdAtMs: 1_000, source: 'local' })

    expect(store.getSnapshot()).toMatchObject({
      state: { pet: { needs: { hunger: 100, cleanliness: 77 } } },
      message: 'Mochi ha comido.',
    })
    expect(listener.calls).toBe(1)

    unsubscribe()
    store.dispose()
  })

  it('expone el aviso de guardado fallido en español sin interrumpir la sesión', async () => {
    const persistence: PersistencePort = {
      load: async () => null,
      save: async () => {
        throw new Error('storage unavailable')
      },
      clear: async () => {},
    }
    const controller = await GameController.create({
      persistence,
      clock: createClock(1_000),
    })
    const store = createGameUiStore(controller)

    await store.dispatch({ type: 'feed', id: 'feed-1', createdAtMs: 1_000, source: 'local' })

    expect(store.getSnapshot().notifications).toEqual([
      'No se pudo guardar el progreso. Puedes seguir jugando.',
    ])
    expect(store.getSnapshot().state.pet.needs.hunger).toBe(100)

    store.dispose()
  })

  it('expone el aviso de progreso inválido al restaurar una sesión segura', async () => {
    const persistence: PersistencePort = {
      load: async () => '{datos inválidos',
      save: async () => {},
      clear: async () => {},
    }
    const controller = await GameController.create({
      persistence,
      clock: createClock(1_000),
    })
    const store = createGameUiStore(controller)

    expect(store.getSnapshot().notifications).toEqual([
      'El progreso guardado no es válido. Mochi ha empezado de nuevo.',
    ])
    expect(store.getSnapshot().state.pet.needs).toEqual({ hunger: 78, happiness: 86, cleanliness: 82, energy: 75 })

    store.dispose()
  })
})
