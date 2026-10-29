// Deja pasar solo si hay sesión; si no, manda a /login
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/auth'

export default function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  // Mientras revisa la sesión
  if (cargando) {
    return <p className="p-6 text-suave">Cargando…</p>
  }

  // Sin sesión: a /login (recordamos a dónde quería ir)
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  // Con sesión: muestra la página que toca
  return <Outlet />
}