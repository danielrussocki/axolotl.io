# AGENTS.md — axolotl.io

## Proyecto
Juego web de mascota virtual donde se alimenta, limpia y juega con Mochi. Usa React 19, TypeScript, Vite 8 y Tailwind 4; el canvas jugable se implementará con PixiJS y la futura integración de TikTok Live se aislará detrás de un backend/adaptador.

## Comandos
- Ejecutar: `pnpm dev`
- Tests: no configurados todavía
- Lint/formato: `pnpm lint`
- Build y comprobación de tipos: `pnpm build`

## Estilo y convenciones
TypeScript con configuración estricta y React con componentes funcionales. Usa nombres de archivos, tipos, variables y funciones en inglés; usa `camelCase` para valores y funciones, `PascalCase` para componentes y tipos. Los mensajes para usuarios y todos los archivos de documentación Markdown se escriben en español.

## Reglas
- Lee `docs/constitution.md` y la spec activa antes de tocar código.
- Mantén las reglas y el estado de juego independientes de React, PixiJS, DOM, audio, almacenamiento y TikTok.
- No añadas dependencias, un framework de tests, un backend ni credenciales de TikTok sin aprobación explícita.
- No expongas secretos en el cliente ni conectes el navegador directamente con TikTok Live.

## Al terminar cualquier tarea
- Ejecuta `pnpm lint` y `pnpm build`; si se añaden tests, ejecútalos también e informa cualquier fallo.
