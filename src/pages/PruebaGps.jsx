import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";

// Ruta falsa: un tramo con sombra, uno sin sombra y 2 puntos
const geo = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { sombra: "alta" },
      geometry: { type: "LineString", coordinates: [[-100.3161, 25.6866], [-100.3130, 25.6885]] } },
    { type: "Feature", properties: { sombra: "baja" },
      geometry: { type: "LineString", coordinates: [[-100.3130, 25.6885], [-100.3050, 25.6930]] } },
    { type: "Feature", properties: { tipo: "agua", nombre: "Fuente 1" },
      geometry: { type: "Point", coordinates: [-100.3140, 25.6880] } },
    { type: "Feature", properties: { tipo: "medico", nombre: "Servicio médico" },
      geometry: { type: "Point", coordinates: [-100.3060, 25.6925] } },
  ],
};

export default function PruebaGps() {
  const c = useCarrera();
  const { gpsSimulado, setGpsSimulado } = useContexto();

  return (
    <div className="p-4 text-white space-y-2">
      <p>GPS simulado: {gpsSimulado ? "SÍ" : "NO"} | Estado: {c.estado}</p>
      <p>Distancia: {c.distanciaKm.toFixed(3)} km | Tiempo: {c.tiempoSeg} s</p>
      <p>Ritmo: {c.ritmoActual ? Math.round(c.ritmoActual) + " s/km" : "-"}</p>
      <p className="text-red-400">{c.error}</p>

      <MapaRuta geojson={geo} posicion={c.posicion} trayecto={c.trayecto} seguir />

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