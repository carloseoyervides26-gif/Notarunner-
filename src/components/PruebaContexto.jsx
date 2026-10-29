// TEMPORAL: muestra el contexto para probarlo. Se borra en la pieza 5.
import { useContexto } from '../context/ContextoProvider'

export default function PruebaContexto() {
  const c = useContexto()

  if (c.cargando) return <p className="p-4 text-suave">Cargando clima…</p>

  return (
    <div className="m-4 p-4 bg-tarjeta rounded-2xl font-datos text-sm space-y-1">
      <p className="text-lima">{c.temperatura} °C · sensación {c.sensacionTermica} °C</p>
      <p className="text-cian">UV {c.uv} · AQI {c.aqi} · humedad {c.humedad}%</p>
      <p>Hora: {c.hora} · {c.ciudad} · simulado: {c.esSimulado ? 'sí' : 'no'}</p>
      <p className="text-suave">Pronóstico: {c.pronosticoHorario.length} horas</p>
      <div className="flex gap-2 pt-2">
        <button
          className="bg-peligro px-3 py-2 rounded-lg"
          onClick={() => c.setSimulacion({ temperatura: 40, sensacionTermica: 44 })}
        >
          Simular 40 °C
        </button>
        <button
          className="bg-menta text-fondo px-3 py-2 rounded-lg"
          onClick={() => c.setSimulacion(null)}
        >
          Datos normales
        </button>
      </div>
    </div>
  )
}