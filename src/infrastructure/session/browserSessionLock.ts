import type { SessionLockPort } from '../../application/contracts'

const sessionLockKey = 'axolotl.io.active-session'

/** Superficie mínima de almacenamiento necesaria para coordinar pestañas. */
export interface SessionStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/**
 * Coordina una única sesión activa por origen mediante el almacenamiento del
 * navegador. La identidad por pestaña impide que una pestaña bloqueada libere
 * por error el bloqueo de la sesión propietaria.
 */
export class BrowserSessionLock implements SessionLockPort {
  private readonly storage: SessionStorage
  private readonly sessionId: string
  private readonly key: string
  private wasBlocked = false

  constructor(
    storage: SessionStorage,
    sessionId: string,
    key = sessionLockKey,
  ) {
    this.storage = storage
    this.sessionId = sessionId
    this.key = key
  }

  claim(): boolean {
    if (this.wasBlocked) {
      return false
    }

    if (this.isClaimed()) {
      const isOwnedByCurrentSession = this.isOwnedByCurrentSession()
      if (!isOwnedByCurrentSession) {
        this.wasBlocked = true
      }

      return isOwnedByCurrentSession
    }

    this.storage.setItem(this.key, this.sessionId)
    return this.isOwnedByCurrentSession()
  }

  release(): void {
    if (this.isOwnedByCurrentSession()) {
      this.storage.removeItem(this.key)
    }
  }

  isClaimed(): boolean {
    return this.storage.getItem(this.key) !== null
  }

  private isOwnedByCurrentSession(): boolean {
    return this.storage.getItem(this.key) === this.sessionId
  }
}
