// Tres tarjetas pequeñas: índice UV, calidad del aire y humedad

// UV: 0-2 Bajo, 3-5 Moderado, 6-7 Alto, 8-10 Muy alto, 11+ Extremo
function etiquetaUV(uv) {
  const n = Math.floor(uv)
  if (n <= 2) return 'Bajo'
  if (n <= 5) return 'Moderado'
  if (n <= 7) return 'Alto'
  if (n <= 10) return 'Muy alto'
  return 'Extremo'
}

// Aire: 0-50 Buena, 51-100 Moderada, 101-150 Dañina para sensibles, 151+ Dañina
function etiquetaAire(aqi) {
  if (aqi <= 50) return 'Buena calidad'
  if (aqi <= 100) return 'Moderada'
  if (aqi <= 150) return 'Dañina para sensibles'
  return 'Dañina'
}

// Humedad: menos de 40 Sequedad alta, 40-60 Confortable, más de 60 Húmedo
function etiquetaHumedad(h) {
  if (h < 40) return 'Sequedad alta'
  if (h <= 60) return 'Confortable'
  return 'Húmedo'
}

function MiniTarjeta({ titulo, valor, etiqueta }) {
  return (
    <div className="bg-tarjeta rounded-2xl p-3">
      <p className="text-xs text-suave">{titulo}</p>
      <p className="font-datos text-2xl text-cian">{valor}</p>
      <p className="text-xs text-white">{etiqueta}</p>
    </div>
  )
}

export default function TarjetasUVAireHumedad({ contexto }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <MiniTarjeta
        titulo="Índice UV"
        valor={contexto.uv.toFixed(1)}
        etiqueta={etiquetaUV(contexto.uv)}
      />
      <MiniTarjeta
        titulo="Aire (AQI)"
        valor={Math.round(contexto.aqi)}
        etiqueta={etiquetaAire(contexto.aqi)}
      />
      <MiniTarjeta
        titulo="Humedad"
        valor={Math.round(contexto.humedad) + '%'}
        etiqueta={etiquetaHumedad(contexto.humedad)}
      />
    </div>
  )
}
