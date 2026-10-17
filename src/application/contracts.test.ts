import { describe, expect, expectTypeOf, it } from 'vitest'

import type {
  AudioPort,
  ClockPort,
  GameCommand,
  GameResult,
  Message,
  PersistencePort,
  RenderPort,
  SessionLockPort,
} from './contracts'
import type { ActionQueue, PetState, QueuedAction } from '../domain/contracts'

describe('contratos de aplicación', () => {
  it('expone el estado de mascota y las acciones en cola sin tipos de interfaz', () => {
    expectTypeOf<PetState>().toMatchTypeOf<{
      needs: { hunger: number; happiness: number; cleanliness: number; energy: number }
      isSleeping: boolean
      needsCleaning: boolean
      hungrySinceMs: number | null
    }>()
    expectTypeOf<QueuedAction>().toMatchTypeOf<{
      id: string
      type: 'feed' | 'clean' | 'pet' | 'play' | 'sleep'
      createdAtMs: number
      source: 'local' | 'live'
      status: 'pending' | 'executing' | 'waiting-energy'
    }>()
    expectTypeOf<ActionQueue>().toMatchTypeOf<{
      limit: number
      isVisible: boolean
      items: QueuedAction[]
    }>()
  })

  it('define todos los comandos y su resultado', () => {
    const commands = [
      { type: 'feed', id: '1', createdAtMs: 1, source: 'local' },
      { type: 'clean', id: '2', createdAtMs: 2, source: 'local' },
      { type: 'pet', id: '3', createdAtMs: 3, source: 'local' },
      { type: 'play', id: '4', createdAtMs: 4, source: 'local' },
      { type: 'sleep', id: '5', createdAtMs: 5, source: 'local' },
      { type: 'reset' },
      { type: 'confirmReset', keepPendingActions: true },
      { type: 'cancelReset' },
      { type: 'setQueueLimit', limit: 20 },
      { type: 'setQueueVisibility', isVisible: true },
      { type: 'setMusicEnabled', isEnabled: true },
    ] satisfies GameCommand[]

    expectTypeOf(commands).toMatchTypeOf<GameCommand[]>()
    expectTypeOf<GameResult>().toMatchTypeOf<{
      state: { pet: PetState; queue: ActionQueue }
      message: Message | null
      notifications: Message[]
    }>()
  })

  it('define puertos para infraestructura sin acoplarlos al navegador', () => {
    expectTypeOf<PersistencePort>().toMatchTypeOf<{
      load: () => Promise<unknown | null>
      save: (snapshot: unknown) => Promise<void>
      clear: () => Promise<void>
    }>()
    expectTypeOf<ClockPort>().toMatchTypeOf<{
      now: () => number
      onForeground: (listener: () => void) => () => void
    }>()
    expectTypeOf<SessionLockPort>().toMatchTypeOf<{
      claim: () => boolean
      release: () => void
      isClaimed: () => boolean
    }>()
    expectTypeOf<AudioPort>().toMatchTypeOf<{
      startMusic: () => Promise<void>
      stopMusic: () => Promise<void>
      playEffect: (effect: string) => Promise<void>
    }>()
    expectTypeOf<RenderPort>().toMatchTypeOf<{
      render: (state: { pet: PetState; queue: ActionQueue }) => void
      onPointerInput: (listener: (event: { x: number; y: number }) => void) => () => void
    }>()
    expect(true).toBe(true)
  })
})
