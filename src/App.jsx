// Prueba temporal: muestra todas las páginas juntas
import Login from './pages/Login'
import Registro from './pages/Registro'
import Explorar from './pages/Explorar'
import ProgramarCarrera from './pages/ProgramarCarrera'
import RutaActiva from './pages/RutaActiva'
import EnCarrera from './pages/EnCarrera'
import CrearRuta from './pages/CrearRuta'
import Comunidad from './pages/Comunidad'
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <div>
      <Login />
      <Registro />
      <Explorar />
      <ProgramarCarrera />
      <RutaActiva />
      <EnCarrera />
      <CrearRuta />
      <Comunidad />
      <Perfil />
    </div>
  )
}