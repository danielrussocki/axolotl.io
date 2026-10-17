import type { ActionQueue, ActionSource, ActionType, GameState, PetState } from '../domain/contracts'

export type ActionCommand = {
  type: ActionType
  id: string
  createdAtMs: number
  source: ActionSource
}

export type GameCommand =
  | ActionCommand
  | { type: 'reset'; keepPendingActions: boolean }
  | { type: 'setQueueLimit'; limit: number }
  | { type: 'setQueueVisibility'; isVisible: boolean }
  | { type: 'setMusicEnabled'; isEnabled: boolean }

/** Claves de mensajes; su traducción al español pertenece a domain/messages. */
export type MessageKey =
  | 'action-completed'
  | 'action-dropped'
  | 'audio-unavailable'
  | 'energy-insufficient'
  | 'pet-awake'
  | 'pet-sleeping'
  | 'progress-invalid'
  | 'progress-save-failed'
  | 'queue-disabled'
  | 'reset-confirmation-requested'
  | 'session-blocked'

export interface Message {
  key: MessageKey
  parameters?: Record<string, string | number>
}

export interface GameEffect {
  type: string
  actionId?: string
}

export interface GameResult {
  state: GameState
  message: Message | null
  notifications: Message[]
  effects: GameEffect[]
}

/** Adaptador de progreso: los errores se gestionan en el controlador. */
export interface PersistencePort {
  load(): Promise<unknown | null>
  save(snapshot: unknown): Promise<void>
  clear(): Promise<void>
}

export interface ClockPort {
  now(): number
  onForeground(listener: () => void): () => void
}

export interface SessionLockPort {
  claim(): boolean
  release(): void
  isClaimed(): boolean
}

export interface AudioPort {
  startMusic(): Promise<void>
  stopMusic(): Promise<void>
  playEffect(effect: string): Promise<void>
}

export interface PointerInput {
  x: number
  y: number
}

/** El render recibe una instantánea y solo comunica entradas al controlador. */
export interface RenderPort {
  render(state: GameState): void
  onPointerInput(listener: (event: PointerInput) => void): () => void
}

export type { ActionQueue, GameState, PetState }
