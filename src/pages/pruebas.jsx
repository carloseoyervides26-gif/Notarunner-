import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";

// Ruta falsa de ~2 km para probar
const geo = {
  features: [
    {
      geometry: {
        type: "LineString",
        coordinates: [
          [-100.3161, 25.6866],
          [-100.31, 25.69],
          [-100.3, 25.695],
        ],
      },
    },
  ],
};

export default function PruebaGps() {
  const c = useCarrera();
  const { gpsSimulado, setGpsSimulado } = useContexto();

  return (
    <div className="p-4 text-white space-y-2">
      <p>GPS simulado: {gpsSimulado ? "SÍ" : "NO"}</p>
      <p>Estado: {c.estado}</p>
      <p>Distancia: {c.distanciaKm.toFixed(3)} km</p>
      <p>Tiempo: {c.tiempoSeg} s</p>
      <p>Ritmo: {c.ritmoActual ? Math.round(c.ritmoActual) + " s/km" : "-"}</p>
      <p className="text-red-400">{c.error}</p>

      <div className="flex flex-wrap gap-2">
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={() => setGpsSimulado(true)}>1. Activar GPS simulado</button>
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={() => c.iniciar(geo)}>2. Iniciar</button>
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={c.pausar}>Pausar</button>
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={c.reanudar}>Reanudar</button>
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={() => c.setVelocidad(5)}>x5</button>
        <button className="bg-gray-700 px-3 py-2 rounded" onClick={c.reiniciar}>Reiniciar</button>
      </div>
    </div>
  );
}