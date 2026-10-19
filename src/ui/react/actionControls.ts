import type { ActionCommand } from '../../application/contracts'
import type { ActionType } from '../../domain/contracts'

/** Crea comandos de acciones locales sin introducir reglas de juego en React. */
export const createActionCommand = (
  type: ActionType,
  id: string,
  createdAtMs: number,
): ActionCommand => ({
  type,
  id,
  createdAtMs,
  source: 'local',
})

/** La preferencia de música pertenece únicamente a la sesión de interfaz. */
export const getNextMusicEnabled = (isMusicEnabled: boolean): boolean => !isMusicEnabled
