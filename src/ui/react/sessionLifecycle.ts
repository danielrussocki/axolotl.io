import type { SessionLockPort } from '../../application/contracts'

export interface PageLifecycleTarget {
  addEventListener(type: 'pagehide', listener: () => void): void
  removeEventListener(type: 'pagehide', listener: () => void): void
}

/** Libera el bloqueo antes de que el navegador descarte la pestaña al recargarla o cerrarla. */
export const releaseSessionLockOnPageHide = (
  sessionLock: SessionLockPort,
  target: PageLifecycleTarget = window,
): (() => void) => {
  const release = () => sessionLock.release()
  target.addEventListener('pagehide', release)

  return () => target.removeEventListener('pagehide', release)
}
