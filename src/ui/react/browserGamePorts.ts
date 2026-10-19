import type { ClockPort, PersistencePort } from '../../application/contracts'
import { BrowserSessionLock } from '../../infrastructure/session/browserSessionLock'

const storageKey = 'axolotl.io.game-state'

/** Adaptadores de navegador usados únicamente al crear la sesión de interfaz. */
export const createBrowserPersistence = (): PersistencePort => ({
  load: async () => window.localStorage.getItem(storageKey),
  save: async (snapshot) => {
    window.localStorage.setItem(storageKey, JSON.stringify(snapshot))
  },
  clear: async () => {
    window.localStorage.removeItem(storageKey)
  },
})

export const createBrowserClock = (): ClockPort => ({
  now: () => Date.now(),
  onForeground: (listener) => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        listener()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  },
})

/** Crea un bloqueo con identidad nueva para cada carga de pestaña. */
export const createBrowserSessionLock = (): BrowserSessionLock =>
  new BrowserSessionLock(window.localStorage, crypto.randomUUID())
