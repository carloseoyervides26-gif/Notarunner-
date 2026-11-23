// Un comentario: ruta, texto, quién lo agregó y botón "Me sirve"
import { useState } from 'react'
import Chip from '../Chip'
import { IconoLogo } from '../Iconos'
import { confirmarReporte, borrarReporte } from '../../services/db'

// "Hace 18 min", "Hace 3 h", "Hace 2 días"
function haceCuanto(fecha) {
  if (!fecha) return ''
  const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000))
  if (min < 1) return 'Justo ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `Hace ${h} h`
  const d = Math.round(h / 24)
  return `Hace ${d} ${d === 1 ? 'día' : 'días'}`
}

export default function TarjetaComentario({ comentario, alBorrar }) {
  const [total, setTotal] = useState(comentario.confirmaciones ?? 0)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  async function confirmar() {
    setOcupado(true)
    setError('')
    try {
      const nuevo = await confirmarReporte(comentario.id)
      if (typeof nuevo === 'number') setTotal(nuevo)
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  async function borrar() {
    setOcupado(true)
    setError('')
    try {
      await borrarReporte(comentario.id)
      alBorrar?.(comentario.id)
    } catch (e) {
      setError(e.message)
      setOcupado(false)
    }
  }

  return (
    <li className="bg-tarjeta rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Chip color={comentario.deApp ? 'cian' : 'lima'}>{comentario.ruta_nombre}</Chip>
        {comentario.fecha && <span className="text-xs text-suave shrink-0">{haceCuanto(comentario.fecha)}</span>}
      </div>

      <p className="text-sm">{comentario.texto}</p>

      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Quién lo agregó */}
        {comentario.deApp ? (
          <p className="flex items-center gap-1.5 text-xs text-cian">
            <IconoLogo className="w-4 h-4" />
            Agregado por la aplicación
          </p>
        ) : (
          <p className="text-xs text-suave">
            Agregado por <span className="text-white font-bold">{comentario.autor}</span>
            {comentario.esMio && ' (tú)'}
          </p>
        )}

        {!comentario.deApp && (
          <div className="flex items-center gap-1 shrink-0">
            {comentario.esMio && (
              <button
                type="button"
                onClick={borrar}
                disabled={ocupado}
                className="min-h-11 px-3 text-xs font-bold text-peligro disabled:opacity-50"
              >
                Borrar
              </button>
            )}
            <button
              type="button"
              onClick={confirmar}
              disabled={ocupado}
              className="min-h-11 px-3 rounded-full bg-fondo text-xs font-datos text-menta disabled:opacity-50"
              aria-label="Me sirve este comentario"
            >
              👍 {total}
            </button>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-peligro">{error}</p>}
    </li>
  )
}
