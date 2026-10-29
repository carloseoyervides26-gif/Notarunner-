// Indicador de carga con círculo girando
export default function Cargando({ texto = 'Cargando…' }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-suave">
      <span className="w-10 h-10 rounded-full border-4 border-tarjeta border-t-menta animate-spin" />
      <p className="font-datos text-sm">{texto}</p>
    </div>
  )
}