import { describe, expect, it } from 'vitest'

import {
  playableAreaAspectRatio,
  getPixiSceneStatusMessage,
} from './pixiScenePresentation'

describe('pixiScenePresentation', () => {
  it('mantiene la proporción equivalente a un área jugable de 480 × 320', () => {
    expect(playableAreaAspectRatio).toBe(480 / 320)
  })

  it('muestra un estado de carga visible en español', () => {
    expect(getPixiSceneStatusMessage('loading')).toBe('Cargando la escena jugable de Mochi…')
  })

  it('muestra una alternativa visible en español si Pixi no puede iniciarse', () => {
    expect(getPixiSceneStatusMessage('error')).toBe(
      'No se pudo iniciar la escena jugable. Puedes seguir usando los controles de Mochi.',
    )
  })

  it('no cubre el canvas cuando la escena está lista', () => {
    expect(getPixiSceneStatusMessage('ready')).toBeNull()
  })
})
