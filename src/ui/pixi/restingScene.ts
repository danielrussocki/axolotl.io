import { Container, Graphics } from 'pixi.js'

import type { PetVisualState } from '../../domain/contracts'

type RectangleElement = {
  id: string
  type: 'rectangle'
  x: number
  y: number
  width: number
  height: number
  color: string
  alpha?: number
}

type EllipseElement = {
  id: string
  type: 'ellipse'
  x: number
  y: number
  radiusX: number
  radiusY: number
  color: string
  alpha?: number
}

export type RestingSceneElement = RectangleElement | EllipseElement

const createWallDecorations = (): readonly RestingSceneElement[] => {
  const decorations: RestingSceneElement[] = []

  for (let index = 0; index < 14; index += 1) {
    const centerX = (index * 73 + 37) % 480
    const centerY = (index * 51 + 19) % 170 + 10
    const pixel = (14 * 0.6) / 5
    const heart = [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ]
    for (const [row, columns] of heart.entries()) {
      for (const [column, enabled] of columns.entries()) {
        if (enabled === 1) {
          decorations.push({
            id: `wall-heart-${index}-${row}-${column}`,
            type: 'rectangle',
            x: centerX + column * pixel - (14 * 0.6) / 2,
            y: centerY + row * pixel - (14 * 0.6) / 2,
            width: pixel,
            height: pixel,
            color: '#ff8fab',
            alpha: 0.07,
          })
        }
      }
    }
  }

  for (let index = 0; index < 12; index += 1) {
    const centerX = (index * 97 + 80) % 480
    const centerY = (index * 67 + 40) % 160 + 8
    const pixel = 8 / 6
    decorations.push(
      { id: `wall-star-${index}-horizontal`, type: 'rectangle', x: centerX - pixel * 2, y: centerY - pixel / 2, width: pixel * 4, height: pixel, color: '#ffc2d1', alpha: 0.07 },
      { id: `wall-star-${index}-vertical`, type: 'rectangle', x: centerX - pixel / 2, y: centerY - pixel * 2, width: pixel, height: pixel * 4, color: '#ffc2d1', alpha: 0.07 },
      { id: `wall-star-${index}-center`, type: 'rectangle', x: centerX - pixel, y: centerY - pixel, width: pixel * 2, height: pixel * 2, color: '#ffc2d1', alpha: 0.07 },
    )
  }

  return decorations
}

const wallDecorationElements = createWallDecorations()

const roomElements: readonly RestingSceneElement[] = [
  { id: 'room-wall', type: 'rectangle', x: 0, y: 0, width: 480, height: 212, color: '#fff5f8' },
  ...wallDecorationElements,
  { id: 'room-floor', type: 'rectangle', x: 0, y: 212, width: 480, height: 108, color: '#ffe4ec' },
  { id: 'room-floor-line-zero', type: 'rectangle', x: 0, y: 212, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-one', type: 'rectangle', x: 0, y: 238, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-two', type: 'rectangle', x: 0, y: 264, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-three', type: 'rectangle', x: 0, y: 290, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-four', type: 'rectangle', x: 0, y: 316, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-shelf', type: 'rectangle', x: 0, y: 188, width: 480, height: 8, color: '#ffc2d1' },
  { id: 'room-shelf-edge', type: 'rectangle', x: 0, y: 192, width: 480, height: 4, color: '#ff8fab' },
  { id: 'window-frame', type: 'rectangle', x: 22, y: 24, width: 92, height: 78, color: '#ffd6e7' },
  { id: 'window-sky', type: 'rectangle', x: 22, y: 24, width: 92, height: 78, color: '#e8f6ff' },
  { id: 'window-panel', type: 'rectangle', x: 26, y: 28, width: 84, height: 70, color: '#ffffff' },
  { id: 'window-divider-vertical', type: 'rectangle', x: 66, y: 24, width: 4, height: 78, color: '#ffe4ec' },
  { id: 'window-divider-horizontal', type: 'rectangle', x: 22, y: 60, width: 92, height: 4, color: '#ffe4ec' },
  { id: 'plant-pot', type: 'rectangle', x: 380, y: 54, width: 54, height: 62, color: '#ffd6e7' },
  { id: 'plant-stem-left', type: 'rectangle', x: 392, y: 38, width: 8, height: 22, color: '#7ed957' },
  { id: 'plant-stem-center', type: 'rectangle', x: 404, y: 32, width: 8, height: 28, color: '#7ed957' },
  { id: 'plant-stem-right', type: 'rectangle', x: 416, y: 44, width: 8, height: 16, color: '#7ed957' },
  { id: 'plant-flower-left', type: 'rectangle', x: 390, y: 50, width: 6, height: 6, color: '#ffb6d9' },
  { id: 'plant-flower-right', type: 'rectangle', x: 418, y: 38, width: 6, height: 6, color: '#ffb6d9' },
  { id: 'rug-outer', type: 'ellipse', x: 240, y: 262, radiusX: 110, radiusY: 32, color: '#ffd6e7' },
  { id: 'rug-inner', type: 'ellipse', x: 240, y: 262, radiusX: 84, radiusY: 22, color: '#fff0f5' },
]

const roomElementIds = new Set(roomElements.map((element) => element.id))

const mochiElements: readonly RestingSceneElement[] = [
  { id: 'mochi-shadow', type: 'ellipse', x: 240, y: 262, radiusX: 28, radiusY: 8, color: '#ff8fab', alpha: 0.22 },
  { id: 'mochi-left-ear-top', type: 'rectangle', x: 212, y: 118, width: 14, height: 6, color: '#ff8fab' },
  { id: 'mochi-left-ear-middle', type: 'rectangle', x: 210, y: 124, width: 18, height: 20, color: '#ff8fab' },
  { id: 'mochi-left-ear-bottom', type: 'rectangle', x: 212, y: 144, width: 14, height: 10, color: '#ff8fab' },
  { id: 'mochi-right-ear-top', type: 'rectangle', x: 254, y: 118, width: 14, height: 6, color: '#ff8fab' },
  { id: 'mochi-right-ear-middle', type: 'rectangle', x: 252, y: 124, width: 18, height: 20, color: '#ff8fab' },
  { id: 'mochi-right-ear-bottom', type: 'rectangle', x: 254, y: 144, width: 14, height: 10, color: '#ff8fab' },
  { id: 'mochi-left-ear-inner', type: 'rectangle', x: 214, y: 124, width: 10, height: 26, color: '#ffb6d9' },
  { id: 'mochi-right-ear-inner', type: 'rectangle', x: 256, y: 124, width: 10, height: 26, color: '#ffb6d9' },
  { id: 'mochi-left-ear-highlight', type: 'rectangle', x: 218, y: 130, width: 4, height: 14, color: '#ffd6e7' },
  { id: 'mochi-right-ear-highlight', type: 'rectangle', x: 258, y: 130, width: 4, height: 14, color: '#ffd6e7' },
  ...([148, 158, 168] as const).flatMap((y, index) => [
    { id: `mochi-left-gill-${['one', 'two', 'three'][index]}`, type: 'rectangle' as const, x: 208, y, width: 10, height: 3, color: '#ff8fab' },
    { id: `mochi-left-gill-tip-${['one', 'two', 'three'][index]}`, type: 'rectangle' as const, x: 206, y: y - 2, width: 5, height: 7, color: '#ff4d6d' },
    { id: `mochi-right-gill-${['one', 'two', 'three'][index]}`, type: 'rectangle' as const, x: 262, y, width: 10, height: 3, color: '#ff8fab' },
    { id: `mochi-right-gill-tip-${['one', 'two', 'three'][index]}`, type: 'rectangle' as const, x: 269, y: y - 2, width: 5, height: 7, color: '#ff4d6d' },
  ]),
  { id: 'mochi-body-top', type: 'rectangle', x: 218, y: 142, width: 44, height: 8, color: '#ffb6d9' },
  { id: 'mochi-body-middle', type: 'rectangle', x: 212, y: 150, width: 56, height: 22, color: '#ffb6d9' },
  { id: 'mochi-body-bottom', type: 'rectangle', x: 216, y: 172, width: 48, height: 14, color: '#ffb6d9' },
  { id: 'mochi-body-outline', type: 'rectangle', x: 216, y: 184, width: 48, height: 3, color: '#ff8fab' },
  { id: 'mochi-belly', type: 'rectangle', x: 226, y: 166, width: 28, height: 16, color: '#ffd6e7' },
  { id: 'mochi-belly-highlight', type: 'rectangle', x: 232, y: 170, width: 16, height: 6, color: '#fff5f8' },
  { id: 'mochi-left-cheek', type: 'rectangle', x: 214, y: 162, width: 8, height: 6, color: '#ff8fab' },
  { id: 'mochi-right-cheek', type: 'rectangle', x: 258, y: 162, width: 8, height: 6, color: '#ff8fab' },
  { id: 'mochi-left-eye', type: 'rectangle', x: 220, y: 154, width: 12, height: 12, color: '#3a2a33' },
  { id: 'mochi-right-eye', type: 'rectangle', x: 248, y: 154, width: 12, height: 12, color: '#3a2a33' },
  { id: 'mochi-left-eye-glint-main', type: 'rectangle', x: 222, y: 156, width: 4, height: 4, color: '#ffffff' },
  { id: 'mochi-right-eye-glint-main', type: 'rectangle', x: 250, y: 156, width: 4, height: 4, color: '#ffffff' },
  { id: 'mochi-left-eye-glint-small', type: 'rectangle', x: 226, y: 160, width: 2, height: 2, color: '#ffffff' },
  { id: 'mochi-right-eye-glint-small', type: 'rectangle', x: 252, y: 160, width: 2, height: 2, color: '#ffffff' },
  { id: 'mochi-mouth-left', type: 'rectangle', x: 234, y: 166, width: 2, height: 2, color: '#6b4a5a' },
  { id: 'mochi-mouth-left-bottom', type: 'rectangle', x: 236, y: 168, width: 2, height: 2, color: '#6b4a5a' },
  { id: 'mochi-mouth-center', type: 'rectangle', x: 238, y: 166, width: 2, height: 2, color: '#6b4a5a' },
  { id: 'mochi-mouth-right-bottom', type: 'rectangle', x: 240, y: 168, width: 2, height: 2, color: '#6b4a5a' },
  { id: 'mochi-mouth-right', type: 'rectangle', x: 242, y: 166, width: 2, height: 2, color: '#6b4a5a' },
  { id: 'mochi-mouth-right-end', type: 'rectangle', x: 244, y: 166, width: 2, height: 2, color: '#6b4a5a' },
]

const restingSceneElements: readonly RestingSceneElement[] = [...roomElements, ...mochiElements]

const visualStateElements: Readonly<Record<PetVisualState, readonly RestingSceneElement[]>> = {
  sleeping: [
    { id: 'mochi-sleeping-left-eye', type: 'rectangle', x: 220, y: 158, width: 12, height: 2, color: '#6b4a5a' },
    { id: 'mochi-sleeping-right-eye', type: 'rectangle', x: 248, y: 158, width: 12, height: 2, color: '#6b4a5a' },
    { id: 'sleep-particle-z-large', type: 'rectangle', x: 280, y: 132, width: 10, height: 3, color: '#ff8fab' },
    { id: 'sleep-particle-z-large-drop', type: 'rectangle', x: 287, y: 135, width: 3, height: 6, color: '#ff8fab' },
    { id: 'sleep-particle-z-medium', type: 'rectangle', x: 292, y: 120, width: 8, height: 3, color: '#ff8fab' },
    { id: 'sleep-particle-z-medium-drop', type: 'rectangle', x: 292, y: 123, width: 3, height: 5, color: '#ff8fab' },
    { id: 'sleep-particle-z-small', type: 'rectangle', x: 302, y: 111, width: 6, height: 2, color: '#ff8fab' },
    { id: 'sleep-particle-one', type: 'rectangle', x: 280, y: 132, width: 1, height: 1, color: '#ff8fab', alpha: 0 },
    { id: 'sleep-particle-two', type: 'rectangle', x: 292, y: 120, width: 1, height: 1, color: '#ff8fab', alpha: 0 },
  ],
  sick: [
    { id: 'mochi-sick-body-overlay', type: 'rectangle', x: 212, y: 150, width: 56, height: 22, color: '#e9c6d2' },
    { id: 'mochi-sick-body-bottom', type: 'rectangle', x: 216, y: 172, width: 48, height: 12, color: '#e9c6d2' },
    { id: 'mochi-sick-face', type: 'rectangle', x: 218, y: 142, width: 44, height: 8, color: '#e9c6d2' },
    { id: 'mochi-sick-left-eye', type: 'rectangle', x: 220, y: 154, width: 12, height: 12, color: '#8b6a7a' },
    { id: 'mochi-sick-right-eye', type: 'rectangle', x: 248, y: 154, width: 12, height: 12, color: '#8b6a7a' },
    { id: 'sick-left-tear', type: 'rectangle', x: 224, y: 166, width: 3, height: 6, color: '#8ed1ff' },
    { id: 'sick-right-tear', type: 'rectangle', x: 253, y: 166, width: 3, height: 6, color: '#8ed1ff' },
    { id: 'sick-particle-one', type: 'rectangle', x: 281, y: 134, width: 10, height: 10, color: '#b8d986', alpha: 0.8 },
    { id: 'sick-particle-two', type: 'rectangle', x: 298, y: 122, width: 6, height: 6, color: '#b8d986', alpha: 0.8 },
  ],
  sad: [
    { id: 'mochi-sad-left-eye', type: 'rectangle', x: 220, y: 154, width: 12, height: 12, color: '#8b6a7a' },
    { id: 'mochi-sad-right-eye', type: 'rectangle', x: 248, y: 154, width: 12, height: 12, color: '#8b6a7a' },
    { id: 'mochi-sad-mouth', type: 'rectangle', x: 236, y: 172, width: 8, height: 2, color: '#8b6a7a' },
    { id: 'mochi-sad-mouth-left', type: 'rectangle', x: 234, y: 170, width: 2, height: 4, color: '#8b6a7a' },
    { id: 'mochi-sad-mouth-right', type: 'rectangle', x: 244, y: 170, width: 2, height: 4, color: '#8b6a7a' },
    { id: 'sad-left-tear', type: 'rectangle', x: 224, y: 166, width: 3, height: 6, color: '#8ed1ff' },
    { id: 'sad-right-tear', type: 'rectangle', x: 253, y: 166, width: 3, height: 6, color: '#8ed1ff' },
  ],
  dirty: [
    { id: 'dirty-cloud-one', type: 'rectangle', x: 196, y: 146, width: 12, height: 12, color: '#d8bfa8', alpha: 0.85 },
    { id: 'dirty-cloud-two', type: 'rectangle', x: 270, y: 144, width: 12, height: 12, color: '#d8bfa8', alpha: 0.85 },
    { id: 'dirty-cloud-three', type: 'rectangle', x: 234, y: 132, width: 12, height: 12, color: '#d8bfa8', alpha: 0.85 },
    { id: 'mochi-dirty-mouth-left', type: 'rectangle', x: 234, y: 170, width: 2, height: 4, color: '#8b6a7a' },
    { id: 'mochi-dirty-mouth-right', type: 'rectangle', x: 244, y: 170, width: 2, height: 4, color: '#8b6a7a' },
    { id: 'dirt-poop-one-base', type: 'rectangle', x: 192, y: 216, width: 20, height: 5, color: '#8b6a4a' },
    { id: 'dirt-poop-one-middle', type: 'rectangle', x: 194, y: 211, width: 16, height: 5, color: '#c49a6c' },
    { id: 'dirt-poop-one-top', type: 'rectangle', x: 198, y: 206, width: 8, height: 5, color: '#c49a6c' },
    { id: 'dirt-poop-two-base', type: 'rectangle', x: 270, y: 218, width: 18, height: 5, color: '#8b6a4a' },
    { id: 'dirt-poop-two-top', type: 'rectangle', x: 274, y: 208, width: 10, height: 10, color: '#c49a6c' },
    { id: 'dirt-spot-one', type: 'rectangle', x: 192, y: 216, width: 1, height: 1, color: '#c49a6c', alpha: 0 },
    { id: 'dirt-spot-two', type: 'rectangle', x: 270, y: 218, width: 1, height: 1, color: '#c49a6c', alpha: 0 },
    { id: 'dirt-spot-three', type: 'rectangle', x: 240, y: 230, width: 1, height: 1, color: '#8b6a4a', alpha: 0 },
  ],
  eating: [
    { id: 'food-bowl', type: 'rectangle', x: 218, y: 224, width: 44, height: 8, color: '#ff8fab' },
    { id: 'food-bowl-inner', type: 'rectangle', x: 222, y: 222, width: 36, height: 4, color: '#ffd6e7' },
    { id: 'mochi-eating-left-cheek', type: 'rectangle', x: 212, y: 160, width: 12, height: 9, color: '#ff8fab' },
    { id: 'mochi-eating-right-cheek', type: 'rectangle', x: 256, y: 160, width: 12, height: 9, color: '#ff8fab' },
    { id: 'mochi-eating-mouth-open', type: 'rectangle', x: 236, y: 166, width: 8, height: 6, color: '#6b4a5a' },
    { id: 'food-strawberry-one', type: 'rectangle', x: 202, y: 143, width: 12, height: 12, color: '#ff4d6d' },
    { id: 'food-strawberry-one-leaf', type: 'rectangle', x: 204, y: 140, width: 8, height: 3, color: '#7ed957' },
    { id: 'food-heart-one', type: 'rectangle', x: 270, y: 142, width: 9, height: 9, color: '#ff4d6d' },
    { id: 'food-particle-one', type: 'rectangle', x: 202, y: 143, width: 1, height: 1, color: '#ff4d6d', alpha: 0 },
    { id: 'food-particle-two', type: 'rectangle', x: 270, y: 142, width: 1, height: 1, color: '#ff4d6d', alpha: 0 },
  ],
  normal: [],
}

export interface MochiAnimationFrame {
  bobOffsetY: number
  gillOffsetX: number
  gills: readonly MochiGillAnimation[]
  isBlinking: boolean
  isChewing: boolean
}

export interface MochiGillAnimation {
  index: number
  offsetX: number
}

/** Calcula animación visual sin modificar el estado del juego. */
export function calculateMochiAnimationFrame(
  timeMs: number,
  visualState: PetVisualState,
  isPlaying = false,
): MochiAnimationFrame {
  const bobAmplitude = visualState === 'sleeping' ? 1.5 : 3.2
  const gills = [0, 1, 2].map((index) => {
    const phase = timeMs * 0.005 + index

    return {
      index,
      offsetX: Math.sin(phase) * 2,
    }
  })

  return {
    bobOffsetY: isPlaying
      ? Math.abs(Math.sin(timeMs * 0.012)) * 14
      : Math.sin(timeMs * (visualState === 'sleeping' ? 0.0015 : 0.003)) * bobAmplitude,
    gillOffsetX: gills[0].offsetX,
    gills,
    isBlinking: visualState !== 'sleeping' && timeMs % 4_000 >= 2_500 && timeMs % 4_000 < 2_640,
    isChewing: visualState === 'eating' && Math.sin(timeMs * 0.018) > 0,
  }
}

export function createRestingSceneElements(): readonly RestingSceneElement[] {
  return restingSceneElements
}

/** Compone la escena con una apariencia ya derivada por el dominio. */
export function createRestingSceneElementsForVisualState(
  visualState: PetVisualState,
): readonly RestingSceneElement[] {
  return [...restingSceneElements, ...visualStateElements[visualState]]
}

export function drawRestingScene(
  stage: Container,
  visualState: PetVisualState = 'normal',
  includeMochi = true,
  timeMs = 0,
  isPlaying = false,
): void {
  const frame = calculateMochiAnimationFrame(timeMs, visualState, isPlaying)
  const mochi = new Container({ y: frame.bobOffsetY })

  for (const element of createRestingSceneElementsForVisualState(visualState)) {
    if (!includeMochi && element.id.startsWith('mochi-')) {
      continue
    }
    const graphic = new Graphics()
    const isGill = element.id.includes('gill-')
    const isSleepingEye = element.id.includes('eye') && visualState === 'sleeping'
    const isBlinkingEye = element.id.includes('eye') && frame.isBlinking
    const gillIndex = isGill
      ? ['one', 'two', 'three'].findIndex((name) => element.id.endsWith(`-${name}`))
      : -1
    const gill = gillIndex >= 0 ? frame.gills[gillIndex] : undefined
    const isLeftGill = element.id.startsWith('mochi-left-')
    const getGillGeometry = (gillOffsetX: number) => {
      if (element.type !== 'rectangle') {
        throw new Error('Las branquias deben dibujarse con bloques pixelados.')
      }

      const offsetX = isLeftGill ? gillOffsetX : -gillOffsetX

      return {
        x: element.x + offsetX,
        y: element.y,
        width: element.width,
        height: element.height,
      }
    }

    if ((isSleepingEye || isBlinkingEye) && element.id.startsWith('mochi-left-eye')) {
      continue
    }
    if ((isSleepingEye || isBlinkingEye) && element.id.startsWith('mochi-right-eye')) {
      continue
    }
    if (visualState === 'eating' && !frame.isChewing && element.id === 'mochi-eating-mouth-open') {
      continue
    }

    if (element.type === 'rectangle') {
      const geometry = gill === undefined
        ? { x: element.x, y: element.y, width: element.width, height: element.height }
        : getGillGeometry(gill.offsetX)
      graphic.rect(geometry.x, geometry.y, geometry.width, geometry.height)
    } else {
      graphic.ellipse(element.x, element.y, element.radiusX, element.radiusY)
    }

    graphic.fill({ color: element.color, alpha: element.alpha ?? 1 })
    const isStaticElement = roomElementIds.has(element.id) || element.id === 'mochi-shadow'
    ;(isStaticElement ? stage : mochi).addChild(graphic)
  }

  stage.addChild(mochi)
}

/** Crea el área de pulsación de Mochi sin incorporar reglas de interacción a la escena. */
export function createMochiPointerTarget(stage: Container): Graphics {
  const target = new Graphics()
  target.roundRect(190, 106, 100, 132, 18).fill({ color: '#ffffff', alpha: 0 })
  target.eventMode = 'static'
  target.cursor = 'pointer'
  stage.addChild(target)

  return target
}
