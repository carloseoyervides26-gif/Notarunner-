// Campo de texto con etiqueta y mensaje de error
import { useId } from 'react'

export default function CampoTexto({ etiqueta, error, ayuda, className = '', ...resto }) {
  // id único para unir la etiqueta con el campo
  const id = useId()
  const idMensaje = `${id}-mensaje`

  return (
    <div className={className}>
      <label htmlFor={id} className="block font-datos text-xs uppercase tracking-widest text-suave mb-2">
        {etiqueta}
      </label>
      <input
        id={id}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error || ayuda ? idMensaje : undefined}
        className={`w-full min-h-14 px-4 rounded-2xl bg-tarjeta text-white placeholder:text-suave/60 border-2 outline-none transition focus:border-menta ${
          error ? 'border-peligro' : 'border-transparent'
        }`}
        {...resto} // type, value, onChange, placeholder...
      />
      {(error || ayuda) && (
        <p id={idMensaje} className={`mt-2 text-sm ${error ? 'text-peligro' : 'text-suave'}`}>
          {error || ayuda}
        </p>
      )}
    </div>
  )
}