// Registro, inicio de sesión y hook useAuth (CONTRATO 4) con Supabase Auth
import { cliente } from './supabase'
import { useSesion } from '../context/AuthProvider'

// Traduce los errores de Supabase (vienen en inglés) a mensajes claros
function traducir(error, porDefecto) {
  const m = (error?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Ya existe una cuenta con ese correo.'
  if (m.includes('email not confirmed'))
    return 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada.'
  if (m.includes('password should be at least') || m.includes('weak password'))
    return 'Tu contraseña debe tener al menos 6 caracteres.'
  if (m.includes('invalid') && m.includes('email')) return 'Revisa tu correo. Debe verse así: nombre@correo.com'
  if (m.includes('rate limit') || m.includes('security purposes'))
    return 'Hiciste muchos intentos. Espera un minuto y vuelve a intentar.'
  if (m.includes('failed to fetch') || m.includes('network'))
    return 'No hay conexión a internet. Revisa tu conexión e intenta de nuevo.'
  if (error?.message?.startsWith('Falta configurar')) return error.message
  return porDefecto
}

// Crea la cuenta. Devuelve { usuario, necesitaConfirmar }
export async function registrar(nombre, correo, password, ciudad = 'Monterrey, Nuevo León') {
  try {
    const { data, error } = await cliente().auth.signUp({
      email: correo,
      password,
      options: { data: { nombre, ciudad } },
    })
    if (error) throw error
    // Supabase no avisa si el correo ya existía: lo detectamos así
    if (data.user && data.user.identities?.length === 0) {
      throw new Error('already registered')
    }
    return { usuario: data.user, necesitaConfirmar: !data.session }
  } catch (e) {
    throw new Error(traducir(e, 'No pudimos crear tu cuenta. Intenta de nuevo.'), { cause: e })
  }
}

export async function iniciarSesion(correo, password) {
  try {
    const { data, error } = await cliente().auth.signInWithPassword({ email: correo, password })
    if (error) throw error
    return data.user
  } catch (e) {
    throw new Error(traducir(e, 'No pudimos iniciar sesión. Intenta de nuevo.'), { cause: e })
  }
}

export async function cerrarSesion() {
  try {
    const { error } = await cliente().auth.signOut()
    if (error) throw error
  } catch (e) {
    throw new Error(traducir(e, 'No pudimos cerrar tu sesión. Intenta de nuevo.'), { cause: e })
  }
}

// Hook: devuelve { usuario, perfil, cargando }
export function useAuth() {
  return useSesion()
}
