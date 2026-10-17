import { describe, expect, it } from 'vitest'

import { calculateElapsedTimeMs } from './time'

describe('cálculo de tiempo transcurrido', () => {
  it('calcula una ausencia normal al volver desde segundo plano', () => {
    const lastProgressMs = 1_000
    const currentTimeMs = lastProgressMs + 90 * 1_000

    expect(calculateElapsedTimeMs(lastProgressMs, currentTimeMs)).toBe(90 * 1_000)
  })

  it('conserva exactamente 24 horas de ausencia', () => {
    const lastProgressMs = 1_000
    const currentTimeMs = lastProgressMs + 24 * 60 * 60 * 1_000

    expect(calculateElapsedTimeMs(lastProgressMs, currentTimeMs)).toBe(24 * 60 * 60 * 1_000)
  })

  it('limita a 24 horas una ausencia superior al máximo', () => {
    const lastProgressMs = 1_000
    const currentTimeMs = lastProgressMs + 48 * 60 * 60 * 1_000

    expect(calculateElapsedTimeMs(lastProgressMs, currentTimeMs)).toBe(24 * 60 * 60 * 1_000)
  })

  it('devuelve cero sin deterioro cuando el reloj retrocede', () => {
    expect(calculateElapsedTimeMs(2_000, 1_000)).toBe(0)
  })
})
