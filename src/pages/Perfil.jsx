// Pantalla Perfil: datos del usuario, impacto y 3 pestañas
import { useState } from 'react'
import BotonCerrarSesion from '../components/BotonCerrarSesion'
import EncabezadoPerfil from '../components/perfil/EncabezadoPerfil'
import ChipsImpacto from '../components/perfil/ChipsImpacto'
import ListaHistorial from '../components/perfil/ListaHistorial'
import ListaItinerarios from '../components/perfil/ListaItinerarios'
import ListaReportes from '../components/perfil/ListaReportes'
// Datos falsos. Cuando auth.js esté listo, cambia por:
//   import { useAuth } from '../services/auth'
//   const { perfil } = useAuth()
import { usuarioMock } from '../mocks/usuario'

const PESTANAS = [
  { id: 'historial', nombre: 'Mi historial' },
  { id: 'itinerarios', nombre: 'Mis itinerarios' },
  { id: 'reportes', nombre: 'Mis reportes' },
]

export default function Perfil() {
  const { perfil } = usuarioMock
  const [pestana, setPestana] = useState('historial')

  return (
    <div className="p-4 space-y-5">
      <EncabezadoPerfil perfil={perfil} />
      <ChipsImpacto userId={perfil.id} />

      {/* Pestañas: la activa va en verde menta */}
      <div className="grid grid-cols-3 gap-2">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPestana(p.id)}
            className={
              'rounded-2xl py-2 text-xs font-bold border-2 ' +
              (pestana === p.id
                ? 'border-menta text-menta bg-menta/10'
                : 'border-white/10 text-suave')
            }
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {pestana === 'historial' && <ListaHistorial userId={perfil.id} />}
      {pestana === 'itinerarios' && <ListaItinerarios userId={perfil.id} />}
      {pestana === 'reportes' && <ListaReportes userId={perfil.id} />}

      <BotonCerrarSesion />
    </div>
  )
}
