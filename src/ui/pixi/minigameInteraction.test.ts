import { describe, expect, it, vi } from 'vitest'

import {
  advanceMinigameVisualState,
  createMinigameVisualState,
  moveMochiForMinigame,
  type MinigameVisualState,
} from './minigameInteraction'

describe('minigame visual interaction', () => {
  it('moves Mochi to the unified pointer position within the playable area', () => {
    const state = createMinigameVisualState()

    const moved = moveMochiForMinigame(state, { x: 600, y: 20 })

    expect(moved.mochiPosition).toEqual({ x: 444, y: 70 })
  })

  it('captures each heart that touches Mochi and reports it once', () => {
    const onHeartCaptured = vi.fn()
    const state: MinigameVisualState = {
      ...createMinigameVisualState(),
      mochiPosition: { x: 240, y: 174 },
      hearts: [
        { id: 'heart-near', x: 248, y: 174, velocityY: 0 },
        { id: 'heart-far', x: 360, y: 174, velocityY: 0 },
      ],
      spawnElapsedMs: 0,
      nextHeartId: 2,
    }

    const advanced = advanceMinigameVisualState(state, 16, () => 0.5)
    for (const heartId of advanced.capturedHeartIds) {
      onHeartCaptured(heartId)
    }
    const advancedAgain = advanceMinigameVisualState(advanced.state, 16, () => 0.5)
    for (const heartId of advancedAgain.capturedHeartIds) {
      onHeartCaptured(heartId)
    }

    expect(advanced.state.hearts).toEqual([
      expect.objectContaining({ id: 'heart-far' }),
    ])
    expect(onHeartCaptured).toHaveBeenCalledExactlyOnceWith('heart-near')
  })

  it('restores Mochi to the resting position when the minigame ends', () => {
    const state: MinigameVisualState = {
      ...createMinigameVisualState(),
      mochiPosition: { x: 120, y: 110 },
    }

    expect(createMinigameVisualState(state)).toMatchObject({
      mochiPosition: { x: 240, y: 174 },
      hearts: [],
    })
  })
})
