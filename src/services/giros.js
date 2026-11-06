import { extraerPolilinea, haversineKm } from "./gps";

// Rumbo (0-360°) de un punto a otro
function rumbo(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat));
  const x =
    Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) -
    Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// Devuelve { texto, metros } con la indicación para el siguiente punto de la ruta
export function instruccionGiro(posicion, geojson) {
  const p = extraerPolilinea(geojson);
  if (!posicion || p.length < 2) return null;

  // Punto de la ruta más cercano al usuario
  let idx = 0;
  let min = Infinity;
  p.forEach((q, i) => {
    const d = haversineKm(posicion, q);
    if (d < min) { min = d; idx = i; }
  });

  const sig = Math.min(idx + 1, p.length - 1);
  const metros = Math.round(haversineKm(posicion, p[sig]) * 1000);
  if (sig >= p.length - 1) return { texto: "LLEGADA AL FINAL DE LA RUTA", metros };

  // Cambio de dirección en el siguiente punto
  const delta = ((rumbo(p[sig], p[sig + 1]) - rumbo(p[idx], p[sig]) + 540) % 360) - 180;
  if (Math.abs(delta) < 25) return { texto: "SIGUE EN LÍNEA RECTA", metros };
  return { texto: delta > 0 ? "GIRO A LA DERECHA" : "GIRO A LA IZQUIERDA", metros };
}