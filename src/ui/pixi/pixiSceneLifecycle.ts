export type SceneHost = {
  appendChild: (view: unknown) => void
  removeChild: (view: unknown) => void
}

export type PixiApplicationLike = {
  canvas: unknown | null
  initialize: () => Promise<void>
  destroy: () => void
}

export type PixiSceneLifecycle = {
  start: () => Promise<boolean>
  destroy: () => void
  getState: () => PixiSceneLifecycleState
}

export type PixiSceneLifecycleState = 'idle' | 'loading' | 'ready' | 'error'

class ManagedPixiSceneLifecycle implements PixiSceneLifecycle {
  private readonly host: SceneHost
  private readonly createApplication: () => PixiApplicationLike
  private application: PixiApplicationLike | undefined
  private canvas: unknown | undefined
  private isAttached = false
  private isDestroyed = false
  private isInitializing = false
  private isApplicationDestroyed = false
  private state: PixiSceneLifecycleState = 'idle'

  constructor(
    host: SceneHost,
    createApplication: () => PixiApplicationLike,
  ) {
    this.host = host
    this.createApplication = createApplication
  }

  async start(): Promise<boolean> {
    if (this.isDestroyed || this.application) {
      return false
    }

    this.state = 'loading'
    const application = this.createApplication()
    this.application = application
    this.isInitializing = true

    try {
      await application.initialize()
    } catch (error) {
      this.isInitializing = false
      this.state = 'error'
      this.destroyApplication()
      throw error
    }
    this.isInitializing = false

    if (this.isDestroyed) {
      this.destroyApplication()
      return false
    }

    const canvas = application.canvas
    if (canvas === null) {
      this.state = 'error'
      this.destroyApplication()
      return false
    }

    this.canvas = canvas
    this.host.appendChild(canvas)
    this.isAttached = true
    this.state = 'ready'
    return true
  }

  getState(): PixiSceneLifecycleState {
    return this.state
  }

  destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true

    if (this.isAttached && this.canvas !== undefined) {
      this.host.removeChild(this.canvas)
      this.isAttached = false
    }

    if (!this.isInitializing) {
      this.destroyApplication()
    }
  }

  private destroyApplication(): void {
    if (this.isApplicationDestroyed) {
      return
    }

    this.isApplicationDestroyed = true
    this.application?.destroy()
  }
}

export function createPixiSceneLifecycle(
  host: SceneHost,
  createApplication: () => PixiApplicationLike,
): PixiSceneLifecycle {
  return new ManagedPixiSceneLifecycle(host, createApplication)
}
