import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";
import { extraerPolilinea, haversineKm } from "../services/gps";
import { instruccionGiro } from "../services/giros";
import useRuta from "../components/carrera/useRuta";
import Cargando from "../components/Cargando";
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

export default function EnCarrera() {
  const c = useCarrera();
  const contexto = useContexto();
  const { gpsSimulado } = contexto;
  const navigate = useNavigate();

  // La ruta que se eligió en Ruta Activa
  const { ruta, cargando } = useRuta(localStorage.getItem("ruta_activa_id"));

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
      route_id: ruta?.id ?? null,
      ruta_nombre: ruta?.nombre ?? "Carrera libre",
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

  // Sin carrera iniciada
  if (c.estado === "inactiva") {
    return (
      <div className="p-4 space-y-4 text-white">
        <div className="bg-tarjeta rounded-2xl p-5 text-center space-y-1">
          <p className="font-bold">No hay una carrera en curso</p>
          <p className="text-suave text-sm">Elige una ruta en Explorar y toca «Iniciar Carrera» en Ruta Activa.</p>
        </div>
        <button
          className="w-full bg-menta text-fondo font-bold py-4 rounded-full"
          onClick={() => navigate("/")}
        >
          Ir a Explorar
        </button>
      </div>
    );
  }

  if (cargando) return <Cargando texto="Cargando la ruta…" />;

  // Si la ruta ya no existe, se usa lo que va del recorrido
  const geojson = ruta?.geojson ?? null;
  const totalKm = geojson ? largoRutaKm(geojson) : Math.max(c.distanciaKm, 0.01);
  const pct = Math.min(100, (c.distanciaKm / totalKm) * 100);
  const restante = Math.max(0, totalKm - c.distanciaKm);
  const llego = c.estado === "corriendo" && c.distanciaKm >= totalKm - 0.03; // tolerancia de 30 m
  const giro = geojson ? instruccionGiro(c.posicion, geojson) : null;
  const alerta = c.posicion && geojson ? evaluarAlertaEnCarrera(c.posicion, geojson, contexto) : null;

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
      {ruta && <p className="font-titulos font-bold px-1">{ruta.nombre}</p>}
      <MapaRuta geojson={geojson} posicion={c.posicion} trayecto={c.trayecto} altura={300} seguir />

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

      {/* Tiempo y ritmo promedio */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-tarjeta rounded-2xl p-3">
          <p className="text-[11px] text-suave tracking-widest">TIEMPO</p>
          <p className="font-datos text-3xl mt-1">{formatoTiempo(c.tiempoSeg)}</p>
        </div>
        <div className="bg-tarjeta rounded-2xl p-3">
          <p className="text-[11px] text-suave tracking-widest">RITMO PROMEDIO</p>
          <p className="font-datos text-3xl mt-1">
            {formatoRitmo(c.ritmoPromedio)}
            <span className="text-xs text-suave ml-1">/km</span>
          </p>
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
      <div className="flex items-center">
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
    </div>
  );
}