// Cliente de Supabase (usa las variables VITE_ del archivo .env)
import { createClient } from '@supabase/supabase-js'

// Quita "/rest/v1/" o "/" del final por si se copió la URL completa
const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
const clave = import.meta.env.VITE_SUPABASE_ANON_KEY

// Si faltan las variables, supabase queda en null y la app avisa con un mensaje claro
export const supabase = url && clave ? createClient(url, clave) : null

// Devuelve el cliente o lanza un error en español
export function cliente() {
  if (!supabase) {
    throw new Error('Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).')
  }
  return supabase
}
