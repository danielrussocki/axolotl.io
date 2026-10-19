import type { PixiSceneLifecycleState } from './pixiSceneLifecycle'

export const playableAreaAspectRatio = 480 / 320

export function getPixiSceneStatusMessage(
  state: Extract<PixiSceneLifecycleState, 'loading' | 'ready' | 'error'>,
): string | null {
  switch (state) {
    case 'loading':
      return 'Cargando la escena jugable de Mochi…'
    case 'error':
      return 'No se pudo iniciar la escena jugable. Puedes seguir usando los controles de Mochi.'
    case 'ready':
      return null
  }
}
