export type VisualComparisonEntry = {
  id: 'resting' | 'sleeping' | 'eating' | 'sad' | 'sick' | 'dirty' | 'particles' | 'minigame'
  referenceEvidence: readonly string[]
  acceptanceCriteria: readonly string[]
}

/** Referencia inmutable para comparar la futura migración visual a PixiJS. */
export const visualReference = {
  commit: '001a993',
  file: 'src/App.tsx',
  functions: ['drawMochi', 'drawRoomPattern'],
  logicalArea: { width: 480, height: 320 },
} as const

/**
 * Matriz declarativa de T65. Describe qué debe compararse; no sustituye las
 * verificaciones de composición e instrucciones de dibujo de T68.
 */
export const visualComparisonMatrix: readonly VisualComparisonEntry[] = [
  {
    id: 'resting',
    referenceEvidence: ['drawRoomPattern', 'drawMochi con anim="idle" y "playing"'],
    acceptanceCriteria: [
      'Habitación de 480 × 320 con pared decorada, ventana, planta, repisa, suelo y alfombra.',
      'Mochi centrado en x=240, y=160 con silueta escalonada, sombra, orejas, tres branquias por lado y rostro.',
      'Balanceo, parpadeo y movimiento de branquias conservan el lenguaje pixel art; una caricia activa el rebote temporal de playing.',
    ],
  },
  {
    id: 'sleeping',
    referenceEvidence: ['drawMochi con anim="sleeping"'],
    acceptanceCriteria: [
      'Ojos cerrados rectangulares y partículas de Z ascendentes.',
      'Balanceo suave de descanso sin alterar la silueta base.',
    ],
  },
  {
    id: 'eating',
    referenceEvidence: ['drawMochi con anim="eating"', 'drawStrawberry'],
    acceptanceCriteria: [
      'Boca y mejillas alternan la masticación sin cambiar las proporciones de Mochi.',
      'Fresas y corazones se dibujan como partículas pixeladas alrededor de Mochi.',
    ],
  },
  {
    id: 'sad',
    referenceEvidence: ['drawMochi con anim="sad"'],
    acceptanceCriteria: [
      'Ojos apagados, lágrimas azules y boca triste en los mismos rasgos faciales.',
      'La silueta escalonada y la composición de la habitación permanecen visibles.',
    ],
  },
  {
    id: 'sick',
    referenceEvidence: ['drawMochi con anim="sick"'],
    acceptanceCriteria: [
      'Tono corporal enfermo, ojos apagados, lágrimas y boca triste.',
      'No se sustituye el cuerpo pixelado por figuras redondeadas genéricas.',
    ],
  },
  {
    id: 'dirty',
    referenceEvidence: ['drawMochi con anim="dirty"', 'drawPoop'],
    acceptanceCriteria: [
      'Nube de suciedad pixelada alrededor de Mochi y suciedad escalonada en el suelo.',
      'El rostro conserva los rasgos tristes y la identidad pixel art de la referencia.',
    ],
  },
  {
    id: 'particles',
    referenceEvidence: ['drawPixelHeart', 'drawPixelStar', 'drawPixelBubble', 'drawStrawberry', 'drawPoop'],
    acceptanceCriteria: [
      'Corazones, estrellas, burbujas, fresas y suciedad se componen con bloques o formas pixeladas equivalentes.',
      'Los colores y la escala se mantienen consistentes con la paleta rosa de referencia.',
    ],
  },
  {
    id: 'minigame',
    referenceEvidence: ['drawMochi con anim="playing"', 'superposición de temporizador y corazones'],
    acceptanceCriteria: [
      'Mochi sigue el puntero con sombra ensanchada y pies visibles.',
      'Corazones caen y el encabezado muestra tiempo y cantidad de corazones sin ocultar la habitación.',
      'Al finalizar, Mochi vuelve a x=240, y=160 y a la apariencia de reposo.',
    ],
  },
]
