// TEMPORAL: vitrina para probar los componentes. Se borra después.
import { useState } from 'react'
import Boton from './Boton'
import Tarjeta from './Tarjeta'
import Chip from './Chip'
import CampoTexto from './CampoTexto'
import HojaFlotante from './HojaFlotante'
import Cargando from './Cargando'
import MensajeError from './MensajeError'

export default function PruebaComponentes() {
  const [hojaAbierta, setHojaAbierta] = useState(false)
  const [correo, setCorreo] = useState('')
  const [enviando, setEnviando] = useState(false)

  const error = correo && !correo.includes('@') ? 'Escribe un correo válido.' : ''

  const simularEnvio = () => {
    setEnviando(true)
    setTimeout(() => setEnviando(false), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <Tarjeta titulo="Chips">
        <div className="flex flex-wrap gap-2">
          <Chip color="menta">Mucha sombra</Chip>
          <Chip color="lima">5.0 km</Chip>
          <Chip color="peligro">Sol total</Chip>
          <Chip color="cian">AQI 42</Chip>
          <Chip>Asfalto</Chip>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Campo de texto">
        <CampoTexto
          etiqueta="Correo"
          type="email"
          placeholder="tucorreo@ejemplo.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={error}
          ayuda="Escribe algo sin @ para ver el error"
        />
      </Tarjeta>

      <Boton cargando={enviando} onClick={simularEnvio}>Botón principal</Boton>
      <Boton variante="secundario" onClick={() => setHojaAbierta(true)}>Abrir hoja flotante</Boton>
      <Boton variante="peligro">Botón peligro</Boton>

      <Cargando texto="Buscando rutas…" />
      <MensajeError texto="No pudimos cargar el clima." alReintentar={() => alert('Reintentando')} />

      <HojaFlotante abierta={hojaAbierta} alCerrar={() => setHojaAbierta(false)} titulo="Hoja de prueba">
        <p className="text-suave mb-4">Así se ve un panel que sube desde abajo.</p>
        <Boton onClick={() => setHojaAbierta(false)}>Entendido</Boton>
      </HojaFlotante>
    </div>
  )
}