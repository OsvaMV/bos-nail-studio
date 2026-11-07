# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Clientas jóvenes de 18 a 30 años que descubren el estudio por redes sociales (Instagram, TikTok, Facebook). Llegan con una referencia o un diseño en tendencia en mente y quieren saber, desde el celular, si el estudio puede lograrlo, qué días y horas hay disponibles y cómo apartar su cita.

## Product Purpose
Sitio de una sola página para B&OS Nail Studio que muestra el trabajo real, respalda la técnica con certificados y convierte la visita en una solicitud de cita. Éxito = la clienta envía la solicitud desde el formulario (o escribe por WhatsApp) y la cita se confirma por WhatsApp.

## Positioning
Estudio independiente atendido personalmente por la técnica, una clienta a la vez: diseño personalizado a mano (recrea la referencia que trae la clienta), formación certificada reciente y precio accesible frente a un salón.

## Operating Context
- Atención en estudio dentro de casa. En el sitio se muestra solo la zona; la dirección exacta se comparte por WhatsApp al confirmar.
- Toda solicitud queda pendiente hasta confirmarse por WhatsApp.
- Horario: todos los días, cada 30 minutos, de 8:00 am a 7:00 pm (última hora para iniciar una cita).
- El formulario envía a Formspree (`https://formspree.io/f/xyegejqn`) mientras no esté conectada la agenda.
- Agenda: Google Sheets + Apps Script (`agenda/Code.gs`, instalación en `agenda/README.md`). Cada solicitud aparta su horario al recibirse (Estado "Pendiente"); citas de 2 horas; máximo 2 solicitudes futuras por celular. Se conecta poniendo la URL en `BOOKING_API` dentro de `index.html`.

## Capabilities and Constraints
Servicios disponibles hoy:
- Manos: Gelish / esmalte semipermanente, soft-gel, poli-gel (sistema dual), acrílico / uñas esculturales, nail art y diseño personalizado.
- Pies: acri-pie, gel semipermanente en pie, pedispa.

Próximamente (aún no disponibles): aplicación de pestañas, diseño de cejas.

Restricciones técnicas: un solo `index.html` estático, sin framework ni build; se publica como sitio estático.

Pendientes por decidir / confirmar:
- Si se muestran precios o rangos de precio.
- Si "Retoque / mantenimiento" sigue en el formulario (se conservó) y si "Manicura clásica" vuelve (se retiró por no estar en la lista confirmada).

## Brand Commitments
- Nombre: B&OS Nail Studio. Técnica: Betsabe Villalba.
- Logotipo oficial: medallón circular con aros dorados, acuarela durazno y "B&OS · Betsabe Villalba · Nails Studio / Nails Estudio" en letra caligráfica. Recursos en `img/logo/` (medallón con transparencia `logo-720.webp` / `logo-160.webp`, favicons e `og-image.jpg`). Usarlo como sello claro sobre fondos oscuros; no recolorearlo.
- Pendiente: el logo dice "Nails Studio" y el sitio "Nail Studio"; decidir cuál es el nombre oficial.
- Contacto público: solo WhatsApp 56 1157 5197 (`https://wa.me/525611575197`), sin redes sociales en el sitio.
- Ubicación pública: "Nicolás Romero, Edo. Méx." (C.P. 52918). No publicar mapa ni dirección exacta.
- Idioma: español de México, tuteo, tono cercano.

## Evidence on Hand
- 13 fotos reales de trabajos (portafolio "Mi trabajo") y 5 diplomas/reconocimientos de 2026 (D'Nory'z Nail's y otros), hoy incrustados en `index.html`.
- No existen testimonios, reseñas, número de clientas ni precios publicados: no fabricarlos.

## Product Principles
1. El trabajo real es la prueba: las fotos propias mandan sobre cualquier decoración.
2. Del interés a la cita en pocos toques desde el celular; WhatsApp siempre a la mano.
3. Solo prometer lo que hoy se ofrece; lo futuro se etiqueta claramente como próximamente.
4. Cercanía personal sobre apariencia de cadena: una técnica, una clienta a la vez.
5. Ligero y rápido en datos móviles.
