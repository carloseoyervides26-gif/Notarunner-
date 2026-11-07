// Tarjeta de una ruta: etiquetas, foto, datos y botón para comenzar
import Chip from '../Chip'
import Boton from '../Boton'

// Elige el color de cada etiqueta según su texto
function colorEtiqueta(texto) {
  if (texto.includes('SEGURA')) return 'menta'
  if (texto.includes('SOMBRA')) return 'lima'
  if (texto.includes('ILUMINACIÓN')) return 'cian'
  return undefined
}

function Dato({ titulo, valor }) {
  return (
    <div>
      <p className="text-xs text-suave">{titulo}</p>
      <p className="font-datos text-sm">{valor}</p>
    </div>
  )
}

export default function TarjetaRuta({ ruta, alComenzar }) {
  const tieneAdvertencia = Boolean(ruta.advertencia)

  return (
    <div className="bg-tarjeta rounded-3xl overflow-hidden">
      {/* Etiquetas de arriba */}
      {ruta.etiquetas?.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3">
          {ruta.etiquetas.map((e) => (
            <Chip key={e} color={colorEtiqueta(e)}>{e}</Chip>
          ))}
        </div>
      )}

      {/* Advertencia roja, solo si el motor la manda */}
      {tieneAdvertencia && (
        <p className="bg-peligro text-white text-xs font-bold px-3 py-2">
          {ruta.advertencia.toUpperCase()}
        </p>
      )}

      {/* Foto (si no hay, un fondo de respaldo) */}
      {ruta.imagen_url ? (
        <img
          src={ruta.imagen_url}
          alt={ruta.nombre}
          className="w-full h-40 object-cover"
        />
      ) : (
        <div className="w-full h-40 bg-fondo flex items-center justify-center text-suave text-sm">
          Sin foto
        </div>
      )}

      <div className="p-4 space-y-3">
        <p className="font-datos text-menta text-sm">
          {ruta.distancia_km.toFixed(1)} KM
        </p>
        <div>
          <h3 className="font-titulos font-bold text-xl">{ruta.nombre}</h3>
          <p className="text-sm text-suave">{ruta.descripcion}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Dato titulo="Superficie" valor={ruta.superficie} />
          <Dato titulo="Hidratación" valor={`${ruta.fuentes_agua} fuentes`} />
          <Dato titulo="Protege" valor={`${ruta.sombra_pct}% sombra`} />
        </div>

        <Boton onClick={() => alComenzar(ruta)}>
          {tieneAdvertencia ? 'Ver detalles de la ruta' : 'Comenzar ruta'}
        </Boton>
      </div>
    </div>
  )
}
