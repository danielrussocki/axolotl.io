import { describe, expect, it } from 'vitest'

import { createActionCommand, getNextMusicEnabled } from './actionControls'

describe('action controls', () => {
  it.each([
    ['feed', 'feed'],
    ['clean', 'clean'],
    ['pet', 'pet'],
    ['play', 'play'],
    ['sleep', 'sleep'],
  ] as const)('creates one local %s command', (actionType, expectedType) => {
    expect(createActionCommand(actionType, 'action-1', 1_000)).toEqual({
      type: expectedType,
      id: 'action-1',
      createdAtMs: 1_000,
      source: 'local',
    })
  })

  it('toggles the music choice only for the current session', () => {
    expect(getNextMusicEnabled(true)).toBe(false)
    expect(getNextMusicEnabled(false)).toBe(true)
  })
})
