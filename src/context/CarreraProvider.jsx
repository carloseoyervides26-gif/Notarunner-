import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useContexto } from "./ContextoProvider";
import { crearGpsReal, crearGpsSimulado, extraerPolilinea, haversineKm } from "../services/gps";

const CarreraCtx = createContext(null);
export const useCarrera = () => useContext(CarreraCtx);

export default function CarreraProvider({ children }) {
  const { gpsSimulado } = useContexto();

  const [estado, setEstado] = useState("inactiva"); // inactiva|corriendo|pausada|terminada
  const [posicion, setPosicion] = useState(null);
  const [trayecto, setTrayecto] = useState([]);
  const [distanciaKm, setDistanciaKm] = useState(0);
  const [tiempoSeg, setTiempoSeg] = useState(0);
  const [ritmoActual, setRitmoActual] = useState(null); // seg por km
  const [precision, setPrecision] = useState(null);
  const [error, setError] = useState(null);
  const [avisoPantalla, setAvisoPantalla] = useState(null);

  const fuente = useRef(null);
  const estadoRef = useRef("inactiva");
  const ultimo = useRef(null);
  const ventana = useRef([]); // {t, km} para ritmo actual
  const kmRef = useRef(0);
  const wakeLock = useRef(null);

  const cambiarEstado = (e) => {
    estadoRef.current = e;
    setEstado(e);
  };

  // Cronómetro: solo cuenta si está corriendo
  useEffect(() => {
    const id = setInterval(() => {
      if (estadoRef.current === "corriendo") setTiempoSeg((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Pantalla encendida durante la carrera
  async function pedirPantalla() {
    if (!("wakeLock" in navigator)) {
      setAvisoPantalla("Pon el Auto-Bloqueo del iPhone en Nunca durante la carrera.");
      return;
    }
    try {
      wakeLock.current = await navigator.wakeLock.request("screen");
    } catch {
      setAvisoPantalla("Pon el Auto-Bloqueo del iPhone en Nunca durante la carrera.");
    }
  }

  function soltarPantalla() {
    wakeLock.current?.release?.();
    wakeLock.current = null;
  }

  // Si la app vuelve a primer plano, pide otra vez la pantalla encendida
  useEffect(() => {
    const f = () => {
      if (document.visibilityState === "visible" && estadoRef.current === "corriendo") {
        pedirPantalla();
      }
    };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, []);

  function alLlegarPunto(p) {
    if (estadoRef.current !== "corriendo") return;
    if (p.precision > 30) return; // punto malo
    const ant = ultimo.current;
    if (ant) {
      const km = haversineKm(ant, p);
      const seg = (p.t - ant.t) / 1000;
      if (seg > 0 && (km * 1000) / seg > 12) return; // salto imposible
      kmRef.current += km;
      setDistanciaKm(kmRef.current);
    }
    ultimo.current = p;
    setPosicion({ lat: p.lat, lng: p.lng });
    setPrecision(p.precision);
    setTrayecto((t) => [...t, { lat: p.lat, lng: p.lng }]);

    // Ritmo actual: últimos 45 s
    ventana.current.push({ t: p.t, km: kmRef.current });
    ventana.current = ventana.current.filter((x) => p.t - x.t <= 45000);
    const a = ventana.current[0];
    const dKm = kmRef.current - a.km;
    const dSeg = (p.t - a.t) / 1000;
    setRitmoActual(dKm > 0.005 && dSeg > 5 ? dSeg / dKm : null);
  }

  function arrancarFuente() {
    fuente.current.iniciar(alLlegarPunto, setError);
  }

  // geojsonRuta: opcional (necesario para el GPS simulado)
  function iniciar(geojsonRuta) {
    kmRef.current = 0;
    ultimo.current = null;
    ventana.current = [];
    setDistanciaKm(0);
    setTiempoSeg(0);
    setTrayecto([]);
    setRitmoActual(null);
    setError(null);
    setAvisoPantalla(null);
    fuente.current = gpsSimulado
      ? crearGpsSimulado(extraerPolilinea(geojsonRuta))
      : crearGpsReal();
    cambiarEstado("corriendo");
    arrancarFuente();
    pedirPantalla();
  }

  function pausar() {
    fuente.current?.detener();
    cambiarEstado("pausada");
    soltarPantalla();
  }

  function reanudar() {
    ultimo.current = null; // evita un "salto" al volver
    cambiarEstado("corriendo");
    arrancarFuente();
    pedirPantalla();
  }

  function finalizar() {
    fuente.current?.detener();
    cambiarEstado("terminada");
    soltarPantalla();
  }

  function reiniciar() {
    fuente.current?.detener();
    cambiarEstado("inactiva");
    setTrayecto([]);
    setDistanciaKm(0);
    setTiempoSeg(0);
    setPosicion(null);
    soltarPantalla();
  }

  // Solo útil con GPS simulado (botón x5)
  function setVelocidad(x) {
    fuente.current?.setMultiplicador?.(x);
  }

  const ritmoPromedio = distanciaKm > 0.01 ? tiempoSeg / distanciaKm : null;

  return (
    <CarreraCtx.Provider
      value={{
        estado, posicion, trayecto, distanciaKm, tiempoSeg,
        ritmoActual, ritmoPromedio, precision, error, avisoPantalla,
        iniciar, pausar, reanudar, finalizar, reiniciar, setVelocidad,
      }}
    >
      {children}
    </CarreraCtx.Provider>
  );
}