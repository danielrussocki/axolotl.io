import { describe, expect, it } from 'vitest'

import { BrowserSessionLock } from './browserSessionLock'

class MemoryStorage {
  private readonly values = new Map<string, string>()

  getItem(key: string): string | null {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value)
  }

  removeItem(key: string): void {
    this.values.delete(key)
  }
}

describe('bloqueo de sesión del navegador', () => {
  it('permite reclamar la sesión a la primera pestaña', () => {
    const session = new BrowserSessionLock(new MemoryStorage(), 'main-tab')

    expect(session.claim()).toBe(true)
    expect(session.isClaimed()).toBe(true)
  })

  it('bloquea a una segunda pestaña mientras la sesión principal está activa', () => {
    const storage = new MemoryStorage()
    const mainSession = new BrowserSessionLock(storage, 'main-tab')
    const secondarySession = new BrowserSessionLock(storage, 'secondary-tab')

    mainSession.claim()

    expect(secondarySession.claim()).toBe(false)
    expect(secondarySession.isClaimed()).toBe(true)
  })

  it('solo permite liberar el bloqueo a la pestaña propietaria', () => {
    const storage = new MemoryStorage()
    const mainSession = new BrowserSessionLock(storage, 'main-tab')
    const secondarySession = new BrowserSessionLock(storage, 'secondary-tab')
    mainSession.claim()

    secondarySession.release()

    expect(secondarySession.claim()).toBe(false)

    mainSession.release()

    expect(secondarySession.isClaimed()).toBe(false)
  })

  it('mantiene bloqueada una pestaña secundaria hasta recargarla', () => {
    const storage = new MemoryStorage()
    const mainSession = new BrowserSessionLock(storage, 'main-tab')
    const blockedSession = new BrowserSessionLock(storage, 'secondary-tab')

    expect(mainSession.claim()).toBe(true)
    expect(blockedSession.claim()).toBe(false)

    mainSession.release()
    expect(blockedSession.isClaimed()).toBe(false)

    expect(blockedSession.claim()).toBe(false)

    const reloadedSession = new BrowserSessionLock(storage, 'secondary-tab')
    expect(reloadedSession.claim()).toBe(true)
  })
})
