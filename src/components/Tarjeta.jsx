// Caja gris oscuro con esquinas redondeadas
export default function Tarjeta({ titulo, children, className = '' }) {
  return (
    <section className={`bg-tarjeta rounded-3xl p-4 ${className}`}>
      {titulo && (
        <h2 className="font-datos text-xs uppercase tracking-widest text-suave mb-3">
          {titulo}
        </h2>
      )}
      {children}
    </section>
  )
}