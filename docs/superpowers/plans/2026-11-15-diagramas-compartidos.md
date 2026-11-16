# Diagramas económicos compartidos

**Objetivo:** Aprendizaje, Modelos y Política deben usar el aspecto y comportamiento del Laboratorio, adaptando ejes, unidades y etapas a cada teoría.

**Diseño:** compartir `drawDiagram` y su animación declarativa; tarjetas con escalas legibles, leyenda, guías, curvas coincidentes, controles de etapas y ampliación accesible. Las actualizaciones `input` conservan el nodo del slider y del canvas. OA–DA conserva corto/medio plazo; oferta-demanda y comercio comparan base/final sin inventar etapas. Phillips y Solow siguen identificados como esquemas conceptuales. La distribución de bienestar usa barras, no curvas de equilibrio.

**Archivos:** `economic-diagrams.js` (animación, tarjeta, observadores y diálogo), `economic-diagram-specs.js` (adaptadores económicos), `charts.js` (trazos no lineales y barras), adaptaciones de `islm-lab.js`, `experiences.js`, `policy.js`, estilos compartidos y pruebas. Motores económicos intactos. Scripts clásicos, `defer`, `file://`, sin dependencias nuevas.

## Ejecución

1. Regresión: renderer compartido, cambio durante `input`, identidad de controles, zoom/foco, geometría, móvil/temas y reduced-motion.
2. Extraer animación/etapas sin cambiar resultados del Laboratorio e implementar tarjetas/zoom comunes.
3. Sustituir SVG independientes por especificaciones del mismo renderer y vincular controles en vivo.
4. Verificar motores, suite completa, capturas, CI, preview y producción; documentar límites.

Referencias conceptuales para los esquemas: [MIT — Solow](https://ocw.mit.edu/courses/14-452-economic-growth-fall-2016/2b68057aa4e74410d00ae89a0c49752f_MIT14_452F16_Lec2and3.pdf) y [Banco de España — Phillips](https://www.bde.es/wbe/en/areas-actuacion/politica-monetaria/preguntas-frecuentes/politica-monetaria-y-estabilidad-precios/que-es-la-curva-de-phillips.html). Sus relaciones se representan sin estimación empírica ni simulación dinámica nueva.
