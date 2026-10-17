# Constitución del proyecto

1. **Stack simple:** React, TypeScript, Vite y Tailwind; PixiJS para canvas jugable.
2. **Spec y código juntos:** cada cambio funcional actualiza su spec y sus criterios verificables en el mismo PR.
3. **Dominio independiente:** reglas y estado de mascota no importan React, PixiJS, DOM, audio, storage ni TikTok.
4. **Eventos externos aislados:** TikTok pasa por backend/adaptador, valida eventos y emite comandos tipados; nunca expone secretos al cliente.
5. **Tests obligatorios:** toda regla de dominio y cada conversión de evento externo a comando tiene test automatizado.
6. **Datos e idioma:** progreso persistido con versión y migración; código en inglés y mensajes de usuario y documentación en español.
