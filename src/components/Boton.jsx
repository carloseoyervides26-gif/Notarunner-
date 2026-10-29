// Botón grande y reutilizable
const VARIANTES = {
  principal: 'bg-menta text-fondo',
  secundario: 'bg-tarjeta text-white border border-suave/30',
  peligro: 'bg-peligro text-white',
}

export default function Boton({
  children,
  variante = 'principal', // 'principal' | 'secundario' | 'peligro'
  cargando = false, // muestra "Cargando…" y bloquea el botón
  anchoCompleto = true,
  type = 'button',
  disabled,
  className = '',
  ...resto // onClick, etc.
}) {
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      className={`min-h-14 px-5 rounded-2xl font-titulos font-bold text-base transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${
        VARIANTES[variante]
      } ${anchoCompleto ? 'w-full' : ''} ${className}`}
      {...resto}
    >
      {cargando ? 'Cargando…' : children}
    </button>
  )
}