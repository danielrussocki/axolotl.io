import type { ActionCommand } from '../../application/contracts'

export type PetPointerTarget = {
  on: (eventName: 'pointertap', listener: () => void) => void
  off: (eventName: 'pointertap', listener: () => void) => void
}

export interface PetInteractionOptions {
  dispatch: (command: ActionCommand) => void | Promise<unknown>
  isMinigameActive: () => boolean
  onPetRequested?: () => void
  now?: () => number
  createActionId?: () => string
}

let nextPetActionId = 0

/**
 * Traduce una pulsación unificada de Pixi en un único comando tipado. La
 * escena no modifica el estado: el controlador conserva la cola y las reglas.
 */
export function bindPetInteraction(
  target: PetPointerTarget,
  options: PetInteractionOptions,
): () => void {
  const now = options.now ?? Date.now
  const createActionId = options.createActionId ?? (() => `pet-${now()}-${++nextPetActionId}`)
  const handlePointerTap = () => {
    if (options.isMinigameActive()) {
      return
    }

    const dispatchResult = options.dispatch({
      type: 'pet',
      id: createActionId(),
      createdAtMs: now(),
      source: 'local',
    })

    options.onPetRequested?.()
    void Promise.resolve(dispatchResult).catch(() => undefined)
  }

  target.on('pointertap', handlePointerTap)

  return () => {
    target.off('pointertap', handlePointerTap)
  }
}
