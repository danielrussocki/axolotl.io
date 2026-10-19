import { describe, expect, it, vi } from 'vitest'

import { getPixiSceneStatusMessage } from './pixiScenePresentation'
import {
  createPixiSceneLifecycle,
  type PixiApplicationLike,
  type SceneHost,
} from './pixiSceneLifecycle'

function createHost(): SceneHost & { appendedViews: unknown[]; removedViews: unknown[] } {
  const appendedViews: unknown[] = []
  const removedViews: unknown[] = []

  return {
    appendedViews,
    removedViews,
    appendChild: (view) => appendedViews.push(view),
    removeChild: (view) => removedViews.push(view),
  }
}

function createApplication(canvas: unknown | null): PixiApplicationLike & {
  initialize: ReturnType<typeof vi.fn<() => Promise<void>>>
  destroy: ReturnType<typeof vi.fn<() => void>>
} {
  return {
    canvas,
    initialize: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    destroy: vi.fn<() => void>(),
  }
}

describe('estados del ciclo de vida de la escena Pixi', () => {
  it('pasa de inactiva a cargando y lista al adjuntar el canvas', async () => {
    const host = createHost()
    let finishInitialization: (() => void) | undefined
    const application = createApplication({})
    application.initialize.mockImplementation(() => new Promise<void>((resolve) => {
      finishInitialization = resolve
    }))
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    expect(lifecycle.getState()).toBe('idle')
    const started = lifecycle.start()
    expect(lifecycle.getState()).toBe('loading')

    finishInitialization?.()

    await expect(started).resolves.toBe(true)
    expect(lifecycle.getState()).toBe('ready')
    expect(host.appendedViews).toEqual([application.canvas])
  })

  it('muestra el fallback y deja la escena en error si falla la inicialización', async () => {
    const host = createHost()
    const initializationError = new Error('Renderer no disponible')
    const application = createApplication({})
    application.initialize.mockRejectedValue(initializationError)
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    await expect(lifecycle.start()).rejects.toBe(initializationError)

    expect(lifecycle.getState()).toBe('error')
    expect(host.appendedViews).toEqual([])
    expect(application.destroy).toHaveBeenCalledOnce()
    expect(getPixiSceneStatusMessage('error')).toBe(
      'No se pudo iniciar la escena jugable. Puedes seguir usando los controles de Mochi.',
    )
  })

  it('retira el canvas y destruye la aplicación una sola vez al desmontar', async () => {
    const host = createHost()
    const application = createApplication({})
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    await lifecycle.start()
    lifecycle.destroy()
    lifecycle.destroy()

    expect(host.removedViews).toEqual([application.canvas])
    expect(application.destroy).toHaveBeenCalledOnce()
  })
})
