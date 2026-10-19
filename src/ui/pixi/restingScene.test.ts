import { describe, expect, it } from 'vitest'

import {
  calculateMochiAnimationFrame,
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
      'mochi-body-middle',
      'mochi-left-ear-top',
      'mochi-right-ear-top',
      'mochi-left-gill-one',
      'mochi-left-gill-two',
      'mochi-left-gill-three',
      'mochi-right-gill-one',
      'mochi-right-gill-two',
      'mochi-right-gill-three',
      'mochi-left-eye',
      'mochi-right-eye',
      'mochi-mouth-center',
    ]))

    expect(elements.find((element) => element.id === 'mochi-body-middle')).toMatchObject({
      type: 'rectangle',
      x: 212,
      y: 150,
      width: 56,
      height: 22,
    })
  })

  it('traslada la composición pixel art de reposo sin sustituir a Mochi por elipses', () => {
    const elements = createRestingSceneElements()
    const mochiElements = elements.filter((element) => element.id.startsWith('mochi-'))

    expect(elements).toEqual(expect.arrayContaining([
      { id: 'room-wall', type: 'rectangle', x: 0, y: 0, width: 480, height: 212, color: '#fff5f8' },
      { id: 'room-shelf-edge', type: 'rectangle', x: 0, y: 192, width: 480, height: 4, color: '#ff8fab' },
      { id: 'window-frame', type: 'rectangle', x: 22, y: 24, width: 92, height: 78, color: '#ffd6e7' },
      { id: 'plant-pot', type: 'rectangle', x: 380, y: 54, width: 54, height: 62, color: '#ffd6e7' },
      { id: 'mochi-left-ear-top', type: 'rectangle', x: 212, y: 118, width: 14, height: 6, color: '#ff8fab' },
      { id: 'mochi-right-ear-top', type: 'rectangle', x: 254, y: 118, width: 14, height: 6, color: '#ff8fab' },
      { id: 'mochi-body-top', type: 'rectangle', x: 218, y: 142, width: 44, height: 8, color: '#ffb6d9' },
      { id: 'mochi-body-bottom', type: 'rectangle', x: 216, y: 172, width: 48, height: 14, color: '#ffb6d9' },
      { id: 'mochi-belly-highlight', type: 'rectangle', x: 232, y: 170, width: 16, height: 6, color: '#fff5f8' },
    ]))
    expect(mochiElements.filter((element) => element.id !== 'mochi-shadow')).toEqual(
      expect.not.arrayContaining([expect.objectContaining({ type: 'ellipse' })]),
    )
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
      'mochi-body-middle',
      'mochi-left-gill-one',
    ]))
  })

  it('conserva los rasgos pixelados de referencia en cada variación visual', () => {
    const sleeping = createRestingSceneElementsForVisualState('sleeping')
    const eating = createRestingSceneElementsForVisualState('eating')
    const sad = createRestingSceneElementsForVisualState('sad')
    const sick = createRestingSceneElementsForVisualState('sick')
    const dirty = createRestingSceneElementsForVisualState('dirty')

    expect(sleeping.map((element) => element.id)).toEqual(expect.arrayContaining([
      'mochi-sleeping-left-eye',
      'sleep-particle-z-large',
      'sleep-particle-z-medium',
      'sleep-particle-z-small',
    ]))
    expect(eating.map((element) => element.id)).toEqual(expect.arrayContaining([
      'mochi-eating-mouth-open',
      'mochi-eating-left-cheek',
      'food-strawberry-one',
      'food-heart-one',
    ]))
    expect(sad.map((element) => element.id)).toEqual(expect.arrayContaining([
      'mochi-sad-left-eye',
      'sad-left-tear',
      'mochi-sad-mouth-left',
    ]))
    expect(sick.map((element) => element.id)).toEqual(expect.arrayContaining([
      'mochi-sick-body-overlay',
      'mochi-sick-left-eye',
      'sick-left-tear',
    ]))
    expect(dirty.map((element) => element.id)).toEqual(expect.arrayContaining([
      'dirty-cloud-one',
      'dirt-poop-one-base',
      'dirt-poop-two-top',
      'mochi-dirty-mouth-left',
    ]))

    const baseIds = new Set(createRestingSceneElements().map((element) => element.id))
    for (const elements of [sleeping, eating, sad, sick, dirty]) {
      const variationElements = elements.filter((element) => !baseIds.has(element.id))
      expect(variationElements).toEqual(
        expect.not.arrayContaining([expect.objectContaining({ type: 'ellipse' })]),
      )
    }
  })
})

describe('calculateMochiAnimationFrame', () => {
  it('anima el balanceo, el parpadeo y las branquias en reposo', () => {
    const resting = calculateMochiAnimationFrame(0, 'normal')
    const moving = calculateMochiAnimationFrame(500, 'normal')
    const blinking = calculateMochiAnimationFrame(2_600, 'normal')

    expect(moving.bobOffsetY).not.toBe(resting.bobOffsetY)
    expect(moving.gillOffsetX).not.toBe(resting.gillOffsetX)
    expect(blinking.isBlinking).toBe(true)
  })

  it('aplica el balanceo de referencia a Mochi y desfasa cada par de branquias', () => {
    const resting = calculateMochiAnimationFrame(0, 'normal')
    const frame = calculateMochiAnimationFrame(500, 'normal')

    expect(frame.bobOffsetY).not.toBe(resting.bobOffsetY)
    expect(frame.gills).toHaveLength(3)
    expect(new Set(frame.gills.map((gill) => gill.offsetX)).size).toBeGreaterThan(1)
    expect(frame.gills).toEqual(expect.arrayContaining([
      expect.objectContaining({ index: 0, offsetX: expect.any(Number) }),
      expect.objectContaining({ index: 1, offsetX: expect.any(Number) }),
      expect.objectContaining({ index: 2, offsetX: expect.any(Number) }),
    ]))
    expect(frame.gills.some((gill) => !Number.isInteger(gill.offsetX))).toBe(true)
  })

  it('mantiene un balanceo suave al dormir y alterna la masticación al comer', () => {
    const sleeping = calculateMochiAnimationFrame(1_000, 'sleeping')
    const eatingClosed = calculateMochiAnimationFrame(0, 'eating')
    const eatingOpen = calculateMochiAnimationFrame(100, 'eating')

    expect(Math.abs(sleeping.bobOffsetY)).toBeLessThanOrEqual(2)
    expect(eatingClosed.isChewing).not.toBe(eatingOpen.isChewing)
  })

  it('reproduce el rebote de hasta catorce píxeles al acariciar', () => {
    const resting = calculateMochiAnimationFrame(130, 'normal')
    const playing = calculateMochiAnimationFrame(130, 'normal', true)

    expect(Math.abs(resting.bobOffsetY)).toBeLessThanOrEqual(3.2)
    expect(playing.bobOffsetY).toBeGreaterThan(13)
    expect(playing.bobOffsetY).toBeLessThanOrEqual(14)
  })
})
