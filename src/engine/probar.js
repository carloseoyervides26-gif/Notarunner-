import { evaluarRiesgo, generarChecklist, calcularMejorHora } from './motorAdaptativo.js'

let fallos = 0
function esperar(nombre, real, esperado) {
  const ok = real === esperado
  if (!ok) fallos++
  console.log((ok ? 'OK     ' : 'FALLA  ') + nombre + (ok ? '' : ` (salió ${real}, esperaba ${esperado})`))
}

const base = { temperatura: 30, sensacionTermica: 25, uv: 3, aqi: 30, humedad: 40, hora: 10 }

// --- evaluarRiesgo ---
esperar('25 / UV 3 / AQI 30 -> nivel 0', evaluarRiesgo({ ...base }).nivel, 0)
esperar('33 / UV 5 / AQI 40 -> nivel 1', evaluarRiesgo({ ...base, sensacionTermica: 33, uv: 5, aqi: 40 }).nivel, 1)
const r2 = evaluarRiesgo({ ...base, sensacionTermica: 37, uv: 9.2, aqi: 42 })
esperar('37 / UV 9.2 -> nivel 2', r2.nivel, 2)
esperar('37 / UV 9.2 -> bloqueador obligatorio', r2.bloqueadorObligatorio, true)
const r3 = evaluarRiesgo({ ...base, sensacionTermica: 41, uv: 6, aqi: 40 })
esperar('41 -> nivel 3', r3.nivel, 3)
esperar('41 -> recomendar no correr', r3.recomendarNoCorrer, true)
esperar('28 / UV 9 -> nivel 2 por UV', evaluarRiesgo({ ...base, sensacionTermica: 28, uv: 9 }).nivel, 2)
const r4 = evaluarRiesgo({ ...base, sensacionTermica: 28, aqi: 120 })
esperar('AQI 120 -> nivel 1', r4.nivel, 1)
esperar('AQI 120 -> trae aviso de aire', r4.avisoAire !== null, true)
esperar('AQI 170 -> nivel 3', evaluarRiesgo({ ...base, sensacionTermica: 28, aqi: 170 }).nivel, 3)

// --- generarChecklist ---
const lista = (c) => generarChecklist(c)
const bloqueador = (c) => lista(c).find((i) => i.id === 'bloqueador').obligatorio
esperar('UV 9.2 -> bloqueador obligatorio', bloqueador({ ...base, uv: 9.2 }), true)
esperar('UV 3 -> bloqueador no obligatorio', bloqueador({ ...base, uv: 3 }), false)
esperar('hora 20 -> aparece luz', lista({ ...base, hora: 20 }).some((i) => i.id === 'luz'), true)
esperar('AQI 120 -> aparece cubrebocas', lista({ ...base, aqi: 120 }).some((i) => i.id === 'cubrebocas'), true)

// --- calcularMejorHora (un día típico de Monterrey) ---
const pronostico = []
for (let h = 0; h < 24; h++) {
  const sens = h < 7 ? 27 : h < 10 ? 30 : h < 18 ? 38 : h < 21 ? 33 : 29
  const uv = h < 7 ? 0 : h < 10 ? 4 : h < 17 ? 10 : h < 19 ? 2 : 0
  pronostico.push({ hora: h, temperatura: sens - 3, sensacionTermica: sens, uv, aqi: 40 })
}
const mh = calcularMejorHora(pronostico)
esperar('mejor hora: inicio 05:00', mh.inicio, '05:00')
esperar('mejor hora: fin 07:00', mh.fin, '07:00')
esperar('mejor hora: después de 19:00', mh.despuesDe, '19:00')

console.log(fallos === 0 ? '\nTodo bien.' : `\n${fallos} prueba(s) fallaron.`)