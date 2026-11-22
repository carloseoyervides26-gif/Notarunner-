// Pantalla Perfil: datos del usuario, impacto y 3 pestañas
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/auth'
import BotonCerrarSesion from '../components/BotonCerrarSesion'
import Cargando from '../components/Cargando'
import EncabezadoPerfil from '../components/perfil/EncabezadoPerfil'
import ChipsImpacto from '../components/perfil/ChipsImpacto'
import ListaHistorial from '../components/perfil/ListaHistorial'
import ListaItinerarios from '../components/perfil/ListaItinerarios'
import ListaReportes from '../components/perfil/ListaReportes'

const PESTANAS = [
  { id: 'historial', nombre: 'Mi historial' },
  { id: 'itinerarios', nombre: 'Mis itinerarios' },
  { id: 'reportes', nombre: 'Mis comentarios' },
]

export default function Perfil() {
  const { perfil } = useAuth()
  const navigate = useNavigate()
  const [pestana, setPestana] = useState('historial')

  if (!perfil) return <Cargando texto="Cargando tu perfil…" />

  return (
    <div className="p-4 space-y-5">
      {/* Flecha para regresar al panel principal */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="flex items-center gap-2 min-h-11 pr-4 pl-3 rounded-full bg-tarjeta text-sm font-bold"
        aria-label="Regresar a Explorar"
      >
        <span className="text-xl leading-none text-menta" aria-hidden="true">‹</span>
        Regresar
      </button>

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
