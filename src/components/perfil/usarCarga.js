// Ayudante: pide datos y devuelve { datos, cargando, error, recargar }
import { useEffect, useState } from 'react'

export default function usarCarga(funcion) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Cambiar este número vuelve a pedir los datos
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    setError('')
    funcion()
      .then((d) => {
        if (vivo) setDatos(d)
      })
      .catch(() => {
        if (vivo) setError('No pudimos cargar esta información.')
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento])

  return { datos, cargando, error, recargar: () => setIntento((n) => n + 1) }
}
