import { describe, expect, it } from 'vitest'

import {
  createRestingSceneElements,
  createRestingSceneElementsForVisualState,
} from './restingScene'

describe('createRestingSceneElements', () => {
  it('compone una habitación con pared, suelo, ventana, estantería, planta y alfombra', () => {
    const elements = createRestingSceneElements()
    const ids = new Set(elements.map((element) => element.id))

    expect([...ids]).toEqual(expect.arrayContaining([
      'room-wall',
      'room-floor',
      'window-frame',
      'room-shelf',
      'plant-pot',
      'rug-outer',
    ]))
  })

  it('sitúa a Mochi en reposo sobre la alfombra con silueta, branquias y rostro', () => {
    const elements = createRestingSceneElements()
    const ids = new Set(elements.map((element) => element.id))

    expect([...ids]).toEqual(expect.arrayContaining([
      'mochi-shadow',
      'mochi-body',
      'mochi-left-ear',
      'mochi-right-ear',
      'mochi-left-gills',
      'mochi-right-gills',
      'mochi-left-eye',
      'mochi-right-eye',
      'mochi-mouth',
    ]))

    expect(elements.find((element) => element.id === 'mochi-body')).toMatchObject({
      type: 'ellipse',
      x: 240,
      y: 174,
    })
  })
})

describe('createRestingSceneElementsForVisualState', () => {
  it.each([
    ['sleeping', ['mochi-sleeping-left-eye', 'sleep-particle-one'], ['sick-particle-one', 'sad-left-tear', 'dirt-spot-one', 'food-particle-one']],
    ['sick', ['mochi-sick-face', 'sick-particle-one'], ['sleep-particle-one', 'sad-left-tear', 'dirt-spot-one', 'food-particle-one']],
    ['sad', ['mochi-sad-mouth', 'sad-left-tear'], ['sleep-particle-one', 'sick-particle-one', 'dirt-spot-one', 'food-particle-one']],
    ['dirty', ['dirt-spot-one', 'dirt-spot-two'], ['sleep-particle-one', 'sick-particle-one', 'sad-left-tear', 'food-particle-one']],
    ['eating', ['food-bowl', 'food-particle-one'], ['sleep-particle-one', 'sick-particle-one', 'sad-left-tear', 'dirt-spot-one']],
    ['normal', [], ['sleep-particle-one', 'sick-particle-one', 'sad-left-tear', 'dirt-spot-one', 'food-particle-one']],
  ] as const)('representa el estado %s con sus efectos visuales exclusivos', (visualState, expectedIds, unexpectedIds) => {
    const ids = new Set(createRestingSceneElementsForVisualState(visualState).map((element) => element.id))

    expect([...ids]).toEqual(expect.arrayContaining([...expectedIds]))
    expect([...ids]).not.toEqual(expect.arrayContaining([...unexpectedIds]))
  })

  it('mantiene la habitación y la silueta base al cambiar el estado visual', () => {
    const ids = new Set(createRestingSceneElementsForVisualState('dirty').map((element) => element.id))

    expect([...ids]).toEqual(expect.arrayContaining([
      'room-wall',
      'rug-outer',
      'mochi-body',
      'mochi-left-gills',
    ]))
  })
})
