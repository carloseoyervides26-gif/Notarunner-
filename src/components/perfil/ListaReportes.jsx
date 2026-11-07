// Pestaña "Mis reportes". Cuando la Persona 5 termine TarjetaReporte,
// se puede cambiar el <li> de abajo por ese componente.
import Cargando from '../Cargando'
import MensajeError from '../MensajeError'
import Chip from '../Chip'
import usarCarga from './usarCarga'
import { formatearFechaHora } from './formato'
// Cuando db.js tenga getMisReportes, cambia a '../../services/db'
import { getMisReportes } from '../../mocks/dbFalsa'

export default function ListaReportes({ userId }) {
  const { datos, cargando, error, recargar } = usarCarga(() => getMisReportes(userId))

  if (cargando) return <Cargando texto="Cargando tus reportes…" />
  if (error) return <MensajeError texto={error} alReintentar={recargar} />
  if (!datos || datos.length === 0) {
    return <p className="text-suave text-sm text-center py-6">Aún no has hecho reportes.</p>
  }

  return (
    <ul className="space-y-3">
      {datos.map((r) => (
        <li key={r.id} className="bg-tarjeta rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Chip color="cian">{r.categoria}</Chip>
            <span className="text-xs text-suave">{formatearFechaHora(r.fecha)}</span>
          </div>
          <p className="text-sm">{r.descripcion}</p>
          <p className="font-datos text-xs text-lima">
            {r.confirmaciones} {r.confirmaciones === 1 ? 'persona confirmó' : 'personas confirmaron'}
          </p>
        </li>
      ))}
    </ul>
  )
}
