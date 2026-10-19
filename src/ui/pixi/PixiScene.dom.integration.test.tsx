/** @vitest-environment jsdom */

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('pixi.js', () => {
  class Application {
    canvas = document.createElement('canvas')
    stage = {
      addChild: vi.fn(),
      eventMode: 'none',
      hitArea: null,
      on: vi.fn(),
    }
    ticker = {
      add: vi.fn(),
      elapsedMS: 0,
      remove: vi.fn(),
    }

    init = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)
    destroy = vi.fn()
  }

  class Container {
    addChild = vi.fn()
    destroy = vi.fn()
    removeChildren = vi.fn(() => [])
  }

  class Rectangle {
    constructor(..._values: number[]) {}
  }

  return { Application, Container, Rectangle }
})

vi.mock('./restingScene', () => ({
  createMochiPointerTarget: vi.fn(() => ({})),
  drawRestingScene: vi.fn(),
}))

vi.mock('./petInteraction', () => ({
  bindPetInteraction: vi.fn(() => () => undefined),
}))

vi.mock('./minigameInteraction', () => ({
  advanceMinigameVisualState: vi.fn(),
  createMinigameVisualState: vi.fn(),
  moveMochiForMinigame: vi.fn(),
}))

vi.mock('./minigameVisualScene', () => ({
  drawMinigameResult: vi.fn(),
  drawMinigameScene: vi.fn(),
}))

import { PixiScene } from './PixiScene'

let container: HTMLDivElement | undefined
let root: Root | undefined
const isMinigameActive = () => false
const getActiveMinigame = () => null
const onMinigameEvent = () => undefined
const getPetVisualState = () => 'normal' as const

afterEach(async () => {
  await act(async () => {
    root?.unmount()
  })
  container?.remove()
  root = undefined
  container = undefined
})

describe('integración DOM de PixiScene', () => {
  it('presenta el canvas al montar y lo elimina al desmontar', async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)

    await act(async () => {
      root?.render(
        <PixiScene
          getActiveMinigame={getActiveMinigame}
          getPetVisualState={getPetVisualState}
          isMinigameActive={isMinigameActive}
          onCommand={vi.fn()}
          onHeartCaptured={onMinigameEvent}
          onMinigameFinished={onMinigameEvent}
        />,
      )
    })

    expect(container.querySelector('[data-scene-state="ready"]')).not.toBeNull()
    expect(container.querySelector('canvas')).not.toBeNull()

    await act(async () => {
      root?.unmount()
    })
    root = undefined

    expect(container.querySelector('canvas')).toBeNull()
  })
})
