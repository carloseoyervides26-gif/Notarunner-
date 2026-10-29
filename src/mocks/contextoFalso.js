// Datos falsos del clima para desarrollar (Monterrey, día caluroso)
export const climaFalso = {
  temperatura: 34,
  sensacionTermica: 37,
  uv: 9.2,
  aqi: 42,
  humedad: 38,
}

// Centro de Monterrey
export const ubicacionFalsa = { lat: 25.6714, lng: -100.3094 }
export const ciudadFalsa = 'Monterrey, NL'

// Pronóstico de 24 horas: fresco a las 5 am, más calor a las 5 pm
export function crearPronosticoFalso() {
  const lista = []
  for (let hora = 0; hora < 24; hora++) {
    // Curva simple: mínimo 24 °C, máximo 38 °C
    const temperatura = Math.round((31 - 7 * Math.cos(((hora - 5) / 24) * 2 * Math.PI)) * 10) / 10
    // De día se siente más calor
    const sensacionTermica = Math.round((temperatura + (hora >= 10 && hora <= 19 ? 3 : 1)) * 10) / 10
    // UV: 0 de noche, máximo 10 a la 1 pm
    const uv = hora < 7 || hora > 19 ? 0 : Math.round(10 * Math.sin((Math.PI * (hora - 7)) / 12) * 10) / 10
    // Aire un poco peor en horas de tráfico
    const aqi = 40 + (hora >= 7 && hora <= 10 ? 15 : 0) + (hora >= 17 && hora <= 20 ? 10 : 0)
    lista.push({ hora, temperatura, sensacionTermica, uv, aqi })
  }
  return lista
}