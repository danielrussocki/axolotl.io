import { describe, expect, it } from 'vitest'

import {
  applyClean,
  applyDirt,
  applyFeed,
  applyPetNeedRates,
  applyPet,
  createInitialPetState,
  getPetVisualState,
  isPetSick,
  normalizePetNeeds,
  toggleSleep,
} from './pet'

describe('estado inicial y normalización de Mochi', () => {
  it('crea las necesidades iniciales definidas para una nueva mascota', () => {
    expect(createInitialPetState()).toEqual({
      needs: {
        hunger: 78,
        happiness: 86,
        cleanliness: 82,
        energy: 75,
      },
      isSleeping: false,
      needsCleaning: false,
      hungrySinceMs: null,
    })
  })

  it('limita cada necesidad al rango inclusivo de 0 a 100', () => {
    expect(
      normalizePetNeeds({
        hunger: -1,
        happiness: 101,
        cleanliness: -50,
        energy: 150,
      }),
    ).toEqual({
      hunger: 0,
      happiness: 100,
      cleanliness: 0,
      energy: 100,
    })
  })
})

describe('alimentación de Mochi', () => {
  it('aumenta el hambre en 30 y reduce la limpieza en 5 sin alterar el resto del estado', () => {
    const pet = {
      needs: {
        hunger: 50,
        happiness: 64,
        cleanliness: 40,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: true,
      hungrySinceMs: 500,
    }

    expect(applyFeed(pet)).toEqual({
      needs: {
        hunger: 80,
        happiness: 64,
        cleanliness: 35,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: true,
      hungrySinceMs: null,
    })
  })

  it('respeta los límites de hambre y limpieza', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 90,
        happiness: 86,
        cleanliness: 3,
        energy: 75,
      },
    }

    expect(applyFeed(pet).needs).toEqual({
      hunger: 100,
      happiness: 86,
      cleanliness: 0,
      energy: 75,
    })
  })
})

describe('limpieza y caricias de Mochi', () => {
  it('aumenta la limpieza en 40, la felicidad en 5 y elimina la suciedad pendiente', () => {
    const pet = {
      needs: {
        hunger: 42,
        happiness: 64,
        cleanliness: 35,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: true,
      hungrySinceMs: 500,
    }

    expect(applyClean(pet)).toEqual({
      needs: {
        hunger: 42,
        happiness: 69,
        cleanliness: 75,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: false,
      hungrySinceMs: 500,
    })
  })

  it('limita limpieza y felicidad al máximo al limpiar', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 42,
        happiness: 98,
        cleanliness: 75,
        energy: 71,
      },
      needsCleaning: true,
    }

    expect(applyClean(pet)).toMatchObject({
      needs: {
        hunger: 42,
        happiness: 100,
        cleanliness: 100,
        energy: 71,
      },
      needsCleaning: false,
    })
  })

  it('aumenta la felicidad en 15 sin alterar el resto del estado', () => {
    const pet = {
      needs: {
        hunger: 42,
        happiness: 64,
        cleanliness: 35,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: true,
      hungrySinceMs: 500,
    }

    expect(applyPet(pet)).toEqual({
      needs: {
        hunger: 42,
        happiness: 79,
        cleanliness: 35,
        energy: 71,
      },
      isSleeping: false,
      needsCleaning: true,
      hungrySinceMs: 500,
    })
  })

  it('limita la felicidad al máximo al acariciar', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 42,
        happiness: 90,
        cleanliness: 35,
        energy: 71,
      },
    }

    expect(applyPet(pet).needs).toEqual({
      hunger: 42,
      happiness: 100,
      cleanliness: 35,
      energy: 71,
    })
  })
})

describe('descanso de Mochi', () => {
  it('duerme a Mochi cuando está despierto', () => {
    const pet = createInitialPetState()

    expect(toggleSleep(pet)).toEqual({
      ...pet,
      isSleeping: true,
    })
  })

  it('despierta a Mochi cuando está dormido', () => {
    const pet = {
      ...createInitialPetState(),
      isSleeping: true,
    }

    expect(toggleSleep(pet)).toEqual({
      ...pet,
      isSleeping: false,
    })
  })
})

describe('deterioro y recuperación por segundo de Mochi', () => {
  it('aplica las cuatro tasas por segundo mientras está despierto', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 78,
        happiness: 86,
        cleanliness: 82,
        energy: 75,
      },
    }

    expect(applyPetNeedRates(pet, 1).needs).toEqual({
      hunger: 77.75,
      happiness: 85.85,
      cleanliness: 81.88,
      energy: 74.92,
    })
  })

  it('aplica las cuatro tasas por segundo mientras está dormido', () => {
    const pet = {
      ...createInitialPetState(),
      isSleeping: true,
      needs: {
        hunger: 78,
        happiness: 86,
        cleanliness: 82,
        energy: 75,
      },
    }

    expect(applyPetNeedRates(pet, 1).needs).toEqual({
      hunger: 77.95,
      happiness: 85.97,
      cleanliness: 81.98,
      energy: 77,
    })
  })

  it('escala las tasas por la cantidad de segundos y respeta los límites', () => {
    const pet = {
      ...createInitialPetState(),
      isSleeping: true,
      needs: {
        hunger: 1,
        happiness: 1,
        cleanliness: 1,
        energy: 99,
      },
    }

    expect(applyPetNeedRates(pet, 100).needs).toEqual({
      hunger: 0,
      happiness: 0,
      cleanliness: 0,
      energy: 100,
    })
  })
})

describe('despertar automático y hambre prolongada de Mochi', () => {
  it('despierta a Mochi cuando la recuperación durante el descanso alcanza 98 de energía', () => {
    const pet = {
      ...createInitialPetState(),
      isSleeping: true,
      needs: {
        hunger: 78,
        happiness: 86,
        cleanliness: 82,
        energy: 96,
      },
    }

    expect(applyPetNeedRates(pet, 1)).toMatchObject({
      isSleeping: false,
      needs: { energy: 98 },
    })
  })

  it('marca a Mochi como enfermo solo tras 30 segundos continuos con hambre en cero', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 0,
        happiness: 86,
        cleanliness: 82,
        energy: 75,
      },
      hungrySinceMs: 1_000,
    }

    expect(isPetSick(applyPetNeedRates(pet, 29.999, 30_999), 30_999)).toBe(false)
    expect(isPetSick(applyPetNeedRates(pet, 30, 31_000), 31_000)).toBe(true)
  })
})

describe('suciedad y estados visuales de Mochi', () => {
  it('genera una única necesidad de limpieza y aplica sus penalizaciones una sola vez', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 78,
        happiness: 50,
        cleanliness: 50,
        energy: 75,
      },
    }

    const dirtyPet = applyDirt(pet)

    expect(dirtyPet).toMatchObject({
      needs: { happiness: 44, cleanliness: 38 },
      needsCleaning: true,
    })
    expect(applyDirt(dirtyPet)).toEqual(dirtyPet)
  })

  it('no genera suciedad mientras Mochi duerme', () => {
    const pet = {
      ...createInitialPetState(),
      isSleeping: true,
    }

    expect(applyDirt(pet)).toEqual(pet)
  })

  it('deriva el estado visual de mayor prioridad cuando coinciden varias condiciones', () => {
    const pet = {
      ...createInitialPetState(),
      needs: {
        hunger: 0,
        happiness: 5,
        cleanliness: 5,
        energy: 75,
      },
      needsCleaning: true,
      hungrySinceMs: 0,
    }

    expect(getPetVisualState(pet, 30_000, true)).toBe('sick')
    expect(getPetVisualState({ ...pet, isSleeping: true }, 30_000, true)).toBe('sleeping')
    expect(getPetVisualState({ ...pet, hungrySinceMs: 1 }, 30_000, true)).toBe('sad')
    expect(
      getPetVisualState(
        {
          ...pet,
          needs: { hunger: 20, happiness: 10, cleanliness: 15, energy: 75 },
          hungrySinceMs: null,
        },
        30_000,
        true,
      ),
    ).toBe('dirty')
    expect(
      getPetVisualState(
        {
          ...pet,
          needs: { hunger: 20, happiness: 10, cleanliness: 20, energy: 75 },
          needsCleaning: false,
          hungrySinceMs: null,
        },
        30_000,
        true,
      ),
    ).toBe('eating')
  })
})

describe('reglas integradas de deterioro, descanso y prioridad visual', () => {
  it('aplica las tasas completas tras diez segundos despierto y dormido', () => {
    const awakePet = createInitialPetState()
    const sleepingPet = { ...awakePet, isSleeping: true }

    expect(applyPetNeedRates(awakePet, 10).needs).toEqual({
      hunger: 75.5,
      happiness: 84.5,
      cleanliness: 80.8,
      energy: 74.2,
    })
    expect(applyPetNeedRates(sleepingPet, 10).needs).toEqual({
      hunger: 77.5,
      happiness: 85.7,
      cleanliness: 81.8,
      energy: 95,
    })
  })

  it('despierta al alcanzar 98 de energía y enferma exactamente tras 30 segundos sin hambre', () => {
    const sleepingPet = {
      ...createInitialPetState(),
      isSleeping: true,
      needs: { hunger: 78, happiness: 86, cleanliness: 82, energy: 95 },
    }
    const hungryPet = {
      ...createInitialPetState(),
      needs: { hunger: 0, happiness: 86, cleanliness: 82, energy: 75 },
      hungrySinceMs: 10_000,
    }

    expect(applyPetNeedRates(sleepingPet, 1.5)).toMatchObject({
      isSleeping: false,
      needs: { energy: 98 },
    })
    expect(isPetSick(hungryPet, 39_999)).toBe(false)
    expect(isPetSick(hungryPet, 40_000)).toBe(true)
  })

  it('crea una sola suciedad despierto y no vuelve a penalizar hasta limpiarla', () => {
    const pet = {
      ...createInitialPetState(),
      needs: { hunger: 78, happiness: 20, cleanliness: 20, energy: 75 },
    }

    const afterFirstDirt = applyDirt(pet)

    expect(afterFirstDirt).toMatchObject({
      needs: { happiness: 14, cleanliness: 8 },
      needsCleaning: true,
    })
    expect(applyDirt(afterFirstDirt)).toEqual(afterFirstDirt)
  })

  it.each([
    ['sleeping', { isSleeping: true }, 0, true],
    [
      'sick',
      { needs: { hunger: 0, happiness: 86, cleanliness: 82, energy: 75 }, hungrySinceMs: 0 },
      30_000,
      true,
    ],
    ['sad', { needs: { hunger: 7, happiness: 50, cleanliness: 50, energy: 75 } }, 0, true],
    ['dirty', { needs: { hunger: 50, happiness: 50, cleanliness: 19, energy: 75 } }, 0, true],
    ['eating', {}, 0, true],
    ['normal', {}, 0, false],
  ] as const)(
    'selecciona %s según la prioridad visual',
    (expectedVisualState, overrides, currentTimeMs, isEating) => {
      const pet = {
        ...createInitialPetState(),
        ...overrides,
      }

      expect(getPetVisualState(pet, currentTimeMs, isEating)).toBe(expectedVisualState)
    },
  )
})
