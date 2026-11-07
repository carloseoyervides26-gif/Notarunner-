// Lista de rutas: pide las rutas, filtra por distancia y las ordena con el motor
import { useEffect, useMemo, useState } from 'react'
import { rankearRutas } from '../../engine/motorAdaptativo'
import { rutasMock } from '../../mocks/rutas'
import Cargando from '../Cargando'
import MensajeError from '../MensajeError'
import TarjetaRuta from './TarjetaRuta'

// Centro de Monterrey, por si todavía no hay ubicación
const CENTRO_MONTERREY = { lat: 25.6866, lng: -100.3161 }

export default function ListaRutas({ distanciaObjetivo, ubicacion, contexto, alComenzar }) {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Cambiar este número vuelve a pedir las rutas (botón Reintentar)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    async function cargar() {
      setCargando(true)
      setError('')
      try {
//        const datos = await getRutas()
          const datos = rutasMock
        if (vivo) setRutas(datos)
      } catch {
        if (vivo) setError('No pudimos cargar las rutas.')
      } finally {
        if (vivo) setCargando(false)
      }
    }
    cargar()
    return () => {
      vivo = false
    }
  }, [intento])

  // Filtra entre 80% y 120% de la distancia y ordena con el motor.
  // Se recalcula solo cuando cambia el clima, la hora o la ubicación.
  const recomendadas = useMemo(() => {
    if (!distanciaObjetivo) return []
    const minimo = distanciaObjetivo * 0.8
    const maximo = distanciaObjetivo * 1.2
    const filtradas = rutas.filter((r) => r.distancia_km >= minimo && r.distancia_km <= maximo)
    const punto = ubicacion ?? contexto.ubicacion ?? CENTRO_MONTERREY
    return rankearRutas(filtradas, contexto, punto)
  }, [rutas, distanciaObjetivo, ubicacion, contexto])

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-titulos font-bold">RUTAS RECOMENDADAS AHORA</h2>
        <span className="font-datos text-xs text-menta">
          {recomendadas.length} DISPONIBLE{recomendadas.length === 1 ? '' : 'S'}
        </span>
      </div>

      {cargando && <Cargando texto="Buscando rutas…" />}

      {error && (
        <MensajeError texto={error} alReintentar={() => setIntento((n) => n + 1)} />
      )}

      {!cargando && !error && !distanciaObjetivo && (
        <p className="text-suave text-sm">Escribe una distancia válida (de 1 a 42 km).</p>
      )}

      {!cargando && !error && distanciaObjetivo && recomendadas.length === 0 && (
        <p className="text-suave text-sm">
          No hay rutas de esa distancia por ahora. Prueba con otra.
        </p>
      )}

      {recomendadas.map((r) => (
        <TarjetaRuta key={r.id} ruta={r} alComenzar={alComenzar} />
      ))}
    </section>
  )
}
