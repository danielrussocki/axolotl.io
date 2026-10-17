import { describe, expect, it } from 'vitest'

import type { GameState } from '../../domain/contracts'
import {
  CURRENT_PERSISTED_FORMAT_VERSION,
  migratePersistedSnapshot,
  restoreGameState,
  serializeGameState,
  validatePersistedSnapshot,
} from './snapshot'

const createValidSnapshot = () => ({
  formatVersion: CURRENT_PERSISTED_FORMAT_VERSION,
  savedAtMs: 1_792_180_800_000,
  pet: {
    needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 75 },
    isSleeping: false,
    needsCleaning: false,
    hungrySinceMs: null,
  },
  queue: {
    limit: 20,
    isVisible: true,
    items: [
      { id: 'action-001', type: 'feed', createdAtMs: 1_792_180_798_000, status: 'pending' },
      { id: 'action-002', type: 'play', createdAtMs: 1_792_180_799_000, status: 'waiting-energy' },
    ],
  },
})

describe('serialización y restauración de progreso', () => {
  const gameState: GameState = {
    pet: {
      needs: { hunger: 42, happiness: 57, cleanliness: 19, energy: 88 },
      isSleeping: true,
      needsCleaning: true,
      hungrySinceMs: 1_792_180_700_000,
    },
    queue: {
      limit: 7,
      isVisible: false,
      items: [
        { id: 'action-001', type: 'clean', createdAtMs: 1_792_180_798_000, source: 'live', status: 'pending' },
        {
          id: 'action-002',
          type: 'play',
          createdAtMs: 1_792_180_799_000,
          source: 'local',
          status: 'waiting-energy',
        },
      ],
    },
  }

  it('serializa el estado jugable sin efectos ni origen efímero', () => {
    expect(serializeGameState(gameState, 1_792_180_800_000)).toEqual({
      ...createValidSnapshot(),
      pet: gameState.pet,
      queue: {
        limit: 7,
        isVisible: false,
        items: [
          { id: 'action-001', type: 'clean', createdAtMs: 1_792_180_798_000, status: 'pending' },
          { id: 'action-002', type: 'play', createdAtMs: 1_792_180_799_000, status: 'waiting-energy' },
        ],
      },
    })
  })

  it('restaura necesidades, descanso, limpieza y la configuración completa de la cola', () => {
    const restoredState = restoreGameState(serializeGameState(gameState, 1_792_180_800_000))

    expect(restoredState).toEqual({
      ...gameState,
      queue: {
        ...gameState.queue,
        items: [
          { ...gameState.queue.items[0], source: 'local' },
          { ...gameState.queue.items[1], source: 'local' },
        ],
      },
    })
  })
})

describe('formato persistido versionado', () => {
  it('acepta una instantánea con versión, mascota, cola, preferencias y marca temporal válidas', () => {
    const snapshot = createValidSnapshot()

    expect(validatePersistedSnapshot(snapshot)).toEqual(snapshot)
  })

  it.each([
    ['sin versión', { ...createValidSnapshot(), formatVersion: undefined }],
    ['con versión no compatible', { ...createValidSnapshot(), formatVersion: 2 }],
    ['sin marca temporal', { ...createValidSnapshot(), savedAtMs: undefined }],
    ['con marca temporal no finita', { ...createValidSnapshot(), savedAtMs: Number.POSITIVE_INFINITY }],
    ['sin mascota', { ...createValidSnapshot(), pet: undefined }],
    ['sin cola', { ...createValidSnapshot(), queue: undefined }],
  ])('rechaza una instantánea %s', (_description, snapshot) => {
    expect(validatePersistedSnapshot(snapshot)).toBeNull()
  })
})

describe('migración de formatos persistidos', () => {
  it('migra una instantánea compatible de versión anterior sin perder el progreso', () => {
    const legacySnapshot = { ...createValidSnapshot(), formatVersion: 0 }

    expect(migratePersistedSnapshot(legacySnapshot)).toEqual(createValidSnapshot())
  })

  it('rechaza una instantánea de una versión sin migración registrada', () => {
    const unsupportedSnapshot = { ...createValidSnapshot(), formatVersion: 2 }

    expect(migratePersistedSnapshot(unsupportedSnapshot)).toBeNull()
  })
})

describe('validación de mascota persistida', () => {
  it.each([
    ['hambre menor que cero', { hunger: -1, happiness: 86, cleanliness: 82, energy: 75 }],
    ['felicidad mayor que cien', { hunger: 78, happiness: 101, cleanliness: 82, energy: 75 }],
    ['limpieza no numérica', { hunger: 78, happiness: 86, cleanliness: '82', energy: 75 }],
    ['energía no finita', { hunger: 78, happiness: 86, cleanliness: 82, energy: Number.NaN }],
  ])('rechaza necesidades con %s', (_description, needs) => {
    const snapshot = { ...createValidSnapshot(), pet: { ...createValidSnapshot().pet, needs } }

    expect(validatePersistedSnapshot(snapshot)).toBeNull()
  })

  it.each([
    ['isSleeping', { ...createValidSnapshot().pet, isSleeping: 'false' }],
    ['needsCleaning', { ...createValidSnapshot().pet, needsCleaning: 0 }],
    ['hungrySinceMs', { ...createValidSnapshot().pet, hungrySinceMs: 'now' }],
  ])('rechaza el campo de mascota inválido %s', (_field, pet) => {
    expect(validatePersistedSnapshot({ ...createValidSnapshot(), pet })).toBeNull()
  })
})

describe('validación de cola y preferencias persistidas', () => {
  it.each([-1, 200.5, 201])('rechaza el límite de cola fuera de rango: %s', (limit) => {
    const snapshot = { ...createValidSnapshot(), queue: { ...createValidSnapshot().queue, limit } }

    expect(validatePersistedSnapshot(snapshot)).toBeNull()
  })

  it.each([
    ['visibilidad no booleana', { ...createValidSnapshot().queue, isVisible: 'true' }],
    ['elementos que no son una lista', { ...createValidSnapshot().queue, items: {} }],
    [
      'acción sin identificador',
      { ...createValidSnapshot().queue, items: [{ type: 'feed', createdAtMs: 1, status: 'pending' }] },
    ],
    [
      'acción de tipo desconocido',
      { ...createValidSnapshot().queue, items: [{ id: 'action', type: 'dance', createdAtMs: 1, status: 'pending' }] },
    ],
    [
      'acción con fecha inválida',
      { ...createValidSnapshot().queue, items: [{ id: 'action', type: 'feed', createdAtMs: -1, status: 'pending' }] },
    ],
    [
      'acción con estado desconocido',
      { ...createValidSnapshot().queue, items: [{ id: 'action', type: 'feed', createdAtMs: 1, status: 'done' }] },
    ],
  ])('rechaza una cola con %s', (_description, queue) => {
    expect(validatePersistedSnapshot({ ...createValidSnapshot(), queue })).toBeNull()
  })
})
