# Tareas 001: experiencia jugable de Mochi

Las tareas están ordenadas por dependencia. Cada una está pensada para completarse en un máximo de 20–30 minutos.

## Preparación y pruebas

- [x] **T01. Solicitar y registrar la aprobación para añadir el runner de pruebas propuesto.** RF: RF-1, RF-4, RF-5, RF-6.  
  **Hecho cuando:** la aprobación queda registrada antes de modificar dependencias.

  **Registro de aprobación:** 2026-10-17 — La persona usuaria aprobó añadir Vitest como dependencia de desarrollo en T02. Esta tarea no modifica dependencias ni configura el runner.
- [x] **T02. Añadir y verificar el runner de pruebas aprobado.** RF: RF-1, RF-4, RF-5, RF-6.  
  **Hecho cuando:** existe un comando de tests que ejecuta una prueba mínima correctamente.
- [x] **T03. Crear los contratos de tipos del dominio y de comandos.** RF: RF-1, RF-4, RF-5, RF-6.  
  **Hecho cuando:** existen tipos para estado de mascota, acción, cola, resultado, mensaje y puertos, sin importar interfaz ni navegador.

## Dominio de mascota y tiempo

- [x] **T04. Definir el estado inicial y la normalización de necesidades.** RF: RF-6.  
  **Hecho cuando:** el dominio crea hambre 78, felicidad 86, limpieza 82 y energía 75, siempre limitadas entre 0 y 100.
- [x] **T05. Probar el estado inicial y los límites de necesidades.** RF: RF-6.  
  **Hecho cuando:** las pruebas verifican valores iniciales y que ningún valor sale del rango 0–100.
- [x] **T06. Implementar la regla de alimentar.** RF: RF-6.  
  **Hecho cuando:** alimentar suma 30 de hambre y resta 5 de limpieza respetando límites.
- [x] **T07. Implementar las reglas de limpiar y acariciar.** RF: RF-6.  
  **Hecho cuando:** limpiar suma 40 de limpieza, 5 de felicidad y elimina suciedad; acariciar suma 15 de felicidad.
- [x] **T08. Probar las reglas de alimentar, limpiar y acariciar.** RF: RF-6.  
  **Hecho cuando:** las pruebas cubren efectos normales y saturación en los límites.
- [x] **T09. Implementar el descanso y su alternancia.** RF: RF-1, RF-6.  
  **Hecho cuando:** la acción Dormir duerme a Mochi si está despierto y lo despierta si está dormido.
- [x] **T10. Implementar deterioro y recuperación por segundo.** RF: RF-4, RF-6.  
  **Hecho cuando:** el dominio aplica las cuatro tasas despierto y las cuatro tasas dormido definidas en la especificación.
- [x] **T11. Implementar despertar automático y hambre prolongada.** RF: RF-6.  
  **Hecho cuando:** Mochi despierta al alcanzar 98 de energía y se marca enfermo tras 30 segundos con hambre en cero.
- [x] **T12. Implementar suciedad, estados visuales y prioridad.** RF: RF-1, RF-6.  
  **Hecho cuando:** se genera una única necesidad de limpieza, se aplican sus penalizaciones y la prioridad visual coincide con la especificación.
- [x] **T13. Probar deterioro, descanso, suciedad, enfermedad y prioridades.** RF: RF-1, RF-4, RF-6.  
  **Hecho cuando:** las pruebas cubren tasas, umbrales, suciedad y los seis niveles de prioridad visual.
- [x] **T14. Implementar el cálculo de tiempo transcurrido.** RF: RF-4, RF-6.  
  **Hecho cuando:** el dominio limita el cálculo a 24 horas y aplica cero deterioro ante tiempo negativo.
- [x] **T15. Probar ausencias, segundo plano y reloj negativo.** RF: RF-4, RF-6.  
  **Hecho cuando:** las pruebas cubren ausencias normales, 24 horas, más de 24 horas y reloj que retrocede.

## Dominio de minijuego y cola

- [x] **T16. Definir estado y transiciones del minijuego.** RF: RF-1, RF-2, RF-6.  
  **Hecho cuando:** el dominio inicia un minijuego de cinco segundos, registra corazones y lo resuelve al terminar.
- [x] **T17. Implementar efectos de iniciar y ganar corazones.** RF: RF-2, RF-6.  
  **Hecho cuando:** jugar modifica felicidad, energía y hambre; cada corazón suma 3 de felicidad.
- [x] **T18. Probar minijuego, falta de energía y regreso de segundo plano.** RF: RF-1, RF-2, RF-6.  
  **Hecho cuando:** las pruebas cubren duración, captura, mínimo de 12 de energía y resolución por tiempo transcurrido.
- [x] **T19. Crear operaciones básicas de cola.** RF: RF-1.  
  **Hecho cuando:** se pueden añadir, marcar y retirar acciones con estados pendiente, en ejecución y en espera por energía.
- [x] **T20. Implementar límite configurable y cola desactivada.** RF: RF-1.  
  **Hecho cuando:** la cola acepta límites de 0 a 200, inicia en 20 y rechaza nuevas acciones con límite 0.
- [x] **T21. Implementar desborde y reducción del límite.** RF: RF-1.  
  **Hecho cuando:** al llenarse o reducirse el límite se descartan primero las acciones más próximas a ejecutarse y se informa cuál fue eliminada.
- [x] **T22. Implementar selección de la siguiente acción procesable.** RF: RF-1, RF-6.  
  **Hecho cuando:** la cola mantiene el orden, espera animaciones/minijuegos y puede omitir temporalmente un juego sin energía para ejecutar acciones independientes.
- [x] **T23. Implementar despertar previo a acciones no relacionadas con descanso.** RF: RF-1.  
  **Hecho cuando:** una acción distinta de Dormir despierta a Mochi antes de ejecutarse.
- [x] **T24. Probar todas las reglas de cola.** RF: RF-1, RF-6.  
  **Hecho cuando:** las pruebas cubren orden, límite 0, límite 200, desborde, reducción, espera por energía, omisión temporal y despertar automático.

## Persistencia, migración y sesión

- [x] **T25. Definir el formato persistido versionado y su validación.** RF: RF-4.  
  **Hecho cuando:** el formato contiene versión, mascota, cola, preferencias y marca temporal, con validación de rango y estructura.
- [x] **T26. Implementar serialización y restauración de estado.** RF: RF-1, RF-4.  
  **Hecho cuando:** se restauran necesidades, descanso, limpieza pendiente, cola, límite y visibilidad de cola.
- [x] **T27. Implementar migración de formatos compatibles.** RF: RF-4.  
  **Hecho cuando:** una instantánea de versión anterior compatible se transforma a la versión actual sin perder datos compatibles.
- [x] **T28. Implementar recuperación ante datos inválidos y fallos de guardado.** RF: RF-4.  
  **Hecho cuando:** datos corruptos restauran un estado seguro con aviso y un fallo de guardado permite continuar la sesión con aviso.
- [x] **T29. Normalizar acciones interrumpidas al restaurar.** RF: RF-1, RF-4.  
  **Hecho cuando:** una acción que quedó en ejecución se recupera como pendiente y vuelve a procesarse.
- [x] **T30. Probar persistencia, migraciones y fallos de almacenamiento.** RF: RF-1, RF-4.  
  **Hecho cuando:** las pruebas cubren guardar/restaurar, migrar, JSON inválido, almacenamiento bloqueado y acción interrumpida.
- [x] **T31. Implementar bloqueo de sesión única.** RF: RF-4.  
  **Hecho cuando:** una segunda pestaña no puede jugar y muestra el aviso de sesión activa.
- [x] **T32. Implementar el comportamiento de recarga manual de la pestaña bloqueada.** RF: RF-4.  
  **Hecho cuando:** cerrar la sesión principal no activa la pestaña bloqueada hasta que se recarga manualmente.
- [x] **T33. Probar bloqueo y liberación de sesión.** RF: RF-4.  
  **Hecho cuando:** las pruebas verifican sesión principal, segunda pestaña bloqueada y requisito de recarga manual.

## Controlador y mensajes

- [x] **T34. Implementar el catálogo de mensajes en español.** RF: RF-1, RF-3, RF-4, RF-5.  
  **Hecho cuando:** existen mensajes para acciones, sueño, energía insuficiente, cola desactivada, descarte, datos inválidos, guardado fallido y sesión bloqueada.
- [x] **T35. Implementar el controlador de juego y el ciclo de procesamiento.** RF: RF-1 a RF-6.  
  **Hecho cuando:** el controlador conecta comandos, dominio, cola, mensajes y persistencia sin introducir reglas de mascota fuera del dominio.
- [x] **T36. Conectar el controlador al reloj y a los cambios de visibilidad.** RF: RF-4, RF-6.  
  **Hecho cuando:** al volver a primer plano se aplica el tiempo transcurrido antes de aceptar nuevas acciones.
- [x] **T37. Implementar el flujo de reinicio confirmado o cancelado.** RF: RF-5, RF-6.  
  **Hecho cuando:** el reinicio permite conservar cola, restaura valores iniciales y reinicia límite a 20 y visibilidad a mostrada.
- [x] **T38. Probar controlador, reinicio y avisos.** RF: RF-1, RF-3, RF-4, RF-5, RF-6.  
  **Hecho cuando:** las pruebas verifican efectos, persistencia, cancelación, ambas opciones de reinicio y mensajes resultantes.

## Render jugable y audio

- [x] **T39. Solicitar y registrar la aprobación para añadir PixiJS.** RF: RF-1, RF-2.  
  **Hecho cuando:** la aprobación queda registrada antes de modificar dependencias.

  **Registro de aprobación:** 2026-10-17 — La persona usuaria aprobó añadir PixiJS como dependencia de producción en T40 para implementar el canvas jugable. T39 no modifica dependencias ni configura PixiJS.
- [x] **T40. Añadir PixiJS y crear el contenedor de ciclo de vida de la escena.** RF: RF-1, RF-2.  
  **Hecho cuando:** la escena se crea y destruye sin dejar listeners ni ciclos de render activos.
- [x] **T41. Dibujar habitación y Mochi en reposo.** RF: RF-1.  
  **Hecho cuando:** la escena representa habitación y mascota con el estilo funcional equivalente, sin requisito píxel a píxel.
- [x] **T42. Representar estados de Mochi, partículas y suciedad.** RF: RF-1, RF-6.  
  **Hecho cuando:** la escena refleja dormir, enfermo, triste, sucio, comiendo y normal con su prioridad correcta.
- [x] **T43. Conectar pulsación y táctil sobre Mochi con el comando de caricia.** RF: RF-2.  
  **Hecho cuando:** una única pulsación o toque fuera del minijuego encola una sola caricia.
- [x] **T44. Implementar interacción visual del minijuego.** RF: RF-1, RF-2, RF-6.  
  **Hecho cuando:** ratón y táctil mueven a Mochi, se capturan corazones y al terminar vuelve a reposo mostrando el resultado.
- [x] **T45. Implementar el adaptador de audio tolerante a fallos.** RF: RF-3.  
  **Hecho cuando:** la música inicia activada en una sesión nueva, se controla durante la sesión y un bloqueo de audio no impide jugar.

## Interfaz reactiva

- [x] **T46. Sustituir la integración actual por el estado del controlador.** RF: RF-1, RF-3.  
  **Hecho cuando:** controles, indicadores y mensaje muestran la instantánea reactiva del juego sin duplicar reglas.
- [x] **T47. Implementar indicadores y resaltado de necesidades bajas.** RF: RF-3.  
  **Hecho cuando:** cada necesidad igual o menor que 20 resalta su indicador y el control asociado correcto.
- [x] **T48. Implementar controles de acciones y de música.** RF: RF-1, RF-3.  
  **Hecho cuando:** cada control emite un único comando y el control de música respeta la elección durante la sesión.
- [x] **T49. Implementar lista, visibilidad y configuración de cola.** RF: RF-1, RF-4.  
  **Hecho cuando:** la lista inicia visible, muestra tipo y estado de cada acción, puede ocultarse sin detenerse y conserva preferencia y límite.
- [x] **T50. Implementar diálogo y controles de reinicio.** RF: RF-5, RF-6.  
  **Hecho cuando:** el diálogo permite cancelar, reiniciar borrando cola o reiniciar conservándola.
- [x] **T51. Implementar pantalla de sesión bloqueada y avisos de recuperación.** RF: RF-3, RF-4.  
  **Hecho cuando:** la segunda pestaña no permite jugar y los avisos de datos/guardado se muestran en español.

## Verificación final

- [x] **T52. Añadir pruebas de integración de interfaz para puntero y táctil.** RF: RF-1, RF-2, RF-3, RF-5.  
  **Hecho cuando:** las pruebas verifican caricia, minijuego, indicadores, cola, música y reinicio desde la interfaz.
- [x] **T53. Ejecutar la matriz completa de pruebas especificada.** RF: RF-1 a RF-6.  
  **Hecho cuando:** todas las suites de dominio, persistencia, sesión e interfaz pasan.
- [x] **T54. Ejecutar lint, comprobación de tipos y build de producción.** RF: RF-1 a RF-6.  
  **Hecho cuando:** `pnpm lint` y `pnpm build` finalizan sin errores.
- [x] **T55. Revisar trazabilidad documental antes de cerrar.** RF: RF-1 a RF-6.  
  **Hecho cuando:** `spec.md`, `plan.md`, `tasks.md` y las pruebas reflejan el comportamiento finalmente entregado.

  **Validación:** revisión completada el 2026-10-19. La especificación, el plan, las tareas y las 24 suites automatizadas (179 pruebas) cubren el comportamiento entregado de RF-1 a RF-6.

## Corrección del canvas jugable

- [x] **T56. Reproducir el fallo del canvas y registrar su causa en desarrollo.** RF: RF-1, RF-2.  
  **Hecho cuando:** la consola de desarrollo identifica si el fallo procede de inicialización, dibujo o montaje, con pasos de reproducción registrados.

  **Validación:** reproducción controlada completada el 2026-10-19. El rechazo de `Application.init()` impide el montaje y el dibujo; los pasos y la causa están registrados en `docs/diagnostico-canvas-desarrollo.md` y cubiertos por `pixiSceneLifecycle.test.ts`.
- [x] **T57. Exponer los errores de inicialización de Pixi y conservar su limpieza segura.** RF: RF-1, RF-2.  
  **Hecho cuando:** un rechazo de inicialización se registra en desarrollo, activa el estado de error de la escena y no deja aplicaciones, listeners ni temporizadores activos.

  **Validación:** completada el 2026-10-19. `PixiScene` registra el rechazo en desarrollo y refleja el error en el estado de la escena; los ciclos de vida destruyen Pixi tanto tras un rechazo como al desmontar. El error observado en navegador está documentado en `docs/diagnostico-canvas-desarrollo.md`. Las pruebas de ciclo de vida y la suite completa pasan (181 pruebas).
- [x] **T58. Reservar el área jugable y mostrar estados de carga y error en español.** RF: RF-1, RF-2.  
  **Hecho cuando:** el contenedor conserva un área responsiva equivalente a 480 × 320 durante la carga y muestra una alternativa visible si Pixi no puede iniciarse.

  **Validación:** completada el 2026-10-19. `PixiScene` reserva una proporción responsiva de 480 × 320, muestra los estados de carga y error en español y mantiene disponibles los controles de Mochi ante un fallo. `pixiScenePresentation.test.ts` cubre la proporción y los mensajes; la suite completa pasa (185 pruebas).
- [x] **T59. Aplicar la corrección mínima a la inicialización o al dibujo de Pixi identificada en T56.** RF: RF-1, RF-2.  
  **Hecho cuando:** en un navegador compatible se muestran la habitación y Mochi, y el canvas se adjunta una sola vez tras la inicialización.

  **Validación:** completada el 2026-10-19. El ciclo de escena único difiere la destrucción de Pixi hasta que termina `Application.init()`, compone habitación y Mochi antes de adjuntar el canvas y nunca adjunta una aplicación destruida. `pixiSceneLifecycle.test.ts` comprueba el desmontaje durante la inicialización y que la limpieza tras un fallo no vuelva a leer el canvas destruido.
- [x] **T60. Añadir pruebas unitarias de los estados de ciclo de vida, carga y error de la escena.** RF: RF-1, RF-2.  
  **Hecho cuando:** las pruebas verifican adjuntar canvas, fallo de inicialización, fallback visible y limpieza al desmontar sin requerir un renderer real.

  **Validación:** completada el 2026-10-19. `pixiSceneLifecycleStates.test.ts` comprueba las transiciones inactiva, cargando, lista y error, el adjunto y desmontaje del canvas, y el fallback en español con dobles sin renderer. La suite completa pasa (190 pruebas), al igual que lint y build.
- [x] **T61. Solicitar y registrar la aprobación para añadir, si fuera necesaria, una herramienta de pruebas de DOM o navegador.** RF: RF-1, RF-2.  
  **Hecho cuando:** antes de modificar dependencias, queda registrada la decisión de usar o no una herramienta adicional para validar el canvas real.

  **Validación:** aprobada el 2026-10-19 por la persona usuaria la incorporación, si resulta necesaria, de una herramienta adicional de pruebas de DOM o navegador para validar el canvas real en T62. T61 no modifica dependencias ni añade pruebas; la herramienta concreta y su integración se decidirán e implementarán exclusivamente en T62.
- [x] **T62. Añadir una prueba de integración del canvas en DOM o navegador, si fue aprobada en T61.** RF: RF-1, RF-2.  
  **Hecho cuando:** la prueba comprueba que el montaje de `PixiScene` presenta canvas o fallback, y que el desmontaje elimina el canvas.

  **Validación:** completada el 2026-10-19. Se añadió `jsdom`, aprobado en T61, y `PixiScene.dom.integration.test.tsx` monta `PixiScene` con un adaptador Pixi simulado, confirma que presenta un canvas y verifica que el desmontaje lo elimina. La suite completa pasa (191 pruebas), al igual que lint y build.
- [x] **T63. Verificar manualmente canvas, puntero y táctil en desarrollo y producción.** RF: RF-1, RF-2.  
  **Hecho cuando:** Mochi y la habitación son visibles, la caricia funciona con puntero y táctil, y no hay errores no controlados en consola.

  **Validación:** completada el 2026-10-19 por la persona usuaria. Se verificaron manualmente el canvas, la visibilidad de Mochi y la habitación, la caricia mediante puntero y táctil, y la ausencia de errores no controlados en consola tanto en desarrollo como en producción.
- [x] **T64. Ejecutar la validación automatizada y actualizar la trazabilidad de la corrección.** RF: RF-1, RF-2.  
  **Hecho cuando:** `pnpm test`, `pnpm lint` y `pnpm build` finalizan sin errores y la documentación refleja las pruebas añadidas.

  **Validación:** completada el 2026-10-19. `pnpm test --run` finalizó con 27 archivos y 191 pruebas correctas; `pnpm lint` y `pnpm build` finalizaron sin errores. `docs/diagnostico-canvas-desarrollo.md` traza las pruebas de ciclo de vida, presentación e integración DOM de la corrección.
