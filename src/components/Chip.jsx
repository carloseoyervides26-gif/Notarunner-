// Etiqueta pequeña redonda (ej. "Mucha sombra", "UV 9.2")
const COLORES = {
  menta: 'text-menta border-menta/40',
  lima: 'text-lima border-lima/40',
  peligro: 'text-peligro border-peligro/50',
  cian: 'text-cian border-cian/40',
  suave: 'text-suave border-suave/30',
}

export default function Chip({ children, color = 'suave', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border bg-fondo/60 font-datos text-xs ${
        COLORES[color] ?? COLORES.suave
      } ${className}`}
    >
      {children}
    </span>
  )
}