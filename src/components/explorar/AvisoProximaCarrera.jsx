// Aviso de próxima carrera: si hay un itinerario en las próximas 24 horas,
// muestra la hora y el pronóstico de esa hora con su nivel de riesgo.
import { useEffect, useState } from 'react'
// Cuando db.js tenga getItinerarios, cambia esta línea a '../../services/db'
import { getItinerarios } from '../../mocks/itinerarios'
import { evaluarRiesgo } from '../../engine/motorAdaptativo'

const COLORES = {
  menta: 'border-menta',
  lima: 'border-lima',
  peligro: 'border-peligro',
}

// Convierte fecha 'AAAA-MM-DD' y hora 'HH:MM' en un objeto Date (hora local)
function aFecha(fecha, hora) {
  return new Date(`${fecha}T${hora}:00`)
}

// '08:00' -> '8:00 AM', '19:30' -> '7:30 PM'
function hora12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const sufijo = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${sufijo}`
}

export default function AvisoProximaCarrera({ contexto }) {
  const [proxima, setProxima] = useState(null)

  // Busca el primer itinerario dentro de las próximas 24 horas
  useEffect(() => {
    let vivo = true
    async function buscar() {
      try {
        const lista = await getItinerarios()
        const ahora = new Date()
        const limite = new Date(ahora.getTime() + 24 * 60 * 60 * 1000)
        const encontrada = lista.find((it) => {
          const cuando = aFecha(it.fecha, it.hora)
          return cuando >= ahora && cuando <= limite
        })
        if (vivo) setProxima(encontrada ?? null)
      } catch {
        // Es un aviso extra: si falla, simplemente no se muestra
        if (vivo) setProxima(null)
      }
    }
    buscar()
    return () => {
      vivo = false
    }
  }, [])

  if (!proxima) return null

  const cuando = aFecha(proxima.fecha, proxima.hora)
  const esHoy = cuando.toDateString() === new Date().toDateString()
  const horaCarrera = cuando.getHours()

  // Pronóstico de esa hora. El pronóstico trae 2 días, así que la hora
  // puede salir dos veces: si la carrera es mañana, tomamos la segunda.
  const coincidencias = (contexto.pronosticoHorario ?? []).filter((p) => p.hora === horaCarrera)
  const pronostico = !esHoy && coincidencias.length > 1 ? coincidencias[1] : coincidencias[0]

  const riesgo = pronostico
    ? evaluarRiesgo({ ...contexto, ...pronostico, hora: horaCarrera })
    : null

  return (
    <div
      className={
        'bg-tarjeta rounded-2xl p-4 border-l-4 ' +
        (riesgo ? COLORES[riesgo.color] ?? 'border-menta' : 'border-menta')
      }
    >
      <p className="font-titulos font-bold mb-1">Próxima carrera</p>
      <p className="text-sm">
        Tienes una carrera programada {esHoy ? 'hoy' : 'mañana'} a las {hora12(proxima.hora)}.
        {pronostico && (
          <>
            {' '}Pronóstico: {Math.round(pronostico.temperatura)} °C, nivel {riesgo.nivel}.
          </>
        )}
      </p>

      {riesgo && (
        <p className="text-sm text-suave mt-1">
          {riesgo.etiqueta} · {riesgo.mensaje}
        </p>
      )}

      {/* Si marcó "Avisarme 30 min antes", agregamos la sugerencia de hidratación */}
      {proxima.avisar && (
        <p className="text-sm text-cian mt-2">
          Recuerda llevar agua y hidratarte antes de salir.
        </p>
      )}
    </div>
  )
}
