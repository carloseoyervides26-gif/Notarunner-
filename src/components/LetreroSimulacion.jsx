// Franja que avisa que los datos no son reales
import { useContexto } from '../context/ContextoProvider'

export default function LetreroSimulacion({ alTocar }) {
  const { esSimulado, gpsSimulado } = useContexto()

  // Si no hay nada simulado, no se muestra
  if (!esSimulado && !gpsSimulado) return null

  // Qué está simulado
  const partes = [esSimulado && 'clima', gpsSimulado && 'GPS'].filter(Boolean).join(' y ')

  return (
    <button
      type="button"
      onClick={alTocar}
      className="w-full bg-lima text-fondo font-datos text-xs font-bold tracking-widest py-2 px-4"
    >
      MODO SIMULACIÓN · {partes.toUpperCase()} · TOCA PARA AJUSTAR
    </button>
  )
}