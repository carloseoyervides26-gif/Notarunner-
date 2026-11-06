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

// 879 seg -> 14:39
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

  // Flecha y texto de apoyo de la instrucción de giro
  const textoGiro = giro?.texto || "";
  const flecha = textoGiro.includes("DERECHA") ? "↱" : textoGiro.includes("IZQUIERDA") ? "↰" : "↑";
  const apoyoGiro = textoGiro.includes("DERECHA")
    ? "Gira a la derecha hacia el siguiente punto de la ruta"
    : textoGiro.includes("IZQUIERDA")
    ? "Gira a la izquierda hacia el siguiente punto de la ruta"
    : textoGiro.includes("LLEGADA")
    ? "Estás por terminar la ruta"
    : "Continúa por la ruta";

  // Enlaces del SOS
  const { lat, lng } = c.posicion || {};
  const enlaceMapa = c.posicion ? `https://www.google.com/maps?q=${lat},${lng}` : "";
  const textoSos = encodeURIComponent(`Necesito ayuda. Mi ubicación: ${enlaceMapa}`);

  // Sin carrera iniciada
  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <div className="bg-tarjeta rounded-2xl p-5 text-center space-y-1">
          <p className="font-bold">No hay una carrera en curso</p>
          <p className="text-suave text-sm">Elige una ruta en Ruta Activa para comenzar.</p>
        </div>
        <button className="w-full text-xs text-suave py-1" onClick={() => setGpsSimulado(!gpsSimulado)}>
          GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
        </button>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-full"
          onClick={() => c.iniciar(ruta.geojson)}
        >
          ▶ Iniciar carrera de prueba
        </button>
      </div>
    );
  }

  // Carrera terminada
  if (c.estado === "terminada") {
    return (
      <div className="p-4 min-h-[70vh] flex items-center justify-center text-white">
        <div className="bg-tarjeta rounded-3xl p-6 w-full max-w-sm text-center space-y-4">
          <h2 className="text-xl font-titulos font-bold">¡Carrera finalizada!</h2>
          <div className="font-datos text-lima text-sm space-y-1">
            <p>Tiempo {formatoTiempo(c.tiempoSeg)} min</p>
            <p>Distancia {c.distanciaKm.toFixed(2)} km</p>
            <p>Ritmo promedio {formatoRitmo(c.ritmoPromedio)} /km</p>
          </div>
          <button
            className="w-full bg-menta text-fondo font-bold py-3 rounded-full"
            onClick={() => {
              c.reiniciar();
              navigate("/");
            }}
          >
            Volver a Explorar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3 text-white">
      {/* Instrucción de giro */}
      {giro && (
        <div className="bg-tarjeta rounded-2xl p-3 flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-cian/20 text-cian flex flex-col items-center justify-center shrink-0">
            <span className="text-2xl leading-none">{flecha}</span>
            <span className="font-datos text-xs mt-1">{giro.metros} m</span>
          </div>
          <div>
            <p className="text-xs font-bold text-menta tracking-wide">{textoGiro}</p>
            <p className="text-sm text-suave mt-0.5">{apoyoGiro}</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <MapaRuta geojson={ruta.geojson} posicion={c.posicion} trayecto={c.trayecto} altura={300} seguir />

      {c.error && <p className="bg-peligro/20 text-peligro rounded-xl p-3 text-sm">{c.error}</p>}
      {c.avisoPantalla && <p className="bg-lima/15 text-lima rounded-xl p-3 text-xs">{c.avisoPantalla}</p>}
      {llego && (
        <div className="bg-lima/15 text-lima rounded-xl p-3 font-bold text-sm">
          ¡Llegaste! Toca Finalizar para cerrar la carrera.
        </div>
      )}
      {c.estado === "pausada" && (
        <p className="text-center text-lima text-xs font-bold tracking-widest">EN PAUSA</p>
      )}

      {/* Ritmo actual */}
      <div className="px-1">
        <p className="text-[11px] text-suave tracking-widest">RITMO ACTUAL</p>
        <p className="font-datos text-6xl">
          {formatoRitmo(c.ritmoActual)}
          <span className="text-lg text-suave ml-1">/km</span>
        </p>
      </div>

      {/* Tiempo y cardio */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tarjeta rounded-2xl p-3">
          <p className="text-[11px] text-suave tracking-widest">TIEMPO</p>
          <p className="font-datos text-3xl mt-1">{formatoTiempo(c.tiempoSeg)}</p>
        </div>
        <div className="bg-tarjeta rounded-2xl p-3">
          <p className="text-[11px] text-suave tracking-widest">CARDIO</p>
          <p className="font-datos text-3xl text-peligro mt-1">
            {bpm}
            <span className="text-xs text-suave ml-1">BPM</span>
          </p>
          <p className="text-[10px] text-lima font-bold mt-1">{zonaCardio(bpm)}</p>
          <p className="text-[9px] text-suave">FC simulada</p>
        </div>
      </div>

      {/* Alerta solar */}
      {alerta && (
        <div className="bg-peligro/15 border border-peligro rounded-2xl p-3 flex gap-3">
          <span className="text-peligro text-xl">▲</span>
          <div>
            <p className="text-peligro text-[11px] font-bold tracking-wider">ALERTA SOLAR ACTIVA</p>
            <p className="text-sm">{alerta.mensaje}</p>
          </div>
        </div>
      )}

      {/* Distancia recorrida */}
      <div className="bg-tarjeta rounded-2xl p-3 space-y-2">
        <p className="text-[11px] text-suave tracking-widest">DISTANCIA RECORRIDA</p>
        <div className="flex justify-between items-end">
          <p className="font-datos text-3xl">
            {c.distanciaKm.toFixed(2)}
            <span className="text-sm text-suave"> / {totalKm.toFixed(2)} km</span>
          </p>
          <p className="font-datos text-lima">{pct.toFixed(1)}%</p>
        </div>
        <div className="h-2 bg-fondo rounded-full overflow-hidden">
          <div className="h-full bg-menta rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-suave text-[11px] text-right">{restante.toFixed(2)} km rest.</p>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-3">
        {c.estado === "corriendo" ? (
          <button
            className="flex-1 bg-menta text-fondo font-bold py-4 rounded-full tracking-wide"
            onClick={c.pausar}
          >
            ⏸ PAUSAR CARRERA
          </button>
        ) : (
          <button
            className="flex-1 bg-menta text-fondo font-bold py-4 rounded-full tracking-wide"
            onClick={c.reanudar}
          >
            ▶ REANUDAR
          </button>
        )}
        <button
          className="w-14 h-14 rounded-full bg-peligro text-white font-bold text-sm shrink-0"
          onClick={() => setVerSos(true)}
        >
          SOS
        </button>
      </div>
      {(c.estado === "pausada" || llego) && (
        <button
          className="w-full border border-peligro text-peligro font-bold py-3 rounded-full"
          onClick={c.finalizar}
        >
          Finalizar carrera
        </button>
      )}
      {gpsSimulado && (
        <button className="w-full text-xs text-suave py-1" onClick={() => c.setVelocidad(5)}>
          Acelerar ×5 (solo simulación)
        </button>
      )}

      {/* Ventana SOS */}
      {verSos && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-[2000]">
          <div className="bg-tarjeta w-full max-w-md rounded-t-3xl p-4 space-y-3">
            <p className="font-bold text-lg">Emergencia</p>
            <a href="tel:911" className="block text-center bg-peligro text-white font-bold py-3 rounded-full">
              Llamar al 911
            </a>
            <a
              href={`sms:?&body=${textoSos}`}
              className={`block text-center bg-menta text-fondo font-bold py-3 rounded-full ${
                c.posicion ? "" : "opacity-50 pointer-events-none"
              }`}
            >
              Enviar mi ubicación por mensaje
            </a>
            <button className="w-full bg-fondo py-3 rounded-full" onClick={() => setVerSos(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}