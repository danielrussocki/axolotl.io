import { describe, expect, it } from 'vitest'

import {
  captureHeart,
  hasEnoughEnergyForMinigame,
  isMinigameFinished,
  minigameDurationMs,
  resolveMinigame,
  startMinigame,
} from './minigame'
import { createInitialPetState } from './pet'

describe('minijuego de Mochi', () => {
  it('inicia un minijuego con una duración de cinco segundos y ningún corazón', () => {
    const minigame = startMinigame(10_000)

    expect(minigame).toEqual({
      startedAtMs: 10_000,
      capturedHearts: 0,
    })
    expect(minigameDurationMs).toBe(5_000)
    expect(isMinigameFinished(minigame, 14_999)).toBe(false)
  })

  it('registra cada corazón atrapado sin mutar el estado activo', () => {
    const minigame = startMinigame(10_000)

    expect(captureHeart(captureHeart(minigame))).toEqual({
      startedAtMs: 10_000,
      capturedHearts: 2,
    })
    expect(minigame.capturedHearts).toBe(0)
  })

  it('resuelve el minijuego al terminar los cinco segundos e informa los corazones', () => {
    const minigame = captureHeart(captureHeart(startMinigame(10_000)))

    expect(resolveMinigame(minigame, 14_999)).toBeNull()
    expect(resolveMinigame(minigame, 15_000)).toEqual({ capturedHearts: 2 })
  })

  it('solo permite iniciar el minijuego con al menos 12 de energía', () => {
    const pet = createInitialPetState()

    expect(hasEnoughEnergyForMinigame({ ...pet, needs: { ...pet.needs, energy: 11 } })).toBe(false)
    expect(hasEnoughEnergyForMinigame({ ...pet, needs: { ...pet.needs, energy: 12 } })).toBe(true)
  })

  it('resuelve el minijuego al volver de segundo plano cuando ya transcurrieron cinco segundos', () => {
    const minigame = captureHeart(captureHeart(captureHeart(startMinigame(10_000))))

    expect(resolveMinigame(minigame, 15_000)).toEqual({ capturedHearts: 3 })
  })
})
