export type SceneHost = {
  appendChild: (view: unknown) => void
  removeChild: (view: unknown) => void
}

export type PixiApplicationLike = {
  canvas: unknown
  initialize: () => Promise<void>
  destroy: () => void
}

export type PixiSceneLifecycle = {
  start: () => Promise<void>
  destroy: () => void
}

class ManagedPixiSceneLifecycle implements PixiSceneLifecycle {
  private readonly host: SceneHost
  private readonly createApplication: () => PixiApplicationLike
  private application: PixiApplicationLike | undefined
  private isAttached = false
  private isDestroyed = false

  constructor(
    host: SceneHost,
    createApplication: () => PixiApplicationLike,
  ) {
    this.host = host
    this.createApplication = createApplication
  }

  async start(): Promise<void> {
    if (this.isDestroyed || this.application) {
      return
    }

    const application = this.createApplication()
    this.application = application

    try {
      await application.initialize()
    } catch (error) {
      this.destroy()
      throw error
    }

    if (this.isDestroyed) {
      return
    }

    this.host.appendChild(application.canvas)
    this.isAttached = true
  }

  destroy(): void {
    if (this.isDestroyed) {
      return
    }

    this.isDestroyed = true

    if (this.isAttached && this.application) {
      this.host.removeChild(this.application.canvas)
      this.isAttached = false
    }

    this.application?.destroy()
  }
}

export function createPixiSceneLifecycle(
  host: SceneHost,
  createApplication: () => PixiApplicationLike,
): PixiSceneLifecycle {
  return new ManagedPixiSceneLifecycle(host, createApplication)
}
