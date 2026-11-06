import tramosCalles from "./tramosCalles.json";

// Rutas falsas para probar (Persona 4). Misma forma que el CONTRATO 3.
export const rutaCarreraFalsa = {
  id: "demo",
  nombre: "Ruta de prueba",
  descripcion: "Circuito corto con un tramo sin sombra.",
  desnivel_m: 12,
  sombra_pct: 25,
  lat_inicio: 25.6866,
  lng_inicio: -100.3161,
  geojson: {
    type: "FeatureCollection",
    features: [
      ...tramosCalles, // tramos que siguen las calles (los genera ajustarCalles.mjs)
      { type: "Feature", properties: { tipo: "agua", nombre: "Fuente 1" },
        geometry: { type: "Point", coordinates: [-100.314, 25.688] } },
      { type: "Feature", properties: { tipo: "medico", nombre: "Servicio médico" },
        geometry: { type: "Point", coordinates: [-100.306, 25.6925] } },
    ],
  },
};

export const rutaAlternaFalsa = {
  id: "demo-sombra",
  nombre: "Ruta con sombra",
  descripcion: "Parque con árboles, ideal para días de mucho calor.",
  distancia_km: 1.8,
  desnivel_m: 5,
  sombra_pct: 80,
  lat_inicio: 25.687,
  lng_inicio: -100.317,
  geojson: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { sombra: "alta" },
        geometry: { type: "LineString", coordinates: [[-100.317, 25.687], [-100.3125, 25.6895], [-100.308, 25.6915]] } },
      { type: "Feature", properties: { tipo: "agua", nombre: "Bebedero" },
        geometry: { type: "Point", coordinates: [-100.3125, 25.6895] } },
    ],
  },
};

export const rutasFalsas = [rutaCarreraFalsa, rutaAlternaFalsa];

// Busca una ruta por id; si no existe, devuelve la primera
export function buscarRuta(id) {
  return rutasFalsas.find((r) => r.id === id) || rutasFalsas[0];
}