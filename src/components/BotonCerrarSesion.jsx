// Botón para cerrar sesión (la Persona 3 lo pone en el Perfil)
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cerrarSesion } from '../services/auth'
import Boton from './Boton'
import MensajeError from './MensajeError'

export default function BotonCerrarSesion() {
  const navegar = useNavigate()
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function alTocar() {
    setError('')
    setCargando(true)
    try {
      await cerrarSesion()
      navegar('/login', { replace: true })
    } catch (err) {
      setError(err?.message || 'No pudimos cerrar tu sesión. Intenta de nuevo.')
      setCargando(false)
    }
  }

  return (
    <div className="space-y-3">
      {error && <MensajeError texto={error} />}
      <Boton variante="secundario" cargando={cargando} onClick={alTocar}>
        Cerrar sesión
      </Boton>
    </div>
  )
}