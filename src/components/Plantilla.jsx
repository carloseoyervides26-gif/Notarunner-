// Estructura común: Encabezado arriba, página en medio, Barra abajo
import { useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Encabezado from './Encabezado'
import BarraInferior from './BarraInferior'
import PanelSimulacion from './PanelSimulacion'
import LetreroSimulacion from './LetreroSimulacion'

const TOQUES_PARA_ABRIR = 5
const TIEMPO_ENTRE_TOQUES = 600 // milisegundos

export default function Plantilla() {
  const [panelAbierto, setPanelAbierto] = useState(false)
  // Guarda cuántos toques van y cuándo fue el último
  const toques = useRef({ cuenta: 0, ultimo: 0 })

  // 5 toques seguidos al logo abren el panel
  function alTocarLogo() {
    const ahora = Date.now()
    const t = toques.current
    t.cuenta = ahora - t.ultimo < TIEMPO_ENTRE_TOQUES ? t.cuenta + 1 : 1
    t.ultimo = ahora
    if (t.cuenta >= TOQUES_PARA_ABRIR) {
      t.cuenta = 0
      setPanelAbierto(true)
    }
  }

  return (
    <div className="min-h-dvh max-w-md mx-auto flex flex-col">
      <Encabezado alTocarLogo={alTocarLogo} />
      <LetreroSimulacion alTocar={() => setPanelAbierto(true)} />
      {/* pb-24: deja espacio para que la barra no tape el contenido */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>
      <BarraInferior />
      <PanelSimulacion abierto={panelAbierto} alCerrar={() => setPanelAbierto(false)} />
    </div>
  )
}