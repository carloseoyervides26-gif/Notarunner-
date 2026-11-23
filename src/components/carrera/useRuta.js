// Hook: carga una ruta por id y la lista completa (para la ruta alterna)
import { useEffect, useState } from 'react'
import { getRutas } from '../../services/db'

export default function useRuta(id) {
  const [rutas, setRutas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    getRutas()
      .then((lista) => vivo && setRutas(lista))
      .catch((e) => vivo && setError(e?.message || 'No pudimos cargar la ruta.'))
      .finally(() => vivo && setCargando(false))
    return () => {
      vivo = false
    }
  }, [intento])

  const ruta = id ? rutas.find((r) => String(r.id) === String(id)) ?? null : null

  // Volver a pedir: marca "cargando" y repite la consulta
  function recargar() {
    setCargando(true)
    setError('')
    setIntento((n) => n + 1)
  }

  return { ruta, rutas, cargando, error, recargar }
}
