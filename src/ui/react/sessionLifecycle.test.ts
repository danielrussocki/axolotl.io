import { describe, expect, it } from 'vitest'

import type { SessionLockPort } from '../../application/contracts'
import { releaseSessionLockOnPageHide } from './sessionLifecycle'

class PageLifecycleTarget {
  private readonly listeners = new Set<() => void>()

  addEventListener(_type: 'pagehide', listener: () => void): void {
    this.listeners.add(listener)
  }

  removeEventListener(_type: 'pagehide', listener: () => void): void {
    this.listeners.delete(listener)
  }

  dispatchPageHide(): void {
    this.listeners.forEach((listener) => listener())
  }
}

const createSessionLock = (): SessionLockPort & { releaseCalls: number } => ({
  releaseCalls: 0,
  claim: () => true,
  isClaimed: () => true,
  release() {
    this.releaseCalls += 1
  },
})

describe('releaseSessionLockOnPageHide', () => {
  it('libera el bloqueo al recargar o cerrar la página', () => {
    const sessionLock = createSessionLock()
    const target = new PageLifecycleTarget()
    const stop = releaseSessionLockOnPageHide(sessionLock, target)

    target.dispatchPageHide()

    expect(sessionLock.releaseCalls).toBe(1)

    stop()
  })

  it('retira el listener durante la limpieza de React', () => {
    const sessionLock = createSessionLock()
    const target = new PageLifecycleTarget()
    const stop = releaseSessionLockOnPageHide(sessionLock, target)

    stop()
    target.dispatchPageHide()

    expect(sessionLock.releaseCalls).toBe(0)
  })
})
