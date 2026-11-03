// Lectura de clima, UV y calidad del aire (Open-Meteo)
// Conexión con Open-Meteo (clima, UV y calidad del aire). Sin API key.
// Devuelve un objeto con la forma del CONTRATO 1 (contexto).

const URL_CLIMA = 'https://api.open-meteo.com/v1/forecast'
const URL_AIRE = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const CACHE_MS = 10 * 60 * 1000 // los datos se guardan 10 minutos

let cache = null // { clave, guardado, datos }

async function pedirJson(url) {
  const respuesta = await fetch(url)
  if (!respuesta.ok) {
    throw new Error(`El servicio del clima respondió con error ${respuesta.status}`)
  }
  return respuesta.json()
}

// "2026-11-02T14:00" -> 14
function horaDe(texto) {
  return Number(texto.slice(11, 13))
}

function armarContexto(clima, aire, lat, lng, ciudad) {
  const actual = clima.current
  const tiempos = clima.hourly.time
  const tiemposAire = aire.hourly.time

  // Busca la posición de la hora actual en la lista por hora ("2026-11-02T14")
  const prefijoActual = actual.time.slice(0, 13)
  let inicio = tiempos.findIndex((t) => t.slice(0, 13) === prefijoActual)
  if (inicio < 0) inicio = 0

  // Pronóstico de las próximas 24 horas
  const pronosticoHorario = []
  for (let i = inicio; i < Math.min(inicio + 24, tiempos.length); i++) {
    const j = tiemposAire.indexOf(tiempos[i])
    pronosticoHorario.push({
      hora: horaDe(tiempos[i]),
      temperatura: clima.hourly.temperature_2m[i],
      sensacionTermica: clima.hourly.apparent_temperature[i],
      uv: clima.hourly.uv_index[i] ?? 0,
      aqi: j >= 0 ? aire.hourly.us_aqi[j] : null,
    })
  }

  const ahora = pronosticoHorario[0]
  return {
    temperatura: actual.temperature_2m,
    sensacionTermica: actual.apparent_temperature,
    uv: ahora ? ahora.uv : 0,
    aqi: aire.current?.us_aqi ?? ahora?.aqi ?? null,
    humedad: actual.relative_humidity_2m,
    hora: horaDe(actual.time),
    pronosticoHorario,
    ubicacion: { lat, lng },
    ciudad,
    actualizado: new Date().toISOString(),
    desactualizado: false, // true si son datos guardados porque falló el internet
  }
}

export async function obtenerContextoReal(lat, lng, ciudad = 'Monterrey, NL') {
  // Redondeamos las coordenadas para reutilizar la caché si te mueves poco
  const la = Math.round(lat * 100) / 100
  const lo = Math.round(lng * 100) / 100
  const clave = `${la},${lo}`

  if (cache && cache.clave === clave && Date.now() - cache.guardado < CACHE_MS) {
    return cache.datos
  }

  try {
    const paramsClima = new URLSearchParams({
      latitude: la,
      longitude: lo,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m',
      hourly: 'temperature_2m,apparent_temperature,uv_index',
      timezone: 'auto',
      forecast_days: '2',
    })
    const paramsAire = new URLSearchParams({
      latitude: la,
      longitude: lo,
      current: 'us_aqi',
      hourly: 'us_aqi',
      timezone: 'auto',
      forecast_days: '2',
    })

    // Las dos consultas se hacen al mismo tiempo
    const [clima, aire] = await Promise.all([
      pedirJson(`${URL_CLIMA}?${paramsClima}`),
      pedirJson(`${URL_AIRE}?${paramsAire}`),
    ])

    const datos = armarContexto(clima, aire, lat, lng, ciudad)
    cache = { clave, guardado: Date.now(), datos }
    return datos
  } catch (error) {
    // Si falla el internet pero hay datos guardados, se usan y se marca el aviso
    if (cache) return { ...cache.datos, desactualizado: true }
    throw new Error('No se pudo obtener el clima. Revisa tu conexión a internet.')
  }
}