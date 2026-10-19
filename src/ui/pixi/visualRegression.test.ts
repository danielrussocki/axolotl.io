import { describe, expect, it } from 'vitest'

import type { PetVisualState } from '../../domain/contracts'
import { createMinigameSceneInstructions } from './minigameVisualScene'
import { createRestingSceneElementsForVisualState } from './restingScene'

const visualStateExpectations: Readonly<Record<PetVisualState, readonly string[]>> = {
  normal: [
    'room-wall',
    'room-floor',
    'window-frame',
    'plant-pot',
    'rug-outer',
    'mochi-shadow',
    'mochi-body-middle',
    'mochi-left-gill-three',
    'mochi-right-gill-three',
  ],
  sleeping: [
    'mochi-sleeping-left-eye',
    'mochi-sleeping-right-eye',
    'sleep-particle-z-large',
    'sleep-particle-z-medium',
    'sleep-particle-z-small',
  ],
  eating: [
    'food-bowl',
    'mochi-eating-left-cheek',
    'mochi-eating-mouth-open',
    'food-strawberry-one',
    'food-heart-one',
  ],
  sad: [
    'mochi-sad-left-eye',
    'mochi-sad-mouth',
    'sad-left-tear',
    'sad-right-tear',
  ],
  sick: [
    'mochi-sick-body-overlay',
    'mochi-sick-left-eye',
    'sick-left-tear',
    'sick-right-tear',
  ],
  dirty: [
    'dirty-cloud-one',
    'dirty-cloud-two',
    'dirt-poop-one-base',
    'dirt-poop-two-base',
  ],
}

describe('regresión visual de Mochi', () => {
  it.each(Object.entries(visualStateExpectations))(
    'conserva las instrucciones pixeladas deterministas para %s',
    (visualState, expectedIds) => {
      const elements = createRestingSceneElementsForVisualState(visualState as PetVisualState)
      const ids = elements.map((element) => element.id)

      expect(ids).toEqual(expect.arrayContaining([...expectedIds]))
      expect(elements.filter((element) => element.id.startsWith('mochi-') && element.id !== 'mochi-shadow')).toEqual(
        expect.not.arrayContaining([expect.objectContaining({ type: 'ellipse' })]),
      )
    },
  )

  it('conserva las instrucciones pixeladas y la composición del minijuego', () => {
    expect(createMinigameSceneInstructions({
      mochiPosition: { x: 126, y: 194 },
      hearts: [{ id: 'heart-7', x: 310, y: 88, velocityY: 105 }],
      spawnElapsedMs: 120,
      nextHeartId: 8,
    }, 3)).toEqual([
      { id: 'minigame-room', type: 'resting-scene', visualState: 'normal', includeMochi: false },
      { id: 'minigame-mochi', type: 'mochi', x: 126, y: 194 },
      { id: 'minigame-heart-heart-7', type: 'heart', x: 310, y: 88, pixelSize: 3, color: '#ff4d8d' },
      {
        id: 'minigame-header',
        type: 'header',
        x: 0,
        y: 0,
        width: 480,
        height: 32,
        capturedHearts: 3,
      },
    ])
  })
})
