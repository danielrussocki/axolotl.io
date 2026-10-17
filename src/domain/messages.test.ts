import { describe, expect, it } from 'vitest'

import type { Message } from '../application/contracts'
import { getMessageText } from './messages'

describe('catálogo de mensajes', () => {
  it('traduce al español los mensajes de acciones y sueño', () => {
    expect(getMessageText({ key: 'action-completed', parameters: { actionType: 'feed' } })).toBe(
      'Mochi ha comido.',
    )
    expect(getMessageText({ key: 'action-completed', parameters: { actionType: 'clean' } })).toBe(
      'Mochi está limpio.',
    )
    expect(getMessageText({ key: 'action-completed', parameters: { actionType: 'pet' } })).toBe(
      'A Mochi le encantan las caricias.',
    )
    expect(getMessageText({ key: 'action-completed', parameters: { actionType: 'play' } })).toBe(
      'Mochi está listo para jugar.',
    )
    expect(getMessageText({ key: 'pet-sleeping' })).toBe('Mochi se ha dormido.')
    expect(getMessageText({ key: 'pet-awake' })).toBe('Mochi se ha despertado.')
  })

  it('traduce los avisos de cola, recuperación y sesión', () => {
    const messages: Array<[Message, string]> = [
      [{ key: 'energy-insufficient' }, 'Mochi necesita al menos 12 de energía para jugar.'],
      [{ key: 'queue-disabled' }, 'La cola está desactivada.'],
      [{ key: 'action-dropped', parameters: { actionType: 'play' } }, 'Se descartó la acción Jugar.'],
      [{ key: 'progress-invalid' }, 'El progreso guardado no es válido. Mochi ha empezado de nuevo.'],
      [{ key: 'progress-save-failed' }, 'No se pudo guardar el progreso. Puedes seguir jugando.'],
      [{ key: 'session-blocked' }, 'Ya hay una sesión de Mochi abierta. Recarga esta pestaña para jugar.'],
    ]

    for (const [message, text] of messages) {
      expect(getMessageText(message)).toBe(text)
    }
  })

  it('incluye los mensajes auxiliares definidos por los contratos', () => {
    expect(getMessageText({ key: 'audio-unavailable' })).toBe('El audio no está disponible en este momento.')
    expect(getMessageText({ key: 'reset-confirmation-requested' })).toBe(
      '¿Quieres conservar las acciones pendientes al reiniciar?',
    )
  })
})
