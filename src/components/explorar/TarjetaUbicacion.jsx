// Tarjeta de ubicación: muestra la ciudad y pide el GPS con el botón
import { useState } from 'react'
import Tarjeta from '../Tarjeta'
import Boton from '../Boton'

// Centro de Monterrey, por si el usuario niega el permiso
const CENTRO_MONTERREY = { lat: 25.6866, lng: -100.3161 }

export default function TarjetaUbicacion({ ciudad, alUbicar }) {
  const [buscando, setBuscando] = useState(false)
  // 'ninguno' | 'gps' | 'respaldo'
  const [origen, setOrigen] = useState('ninguno')

  function pedirUbicacion() {
    // Si el navegador no tiene GPS, usamos el centro de Monterrey
    if (!navigator.geolocation) {
      alUbicar(CENTRO_MONTERREY)
      setOrigen('respaldo')
      return
    }
    setBuscando(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        alUbicar({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setOrigen('gps')
        setBuscando(false)
      },
      () => {
        // Permiso negado o error: usamos el centro
        alUbicar(CENTRO_MONTERREY)
        setOrigen('respaldo')
        setBuscando(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <Tarjeta titulo="UBICACIÓN">
      <p className="font-titulos text-lg mb-3">{ciudad || 'Monterrey, NL'}</p>

      <Boton variante="secundario" cargando={buscando} onClick={pedirUbicacion}>
        Ubicación Actual
      </Boton>

      {origen === 'gps' && (
        <p className="text-xs text-menta mt-2">Usando tu ubicación actual.</p>
      )}
      {origen === 'respaldo' && (
        <p className="text-xs text-lima mt-2">
          No pudimos obtener tu ubicación. Usamos el centro de Monterrey.
        </p>
      )}
    </Tarjeta>
  )
}
