import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Estilos de mapa sin API key. Cambia STYLE_ACTIVO: "oscuro" | "claro" | "calles" | "osmOscuro"
const ESRI = "https://services.arcgisonline.com/ArcGIS/rest/services";
const ESTILOS = {
  oscuro: {
    url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    nativo: 16,
    attr: "Tiles &copy; Esri",
  },
  claro: {
    url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    nativo: 16,
    attr: "Tiles &copy; Esri",
  },
  calles: {
    url: `${ESRI}/World_Street_Map/MapServer/tile/{z}/{y}/{x}`,
    nativo: 19,
    attr: "Tiles &copy; Esri",
  },
  // Respaldo: OpenStreetMap normal pero oscurecido con un filtro CSS
  osmOscuro: {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    nativo: 19,
    attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    clase: "mapa-oscuro",
  },
};
const STYLE_ACTIVO = "oscuro";

const VERDE = "#3ddc97"; // sombra
const NARANJA = "#ff7a3d"; // sol directo

// Íconos propios (los de Leaflet se rompen con Vite)
const emoji = { agua: "💧", bano: "🚻", medico: "➕" };
function iconoPunto(tipo) {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:16px;background:#1a2027;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:2px solid #3ddc97;box-shadow:0 2px 6px rgba(0,0,0,.5)">${emoji[tipo] || "📍"}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
const iconoUsuario = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;background:#c6ff00;border:3px solid white;border-radius:50%;box-shadow:0 0 0 6px rgba(198,255,0,.25)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Mantiene el mapa centrado en el usuario
function Seguir({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.setView([posicion.lat, posicion.lng], map.getZoom());
  }, [posicion, map]);
  return null;
}

// Props: geojson de la ruta, posicion {lat,lng}, trayecto [{lat,lng}], altura, seguir
export default function MapaRuta({ geojson, posicion, trayecto = [], altura = 260, seguir = false }) {
  const estilo = ESTILOS[STYLE_ACTIVO];
  const features = geojson?.features || [];
  const lineas = features.filter((f) => f.geometry?.type === "LineString");
  const puntos = features.filter((f) => f.geometry?.type === "Point");

  const primero = lineas[0]?.geometry.coordinates[0];
  const centro = posicion
    ? [posicion.lat, posicion.lng]
    : primero
    ? [primero[1], primero[0]]
    : [25.6866, -100.3161]; // centro de Monterrey

  return (
    // isolation + zIndex 0: los z-index internos de Leaflet no tapan paneles ni ventanas
    <div
      style={{ height: altura, position: "relative", zIndex: 0, isolation: "isolate" }}
      className="rounded-xl overflow-hidden"
    >
      <style>{`.mapa-oscuro{filter:invert(1) hue-rotate(180deg) brightness(.9) contrast(.9) saturate(.6)}`}</style>
      <MapContainer
        center={centro}
        zoom={16}
        zoomControl={false} // sin botones +/-: más limpio (zoom con los dedos)
        style={{ height: "100%", width: "100%", background: "#0e1317" }}
      >
        <TileLayer
          attribution={estilo.attr}
          url={estilo.url}
          maxNativeZoom={estilo.nativo}
          maxZoom={19}
          className={estilo.clase || ""}
        />

        {/* Borde oscuro debajo para que la ruta resalte */}
        {lineas.map((f, i) => (
          <Polyline
            key={`b${i}`}
            positions={f.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
            pathOptions={{ color: "#000000", weight: 9, opacity: 0.35 }}
          />
        ))}
        {lineas.map((f, i) => (
          <Polyline
            key={i}
            positions={f.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
            pathOptions={{
              color: f.properties?.sombra === "baja" ? NARANJA : VERDE,
              weight: 6,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}

        {puntos.map((f, i) => (
          <Marker
            key={i}
            position={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            icon={iconoPunto(f.properties?.tipo)}
          >
            <Popup>{f.properties?.nombre || f.properties?.tipo}</Popup>
          </Marker>
        ))}

        {trayecto.length > 1 && (
          <Polyline
            positions={trayecto.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#ffffff", weight: 3, opacity: 0.9 }}
          />
        )}

        {posicion && <Marker position={[posicion.lat, posicion.lng]} icon={iconoUsuario} />}
        {seguir && <Seguir posicion={posicion} />}
      </MapContainer>
    </div>
  );
}