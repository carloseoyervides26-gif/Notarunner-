// Dibujo pequeño del circuito (sin mapa): verde = sombra, naranja = sol
const ANCHO = 320
const ALTO = 140
const MARGEN = 14

export default function VistaPreviaRuta({ geojson, nombre }) {
  const lineas = (geojson?.features ?? []).filter((f) => f.geometry?.type === 'LineString')
  const todos = lineas.flatMap((f) => f.geometry.coordinates)
  if (todos.length < 2) return null

  // Escala: corrige el ancho de la longitud según la latitud
  const latMedia = todos.reduce((s, c) => s + c[1], 0) / todos.length
  const factor = Math.cos((latMedia * Math.PI) / 180)
  const xs = todos.map((c) => c[0] * factor)
  const ys = todos.map((c) => c[1])
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const escala = Math.min(
    (ANCHO - 2 * MARGEN) / (maxX - minX || 1e-9),
    (ALTO - 2 * MARGEN) / (maxY - minY || 1e-9),
  )
  // Centra el dibujo
  const dx = (ANCHO - (maxX - minX) * escala) / 2
  const dy = (ALTO - (maxY - minY) * escala) / 2
  const punto = (c) =>
    `${(dx + (c[0] * factor - minX) * escala).toFixed(1)},${(ALTO - dy - (c[1] - minY) * escala).toFixed(1)}`

  const inicio = punto(todos[0]).split(',')

  return (
    <svg
      viewBox={`0 0 ${ANCHO} ${ALTO}`}
      className="w-full h-36 bg-fondo"
      role="img"
      aria-label={`Forma del circuito ${nombre}`}
    >
      {lineas.map((f, i) => (
        <polyline
          key={i}
          points={f.geometry.coordinates.map(punto).join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={f.properties?.sombra === 'baja' ? 'text-peligro' : 'text-menta'}
        />
      ))}
      {/* Punto de inicio y llegada */}
      <circle cx={inicio[0]} cy={inicio[1]} r="6" className="fill-lima" />
    </svg>
  )
}
