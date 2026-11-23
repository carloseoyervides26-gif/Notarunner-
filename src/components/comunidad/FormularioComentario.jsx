// Formulario para agregar un comentario sobre una ruta
import { useState } from 'react'
import Boton from '../Boton'
import { crearReporte } from '../../services/db'

const MINIMO = 3
const MAXIMO = 500

export default function FormularioComentario({ rutas, alPublicar }) {
  const [rutaId, setRutaId] = useState('')
  const [texto, setTexto] = useState('')
  const [errores, setErrores] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')

  async function publicar(e) {
    e.preventDefault()
    const nuevos = {}
    if (!rutaId) nuevos.ruta = 'Elige la ruta de tu comentario.'
    const limpio = texto.trim()
    if (!limpio) nuevos.texto = 'Escribe tu comentario.'
    else if (limpio.length < MINIMO) nuevos.texto = `Escribe al menos ${MINIMO} letras.`
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const ruta = rutas.find((r) => String(r.id) === rutaId)
    setEnviando(true)
    setErrorGeneral('')
    try {
      const nuevo = await crearReporte({ route_id: ruta.id, ruta_nombre: ruta.nombre, texto: limpio })
      setTexto('')
      setRutaId('')
      alPublicar?.(nuevo)
    } catch (err) {
      setErrorGeneral(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={publicar} noValidate className="space-y-4">
      <div>
        <label htmlFor="ruta-comentario" className="block font-datos text-xs uppercase tracking-widest text-suave mb-2">
          Ruta
        </label>
        <select
          id="ruta-comentario"
          value={rutaId}
          onChange={(e) => {
            setRutaId(e.target.value)
            setErrores((p) => ({ ...p, ruta: '' }))
          }}
          className={`w-full min-h-14 px-4 rounded-2xl bg-fondo text-white border-2 outline-none focus:border-menta ${
            errores.ruta ? 'border-peligro' : 'border-transparent'
          }`}
        >
          <option value="">Elige una ruta…</option>
          {rutas.map((r) => (
            <option key={r.id} value={String(r.id)}>
              {r.nombre}
            </option>
          ))}
        </select>
        {errores.ruta && <p className="mt-2 text-sm text-peligro">{errores.ruta}</p>}
      </div>

      <div>
        <label htmlFor="texto-comentario" className="block font-datos text-xs uppercase tracking-widest text-suave mb-2">
          Comentario
        </label>
        <textarea
          id="texto-comentario"
          value={texto}
          maxLength={MAXIMO}
          rows={4}
          onChange={(e) => {
            setTexto(e.target.value)
            setErrores((p) => ({ ...p, texto: '' }))
          }}
          placeholder="Ej. La fuente de la entrada ya funciona otra vez."
          className={`w-full px-4 py-3 rounded-2xl bg-fondo text-white placeholder:text-suave/60 border-2 outline-none focus:border-menta ${
            errores.texto ? 'border-peligro' : 'border-transparent'
          }`}
        />
        <div className="flex justify-between mt-1">
          <p className="text-sm text-peligro">{errores.texto}</p>
          <p className="font-datos text-xs text-suave">
            {texto.length}/{MAXIMO}
          </p>
        </div>
      </div>

      {errorGeneral && <p className="rounded-xl bg-peligro/15 p-3 text-sm text-peligro">{errorGeneral}</p>}

      <Boton type="submit" cargando={enviando}>
        Publicar comentario
      </Boton>
    </form>
  )
}
