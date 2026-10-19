import { describe, expect, it } from 'vitest'

import { getQueueActionLabel, getQueueLimitUpdate, getQueueStatusLabel, getQueueVisibilityLabel } from './queueControls'

describe('queue controls', () => {
  it.each([
    ['feed', 'Alimentar'],
    ['clean', 'Limpiar'],
    ['pet', 'Acariciar'],
    ['play', 'Jugar'],
    ['sleep', 'Dormir'],
  ] as const)('shows the Spanish label for %s actions', (type, expectedLabel) => {
    expect(getQueueActionLabel(type)).toBe(expectedLabel)
  })

  it.each([
    ['pending', 'Pendiente'],
    ['executing', 'En ejecución'],
    ['waiting-energy', 'En espera por energía'],
  ] as const)('shows the Spanish label for %s actions', (status, expectedLabel) => {
    expect(getQueueStatusLabel(status)).toBe(expectedLabel)
  })

  it('describes both queue visibility states', () => {
    expect(getQueueVisibilityLabel(true)).toBe('Ocultar cola')
    expect(getQueueVisibilityLabel(false)).toBe('Mostrar cola')
  })

  it('accepts only whole queue limits in the supported range', () => {
    expect(getQueueLimitUpdate('0')).toBe(0)
    expect(getQueueLimitUpdate('20')).toBe(20)
    expect(getQueueLimitUpdate('200')).toBe(200)
    expect(getQueueLimitUpdate('')).toBeNull()
    expect(getQueueLimitUpdate('4.5')).toBeNull()
    expect(getQueueLimitUpdate('-1')).toBeNull()
    expect(getQueueLimitUpdate('201')).toBeNull()
  })
})
