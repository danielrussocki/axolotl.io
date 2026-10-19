import { Application, Container, Rectangle } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'

import type { ActionCommand } from '../../application/contracts'
import {
  createPixiSceneLifecycle,
  type PixiApplicationLike,
} from './pixiSceneLifecycle'
import { bindPetInteraction } from './petInteraction'
import { createMochiPointerTarget, drawRestingScene } from './restingScene'
import {
  advanceMinigameVisualState,
  createMinigameVisualState,
  moveMochiForMinigame,
  type MinigameVisualState,
} from './minigameInteraction'
import { drawMinigameResult, drawMinigameScene } from './minigameVisualScene'
import {
  getPixiSceneStatusMessage,
  playableAreaAspectRatio,
} from './pixiScenePresentation'
import type { MinigameState, PetVisualState } from '../../domain/contracts'

export interface PixiSceneProps {
  onCommand: (command: ActionCommand) => void | Promise<unknown>
  isMinigameActive?: () => boolean
  getActiveMinigame?: () => MinigameState | null
  onHeartCaptured?: () => void | Promise<unknown>
  onMinigameFinished?: () => void | Promise<unknown>
  getPetVisualState?: () => PetVisualState
}

const isMinigameInactive = () => false
const getNormalPetVisualState = (): PetVisualState => 'normal'

function createApplication(
  onCommand: PixiSceneProps['onCommand'],
  isMinigameActive: () => boolean,
  getActiveMinigame: () => MinigameState | null,
  onHeartCaptured: () => void | Promise<unknown>,
  onMinigameFinished: () => void | Promise<unknown>,
  getPetVisualState: () => PetVisualState,
): PixiApplicationLike {
  const application = new Application()
  let releasePetInteraction: (() => void) | undefined
  let sceneContent: Container | undefined
  let visualState: MinigameVisualState | null = null
  let minigameStartedAtMs: number | null = null
  let capturedHearts = 0
  let isFinishing = false
  let resultTimeout: ReturnType<typeof setTimeout> | undefined
  let renderedVisualState: PetVisualState | null = null

  const renderRestingScene = () => {
    if (!sceneContent) {
      return
    }

    sceneContent.removeChildren().forEach((child) => child.destroy())
    renderedVisualState = getPetVisualState()
    drawRestingScene(sceneContent, renderedVisualState)
  }

  const renderMinigame = () => {
    if (sceneContent && visualState) {
      drawMinigameScene(sceneContent, visualState, capturedHearts)
    }
  }

  const finishVisually = () => {
    if (!sceneContent || !visualState) {
      return
    }

    drawMinigameResult(sceneContent, capturedHearts)
    visualState = null
    minigameStartedAtMs = null
    resultTimeout = setTimeout(() => {
      resultTimeout = undefined
      renderRestingScene()
    }, 1_800)
  }

  const updateMinigame = () => {
    const minigame = getActiveMinigame()
    if (minigame === null) {
      if (visualState === null && renderedVisualState !== getPetVisualState()) {
        renderRestingScene()
      }
      return
    }

    if (minigameStartedAtMs !== minigame.startedAtMs) {
      visualState = createMinigameVisualState()
      minigameStartedAtMs = minigame.startedAtMs
      capturedHearts = minigame.capturedHearts
      isFinishing = false
    }

    if (Date.now() - minigame.startedAtMs >= 5_000) {
      if (!isFinishing) {
        isFinishing = true
        finishVisually()
        void Promise.resolve(onMinigameFinished()).catch(() => undefined)
      }
      return
    }

    if (visualState === null) {
      return
    }

    const advanced = advanceMinigameVisualState(visualState, application.ticker.elapsedMS)
    visualState = advanced.state
    for (const _heartId of advanced.capturedHeartIds) {
      capturedHearts += 1
      void Promise.resolve(onHeartCaptured()).catch(() => undefined)
    }
    renderMinigame()
  }

  return {
    get canvas() {
      return application.canvas
    },
    initialize: async () => {
      await application.init({
      antialias: false,
      backgroundAlpha: 0,
      height: 320,
      width: 480,
      })
      sceneContent = new Container()
      application.stage.addChild(sceneContent)
      renderRestingScene()
      const petTarget = createMochiPointerTarget(application.stage)
      releasePetInteraction = bindPetInteraction(petTarget, {
        dispatch: onCommand,
        isMinigameActive,
      })
      application.stage.eventMode = 'static'
      application.stage.hitArea = new Rectangle(0, 0, 480, 320)
      application.stage.on('pointermove', (event) => {
        if (visualState !== null && !isFinishing) {
          visualState = moveMochiForMinigame(visualState, event.global)
          renderMinigame()
        }
      })
      application.ticker.add(updateMinigame)
    },
    destroy: () => {
      application.ticker.remove(updateMinigame)
      if (resultTimeout !== undefined) {
        clearTimeout(resultTimeout)
      }
      releasePetInteraction?.()
      application.destroy(
        { removeView: false },
        { children: true, texture: true, textureSource: true },
      )
    },
  }
}

export function PixiScene({
  onCommand,
  isMinigameActive = isMinigameInactive,
  getActiveMinigame = () => null,
  onHeartCaptured = () => undefined,
  onMinigameFinished = () => undefined,
  getPetVisualState = getNormalPetVisualState,
}: PixiSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [sceneState, setSceneState] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    setSceneState('loading')

    const lifecycle = createPixiSceneLifecycle(
      {
        appendChild: (view) => {
          host.appendChild(view as Node)
        },
        removeChild: (view) => {
          host.removeChild(view as Node)
        },
      },
      () => createApplication(
        onCommand,
        isMinigameActive,
        getActiveMinigame,
        onHeartCaptured,
        onMinigameFinished,
        getPetVisualState,
      ),
    )
    let isMounted = true
    void lifecycle.start()
      .then((started) => {
        if (isMounted) {
          setSceneState(started ? 'ready' : 'error')
        }
      })
      .catch((error: unknown) => {
        if (import.meta.env.DEV) {
          console.error('No se pudo inicializar la escena de Pixi.', error)
        }
        if (isMounted && lifecycle.getState() === 'error') {
          setSceneState('error')
        }
        lifecycle.destroy()
      })

    return () => {
      isMounted = false
      lifecycle.destroy()
    }
  }, [getActiveMinigame, getPetVisualState, isMinigameActive, onCommand, onHeartCaptured, onMinigameFinished])

  const statusMessage = getPixiSceneStatusMessage(sceneState)

  return (
    <div
      aria-busy={sceneState === 'loading'}
      aria-label="Escena jugable de Mochi"
      className="relative w-full overflow-hidden bg-[#fff0f5]"
      data-initialization-error={sceneState === 'error' || undefined}
      data-scene-state={sceneState}
      role="region"
      style={{ aspectRatio: playableAreaAspectRatio }}
    >
      <div ref={hostRef} className="pixi-scene-host size-full" />
      {statusMessage === null ? null : (
        <p
          aria-live="polite"
          className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-bold text-[#8a5a6e]"
          role={sceneState === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </p>
      )}
    </div>
  )
}
