// Íconos dibujados con SVG (sin librerías)
function Icono({ children, className = 'w-6 h-6' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Logo: montaña con sol
export function IconoLogo(props) {
  return (
    <Icono {...props}>
      <path d="M3 20 9 8l4 6 3-4 5 10Z" />
      <circle cx="17" cy="5" r="2" />
    </Icono>
  )
}

// Explorar: brújula
export function IconoExplorar(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </Icono>
  )
}

// Ruta Activa: camino entre dos puntos
export function IconoRuta(props) {
  return (
    <Icono {...props}>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M8 18h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6" />
    </Icono>
  )
}

// En Carrera: cronómetro
export function IconoCarrera(props) {
  return (
    <Icono {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M10 2h4" />
    </Icono>
  )
}

// Comunidad: personas
export function IconoComunidad(props) {
  return (
    <Icono {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.5 14.2A5 5 0 0 1 21 19" />
    </Icono>
  )
}