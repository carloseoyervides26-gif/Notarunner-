// Panel secreto para simular clima y GPS (se abre tocando 5 veces el logo)
import { useContexto } from '../context/ContextoProvider'
import HojaFlotante from './HojaFlotante'
import Boton from './Boton'

// Escenarios listos para la presentación
const ESCENARIOS = [
  { nombre: 'Mañana fresca', valores: { temperatura: 26, sensacionTermica: 26, uv: 2, aqi: 35, hora: 6 } },
  { nombre: 'Tarde extrema', valores: { temperatura: 40, sensacionTermica: 45, uv: 10.5, aqi: 70, hora: 16 } },
  { nombre: 'Aire malo', valores: { temperatura: 33, sensacionTermica: 35, uv: 7, aqi: 160, hora: 9 } },
  { nombre: 'Noche', valores: { temperatura: 29, sensacionTermica: 30, uv: 0, aqi: 45, hora: 21 } },
]

// Deslizadores: qué valor mueven, su rango y cómo se muestran
const DESLIZADORES = [
  { campo: 'temperatura', etiqueta: 'Temperatura', min: 10, max: 50, paso: 1, formato: (v) => `${v} °C` },
  { campo: 'sensacionTermica', etiqueta: 'Sensación térmica', min: 10, max: 55, paso: 1, formato: (v) => `${v} °C` },
  { campo: 'uv', etiqueta: 'Índice UV', min: 0, max: 12, paso: 0.1, formato: (v) => Number(v).toFixed(1) },
  { campo: 'aqi', etiqueta: 'Calidad del aire (AQI)', min: 0, max: 300, paso: 1, formato: (v) => String(v) },
  { campo: 'hora', etiqueta: 'Hora del día', min: 0, max: 23, paso: 1, formato: (v) => `${String(v).padStart(2, '0')}:00` },
]

// Interruptor de encendido/apagado
function Interruptor({ etiqueta, descripcion, activo, alCambiar }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={() => alCambiar(!activo)}
      className="w-full min-h-14 flex items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block font-semibold">{etiqueta}</span>
        <span className="block text-sm text-suave">{descripcion}</span>
      </span>
      <span className={`relative w-14 h-8 shrink-0 rounded-full transition ${activo ? 'bg-menta' : 'bg-fondo'}`}>
        <span
          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all ${activo ? 'left-7' : 'left-1'}`}
        />
      </span>
    </button>
  )
}

export default function PanelSimulacion({ abierto, alCerrar }) {
  const c = useContexto()

  // Los 5 valores que se pueden simular, tal como están ahora
  const actuales = {
    temperatura: c.temperatura,
    sensacionTermica: c.sensacionTermica,
    uv: c.uv,
    aqi: c.aqi,
    hora: c.hora,
  }

  // Mover un deslizador activa la simulación con ese valor
  function cambiarValor(campo, valor) {
    c.setSimulacion({ ...actuales, [campo]: Number(valor) })
  }

  // Encendido = datos reales; apagado = congela los valores actuales
  function usarDatosReales(activo) {
    c.setSimulacion(activo ? null : actuales)
  }

  // ¿Este escenario es el que está puesto?
  function esActivo(escenario) {
    return c.esSimulado && Object.entries(escenario.valores).every(([k, v]) => actuales[k] === v)
  }

  return (
    <HojaFlotante abierta={abierto} alCerrar={alCerrar} titulo="Panel de simulación">
      <div className="space-y-6">
        {/* Interruptores */}
        <div className="divide-y divide-fondo">
          <Interruptor
            etiqueta="Usar datos reales"
            descripcion="Apágalo para controlar el clima a mano"
            activo={!c.esSimulado}
            alCambiar={usarDatosReales}
          />
          <Interruptor
            etiqueta="Simular GPS"
            descripcion="Avanza por la ruta sin caminar"
            activo={c.gpsSimulado}
            alCambiar={c.setGpsSimulado}
          />
        </div>

        {/* Escenarios rápidos */}
        <div>
          <h3 className="font-datos text-xs uppercase tracking-widest text-suave mb-3">Escenarios</h3>
          <div className="grid grid-cols-2 gap-2">
            {ESCENARIOS.map((e) => (
              <button
                key={e.nombre}
                type="button"
                onClick={() => c.setSimulacion(e.valores)}
                className={`min-h-16 rounded-2xl p-3 text-left border-2 transition ${
                  esActivo(e) ? 'border-menta bg-menta/10' : 'border-transparent bg-fondo'
                }`}
              >
                <span className="block font-semibold">{e.nombre}</span>
                <span className="block font-datos text-xs text-suave">
                  {e.valores.temperatura} °C · AQI {e.valores.aqi}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Deslizadores */}
        <div className="space-y-5">
          <h3 className="font-datos text-xs uppercase tracking-widest text-suave">Ajuste fino</h3>
          {DESLIZADORES.map((d) => (
            <label key={d.campo} className="block">
              <span className="flex justify-between mb-2">
                <span>{d.etiqueta}</span>
                <span className="font-datos text-lima">{d.formato(actuales[d.campo])}</span>
              </span>
              <input
                type="range"
                min={d.min}
                max={d.max}
                step={d.paso}
                value={actuales[d.campo]}
                onChange={(e) => cambiarValor(d.campo, e.target.value)}
                className="w-full h-8 accent-menta"
              />
            </label>
          ))}
        </div>

        <Boton onClick={alCerrar}>Listo</Boton>
      </div>
    </HojaFlotante>
  )
}