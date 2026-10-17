const maximumElapsedTimeMs = 24 * 60 * 60 * 1_000

/** Calcula el tiempo válido para aplicar deterioro, con un máximo de 24 horas. */
export const calculateElapsedTimeMs = (lastProgressMs: number, currentTimeMs: number): number =>
  Math.min(maximumElapsedTimeMs, Math.max(0, currentTimeMs - lastProgressMs))
