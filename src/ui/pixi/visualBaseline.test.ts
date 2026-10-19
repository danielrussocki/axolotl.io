import { describe, expect, it } from 'vitest'

import { visualComparisonMatrix, visualReference } from './visualBaseline'

describe('línea base visual de referencia', () => {
  it('identifica el commit y las funciones Canvas 2D normativas', () => {
    expect(visualReference).toEqual({
      commit: '001a993',
      file: 'src/App.tsx',
      functions: ['drawMochi', 'drawRoomPattern'],
      logicalArea: { width: 480, height: 320 },
    })
  })

  it('define una comparación verificable para cada estado y efecto de referencia', () => {
    expect(visualComparisonMatrix.map((entry) => entry.id)).toEqual([
      'resting',
      'sleeping',
      'eating',
      'sad',
      'sick',
      'dirty',
      'particles',
      'minigame',
    ])

    for (const entry of visualComparisonMatrix) {
      expect(entry.referenceEvidence.length).toBeGreaterThan(0)
      expect(entry.acceptanceCriteria.length).toBeGreaterThan(0)
    }
  })
})
