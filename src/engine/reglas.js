// Todos los umbrales del motor adaptativo, en un solo lugar.
// Si cambias un número, cámbialo también en la tabla del documento
// del Programa adaptativo y cita la fuente que lo respalda.

// Sensación térmica en °C
export const SENSACION = {
  MODERADO: 30, // desde aquí: nivel 1
  FUERTE: 35, // desde aquí: nivel 2
  EXTREMO: 40, // desde aquí: nivel 3
}

// Índice UV
export const UV = {
  ALTO: 6, // desde aquí: nivel 1
  MUY_ALTO: 8, // desde aquí: nivel 2 y bloqueador obligatorio
  EXTREMO: 11, // desde aquí: nivel 3
}

// Calidad del aire (AQI de Estados Unidos)
export const AQI = {
  SENSIBLES: 100, // más de 100: nivel 1
  DANINO: 150, // más de 150: nivel 3
}

// Textos y color de cada nivel de riesgo
export const NIVELES = {
  0: { etiqueta: 'CONDICIONES FAVORABLES', mensaje: 'Buen momento para correr', color: 'menta' },
  1: { etiqueta: 'CALOR MODERADO', mensaje: 'Hidratación recomendada', color: 'lima' },
  2: { etiqueta: 'CALOR FUERTE', mensaje: 'Hidratación obligatoria', color: 'peligro' },
  3: { etiqueta: 'CALOR EXTREMO', mensaje: 'Se recomienda no correr al aire libre', color: 'peligro' },
}

// Avisos de calidad del aire
export const AVISOS_AIRE = {
  sensibles: 'Baja la intensidad, el aire es dañino para personas sensibles',
  danino: 'No se recomienda correr al aire libre',
}

// Horas que usa calcularMejorHora
export const MEJOR_HORA = {
  INICIO_DIA: 5, // no considera horas antes de las 5:00
  FIN_MANANA: 10, // la ventana de la mañana se busca entre 5:00 y 10:00
  FIN_DIA: 22, // no considera horas después de las 22:00
  DESDE_TARDE: 17, // a partir de aquí busca "después de las..."
  UMBRAL_TARDE: 36, // puntaje máximo para considerar que ya bajó el calor
}

// Alerta en carrera y ruta alterna (se usan más adelante)
export const ALERTA_METROS = 200
export const RUTA_ALTERNA = {
  RADIO_KM: 5,
  DIFERENCIA_DISTANCIA_KM: 1,
  SOMBRA_EXTRA_PCT: 10,
  FACTOR_AHORRO: 0.06,
}