import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";
import { extraerPolilinea, haversineKm } from "../services/gps";
import { buscarRuta, rutasFalsas } from "../mocks/rutaCarrera";
import { evaluarRiesgo, generarChecklist, elegirRutaAlterna } from "../engine/motorAdaptativo";

// Rango de km donde hay tramos sin sombra: [inicio, fin] o null
function rangoSolKm(geojson) {
  let acumulado = 0;
  let inicio = null;
  let fin = null;
  (geojson?.features || []).forEach((f) => {
    if (f.geometry?.type !== "LineString") return;
    const pts = f.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    let km = 0;
    for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
    if (f.properties?.sombra === "baja") {
      if (inicio === null) inicio = acumulado;
      fin = acumulado + km;
    }
    acumulado += km;
  });
  return inicio === null ? null : [inicio, fin];
}

function largoKm(geojson) {
  const p = extraerPolilinea(geojson);
  let km = 0;
  for (let i = 1; i < p.length; i++) km += haversineKm(p[i - 1], p[i]);
  return km;
}

// Círculo de selección (como en el Figma)
function Radio({ activo }) {
  return (
    <span
      className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
        activo ? "border-menta" : "border-suave/50"
      }`}
    >
      {activo && <span className="w-2.5 h-2.5 rounded-full bg-menta" />}
    </span>
  );
}

// Texto de detalle del equipo; marca "Obligatorio" si el motor no lo trae
function textoDetalle(i) {
  const d = i.detalle || "";
  if (i.obligatorio && !d.includes("Obligatorio")) return `Obligatorio hoy${d ? " · " + d : ""}`;
  return d;
}

export default function RutaActiva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useCarrera();
  const contexto = useContexto();
  const { gpsSimulado, setGpsSimulado, uv, temperatura } = contexto;

  // TODO: cuando exista getRuta(id) de la Persona 5, usarla aquí
  const rutaOriginal = buscarRuta(id || localStorage.getItem("ruta_activa_id"));

  const riesgo = evaluarRiesgo(contexto);
  const alterna = riesgo.nivel >= 2 ? elegirRutaAlterna(rutaOriginal, rutasFalsas, contexto) : null;
  const [usarAlterna, setUsarAlterna] = useState(false);
  const ruta = usarAlterna && alterna ? alterna : rutaOriginal;

  const items = generarChecklist(contexto);
  const [marcados, setMarcados] = useState({});
  const [aviso, setAviso] = useState("");

  const distanciaKm = ruta.distancia_km ?? largoKm(ruta.geojson);
  const minutos = Math.round(distanciaKm * 6); // ritmo base 6:00 min/km
  const listos = items.filter((i) => marcados[i.id]).length;
  const rango = rangoSolKm(ruta.geojson);
  const puntos = (ruta.geojson?.features || []).filter((f) => f.geometry?.type === "Point");
  const nAgua = puntos.filter((f) => f.properties?.tipo === "agua").length;
  const nMedico = puntos.filter((f) => f.properties?.tipo === "medico").length;

  const condicion =
    riesgo.nivel >= 2 ? "Condición Caliente" : riesgo.nivel === 1 ? "Condición Templada" : "Condición Favorable";
  const chipClase =
    riesgo.nivel >= 2
      ? "bg-peligro/15 text-peligro"
      : riesgo.nivel === 1
      ? "bg-lima/15 text-lima"
      : "bg-menta/15 text-menta";

  function iniciarCarrera() {
    setAviso("");
    const faltan = items.filter((i) => i.obligatorio && !marcados[i.id]);
    if (faltan.length > 0 && !window.confirm("¿Iniciar sin lo obligatorio?")) return;

    function arrancar() {
      localStorage.setItem("ruta_activa_id", ruta.id);
      c.iniciar(ruta.geojson);
      navigate("/en-carrera");
    }

    if (gpsSimulado) return arrancar();
    if (!navigator.geolocation) {
      setAviso("Tu navegador no soporta GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      arrancar,
      () => setAviso("No se pudo obtener el GPS. Activa la ubicación del navegador y reintenta."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="p-4 space-y-3 text-white">
      {/* Tarjeta del circuito */}
      <div className="bg-tarjeta rounded-2xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-lima text-[11px] font-bold tracking-widest">◉ CIRCUITO ACTIVO</p>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${chipClase}`}>{condicion}</span>
        </div>
        <div>
          <h2 className="text-xl font-titulos font-bold">{ruta.nombre}</h2>
          {ruta.descripcion && <p className="text-suave text-sm mt-1">{ruta.descripcion}</p>}
        </div>
        <div className="grid grid-cols-4 gap-2 pt-1">
          {[
            ["DISTANCIA", `${distanciaKm.toFixed(1)}km`],
            ["DESNIVEL", `+${ruta.desnivel_m ?? 0}m`],
            ["SOMBRA", `${ruta.sombra_pct ?? 0}%`],
            ["TIEMPO EST.", `${minutos}min`],
          ].map(([t, v]) => (
            <div key={t}>
              <p className="text-[9px] text-suave tracking-wider">{t}</p>
              <p className="font-datos text-lima text-base">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Alerta térmica */}
      {riesgo.nivel >= 1 ? (
        <div className="bg-tarjeta rounded-2xl p-4 space-y-3 border border-peligro/40">
          <div className="flex justify-between items-center">
            <p className="text-peligro text-[11px] font-bold tracking-wider">
              ▲ ALERTA TÉRMICA NIVEL {riesgo.nivel}
            </p>
            <span className="font-datos text-[11px] bg-fondo px-2 py-1 rounded-full">
              {Math.round(temperatura)}°C / UV {Number(uv).toFixed(1)}
            </span>
          </div>
          <p className="text-sm">{riesgo.mensaje}</p>
          {rango && (
            <p className="text-sm text-peligro">
              ¡Alerta de mucho calor! (km {rango[0].toFixed(1)} a {rango[1].toFixed(1)})
            </p>
          )}
          {riesgo.avisoAire && <p className="text-cian text-sm">{riesgo.avisoAire}</p>}

          {alterna && (
            <div className="space-y-2">
              <button
                onClick={() => setUsarAlterna(true)}
                className={`w-full text-left flex gap-3 p-3 rounded-xl border ${
                  usarAlterna ? "border-menta bg-menta/10" : "border-suave/20 bg-fondo/40"
                }`}
              >
                <Radio activo={usarAlterna} />
                <span className="flex-1">
                  <span className="flex justify-between items-start gap-2">
                    <span className="font-bold text-sm">Ruta Alterna: {alterna.nombre}</span>
                    <span className="text-[9px] font-bold bg-menta text-fondo px-2 py-0.5 rounded-full shrink-0">
                      RECOMENDADO
                    </span>
                  </span>
                  <span className="block text-xs text-cian mt-1">
                    -{alterna.ahorroTermico}°C sensación térmica
                  </span>
                </span>
              </button>
              <button
                onClick={() => setUsarAlterna(false)}
                className={`w-full text-left flex gap-3 p-3 rounded-xl border ${
                  !usarAlterna ? "border-menta bg-menta/10" : "border-suave/20 bg-fondo/40"
                }`}
              >
                <Radio activo={!usarAlterna} />
                <span>
                  <span className="block font-bold text-sm">Mantener ruta original</span>
                  <span className="block text-xs text-suave mt-1">
                    Requiere hidratación y protección reforzada
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-tarjeta rounded-2xl p-3 text-menta text-sm font-bold">Condiciones favorables</div>
      )}

      {/* Mapa de sombra y sol */}
      <div className="bg-tarjeta rounded-2xl p-3 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold">Mapa de sombra y sol</p>
          <div className="flex gap-3 text-[11px] text-suave">
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-menta inline-block" />
              Sombra
            </span>
            <span className="flex items-center gap-1">
              <i className="w-2 h-2 rounded-full bg-peligro inline-block" />
              Sol Directo
            </span>
          </div>
        </div>
        <MapaRuta geojson={ruta.geojson} altura={200} />
        <div className="flex gap-2 text-[11px]">
          <span className="bg-fondo rounded-full px-3 py-1.5 text-cian">💧 {nAgua} Puntos de Agua Activos</span>
          <span className="bg-fondo rounded-full px-3 py-1.5 text-suave">➕ {nMedico} Servicio</span>
        </div>
      </div>

      {/* Equipo sugerido */}
      <div className="bg-tarjeta rounded-2xl p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-bold">Equipo Sugerido</p>
            <p className="text-[11px] text-suave">Recomendado para el día de hoy</p>
          </div>
          <span className="font-datos text-[11px] bg-lima/15 text-lima px-2.5 py-1 rounded-full">
            {listos}/{items.length} LISTO
          </span>
        </div>
        {items.map((i) => {
          const marcado = !!marcados[i.id];
          return (
            <button
              key={i.id}
              onClick={() => setMarcados((m) => ({ ...m, [i.id]: !m[i.id] }))}
              className="w-full flex items-start gap-3 py-2.5 text-left border-t border-fondo/60 first:border-t-0"
            >
              <span
                className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-sm font-bold ${
                  marcado ? "bg-menta text-fondo" : "border-2 border-suave/40"
                }`}
              >
                {marcado ? "✓" : ""}
              </span>
              <span>
                <span className="block font-bold text-sm">{i.nombre}</span>
                <span className={`block text-xs ${i.obligatorio ? "text-peligro" : "text-suave"}`}>
                  {textoDetalle(i)}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {aviso && <p className="bg-peligro/20 text-peligro rounded-xl p-3 text-sm">{aviso}</p>}

      <button
        className="w-full bg-menta text-fondo font-bold py-4 rounded-full flex items-center justify-center gap-2"
        onClick={iniciarCarrera}
      >
        ▶ Iniciar Carrera
      </button>
      <p className="text-center text-[11px] text-suave">Todo listo: GPS y frecuencia cardíaca sincronizados</p>

      <button className="w-full text-xs text-suave py-1" onClick={() => setGpsSimulado(!gpsSimulado)}>
        GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
      </button>
    </div>
  );
}