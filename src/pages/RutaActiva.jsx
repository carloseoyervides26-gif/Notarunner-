import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCarrera } from "../context/CarreraProvider";
import { useContexto } from "../context/ContextoProvider";
import MapaRuta from "../components/carrera/MapaRuta";
import { extraerPolilinea, haversineKm } from "../services/gps";
import { rutaCarreraFalsa } from "../mocks/rutaCarrera";

// TODO: cuando exista getRuta(id) de la Persona 5, usarla con el id de la URL
function obtenerRuta() {
  return rutaCarreraFalsa;
}

// TEMPORAL: reemplazar por generarChecklist(contexto) de engine/motorAdaptativo.js
function checklistTemporal({ uv, sensacionTermica }) {
  const nivel2 = sensacionTermica >= 35;
  return [
    { id: "bloqueador", nombre: "Bloqueador solar SPF 50+", obligatorio: uv >= 8 },
    { id: "lentes", nombre: "Lentes de sol", obligatorio: false },
    { id: "gorra", nombre: "Visera o gorra", obligatorio: uv >= 8 },
    { id: "hidratacion", nombre: "Soft flask de 500 ml", obligatorio: nivel2 },
    { id: "tenis", nombre: "Tenis para correr", obligatorio: false },
  ];
}

function largoKm(geojson) {
  const p = extraerPolilinea(geojson);
  let km = 0;
  for (let i = 1; i < p.length; i++) km += haversineKm(p[i - 1], p[i]);
  return km;
}

// % de sombra según los tramos del geojson (por largo)
function sombraPct(geojson) {
  let total = 0;
  let sombra = 0;
  (geojson?.features || []).forEach((f) => {
    if (f.geometry?.type !== "LineString") return;
    const pts = f.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
    let km = 0;
    for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);
    total += km;
    if (f.properties?.sombra === "alta") sombra += km;
  });
  return total ? Math.round((sombra / total) * 100) : 0;
}

export default function RutaActiva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const c = useCarrera();
  const contexto = useContexto();
  const { gpsSimulado, setGpsSimulado, uv, temperatura } = contexto;

  const ruta = obtenerRuta(id);
  const items = checklistTemporal(contexto);
  const [marcados, setMarcados] = useState({});
  const [aviso, setAviso] = useState("");

  const distanciaKm = ruta.distancia_km ?? largoKm(ruta.geojson);
  const sombra = ruta.sombra_pct ?? sombraPct(ruta.geojson);
  const minutos = Math.round(distanciaKm * 6); // ritmo base 6:00 min/km
  const desnivel = ruta.desnivel_m ?? 0;
  const listos = items.filter((i) => marcados[i.id]).length;

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

    // GPS real: verifica que haya una posición antes de iniciar
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
    <div className="p-4 space-y-4 text-white">
      {/* Tarjeta del circuito */}
      <div className="bg-tarjeta rounded-xl p-4 space-y-3">
        <p className="text-menta text-xs font-bold">CIRCUITO ACTIVO</p>
        <h2 className="text-2xl font-titulos">{ruta.nombre}</h2>
        {ruta.descripcion && <p className="text-suave text-sm">{ruta.descripcion}</p>}
        <div className="grid grid-cols-2 gap-3 font-datos text-sm">
          <p><span className="text-suave">Distancia </span>{distanciaKm.toFixed(1)} km</p>
          <p><span className="text-suave">Desnivel </span>+{desnivel} m</p>
          <p><span className="text-suave">Sombra </span>{sombra}%</p>
          <p><span className="text-suave">Tiempo est. </span>{minutos} min</p>
        </div>
        <p className="text-suave text-xs">
          {Math.round(temperatura)} °C / UV {uv}
        </p>
      </div>

      {/* Mapa */}
      <MapaRuta geojson={ruta.geojson} altura={220} />

      {/* Checklist */}
      <div className="bg-tarjeta rounded-xl p-4 space-y-2">
        <div className="flex justify-between">
          <p className="font-bold">EQUIPO SUGERIDO</p>
          <p className="text-lima font-datos">{listos}/{items.length} LISTO</p>
        </div>
        {items.map((i) => (
          <label key={i.id} className="flex items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={!!marcados[i.id]}
              onChange={() => setMarcados((m) => ({ ...m, [i.id]: !m[i.id] }))}
              className="w-5 h-5"
            />
            <span className={i.obligatorio ? "text-peligro" : ""}>
              {i.nombre}
              {i.obligatorio && <b className="ml-2 text-xs">Obligatorio</b>}
            </span>
          </label>
        ))}
      </div>

      {aviso && <p className="bg-peligro/20 text-peligro rounded-xl p-3">{aviso}</p>}

      <button
        className="w-full bg-tarjeta py-2 rounded-xl text-sm"
        onClick={() => setGpsSimulado(!gpsSimulado)}
      >
        GPS simulado: {gpsSimulado ? "SÍ" : "NO"} (tocar para cambiar)
      </button>

      <button className="w-full bg-menta text-fondo font-bold py-4 rounded-xl" onClick={iniciarCarrera}>
        Iniciar Carrera
        <span className="block text-xs font-normal">Todo listo: GPS y frecuencia cardíaca sincronizados</span>
      </button>
    </div>
  );
}