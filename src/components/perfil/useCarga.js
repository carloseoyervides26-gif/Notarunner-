// Ayudante: pide datos y devuelve { datos, cargando, error, recargar }
import { useEffect, useState } from 'react'

// Se llama useCarga porque usa hooks de React
export default function useCarga(funcion) {
  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  // Cambiar este número vuelve a pedir los datos
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vivo = true
    funcion()
      .then((d) => {
        if (vivo) setDatos(d)
      })
      .catch((e) => {
        if (vivo) setError(e?.message || 'No pudimos cargar esta información.')
      })
      .finally(() => {
        if (vivo) setCargando(false)
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento])

  // Volver a pedir: marca "cargando" y repite la consulta
  function recargar() {
    setCargando(true)
    setError('')
    setIntento((n) => n + 1)
  }

  return { datos, cargando, error, recargar }
}
