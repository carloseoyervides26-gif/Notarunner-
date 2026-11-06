// Pantalla Explorar (primera mitad). El encabezado y la barra los pone Plantilla.
import { useState } from 'react'
import { useContexto } from '../context/ContextoProvider'
import Cargando from '../components/Cargando'
import SelectorDistancia from '../components/explorar/SelectorDistancia'
import TarjetaUbicacion from '../components/explorar/TarjetaUbicacion'
import PanelClima from '../components/explorar/PanelClima'
import TarjetasUVAireHumedad from '../components/explorar/TarjetasUVAireHumedad'

export default function Explorar() {
  const contexto = useContexto()

  // Distancia elegida: 3, 5, 10 o 'personalizado'
  const [opcion, setOpcion] = useState(5)
  const [textoDistancia, setTextoDistancia] = useState('')
  // Ubicación del usuario (la usará el ranking de rutas más adelante)
  const [ubicacion, setUbicacion] = useState(null)

  // Distancia objetivo en km (null si el texto personalizado no es válido)
  const numero = Number(textoDistancia)
  const distanciaObjetivo =
    opcion !== 'personalizado' ? opcion : numero >= 1 && numero <= 42 ? numero : null

  if (contexto.cargando) return <Cargando texto="Leyendo el clima…" />

  return (
    <div className="p-4 space-y-4">
      <SelectorDistancia
        opcion={opcion}
        alElegir={setOpcion}
        texto={textoDistancia}
        alCambiarTexto={setTextoDistancia}
      />
      <TarjetaUbicacion ciudad={contexto.ciudad} alUbicar={setUbicacion} />
      <PanelClima contexto={contexto} />
      <TarjetasUVAireHumedad contexto={contexto} />

      {/* Temporal: para ver que el estado funciona. Se borra después. */}
      <p className="text-xs text-suave font-datos">
        Distancia: {distanciaObjetivo ?? 'inválida'} km · Ubicación:{' '}
        {ubicacion ? `${ubicacion.lat.toFixed(3)}, ${ubicacion.lng.toFixed(3)}` : 'sin elegir'}
      </p>
    </div>
  )
}
