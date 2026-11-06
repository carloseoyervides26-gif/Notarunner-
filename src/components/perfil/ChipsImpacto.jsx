// "Mi impacto": km recorridos, rutas compartidas y semanas de racha
import Cargando from '../Cargando'
import MensajeError from '../MensajeError'
import usarCarga from './usarCarga'
// Cuando db.js tenga getEstadisticas, cambia a '../../services/db'
import { getEstadisticas } from '../../mocks/dbFalsa'

function Dato({ valor, etiqueta }) {
  return (
    <div className="bg-tarjeta rounded-2xl p-3 text-center">
      <p className="font-datos text-2xl text-lima">{valor}</p>
      <p className="text-xs text-suave">{etiqueta}</p>
    </div>
  )
}

export default function ChipsImpacto({ userId }) {
  const { datos, cargando, error, recargar } = usarCarga(() => getEstadisticas(userId))

  return (
    <section>
      <h2 className="font-titulos font-bold mb-2">MI IMPACTO</h2>
      {cargando && <Cargando texto="Cargando tus números…" />}
      {error && <MensajeError texto={error} alReintentar={recargar} />}
      {datos && !cargando && !error && (
        <div className="grid grid-cols-3 gap-3">
          <Dato valor={Number(datos.km_total).toFixed(1)} etiqueta="km recorridos" />
          <Dato valor={datos.rutas_compartidas} etiqueta="rutas compartidas" />
          <Dato valor={datos.racha_semanas} etiqueta="semanas de racha" />
        </div>
      )}
    </section>
  )
}
