// Mejor hora para correr, calculada por el motor adaptativo
import { useMemo } from 'react'
import Tarjeta from '../Tarjeta'
import Chip from '../Chip'
import { calcularMejorHora } from '../../engine/motorAdaptativo'

// '06:30' -> '06:30 AM', '19:15' -> '19:15 PM'
function conAmPm(hhmm) {
  const hora = Number(hhmm.split(':')[0])
  return `${hhmm} ${hora < 12 ? 'AM' : 'PM'}`
}

export default function MejorHora({ pronosticoHorario }) {
  // Solo se recalcula cuando cambia el pronóstico
  const mejor = useMemo(() => calcularMejorHora(pronosticoHorario), [pronosticoHorario])

  return (
    <Tarjeta titulo="MEJOR HORA PARA CORRER">
      <div className="mb-2">
        <Chip color="cian">CALCULADA</Chip>
      </div>

      {mejor?.inicio && mejor?.fin ? (
        <p className="font-datos text-lg">
          {conAmPm(mejor.inicio)} - {conAmPm(mejor.fin)}
          {mejor.despuesDe && <> o después de {conAmPm(mejor.despuesDe)}</>}
        </p>
      ) : (
        <p className="text-suave">No hay una hora ideal con el pronóstico de hoy.</p>
      )}

      <p className="text-sm text-suave mt-1">
        {mejor?.motivo || 'Menor acumulación de calor al ejercitarte'}
      </p>
    </Tarjeta>
  )
}
