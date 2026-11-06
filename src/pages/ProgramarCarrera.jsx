// Pantalla Programar carrera: formulario dentro de una hoja flotante
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HojaFlotante from '../components/HojaFlotante'
import CampoTexto from '../components/CampoTexto'
import Boton from '../components/Boton'
import MensajeError from '../components/MensajeError'
// Cuando db.js tenga crearItinerario, cambia esta línea a '../services/db'
import { crearItinerario } from '../mocks/itinerarios'

// Fecha de hoy como 'AAAA-MM-DD' (con la hora local, no la de UTC)
function hoyLocal() {
  const f = new Date()
  const mes = String(f.getMonth() + 1).padStart(2, '0')
  const dia = String(f.getDate()).padStart(2, '0')
  return `${f.getFullYear()}-${mes}-${dia}`
}

// Revisa los campos y devuelve un objeto con los errores (vacío si todo bien)
function validar({ fecha, hora, distancia }) {
  const errores = {}

  if (!fecha) errores.fecha = 'Elige la fecha de tu carrera.'
  else if (fecha < hoyLocal()) errores.fecha = 'No puedes elegir una fecha pasada.'

  if (!hora) errores.hora = 'Elige la hora de salida.'
  else if (fecha === hoyLocal()) {
    const ahora = new Date()
    const actual = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0')
    if (hora < actual) errores.hora = 'Esa hora ya pasó. Elige una más tarde.'
  }

  if (distancia === '') errores.distancia = 'Escribe la distancia en km.'
  else if (!/^\d*\.?\d+$/.test(distancia)) errores.distancia = 'Escribe solo números (sin letras ni negativos).'
  else if (Number(distancia) < 1 || Number(distancia) > 42) errores.distancia = 'La distancia debe ser de 1 a 42 km.'

  return errores
}

export default function ProgramarCarrera() {
  const navigate = useNavigate()

  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [distancia, setDistancia] = useState('')
  const [notas, setNotas] = useState('')
  const [avisar, setAvisar] = useState(false)

  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState('')
  const [guardado, setGuardado] = useState(false)

  async function guardar() {
    const nuevosErrores = validar({ fecha, hora, distancia })
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setGuardando(true)
    setErrorGuardar('')
    try {
      await crearItinerario({
        fecha,
        hora,
        distancia_km: Number(distancia),
        notas: notas.trim(),
        avisar,
      })
      setGuardado(true)
      // Muestra el mensaje un momento y regresa a Explorar
      setTimeout(() => navigate('/'), 1200)
    } catch {
      setErrorGuardar('No pudimos guardar tu carrera.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <HojaFlotante abierta alCerrar={() => navigate('/')} titulo="‹ Programar carrera">
      <div className="space-y-4">
        <CampoTexto
          etiqueta="¿Cuándo vas a correr? *"
          type="date"
          min={hoyLocal()}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          error={errores.fecha}
        />

        <CampoTexto
          etiqueta="Hora prevista de salida *"
          type="time"
          value={hora}
          onChange={(e) => setHora(e.target.value)}
          error={errores.hora}
        />

        <CampoTexto
          etiqueta="Distancia objetivo (km) *"
          type="text"
          inputMode="decimal"
          placeholder="Ejemplo: 5"
          value={distancia}
          onChange={(e) => setDistancia(e.target.value)}
          error={errores.distancia}
        />

        <div>
          <label className="block text-sm text-suave mb-1" htmlFor="notas">
            Notas (opcional)
          </label>
          <textarea
            id="notas"
            rows={3}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ejemplo: salgo con mi hermano"
            className="w-full bg-fondo border border-white/10 rounded-2xl p-3 text-white placeholder:text-suave"
          />
        </div>

        <label className="flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={avisar}
            onChange={(e) => setAvisar(e.target.checked)}
            className="mt-1 w-5 h-5 accent-menta"
          />
          <span>Avisarme 30 min antes con la alerta del clima y sugerencia de hidratación</span>
        </label>

        {errorGuardar && <MensajeError texto={errorGuardar} alReintentar={guardar} />}

        {guardado ? (
          <p className="text-menta font-bold text-center py-3">Carrera programada ✓</p>
        ) : (
          <Boton cargando={guardando} onClick={guardar}>
            Guardar en mi itinerario
          </Boton>
        )}
      </div>
    </HojaFlotante>
  )
}
