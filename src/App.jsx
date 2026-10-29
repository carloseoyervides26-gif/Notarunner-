// Mapa de rutas de la app
import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Explorar from './pages/Explorar'
import RutaActiva from './pages/RutaActiva'
import EnCarrera from './pages/EnCarrera'
import Comunidad from './pages/Comunidad'
import Perfil from './pages/Perfil'
import ProgramarCarrera from './pages/ProgramarCarrera'
import CrearRuta from './pages/CrearRuta'

export default function App() {
  return (
    <Routes>
      {/* Públicas: no piden sesión */}
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      {/* Protegidas: sin sesión mandan a /login */}
      <Route element={<RutaProtegida />}>
        <Route path="/" element={<Explorar />} />
        <Route path="/ruta-activa" element={<RutaActiva />} />
        <Route path="/en-carrera" element={<EnCarrera />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/programar" element={<ProgramarCarrera />} />
        <Route path="/crear-ruta" element={<CrearRuta />} />
      </Route>

      {/* Dirección que no existe: a Explorar */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}