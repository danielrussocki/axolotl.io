# Diagnóstico del canvas en desarrollo

## T56 — reproducción controlada

Fecha de verificación: 2026-10-19.

### Pasos para reproducir

1. Ejecutar `pnpm dev` y abrir la dirección local que indique Vite.
2. Abrir la consola de desarrollo, conservar los registros y recargar la página.
3. Para aislar la fase, hacer que `Application.init()` rechace y ejecutar `pnpm test --run src/ui/pixi/pixiSceneLifecycle.test.ts`.

### Resultado y causa identificada

La reproducción controlada falla durante la **inicialización** de Pixi: cuando `Application.init()` rechaza, `createPixiSceneLifecycle.start()` rechaza y destruye la aplicación. No llega a ejecutar `appendChild`, por lo que no es un fallo de montaje ni de dibujo.

La prueba `reproduce un fallo de inicialización sin llegar al montaje ni al dibujo` registra este recorrido y verifica que no se adjunta ningún canvas y que la aplicación se destruye una vez.

Actualmente `PixiScene` captura ese rechazo y lo limpia sin mostrarlo (`src/ui/pixi/PixiScene.tsx`). Por tanto, la consola no expone la causa original del renderer en una ejecución normal. T57 deberá registrar el error de inicialización en desarrollo y reflejarlo en el estado de la escena, sin alterar la limpieza segura ya comprobada.

## T57 — error observado en navegador

Fecha de observación: 2026-10-19.

Tras exponer el error de inicialización en desarrollo, la consola muestra:

```text
No se pudo inicializar la escena de Pixi. TypeError: Cannot read properties of null (reading 'addChild')
    at Object.initialize (PixiScene.tsx:148:25)
    at async ManagedPixiSceneLifecycle.start (pixiSceneLifecycle.ts:46:7)
```

El error ocurre al intentar ejecutar `application.stage.addChild(sceneContent)` dentro de la inicialización de la escena. Por tanto, en el navegador el fallo observado está después de que `Application.init()` haya cedido el control y antes de adjuntar el canvas al contenedor. La aplicación se destruye de forma segura y el error queda registrado; determinar y aplicar la corrección mínima para que `stage` esté disponible corresponde a T59.

## T64 — validación automatizada y trazabilidad

Fecha de validación: 2026-10-19.

La corrección queda trazada por las pruebas de ciclo de vida (`pixiSceneLifecycle.test.ts` y `pixiSceneLifecycleStates.test.ts`), presentación (`pixiScenePresentation.test.ts`) e integración DOM (`PixiScene.dom.integration.test.tsx`). Esta última confirma que la escena presenta un canvas y lo elimina al desmontarse mediante un adaptador Pixi simulado.

Resultados de la validación final:

- `pnpm test --run`: 27 archivos y 191 pruebas correctas.
- `pnpm lint`: finaliza sin errores.
- `pnpm build`: finaliza sin errores de tipos ni de producción. Vite informa únicamente el aviso no bloqueante de un chunk superior a 500 kB.
