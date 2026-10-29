// Deja pasar solo si hay sesión; si no, manda a /login
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../services/auth'
import Cargando from './Cargando'

export default function RutaProtegida() {
  const { usuario, cargando } = useAuth()
  const ubicacion = useLocation()

  // Mientras revisa la sesión
  if (cargando) {
    return <Cargando texto="Revisando tu sesión…" />
  }

  // Sin sesión: a /login (recordamos a dónde quería ir)
  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  // Con sesión: muestra la página que toca
  return <Outlet />
}