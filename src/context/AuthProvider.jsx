// Guarda la sesión del usuario y su perfil para toda la app
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

const AuthCtx = createContext(null)

// Perfil desde la tabla profiles; si aún no existe, usa los datos del registro
async function leerPerfil(usuario) {
  const respaldo = {
    id: usuario.id,
    nombre: usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Corredor',
    ciudad: usuario.user_metadata?.ciudad || 'Monterrey, Nuevo León',
    foto_url: null,
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, ciudad, foto_url')
    .eq('id', usuario.id)
    .maybeSingle()
  if (error || !data) return respaldo
  return data
}

export default function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [cargando, setCargando] = useState(Boolean(supabase))

  useEffect(() => {
    if (!supabase) return
    let vivo = true

    async function aplicar(sesion) {
      const u = sesion?.user ?? null
      if (!vivo) return
      setUsuario(u)
      setPerfil(u ? await leerPerfil(u) : null)
      if (vivo) setCargando(false)
    }

    // Sesión guardada al abrir la app
    supabase.auth.getSession().then(({ data }) => aplicar(data.session))

    // Cambios: iniciar o cerrar sesión
    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      // setTimeout evita llamar a Supabase dentro del propio aviso
      setTimeout(() => aplicar(sesion), 0)
    })

    return () => {
      vivo = false
      data.subscription.unsubscribe()
    }
  }, [])

  return <AuthCtx.Provider value={{ usuario, perfil, cargando }}>{children}</AuthCtx.Provider>
}

// Lee la sesión; lo usa useAuth() de services/auth.js
// eslint-disable-next-line react-refresh/only-export-components
export function useSesion() {
  const valor = useContext(AuthCtx)
  if (!valor) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return valor
}
