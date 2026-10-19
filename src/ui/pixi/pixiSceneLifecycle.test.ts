import { describe, expect, it, vi } from 'vitest'

import {
  createPixiSceneLifecycle,
  type SceneHost,
} from './pixiSceneLifecycle'

function createHost(): SceneHost & { appendedViews: unknown[]; removedViews: unknown[] } {
  const appendedViews: unknown[] = []
  const removedViews: unknown[] = []

  return {
    appendedViews,
    removedViews,
    appendChild(view) {
      appendedViews.push(view)
    },
    removeChild(view) {
      removedViews.push(view)
    },
  }
}

function createApplication(view: unknown | null) {
  return {
    canvas: view,
    initialize: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
    destroy: vi.fn<() => void>(),
  }
}

describe('createPixiSceneLifecycle', () => {
  it('inicializa la escena y adjunta su canvas al contenedor', async () => {
    const host = createHost()
    const application = createApplication({})
    const createApplicationInstance = vi.fn(() => application)
    const lifecycle = createPixiSceneLifecycle(host, createApplicationInstance)

    await lifecycle.start()

    expect(createApplicationInstance).toHaveBeenCalledOnce()
    expect(application.initialize).toHaveBeenCalledOnce()
    expect(host.appendedViews).toEqual([application.canvas])
  })

  it('destruye la aplicación, elimina el canvas y permite limpiar dos veces', async () => {
    const host = createHost()
    const application = createApplication({})
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    await lifecycle.start()
    lifecycle.destroy()
    lifecycle.destroy()

    expect(application.destroy).toHaveBeenCalledOnce()
    expect(host.removedViews).toEqual([application.canvas])
  })

  it('destruye una inicialización que termina después de desmontar el contenedor', async () => {
    const host = createHost()
    let finishInitialization: (() => void) | undefined
    const application = createApplication({})
    application.initialize.mockImplementation(
      () => new Promise<void>((resolve) => {
        finishInitialization = resolve
      }),
    )
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    const startPromise = lifecycle.start()
    lifecycle.destroy()

    expect(application.destroy).not.toHaveBeenCalled()

    finishInitialization?.()
    await startPromise

    expect(host.appendedViews).toEqual([])
    expect(application.destroy).toHaveBeenCalledOnce()
  })

  it('no adjunta una escena que terminó sin canvas', async () => {
    const host = createHost()
    const application = createApplication(null)
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    const started = await lifecycle.start()

    expect(started).toBe(false)
    expect(host.appendedViews).toEqual([])
    expect(lifecycle.getState()).toBe('error')
  })

  it('reproduce un fallo de inicialización sin llegar al montaje ni al dibujo', async () => {
    const host = createHost()
    const initializationError = new Error('No se pudo crear el renderer de Pixi')
    const application = createApplication({})
    Object.defineProperty(application, 'canvas', {
      get: () => {
        throw new Error('El canvas ya no está disponible')
      },
    })
    application.initialize.mockRejectedValue(initializationError)
    const lifecycle = createPixiSceneLifecycle(host, () => application)

    await expect(lifecycle.start()).rejects.toBe(initializationError)
    lifecycle.destroy()

    expect(host.appendedViews).toEqual([])
    expect(application.destroy).toHaveBeenCalledOnce()
    expect(lifecycle.getState()).toBe('error')
  })
})
