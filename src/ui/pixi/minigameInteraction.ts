export interface ScenePoint {
  x: number
  y: number
}

export interface VisualHeart extends ScenePoint {
  id: string
  velocityY: number
}

export interface MinigameVisualState {
  mochiPosition: ScenePoint
  hearts: VisualHeart[]
  spawnElapsedMs: number
  nextHeartId: number
}

export interface MinigameAdvanceResult {
  state: MinigameVisualState
  capturedHeartIds: string[]
}

export const restingMochiPosition: ScenePoint = { x: 240, y: 174 }

const playableBounds = { minX: 36, maxX: 444, minY: 70, maxY: 240 }
const heartSpawnIntervalMs = 450
const heartCaptureDistance = 30
const heartFallSpeed = 105

/** Crea una ronda visual nueva; la posición de reposo nunca se conserva. */
export function createMinigameVisualState(_previousState?: MinigameVisualState): MinigameVisualState {
  return {
    mochiPosition: { ...restingMochiPosition },
    hearts: [],
    spawnElapsedMs: 0,
    nextHeartId: 0,
  }
}

/** Los eventos de ratón y táctil de Pixi se normalizan como una misma posición. */
export function moveMochiForMinigame(
  state: MinigameVisualState,
  pointer: ScenePoint,
): MinigameVisualState {
  return {
    ...state,
    mochiPosition: {
      x: clamp(pointer.x, playableBounds.minX, playableBounds.maxX),
      y: clamp(pointer.y, playableBounds.minY, playableBounds.maxY),
    },
  }
}

/** Avanza corazones y devuelve las capturas sin aplicar reglas de mascota. */
export function advanceMinigameVisualState(
  state: MinigameVisualState,
  elapsedMs: number,
  random: () => number = Math.random,
): MinigameAdvanceResult {
  const safeElapsedMs = Math.max(0, elapsedMs)
  let spawnElapsedMs = state.spawnElapsedMs + safeElapsedMs
  let nextHeartId = state.nextHeartId
  const hearts = state.hearts.map((heart) => ({
    ...heart,
    y: heart.y + heart.velocityY * (safeElapsedMs / 1_000),
  }))

  while (spawnElapsedMs >= heartSpawnIntervalMs) {
    spawnElapsedMs -= heartSpawnIntervalMs
    hearts.push({
      id: `heart-${nextHeartId++}`,
      x: playableBounds.minX + random() * (playableBounds.maxX - playableBounds.minX),
      y: 42,
      velocityY: heartFallSpeed,
    })
  }

  const capturedHeartIds: string[] = []
  const remainingHearts = hearts.filter((heart) => {
    const distance = Math.hypot(
      heart.x - state.mochiPosition.x,
      heart.y - state.mochiPosition.y,
    )
    const isCaptured = distance < heartCaptureDistance

    if (isCaptured) {
      capturedHeartIds.push(heart.id)
    }

    return !isCaptured && heart.y < 290
  })

  return {
    state: {
      mochiPosition: state.mochiPosition,
      hearts: remainingHearts,
      spawnElapsedMs,
      nextHeartId,
    },
    capturedHeartIds,
  }
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value))
