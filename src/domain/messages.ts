import type { Message, MessageKey } from '../application/contracts'
import type { ActionType } from './contracts'

const actionNames: Record<ActionType, string> = {
  feed: 'Alimentar',
  clean: 'Limpiar',
  pet: 'Acariciar',
  play: 'Jugar',
  sleep: 'Dormir',
}

const completedActionMessages: Record<ActionType, string> = {
  feed: 'Mochi ha comido.',
  clean: 'Mochi está limpio.',
  pet: 'A Mochi le encantan las caricias.',
  play: 'Mochi está listo para jugar.',
  sleep: 'Mochi ha cambiado su descanso.',
}

const staticMessages: Record<Exclude<MessageKey, 'action-completed' | 'action-dropped'>, string> = {
  'audio-unavailable': 'El audio no está disponible en este momento.',
  'energy-insufficient': 'Mochi necesita al menos 12 de energía para jugar.',
  'pet-awake': 'Mochi se ha despertado.',
  'pet-sleeping': 'Mochi se ha dormido.',
  'progress-invalid': 'El progreso guardado no es válido. Mochi ha empezado de nuevo.',
  'progress-save-failed': 'No se pudo guardar el progreso. Puedes seguir jugando.',
  'queue-disabled': 'La cola está desactivada.',
  'reset-confirmation-requested': '¿Quieres conservar las acciones pendientes al reiniciar?',
  'session-blocked': 'Ya hay una sesión de Mochi abierta. Recarga esta pestaña para jugar.',
}

/** Traduce una clave de mensaje del juego a texto visible en español. */
export const getMessageText = (message: Message): string => {
  if (message.key === 'action-completed') {
    const actionType = getActionType(message)
    return actionType === null ? 'Mochi ha terminado una acción.' : completedActionMessages[actionType]
  }

  if (message.key === 'action-dropped') {
    const actionType = getActionType(message)
    return actionType === null ? 'Se descartó una acción de la cola.' : `Se descartó la acción ${actionNames[actionType]}.`
  }

  return staticMessages[message.key]
}

const getActionType = (message: Message): ActionType | null => {
  const actionType = message.parameters?.actionType ?? message.parameters?.type

  return typeof actionType === 'string' && actionType in actionNames ? (actionType as ActionType) : null
}
