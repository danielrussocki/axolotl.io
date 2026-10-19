import { describe, expect, it, vi } from 'vitest'

import { createPixiApplicationLifecycle } from './pixiApplicationLifecycle'

describe('createPixiApplicationLifecycle', () => {
  it('espera a que la inicialización termine antes de destruir Pixi tras un desmontaje temprano', async () => {
    let completeInitialization: (() => void) | undefined
    const initialize = vi.fn(() => new Promise<void>((resolve) => {
      completeInitialization = resolve
    }))
    const destroy = vi.fn()
    const lifecycle = createPixiApplicationLifecycle({ initialize, destroy })

    const initialization = lifecycle.initialize()
    lifecycle.destroy()

    expect(destroy).not.toHaveBeenCalled()

    completeInitialization?.()
    await initialization

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('prepara la escena antes de permitir que una limpieza pendiente destruya Pixi', async () => {
    let completeInitialization: (() => void) | undefined
    const initialize = vi.fn(() => new Promise<void>((resolve) => {
      completeInitialization = resolve
    }))
    const prepareScene = vi.fn()
    const destroy = vi.fn()
    const lifecycle = createPixiApplicationLifecycle({ initialize, prepareScene, destroy })

    const initialization = lifecycle.initialize()
    lifecycle.destroy()
    completeInitialization?.()

    await initialization

    expect(prepareScene).toHaveBeenCalledOnce()
    expect(destroy).toHaveBeenCalledOnce()
    expect(prepareScene).toHaveBeenCalledBefore(destroy)
  })

  it('no destruye una aplicación Pixi más de una vez', async () => {
    const destroy = vi.fn()
    const lifecycle = createPixiApplicationLifecycle({
      initialize: async () => {},
      destroy,
    })

    await lifecycle.initialize()
    lifecycle.destroy()
    lifecycle.destroy()

    expect(destroy).toHaveBeenCalledOnce()
  })

  it('destruye Pixi si la inicialización falla', async () => {
    const initializationError = new Error('No se pudo crear el renderer de Pixi')
    const destroy = vi.fn()
    const lifecycle = createPixiApplicationLifecycle({
      initialize: vi.fn<() => Promise<void>>().mockRejectedValue(initializationError),
      destroy,
    })

    await expect(lifecycle.initialize()).rejects.toBe(initializationError)

    expect(destroy).toHaveBeenCalledOnce()
  })
})
