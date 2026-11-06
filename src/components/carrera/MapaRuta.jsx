import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const VERDE = "#3ddc97"; // sombra
const NARANJA = "#ff7a3d"; // sol directo

// Íconos propios (los de Leaflet se rompen con Vite)
const emoji = { agua: "💧", bano: "🚻", medico: "➕" };
function iconoPunto(tipo) {
  return L.divIcon({
    className: "",
    html: `<div style="font-size:20px;background:#1a2027;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border:2px solid #3ddc97">${emoji[tipo] || "📍"}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}
const iconoUsuario = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;background:#c6ff00;border:3px solid white;border-radius:50%"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// Mantiene el mapa centrado en el usuario
function Seguir({ posicion }) {
  const map = useMap();
  useEffect(() => {
    if (posicion) map.setView([posicion.lat, posicion.lng], map.getZoom());
  }, [posicion, map]);
  return null;
}

// Props: geojson de la ruta, posicion {lat,lng}, trayecto [{lat,lng}], altura
export default function MapaRuta({ geojson, posicion, trayecto = [], altura = 260, seguir = false }) {
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
    <div style={{ height: altura }} className="rounded-xl overflow-hidden">
      <MapContainer center={centro} zoom={15} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {lineas.map((f, i) => (
          <Polyline
            key={i}
            positions={f.geometry.coordinates.map(([lng, lat]) => [lat, lng])}
            pathOptions={{
              color: f.properties?.sombra === "baja" ? NARANJA : VERDE,
              weight: 5,
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
          <Polyline positions={trayecto.map((p) => [p.lat, p.lng])} pathOptions={{ color: "#ffffff", weight: 3 }} />
        )}

        {posicion && <Marker position={[posicion.lat, posicion.lng]} icon={iconoUsuario} />}
        {seguir && <Seguir posicion={posicion} />}
      </MapContainer>
    </div>
  );
}