// Prueba de colores y fuentes
export default function App() {
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Explorar</h1>
      <div className="bg-tarjeta rounded-2xl p-4">
        <p className="text-suave">Monterrey, NL</p>
        <p className="font-datos text-lima text-3xl">UV 9.2</p>
        <p className="font-datos text-cian">AQI 42</p>
        <p className="font-datos text-peligro">CALOR FUERTE</p>
      </div>
      <button className="bg-menta text-fondo font-bold rounded-xl w-full py-4">
        Crear nueva ruta
      </button>
    </div>
  )
}