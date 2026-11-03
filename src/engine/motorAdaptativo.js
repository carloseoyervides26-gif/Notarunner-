// Motor adaptativo: funciones puras (sin React ni internet).
// Todas reciben datos y devuelven decisiones. Los umbrales están en reglas.js.

import { SENSACION, UV, AQI, NIVELES, AVISOS_AIRE, MEJOR_HORA } from './reglas.js'

// ---------- Utilidades ----------

// Si falta la sensación térmica, usa la temperatura
function sensacionDe(c) {
  return Number.isFinite(c.sensacionTermica) ? c.sensacionTermica : c.temperatura
}

function nivelPorSensacion(s) {
  if (s >= SENSACION.EXTREMO) return 3
  if (s >= SENSACION.FUERTE) return 2
  if (s >= SENSACION.MODERADO) return 1
  return 0
}

function nivelPorUV(uv) {
  if (uv >= UV.EXTREMO) return 3
  if (uv >= UV.MUY_ALTO) return 2
  if (uv >= UV.ALTO) return 1
  return 0
}

function nivelPorAire(aqi) {
  if (aqi > AQI.DANINO) return 3
  if (aqi > AQI.SENSIBLES) return 1
  return 0
}

function horaTexto(h) {
  return String(h).padStart(2, '0') + ':00'
}

// ---------- ADAPTACIÓN 1: nivel de riesgo térmico ----------

export function evaluarRiesgo(contexto) {
  const sensacion = sensacionDe(contexto)
  const uv = contexto.uv
  const aqi = contexto.aqi

  // El nivel final es el MAYOR de los tres niveles
  const nivel = Math.max(nivelPorSensacion(sensacion), nivelPorUV(uv), nivelPorAire(aqi))

  let avisoAire = null
  if (aqi > AQI.DANINO) avisoAire = AVISOS_AIRE.danino
  else if (aqi > AQI.SENSIBLES) avisoAire = AVISOS_AIRE.sensibles

  const info = NIVELES[nivel]
  return {
    nivel,
    etiqueta: info.etiqueta,
    mensaje: info.mensaje,
    color: info.color,
    hidratacionObligatoria: nivel >= 2,
    bloqueadorObligatorio: uv >= UV.MUY_ALTO,
    recomendarNoCorrer: nivel >= 3,
    avisoAire,
  }
}

// ---------- ADAPTACIÓN 2: mejor hora para correr ----------

// Puntaje de molestia de una hora: entre más bajo, mejor
function puntajeHora(h) {
  const sensacion = Number.isFinite(h.sensacionTermica) ? h.sensacionTermica : h.temperatura
  return sensacion + h.uv * 2 + (h.aqi > AQI.SENSIBLES ? 10 : 0)
}

export function calcularMejorHora(pronosticoHorario = []) {
  // Una entrada por hora (si el pronóstico trae 2 días, se queda con el primero)
  const porHora = new Map()
  for (const h of pronosticoHorario) {
    if (!porHora.has(h.hora)) porHora.set(h.hora, h)
  }
  const horas = [...porHora.values()]
    .filter((h) => h.hora >= MEJOR_HORA.INICIO_DIA && h.hora <= MEJOR_HORA.FIN_DIA)
    .sort((a, b) => a.hora - b.hora)

  if (horas.length === 0) {
    return { inicio: null, fin: null, despuesDe: null, motivo: 'Sin pronóstico disponible' }
  }

  // Mejor ventana de 2 horas seguidas en la mañana
  let mejor = null
  for (let i = 0; i < horas.length - 1; i++) {
    const a = horas[i]
    const b = horas[i + 1]
    if (b.hora !== a.hora + 1) continue
    if (a.hora > MEJOR_HORA.FIN_MANANA) continue
    const promedio = (puntajeHora(a) + puntajeHora(b)) / 2
    if (mejor === null || promedio < mejor.promedio) mejor = { hora: a.hora, promedio }
  }

  // Primera hora de la tarde-noche en que ya bajó el calor
  const tarde = horas.find(
    (h) => h.hora >= MEJOR_HORA.DESDE_TARDE && puntajeHora(h) <= MEJOR_HORA.UMBRAL_TARDE
  )

  return {
    inicio: mejor ? horaTexto(mejor.hora) : null,
    fin: mejor ? horaTexto(mejor.hora + 2) : null,
    despuesDe: tarde ? horaTexto(tarde.hora) : null,
    motivo: 'Menor acumulación de calor y UV',
  }
}

// ---------- ADAPTACIÓN 4: checklist de equipo ----------

export function generarChecklist(contexto) {
  const riesgo = evaluarRiesgo(contexto)
  const esDeNoche = contexto.hora >= 19 || contexto.hora <= 6

  const lista = [
    {
      id: 'bloqueador',
      nombre: 'Bloqueador Solar SPF 50+',
      detalle: riesgo.bloqueadorObligatorio
        ? 'Obligatorio hoy · Resistente a sudor'
        : 'Recomendado · Resistente a sudor',
      obligatorio: riesgo.bloqueadorObligatorio,
    },
    {
      id: 'lentes',
      nombre: 'Lentes de sol',
      detalle: 'Protección UV',
      obligatorio: false,
    },
    {
      id: 'gorra',
      nombre: 'Visera o Gorra',
      detalle: 'Proteger tu cara del sol directo',
      obligatorio: riesgo.bloqueadorObligatorio,
    },
    {
      id: 'hidratacion',
      nombre: 'Soft Flask / Cinturón (500ml)',
      detalle: 'Con agua para tomar',
      obligatorio: riesgo.hidratacionObligatoria,
    },
    {
      id: 'tenis',
      nombre: 'Tenis para correr',
      detalle: 'Calzado cómodo',
      obligatorio: false,
    },
  ]

  // Ítems que aparecen solo en ciertas condiciones
  if (esDeNoche) {
    lista.push({
      id: 'luz',
      nombre: 'Luz o reflejantes',
      detalle: 'Para que te vean de noche',
      obligatorio: false,
    })
  }
  if (contexto.aqi > AQI.SENSIBLES) {
    lista.push({
      id: 'cubrebocas',
      nombre: 'Cubrebocas',
      detalle: 'El aire está dañino para personas sensibles',
      obligatorio: false,
    })
  }

  return lista
}

// ---------- PROVISIONALES (se hacen en el siguiente paso) ----------

export function rankearRutas(rutas) {
  return rutas.map((r) => ({
    ...r,
    puntaje: 100,
    distanciaKm: null,
    etiquetas: [],
    advertencia: null,
  }))
}

export function evaluarAlertaEnCarrera() {
  return null
}

export function elegirRutaAlterna() {
  return null
}// Motor adaptativo: evaluarRiesgo, calcularMejorHora, rankearRutas,
// generarChecklist, evaluarAlertaEnCarrera, elegirRutaAlterna (CONTRATO 2)
