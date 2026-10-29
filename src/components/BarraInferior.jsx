// Barra de abajo con las 4 pestañas
import { NavLink } from 'react-router-dom'
import { IconoExplorar, IconoRuta, IconoCarrera, IconoComunidad } from './Iconos'

const PESTANAS = [
  { a: '/', texto: 'Explorar', Icono: IconoExplorar },
  { a: '/ruta-activa', texto: 'Ruta Activa', Icono: IconoRuta },
  { a: '/en-carrera', texto: 'En Carrera', Icono: IconoCarrera },
  { a: '/comunidad', texto: 'Comunidad', Icono: IconoComunidad },
]

export default function BarraInferior() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 mx-auto max-w-md bg-fondo border-t border-tarjeta pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-4">
        {PESTANAS.map(({ a, texto, Icono }) => (
          <li key={a}>
            <NavLink
              to={a}
              end={a === '/'} // "/" solo se activa en Explorar
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-h-16 py-2 text-xs font-titulos ${
                  isActive ? 'text-menta' : 'text-suave'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Fondo verde suave detrás del ícono activo */}
                  <span className={`px-4 py-1 rounded-full ${isActive ? 'bg-menta/15' : ''}`}>
                    <Icono className="w-6 h-6" />
                  </span>
                  {texto}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}