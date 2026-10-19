import { describe, expect, it, vi } from 'vitest'

import type { ActionCommand, AudioPort, ClockPort, PersistencePort } from '../application/contracts'
import { GameController } from '../application/gameController'
import { createMinigameVisualState, moveMochiForMinigame } from './pixi/minigameInteraction'
import { bindPetInteraction, type PetPointerTarget } from './pixi/petInteraction'
import { createActionCommand } from './react/actionControls'
import { createGameUiStore } from './react/gameUiStore'
import { getNeedIndicator } from './react/needIndicators'

const createPersistence = (snapshot: unknown = null): PersistencePort => ({
  load: async () => snapshot,
  save: async () => {},
  clear: async () => {},
})

const createClock = (initialTimeMs: number): ClockPort & { setTime(timeMs: number): void } => {
  let timeMs = initialTimeMs

  return {
    now: () => timeMs,
    setTime: (nextTimeMs) => {
      timeMs = nextTimeMs
    },
    onForeground: () => () => {},
  }
}

const createPointerTarget = (): PetPointerTarget & { tap(): void } => {
  let listener: (() => void) | undefined

  return {
    on: vi.fn((_eventName: 'pointertap', callback: () => void) => {
      listener = callback
    }),
    off: vi.fn(),
    tap: () => listener?.(),
  }
}

const createStore = async (options: {
  snapshot?: unknown
  audio?: AudioPort
  now?: number
} = {}) => {
  const clock = createClock(options.now ?? 1_000)
  const controller = await GameController.create({
    persistence: createPersistence(options.snapshot),
    clock,
    audio: options.audio,
  })

  return { clock, store: createGameUiStore(controller) }
}

describe('integración de interfaz', () => {
  it.each(['puntero', 'táctil'] as const)('envía una sola caricia desde %s al controlador', async () => {
    const { store } = await createStore()
    const target = createPointerTarget()
    let dispatchPromise: Promise<unknown> | null = null
    const dispatch = vi.fn((command: ActionCommand) => {
      dispatchPromise = store.dispatch(command)
      return dispatchPromise
    })
    const release = bindPetInteraction(target, {
      dispatch,
      isMinigameActive: () => store.getActiveMinigame() !== null,
      now: () => 1_000,
      createActionId: () => 'pet-from-scene',
    })

    target.tap()
    expect(dispatch).toHaveBeenCalledOnce()
    if (dispatchPromise === null) {
      throw new Error('La interacción no emitió el comando de caricia.')
    }
    await dispatchPromise

    expect(store.getSnapshot().state.pet.needs.happiness).toBe(100)
    expect(store.getSnapshot().message).toBe('A Mochi le encantan las caricias.')

    release()
    store.dispose()
  })

  it.each([
    ['puntero', { x: 600, y: 20 }],
    ['táctil', { x: 120, y: 110 }],
  ] as const)('mueve a Mochi y completa el minijuego con %s', async (_inputType, input) => {
    const { clock, store } = await createStore({ now: 3_000 })

    await store.dispatch(createActionCommand('play', 'play-1', 3_000))
    const movedScene = moveMochiForMinigame(createMinigameVisualState(), input)
    store.captureHeart()
    clock.setTime(8_000)
    await store.finishMinigame()

    expect(movedScene.mochiPosition).not.toEqual({ x: 240, y: 174 })
    expect(store.getActiveMinigame()).toBeNull()
    expect(store.getSnapshot().state.pet.needs).toMatchObject({ hunger: 70, happiness: 100, energy: 60 })
    expect(store.getSnapshot().message).toBe('Mochi está listo para jugar.')

    store.dispose()
  })

  it('actualiza indicadores, cola, música y reinicio desde el modelo reactivo', async () => {
    const audio: AudioPort & { startMusic: ReturnType<typeof vi.fn>; stopMusic: ReturnType<typeof vi.fn> } = {
      startMusic: vi.fn(async () => {}),
      stopMusic: vi.fn(async () => {}),
      playEffect: async () => {},
    }
    const { store } = await createStore({
      audio,
      snapshot: {
        formatVersion: 1,
        savedAtMs: 1_000,
        pet: {
          needs: { hunger: 20, happiness: 86, cleanliness: 82, energy: 75 },
          isSleeping: false,
          needsCleaning: false,
          hungrySinceMs: null,
        },
        queue: { limit: 20, isVisible: true, items: [] },
      },
    })

    expect(getNeedIndicator('hunger', store.getSnapshot().state.pet.needs.hunger).isLow).toBe(true)

    await store.dispatch({ type: 'setQueueVisibility', isVisible: false })
    await store.dispatch({ type: 'setQueueLimit', limit: 12 })
    await store.dispatch({ type: 'setMusicEnabled', isEnabled: false })
    await store.dispatch({ type: 'reset' })
    await store.dispatch({ type: 'confirmReset', keepPendingActions: false })

    expect(store.getSnapshot().state.queue).toMatchObject({ isVisible: true, limit: 20, items: [] })
    expect(store.getSnapshot().state.pet.needs).toEqual({ hunger: 78, happiness: 86, cleanliness: 82, energy: 75 })
    expect(store.getSnapshot().message).toBe('¿Quieres conservar las acciones pendientes al reiniciar?')
    expect(audio.startMusic).toHaveBeenCalledOnce()
    expect(audio.stopMusic).toHaveBeenCalledOnce()

    store.dispose()
  })
})
