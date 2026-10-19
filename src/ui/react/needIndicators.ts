import type { PetNeeds } from '../../domain/contracts'

export type NeedKey = keyof PetNeeds

export interface NeedIndicator {
  key: NeedKey
  label: string
  icon: string
  controlLabel: string
}

export const needIndicators: readonly NeedIndicator[] = [
  { key: 'hunger', label: 'Hambre', icon: '🍓', controlLabel: 'Alimentar' },
  { key: 'happiness', label: 'Felicidad', icon: '💖', controlLabel: 'Acariciar' },
  { key: 'cleanliness', label: 'Limpieza', icon: '🧼', controlLabel: 'Limpiar' },
  { key: 'energy', label: 'Energía', icon: '✨', controlLabel: 'Dormir' },
]

export const getNeedIndicator = (key: NeedKey, value: number) => ({
  ...needIndicators.find((indicator) => indicator.key === key)!,
  isLow: value <= 20,
})
