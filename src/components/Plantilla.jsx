// Estructura común: Encabezado arriba, página en medio, Barra abajo
import { Outlet } from 'react-router-dom'
import Encabezado from './Encabezado'
import BarraInferior from './BarraInferior'

export default function Plantilla() {
  return (
    <div className="min-h-dvh max-w-md mx-auto flex flex-col">
      <Encabezado />
      {/* pb-24: deja espacio para que la barra no tape el contenido */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BarraInferior />
    </div>
  )
}