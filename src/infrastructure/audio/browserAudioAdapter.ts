import type { AudioPort } from '../../application/contracts'

/** Superficie mínima de Audio para aislar el adaptador de la implementación del navegador. */
export interface AudioElementPort {
  loop: boolean
  currentTime: number
  play(): Promise<void>
  pause(): void
}

export interface BrowserAudioAdapterOptions {
  musicSource: string
  effectSources?: Readonly<Record<string, string>>
  createAudio?: (source: string) => AudioElementPort
}

/**
 * Adapta el audio del navegador sin propagar restricciones de autoplay ni
 * fallos del elemento multimedia hacia las reglas o el controlador del juego.
 */
export const createBrowserAudioAdapter = ({
  musicSource,
  effectSources = {},
  createAudio = createBrowserAudio,
}: BrowserAudioAdapterOptions): AudioPort => {
  const music = createAudio(musicSource)
  music.loop = true

  return {
    startMusic: async () => {
      await playSafely(music)
    },
    stopMusic: async () => {
      try {
        music.pause()
        music.currentTime = 0
      } catch {
        // Un elemento de audio no disponible no debe bloquear la sesión.
      }
    },
    playEffect: async (effect) => {
      const source = effectSources[effect]
      if (source === undefined) {
        return
      }

      try {
        await playSafely(createAudio(source))
      } catch {
        // Una fábrica externa defectuosa tampoco debe interrumpir el juego.
      }
    },
  }
}

const createBrowserAudio = (source: string): AudioElementPort => {
  if (typeof Audio === 'undefined') {
    return createSilentAudio()
  }

  return new Audio(source)
}

const createSilentAudio = (): AudioElementPort => ({
  loop: false,
  currentTime: 0,
  play: async () => {},
  pause: () => {},
})

const playSafely = async (audio: AudioElementPort): Promise<void> => {
  try {
    await audio.play()
  } catch {
    // Los navegadores pueden rechazar la reproducción automática.
  }
}
