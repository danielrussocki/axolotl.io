export interface PixiApplicationLifecycleOptions {
  initialize: () => Promise<void>
  prepareScene?: () => void
  destroy: () => void
}

export interface PixiApplicationLifecycle {
  initialize: () => Promise<boolean>
  destroy: () => void
}

/**
 * Retrasa la destrucción de Pixi hasta que `Application.init()` haya creado
 * ticker, renderer y canvas. React puede desmontar una escena antes de que la
 * inicialización asíncrona termine.
 */
export const createPixiApplicationLifecycle = ({
  initialize,
  prepareScene,
  destroy,
}: PixiApplicationLifecycleOptions): PixiApplicationLifecycle => {
  let isInitialized = false
  let isDestroyRequested = false
  let isDestroyed = false

  const destroyOnce = () => {
    if (isDestroyed) {
      return
    }

    isDestroyed = true
    destroy()
  }

  const destroyWhenReady = () => {
    if (!isInitialized) {
      return
    }

    destroyOnce()
  }

  return {
    initialize: async () => {
      try {
        await initialize()
        prepareScene?.()
      } catch (error) {
        destroyOnce()
        throw error
      }
      isInitialized = true
      destroyWhenReady()
      return !isDestroyRequested
    },
    destroy: () => {
      isDestroyRequested = true
      destroyWhenReady()
    },
  }
}
