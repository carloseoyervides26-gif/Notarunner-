// Selector de distancia: 3, 5, 10 km o Personalizado (1 a 42 km)
import Tarjeta from '../Tarjeta'
import CampoTexto from '../CampoTexto'

const OPCIONES = [
  { valor: 3, titulo: '3 km', subtitulo: 'Ligero' },
  { valor: 5, titulo: '5 km', subtitulo: 'Popular' },
  { valor: 10, titulo: '10 km', subtitulo: 'Retador' },
  { valor: 'personalizado', titulo: 'Personalizado', subtitulo: 'A tu medida' },
]

// Devuelve el mensaje de error del texto escrito, o '' si está bien
function validarTexto(texto) {
  if (texto === '') return ''
  if (!/^\d*\.?\d*$/.test(texto)) return 'Escribe solo números (sin letras ni negativos).'
  const n = Number(texto)
  if (n < 1 || n > 42) return 'La distancia debe ser de 1 a 42 km.'
  return ''
}

export default function SelectorDistancia({ opcion, alElegir, texto, alCambiarTexto }) {
  const error = opcion === 'personalizado' ? validarTexto(texto) : ''

  return (
    <Tarjeta titulo="¿QUÉ DISTANCIA QUIERES RECORRER?">
      {/* Indicador de sincronizado */}
      <p className="flex items-center gap-2 text-xs text-menta font-datos mb-3">
        <span className="w-2 h-2 rounded-full bg-menta" />
        Sincronizado
      </p>

      <div className="grid grid-cols-2 gap-3">
        {OPCIONES.map((o) => {
          const elegida = opcion === o.valor
          return (
            <button
              key={o.valor}
              type="button"
              onClick={() => alElegir(o.valor)}
              className={
                'rounded-2xl border-2 p-3 text-left min-h-16 transition ' +
                (elegida
                  ? 'border-menta bg-menta/10 text-menta'
                  : 'border-white/10 text-white')
              }
            >
              <span className="block font-titulos font-bold">{o.titulo}</span>
              <span className="block text-xs text-suave">{o.subtitulo}</span>
            </button>
          )
        })}
      </div>

      {opcion === 'personalizado' && (
        <div className="mt-3">
          <CampoTexto
            etiqueta="Escribe la distancia que quieres correr hoy en km"
            type="text"
            inputMode="decimal"
            placeholder="Ejemplo: 7"
            value={texto}
            onChange={(e) => alCambiarTexto(e.target.value)}
            error={error}
          />
        </div>
      )}
    </Tarjeta>
  )
}
