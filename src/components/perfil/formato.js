// Ayudantes para mostrar fechas, tiempos y ritmos en español

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// Date -> '7:00 AM'
function hora12(fecha) {
  const h = fecha.getHours()
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(fecha.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

// Acepta un Date, o una fecha ISO. Devuelve 'Hoy 7:00 AM', 'Ayer 7:00 AM',
// 'Mañana 8:00 AM' o '24 oct 7:30 AM'
export function formatearFechaHora(valor) {
  const fecha = valor instanceof Date ? valor : new Date(valor)
  const hoy = new Date()
  const ayer = new Date()
  ayer.setDate(hoy.getDate() - 1)
  const manana = new Date()
  manana.setDate(hoy.getDate() + 1)

  let dia
  if (fecha.toDateString() === hoy.toDateString()) dia = 'Hoy'
  else if (fecha.toDateString() === ayer.toDateString()) dia = 'Ayer'
  else if (fecha.toDateString() === manana.toDateString()) dia = 'Mañana'
  else dia = `${fecha.getDate()} ${MESES[fecha.getMonth()]}`

  return `${dia} ${hora12(fecha)}`
}

// Itinerario: fecha 'AAAA-MM-DD' + hora 'HH:MM'
export function formatearItinerario(fecha, hora) {
  return formatearFechaHora(new Date(`${fecha}T${hora}:00`))
}

// 1690 segundos -> '28:10'
export function formatearTiempo(segundos) {
  const total = Math.round(segundos)
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}:${String(seg).padStart(2, '0')}`
}

// 329 segundos por km -> '5’29'
export function formatearRitmo(segPorKm) {
  const total = Math.round(segPorKm)
  const min = Math.floor(total / 60)
  const seg = total % 60
  return `${min}’${String(seg).padStart(2, '0')}`
}
