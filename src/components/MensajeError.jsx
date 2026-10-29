// Mensaje de error con botón opcional para reintentar
export default function MensajeError({ texto = 'Algo salió mal. Intenta de nuevo.', alReintentar }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-peligro/50 bg-peligro/10 p-4"
    >
      <p className="text-white">
        <span className="font-datos text-peligro font-bold">¡Ups! </span>
        {texto}
      </p>
      {alReintentar && (
        <button
          type="button"
          onClick={alReintentar}
          className="self-start min-h-11 px-4 rounded-xl bg-peligro text-white font-bold"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}