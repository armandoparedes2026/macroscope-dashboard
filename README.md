# MacroScope — Laboratorio Interactivo de Economía Aplicada

Plataforma interactiva para aprender, explorar, comparar y simular economía aplicada. Integra **siete experiencias completas** conectadas desde la portada orbital de 7 tarjetas, estadísticas oficiales verificadas (**Banco Mundial WDI** y **BCRP**), el **Observatorio del Perú**, la **Biblioteca de fuentes** y cinco modelos económicos con separación explícita entre evidencia empírica observada y simulación teórica.

## Abrir el proyecto

Abre [`index.html`](index.html) en un navegador moderno. No requiere un proceso de compilación ni servidor de aplicaciones (`file://` totalmente soportado mediante scripts clásicos con `defer`). Para publicar el sitio en alojamiento estático o Vercel, `index.html` actúa directamente como punto de entrada.

## Las Siete Experiencias de MacroScope y Secciones Transversales

| # | Experiencia / Sección | Ruta principal | Rutas compatibles | Descripción |
|---|---|---|---|---|
| 00 | **Portada orbital** | `#inicio` | — | Escenario 3D interactivo con las 7 tarjetas orbitales, rueda, teclado y arrastre táctil/mouse. |
| 01 | **Aprendizaje guiado** | `#aprendizaje` | — | Rutas pedagógicas por lecciones, niveles (introductorio, intermedio, avanzado), simulador embebido, predicción calificada con el motor IS–LM–BP y progreso persistente en `localStorage`. |
| 02 | **Análisis histórico** | `#historico` | — | Series de tiempo largas (WDI y BCRP), comparación de subperiodos A/B, variaciones, índice base 100, media móvil de 3 periodos, hitos documentados y exportación CSV con procedencia. |
| 03 | **Indicadores macroeconómicos** | `#indicadores` | — | Catálogo categorizado en 7 áreas temáticas, buscador por código/concepto, fichas analíticas con definición, fórmula, gráfico ampliable y distinción explícita entre series oficiales (WDI/BCRP) y fichas demostrativas. |
| 04 | **Exploración macroeconómica** | `#exploracion` | `#panorama` | Tablero ejecutivo e interactivo con 8 KPIs oficiales, evolución del PBI (nivel 2015=100 y variación %), inflación, lectura económica y matriz de trazabilidad API. |
| 05 | **Comparación de economías** | `#comparacion` | — | Contraste simultáneo de hasta 4 economías con datos anuales WDI, modo indicadores/ranking/regiones, mapa interactivo MapLibre + respaldo SVG Natural Earth, dispersión crecimiento-inflación, mercado laboral y exportación CSV. |
| 06 | **Simulación de escenarios** | `#simulacion` | `#laboratorio` | Laboratorio **IS–LM–BP / Mundell–Fleming** en 4 mercados enlazados, regímenes cambiarios, movilidad de capital, trilema de Mundell, comparación A/B y guardado local de escenarios. |
| 07 | **Modelos y tendencias** | `#modelos` | — | Biblioteca visual de 5 modelos: **IS–LM–BP**, **Oferta y Demanda Agregada (OA–DA)** y **Oferta y Demanda microeconómica** con motores matemáticos puros, más esquemas conceptuales de **Curva de Phillips** y **Crecimiento de Solow–Swan**, contrastados con tendencias empíricas WDI. |
| PE | **Observatorio del Perú** | `#observatorio` | — | Seguimiento macroeconómico nacional especializado con series oficiales del BCRP e INEI/OIT (inflación y rango meta 1%–3%, tasa de referencia, RIN, tipo de cambio, PBI trimestral y calendario de publicaciones). |
| DB | **Biblioteca de fuentes** | `#fuentes` | — | Directorio académico filtrable por curso, alcance y tipo de acceso, con **Ficha de la fuente** lateral, colecciones rápidas y citación APA 7 verificada. |
| ? | **Ayuda y glosario** | `#ayuda` | — | Guía de uso paso a paso, glosario económico interactivo con búsqueda instantánea y preguntas frecuentes metodológicas. |

El mapeo detallado de las siete referencias visuales de `docs/ux/referencias/1.png` … `7.png` está documentado en [`docs/ux/referencias/MAPEO-REFERENCIAS.md`](docs/ux/referencias/MAPEO-REFERENCIAS.md).

## Simulador IS–LM–BP / Mundell–Fleming y Biblioteca de Modelos

La experiencia **Simulación de escenarios** (`#simulacion` / `#laboratorio`) explica cómo se ajusta una economía a corto plazo, con precios fijos, ante decisiones de política y shocks externos en **cuatro diagramas enlazados**:

1. **IS–LM–BP** en $(Y, i)$: equilibrio de bienes, dinero y balanza de pagos.
2. **Mundell–Fleming** en $(Y, e)$: $IS^*$ y $LM^*$ (o LM–BP con movilidad imperfecta, y $\bar{e}$ con tipo de cambio fijo).
3. **Mercado de dinero** en $(M/P, i)$: demanda $L(Y, i)$ y oferta $M^s/P$.
4. **Cruz keynesiana** en $(Y, DA)$: demanda agregada y recta de 45°.

En **Modelos y tendencias** (`#modelos`), además del modelo IS–LM–BP, se incorporan dos motores matemáticos puros adicionales en [`js/services/models-engine.js`](js/services/models-engine.js):

- **Oferta y Demanda Agregada (OA–DA)**: resuelve el equilibrio de corto plazo ($E_1$, con expectativas de precios predeterminadas) y de medio plazo ($E_2$, con convergencia al producto potencial $Y_n$ y ajuste de expectativas $P^e = P$).
- **Oferta y Demanda de Mercado**: resuelve cantidad y precio de equilibrio ($Q^*, P_d, P_s$), excedente del consumidor, excedente del productor, recaudación tributaria e ineficiencia (pérdida irrecuperable de bienestar) ante desplazamientos e impuestos por unidad.
- **Curva de Phillips** y **Modelo de Solow–Swan**: se presentan honestamente con la insignia **Esquema conceptual**, mostrando sus ecuaciones estructurales, supuestos y desplazamientos geométricos sin fingir estimaciones econométricas no verificadas.

## Fuentes, integridad de datos y limitaciones

- **Banco Mundial (World Development Indicators)**: `https://api.worldbank.org/v2/`
- **BCRP (BCRPData API y series oficiales)**: `https://estadisticas.bcrp.gob.pe/estadisticas/series/ayuda/api`
- **Tipos de cambio indicativos**: `https://open.er-api.com/v6/latest/USD`
- **Cartografía**: [OpenFreeMap](https://openfreemap.org/) + [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) con respaldo vectorial local de [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) (`data/geo/ne_110m_admin_0_countries.geojson`).

Reglas estrictas de integridad estadística:
- **Preservación de nulos**: ningún dato ausente (`null` o `n.d.`) se convierte jamás a `0` ni se interpola linealmente en gráficos, tablas, promedios móviles o cadenas de crecimiento acumulado.
- **Trazabilidad por observación**: cada celda e indicador distingue entre consulta en vivo (`API en línea`), `respaldo local` verificado con fecha de extracción y `Demostrativo · No oficial` (en fichas metodológicas de referencia).
- **Alcance geográfico en el Observatorio del Perú**: todas las series corresponden al agregado nacional o Lima Metropolitana según definición oficial del BCRP/INEI; no se extrapolan ni inventan cifras departamentales.

## Estructura del proyecto

```text
macroscope-dashboard/
├── index.html                          # Punto de entrada (< 500 líneas) con las 7 experiencias y guardia de tema
├── css/
│   ├── tokens.css                      # Sistema de diseño armonizado (Blanco frío / Azul hielo / Cobalto / Azul marino)
│   ├── base.css                        # Reset, tipografía y accesibilidad (:focus-visible)
│   ├── layout.css                      # Topbar, navegación y contenedores adaptables
│   ├── components.css                  # Tarjetas, tablas, controles e inspector
│   ├── islm.css                        # Laboratorio IS–LM–BP de 4 paneles
│   ├── students.css                    # Directorio de fuentes y glosario de ayuda
│   ├── landing.css                     # Portada orbital de 7 tarjetas e ilustraciones SVG 3D
│   ├── panorama.css                    # Módulo 04: Exploración macroeconómica (Panorama)
│   ├── comparison.css                  # Módulo 05: Comparación de economías
│   └── experiences.css                 # Módulos 01, 02, 03, 07, Observatorio del Perú y Ficha de la fuente
├── js/
│   ├── islm-model.js                   # Motor matemático puro IS–LM–BP / Mundell–Fleming
│   ├── lab-content.js                  # Escenarios guiados, calificador de predicciones y glosario
│   ├── config/                         # countries.js, indicators.js, state.js
│   ├── data/                           # fallback-wdi.js, sources-catalog.js
│   ├── services/
│   │   ├── wdi.js                      # Cliente WDI con paginación, caché y preservación de null
│   │   ├── bcrp-client.js              # Normalizador de series BCRP
│   │   ├── panorama-data.js            # Cálculos de Panorama (PBI 2015=100, balanza 12M)
│   │   ├── panorama-client.js          # Cliente BCRP para Panorama
│   │   ├── compare.js                  # Transformaciones puras de comparación (base 100, acumulado, PPA)
│   │   ├── comparison-dashboard-data.js# Constructor de ranking, lecturas y tabla comparativa
│   │   ├── comparison-map-data.js      # Polígonos ISO3 y escalas de color del mapa
│   │   ├── fx.js                       # Tipos de cambio referenciales
│   │   └── models-engine.js            # Motores OA–DA, Oferta-Demanda, análisis histórico y catálogo de indicadores
│   ├── ui/
│   │   ├── format.js, charts.js, overview.js, panorama-premium.js
│   │   ├── islm-lab.js, comparison-dashboard.js, student-views.js
│   │   ├── experiences.js              # Controladores UI de las 7 experiencias y Observatorio del Perú
│   │   └── landing.js                  # Carrusel orbital 3D de la portada
│   └── app.js                          # Arranque e integración de todas las vistas
├── api/bcrp.js                         # Función serverless proxy para BCRPData en Vercel
├── tests/                              # Suite smoke, 10 suites unitarias (72 tests) y suite E2E Playwright
└── docs/
    ├── arquitectura.md                 # Arquitectura, orden de carga y pureza de módulos
    ├── INFORME-HARMONIA-FINAL.md       # Informe ejecutivo, matriz de las 7 experiencias y auditoría
    └── ux/referencias/                 # Referencias visuales 1.png...7.png y MAPEO-REFERENCIAS.md
```

## Pruebas

En Windows PowerShell con ejecución de scripts restringida, utiliza `npm.cmd`:

```bash
npm.cmd run test:smoke   # Verifica sintaxis JS, 34 IDs, referencias bidireccionales, SRI y < 500 líneas en index.html
npm.cmd run test:unit    # Ejecuta 72 pruebas unitarias en Node (IS-LM-BP, OA-DA, Micro SD, Histórico, WDI, BCRP, Comparador, Fuentes)
npm.cmd run test:e2e     # Ejecuta la suite integral Playwright en Chromium (offline/fixtures, 7 experiencias, A1-A13, capturas)
npm.cmd test             # Ejecuta smoke + unit + e2e en secuencia
```
