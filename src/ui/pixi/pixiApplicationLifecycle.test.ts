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
})
