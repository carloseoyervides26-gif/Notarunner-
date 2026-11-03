// Contexto del entorno y hook useContexto (CONTRATO 1)
// Pide el clima real a Open-Meteo. Si falla, usa los datos falsos.
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  climaFalso,
  ubicacionFalsa,
  ciudadFalsa,
  crearPronosticoFalso,
} from '../mocks/contextoFalso'
import { obtenerContextoReal } from '../services/clima'

const Contexto = createContext(null)
const REFRESCO_MS = 10 * 60 * 1000 // vuelve a pedir el clima cada 10 minutos

export function ContextoProvider({ children }) {
  const [cargando, setCargando] = useState(true)
  const [hora, setHora] = useState(() => new Date().getHours())
  const [pronosticoFalso] = useState(crearPronosticoFalso)
  // null = todavía no llegan los datos reales (o falló internet)
  const [real, setReal] = useState(null)
  // null = datos normales; objeto = valores simulados
  const [simulacion, setSimulacion] = useState(null)
  const [gpsSimulado, setGpsSimulado] = useState(false)

  // Pide el clima real al abrir la app y cada 10 minutos
  useEffect(() => {
    let vivo = true
    const lat = ubicacionFalsa?.lat ?? 25.6866
    const lng = ubicacionFalsa?.lng ?? -100.3161

    async function cargar() {
      try {
        const datos = await obtenerContextoReal(lat, lng, ciudadFalsa)
        if (vivo) setReal(datos)
      } catch {
        // Sin internet: se quedan los datos falsos
      } finally {
        if (vivo) setCargando(false)
      }
    }

    cargar()
    // Si tarda más de 3 segundos, muestra la app con datos falsos
    const limite = setTimeout(() => {
      if (vivo) setCargando(false)
    }, 3000)
    const intervalo = setInterval(cargar, REFRESCO_MS)

    return () => {
      vivo = false
      clearTimeout(limite)
      clearInterval(intervalo)
    }
  }, [])

  // Actualiza la hora cada minuto
  useEffect(() => {
    const i = setInterval(() => setHora(new Date().getHours()), 60000)
    return () => clearInterval(i)
  }, [])

  const valor = useMemo(() => {
    const base = real ?? {
      ...climaFalso,
      pronosticoHorario: pronosticoFalso,
      ubicacion: ubicacionFalsa,
      ciudad: ciudadFalsa,
    }
    return {
      ...base,
      hora,
      // La simulación sobrescribe solo los valores que traiga
      ...(simulacion ?? {}),
      cargando,
      esSimulado: simulacion !== null,
      usandoDatosReales: real !== null,
      setSimulacion,
      gpsSimulado,
      setGpsSimulado,
    }
  }, [real, hora, pronosticoFalso, simulacion, cargando, gpsSimulado])

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

// Hook para leer el contexto desde cualquier pantalla
// eslint-disable-next-line react-refresh/only-export-components
export function useContexto() {
  const valor = useContext(Contexto)
  if (!valor) {
    throw new Error('useContexto debe usarse dentro de <ContextoProvider>.')
  }
  return valor
}