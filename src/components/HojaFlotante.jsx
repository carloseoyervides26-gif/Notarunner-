// Panel que sube desde abajo (bottom sheet)
import { useEffect } from 'react'

export default function HojaFlotante({ abierta, alCerrar, titulo, children }) {
  // Cerrar con la tecla Escape
  useEffect(() => {
    if (!abierta) return
    const alPresionar = (e) => e.key === 'Escape' && alCerrar?.()
    window.addEventListener('keydown', alPresionar)
    return () => window.removeEventListener('keydown', alPresionar)
  }, [abierta, alCerrar])

  if (!abierta) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Fondo oscuro: al tocarlo se cierra */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={alCerrar}
        className="absolute inset-0 bg-black/60"
      />
      {/* La hoja */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto bg-tarjeta rounded-t-3xl px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1.5rem)]"
      >
        {/* Rayita para indicar que es una hoja */}
        <div className="w-12 h-1.5 rounded-full bg-suave/40 mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-titulos text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-full bg-fondo text-suave text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}