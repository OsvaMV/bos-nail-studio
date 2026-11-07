# Agenda de citas con Google Sheets

Con esto el sitio deja de ofrecer horarios que ya están apartados. Cada solicitud se guarda en una hoja de Google que tú controlas, y te llega un correo por cada cita nueva.

Este paso lo haces una sola vez, con tu cuenta de Google. Toma unos 10 minutos.

## 1. Crear la hoja
1. Entra a [sheets.new](https://sheets.new) con tu cuenta de Google.
2. Ponle nombre, por ejemplo **Citas B&OS**.

## 2. Pegar el script
1. En la hoja, abre el menú **Extensiones → Apps Script**.
2. Borra lo que aparezca en el editor y pega todo el contenido de [`Code.gs`](Code.gs).
3. Haz clic en el ícono de engrane (**Configuración del proyecto**) y en **Zona horaria** elige **(GMT-06:00) Ciudad de México**.
4. Guarda con el ícono de disquete.

## 3. Publicarlo como aplicación web
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En **Seleccionar tipo**, elige **Aplicación web**.
3. Configura:
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** Cualquier usuario
4. Haz clic en **Implementar** y autoriza los permisos. Google mostrará un aviso de "app no verificada", porque el script es tuyo y no de una empresa. Elige **Configuración avanzada → Ir a … (no seguro)** y luego **Permitir**.
   - El script solo puede leer y escribir **esta** hoja y enviarte correos a ti.
5. Copia la **URL de la aplicación web**. Termina en `/exec`.

## 4. Conectarla al sitio
En `index.html` busca esta línea:

```js
const BOOKING_API = '';
```

y pon tu URL entre las comillas:

```js
const BOOKING_API = 'https://script.google.com/macros/s/XXXXXXXX/exec';
```

O pásame la URL y yo lo hago.

## Cómo se usa la hoja
La primera solicitud crea la pestaña **Citas** con estas columnas:

| Registrada | Fecha | Hora | Termina | Estado | Nombre | Celular | Correo | Edad | Servicio | Referencia | Notas |
|---|---|---|---|---|---|---|---|---|---|---|---|

- **Cada solicitud nueva llega con Estado `Pendiente`** y ya bloquea su horario en el sitio.
- **Cuando confirmes por WhatsApp,** cambia el Estado a `Confirmada` (es opcional, pero ayuda a organizarte).
- **Para liberar un horario,** cambia el Estado a `Cancelada` o `Rechazada`, o borra el renglón.
- **Para bloquear un día o un rato** (vacaciones, cita personal), agrega un renglón a mano con Fecha, Hora, Termina y Estado `Bloqueado`.
  - Fecha en formato `2026-10-20`, horas en formato `07:00`.
  - Ejemplo de día completo: `2026-10-20` · `07:00` · `19:00` · `Bloqueado`.

## Reglas que aplica (en el sitio y también en el servidor)
- **Fechas:** no se aceptan días pasados. Para el mismo día, solo horarios con al menos 1 hora de anticipación.
- **Horarios:** entre semana solo 7:00 am y 4:00 pm. Sábado y domingo, cada 30 minutos de 7:00 am a 5:00 pm.
- **Duración:** cada cita dura 2 horas, así que una cita a las 10:00 bloquea de 10:00 a 12:00.
- **Límite por número:** máximo 2 solicitudes futuras activas por celular, para evitar que alguien aparte muchos horarios.
- **Privacidad:** el sitio solo recibe fecha y hora de los horarios ocupados, nunca nombres ni teléfonos.

Para cambiar la duración o el límite, edita `CONFIG` al inicio de `Code.gs`. La duración se cambia también en `DURATION_MIN` dentro de `index.html`. Después de editar el script, ve a **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar**. La URL se mantiene igual.
