import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";
import { extraerPolilinea, haversineKm } from "../services/gps";
import { instruccionGiro } from "../services/giros";
import { buscarRuta } from "../mocks/rutaCarrera";
import { evaluarAlertaEnCarrera } from "../engine/motorAdaptativo";
import { guardarCarreraSeguro } from "../services/guardadoP4";

function largoRutaKm(geojson) {
  const p = extraerPolilinea(geojson);
  let km = 0;
  for (let i = 1; i < p.length; i++) km += haversineKm(p[i - 1], p[i]);
  return km;
}

function formatoRitmo(seg) {
  if (!seg || !isFinite(seg)) return "--'--\"";
  return `${Math.floor(seg / 60)}'${String(Math.round(seg % 60)).padStart(2, "0")}"`;
}

function formatoTiempo(seg) {
  const m = Math.floor(seg / 60);
  return `${String(m).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
}

function zonaCardio(b) {
  if (b < 125) return "ZONA 2 LIGERA";
  if (b < 145) return "ZONA 3 AERÓBICA";
  if (b < 160) return "ZONA 4 UMBRAL";
  return "ZONA 5 MÁXIMA";
}

export default function EnCarrera() {
  const c = useCarrera();
  const contexto = useContexto();
  const { gpsSimulado, setGpsSimulado } = contexto;
  const navigate = useNavigate();

  // TODO: cambiar por getRuta(id) de la Persona 5
  const ruta = buscarRuta(localStorage.getItem("ruta_activa_id"));

  const [bpm, setBpm] = useState(125);
  const [verSos, setVerSos] = useState(false);
  const ritmoRef = useRef(null);
  ritmoRef.current = c.ritmoActual;

  // Cardio simulado: camina entre 120 y 165 y sube con el ritmo
  useEffect(() => {
    if (c.estado !== "corriendo") return;
    const id = setInterval(() => {
      setBpm((b) => {
        const r = ritmoRef.current;
        const objetivo = r ? Math.max(120, Math.min(165, 190 - r / 8)) : 135;
        const nuevo = b + (objetivo - b) * 0.2 + (Math.random() * 6 - 3);
        return Math.round(Math.max(120, Math.min(165, nuevo)));
      });
    }, 3000);
    return () => clearInterval(id);
  }, [c.estado]);

  // Guarda la carrera una sola vez al terminar
  const guardada = useRef(false);
  useEffect(() => {
    if (c.estado !== "terminada") {
      guardada.current = false;
      return;
    }
    if (guardada.current) return;
    guardada.current = true;
    guardarCarreraSeguro({
      route_id: ruta.id,
      inicio: new Date(Date.now() - c.tiempoSeg * 1000).toISOString(),
      fin: new Date().toISOString(),
      duracion_seg: c.tiempoSeg,
      distancia_km: Number(c.distanciaKm.toFixed(3)),
      ritmo_min_km: c.ritmoPromedio ? Number((c.ritmoPromedio / 60).toFixed(2)) : null,
      trayecto: c.trayecto,
      sensacion_termica: contexto.sensacionTermica,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.estado]);

  const totalKm = largoRutaKm(ruta.geojson);
  const pct = Math.min(100, (c.distanciaKm / totalKm) * 100);
  const restante = Math.max(0, totalKm - c.distanciaKm);
  const llego = c.estado === "corriendo" && c.distanciaKm >= totalKm - 0.03; // tolerancia de 30 m
  const giro = instruccionGiro(c.posicion, ruta.geojson);
  const alerta = c.posicion ? evaluarAlertaEnCarrera(c.posicion, ruta.geojson, contexto) : null;

  // Enlaces del SOS
  const { lat, lng } = c.posicion || {};
  const enlaceMapa = c.posicion ? `https://www.google.com/maps?q=${lat},${lng}` : "";
  const textoSos = encodeURIComponent(`Necesito ayuda. Mi ubicación: ${enlaceMapa}`);

  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <p className="text-suave">No hay una carrera en curso.</p>
        <button className="w-full bg-tarjeta py-3 rounded-xl" onClick={() => setGpsSimulado(!gpsSimulado)}>
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={() => c.iniciar(ruta.geojson)}>
          Iniciar carrera de prueba
        </button>
      </div>
    );
  }

  if (c.estado === "terminada") {
    return (
      <div className="p-4 space-y-4 text-white">
        <h2 className="text-2xl font-titulos">¡Carrera finalizada!</h2>
        <div className="bg-tarjeta rounded-xl p-4 space-y-2 font-datos">
          <p>Tiempo: {formatoTiempo(c.tiempoSeg)}</p>
          <p>Distancia: {c.distanciaKm.toFixed(2)} km</p>
          <p>Ritmo promedio: {formatoRitmo(c.ritmoPromedio)} /km</p>
        </div>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-xl"
          onClick={() => { c.reiniciar(); navigate("/"); }}
        >
          Volver a Explorar
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 text-white">
      {/* Instrucción de giro */}
      {giro && (
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="font-bold text-menta">{giro.texto}</p>
          <p className="font-datos text-sm">{giro.metros} m</p>
        </div>
      )}

      {/* Alerta solar (tramo sin sombra cerca) */}
      {alerta && (
        <div className="bg-peligro/20 border border-peligro rounded-xl p-3">
          <p className="text-peligro font-bold">{alerta.mensaje}</p>
          <p className="font-datos text-sm text-peligro">{alerta.metros} m</p>
        </div>
      )}

      <MapaRuta geojson={ruta.geojson} posicion={c.posicion} trayecto={c.trayecto} altura={220} seguir />

      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{c.error}</p>}
      {c.avisoPantalla && <p className="bg-lima/20 text-lima rounded-xl p-3 text-sm">{c.avisoPantalla}</p>}

      {llego && (
        <div className="bg-lima/20 text-lima rounded-xl p-3 font-bold">¡Llegaste! Toca Finalizar para cerrar la carrera.</div>
      )}
      {c.estado === "pausada" && <p className="text-center text-lima font-bold">En pausa</p>}

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">RITMO</p>
          <p className="text-2xl font-datos text-lima">{formatoRitmo(c.ritmoActual)}</p>
          <p className="text-suave text-xs">/km</p>
        </div>
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">TIEMPO</p>
          <p className="text-2xl font-datos">{formatoTiempo(c.tiempoSeg)}</p>
        </div>
        <div className="bg-tarjeta rounded-xl p-3">
          <p className="text-suave text-xs">CARDIO</p>
          <p className="text-2xl font-datos text-peligro">{bpm}</p>
          <p className="text-suave text-[10px]">BPM · FC simulada</p>
        </div>
      </div>
      <p className="text-center text-xs text-suave">{zonaCardio(bpm)}</p>

      {/* Barra de distancia */}
      <div className="bg-tarjeta rounded-xl p-3 space-y-2">
        <div className="flex justify-between font-datos text-sm">
          <span>{c.distanciaKm.toFixed(2)} / {totalKm.toFixed(2)} km</span>
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
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.pausar}>Pausar carrera</button>
        ) : (
          <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={c.reanudar}>Reanudar</button>
        )}
        {(c.estado === "pausada" || llego) && (
          <button className="w-full bg-peligro text-white font-bold py-3 rounded-xl" onClick={c.finalizar}>Finalizar</button>
        )}
        <button className="w-full bg-peligro/30 text-peligro font-bold py-3 rounded-xl" onClick={() => setVerSos(true)}>SOS</button>
        {gpsSimulado && (
          <button className="w-full bg-tarjeta py-2 rounded-xl text-sm" onClick={() => c.setVelocidad(5)}>
            Acelerar ×5 (solo simulación)
          </button>
        )}
      </div>

      {/* Ventana SOS */}
      {verSos && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[2000]">
          <div className="bg-tarjeta w-full max-w-md rounded-t-2xl p-4 space-y-3">
            <p className="font-bold text-lg">Emergencia</p>
            <a href="tel:911" className="block text-center bg-peligro text-white font-bold py-3 rounded-xl">
              Llamar al 911
            </a>
            <a
              href={`sms:?&body=${textoSos}`}
              className={`block text-center bg-menta text-fondo font-bold py-3 rounded-xl ${c.posicion ? "" : "opacity-50 pointer-events-none"}`}
            >
              Enviar mi ubicación por mensaje
            </a>
            <button className="w-full bg-fondo py-3 rounded-xl" onClick={() => setVerSos(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}