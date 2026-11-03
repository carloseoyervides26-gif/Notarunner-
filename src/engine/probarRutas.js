import { rankearRutas, evaluarAlertaEnCarrera, elegirRutaAlterna } from './motorAdaptativo.js'

let fallos = 0
function esperar(nombre, real, esperado) {
  const ok = real === esperado
  if (!ok) fallos++
  console.log((ok ? 'OK     ' : 'FALLA  ') + nombre + (ok ? '' : ` (salió ${real}, esperaba ${esperado})`))
}

// Tres rutas de prueba
const arboleda = { id: 'arboleda', nombre: 'Parque Arboleda', distancia_km: 5, sombra_pct: 82, fuentes_agua: 4, iluminacion_pct: 60, solo_am: false, lat_inicio: 25.6527, lng_inicio: -100.3687 }
const fundidora = { id: 'fundidora', nombre: 'Parque Fundidora', distancia_km: 5, sombra_pct: 55, fuentes_agua: 3, iluminacion_pct: 100, solo_am: false, lat_inicio: 25.6785, lng_inicio: -100.2845 }
const calzada = { id: 'calzada', nombre: 'Calzada San Pedro', distancia_km: 5, sombra_pct: 40, fuentes_agua: 1, iluminacion_pct: 80, solo_am: true, aviso_horario: 'SOL DIRECTO POST 11:00 AM', lat_inicio: 25.66, lng_inicio: -100.36 }
const rutas = [calzada, fundidora, arboleda]

// El usuario está cerca de Arboleda
const usuario = { lat: 25.655, lng: -100.365 }
const base = { temperatura: 30, sensacionTermica: 25, uv: 3, aqi: 30, humedad: 40, hora: 7 }

// --- rankearRutas ---
const calor = rankearRutas(rutas, { ...base, sensacionTermica: 37, uv: 9, hora: 14 }, usuario)
esperar('calor 14:00: la primera es Arboleda', calor[0].id, 'arboleda')
esperar('calor 14:00: Calzada queda al final', calor[2].id, 'calzada')
esperar('calor 14:00: Calzada trae advertencia', calor[2].advertencia, 'SOL DIRECTO POST 11:00 AM')
esperar('calor: Arboleda trae etiqueta SEGURA', calor[0].etiquetas.includes('SEGURA PARA CALOR ACTUAL'), true)
esperar('Arboleda está a menos de 1 km', calor[0].distanciaKm < 1, true)

const fresco = rankearRutas(rutas, base, usuario)
esperar('mañana fresca: la primera sigue siendo Arboleda', fresco[0].id, 'arboleda')
esperar('mañana fresca: Calzada ya no está al final', fresco[2].id, 'fundidora')
esperar('mañana fresca: Calzada sin advertencia', fresco.find((r) => r.id === 'calzada').advertencia, null)
esperar('mañana fresca: sin etiqueta SEGURA', fresco[0].etiquetas.includes('SEGURA PARA CALOR ACTUAL'), false)

// --- evaluarAlertaEnCarrera ---
// Ruta en línea recta: 2 tramos con sombra y luego 2 sin sombra (coordenadas [lng, lat])
const geojson = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { sombra: 'alta' }, geometry: { type: 'LineString', coordinates: [[-100.37, 25.65], [-100.3695, 25.65], [-100.369, 25.65]] } },
    { type: 'Feature', properties: { sombra: 'baja' }, geometry: { type: 'LineString', coordinates: [[-100.369, 25.65], [-100.368, 25.65], [-100.367, 25.65]] } },
  ],
}
const caluroso = { ...base, sensacionTermica: 36, uv: 7 }
const a1 = evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.3705 }, geojson, caluroso)
esperar('a ~150 m del tramo: hay alerta', a1 !== null, true)
esperar('a ~150 m del tramo: metros entre 140 y 160', a1 && a1.metros >= 140 && a1.metros <= 160, true)
esperar('a 500 m del tramo: no hay alerta', evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.375 }, geojson, caluroso), null)
esperar('con 22 grados y UV 2: no hay alerta', evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.3705 }, geojson, { ...base, sensacionTermica: 22, uv: 2 }), null)
const a2 = evaluarAlertaEnCarrera({ lat: 25.65, lng: -100.368 }, geojson, caluroso)
esperar('dentro del tramo: mensaje "Estás"', a2 && a2.mensaje.includes('Estás'), true)

// --- elegirRutaAlterna ---
const calurosoFuerte = { ...base, sensacionTermica: 37, uv: 9 }
const alt = elegirRutaAlterna(calzada, rutas, calurosoFuerte)
esperar('desde Calzada con calor fuerte: sugiere Arboleda', alt && alt.id, 'arboleda')
esperar('ahorro térmico estimado de 2.5', alt && alt.ahorroTermico, 2.5)
esperar('con nivel 1: no hay alterna', elegirRutaAlterna(calzada, rutas, { ...base, sensacionTermica: 33 }), null)
esperar('desde Arboleda: no hay mejor opción', elegirRutaAlterna(arboleda, rutas, calurosoFuerte), null)

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} prueba(s) fallaron.`)