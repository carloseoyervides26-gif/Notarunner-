// Pestaña "Mi historial": carreras terminadas
import Cargando from '../Cargando'
import MensajeError from '../MensajeError'
import usarCarga from './usarCarga'
import { formatearFechaHora, formatearTiempo, formatearRitmo } from './formato'
// Cuando db.js tenga getCarreras, cambia a '../../services/db'
import { getCarreras } from '../../mocks/dbFalsa'

export default function ListaHistorial({ userId }) {
  const { datos, cargando, error, recargar } = usarCarga(() => getCarreras(userId))

  if (cargando) return <Cargando texto="Cargando tu historial…" />
  if (error) return <MensajeError texto={error} alReintentar={recargar} />
  if (!datos || datos.length === 0) {
    return <p className="text-suave text-sm text-center py-6">Aún no tienes carreras. ¡Sal a correr!</p>
  }

  // La más reciente primero
  const ordenadas = [...datos].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))

  return (
    <ul className="space-y-3">
      {ordenadas.map((c) => (
        <li key={c.id} className="bg-tarjeta rounded-2xl p-4">
          <div className="flex justify-between gap-2">
            <p className="font-titulos font-bold">{c.ruta_nombre}</p>
            <p className="text-xs text-suave whitespace-nowrap">{formatearFechaHora(c.fecha)}</p>
          </div>
          <p className="font-datos text-sm text-lima mt-1">
            {Number(c.distancia_km).toFixed(1)} km • {formatearTiempo(c.tiempo_seg)} min •{' '}
            {formatearRitmo(c.ritmo_prom_seg)} prom
          </p>
        </li>
      ))}
    </ul>
  )
}
