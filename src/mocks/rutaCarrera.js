// Ruta falsa para probar la carrera (Persona 4). Misma forma que el CONTRATO 3.
export const rutaCarreraFalsa = {
  id: "demo",
  nombre: "Ruta de prueba",
  geojson: {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { sombra: "alta" },
        geometry: { type: "LineString", coordinates: [[-100.3161, 25.6866], [-100.313, 25.6885]] } },
      { type: "Feature", properties: { sombra: "baja" },
        geometry: { type: "LineString", coordinates: [[-100.313, 25.6885], [-100.305, 25.693]] } },
      { type: "Feature", properties: { tipo: "agua", nombre: "Fuente 1" },
        geometry: { type: "Point", coordinates: [-100.314, 25.688] } },
      { type: "Feature", properties: { tipo: "medico", nombre: "Servicio médico" },
        geometry: { type: "Point", coordinates: [-100.306, 25.6925] } },
    ],
  },
};