# Línea base visual de Mochi

## Referencia normativa

La referencia normativa de RF-7 es el commit `001a993`, archivo `src/App.tsx`:

- `drawMochi`, para Mochi, sus estados, animaciones y efectos.
- `drawRoomPattern`, para la composición de la habitación.

La comparación se realiza en el área lógica de **480 × 320**. Las diferencias técnicas imperceptibles del renderer son admisibles; cambios reconocibles de silueta, estilo, proporciones, composición o animación no lo son.

## Matriz de comparación

| Caso | Evidencia en la referencia | Criterios verificables para PixiJS |
|---|---|---|
| Reposo | `drawRoomPattern`; `drawMochi` con `idle` y `playing` | Habitación con pared decorada, ventana, planta, repisa, suelo y alfombra. Mochi en `240, 160`, con sombra, bloques escalonados, orejas, tres branquias por lado y rostro. Conserva balanceo, parpadeo y movimiento de branquias; una caricia activa el rebote de `playing` durante 600 ms. |
| Dormir | `drawMochi` con `sleeping` | Ojos cerrados rectangulares, partículas `Z` ascendentes y balanceo suave, sin cambiar la silueta base. |
| Comer | `drawMochi` con `eating`; `drawStrawberry` | Boca y mejillas mastican; fresas y corazones pixelados rodean a Mochi sin modificar sus proporciones. |
| Triste | `drawMochi` con `sad` | Ojos apagados, lágrimas azules y boca triste; se mantienen la silueta escalonada y la habitación. |
| Enfermo | `drawMochi` con `sick` | Tono corporal enfermo, ojos apagados, lágrimas y boca triste; no se usan formas redondeadas genéricas como sustituto. |
| Sucio | `drawMochi` con `dirty`; `drawPoop` | Nube de suciedad pixelada alrededor de Mochi, suciedad escalonada en el suelo y rostro triste conservando la identidad visual. |
| Partículas | `drawPixelHeart`, `drawPixelStar`, `drawPixelBubble`, `drawStrawberry`, `drawPoop` | Corazones, estrellas, burbujas, fresas y suciedad conservan bloques/formas pixeladas, paleta rosa y escala equivalente. |
| Minijuego | `drawMochi` con `playing`; temporizador y corazones | Mochi sigue el puntero con sombra ensanchada y pies; caen corazones y el encabezado muestra tiempo y contador. Al terminar vuelve a `240, 160` y a reposo. |

La versión estructurada de esta matriz está en `src/ui/pixi/visualBaseline.ts`; su prueba de integridad está en `src/ui/pixi/visualBaseline.test.ts`. Las comprobaciones de regresión de T68 están en `src/ui/pixi/visualRegression.test.ts`: verifican las instrucciones pixeladas de cada estado y la composición determinista del minijuego, sin añadir dependencias de captura visual.
