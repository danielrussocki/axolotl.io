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
}

type EllipseElement = {
  id: string
  type: 'ellipse'
  x: number
  y: number
  radiusX: number
  radiusY: number
  color: string
}

export type RestingSceneElement = RectangleElement | EllipseElement

const restingSceneElements: readonly RestingSceneElement[] = [
  { id: 'room-wall', type: 'rectangle', x: 0, y: 0, width: 480, height: 212, color: '#fff5f8' },
  { id: 'room-floor', type: 'rectangle', x: 0, y: 212, width: 480, height: 108, color: '#ffe4ec' },
  { id: 'room-floor-line-one', type: 'rectangle', x: 0, y: 238, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-two', type: 'rectangle', x: 0, y: 264, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-floor-line-three', type: 'rectangle', x: 0, y: 290, width: 480, height: 2, color: '#ffd6e7' },
  { id: 'room-shelf', type: 'rectangle', x: 0, y: 188, width: 480, height: 8, color: '#ffc2d1' },
  { id: 'room-shelf-edge', type: 'rectangle', x: 0, y: 196, width: 480, height: 4, color: '#ff8fab' },
  { id: 'window-frame', type: 'rectangle', x: 22, y: 24, width: 92, height: 78, color: '#ffd6e7' },
  { id: 'window-sky', type: 'rectangle', x: 26, y: 28, width: 84, height: 70, color: '#e8f6ff' },
  { id: 'window-divider-vertical', type: 'rectangle', x: 66, y: 28, width: 4, height: 70, color: '#ffe4ec' },
  { id: 'window-divider-horizontal', type: 'rectangle', x: 26, y: 62, width: 84, height: 4, color: '#ffe4ec' },
  { id: 'plant-pot', type: 'rectangle', x: 380, y: 54, width: 54, height: 62, color: '#ffd6e7' },
  { id: 'plant-stem-left', type: 'rectangle', x: 392, y: 38, width: 8, height: 22, color: '#7ed957' },
  { id: 'plant-stem-center', type: 'rectangle', x: 404, y: 32, width: 8, height: 28, color: '#7ed957' },
  { id: 'plant-stem-right', type: 'rectangle', x: 416, y: 44, width: 8, height: 16, color: '#7ed957' },
  { id: 'rug-outer', type: 'ellipse', x: 240, y: 262, radiusX: 110, radiusY: 32, color: '#ffd6e7' },
  { id: 'rug-inner', type: 'ellipse', x: 240, y: 262, radiusX: 84, radiusY: 22, color: '#fff0f5' },
  { id: 'mochi-shadow', type: 'ellipse', x: 240, y: 262, radiusX: 30, radiusY: 8, color: '#f4adc5' },
  { id: 'mochi-left-ear', type: 'ellipse', x: 216, y: 142, radiusX: 12, radiusY: 24, color: '#ff8fab' },
  { id: 'mochi-right-ear', type: 'ellipse', x: 264, y: 142, radiusX: 12, radiusY: 24, color: '#ff8fab' },
  { id: 'mochi-left-ear-inner', type: 'ellipse', x: 216, y: 142, radiusX: 6, radiusY: 16, color: '#ffb6d9' },
  { id: 'mochi-right-ear-inner', type: 'ellipse', x: 264, y: 142, radiusX: 6, radiusY: 16, color: '#ffb6d9' },
  { id: 'mochi-left-gills', type: 'ellipse', x: 202, y: 172, radiusX: 12, radiusY: 18, color: '#ff4d6d' },
  { id: 'mochi-right-gills', type: 'ellipse', x: 278, y: 172, radiusX: 12, radiusY: 18, color: '#ff4d6d' },
  { id: 'mochi-body', type: 'ellipse', x: 240, y: 174, radiusX: 34, radiusY: 38, color: '#ffb6d9' },
  { id: 'mochi-belly', type: 'ellipse', x: 240, y: 188, radiusX: 19, radiusY: 15, color: '#ffd6e7' },
  { id: 'mochi-left-eye', type: 'ellipse', x: 226, y: 170, radiusX: 5, radiusY: 7, color: '#3a2a33' },
  { id: 'mochi-right-eye', type: 'ellipse', x: 254, y: 170, radiusX: 5, radiusY: 7, color: '#3a2a33' },
  { id: 'mochi-left-eye-glint', type: 'ellipse', x: 224, y: 168, radiusX: 1.5, radiusY: 2, color: '#ffffff' },
  { id: 'mochi-right-eye-glint', type: 'ellipse', x: 252, y: 168, radiusX: 1.5, radiusY: 2, color: '#ffffff' },
  { id: 'mochi-left-cheek', type: 'ellipse', x: 216, y: 181, radiusX: 6, radiusY: 4, color: '#ff8fab' },
  { id: 'mochi-right-cheek', type: 'ellipse', x: 264, y: 181, radiusX: 6, radiusY: 4, color: '#ff8fab' },
  { id: 'mochi-mouth', type: 'ellipse', x: 240, y: 183, radiusX: 5, radiusY: 2.5, color: '#6b4a5a' },
]

const visualStateElements: Readonly<Record<PetVisualState, readonly RestingSceneElement[]>> = {
  sleeping: [
    { id: 'mochi-sleeping-left-eye', type: 'rectangle', x: 220, y: 170, width: 12, height: 2, color: '#6b4a5a' },
    { id: 'mochi-sleeping-right-eye', type: 'rectangle', x: 248, y: 170, width: 12, height: 2, color: '#6b4a5a' },
    { id: 'sleep-particle-one', type: 'rectangle', x: 280, y: 132, width: 9, height: 3, color: '#ff8fab' },
    { id: 'sleep-particle-two', type: 'rectangle', x: 290, y: 120, width: 12, height: 3, color: '#ff8fab' },
  ],
  sick: [
    { id: 'mochi-sick-face', type: 'ellipse', x: 240, y: 174, radiusX: 26, radiusY: 29, color: '#e9c6d2' },
    { id: 'sick-particle-one', type: 'ellipse', x: 286, y: 139, radiusX: 7, radiusY: 7, color: '#b8d986' },
    { id: 'sick-particle-two', type: 'ellipse', x: 300, y: 126, radiusX: 4, radiusY: 4, color: '#b8d986' },
  ],
  sad: [
    { id: 'mochi-sad-mouth', type: 'ellipse', x: 240, y: 187, radiusX: 7, radiusY: 2, color: '#8b6a7a' },
    { id: 'sad-left-tear', type: 'ellipse', x: 226, y: 181, radiusX: 2, radiusY: 6, color: '#8ed1ff' },
    { id: 'sad-right-tear', type: 'ellipse', x: 254, y: 181, radiusX: 2, radiusY: 6, color: '#8ed1ff' },
  ],
  dirty: [
    { id: 'dirt-spot-one', type: 'ellipse', x: 202, y: 216, radiusX: 8, radiusY: 5, color: '#c49a6c' },
    { id: 'dirt-spot-two', type: 'ellipse', x: 278, y: 218, radiusX: 7, radiusY: 4, color: '#c49a6c' },
    { id: 'dirt-spot-three', type: 'ellipse', x: 240, y: 230, radiusX: 9, radiusY: 5, color: '#8b6a4a' },
  ],
  eating: [
    { id: 'food-bowl', type: 'ellipse', x: 240, y: 228, radiusX: 24, radiusY: 8, color: '#ff8fab' },
    { id: 'food-particle-one', type: 'ellipse', x: 210, y: 150, radiusX: 5, radiusY: 7, color: '#ff4d6d' },
    { id: 'food-particle-two', type: 'ellipse', x: 270, y: 145, radiusX: 4, radiusY: 6, color: '#ff4d6d' },
  ],
  normal: [],
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
): void {
  for (const element of createRestingSceneElementsForVisualState(visualState)) {
    if (!includeMochi && element.id.startsWith('mochi-')) {
      continue
    }
    const graphic = new Graphics()

    if (element.type === 'rectangle') {
      graphic.rect(element.x, element.y, element.width, element.height)
    } else {
      graphic.ellipse(element.x, element.y, element.radiusX, element.radiusY)
    }

    graphic.fill(element.color)
    stage.addChild(graphic)
  }
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
