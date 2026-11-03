import { describe, it, expect } from 'vitest'
import {
  evaluarRiesgo,
  calcularMejorHora,
  generarChecklist,
  rankearRutas,
  evaluarAlertaEnCarrera,
  elegirRutaAlterna,
} from './motorAdaptativo.js'

// Contexto base: condiciones tranquilas
const base = { temperatura: 30, sensacionTermica: 25, uv: 3, aqi: 30, humedad: 40, hora: 10 }

describe('Adaptación 1: evaluarRiesgo (nivel de riesgo térmico)', () => {
  it.each([
    [25, 3, 30, 0],
    [33, 5, 40, 1],
    [37, 9.2, 42, 2],
    [41, 6, 40, 3],
    [28, 9, 30, 2], // sube a nivel 2 por UV
    [28, 3, 120, 1], // sube a nivel 1 por aire
    [28, 3, 170, 3], // sube a nivel 3 por aire
  ])('sensación %s, UV %s, AQI %s -> nivel %s', (sens, uv, aqi, nivel) => {
    const r = evaluarRiesgo({ ...base, sensacionTermica: sens, uv, aqi })
    expect(r.nivel).toBe(nivel)
  })

  it('con UV 9.2 el bloqueador es obligatorio', () => {
    expect(evaluarRiesgo({ ...base, sensacionTermica: 37, uv: 9.2 }).bloqueadorObligatorio).toBe(true)
  })

  it('con nivel 3 recomienda no correr', () => {
    expect(evaluarRiesgo({ ...base, sensacionTermica: 41 }).recomendarNoCorrer).toBe(true)
  })

  it('con AQI 120 trae un aviso de aire', () => {
    expect(evaluarRiesgo({ ...base, aqi: 120 }).avisoAire).not.toBeNull()
  })
})

describe('Adaptación 2: calcularMejorHora', () => {
  // Un día típico de Monterrey
  const pronostico = []
  for (let h = 0; h < 24; h++) {
    const sens = h < 7 ? 27 : h < 10 ? 30 : h < 18 ? 38 : h < 21 ? 33 : 29
    const uv = h < 7 ? 0 : h < 10 ? 4 : h < 17 ? 10 : h < 19 ? 2 : 0
    pronostico.push({ hora: h, temperatura: sens - 3, sensacionTermica: sens, uv, aqi: 40 })
  }

  it('la ventana de la mañana es de 05:00 a 07:00', () => {
    const r = calcularMejorHora(pronostico)
    expect(r.inicio).toBe('05:00')
    expect(r.fin).toBe('07:00')
  })

  it('"después de" cae en la tarde-noche, nunca a las 15:00', () => {
    const r = calcularMejorHora(pronostico)
    expect(r.despuesDe).toBe('19:00')
  })

  it('sin pronóstico no se rompe', () => {
    expect(calcularMejorHora([]).inicio).toBeNull()
  })
})

describe('Adaptación 4: generarChecklist', () => {
  const buscar = (c, id) => generarChecklist(c).find((i) => i.id === id)

  it('con UV 9.2 el bloqueador es obligatorio', () => {
    expect(buscar({ ...base, uv: 9.2 }, 'bloqueador').obligatorio).toBe(true)
  })
  it('con UV 3 el bloqueador no es obligatorio', () => {
    expect(buscar({ ...base, uv: 3 }, 'bloqueador').obligatorio).toBe(false)
  })
  it('con calor fuerte la hidratación es obligatoria', () => {
    expect(buscar({ ...base, sensacionTermica: 37 }, 'hidratacion').obligatorio).toBe(true)
  })
  it('de noche aparece luz o reflejantes', () => {
    expect(buscar({ ...base, hora: 20 }, 'luz')).toBeDefined()
  })
  it('con AQI 120 aparece el cubrebocas', () => {
    expect(buscar({ ...base, aqi: 120 }, 'cubrebocas')).toBeDefined()
  })
})

describe('Adaptación 3: rankearRutas', () => {
  const arboleda = { id: 'arboleda', distancia_km: 5, sombra_pct: 82, fuentes_agua: 4, iluminacion_pct: 60, solo_am: false, lat_inicio: 25.6527, lng_inicio: -100.3687 }
  const fundidora = { id: 'fundidora', distancia_km: 5, sombra_pct: 55, fuentes_agua: 3, iluminacion_pct: 100, solo_am: false, lat_inicio: 25.6785, lng_inicio: -100.2845 }
  const calzada = { id: 'calzada', distancia_km: 5, sombra_pct: 40, fuentes_agua: 1, iluminacion_pct: 80, solo_am: true, aviso_horario: 'SOL DIRECTO POST 11:00 AM', lat_inicio: 25.66, lng_inicio: -100.36 }
  const rutas = [calzada, fundidora, arboleda]
  const usuario = { lat: 25.655, lng: -100.365 }

  it('con calor a las 14:00 la mejor es Arboleda y Calzada queda al final', () => {
    const r = rankearRutas(rutas, { ...base, sensacionTermica: 37, uv: 9, hora: 14 }, usuario)
    expect(r[0].id).toBe('arboleda')
    expect(r[2].id).toBe('calzada')
    expect(r[2].advertencia).toBe('SOL DIRECTO POST 11:00 AM')
    expect(r[0].etiquetas).toContain('SEGURA PARA CALOR ACTUAL')
  })

  it('con la mañana fresca Calzada ya no queda al final ni trae advertencia', () => {
    const r = rankearRutas(rutas, { ...base, hora: 7 }, usuario)
    expect(r[2].id).toBe('fundidora')
    expect(r.find((x) => x.id === 'calzada').advertencia).toBeNull()
    expect(r[0].etiquetas).not.toContain('SEGURA PARA CALOR ACTUAL')
  })

  it('calcula la distancia desde el usuario', () => {
    const r = rankearRutas(rutas, base, usuario)
    expect(r.find((x) => x.id === 'arboleda').distanciaKm).toBeLessThan(1)
  })
})

describe('Adaptación 5: evaluarAlertaEnCarrera', () => {
  // Ruta en línea recta: primero tramos con sombra, luego sin sombra ([lng, lat])
  const geojson = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { sombra: 'alta' }, geometry: { type: 'LineString', coordinates: [[-100.37, 25.65], [-100.3695, 25.65], [-100.369, 25.65]] } },
      { type: 'Feature', properties: { sombra: 'baja' }, geometry: { type: 'LineString', coordinates: [[-100.369, 25.65], [-100.368, 25.65], [-100.367, 25.65]] } },
    ],
  }
  const caluroso = { ...base, sensacionTermica: 36, uv: 7 }

  it('a unos 150 m del tramo sin sombra avisa con los metros', () => {
    const a = evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.3705 }, geojson, caluroso)
    expect(a).not.toBeNull()
    expect(a.metros).toBeGreaterThanOrEqual(140)
    expect(a.metros).toBeLessThanOrEqual(160)
  })
  it('a 500 m del tramo no avisa', () => {
    expect(evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.375 }, geojson, caluroso)).toBeNull()
  })
  it('con 22 grados y UV 2 no avisa', () => {
    const fresco = { ...base, sensacionTermica: 22, uv: 2 }
    expect(evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.3705 }, geojson, fresco)).toBeNull()
  })
  it('dentro del tramo avisa que ya estás en él', () => {
    const a = evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.368 }, geojson, caluroso)
    expect(a.mensaje).toContain('Estás')
  })
})

describe('Adaptación 1 (parte B): elegirRutaAlterna', () => {
  const arboleda = { id: 'arboleda', distancia_km: 5, sombra_pct: 82, lat_inicio: 25.6527, lng_inicio: -100.3687 }
  const calzada = { id: 'calzada', distancia_km: 5, sombra_pct: 40, lat_inicio: 25.66, lng_inicio: -100.36 }
  const rutas = [calzada, arboleda]
  const fuerte = { ...base, sensacionTermica: 37, uv: 9 }

  it('desde Calzada con calor fuerte sugiere Arboleda con ahorro estimado de 2.5', () => {
    const alt = elegirRutaAlterna(calzada, rutas, fuerte)
    expect(alt.id).toBe('arboleda')
    expect(alt.ahorroTermico).toBe(2.5)
  })
  it('con nivel 1 no sugiere alterna', () => {
    expect(elegirRutaAlterna(calzada, rutas, { ...base, sensacionTermica: 33 })).toBeNull()
  })
  it('desde Arboleda no hay mejor opción', () => {
    expect(elegirRutaAlterna(arboleda, rutas, fuerte)).toBeNull()
  })
})