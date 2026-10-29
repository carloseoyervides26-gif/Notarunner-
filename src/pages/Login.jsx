// Pantalla para iniciar sesión
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { iniciarSesion, useAuth } from '../services/auth'
import Boton from '../components/Boton'
import CampoTexto from '../components/CampoTexto'
import MensajeError from '../components/MensajeError'
import Cargando from '../components/Cargando'
import { IconoLogo } from '../components/Iconos'

// Revisa que el correo tenga forma de correo
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  // A dónde quería ir antes de que le pidiéramos iniciar sesión
  const destino = ubicacion.state?.desde ?? '/'

  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Mientras revisa la sesión
  if (cargando) return <Cargando texto="Revisando tu sesión…" />
  // Si ya tiene sesión, no necesita esta pantalla
  if (usuario) return <Navigate to={destino} replace />

  // Al escribir, se borra el error de ese campo
  function cambiar(campo, setter) {
    return (e) => {
      setter(e.target.value)
      setErrores((prev) => ({ ...prev, [campo]: '' }))
    }
  }

  function validar() {
    const nuevos = {}
    if (!correo.trim()) nuevos.correo = 'Escribe tu correo.'
    else if (!CORREO_VALIDO.test(correo.trim()))
      nuevos.correo = 'Revisa tu correo. Debe verse así: nombre@correo.com'
    if (!password) nuevos.password = 'Escribe tu contraseña.'
    return nuevos
  }

  async function alEnviar(e) {
    e.preventDefault()
    setErrorGeneral('')
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setEnviando(true)
    try {
      await iniciarSesion(correo.trim(), password)
      navegar(destino, { replace: true })
    } catch (err) {
      setErrorGeneral(
        err?.message || 'No pudimos iniciar sesión. Revisa tu internet e intenta de nuevo.',
      )
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-dvh max-w-md mx-auto px-5 py-10 flex flex-col justify-center">
      {/* Logo y bienvenida */}
      <div className="flex flex-col items-center text-center mb-8">
        <IconoLogo className="w-14 h-14 text-lima" />
        <h1 className="font-titulos text-3xl font-bold mt-3">Not a runner</h1>
        <p className="text-suave mt-2">Corre o camina sin arriesgarte con el calor.</p>
      </div>

      <h2 className="font-titulos text-xl font-semibold mb-4">Inicia sesión</h2>

      <form onSubmit={alEnviar} noValidate className="space-y-4">
        <CampoTexto
          etiqueta="Correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@correo.com"
          value={correo}
          onChange={cambiar('correo', setCorreo)}
          error={errores.correo}
        />
        <CampoTexto
          etiqueta="Contraseña"
          type={verPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Tu contraseña"
          value={password}
          onChange={cambiar('password', setPassword)}
          error={errores.password}
        />

        {/* Mostrar u ocultar la contraseña */}
        <label className="flex items-center gap-3 text-suave min-h-11">
          <input
            type="checkbox"
            checked={verPassword}
            onChange={(e) => setVerPassword(e.target.checked)}
            className="w-5 h-5 accent-menta"
          />
          Mostrar contraseña
        </label>

        {errorGeneral && <MensajeError texto={errorGeneral} />}

        <Boton type="submit" cargando={enviando}>
          Entrar
        </Boton>
      </form>

      <p className="text-center text-suave mt-6">
        ¿No tienes cuenta?{' '}
        <Link to="/registro" className="text-menta font-bold underline underline-offset-4">
          Crea una aquí
        </Link>
      </p>
    </main>
  )
}