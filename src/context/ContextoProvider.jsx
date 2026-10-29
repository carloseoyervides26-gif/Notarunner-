// Contexto del entorno y hook useContexto (CONTRATO 1)
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  climaFalso,
  ubicacionFalsa,
  ciudadFalsa,
  crearPronosticoFalso,
} from '../mocks/contextoFalso'

const Contexto = createContext(null)

export function ContextoProvider({ children }) {
  const [cargando, setCargando] = useState(true)
  const [hora, setHora] = useState(() => new Date().getHours())
  const [pronosticoHorario] = useState(crearPronosticoFalso)
  // null = datos reales; objeto = valores simulados
  const [simulacion, setSimulacion] = useState(null)
  const [gpsSimulado, setGpsSimulado] = useState(false)

  // Simula que tarda en llegar el clima
  useEffect(() => {
    const t = setTimeout(() => setCargando(false), 400)
    return () => clearTimeout(t)
  }, [])

  // Actualiza la hora cada minuto
  useEffect(() => {
    const i = setInterval(() => setHora(new Date().getHours()), 60000)
    return () => clearInterval(i)
  }, [])

  const valor = useMemo(() => {
    // Datos "reales" (por ahora falsos)
    const reales = {
      ...climaFalso,
      hora,
      pronosticoHorario,
      ubicacion: ubicacionFalsa,
      ciudad: ciudadFalsa,
    }
    return {
      ...reales,
      // La simulación sobrescribe solo los valores que traiga
      ...(simulacion ?? {}),
      cargando,
      esSimulado: simulacion !== null,
      setSimulacion,
      gpsSimulado,
      setGpsSimulado,
    }
  }, [hora, pronosticoHorario, simulacion, cargando, gpsSimulado])

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