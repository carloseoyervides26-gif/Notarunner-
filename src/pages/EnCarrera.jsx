import { useNavigate } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";
import { extraerPolilinea, haversineKm } from "../services/gps";
import { rutaCarreraFalsa } from "../mocks/rutaCarrera";

// TODO: cuando exista getRuta(id) de la Persona 5, leer la ruta con el id de localStorage "ruta_activa_id"
const ruta = rutaCarreraFalsa;

// Largo real de la ruta en km
function largoRutaKm(geojson) {
  const p = extraerPolilinea(geojson);
  let km = 0;
  for (let i = 1; i < p.length; i++) km += haversineKm(p[i - 1], p[i]);
  return km;
}

// 312 seg/km -> 5'12"
function formatoRitmo(seg) {
  if (!seg || !isFinite(seg)) return "--'--\"";
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}'${String(s).padStart(2, "0")}"`;
}

// 879 seg -> 14:39
function formatoTiempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function EnCarrera() {
  const c = useCarrera();
  const { gpsSimulado, setGpsSimulado } = useContexto();
  const navigate = useNavigate();

  const totalKm = largoRutaKm(ruta.geojson);
  const pct = Math.min(100, (c.distanciaKm / totalKm) * 100);
  const restante = Math.max(0, totalKm - c.distanciaKm);
  const llego = c.estado === "corriendo" && c.distanciaKm >= totalKm;

  // Sin carrera iniciada (solo para pruebas; normalmente se llega desde Ruta Activa)
  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <p className="text-suave">No hay una carrera en curso.</p>
        <button
          className="w-full bg-tarjeta py-3 rounded-xl"
          onClick={() => setGpsSimulado(!gpsSimulado)}
        >
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-xl"
          onClick={() => c.iniciar(ruta.geojson)}
        >
          Iniciar carrera de prueba
        </button>
      </div>
    );
  }

  // Carrera terminada: resumen
  if (c.estado === "terminada") {
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">¡Carrera finalizada!</h2>
        <div className="bg-tarjeta rounded-xl p-4 space-y-2 font-datos">
          <p>Tiempo: {formatoTiempo(c.tiempoSeg)}</p>
          <p>Distancia: {c.distanciaKm.toFixed(2)} km</p>
          <p>Ritmo promedio: {formatoRitmo(c.ritmoPromedio)} /km</p>
        </div>
        {/* TODO: llamar guardarCarrera() de db.js */}
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-xl"
          onClick={() => {
            c.reiniciar();
            navigate("/");
          }}
        >
          Volver a Explorar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 text-white">
      <MapaRuta
        geojson={ruta.geojson}
        posicion={c.posicion}
        trayecto={c.trayecto}
        altura={240}
        seguir
      />

      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{c.error}</p>}

      {llego && (
        <div className="bg-lima/20 text-lima rounded-xl p-3 font-bold">
          ¡Llegaste! Toca Finalizar para cerrar la carrera.
        </div>
      )}

      {c.estado === "pausada" && (
        <p className="text-center text-lima font-bold">En pausa</p>
      )}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">RITMO ACTUAL</p>
          <p className="text-3xl font-datos text-lima">{formatoRitmo(c.ritmoActual)}</p>
          <p className="text-suave text-xs">/km</p>
        </div>
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">TIEMPO</p>
          <p className="text-3xl font-datos">{formatoTiempo(c.tiempoSeg)}</p>
        </div>
      </div>

      {/* Barra de distancia */}
      <div className="bg-tarjeta rounded-xl p-3 space-y-2">
        <div className="flex justify-between font-datos text-sm">
          <span>
            {c.distanciaKm.toFixed(2)} / {totalKm.toFixed(2)} km
          </span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="h-2 bg-fondo rounded-full overflow-hidden">
          <div className="h-full bg-menta" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-suave text-xs">{restante.toFixed(2)} km rest.</p>
      </div>

      {/* Botones */}
      <div className="space-y-2">
        {c.estado === "corriendo" ? (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.pausar}>
            Pausar carrera
          </button>
        ) : (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.reanudar}>
            Reanudar
          </button>
        )}
        {(c.estado === "pausada" || llego) && (
          <button className="w-full bg-peligro text-white font-bold py-3 rounded-xl" onClick={c.finalizar}>
            Finalizar
          </button>
        )}
        {gpsSimulado && (
          <button className="w-full bg-tarjeta py-2 rounded-xl text-sm" onClick={() => c.setVelocidad(5)}>
            Acelerar ×5 (solo simulación)
          </button>
        )}
      </div>
    </div>
  );
}