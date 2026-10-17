import { Container, Graphics, Text } from 'pixi.js'

import { drawRestingScene } from './restingScene'
import type { MinigameVisualState } from './minigameInteraction'

/** Redibuja solo la presentación efímera; las capturas continúan en el controlador. */
export function drawMinigameScene(stage: Container, state: MinigameVisualState, capturedHearts: number): void {
  stage.removeChildren().forEach((child) => child.destroy())
  drawRestingScene(stage, 'normal', false)
  drawMochi(stage, state.mochiPosition.x, state.mochiPosition.y)

  for (const heart of state.hearts) {
    const graphic = new Graphics()
    graphic.circle(heart.x - 5, heart.y, 6).circle(heart.x + 5, heart.y, 6)
    graphic.poly([heart.x - 11, heart.y + 2, heart.x + 11, heart.y + 2, heart.x, heart.y + 15])
    graphic.fill('#ff4d8d')
    stage.addChild(graphic)
  }

  const overlay = new Graphics()
  overlay.rect(0, 0, 480, 32).fill({ color: '#ffffff', alpha: 0.88 })
  stage.addChild(overlay)
  stage.addChild(new Text({
    text: `TIEMPO · ATRAPA CORAZONES: ${capturedHearts}`,
    style: { fill: '#ff6f9e', fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
    x: 16,
    y: 10,
  }))
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
  mochi.ellipse(x, y + 82, 34, 8).fill({ color: '#f4adc5', alpha: 0.7 })
  mochi.ellipse(x - 24, y - 32, 12, 24).ellipse(x + 24, y - 32, 12, 24).fill('#ff8fab')
  mochi.ellipse(x - 38, y, 12, 18).ellipse(x + 38, y, 12, 18).fill('#ff4d6d')
  mochi.ellipse(x, y + 2, 34, 38).fill('#ffb6d9')
  mochi.ellipse(x, y + 16, 19, 15).fill('#ffd6e7')
  mochi.ellipse(x - 14, y - 2, 5, 7).ellipse(x + 14, y - 2, 5, 7).fill('#3a2a33')
  mochi.ellipse(x, y + 11, 5, 2.5).fill('#6b4a5a')
  stage.addChild(mochi)
}
