// Barra de arriba: logo, título, chip de clima y foto de perfil
import { Link, useLocation } from 'react-router-dom'
import { useContexto } from '../context/ContextoProvider'
import { useAuth } from '../services/auth'
import { IconoLogo } from './Iconos'

// Título según la dirección
const TITULOS = {
  '/': 'Explorar',
  '/ruta-activa': 'Ruta Activa',
  '/en-carrera': 'En Carrera',
  '/comunidad': 'Comunidad',
  '/perfil': 'Perfil',
  '/programar': 'Programar carrera',
  '/crear-ruta': 'Crear ruta',
}

// alTocarLogo: lo usaremos en la pieza 9 (panel de simulación)
export default function Encabezado({ alTocarLogo }) {
  const { pathname } = useLocation()
  const { uv, temperatura, cargando } = useContexto()
  const { perfil } = useAuth()

  const titulo = TITULOS[pathname] ?? 'Not a runner'
  // Si no hay foto, mostramos la primera letra del nombre
  const inicial = perfil?.nombre?.charAt(0).toUpperCase() ?? '?'

  return (
    <header className="sticky top-0 z-20 bg-fondo/95 backdrop-blur border-b border-tarjeta px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] flex items-center gap-3">
      {/* Logo */}
      <button
        type="button"
        onClick={alTocarLogo}
        aria-label="Logo de Not a runner"
        className="text-lima p-1 -m-1"
      >
        <IconoLogo className="w-8 h-8" />
      </button>

      {/* Título de la pantalla */}
      <h1 className="font-titulos text-xl font-semibold flex-1 truncate">{titulo}</h1>

      {/* Chip con UV y temperatura */}
      <div className="font-datos text-sm bg-tarjeta rounded-full px-3 py-1.5 flex gap-2 shrink-0">
        {cargando ? (
          <span className="text-suave">…</span>
        ) : (
          <>
            <span className="text-lima">UV {Number(uv).toFixed(1)}</span>
            <span className="text-cian">{Math.round(temperatura)}°C</span>
          </>
        )}
      </div>

      {/* Foto de perfil: lleva a /perfil */}
      <Link
        to="/perfil"
        aria-label="Abrir perfil"
        className="w-10 h-10 shrink-0 rounded-full bg-tarjeta border-2 border-menta overflow-hidden flex items-center justify-center font-bold text-menta"
      >
        {perfil?.foto_url ? (
          <img src={perfil.foto_url} alt="" className="w-full h-full object-cover" />
        ) : (
          inicial
        )}
      </Link>
    </header>
  )
}