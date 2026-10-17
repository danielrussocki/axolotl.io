import { describe, expect, it } from 'vitest'
import { createBrowserAudioAdapter, type AudioElementPort } from './browserAudioAdapter'

type FakeAudioElement = AudioElementPort & { playCalls: number; pauseCalls: number }

const createAudioElement = (): FakeAudioElement => ({
  loop: false,
  currentTime: 4,
  playCalls: 0,
  pauseCalls: 0,
  play: async function () {
    this.playCalls += 1
  },
  pause: function () {
    this.pauseCalls += 1
  },
})

describe('createBrowserAudioAdapter', () => {
  it('inicia la música activada y permite detenerla y reanudarla durante la sesión', async () => {
    const music = createAudioElement()
    const adapter = createBrowserAudioAdapter({
      musicSource: '/audio/music.mp3',
      createAudio: () => music,
    })

    await adapter.startMusic()
    await adapter.stopMusic()
    await adapter.startMusic()

    expect(music.loop).toBe(true)
    expect(music.playCalls).toBe(2)
    expect(music.pauseCalls).toBe(1)
    expect(music.currentTime).toBe(0)
  })

  it('reproduce efectos configurados sin reutilizar la música', async () => {
    const created: FakeAudioElement[] = []
    const adapter = createBrowserAudioAdapter({
      musicSource: '/audio/music.mp3',
      effectSources: { feed: '/audio/feed.mp3' },
      createAudio: (source) => {
        const audio = createAudioElement()
        created.push(audio)
        expect(source).toBe(created.length === 1 ? '/audio/music.mp3' : '/audio/feed.mp3')
        return audio
      },
    })

    await adapter.playEffect('feed')

    expect(created).toHaveLength(2)
    expect(created[0].playCalls).toBe(0)
    expect(created[1].playCalls).toBe(1)
  })

  it('absorbe bloqueos de reproducción para que el audio no bloquee la sesión', async () => {
    const blockedAudio: AudioElementPort = {
      loop: false,
      currentTime: 0,
      play: async () => Promise.reject(new Error('Autoplay bloqueado')),
      pause: () => {},
    }
    const adapter = createBrowserAudioAdapter({
      musicSource: '/audio/music.mp3',
      effectSources: { feed: '/audio/feed.mp3' },
      createAudio: () => blockedAudio,
    })

    await expect(adapter.startMusic()).resolves.toBeUndefined()
    await expect(adapter.playEffect('feed')).resolves.toBeUndefined()
    await expect(adapter.stopMusic()).resolves.toBeUndefined()
  })
})
