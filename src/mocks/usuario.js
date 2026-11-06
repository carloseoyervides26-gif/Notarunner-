// Usuario y carreras falsas para desarrollar Perfil.
// Misma forma que devolverán useAuth() y db.js.

export const usuarioMock = {
  usuario: { id: 'usuario-1', email: 'jimena@correo.com' },
  perfil: {
    id: 'usuario-1',
    nombre: 'Jimena Morales',
    ciudad: 'Monterrey, Nuevo León',
    foto_url: null, // si es null, mostrar las iniciales o un ícono
  },
};

// Ayudante: fecha ISO de hace N días a cierta hora (así "Ayer" siempre funciona)
const hace = (dias, hora, minutos = 0) => {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  f.setHours(hora, minutos, 0, 0);
  return f.toISOString();
};

// Carreras guardadas (para "Mi historial")
// ritmo_prom_seg = segundos por km. Ejemplo: 329 = 5'29" /km
export const carrerasMock = [
  {
    id: 'carrera-1',
    user_id: 'usuario-1',
    ruta_nombre: 'Parque Fundidora',
    fecha: hace(1, 7, 0),
    distancia_km: 5.1,
    tiempo_seg: 1690, // 28:10 min
    ritmo_prom_seg: 329,
  },
  {
    id: 'carrera-2',
    user_id: 'usuario-1',
    ruta_nombre: 'Calzada San Pedro',
    fecha: hace(5, 7, 30),
    distancia_km: 3.0,
    tiempo_seg: 1080, // 18:00 min
    ritmo_prom_seg: 360,
  },
  {
    id: 'carrera-3',
    user_id: 'usuario-1',
    ruta_nombre: 'Parque Río La Silla',
    fecha: hace(12, 6, 45),
    distancia_km: 10.2,
    tiempo_seg: 3420, // 57:00 min
    ritmo_prom_seg: 335,
  },
];
