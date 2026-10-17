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
- Como futuro espectador de un directo, quiero que Mochi conserve una experiencia y un estado preparados para futuras interacciones colectivas.

## Requisitos funcionales

### RF-1. Experiencia jugable equivalente
- Cuando la persona abra el juego, el sistema deberá mostrar a Mochi, la habitación, las animaciones y los efectos visuales con una experiencia equivalente a la actual, sin exigir equivalencia visual píxel a píxel.
- Cuando una persona solicite alimentar, limpiar, acariciar, hacer jugar o cambiar el descanso de Mochi, el sistema deberá encolar la acción para procesarla en orden de llegada.
- El sistema deberá permitir que cualquier persona configure desde la interfaz el límite de acciones pendientes de la cola entre 0 y 200 acciones, con un valor predeterminado de 20.
- Si el límite de acciones pendientes es 0, el sistema deberá rechazar las nuevas acciones hasta que la persona configure un límite mayor que 0.
- Si el límite de acciones pendientes es 0 y llega una nueva acción, el sistema deberá mostrar un aviso visible en español indicando que la cola está desactivada.
- Si la persona reduce el límite de la cola por debajo de la cantidad de acciones pendientes, el sistema deberá descartar de inmediato las acciones más próximas a ejecutarse hasta cumplir el nuevo límite.
- Cuando la cola alcance su límite y llegue una nueva acción, el sistema deberá descartar la acción pendiente más próxima a ejecutarse, desplazar las demás una posición y añadir la nueva acción al final de la cola.
- Cuando una acción se descarte porque la cola alcanzó su límite, el sistema deberá mostrar un aviso visible en español que identifique la acción eliminada.
- Cuando el sistema procese una acción encolada, deberá aplicar sus efectos actuales sobre las necesidades, animación, mensaje y efectos audiovisuales.
- Cuando una acción encolada tenga una animación o un minijuego asociado, el sistema deberá esperar a que finalice antes de procesar la siguiente acción de la cola.
- Cuando una acción distinta de cambiar el descanso llegue a su turno y Mochi esté dormido, el sistema deberá despertarlo y ejecutar esa acción a continuación.
- Si una acción pendiente no puede ejecutarse por una condición temporal, el sistema deberá mantenerla en la cola y podrá procesar acciones posteriores que no dependan de esa condición.
- Cuando la persona active la visibilidad de la cola, el sistema deberá mostrar una lista de cada acción pendiente con uno de estos estados: pendiente, en ejecución o en espera por energía.
- Cuando la persona desactive la visibilidad de la cola, el sistema deberá ocultar las acciones pendientes sin detener su procesamiento.
- Cuando la persona abra el juego por primera vez, el sistema deberá mostrar la lista de la cola de forma predeterminada.
- Cuando la persona cambie la visibilidad de la cola, el sistema deberá conservar esa preferencia y restaurarla al volver a abrir el juego.
- Cuando la acción Dormir sea la siguiente en procesarse y Mochi esté despierto, el sistema deberá ponerlo a dormir.
- Cuando la acción Dormir sea la siguiente en procesarse y Mochi esté dormido, el sistema deberá despertarlo.
- Cuando una necesidad alcance los umbrales actuales de malestar o enfermedad, el sistema deberá reflejar visualmente el estado correspondiente de Mochi.

### RF-2. Interacción con puntero y táctil
- Cuando la persona pulse o toque a Mochi fuera del minijuego, el sistema deberá acariciarlo si la interacción ocurre sobre la mascota.
- Cuando el minijuego esté activo, el sistema deberá permitir mover a Mochi mediante puntero o toque para atrapar corazones durante su duración actual.
- Cuando termine el minijuego, el sistema deberá mostrar la cantidad de corazones atrapados, restaurar a Mochi a su posición de reposo y aplicar los efectos actuales del juego.

### RF-3. Información reactiva y sonido
- Cuando cambie cualquier necesidad de Mochi, el sistema deberá actualizar sus indicadores visibles sin requerir recargar la página.
- Cuando el hambre sea igual o menor que 20, el sistema deberá destacar visualmente su indicador y el control Alimentar.
- Cuando la felicidad sea igual o menor que 20, el sistema deberá destacar visualmente su indicador y el control Acariciar.
- Cuando la limpieza sea igual o menor que 20, el sistema deberá destacar visualmente su indicador y el control Limpiar.
- Cuando la energía sea igual o menor que 20, el sistema deberá destacar visualmente su indicador y el control Dormir.
- Cuando cambie el estado o suceda una acción relevante, el sistema deberá actualizar el mensaje visible en español sin requerir recargar la página.
- Cuando la persona abra una sesión nueva, el sistema deberá iniciar con la música activada.
- Cuando la persona active o desactive la música, el sistema deberá respetar su elección durante la sesión actual.
- Si la música está activada y el dispositivo o navegador impide iniciarla automáticamente, el sistema deberá iniciarla con la primera interacción de la persona.

### RF-4. Persistencia y progreso fuera de línea
- Cuando cambie el progreso de Mochi, el sistema deberá conservar sus necesidades, estado de descanso, la condición única de si requiere limpieza, las acciones pendientes de la cola, la preferencia de visibilidad de la cola, el límite configurado de la cola y el momento del último progreso conocido.
- Cuando se conserve el progreso, el sistema deberá incluir una versión del formato de datos.
- Cuando la persona vuelva a abrir el juego, el sistema deberá restaurar el progreso conservado.
- Cuando la persona vuelva a abrir el juego con acciones pendientes conservadas, el sistema deberá restaurarlas y reanudar su procesamiento.
- Si el progreso conservado pertenece a una versión anterior, el sistema deberá adaptarlo automáticamente sin perder el progreso compatible.
- Si el progreso conservado no se puede adaptar, el sistema deberá iniciar un estado seguro y mostrar un aviso en español.
- Si la persona abre una segunda pestaña mientras ya existe una sesión activa, el sistema deberá impedir iniciar una segunda sesión y mostrar un mensaje en español que indique que ya hay una sesión abierta.
- Cuando una segunda pestaña esté bloqueada y la sesión activa se cierre, el sistema deberá requerir que la persona recargue manualmente la segunda pestaña antes de poder jugar.
- Cuando haya transcurrido tiempo desde el último progreso conocido, el sistema deberá disminuir las necesidades de Mochi conforme al tiempo real transcurrido, sin reducirlas por debajo de cero.
- Cuando el juego vuelva a primer plano después de estar en segundo plano o con el dispositivo bloqueado, el sistema deberá aplicar el deterioro correspondiente al tiempo real transcurrido desde el último progreso conocido.
- Cuando el tiempo transcurrido supere 24 horas, el sistema deberá aplicar como máximo 24 horas de deterioro al recuperar el progreso.
- Si el tiempo calculado desde el último progreso conocido es negativo, el sistema deberá aplicar cero deterioro y conservar el último momento de progreso válido.
- Cuando la ausencia prolongada implique suciedad pendiente, el sistema deberá representar como máximo una necesidad de limpieza pendiente, aunque hayan transcurrido múltiples ciclos de suciedad.
- Si el progreso conservado no se puede leer o no es válido, el sistema deberá descartarlo, iniciar un estado seguro y mostrar un aviso en español.
- Si el progreso no se puede conservar porque el almacenamiento no está disponible, está lleno o está bloqueado, el sistema deberá permitir continuar jugando durante la sesión y mostrar un aviso en español de que el progreso no se conservará.

### RF-5. Reinicio seguro
- Cuando la persona solicite reiniciar el progreso, el sistema deberá pedir confirmación antes de modificarlo.
- Cuando el sistema solicite confirmación de reinicio, deberá permitir a la persona elegir si conserva las acciones pendientes de la cola.
- Si la persona confirma el reinicio y elige conservar las acciones pendientes, el sistema deberá borrar el resto del progreso conservado, restaurar el estado inicial de Mochi, mantener la cola y restaurar las preferencias de cola a sus valores predeterminados.
- Si la persona confirma el reinicio sin elegir conservar las acciones pendientes, el sistema deberá borrar todo el progreso conservado, incluida la cola, y restaurar el estado inicial de Mochi y las preferencias de cola a sus valores predeterminados.
- Si la persona cancela el reinicio, el sistema deberá conservar el progreso sin cambios.

### RF-6. Reglas de juego actuales
- Cuando se inicie un progreso nuevo o se confirme un reinicio, el sistema deberá establecer hambre en 78, felicidad en 86, limpieza en 82 y energía en 75.
- Cuando se confirme un reinicio, el sistema deberá establecer el límite de la cola en 20 y mostrar la cola.
- Cuando la persona alimente a Mochi, el sistema deberá aumentar el hambre en 30 y reducir la limpieza en 5, respetando los límites de cada necesidad.
- Cuando la persona limpie a Mochi, el sistema deberá aumentar la limpieza en 40, aumentar la felicidad en 5 y eliminar la suciedad pendiente, respetando los límites de cada necesidad.
- Cuando la persona acaricie a Mochi, el sistema deberá aumentar la felicidad en 15, respetando su límite máximo.
- Cuando la persona inicie el minijuego con al menos 12 de energía, el sistema deberá aumentar la felicidad en 25, reducir la energía en 15 y reducir el hambre en 8, respetando los límites de cada necesidad.
- Si la energía de Mochi es inferior a 12 cuando el minijuego llegue a su turno, el sistema deberá mantener esa acción pendiente hasta que Mochi recupere al menos 12 de energía y podrá procesar las acciones posteriores que no dependan de energía.
- Cuando la persona atrape un corazón durante el minijuego, el sistema deberá aumentar la felicidad en 3, respetando su límite máximo.
- Cuando el minijuego se inicie, el sistema deberá finalizarlo después de 5 segundos.
- Cuando el juego pase a segundo plano durante el minijuego, el sistema deberá mantener su progreso temporal y resolverlo según el tiempo real transcurrido al volver a primer plano.
- Mientras Mochi esté despierto y fuera del minijuego, el sistema deberá reducir por segundo el hambre en 0,25, la felicidad en 0,15, la limpieza en 0,12 y la energía en 0,08.
- Mientras Mochi duerma y esté fuera del minijuego, el sistema deberá aumentar por segundo la energía en 2 y reducir el hambre en 0,05, la felicidad en 0,03 y la limpieza en 0,02.
- Cuando la energía alcance 98 durante el descanso, el sistema deberá despertar a Mochi.
- Cuando el hambre permanezca en cero durante 30 segundos, el sistema deberá mostrar a Mochi enfermo.
- Cuando el hambre sea inferior a 8, la felicidad sea inferior a 10 o la limpieza sea inferior a 10, el sistema deberá mostrar a Mochi triste, salvo que corresponda un estado de mayor prioridad.
- Cuando la limpieza sea inferior a 20 o existan dos o más suciedades pendientes, el sistema deberá mostrar a Mochi sucio, salvo que corresponda un estado de mayor prioridad.
- Cuando coincidan varios estados visuales, el sistema deberá aplicar este orden de prioridad: durmiendo, enfermo, triste, sucio, comiendo y normal.
- Cuando Mochi esté despierto y fuera del minijuego, el sistema deberá generar una suciedad pendiente entre 45 y 90 segundos después de la anterior, reducir la limpieza en 12 y reducir la felicidad en 6.

## Requisitos no funcionales
- La experiencia deberá poder usarse con ratón y con interacción táctil.
- La información y los mensajes visibles deberán estar en español.
- Las acciones deberán procesarse de forma secuencial y en orden de llegada mediante una cola.
- El estado persistido deberá poder evolucionar sin invalidar el progreso ya guardado.
- El estado persistido deberá incluir una versión y conservarse mediante adaptaciones compatibles entre versiones.

## Casos límite
- Una necesidad nunca será menor que cero ni mayor que su máximo.
- Tras una ausencia muy prolongada, las necesidades podrán alcanzar cero, pero no se acumularán múltiples tareas visuales de limpieza.
- Al restaurar el progreso, la suciedad pendiente se representará únicamente como una condición de que Mochi requiere limpieza; no se conservarán posiciones ni temporizadores de suciedad.
- Si el reloj del dispositivo retrocede o el tiempo calculado resulta negativo, no se aplicará deterioro.
- Si el juego vuelve a primer plano después de permanecer en segundo plano o con el dispositivo bloqueado, se aplicará el deterioro de la ausencia antes de permitir nuevas acciones.
- Si el juego vuelve a primer plano durante un minijuego, se resolverá el minijuego según el tiempo real transcurrido antes de permitir nuevas acciones.
- Una acción no podrá ejecutarse dos veces por una única pulsación o toque.
- Si el sonido no está disponible, el juego deberá seguir siendo completamente jugable.
- Si el almacenamiento no está disponible, está lleno o está bloqueado, el juego deberá seguir siendo completamente jugable durante la sesión, aunque el progreso no pueda conservarse.
- Si la persona intenta abrir una segunda pestaña mientras existe una sesión activa, la segunda pestaña deberá mostrar el aviso correspondiente y no permitirá jugar.
- Si la sesión activa se cierra, una segunda pestaña bloqueada seguirá sin permitir jugar hasta que la persona la recargue manualmente.
- Si se reinicia mientras Mochi duerme, mientras hay suciedad o durante el minijuego, el estado inicial deberá prevalecer al confirmar.

## Fuera de alcance
- Interacciones reales procedentes de TikTok Live.
- Progreso compartido entre varias personas o dispositivos.
- Cuentas de usuario, autenticación, clasificación o economía del juego.
- Nuevas acciones, minijuegos, mascotas, escenarios o cambios de balance distintos a los ya existentes.

## Criterios de finalización
- Todas las acciones, animaciones, efectos y controles actuales funcionan de forma equivalente con ratón y táctil.
- Las reglas de juego, valores iniciales, efectos de acciones, umbrales y duraciones definidos en RF-6 se cumplen.
- Los indicadores y mensajes reflejan cada acción procesada sin recargar la página.
- El progreso se recupera al volver y el tiempo ausente afecta las necesidades según los requisitos.
- El reinicio requiere confirmación y restaura correctamente el estado inicial.
- Las pruebas automatizadas cubren las reglas de juego y de cola, la persistencia y adaptación del progreso, el límite de 24 horas, el tiempo negativo, el reinicio y el bloqueo de una segunda sesión.

## Dudas abiertas
No hay dudas abiertas.
