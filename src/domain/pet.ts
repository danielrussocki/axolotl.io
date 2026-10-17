import type { PetNeeds, PetState, PetVisualState } from './contracts'

const minimumNeed = 0
const maximumNeed = 100
const awakeNeedRates = {
  hunger: -0.25,
  happiness: -0.15,
  cleanliness: -0.12,
  energy: -0.08,
}
const sleepingNeedRates = {
  hunger: -0.05,
  happiness: -0.03,
  cleanliness: -0.02,
  energy: 2,
}
const sicknessHungerDurationMs = 30_000

const normalizeNeed = (value: number): number => {
  if (Number.isNaN(value)) {
    return minimumNeed
  }

  return Math.min(maximumNeed, Math.max(minimumNeed, value))
}

/** Limita cada necesidad al rango permitido por las reglas del juego. */
export const normalizePetNeeds = (needs: PetNeeds): PetNeeds => ({
  hunger: normalizeNeed(needs.hunger),
  happiness: normalizeNeed(needs.happiness),
  cleanliness: normalizeNeed(needs.cleanliness),
  energy: normalizeNeed(needs.energy),
})

/** Crea el estado seguro con el que comienza Mochi. */
export const createInitialPetState = (): PetState => ({
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

/** Aplica los efectos de alimentar a Mochi sin mutar el estado original. */
export const applyFeed = (pet: PetState): PetState => ({
  ...pet,
  needs: normalizePetNeeds({
    ...pet.needs,
    hunger: pet.needs.hunger + 30,
    cleanliness: pet.needs.cleanliness - 5,
  }),
  hungrySinceMs: null,
})

/** Aplica los efectos de limpiar a Mochi sin mutar el estado original. */
export const applyClean = (pet: PetState): PetState => ({
  ...pet,
  needs: normalizePetNeeds({
    ...pet.needs,
    happiness: pet.needs.happiness + 5,
    cleanliness: pet.needs.cleanliness + 40,
  }),
  needsCleaning: false,
})

/** Aplica los efectos de acariciar a Mochi sin mutar el estado original. */
export const applyPet = (pet: PetState): PetState => ({
  ...pet,
  needs: normalizePetNeeds({
    ...pet.needs,
    happiness: pet.needs.happiness + 15,
  }),
})

/** Aplica los efectos de iniciar el minijuego sin mutar el estado original. */
export const applyPlay = (pet: PetState): PetState => ({
  ...pet,
  needs: normalizePetNeeds({
    ...pet.needs,
    hunger: pet.needs.hunger - 8,
    happiness: pet.needs.happiness + 25,
    energy: pet.needs.energy - 15,
  }),
})

/** Aplica la recompensa de un corazón atrapado sin mutar el estado original. */
export const applyHeart = (pet: PetState): PetState => ({
  ...pet,
  needs: normalizePetNeeds({
    ...pet.needs,
    happiness: pet.needs.happiness + 3,
  }),
})

/** Genera suciedad una única vez mientras Mochi está despierto. */
export const applyDirt = (pet: PetState): PetState => {
  if (pet.isSleeping || pet.needsCleaning) {
    return pet
  }

  return {
    ...pet,
    needs: normalizePetNeeds({
      ...pet.needs,
      happiness: pet.needs.happiness - 6,
      cleanliness: pet.needs.cleanliness - 12,
    }),
    needsCleaning: true,
  }
}

/** Alterna el descanso de Mochi sin mutar el estado original. */
export const toggleSleep = (pet: PetState): PetState => ({
  ...pet,
  isSleeping: !pet.isSleeping,
})

/** Indica si Mochi ha permanecido al menos 30 segundos con hambre en cero. */
export const isPetSick = (pet: PetState, currentTimeMs: number): boolean =>
  pet.needs.hunger === minimumNeed &&
  pet.hungrySinceMs !== null &&
   currentTimeMs - pet.hungrySinceMs >= sicknessHungerDurationMs

/** Calcula la apariencia de Mochi sin incorporar decisiones de interfaz. */
export const getPetVisualState = (
  pet: PetState,
  currentTimeMs: number,
  isEating: boolean,
): PetVisualState => {
  if (pet.isSleeping) {
    return 'sleeping'
  }

  if (isPetSick(pet, currentTimeMs)) {
    return 'sick'
  }

  if (
    pet.needs.hunger < 8 ||
    pet.needs.happiness < 10 ||
    pet.needs.cleanliness < 10
  ) {
    return 'sad'
  }

  if (pet.needs.cleanliness < 20) {
    return 'dirty'
  }

  if (isEating) {
    return 'eating'
  }

  return 'normal'
}

/** Aplica las tasas de necesidades según el descanso durante los segundos indicados. */
export const applyPetNeedRates = (
  pet: PetState,
  elapsedSeconds: number,
  currentTimeMs?: number,
): PetState => {
  const rates = pet.isSleeping ? sleepingNeedRates : awakeNeedRates
  const needs = normalizePetNeeds({
    hunger: pet.needs.hunger + rates.hunger * elapsedSeconds,
    happiness: pet.needs.happiness + rates.happiness * elapsedSeconds,
    cleanliness: pet.needs.cleanliness + rates.cleanliness * elapsedSeconds,
    energy: pet.needs.energy + rates.energy * elapsedSeconds,
  })
  const hungrySinceMs = deriveHungrySinceMs(pet, needs.hunger, rates.hunger, elapsedSeconds, currentTimeMs)

  return {
    ...pet,
    needs,
    isSleeping: pet.isSleeping && needs.energy < 98,
    hungrySinceMs,
  }
}

const deriveHungrySinceMs = (
  pet: PetState,
  hunger: number,
  hungerRate: number,
  elapsedSeconds: number,
  currentTimeMs: number | undefined,
): number | null => {
  if (hunger > minimumNeed) {
    return null
  }

  if (pet.needs.hunger === minimumNeed) {
    return pet.hungrySinceMs ?? (currentTimeMs === undefined ? null : currentTimeMs - elapsedSeconds * 1_000)
  }

  if (currentTimeMs === undefined || hungerRate >= minimumNeed) {
    return null
  }

  const secondsUntilHungerIsZero = pet.needs.hunger / -hungerRate
  return currentTimeMs - (elapsedSeconds - secondsUntilHungerIsZero) * 1_000
}
