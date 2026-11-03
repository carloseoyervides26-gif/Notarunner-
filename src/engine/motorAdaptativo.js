// Motor adaptativo: funciones puras (sin React ni internet).
// Todas reciben datos y devuelven decisiones. Los umbrales están en reglas.js.

import {
  SENSACION,
  UV,
  AQI,
  NIVELES,
  AVISOS_AIRE,
  MEJOR_HORA,
  RANKING,
  ALERTA_METROS,
  EN_TRAMO_METROS,
  RUTA_ALTERNA,
} from './reglas.js'
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

// ---------- Distancias (Haversine hecha a mano) ----------

function aRadianes(grados) {
  return (grados * Math.PI) / 180
}

// Distancia en metros entre dos puntos { lat, lng }
function distanciaMetros(a, b) {
  const R = 6371000 // radio de la Tierra en metros
  const dLat = aRadianes(b.lat - a.lat)
  const dLng = aRadianes(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRadianes(a.lat)) * Math.cos(aRadianes(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function esNoche(hora) {
  return hora >= RANKING.NOCHE_DESDE || hora <= RANKING.NOCHE_HASTA
}

// ---------- ADAPTACIÓN 3: ranking de rutas por ubicación ----------

export function rankearRutas(rutas = [], contexto, ubicacion) {
  const riesgo = evaluarRiesgo(contexto)
  const noche = esNoche(contexto.hora)
  const origen = ubicacion ?? contexto.ubicacion

  const lista = rutas.map((ruta) => {
    let puntaje = RANKING.BASE
    let advertencia = null
    const etiquetas = []

    // Distancia desde el usuario hasta el inicio de la ruta
    let distanciaKm = null
    if (origen && Number.isFinite(ruta.lat_inicio) && Number.isFinite(ruta.lng_inicio)) {
      distanciaKm =
        distanciaMetros(origen, { lat: ruta.lat_inicio, lng: ruta.lng_inicio }) / 1000
      puntaje -= distanciaKm * RANKING.PENALIZA_KM
    }

    // La sombra solo importa cuando hay calor, UV o aire malo
    if (riesgo.nivel >= 1) puntaje += (ruta.sombra_pct ?? 0) * RANKING.FACTOR_SOMBRA

    // Fuentes de agua (con tope)
    puntaje += Math.min(
      (ruta.fuentes_agua ?? 0) * RANKING.PUNTOS_POR_FUENTE,
      RANKING.MAX_PUNTOS_AGUA
    )

    // De noche, la iluminación suma
    if (noche && (ruta.iluminacion_pct ?? 0) > RANKING.ILUMINACION_MIN) {
      puntaje += RANKING.BONO_ILUMINACION
    }

    // Rutas "solo mañana" después de las 11:00
    if (ruta.solo_am && contexto.hora >= RANKING.HORA_SOLO_AM) {
      puntaje -= RANKING.PENALIZA_SOLO_AM
      advertencia = ruta.aviso_horario || 'Sol directo después de las 11:00 AM'
    }

    // Etiquetas automáticas
    const sombra = ruta.sombra_pct ?? 0
    if (sombra >= RANKING.SOMBRA_ETIQUETA && riesgo.nivel >= 1) {
      etiquetas.push('SEGURA PARA CALOR ACTUAL')
    }
    if (sombra >= RANKING.SOMBRA_ETIQUETA) etiquetas.push(`${sombra}% SOMBRA`)
    if (ruta.iluminacion_pct === 100) etiquetas.push('100% ILUMINACIÓN')

    return {
      ...ruta,
      puntaje: Math.round(puntaje * 10) / 10,
      distanciaKm: distanciaKm === null ? null : Math.round(distanciaKm * 10) / 10,
      etiquetas,
      advertencia,
    }
  })

  // De mayor a menor puntaje
  return lista.sort((a, b) => b.puntaje - a.puntaje)
}

// ---------- ADAPTACIÓN 5: alerta en carrera por tramos sin sombra ----------

// posicion = { lat, lng }. geojsonRuta = FeatureCollection del Contrato 3
// (los GeoJSON guardan las coordenadas como [lng, lat]).
export function evaluarAlertaEnCarrera(posicion, geojsonRuta, contexto) {
  if (!posicion || !geojsonRuta || !Array.isArray(geojsonRuta.features)) return null

  // Solo alerta si hay calor o UV alto
  const hayRiesgo = sensacionDe(contexto) >= SENSACION.MODERADO || contexto.uv >= UV.ALTO
  if (!hayRiesgo) return null

  // Junta todos los puntos de la ruta, en orden, marcando los que no tienen sombra
  const puntos = []
  for (const f of geojsonRuta.features) {
    if (f.geometry?.type !== 'LineString') continue
    const baja = f.properties?.sombra === 'baja'
    for (const c of f.geometry.coordinates) {
      puntos.push({ lat: c[1], lng: c[0], baja })
    }
  }
  if (puntos.length === 0) return null

  // Punto de la ruta más cercano al corredor
  let cercano = 0
  let minimo = Infinity
  puntos.forEach((p, i) => {
    const d = distanciaMetros(posicion, p)
    if (d < minimo) {
      minimo = d
      cercano = i
    }
  })

  // Avanza por la ruta (hacia adelante) hasta el primer punto sin sombra
  let metros = minimo
  for (let j = cercano; j < puntos.length; j++) {
    if (metros > ALERTA_METROS) return null
    if (puntos[j].baja) {
      if (metros <= EN_TRAMO_METROS) {
        return {
          mensaje: '¡Estás en un tramo sin sombra y con pavimento caliente!',
          metros: 0,
        }
      }
      const redondeado = Math.round(metros)
      return {
        mensaje: `¡Atención a ${redondeado}m! Tramo sin sombra y pavimento caliente.`,
        metros: redondeado,
      }
    }
    if (j + 1 < puntos.length) metros += distanciaMetros(puntos[j], puntos[j + 1])
  }
  return null
}

// ---------- ADAPTACIÓN 1 (parte B): ruta alterna con más sombra ----------

export function elegirRutaAlterna(rutaActual, rutas = [], contexto) {
  if (!rutaActual || evaluarRiesgo(contexto).nivel < 2) return null
  if (!Number.isFinite(rutaActual.lat_inicio) || !Number.isFinite(rutaActual.lng_inicio)) return null

  const inicioActual = { lat: rutaActual.lat_inicio, lng: rutaActual.lng_inicio }

  const candidatas = rutas.filter((r) => {
    if (r.id === rutaActual.id) return false
    if (!Number.isFinite(r.lat_inicio) || !Number.isFinite(r.lng_inicio)) return false
    const lejosKm = distanciaMetros(inicioActual, { lat: r.lat_inicio, lng: r.lng_inicio }) / 1000
    return (
      lejosKm <= RUTA_ALTERNA.RADIO_KM &&
      Math.abs(r.distancia_km - rutaActual.distancia_km) <= RUTA_ALTERNA.DIFERENCIA_DISTANCIA_KM &&
      (r.sombra_pct ?? 0) - (rutaActual.sombra_pct ?? 0) >= RUTA_ALTERNA.SOMBRA_EXTRA_PCT
    )
  })
  if (candidatas.length === 0) return null

  // La que tenga más sombra
  candidatas.sort((a, b) => (b.sombra_pct ?? 0) - (a.sombra_pct ?? 0))
  const elegida = candidatas[0]

  // Estimación del ahorro de sensación térmica (es una estimación, dilo así en el documento)
  const ahorro = ((elegida.sombra_pct ?? 0) - (rutaActual.sombra_pct ?? 0)) * RUTA_ALTERNA.FACTOR_AHORRO
  return { ...elegida, ahorroTermico: Math.round(ahorro * 10) / 10 }
}


