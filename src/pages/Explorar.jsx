// Pantalla Explorar. El encabezado y la barra los pone Plantilla.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContexto } from '../context/ContextoProvider'
import Cargando from '../components/Cargando'
import Boton from '../components/Boton'
import SelectorDistancia from '../components/explorar/SelectorDistancia'
import TarjetaUbicacion from '../components/explorar/TarjetaUbicacion'
import PanelClima from '../components/explorar/PanelClima'
import TarjetasUVAireHumedad from '../components/explorar/TarjetasUVAireHumedad'
import MejorHora from '../components/explorar/MejorHora'
import ListaRutas from '../components/explorar/ListaRutas'
import AvisoProximaCarrera from '../components/explorar/AvisoProximaCarrera' 

export default function Explorar() {
  const contexto = useContexto()
  const navigate = useNavigate()

  // Distancia elegida: 3, 5, 10 o 'personalizado'
  const [opcion, setOpcion] = useState(5)
  const [textoDistancia, setTextoDistancia] = useState('')
  // Ubicación del usuario (la usa el ranking de rutas)
  const [ubicacion, setUbicacion] = useState(null)

  // Distancia objetivo en km (null si el texto personalizado no es válido)
  const numero = Number(textoDistancia)
  const distanciaObjetivo =
    opcion !== 'personalizado' ? opcion : numero >= 1 && numero <= 42 ? numero : null

  // Al comenzar una ruta: guarda el id y navega a Ruta Activa
  function comenzarRuta(ruta) {
    localStorage.setItem('ruta_activa_id', ruta.id)
    navigate(`/ruta-activa/${ruta.id}`)
  }

  if (contexto.cargando) return <Cargando texto="Leyendo el clima…" />

  return (
    <div className="p-4 space-y-4">
      <AvisoProximaCarrera contexto={contexto} />
      <SelectorDistancia
        opcion={opcion}
        alElegir={setOpcion}
        texto={textoDistancia}
        alCambiarTexto={setTextoDistancia}
      />
      <TarjetaUbicacion ciudad={contexto.ciudad} alUbicar={setUbicacion} />
      <PanelClima contexto={contexto} />
      <TarjetasUVAireHumedad contexto={contexto} />
      <MejorHora pronosticoHorario={contexto.pronosticoHorario} />

      <Boton onClick={() => navigate('/crear-ruta')}>Crear nueva ruta</Boton>

      <ListaRutas
        distanciaObjetivo={distanciaObjetivo}
        ubicacion={ubicacion}
        contexto={contexto}
        alComenzar={comenzarRuta}
      />

      <Boton variante="secundario" onClick={() => navigate('/programar')}>
        Programar carrera
      </Boton>
    </div>
  )
}
