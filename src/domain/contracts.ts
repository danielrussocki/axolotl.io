/** Estado de las cuatro necesidades que regulan las reglas de Mochi. */
export interface PetNeeds {
  hunger: number
  happiness: number
  cleanliness: number
  energy: number
}

/** Estado persistible de la mascota, independiente de cualquier adaptador. */
export interface PetState {
  needs: PetNeeds
  isSleeping: boolean
  needsCleaning: boolean
  hungrySinceMs: number | null
}

/** Apariencia calculada de Mochi, ordenada por las reglas de prioridad. */
export type PetVisualState = 'sleeping' | 'sick' | 'sad' | 'dirty' | 'eating' | 'normal'

export type ActionType = 'feed' | 'clean' | 'pet' | 'play' | 'sleep'

/** Origen validado de una solicitud de acción. */
export type ActionSource = 'local' | 'live'

export type QueuedActionStatus = 'pending' | 'executing' | 'waiting-energy'

export interface QueuedAction {
  id: string
  type: ActionType
  createdAtMs: number
  source: ActionSource
  status: QueuedActionStatus
}

export interface ActionQueue {
  limit: number
  isVisible: boolean
  items: QueuedAction[]
}

/** Estado efímero de un minijuego activo; no forma parte del progreso persistido. */
export interface MinigameState {
  startedAtMs: number
  capturedHearts: number
}

/** Resultado del minijuego disponible al finalizar su duración. */
export interface MinigameResult {
  capturedHearts: number
}

/** Instantánea mínima que comparten el dominio y los adaptadores. */
export interface GameState {
  pet: PetState
  queue: ActionQueue
}
