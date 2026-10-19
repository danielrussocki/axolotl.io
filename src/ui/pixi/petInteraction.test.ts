import { describe, expect, it, vi } from 'vitest'

import { bindPetInteraction, type PetPointerTarget } from './petInteraction'

function createTarget(): PetPointerTarget & { emit: () => void } {
  let listener: (() => void) | undefined

  return {
    on: vi.fn((_eventName: 'pointertap', callback: () => void) => {
      listener = callback
    }),
    off: vi.fn(),
    emit: () => listener?.(),
  }
}

describe('bindPetInteraction', () => {
  it('encola una sola caricia al pulsar a Mochi fuera del minijuego', () => {
    const target = createTarget()
    const dispatch = vi.fn()

    bindPetInteraction(target, {
      dispatch,
      isMinigameActive: () => false,
      now: () => 1_234,
      createActionId: () => 'pet-1',
    })
    target.emit()

    expect(dispatch).toHaveBeenCalledOnce()
    expect(dispatch).toHaveBeenCalledWith({
      type: 'pet',
      id: 'pet-1',
      createdAtMs: 1_234,
      source: 'local',
    })
  })

  it('no encola caricias durante el minijuego', () => {
    const target = createTarget()
    const dispatch = vi.fn()

    bindPetInteraction(target, {
      dispatch,
      isMinigameActive: () => true,
      now: () => 1_234,
      createActionId: () => 'pet-1',
    })
    target.emit()

    expect(dispatch).not.toHaveBeenCalled()
  })

  it('notifica a la escena para iniciar el rebote visual de la caricia', () => {
    const target = createTarget()
    const onPetRequested = vi.fn()

    bindPetInteraction(target, {
      dispatch: vi.fn(),
      isMinigameActive: () => false,
      onPetRequested,
    })
    target.emit()

    expect(onPetRequested).toHaveBeenCalledOnce()
  })

  it('retira el listener al destruir la escena', () => {
    const target = createTarget()
    const dispatch = vi.fn()
    const release = bindPetInteraction(target, {
      dispatch,
      isMinigameActive: () => false,
    })

    release()

    expect(target.off).toHaveBeenCalledWith('pointertap', expect.any(Function))
  })
})
