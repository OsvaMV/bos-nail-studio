/**
 * B&OS Nail Studio — agenda de citas con Google Sheets.
 *
 * Guarda cada solicitud en la hoja "Citas", le dice al sitio qué horarios están
 * ocupados (solo fecha y hora, nunca datos personales) y rechaza solicitudes para
 * días pasados u horarios que ya están apartados.
 *
 * Instalación: ver agenda/README.md
 */

const CONFIG = {
  SHEET_NAME: 'Citas',
  TIMEZONE: 'America/Mexico_City',
  DURATION_MIN: 120,          // duración de cada cita (debe coincidir con el sitio)
  LEAD_MIN: 60,               // anticipación mínima para citas del mismo día
  OWNER_EMAIL: '',            // vacío = se avisa a la cuenta dueña de este script
  MAX_ACTIVE_PER_PHONE: 2,    // solicitudes futuras activas por número de celular
  RANGE_MAX_DAYS: 62,         // máximo de días que el sitio puede consultar de una vez
};

const HEADERS = ['Registrada', 'Fecha', 'Hora', 'Termina', 'Estado', 'Nombre', 'Celular', 'Correo', 'Edad', 'Servicio', 'Referencia', 'Notas'];
// Estados que liberan el horario. Cualquier otro (Pendiente, Confirmada, Bloqueado…) lo mantiene ocupado.
const FREE_STATES = ['cancelada', 'cancelado', 'rechazada', 'rechazado'];

// ---------- reglas de horario (las mismas que usa el sitio) ----------

function pad_(n) { return String(n).padStart(2, '0'); }
function toMinutes_(hhmm) { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; }
function fromMinutes_(m) { return pad_(Math.floor(m / 60)) + ':' + pad_(m % 60); }
function isISODate_(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }
function isTime_(s) { return /^\d{2}:\d{2}$/.test(String(s || '')); }
function weekdayOf_(iso) {
  const [y, mo, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay(); // 0 domingo … 6 sábado
}

// Entre semana: 7:00 y 16:00. Fin de semana: cada 30 min de 7:00 a 17:00.
function slotsFor_(iso) {
  const wd = weekdayOf_(iso);
  if (wd !== 0 && wd !== 6) return ['07:00', '16:00'];
  const out = [];
  for (let m = 7 * 60; m <= 17 * 60; m += 30) out.push(fromMinutes_(m));
  return out;
}

// ¿La cita que empieza en `start` choca con alguna de `booked` ({start, end})?
function overlaps_(start, booked, durationMin) {
  const s = toMinutes_(start), e = s + durationMin;
  return booked.some(b => s < toMinutes_(b.end) && toMinutes_(b.start) < e);
}

// Devuelve un código de error o null si la solicitud es válida.
// `bookedThatDay`: citas activas de esa fecha. `now`: { date: 'YYYY-MM-DD', minutes }.
function validateRequest_(req, bookedThatDay, now, cfg) {
  if (!isISODate_(req.date) || !isTime_(req.time)) return 'invalid';
  if (req.date < now.date) return 'past';
  if (slotsFor_(req.date).indexOf(req.time) === -1) return 'invalid_slot';
  if (req.date === now.date && toMinutes_(req.time) < now.minutes + cfg.LEAD_MIN) return 'past';
  if (overlaps_(req.time, bookedThatDay, cfg.DURATION_MIN)) return 'taken';
  return null;
}

// ---------- hoja de cálculo ----------

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('B:D').setNumberFormat('@'); // fecha y horas como texto, sin conversiones automáticas
    sh.getRange('G:G').setNumberFormat('@');
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function cellDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.TIMEZONE, 'yyyy-MM-dd');
  const s = String(v || '').trim();
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // por si alguien escribe 20/10/2026 a mano
  return dmy ? dmy[3] + '-' + pad_(dmy[2]) + '-' + pad_(dmy[1]) : s;
}
function cellTime_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, CONFIG.TIMEZONE, 'HH:mm');
  const s = String(v || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  return m ? pad_(m[1]) + ':' + m[2] : s;
}

// Citas que ocupan horario. También sirven los bloqueos manuales (p. ej. Estado "Bloqueado").
function activeBookings_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, HEADERS.length).getValues()
    .map(r => {
      const date = cellDate_(r[1]), start = cellTime_(r[2]);
      const end = cellTime_(r[3]) || (isTime_(start) ? fromMinutes_(toMinutes_(start) + CONFIG.DURATION_MIN) : '');
      return { date, start, end, state: String(r[4] || '').trim().toLowerCase(), phone: String(r[6] || '').replace(/\D/g, '') };
    })
    .filter(b => isISODate_(b.date) && isTime_(b.start) && isTime_(b.end) && FREE_STATES.indexOf(b.state) === -1);
}

function nowParts_() {
  const now = new Date();
  return {
    date: Utilities.formatDate(now, CONFIG.TIMEZONE, 'yyyy-MM-dd'),
    minutes: toMinutes_(Utilities.formatDate(now, CONFIG.TIMEZONE, 'HH:mm')),
  };
}

// Evita que un texto se interprete como fórmula en la hoja.
function safe_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max || 200);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------- API del sitio ----------

// GET ?from=YYYY-MM-DD&to=YYYY-MM-DD → horarios ocupados (sin datos personales)
function doGet(e) {
  const p = (e && e.parameter) || {};
  const now = nowParts_();
  const from = isISODate_(p.from) ? p.from : now.date;
  let to = isISODate_(p.to) && p.to >= from ? p.to : from;
  const maxTo = Utilities.formatDate(new Date(new Date(from + 'T12:00:00Z').getTime() + CONFIG.RANGE_MAX_DAYS * 864e5), 'UTC', 'yyyy-MM-dd');
  if (to > maxTo) to = maxTo;

  const booked = activeBookings_(sheet_())
    .filter(b => b.date >= from && b.date <= to)
    .map(b => ({ date: b.date, start: b.start, end: b.end }));
  return json_({ ok: true, from, to, booked, durationMin: CONFIG.DURATION_MIN });
}

// POST (campos del formulario) → aparta el horario si sigue libre
function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p._gotcha) return json_({ ok: true }); // bot: se finge éxito y no se guarda nada

  const req = {
    date: String(p['Fecha preferida'] || '').trim(),
    time: String(p['Hora preferida'] || '').trim(),
    name: safe_(p['Nombre'], 80),
    phone: String(p['Celular'] || '').replace(/\D/g, ''),
    email: safe_(p['Correo'], 120),
    age: safe_(p['Edad'], 3),
    service: safe_(p['Servicio'], 80),
    reference: safe_(p['Referencia'], 200),
    notes: safe_(p['Notas'], 500),
  };
  if (!req.name || !/^\d{10}$/.test(req.phone)) return json_({ ok: false, error: 'invalid' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return json_({ ok: false, error: 'busy' });
  let end;
  try {
    const sh = sheet_();
    const all = activeBookings_(sh);
    const now = nowParts_();
    const error = validateRequest_(req, all.filter(b => b.date === req.date), now, CONFIG);
    if (error) return json_({ ok: false, error });
    const activeForPhone = all.filter(b => b.phone === req.phone && b.date >= now.date).length;
    if (activeForPhone >= CONFIG.MAX_ACTIVE_PER_PHONE) return json_({ ok: false, error: 'limit' });

    end = fromMinutes_(toMinutes_(req.time) + CONFIG.DURATION_MIN);
    sh.appendRow([new Date(), req.date, req.time, end, 'Pendiente', req.name, req.phone, req.email, req.age, req.service, req.reference, req.notes]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  try { notify_(req, end); } catch (err) { console.error('No se pudo enviar el aviso: ' + err); }
  return json_({ ok: true, booking: { date: req.date, start: req.time, end } });
}

function notify_(req, end) {
  const to = CONFIG.OWNER_EMAIL || Session.getEffectiveUser().getEmail();
  if (!to) return;
  const body = [
    'Nueva solicitud de cita (pendiente de confirmar):',
    '',
    'Fecha: ' + req.date + '  ·  ' + req.time + ' a ' + end,
    'Servicio: ' + req.service,
    'Nombre: ' + req.name,
    'Celular: ' + req.phone + '  ·  WhatsApp: https://wa.me/52' + req.phone,
    'Correo: ' + (req.email || '—'),
    'Edad: ' + (req.age || '—'),
    'Referencia: ' + (req.reference || '—'),
    'Notas: ' + (req.notes || '—'),
    '',
    'Para liberar el horario, cambia el Estado a "Cancelada" en la hoja ' + CONFIG.SHEET_NAME + '.',
  ].join('\n');
  MailApp.sendEmail({ to, subject: 'Nueva solicitud de cita · ' + req.date + ' ' + req.time + ' · B&OS Nail Studio', body });
}
