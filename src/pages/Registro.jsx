// Pantalla para crear una cuenta nueva
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { registrar, useAuth } from '../services/auth'
import Boton from '../components/Boton'
import CampoTexto from '../components/CampoTexto'
import MensajeError from '../components/MensajeError'
import Cargando from '../components/Cargando'
import { IconoLogo } from '../components/Iconos'

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MINIMO_PASSWORD = 8

export default function Registro() {
  const { usuario, cargando } = useAuth()
  const navegar = useNavigate()

  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('Monterrey, Nuevo León')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) return <Cargando texto="Revisando tu sesión…" />
  if (usuario) return <Navigate to="/" replace />

  // Al escribir, se borra el error de ese campo
  function cambiar(campo, setter) {
    return (e) => {
      setter(e.target.value)
      setErrores((prev) => ({ ...prev, [campo]: '' }))
    }
  }

  function validar() {
    const nuevos = {}
    const nombreLimpio = nombre.trim()

    if (!nombreLimpio) nuevos.nombre = 'Escribe tu nombre.'
    else if (nombreLimpio.length < 2) nuevos.nombre = 'Tu nombre debe tener al menos 2 letras.'

    if (!correo.trim()) nuevos.correo = 'Escribe tu correo.'
    else if (!CORREO_VALIDO.test(correo.trim()))
      nuevos.correo = 'Revisa tu correo. Debe verse así: nombre@correo.com'

    if (!password) nuevos.password = 'Escribe una contraseña.'
    else if (password.length < MINIMO_PASSWORD)
      nuevos.password = `Tu contraseña debe tener al menos ${MINIMO_PASSWORD} caracteres.`

    if (!confirmar) nuevos.confirmar = 'Escribe otra vez tu contraseña.'
    else if (confirmar !== password)
      nuevos.confirmar = 'Las contraseñas no son iguales. Escríbelas otra vez.'

    if (!ciudad.trim()) nuevos.ciudad = 'Escribe tu ciudad.'
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
       await registrar(nombre.trim(), correo.trim(), password, ciudad.trim())
      navegar('/', { replace: true })
    } catch (err) {
      setErrorGeneral(
        err?.message || 'No pudimos crear tu cuenta. Revisa tu internet e intenta de nuevo.',
      )
      setEnviando(false)
    }
  }

  return (
    <main className="min-h-dvh max-w-md mx-auto px-5 py-10 flex flex-col justify-center">
      <div className="flex flex-col items-center text-center mb-8">
        <IconoLogo className="w-14 h-14 text-lima" />
        <h1 className="font-titulos text-3xl font-bold mt-3">Crea tu cuenta</h1>
        <p className="text-suave mt-2">Es gratis y solo toma un minuto.</p>
      </div>

      <form onSubmit={alEnviar} noValidate className="space-y-4">
        <CampoTexto
          etiqueta="Tu nombre"
          autoComplete="name"
          placeholder="Ej. Jimena Morales"
          value={nombre}
          onChange={cambiar('nombre', setNombre)}
          error={errores.nombre}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={cambiar('password', setPassword)}
          error={errores.password}
          ayuda={`Usa al menos ${MINIMO_PASSWORD} caracteres.`}
        />
        <CampoTexto
          etiqueta="Repite tu contraseña"
          type={verPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Escríbela otra vez"
          value={confirmar}
          onChange={cambiar('confirmar', setConfirmar)}
          error={errores.confirmar}
        />
           <CampoTexto
             etiqueta="Ciudad"
             autoComplete="address-level2"
             value={ciudad}
             onChange={cambiar('ciudad', setCiudad)}
             error={errores.ciudad}
   />

        <label className="flex items-center gap-3 text-suave min-h-11">
          <input
            type="checkbox"
            checked={verPassword}
            onChange={(e) => setVerPassword(e.target.checked)}
            className="w-5 h-5 accent-menta"
          />
          Mostrar contraseñas
        </label>

        {errorGeneral && <MensajeError texto={errorGeneral} />}

        <Boton type="submit" cargando={enviando}>
          Crear cuenta
        </Boton>
      </form>

      <p className="text-center text-suave mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-menta font-bold underline underline-offset-4">
          Inicia sesión
        </Link>
      </p>
    </main>
  )
}
