import type { ActionType, QueuedActionStatus } from '../../domain/contracts'

const actionLabels: Record<ActionType, string> = {
  feed: 'Alimentar',
  clean: 'Limpiar',
  pet: 'Acariciar',
  play: 'Jugar',
  sleep: 'Dormir',
}

const statusLabels: Record<QueuedActionStatus, string> = {
  pending: 'Pendiente',
  executing: 'En ejecución',
  'waiting-energy': 'En espera por energía',
}

/** Traduce el tipo persistido de una acción para la lista de la interfaz. */
export const getQueueActionLabel = (type: ActionType): string => actionLabels[type]

/** Traduce el estado persistido de una acción para la lista de la interfaz. */
export const getQueueStatusLabel = (status: QueuedActionStatus): string => statusLabels[status]

/** Genera el texto del control que alterna la visibilidad de la lista. */
export const getQueueVisibilityLabel = (isVisible: boolean): string =>
  isVisible ? 'Ocultar cola' : 'Mostrar cola'

/** Ignora valores incompletos o fuera del rango que el dominio admite. */
export const getQueueLimitUpdate = (value: string): number | null => {
  if (value.trim() === '') {
    return null
  }

  const limit = Number(value)
  return Number.isInteger(limit) && limit >= 0 && limit <= 200 ? limit : null
}
