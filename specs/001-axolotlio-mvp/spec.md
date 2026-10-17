# Especificación 001: experiencia jugable de Mochi

## Contexto y objetivo
Mochi es una mascota virtual que las personas pueden alimentar, limpiar, acariciar, poner a dormir y usar en un minijuego. El objetivo es renovar la experiencia visual jugable sin alterar sus interacciones ni su respuesta, manteniendo los controles y la información reactiva de la pantalla, y haciendo que el progreso sobreviva entre visitas para preparar el juego para futuras interacciones colectivas en directos.

## Usuarios
- Persona que cuida de Mochi desde ordenador o dispositivo táctil.
- Futuros espectadores de un directo que observarán y afectarán al estado compartido de Mochi.

## Historias de usuario
- Como cuidador, quiero realizar todas las acciones actuales sobre Mochi para conservar la experiencia de juego conocida.
- Como cuidador, quiero ver inmediatamente el estado, los mensajes y las reacciones de Mochi tras cada acción.
- Como cuidador, quiero retomar el progreso de Mochi al volver al juego para que la mascota tenga continuidad.
- Como cuidador, quiero reiniciar el progreso de forma segura si deseo empezar de nuevo.

## Requisitos funcionales

### RF-1. Experiencia jugable equivalente
- Cuando la persona abra el juego, el sistema deberá mostrar a Mochi, la habitación, las animaciones y los efectos visuales de la experiencia actual.
- Cuando la persona alimente, limpie, acaricie, haga jugar o cambie el descanso de Mochi, el sistema deberá conservar los efectos actuales sobre sus necesidades, animación, mensaje y efectos audiovisuales.
- Mientras Mochi duerma, el sistema deberá impedir las acciones que actualmente requieren que esté despierto e informar el motivo con un mensaje en español.
- Cuando una necesidad alcance los umbrales actuales de malestar o enfermedad, el sistema deberá reflejar visualmente el estado correspondiente de Mochi.

### RF-2. Interacción con puntero y táctil
- Cuando la persona pulse o toque a Mochi fuera del minijuego, el sistema deberá acariciarlo si la interacción ocurre sobre la mascota.
- Cuando el minijuego esté activo, el sistema deberá permitir mover a Mochi mediante puntero o toque para atrapar corazones durante su duración actual.
- Cuando termine el minijuego, el sistema deberá mostrar la cantidad de corazones atrapados, restaurar a Mochi a su posición de reposo y aplicar los efectos actuales del juego.

### RF-3. Información reactiva y sonido
- Cuando cambie cualquier necesidad de Mochi, el sistema deberá actualizar sus indicadores visibles sin requerir recargar la página.
- Cuando cambie el estado o suceda una acción relevante, el sistema deberá actualizar el mensaje visible en español sin requerir recargar la página.
- Mientras el juego esté activo, el sistema deberá mantener la música de fondo activa.
- Si el dispositivo o navegador impide iniciar la música automáticamente, el sistema deberá iniciarla con la primera interacción de la persona y mantenerla activa mientras el juego continúe abierto.

### RF-4. Persistencia y progreso fuera de línea
- Cuando cambie el progreso de Mochi, el sistema deberá conservar sus necesidades, estado de descanso, estado de limpieza y el momento del último progreso conocido.
- Cuando la persona vuelva a abrir el juego, el sistema deberá restaurar el progreso conservado.
- Cuando haya transcurrido tiempo desde el último progreso conocido, el sistema deberá disminuir las necesidades de Mochi conforme al tiempo real transcurrido, sin reducirlas por debajo de cero.
- Cuando el tiempo transcurrido supere 24 horas, el sistema deberá aplicar como máximo 24 horas de deterioro al recuperar el progreso.
- Cuando la ausencia prolongada implique suciedad pendiente, el sistema deberá representar como máximo una necesidad de limpieza pendiente, aunque hayan transcurrido múltiples ciclos de suciedad.
- Si el progreso conservado no se puede leer o no es válido, el sistema deberá descartarlo, iniciar un estado seguro y mostrar un aviso en español.

### RF-5. Reinicio seguro
- Cuando la persona solicite reiniciar el progreso, el sistema deberá pedir confirmación antes de modificarlo.
- Si la persona confirma el reinicio, el sistema deberá borrar el progreso conservado y restaurar el estado inicial de Mochi.
- Si la persona cancela el reinicio, el sistema deberá conservar el progreso sin cambios.

## Requisitos no funcionales
- La experiencia deberá poder usarse con ratón y con interacción táctil.
- La información y los mensajes visibles deberán estar en español.
- Las transiciones de estado y las interacciones deberán percibirse de forma inmediata durante el juego.
- El estado persistido deberá poder evolucionar sin invalidar el progreso ya guardado.

## Casos límite
- Una necesidad nunca será menor que cero ni mayor que su máximo.
- Tras una ausencia muy prolongada, las necesidades podrán alcanzar cero, pero no se acumularán múltiples tareas visuales de limpieza.
- Una acción no podrá ejecutarse dos veces por una única pulsación o toque.
- Si el sonido no está disponible, el juego deberá seguir siendo completamente jugable.
- Si se reinicia mientras Mochi duerme, mientras hay suciedad o durante el minijuego, el estado inicial deberá prevalecer al confirmar.

## Fuera de alcance
- Interacciones reales procedentes de TikTok Live.
- Progreso compartido entre varias personas o dispositivos.
- Cuentas de usuario, autenticación, clasificación o economía del juego.
- Nuevas acciones, minijuegos, mascotas, escenarios o cambios de balance distintos a los ya existentes.

## Criterios de finalización
- Todas las acciones, animaciones, efectos y controles actuales funcionan de forma equivalente con ratón y táctil.
- Los indicadores y mensajes reflejan cada cambio de estado sin recargar la página.
- El progreso se recupera al volver y el tiempo ausente afecta las necesidades según los requisitos.
- El reinicio requiere confirmación y restaura correctamente el estado inicial.
- Los criterios de aceptación están cubiertos por pruebas automatizadas de las reglas de juego y de la recuperación del progreso.

## Dudas abiertas
No hay dudas abiertas.
