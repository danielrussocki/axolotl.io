import { Container, Graphics, Text } from 'pixi.js'

import { drawRestingScene } from './restingScene'
import type { MinigameVisualState } from './minigameInteraction'

export type MinigameSceneInstruction =
  | {
    id: 'minigame-room'
    type: 'resting-scene'
    visualState: 'normal'
    includeMochi: false
  }
  | {
    id: 'minigame-mochi'
    type: 'mochi'
    x: number
    y: number
  }
  | {
    id: string
    type: 'heart'
    x: number
    y: number
    pixelSize: 3
    color: '#ff4d8d'
  }
  | {
    id: 'minigame-header'
    type: 'header'
    x: 0
    y: 0
    width: 480
    height: 32
    capturedHearts: number
  }

/** Describe la composición visual del minijuego sin depender del renderer. */
export function createMinigameSceneInstructions(
  state: MinigameVisualState,
  capturedHearts: number,
): readonly MinigameSceneInstruction[] {
  return [
    { id: 'minigame-room', type: 'resting-scene', visualState: 'normal', includeMochi: false },
    { id: 'minigame-mochi', type: 'mochi', x: state.mochiPosition.x, y: state.mochiPosition.y },
    ...state.hearts.map((heart) => ({
      id: `minigame-heart-${heart.id}`,
      type: 'heart' as const,
      x: heart.x,
      y: heart.y,
      pixelSize: 3 as const,
      color: '#ff4d8d' as const,
    })),
    {
      id: 'minigame-header',
      type: 'header',
      x: 0,
      y: 0,
      width: 480,
      height: 32,
      capturedHearts,
    },
  ]
}

/** Redibuja solo la presentación efímera; las capturas continúan en el controlador. */
export function drawMinigameScene(stage: Container, state: MinigameVisualState, capturedHearts: number): void {
  stage.removeChildren().forEach((child) => child.destroy())
  for (const instruction of createMinigameSceneInstructions(state, capturedHearts)) {
    if (instruction.type === 'resting-scene') {
      drawRestingScene(stage, instruction.visualState, instruction.includeMochi)
    } else if (instruction.type === 'mochi') {
      drawMochi(stage, instruction.x, instruction.y)
    } else if (instruction.type === 'heart') {
      const graphic = new Graphics()
      const heartPixels = [
        [0, 1, 0, 1, 0],
        [1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1],
        [0, 1, 1, 1, 0],
        [0, 0, 1, 0, 0],
      ]
      for (const [row, columns] of heartPixels.entries()) {
        for (const [column, filled] of columns.entries()) {
          if (filled === 1) {
            graphic.rect(
              instruction.x + (column - 2) * instruction.pixelSize,
              instruction.y + row * instruction.pixelSize,
              instruction.pixelSize,
              instruction.pixelSize,
            )
          }
        }
      }
      graphic.fill(instruction.color)
      stage.addChild(graphic)
    } else {
      const overlay = new Graphics()
      overlay.rect(instruction.x, instruction.y, instruction.width, instruction.height).fill({ color: '#ffffff', alpha: 0.88 })
      stage.addChild(overlay)
      stage.addChild(new Text({
        text: `TIEMPO · ATRAPA CORAZONES: ${instruction.capturedHearts}`,
        style: { fill: '#ff6f9e', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
        x: 16,
        y: 10,
      }))
    }
  }
}

/** Muestra el resultado antes de que la escena vuelva a su composición de reposo. */
export function drawMinigameResult(stage: Container, capturedHearts: number): void {
  stage.removeChildren().forEach((child) => child.destroy())
  drawRestingScene(stage)
  const message = new Text({
    text: `¡Atrapaste ${capturedHearts} corazones!`,
    style: { fill: '#ffffff', fontFamily: 'sans-serif', fontSize: 17, fontWeight: 'bold' },
    anchor: 0.5,
    x: 240,
    y: 42,
  })
  const background = new Graphics()
  background.roundRect(72, 20, 336, 45, 18).fill('#ff8fab')
  stage.addChild(background, message)
}

function drawMochi(stage: Container, x: number, y: number): void {
  const mochi = new Graphics()
  mochi.rect(x - 36, y + 78, 72, 8).fill({ color: '#f4adc5', alpha: 0.7 })
  mochi.rect(x - 28, y - 42, 14, 6).rect(x - 30, y - 36, 18, 20).rect(x - 28, y - 16, 14, 10)
  mochi.rect(x + 14, y - 42, 14, 6).rect(x + 12, y - 36, 18, 20).rect(x + 14, y - 16, 14, 10).fill('#ff8fab')
  mochi.rect(x - 34, y - 14, 5, 7).rect(x - 32, y - 4, 5, 7).rect(x - 34, y + 6, 5, 7)
  mochi.rect(x + 29, y - 14, 5, 7).rect(x + 27, y - 4, 5, 7).rect(x + 29, y + 6, 5, 7).fill('#ff4d6d')
  mochi.rect(x - 22, y - 18, 44, 8).rect(x - 28, y - 10, 56, 22).rect(x - 24, y + 12, 48, 14).fill('#ffb6d9')
  mochi.rect(x - 14, y + 6, 28, 16).fill('#ffd6e7')
  mochi.rect(x - 20, y - 6, 12, 12).rect(x + 8, y - 6, 12, 12).fill('#3a2a33')
  mochi.rect(x - 16, y + 22, 8, 5).rect(x + 8, y + 22, 8, 5).fill('#ff8fab')
  mochi.rect(x - 4, y + 6, 2, 2).rect(x - 2, y + 8, 2, 2).rect(x, y + 6, 2, 2).rect(x + 2, y + 8, 2, 2).rect(x + 4, y + 6, 2, 2).fill('#6b4a5a')
  stage.addChild(mochi)
}
