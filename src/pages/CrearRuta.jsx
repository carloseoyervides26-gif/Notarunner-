import { useNavigate } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import { rutaCarreraFalsa } from "../mocks/rutaCarrera";

// 312 seg/km -> 5'12"
function formatoRitmo(seg) {
  if (!seg || !isFinite(seg)) return "--'--\"";
  const m = Math.floor(seg / 60);
  const s = Math.round(seg % 60);
  return `${m}'${String(s).padStart(2, "0")}"`;
}

// 925 seg -> 00:15:25
function formatoTiempo(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function CrearRuta() {
  const c = useCarrera();
  const { gpsSimulado, setGpsSimulado } = useContexto();
  const navigate = useNavigate();

  function salir() {
    c.reiniciar();
    navigate("/");
  }

  // Estado inicial
  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">Carrera libre</h2>
        <p className="text-suave">
          Corre sin una ruta predefinida. Al terminar puedes compartir tu recorrido.
        </p>
        <button
          className="w-full bg-tarjeta py-3 rounded-xl"
          onClick={() => setGpsSimulado(!gpsSimulado)}
        >
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-xl"
          // En simulación se camina una ruta de prueba; con GPS real no se usa
          onClick={() => c.iniciar(rutaCarreraFalsa.geojson)}
        >
          Iniciar
        </button>
      </div>
    );
  }

  // Carrera terminada: resumen y pregunta de compartir
  if (c.estado === "terminada") {
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">¡Carrera finalizada!</h2>
        <div className="bg-tarjeta rounded-xl p-4 space-y-2 font-datos">
          <p>Tiempo: {formatoTiempo(c.tiempoSeg)}</p>
          <p>Distancia: {c.distanciaKm.toFixed(2)} km</p>
          <p>Ritmo promedio: {formatoRitmo(c.ritmoPromedio)} /km</p>
        </div>

        {/* TODO: llamar guardarCarrera({...}) de db.js al llegar aquí (siempre se guarda) */}

        <p className="font-bold">¿Te gustaría compartir esta ruta con la comunidad?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="bg-menta text-fondo font-bold py-3 rounded-xl"
            onClick={() => alert("Formulario de publicar: pendiente")}
          >
            SÍ
          </button>
          <button className="bg-tarjeta py-3 rounded-xl" onClick={salir}>
            No
          </button>
        </div>
      </div>
    );
  }

  // Corriendo o en pausa
  return (
    <div className="p-4 space-y-4 text-white">
      {c.estado === "pausada" && (
        <p className="text-center text-lima font-bold">En pausa</p>
      )}
      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{c.error}</p>}

      <div className="bg-tarjeta rounded-xl p-6 text-center">
        <p className="text-suave text-xs">CRONÓMETRO</p>
        <p className="text-5xl font-datos">{formatoTiempo(c.tiempoSeg)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">RITMO PROM. (/KM)</p>
          <p className="text-3xl font-datos text-lima">{formatoRitmo(c.ritmoPromedio)}</p>
        </div>
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">DISTANCIA (KM)</p>
          <p className="text-3xl font-datos">{c.distanciaKm.toFixed(2)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {c.estado === "corriendo" ? (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.pausar}>
            Pausar
          </button>
        ) : (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.reanudar}>
            Reanudar
          </button>
        )}
        <button className="w-full bg-peligro text-white font-bold py-3 rounded-xl" onClick={c.finalizar}>
          Finalizar ›
        </button>
        {gpsSimulado && (
          <button className="w-full bg-tarjeta py-2 rounded-xl text-sm" onClick={() => c.setVelocidad(5)}>
            Acelerar ×5 (solo simulación)
          </button>
        )}
      </div>
    </div>
  );
}