import * as db from "./db";

// Usa la función real de db.js si existe; si no, guarda en localStorage (temporal)
const real = (nombre) => (typeof db[nombre] === "function" ? db[nombre] : null);

function leer(clave) {
  try {
    return JSON.parse(localStorage.getItem(clave)) || [];
  } catch {
    return [];
  }
}
function agregar(clave, item) {
  const lista = leer(clave);
  lista.push({ ...item, id: "local-" + Date.now() });
  localStorage.setItem(clave, JSON.stringify(lista));
}

export async function guardarCarreraSeguro(datos) {
  const f = real("guardarCarrera");
  if (f) return f(datos);
  agregar("p4_carreras", datos);
}

export async function publicarRutaSeguro(datos) {
  const f = real("publicarRuta");
  if (f) return f(datos);
  agregar("p4_rutas_publicadas", datos);
}