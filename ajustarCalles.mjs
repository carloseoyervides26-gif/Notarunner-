// Convierte puntos sueltos en un recorrido que sigue las calles (a pie)
// Uso: node ajustarCalles.mjs
import { writeFileSync } from "node:fs";

// Tramos de la ruta: [lng, lat] (OJO: primero longitud)
const tramos = [
  { sombra: "alta", puntos: [[-100.3161, 25.6866], [-100.313, 25.6885]] },
  { sombra: "baja", puntos: [[-100.313, 25.6885], [-100.305, 25.693]] },
];

async function porCalles(puntos) {
  const coords = puntos.map((p) => p.join(",")).join(";");
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${coords}?overview=full&geometries=geojson`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("Error del servicio: " + r.status);
  const j = await r.json();
  if (!j.routes?.length) throw new Error("No encontró ruta entre esos puntos");
  return j.routes[0].geometry.coordinates;
}

const features = [];
for (const t of tramos) {
  const coordinates = await porCalles(t.puntos);
  features.push({
    type: "Feature",
    properties: { sombra: t.sombra },
    geometry: { type: "LineString", coordinates },
  });
}

writeFileSync("src/mocks/tramosCalles.json", JSON.stringify(features));
console.log("Listo:", features.map((f) => f.geometry.coordinates.length + " puntos").join(", "));