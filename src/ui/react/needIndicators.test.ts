import { describe, expect, it } from 'vitest'

import { getNeedIndicator, needIndicators } from './needIndicators'

describe('needIndicators', () => {
  it('asocia cada necesidad con el control que la atiende', () => {
    expect(needIndicators).toEqual([
      { key: 'hunger', label: 'Hambre', icon: '🍓', controlLabel: 'Alimentar' },
      { key: 'happiness', label: 'Felicidad', icon: '💖', controlLabel: 'Acariciar' },
      { key: 'cleanliness', label: 'Limpieza', icon: '🧼', controlLabel: 'Limpiar' },
      { key: 'energy', label: 'Energía', icon: '✨', controlLabel: 'Dormir' },
    ])
  })

  it('resalta necesidades en 20 o menos, pero no valores superiores', () => {
    expect(getNeedIndicator('hunger', 20).isLow).toBe(true)
    expect(getNeedIndicator('happiness', 0).isLow).toBe(true)
    expect(getNeedIndicator('cleanliness', 20.01).isLow).toBe(false)
    expect(getNeedIndicator('energy', 100).isLow).toBe(false)
  })
})
