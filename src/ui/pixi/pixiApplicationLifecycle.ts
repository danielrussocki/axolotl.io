export interface PixiApplicationLifecycleOptions {
  initialize: () => Promise<void>
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
  destroy,
}: PixiApplicationLifecycleOptions): PixiApplicationLifecycle => {
  let isInitialized = false
  let isDestroyRequested = false
  let isDestroyed = false

  const destroyWhenReady = () => {
    if (!isInitialized || isDestroyed) {
      return
    }

    isDestroyed = true
    destroy()
  }

  return {
    initialize: async () => {
      await initialize()
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
