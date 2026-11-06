// Itinerarios falsos (carreras programadas), con los mismos nombres del CONTRATO 4.
// Guardan en el navegador (localStorage) para que no se pierdan al recargar.
// Cuando db.js tenga estas funciones, solo cambia el import en cada pantalla:
//   de '../mocks/itinerarios'  a  '../services/db'

const CLAVE = 'itinerarios_mock'

function leer() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) ?? []
  } catch {
    return []
  }
}

function guardar(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista))
}

// datos: { fecha: '2026-11-06', hora: '08:00', distancia_km, notas, avisar }
export async function crearItinerario(datos) {
  const nuevo = { id: 'it-' + Date.now(), user_id: 'usuario-1', ...datos }
  guardar([...leer(), nuevo])
  return nuevo
}

// Devuelve los itinerarios ordenados por fecha y hora
export async function getItinerarios() {
  return leer().sort((a, b) =>
    (a.fecha + a.hora).localeCompare(b.fecha + b.hora)
  )
}

export async function borrarItinerario(id) {
  guardar(leer().filter((i) => i.id !== id))
}
