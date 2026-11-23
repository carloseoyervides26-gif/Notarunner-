# Cómo dibujar una ruta (circuito)

1. Abre https://geojson.io y busca el parque en el mapa (lupa de la izquierda).
2. Elige la herramienta de **línea** (icono de línea en la barra derecha).
3. Da clic en el punto de salida y luego clic por clic alrededor del circuito, siguiendo el camino.
   Termina dando clic otra vez cerca del punto de salida y presiona **Enter**.
4. (Opcional) Si un tramo es **sin sombra**, dibújalo como una línea aparte, dale clic,
   y en la tabla agrega la propiedad `sombra` con el valor `baja`.
5. (Opcional) Agrega **marcadores** para fuentes de agua, baños o servicio médico:
   propiedad `tipo` = `agua`, `bano` o `medico`, y `nombre` = lo que quieras.
6. Menú **Save** > **GeoJSON**. Cambia el nombre del archivo por el id de la ruta
   y guárdalo en esta carpeta (`data/trazos/`).
7. En la terminal corre: `npm run rutas`. Revisa que los km dibujados se parezcan a los esperados.

## Nombres de archivo (id de cada ruta)

| Ruta | Nombre del archivo |
|---|---|
| Calzada del Valle | `calzada-del-valle.geojson` |
| Parque Lineal Escobedo | `parque-lineal-escobedo.geojson` |
| Parque Vista Pista Jacinto Díaz | `vista-pista-jacinto-diaz.geojson` |
| Parque Lineal Av. República Mexicana | `parque-lineal-republica-mexicana.geojson` |
| Parque Niños Héroes | `parque-ninos-heroes.geojson` |
| Parque Fundidora | `parque-fundidora.geojson` |
| Calzada San Pedro | `calzada-san-pedro.geojson` |
| Parque Río La Silla | `parque-rio-la-silla.geojson` |
