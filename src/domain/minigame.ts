import type { MinigameResult, MinigameState, PetState } from './contracts'

/** Duración fija del minijuego de atrapar corazones. */
export const minigameDurationMs = 5_000
const minimumEnergyToStartMinigame = 12

/** Indica si Mochi tiene la energía mínima para iniciar el minijuego. */
export const hasEnoughEnergyForMinigame = (pet: PetState): boolean =>
  pet.needs.energy >= minimumEnergyToStartMinigame

/** Crea el estado temporal de un nuevo minijuego. */
export const startMinigame = (startedAtMs: number): MinigameState => ({
  startedAtMs,
  capturedHearts: 0,
})

/** Registra un corazón atrapado sin mutar el minijuego activo. */
export const captureHeart = (minigame: MinigameState): MinigameState => ({
  ...minigame,
  capturedHearts: minigame.capturedHearts + 1,
})

/** Indica si ha transcurrido la duración completa del minijuego. */
export const isMinigameFinished = (minigame: MinigameState, currentTimeMs: number): boolean =>
  currentTimeMs - minigame.startedAtMs >= minigameDurationMs

/** Devuelve el resultado solo cuando el minijuego ha terminado. */
export const resolveMinigame = (
  minigame: MinigameState,
  currentTimeMs: number,
): MinigameResult | null => {
  if (!isMinigameFinished(minigame, currentTimeMs)) {
    return null
  }

  return { capturedHearts: minigame.capturedHearts }
}
