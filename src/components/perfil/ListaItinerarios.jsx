// Pestaña "Mis itinerarios": carreras programadas, con botón para borrar
import { useState } from 'react'
import Cargando from '../Cargando'
import MensajeError from '../MensajeError'
import Boton from '../Boton'
import HojaFlotante from '../HojaFlotante'
import usarCarga from './usarCarga'
import { formatearItinerario } from './formato'
// Cuando db.js tenga estas funciones, cambia a '../../services/db'
import { getItinerarios, borrarItinerario } from '../../mocks/itinerarios'

export default function ListaItinerarios({ userId }) {
  const { datos, cargando, error, recargar } = usarCarga(() => getItinerarios(userId))
  // El itinerario que se quiere borrar (pide confirmación primero)
  const [porBorrar, setPorBorrar] = useState(null)
  const [borrando, setBorrando] = useState(false)
  const [errorBorrar, setErrorBorrar] = useState('')

  async function confirmarBorrado() {
    setBorrando(true)
    setErrorBorrar('')
    try {
      await borrarItinerario(porBorrar.id)
      setPorBorrar(null)
      recargar()
    } catch {
      setErrorBorrar('No pudimos borrar la carrera. Intenta de nuevo.')
    } finally {
      setBorrando(false)
    }
  }

  if (cargando) return <Cargando texto="Cargando tus itinerarios…" />
  if (error) return <MensajeError texto={error} alReintentar={recargar} />
  if (!datos || datos.length === 0) {
    return <p className="text-suave text-sm text-center py-6">No tienes carreras programadas todavía.</p>
  }

  return (
    <>
      <ul className="space-y-3">
        {datos.map((it) => (
          <li key={it.id} className="bg-tarjeta rounded-2xl p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-titulos font-bold">{Number(it.distancia_km).toFixed(1)} km</p>
              <p className="text-sm text-suave">{formatearItinerario(it.fecha, it.hora)}</p>
              {it.notas && <p className="text-sm mt-1">{it.notas}</p>}
            </div>
            <button
              type="button"
              onClick={() => setPorBorrar(it)}
              className="text-peligro text-sm font-bold px-2 py-1"
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>

      <HojaFlotante abierta={Boolean(porBorrar)} alCerrar={() => setPorBorrar(null)} titulo="¿Borrar esta carrera?">
        <p className="text-suave mb-4">Se quitará de tu itinerario. No se puede deshacer.</p>
        {errorBorrar && <p className="text-peligro text-sm mb-3">{errorBorrar}</p>}
        <div className="space-y-3">
          <Boton variante="peligro" cargando={borrando} onClick={confirmarBorrado}>
            Sí, borrar
          </Boton>
          <Boton variante="secundario" onClick={() => setPorBorrar(null)}>
            Cancelar
          </Boton>
        </div>
      </HojaFlotante>
    </>
  )
}
