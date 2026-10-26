# Macroscope — mapa internacional interactivo

## Alcance aprobado

Sustituir el croquis SVG del módulo `#comparacion` por un mapa geográfico real, manteniendo la misma estética y sin fusionar el PR #7 a `main`.

- Mapa vectorial MapLibre GL JS, teselas de OpenFreeMap sin clave API.
- Estilos claros/oscuros de OpenFreeMap, adaptados a los tonos de Macroscope.
- Selección máxima de cuatro países y marcadores con color, valor, año y fuente WDI.
- Polígonos oficiales de Natural Earth, coloreados proporcionalmente al valor del indicador común, con ausencia de datos expresada como ausencia.
- Zoom y desplazamiento accesibles; enfocar automáticamente las economías seleccionadas cuando cambien.
- Leyenda de magnitud comparada y atribución cartográfica visibles.
- Compatibilidad móvil y con movimiento reducido.
- Conservar SVG existente como modo de respaldo sin conexión, sin WebGL o si falla la carga del estilo.

## Fuentes

- OpenFreeMap: `https://openfreemap.org/quick_start/`; términos: `https://openfreemap.org/tos/`.
- MapLibre GL JS v5 UMD, versión fija 5.12.0: `https://maplibre.org/maplibre-gl-js/docs/`.
- Natural Earth GeoJSON 1:110m de `nvkelso/natural-earth-vector` (dominio público): `https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson`.
- Valores económicos existentes WDI, con fuente y fecha de respaldo preservadas.

## Verificación

1. Unitarias: polígonos por ISO3, nulos conservados, escala válida para valores negativos y constantes.
2. E2E sin conexión: se mantiene el croquis de respaldo, sin errores de página.
3. E2E cartográfico con motor disponible: marcador, país, tooltip/fuente, cambios de indicador, país y tema.
4. 360/390/768/1440px, claro/oscuro, sin desbordamientos y con atribución.
5. `npm test` completo y Vercel preview en commit nuevo, sin publicar producción.
