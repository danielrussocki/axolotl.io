import { describe, expect, it } from 'vitest'

import type { ActionQueue, QueuedAction } from './contracts'
import {
  createInitialActionQueue,
  enqueueAction,
  enqueueActionWithOverflow,
  markActionStatus,
  removeQueuedAction,
  selectNextProcessableAction,
  setQueueLimit,
  setQueueLimitWithOverflow,
} from './queue'
import { createInitialPetState } from './pet'

const createQueue = (): ActionQueue => ({
  limit: 20,
  isVisible: true,
  items: [],
})

const feedAction: Omit<QueuedAction, 'status'> = {
  id: 'action-feed',
  type: 'feed',
  createdAtMs: 10_000,
  source: 'local',
}

describe('operaciones básicas de cola', () => {
  it('añade acciones pendientes al final de la cola sin mutar la original', () => {
    const queue = createQueue()

    const updatedQueue = enqueueAction(queue, feedAction)

    expect(updatedQueue.items).toEqual([{ ...feedAction, status: 'pending' }])
    expect(queue.items).toEqual([])
  })

  it.each<QueuedAction['status']>(['pending', 'executing', 'waiting-energy'])(
    'marca una acción como %s',
    (status) => {
      const queue = enqueueAction(createQueue(), feedAction)

      const updatedQueue = markActionStatus(queue, feedAction.id, status)

      expect(updatedQueue.items[0]).toEqual({ ...feedAction, status })
      expect(queue.items[0]?.status).toBe('pending')
    },
  )

  it('retira una acción por su identificador y conserva las demás en orden', () => {
    const queue = enqueueAction(
      enqueueAction(createQueue(), feedAction),
      { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
    )

    const updatedQueue = removeQueuedAction(queue, feedAction.id)

    expect(updatedQueue.items).toEqual([
      {
        ...feedAction,
        id: 'action-clean',
        type: 'clean',
        createdAtMs: 11_000,
        status: 'pending',
      },
    ])
    expect(queue.items).toHaveLength(2)
  })
})

describe('límite configurable de cola', () => {
  it('crea una cola visible con límite predeterminado de 20 acciones', () => {
    expect(createInitialActionQueue()).toEqual({
      limit: 20,
      isVisible: true,
      items: [],
    })
  })

  it.each([0, 1, 20, 200])('acepta el límite %i', (limit) => {
    const updatedQueue = setQueueLimit(createQueue(), limit)

    expect(updatedQueue.limit).toBe(limit)
  })

  it('admite 200 acciones pendientes sin descartar ninguna', () => {
    let queue = setQueueLimit(createQueue(), 200)

    for (let index = 0; index < 200; index += 1) {
      queue = enqueueAction(queue, {
        ...feedAction,
        id: `action-${index}`,
        createdAtMs: 10_000 + index,
      })
    }

    expect(queue.items).toHaveLength(200)
    expect(queue.items[0]?.id).toBe('action-0')
    expect(queue.items[199]?.id).toBe('action-199')
  })

  it.each([-1, 201])('rechaza el límite fuera del rango permitido: %i', (limit) => {
    expect(() => setQueueLimit(createQueue(), limit)).toThrow(RangeError)
  })

  it('rechaza nuevas acciones cuando el límite es cero', () => {
    const queue = setQueueLimit(createQueue(), 0)

    const updatedQueue = enqueueAction(queue, feedAction)

    expect(updatedQueue).toBe(queue)
    expect(updatedQueue.items).toEqual([])
  })

  it('no descarta acciones ni modifica la cola al encolar con límite cero', () => {
    const queue = setQueueLimit(createQueue(), 0)

    const result = enqueueActionWithOverflow(queue, feedAction)

    expect(result).toEqual({ queue, droppedActions: [] })
  })
})

describe('desborde y reducción del límite de cola', () => {
  it('descarta la acción pendiente más próxima al llenarse e informa cuál fue eliminada', () => {
    const queue = setQueueLimit(
      enqueueAction(
        enqueueAction(createQueue(), feedAction),
        { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
      ),
      2,
    )

    const result = enqueueActionWithOverflow(queue, {
      ...feedAction,
      id: 'action-pet',
      type: 'pet',
      createdAtMs: 12_000,
    })

    expect(result.droppedActions).toEqual([{ ...feedAction, status: 'pending' }])
    expect(result.queue.items.map((action) => action.id)).toEqual(['action-clean', 'action-pet'])
    expect(queue.items.map((action) => action.id)).toEqual(['action-feed', 'action-clean'])
  })

  it('descarta primero las acciones pendientes más próximas al reducir el límite e informa todas las eliminadas', () => {
    const queue = enqueueAction(
      enqueueAction(
        enqueueAction(createQueue(), feedAction),
        { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
      ),
      { ...feedAction, id: 'action-pet', type: 'pet', createdAtMs: 12_000 },
    )

    const result = setQueueLimitWithOverflow(queue, 1)

    expect(result.droppedActions.map((action) => action.id)).toEqual(['action-feed', 'action-clean'])
    expect(result.queue).toEqual({
      limit: 1,
      isVisible: true,
      items: [{ ...feedAction, id: 'action-pet', type: 'pet', createdAtMs: 12_000, status: 'pending' }],
    })
    expect(queue.items).toHaveLength(3)
  })
})

describe('selección de la siguiente acción procesable', () => {
  it('selecciona la primera acción pendiente y conserva el orden de llegada', () => {
    const queue = enqueueAction(
      enqueueAction(createQueue(), feedAction),
      { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
    )

    const result = selectNextProcessableAction(queue, createInitialPetState())

    expect(result.action).toEqual({ ...feedAction, status: 'executing' })
    expect(result.queue.items.map((action) => ({ id: action.id, status: action.status }))).toEqual([
      { id: 'action-feed', status: 'executing' },
      { id: 'action-clean', status: 'pending' },
    ])
  })

  it('despierta a Mochi antes de ejecutar una acción distinta de dormir', () => {
    const queue = enqueueAction(createQueue(), feedAction)
    const sleepingPet = { ...createInitialPetState(), isSleeping: true }

    const result = selectNextProcessableAction(queue, sleepingPet)

    expect(result.action).toEqual({ ...feedAction, status: 'executing' })
    expect(result.pet.isSleeping).toBe(false)
    expect(sleepingPet.isSleeping).toBe(true)
  })

  it('no despierta a Mochi automáticamente cuando la siguiente acción es dormir', () => {
    const queue = enqueueAction(createQueue(), { ...feedAction, id: 'action-sleep', type: 'sleep' })
    const sleepingPet = { ...createInitialPetState(), isSleeping: true }

    const result = selectNextProcessableAction(queue, sleepingPet)

    expect(result.action).toEqual({ ...feedAction, id: 'action-sleep', type: 'sleep', status: 'executing' })
    expect(result.pet.isSleeping).toBe(true)
    expect(result.pet).toBe(sleepingPet)
  })

  it.each([
    { isActionAnimationActive: true, isMinigameActive: false },
    { isActionAnimationActive: false, isMinigameActive: true },
  ])('espera mientras hay una animación o minijuego activo', (activity) => {
    const queue = enqueueAction(createQueue(), feedAction)

    const result = selectNextProcessableAction(queue, createInitialPetState(), activity)

    expect(result.action).toBeNull()
    expect(result.queue).toBe(queue)
  })

  it('espera una acción ya en ejecución antes de seleccionar otra', () => {
    const queue = enqueueAction(
      markActionStatus(enqueueAction(createQueue(), feedAction), feedAction.id, 'executing'),
      { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
    )

    const result = selectNextProcessableAction(queue, createInitialPetState())

    expect(result.action).toBeNull()
    expect(result.queue).toBe(queue)
  })

  it('aplaza un juego sin energía y ejecuta una acción posterior independiente', () => {
    const queue = enqueueAction(
      enqueueAction(createQueue(), { ...feedAction, id: 'action-play', type: 'play' }),
      { ...feedAction, id: 'action-clean', type: 'clean', createdAtMs: 11_000 },
    )
    const pet = createInitialPetState()
    pet.needs.energy = 11

    const result = selectNextProcessableAction(queue, pet)

    expect(result.action).toEqual({
      ...feedAction,
      id: 'action-clean',
      type: 'clean',
      createdAtMs: 11_000,
      status: 'executing',
    })
    expect(result.queue.items.map((action) => ({ id: action.id, status: action.status }))).toEqual([
      { id: 'action-play', status: 'waiting-energy' },
      { id: 'action-clean', status: 'executing' },
    ])
  })

  it('mantiene el juego en espera cuando no hay acciones independientes posteriores', () => {
    const queue = enqueueAction(createQueue(), { ...feedAction, id: 'action-play', type: 'play' })
    const pet = createInitialPetState()
    pet.needs.energy = 11

    const result = selectNextProcessableAction(queue, pet)

    expect(result.action).toBeNull()
    expect(result.queue.items).toEqual([
      { ...feedAction, id: 'action-play', type: 'play', status: 'waiting-energy' },
    ])
  })

  it('vuelve a seleccionar un juego en espera cuando Mochi recupera energía', () => {
    const queue = markActionStatus(
      enqueueAction(createQueue(), { ...feedAction, id: 'action-play', type: 'play' }),
      'action-play',
      'waiting-energy',
    )
    const pet = createInitialPetState()
    pet.needs.energy = 12

    const result = selectNextProcessableAction(queue, pet)

    expect(result.action).toEqual({ ...feedAction, id: 'action-play', type: 'play', status: 'executing' })
    expect(result.queue.items[0]?.status).toBe('executing')
  })
})
