// Panel de diagnóstico térmico: temperatura, sensación y nivel de riesgo
import Tarjeta from '../Tarjeta'
import { evaluarRiesgo } from '../../engine/motorAdaptativo'

// Tailwind necesita las clases escritas completas, por eso este mapa
const COLORES = {
  menta: 'text-menta border-menta bg-menta/10',
  lima: 'text-lima border-lima bg-lima/10',
  peligro: 'text-peligro border-peligro bg-peligro/10',
}

export default function PanelClima({ contexto }) {
  // El motor decide el nivel, el color y el mensaje
  const riesgo = evaluarRiesgo(contexto)

  return (
    <Tarjeta titulo="DIAGNÓSTICO TÉRMICO">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs text-suave">Temperatura</p>
          <p className="font-datos text-5xl">{Math.round(contexto.temperatura)}°C</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-suave">Sensación térmica</p>
          <p className="font-datos text-2xl text-lima">
            {Math.round(contexto.sensacionTermica)}°C
          </p>
        </div>
      </div>

      <div className={'rounded-2xl border-2 p-3 ' + (COLORES[riesgo.color] ?? COLORES.menta)}>
        <p className="font-titulos font-bold">
          {riesgo.etiqueta} · {riesgo.mensaje}
        </p>
      </div>

      {/* Aviso de aire, solo si el motor lo manda */}
      {riesgo.avisoAire && (
        <p className="text-sm text-cian mt-3">{riesgo.avisoAire}</p>
      )}
    </Tarjeta>
  )
}
