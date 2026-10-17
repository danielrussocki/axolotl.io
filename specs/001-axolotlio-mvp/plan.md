# Plan técnico 001: experiencia jugable de Mochi

## Alcance y trazabilidad
Este plan implementa la especificación 001 y respeta la constitución: reglas puras sin dependencias de interfaz, datos versionados y migrables, mensajes y documentación en español, y pruebas automatizadas obligatorias. La integración real con TikTok Live no se implementa; solo se deja un contrato de comandos reutilizable para un adaptador futuro. **Cubre RF-1 a RF-6.**

## Estructura de módulos

| Módulo | Responsabilidad | RF |
|---|---|---|
| `domain/pet` | Estado de necesidades, descanso, limpieza, umbrales, prioridad visual, efectos de acciones y valores iniciales. No importa navegador, React, PixiJS, audio ni almacenamiento. | RF-1, RF-6 |
| `domain/time` | Aplica deterioro por tiempo transcurrido, tope de 24 horas, reloj negativo y progreso en segundo plano. | RF-4, RF-6 |
| `domain/queue` | Encola, aplaza, selecciona, descarta y procesa acciones; calcula estados de cola. | RF-1, RF-6 |
| `domain/minigame` | Estado temporal del minijuego, captura de corazones, duración y resolución al volver a primer plano. | RF-1, RF-2, RF-6 |
| `domain/messages` | Convierte resultados de reglas y errores en claves de mensajes; la presentación traduce las claves a texto español. | RF-1, RF-3, RF-4, RF-5 |
| `application/gameController` | Coordina reloj, cola, persistencia, sesión, audio y eventos de interfaz sin contener reglas de mascota. | RF-1 a RF-6 |
| `application/contracts` | Define comandos tipados, resultados, puertos de persistencia, bloqueo de sesión, reloj y notificaciones. | RF-1, RF-4, RF-5 |
| `infrastructure/persistence` | Implementa guardado local, lectura segura, validación, versión y migraciones. | RF-4, RF-5 |
| `infrastructure/session` | Garantiza una sesión activa por navegador y comunica el bloqueo de pestañas secundarias. | RF-4 |
| `infrastructure/audio` | Inicia, detiene y reproduce música/efectos; informa indisponibilidad sin bloquear el juego. | RF-3 |
| `ui/react` | Controles, indicadores, mensajes, diálogo de reinicio, configuración y lista reactiva de cola. | RF-1, RF-3, RF-5 |
| `ui/pixi` | Escena jugable, animaciones, partículas, hit testing de Mochi y entrada de ratón/táctil. Recibe un estado ya calculado; no decide reglas. | RF-1, RF-2, RF-6 |

Flujo único: **entrada de interfaz → comando tipado → controlador → dominio → estado/resultados → persistencia y adaptadores → React/PixiJS**. Un futuro adaptador de Live solo podrá emitir el mismo contrato de comandos; no accederá al estado interno.

## Modelo de datos persistido

Se persistirá una instantánea versionada. Los efectos visuales efímeros, posiciones de suciedad, audio, animaciones y temporizadores visuales no se guardarán. Una acción en ejecución que se interrumpa se normalizará como pendiente antes del siguiente guardado para no perderla. **Cubre RF-1, RF-3, RF-4, RF-5 y RF-6.**

```json
{
  "formatVersion": 1,
  "savedAtMs": 1792180800000,
  "pet": {
    "needs": { "hunger": 78, "happiness": 86, "cleanliness": 82, "energy": 75 },
    "isSleeping": false,
    "needsCleaning": false,
    "hungrySinceMs": null
  },
  "queue": {
    "limit": 20,
    "isVisible": true,
    "items": [
      { "id": "action-001", "type": "feed", "createdAtMs": 1792180798000, "status": "pending" },
      { "id": "action-002", "type": "play", "createdAtMs": 1792180799000, "status": "waiting-energy" }
    ]
  }
}
```

Reglas del formato:
- `formatVersion` es obligatorio y cada cambio incompatible incorpora una migración explícita.
- La versión 0, con la misma estructura de progreso que la versión 1, es compatible: se conserva todo su contenido y se actualiza su marca a la versión 1 antes de validarla. Las demás versiones sin migración registrada se rechazan.
- `limit` está entre 0 y 200; su valor inicial es 20. `isVisible` inicia en `true`.
- `needsCleaning` es una condición única; nunca se persisten posiciones ni contadores de suciedad.
- Los valores de necesidades se validan y limitan entre 0 y 100 antes de usar o guardar.
- Ante JSON ilegible, versión sin migración o datos inválidos, se descarta la instantánea, se crea el estado inicial y se emite un aviso en español.

## Algoritmos en pseudocódigo

### Restauración y avance temporal
**Cubre RF-4, RF-6.**

```text
restore(now):
  snapshot = readPersistedSnapshotSafely()
  if snapshot is absent:
    return initialState()
  snapshot = migrateAndValidate(snapshot)
  if invalid:
    notify("progress-invalid")
    return initialState()

  elapsed = now - snapshot.savedAtMs
  if elapsed < 0:
    elapsed = 0
  elapsed = min(elapsed, 24 hours)

  state = applyElapsedTime(snapshot, elapsed)
  normalizeInterruptedActionAsPending(state.queue)
  return state

applyElapsedTime(state, elapsed):
  if minigame was active:
    resolveMinigameUsingElapsedTime(state, elapsed)
  else if state.pet.isSleeping:
    increase energy by 2 per second
    decrease hunger, happiness and cleanliness at sleep rates
  else:
    decrease all awake needs at awake rates

  clamp needs between 0 and 100
  derive hungrySinceMs, sickness, mood and needsCleaning
  return state
```

### Cola y acciones
**Cubre RF-1, RF-3, RF-5 y RF-6.**

```text
requestAction(action, state):
  if state.queue.limit == 0:
    notify("queue-disabled")
    return state

  if queue length >= limit:
    dropped = remove first pending action
    notify("action-dropped", dropped.type)

  append action with status pending
  persist state

processQueue(state):
  if an action animation or minigame is active:
    return state

  candidate = first actionable item in arrival order
  if no candidate:
    return state

  if candidate.type != sleep and pet is sleeping:
    wake pet

  if candidate.type == play and pet.energy < 12:
    mark candidate as waiting-energy
    candidate = first later action that does not depend on energy
    if no candidate:
      return state

  mark candidate as executing
  result = applyDomainAction(candidate, state)
  publish resulting message, animation, sound and reactive state
  wait until associated animation or minigame finishes
  remove completed candidate
  persist state
  processQueue(state)
```

### Reinicio y sesión única
**Cubre RF-4, RF-5 y RF-6.**

```text
confirmReset(keepPendingActions):
  pending = keepPendingActions ? current pending queue items : []
  state = initialState()
  state.queue.items = pending
  state.queue.limit = 20
  state.queue.isVisible = true
  persist state
  processQueue(state)

openSession():
  if another active session is detected:
    show blocking message
    disable gameplay until manual page reload
  else:
    claim active session
```

## Contratos

### Comandos de juego
**Cubre RF-1, RF-2, RF-5 y deja preparado el futuro RF de Live sin implementarlo.**

| Comando | Datos mínimos | Resultado esperado |
|---|---|---|
| `feed` | `id`, `createdAtMs`, `source` | Añade alimentación a la cola. |
| `clean` | `id`, `createdAtMs`, `source` | Añade limpieza a la cola. |
| `pet` | `id`, `createdAtMs`, `source` | Añade caricia a la cola. |
| `play` | `id`, `createdAtMs`, `source` | Añade minijuego; espera si falta energía. |
| `sleep` | `id`, `createdAtMs`, `source` | Alterna descanso al llegar a su turno. |
| `reset` | `keepPendingActions` | Solicita confirmación y reinicia solo al confirmar. |
| `setQueueLimit` | `limit` entre 0 y 200 | Actualiza límite y descarta las acciones más próximas si es necesario. |
| `setQueueVisibility` | `isVisible` | Muestra u oculta la lista sin detenerla. |
| `setMusicEnabled` | `isEnabled` | Cambia música solo durante la sesión. |

`source` admite inicialmente `local`; un adaptador futuro podrá usar `live` tras validar eventos externos. El dominio no distingue proveedores ni contiene secretos. Cada comando genera un resultado con estado actualizado, efectos a representar, mensaje por clave y notificaciones opcionales.

### Puertos de infraestructura
**Cubre RF-3 y RF-4.**

| Puerto | Garantía |
|---|---|
| Persistencia | `load`, `save`, `clear`; puede devolver fallo sin impedir la sesión actual. |
| Reloj | Entrega tiempo actual y notifica retorno a primer plano. |
| Bloqueo de sesión | `claim`, `release`, `isClaimed`; la segunda pestaña queda bloqueada hasta recarga manual. |
| Audio | `startMusic`, `stopMusic`, `playEffect`; informa si el navegador niega audio. |
| Render | Recibe instantánea del juego y eventos de puntero/táctil; no muta reglas. |

## Decisiones técnicas

| Decisión | Justificación | Alternativa descartada |
|---|---|---|
| Motor de reglas puro y determinista | Permite probar cálculos, cola, reinicio y tiempo sin navegador; cumple independencia del dominio. | Reglas dentro de componentes o escena: acoplan UI, render y persistencia. |
| PixiJS para la escena y React para paneles reactivos | La escena necesita render y entrada de alta frecuencia; los controles, indicadores, diálogo y cola se benefician de actualización declarativa. | Reescribir toda la interfaz dentro de PixiJS: complica formularios y reactividad. |
| Integración directa de PixiJS en un componente de ciclo de vida controlado | Evita otra capa de dependencias y mantiene el stack simple. | Un wrapper adicional de Pixi para React: añade superficie de mantenimiento sin necesidad del MVP. |
| Persistencia local versionada | Satisface continuidad sin cuentas ni backend y permite migraciones explícitas. | Backend remoto: está fuera de alcance y exigiría autenticación y operación adicional. |
| Cola de acciones como dominio | Hace determinista el orden, los aplazamientos y descartes; prepara comandos de Live sin integrar TikTok. | Ejecutar eventos directamente desde UI: pierde orden y no escala ante ráfagas. |
| Bloqueo de una sesión mediante coordinación entre pestañas del navegador | Cumple sesión única sin infraestructura remota. | Sin bloqueo: permite estados divergentes; bloqueo servidor: fuera de alcance. |
| Audio como adaptador tolerante a fallo | Las restricciones del navegador no deben impedir jugar. | Tratar el fallo de audio como error fatal: contradice RF-3. |
| Propuesta de Vitest para pruebas | Encaja con TypeScript y Vite, permite pruebas rápidas del dominio puro. Requerirá aprobación explícita antes de añadir la dependencia, conforme a `AGENTS.md`. | Depender solo de pruebas manuales: incumple la constitución. |

## Estrategia de tests

No se añadirá ningún framework ni dependencia sin aprobación explícita. Una vez aprobada la herramienta de pruebas, se implementarán los siguientes niveles. **Cubre RF-1 a RF-6.**

| Nivel | Casos automatizados | RF |
|---|---|---|
| Dominio: necesidades y estados | Valores iniciales; límites 0–100; alimentación, limpieza, caricia, juego, descanso; deterioro despierto/dormido; enfermedad, tristeza, suciedad y prioridad visual. | RF-1, RF-6 |
| Dominio: tiempo | Ausencia normal, tope de 24 h, reloj negativo, regreso de segundo plano, recuperación de energía y resolución temporal del minijuego. | RF-4, RF-6 |
| Dominio: cola | Orden; pausa por animación/minijuego; despertar automático; espera por energía; procesamiento de acciones independientes; límite 0; límites 1–200; desborde; reducción de límite; estados visibles. | RF-1, RF-6 |
| Persistencia y migraciones | Lectura/escritura; versión actual; migración compatible; datos corruptos; almacenamiento bloqueado; cola y preferencias restauradas; normalización de acción interrumpida. | RF-1, RF-4, RF-5 |
| Reinicio y sesión | Confirmar/cancelar; conservar o borrar cola; restablecer preferencias; bloqueo de segunda pestaña y necesidad de recarga manual. | RF-4, RF-5, RF-6 |
| Integración de interfaz | Pulsación y táctil sobre Mochi; actualización de indicadores/mensajes; resaltado de necesidades; control de música; visibilidad/configuración de cola; confirmación de reinicio. | RF-1, RF-2, RF-3, RF-5 |
| Escena jugable | Minijuego de cinco segundos, captura de corazones, retorno a reposo y representación de estados/partículas. Los cálculos se sustituirán por el dominio probado. | RF-1, RF-2, RF-6 |

Cada cambio de comportamiento deberá actualizar la especificación, este plan cuando afecte el diseño, y sus pruebas en el mismo cambio.
