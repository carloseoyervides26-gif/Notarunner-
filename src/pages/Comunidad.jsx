// Pantalla Comunidad: comentarios de las rutas y buscador por nombre de ruta
import { useEffect, useMemo, useState } from 'react'
import { getReportes, getRutas, getNombresRutas } from '../services/db'
import { comentariosDeApp, normalizar } from '../components/comunidad/comentariosApp'
import TarjetaComentario from '../components/comunidad/TarjetaComentario'
import FormularioComentario from '../components/comunidad/FormularioComentario'
import Boton from '../components/Boton'
import Cargando from '../components/Cargando'
import MensajeError from '../components/MensajeError'
import HojaFlotante from '../components/HojaFlotante'

export default function Comunidad() {
  const [deUsuarios, setDeUsuarios] = useState([])
  const [deApp, setDeApp] = useState([])
  const [nombresRutas, setNombresRutas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [formAbierto, setFormAbierto] = useState(false)

  useEffect(() => {
    let vivo = true
    async function cargar() {
      setCargando(true)
      setError('')
      try {
        const [rutas, nombres] = await Promise.all([getRutas(), getNombresRutas()])
        if (!vivo) return
        setDeApp(comentariosDeApp(rutas))
        setNombresRutas(nombres)
        // Si fallan los de usuarios, igual se ven los de la aplicación
        try {
          const comentarios = await getReportes()
          if (vivo) setDeUsuarios(comentarios)
        } catch (e) {
          if (vivo) setError(e?.message || 'No pudimos cargar los comentarios de los usuarios.')
        }
      } catch (e) {
        if (vivo) setError(e?.message || 'No pudimos cargar los comentarios.')
      } finally {
        if (vivo) setCargando(false)
      }
    }
    cargar()
    return () => {
      vivo = false
    }
  }, [intento])

  // Primero los de usuarios (más nuevos arriba) y después los de la aplicación.
  // El buscador filtra SOLO por el nombre de la ruta.
  const visibles = useMemo(() => {
    const buscado = normalizar(busqueda)
    const todos = [...deUsuarios, ...deApp]
    if (!buscado) return todos
    return todos.filter((c) => normalizar(c.ruta_nombre).includes(buscado))
  }, [deUsuarios, deApp, busqueda])

  function alPublicar(nuevo) {
    setDeUsuarios((lista) => [nuevo, ...lista])
    setFormAbierto(false)
  }

  function alBorrar(id) {
    setDeUsuarios((lista) => lista.filter((c) => c.id !== id))
  }

  return (
    <div className="p-4 space-y-4">
      <section className="bg-tarjeta rounded-3xl p-4 space-y-3">
        <div>
          <h2 className="font-titulos font-bold text-xl">Comentarios de la comunidad</h2>
          <p className="text-sm text-suave">
            Consejos y avisos sobre las rutas: de la aplicación y de otros corredores.
          </p>
        </div>
        <Boton onClick={() => setFormAbierto(true)}>+ Agregar comentario</Boton>
      </section>

      {/* Buscador por nombre de ruta */}
      <div>
        <label htmlFor="buscar-ruta" className="block font-datos text-xs uppercase tracking-widest text-suave mb-2">
          Buscar por nombre de ruta
        </label>
        <div className="relative">
          <input
            id="buscar-ruta"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Fundidora"
            className="w-full min-h-14 pl-11 pr-4 rounded-2xl bg-tarjeta text-white placeholder:text-suave/60 border-2 border-transparent outline-none focus:border-menta"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-suave" aria-hidden="true">
            ⌕
          </span>
        </div>
      </div>

      {cargando && <Cargando texto="Cargando comentarios…" />}
      {error && <MensajeError texto={error} alReintentar={() => setIntento((n) => n + 1)} />}

      {!cargando && (
        <>
          <p className="font-datos text-xs text-menta">
            {visibles.length} {visibles.length === 1 ? 'COMENTARIO' : 'COMENTARIOS'}
            {busqueda.trim() && ` PARA «${busqueda.trim().toUpperCase()}»`}
          </p>

          {visibles.length === 0 ? (
            <p className="text-suave text-sm text-center py-6">
              No hay comentarios de esa ruta. ¡Sé el primero en agregar uno!
            </p>
          ) : (
            <ul className="space-y-3">
              {visibles.map((c) => (
                <TarjetaComentario key={c.id} comentario={c} alBorrar={alBorrar} />
              ))}
            </ul>
          )}
        </>
      )}

      <HojaFlotante abierta={formAbierto} alCerrar={() => setFormAbierto(false)} titulo="Agregar comentario">
        <FormularioComentario rutas={nombresRutas} alPublicar={alPublicar} />
      </HojaFlotante>
    </div>
  )
}
