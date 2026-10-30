// VERSIÓN FALSA de auth.js. La Persona 5 la cambia por Supabase.
// IMPORTANTE: mantener los mismos nombres y parámetros (CONTRATO 4).
import { useEffect, useState } from 'react'

// Datos de prueba
const USUARIO_PRUEBA = { id: 'usuario-prueba-1', email: 'prueba@notarunner.mx' }
const PERFIL_PRUEBA = {
  id: 'usuario-prueba-1',
  nombre: 'Jimena Morales',
  ciudad: 'Monterrey, Nuevo León',
  foto_url: null,
}

// La sesión falsa se guarda en el navegador
const CLAVE = 'sesionFalsa'
const EVENTO = 'cambio-sesion-falsa'

// ¿Hay sesión? Por defecto sí (usuario de prueba)
function haySesion() {
  try {
    return localStorage.getItem(CLAVE) !== 'cerrada'
  } catch {
    return true
  }
}

// Abre o cierra la sesión y avisa a la app
function guardarSesion(activa) {
  try {
    if (activa) localStorage.removeItem(CLAVE)
    else localStorage.setItem(CLAVE, 'cerrada')
  } catch {
    // Si el navegador no deja guardar, no pasa nada
  }
  window.dispatchEvent(new Event(EVENTO))
}

// Simula que tarda como si fuera internet
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms))

// ciudad es opcional (pendiente de acordar con la Persona 5)
export async function registrar(nombre, correo, password, ciudad = 'Monterrey, Nuevo León') {
  await esperar(500)
  if (!nombre || !correo || !password) {
    throw new Error('Completa todos los campos.')
  }
  guardarSesion(true)
  return { ...USUARIO_PRUEBA, email: correo }
}

export async function iniciarSesion(correo, password) {
  await esperar(500)
  // Para probar errores: escribe "error" como contraseña
  if (password === 'error') {
    throw new Error('Correo o contraseña incorrectos.')
  }
  guardarSesion(true)
  return { ...USUARIO_PRUEBA, email: correo }
}

export async function cerrarSesion() {
  await esperar(200)
  guardarSesion(false)
}

// Hook: devuelve { usuario, perfil, cargando }
export function useAuth() {
  const [cargando, setCargando] = useState(true)
  const [activa, setActiva] = useState(haySesion)

  useEffect(() => {
    const temporizador = setTimeout(() => setCargando(false), 300)
    const actualizar = () => setActiva(haySesion())
    window.addEventListener(EVENTO, actualizar)
    return () => {
      clearTimeout(temporizador)
      window.removeEventListener(EVENTO, actualizar)
    }
  }, [])

  return {
    usuario: activa ? USUARIO_PRUEBA : null,
    perfil: activa ? PERFIL_PRUEBA : null,
    cargando,
  }
}