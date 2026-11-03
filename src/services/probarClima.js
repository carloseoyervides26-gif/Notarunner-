import { obtenerContextoReal } from './clima.js'
import { evaluarRiesgo, calcularMejorHora, generarChecklist } from '../engine/motorAdaptativo.js'

// Coordenadas del centro de Monterrey
const ctx = await obtenerContextoReal(25.6866, -100.3161)

console.log('Ciudad:', ctx.ciudad)
console.log('Hora local:', ctx.hora)
console.log('Temperatura:', ctx.temperatura, '°C')
console.log('Sensación térmica:', ctx.sensacionTermica, '°C')
console.log('UV:', ctx.uv)
console.log('AQI:', ctx.aqi)
console.log('Humedad:', ctx.humedad, '%')
console.log('Horas de pronóstico:', ctx.pronosticoHorario.length)

console.log('\nRiesgo:', evaluarRiesgo(ctx))
console.log('Mejor hora:', calcularMejorHora(ctx.pronosticoHorario))
console.log(
  'Checklist:',
  generarChecklist(ctx).map((i) => i.nombre + (i.obligatorio ? ' (OBLIGATORIO)' : ''))
)