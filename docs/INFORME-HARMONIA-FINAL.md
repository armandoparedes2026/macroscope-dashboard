# INFORME TÉCNICO FINAL — MACROSCOPE: ARMONIZACIÓN VISUAL Y CONSTRUCCIÓN DE LAS SIETE EXPERIENCIAS

- **Repositorio**: `Macroscope` (`cristivenog88-prog/macroscope-dashboard`)
- **Rama de trabajo**: `cristivenog88-prog/harmonia-final`
- **Commit base inicial**: `7db6f4721c74eb3c96d31cf47e89f9d722a2462c`
- **Estado probado y capturado**: `21 files changed, 4798 insertions(+), 402 deletions(-)` sobre `7db6f4721c74eb3c96d31cf47e89f9d722a2462c`
- **Trabajador de implementación**: `ARGON` (`gemini-4-argon`)

---

## 1. Resumen Ejecutivo

Se completó el rediseño integral, la armonización cromática/tipográfica y la implementación funcional de las **siete experiencias** de **MacroScope — Laboratorio Interactivo de Economía Aplicada**, junto con las secciones transversales (**Observatorio del Perú**, **Biblioteca de Fuentes con Ficha Académica** y **Ayuda y Glosario**):

1. **Unificación Visual y Sistema de Diseño**: Se consolidó en `css/tokens.css` y `css/experiences.css` una paleta institucional coherente basada en las referencias visuales (`docs/ux/referencias/1.png` a `7.png`): superficies en blanco frío y azul hielo translúcido (`#f3f7fe`, `#eaf2fd`) en modo claro, y azul marino profundo (`#081326`, `#0f1f3a`) en modo oscuro, con acentos azul cobalto (`#1d63e8`, `#569dff`), tipografía jerárquica (`Plus Jakarta Sans`, `DM Sans`, `IBM Plex Mono`) y contraste conforme a WCAG 2.1 AA.
2. **Construcción Funcional de las Siete Experiencias**: Se implementó el motor analítico y matemático `js/services/models-engine.js` y la capa de interfaz `js/ui/experiences.js` para dotar de funcionalidad real a las cuatro experiencias que carecían de vista dedicada (`#aprendizaje`, `#historico`, `#indicadores`, `#modelos`), integrar las tres existentes (`#exploracion`/`#panorama`, `#comparacion`, `#simulacion`/`#laboratorio`) con guardado de escenarios en `localStorage`, y construir el **Observatorio del Perú** (`#observatorio`) y la **Ficha de la Fuente** (`#fuentes`).
3. **Rigor Estadístico y Verificación Automatizada**: Se mantuvo intacta la arquitectura sin bundler (`defer` scripts sobre `globalThis.MacroScope`, operable en `http://` y `file://`), se preservaron estrictamente los valores `null` sin interpolación ni conversión a `0`, se distinguió explícitamente entre datos oficiales verificados (Banco Mundial WDI y BCRPData) y series demostrativas etiquetadas (`DEMO`), y se verificó el sistema completo con `test:smoke`, **72 pruebas unitarias** (`test:unit`) y la suite integral de extremo a extremo en Playwright (`test:e2e`) en resoluciones de escritorio, tableta y móvil (`1920px`, `1440px`, `1280px`, `1024px`, `768px`, `390px`, `360px`) en modos claro y oscuro.

---

## 2. Mapeo de Referencias Visuales (`docs/ux/referencias/1.png` ... `7.png`)

Las siete imágenes de referencia ubicadas en `docs/ux/referencias/` se preservaron sin renombrar y se documentaron en `docs/ux/referencias/MAPEO-REFERENCIAS.md`:

| Archivo original | Rol visual identificado | Módulo / Ruta en MacroScope |
| :--- | :--- | :--- |
| `docs/ux/referencias/1.png` | Portada orbital con las 7 tarjetas numeradas (`01` a `07`) en arco sobre el globo holográfico | `#inicio` (`[data-view="inicio"]`) |
| `docs/ux/referencias/2.png` | **04 · Exploración de Datos** — Panorama Económico Mundial y del Perú (8 tarjetas KPI, evolución histórica, distribución regional e histograma) | `#exploracion` y `#panorama` (`#tab-overview`) |
| `docs/ux/referencias/3.png` | **05 · Comparación Internacional** — Mapa coroplético interactivo, evolución multi-país, brecha vs. EE. UU., ranking y matriz | `#comparacion` (`#tab-comparison`) |
| `docs/ux/referencias/4.png` | **Observatorio del Perú** — Panel macroeconómico nacional BCRP + WDI (6 KPIs, PBI real, inflación vs. rango meta 1%–3%, lectura ejecutiva y 3 minigráficas) | `#observatorio` (`[data-view="observatorio"]`) |
| `docs/ux/referencias/5.png` | **06 · Simulación Macroeconómica** — Laboratorio interactivo IS–LM–BP / Mundell–Fleming con 4 diagramas sincronizados, flujo de transmisión y guardado de escenarios | `#simulacion` y `#laboratorio` (`#tab-simulator`) |
| `docs/ux/referencias/6.png` | **01 · Aprendizaje Guiado** — Rutas didácticas paso a paso, gráfico interactivo de equilibrio, pregunta de predicción calificada y progreso persistente | `#aprendizaje` (`[data-view="aprendizaje"]`) |
| `docs/ux/referencias/7.png` | **Biblioteca de Fuentes y Metodología** — Directorio académico filtrable + panel lateral **Ficha de la fuente** con cita APA 7 y colecciones rápidas | `#fuentes` (`[data-view="fuentes"]`) |

Los módulos **02 · Análisis Histórico** (`#historico`), **03 · Indicadores Macroeconómicos** (`#indicadores`) y **07 · Modelos Económicos** (`#modelos`) se diseñaron aplicando exactamente el mismo lenguaje visual, cabecera contextual, barra de navegación entre las 7 experiencias y tarjetas translúcidas de las referencias `2.png` a `7.png`.

---

## 3. Matriz de Aceptación de las Siete Experiencias y Secciones Transversales

| # | Experiencia / Sección | Ruta principal y alias | Estado | Funcionalidades verificadas | Datos / Motores asociados | Pruebas automatizadas |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **01** | **Aprendizaje Guiado** | `#aprendizaje` | **COMPLETO** | 3 rutas didácticas (*Macroeconomía Básica*, *Política Fiscal y Monetaria*, *Sector Externo y Perú*), 9 lecciones, progreso persistente en `localStorage`, gráfico SVG interactivo con controles de gasto ($\Delta G$) y oferta monetaria ($\Delta M$), cuestionario de predicción con calificación inmediata, glosario contextual y enlace directo al modelo/simulador. | `createModel` (`js/islm-model.js`), `LEARNING_ROUTES` (`js/services/models-engine.js`) | Unit + E2E (`módulo 01 aprendizaje guiado: rutas, simulación, predicción calificada y persistencia`) |
| **02** | **Análisis Histórico** | `#historico` | **COMPLETO** | Selector de economía (18 economías + agregado ALC), selector de serie (PBI real, inflación, desempleo, cuenta corriente, deuda/apertura), 3 transformaciones (*Nivel / Tasa anual*, *Índice Base 100*, *Promedio móvil 3 años*), botones de hitos históricos (1990, 1998, 2008–09, 2014, 2020, 2022–23), gráfico con bandas de episodios y línea de promedio, comparador de subperiodos (A vs. B), tabla cronológica completa con preservación de `null` (`N/D`) y exportación CSV con metadatos. | `buildHistoricalAnalysis`, `HISTORICAL_MILESTONES` (`js/services/models-engine.js`), respaldo WDI / BCRP | Unit (`buildHistoricalAnalysis preserves nulls...`) + E2E (`módulo 02 análisis histórico: series, subperiodos, transformaciones y exportación CSV`) |
| **03** | **Indicadores Macroeconómicos** | `#indicadores` | **COMPLETO** | Catálogo organizado en 6 categorías macroeconómicas (Actividad, Precios y Política Monetaria, Empleo, Sector Externo, Sector Fiscal, Expectativas), buscador textual, filtro de cobertura (Perú BCRP, Internacional WDI, Demostrativo), tarjetas con sparkline SVG y badge de procedencia (`OFICIAL WDI`, `OFICIAL BCRP`, `DEMO`), y ficha analítica lateral con definición, fórmula, unidad, gráfica de evolución, tabla de valores y enlace a Exploración/Comparación/Simulación. | `INDICATOR_CATEGORIES`, `INDICATORS_CATALOG`, `resolveIndicatorSeries` (`js/services/models-engine.js`) | Unit (`INDICATORS_CATALOG separates verified official series...`, `resolveIndicatorSeries...`) + E2E (`módulo 03 indicadores macroeconómicos...`) |
| **04** | **Exploración de Datos** | `#exploracion` (alias `#panorama`) | **COMPLETO** | Cinta de navegación de las 7 experiencias integrada, filtros de enfoque (Perú / Mundial / Comparado), indicador macroeconómico, horizonte temporal y transformación, 8 tarjetas KPI expandibles, evolución histórica principal, lectura automática y 3 minigráficas inferiores (comparación regional, distribución e histograma de frecuencia). | `js/ui/panorama.js`, `js/services/panorama-data.js`, WDI + BCRPData | Unit (`tests/panorama-data.test.mjs`) + E2E (`panorama referencia...`, `siete experiencias desde la portada orbital...`) |
| **05** | **Comparación Internacional** | `#comparacion` | **COMPLETO** | Cinta de navegación de las 7 experiencias integrada, selector de hasta 4 economías + región ALC, mapa coroplético interactivo (Natural Earth / MapLibre + fallback SVG), evolución temporal comparada, brecha de convergencia frente a EE. UU., ranking de barras y tabla matriz multi-indicador con años comunes. | `js/ui/comparison-dashboard.js`, `js/services/comparison-dashboard.js`, `js/services/compare.js` | Unit (`tests/compare.test.mjs`, `tests/comparison-dashboard.test.mjs`, `tests/comparison-map-data.test.mjs`) + E2E (`comparador: cuatro economías...`) |
| **06** | **Simulación Macroeconómica** | `#simulacion` (alias `#laboratorio`) | **COMPLETO** | Cinta de navegación de las 7 experiencias integrada, calibración por país con datos WDI, 3 regímenes cambiarios y reglas de política, 6 deslizadores de choques, modo de predicción calificada, comparación A/B, 4 diagramas sincronizados (IS–LM, BP, mercado cambiario, gasto planeado), cadena de transmisión, tabla numérica y **barra de guardado/carga de escenarios personalizados en `localStorage`**. | `js/islm-model.js`, `js/ui/simulator.js`, `js/ui/experiences.js` (`#simSaveScenarioBtn`) | Unit (`tests/islm-model.test.mjs`, `tests/lab-content.test.mjs`) + E2E (`laboratorio...`, `módulo 06 y 07 simulación y modelos: guardado de escenarios...`) |
| **07** | **Modelos Económicos** | `#modelos` | **COMPLETO** | Biblioteca interactiva con 5 modelos: **IS–LM–BP / Mundell–Fleming**, **Oferta y Demanda Agregada (OA–DA)**, **Oferta y Demanda Microeconómica**, **Curva de Phillips con Expectativas** y **Crecimiento de Solow–Swan**. Incluye tarjetas selectoras, ecuaciones estructurales, supuestos, variables endógenas/exógenas, limitaciones, choques preconfigurados con deslizadores en vivo, diagrama SVG interactivo del equilibrio y botón de envío al Simulador (`#simulacion`). | `MODELS_LIBRARY`, `createAsAdModel`, `createSupplyDemandModel` (`js/services/models-engine.js`), `js/ui/experiences.js` | Unit (`createAsAdModel...`, `createSupplyDemandModel...`, `MODELS_LIBRARY contains all 5 models...`) + E2E (`módulo 06 y 07 simulación y modelos...`) |
| **T1** | **Observatorio del Perú** | `#observatorio` | **COMPLETO** | Vista nacional dedicada según referencia `4.png`: 6 tarjetas KPI nacionales (PBI real, inflación IPC, tasa de referencia BCRP, tipo de cambio PEN/USD, desempleo, reservas internacionales), gráfico de crecimiento del PBI real, gráfico de inflación con banda sombreada del rango meta BCRP (1%–3%), panel de lectura ejecutiva con indicadores de brecha y 3 gráficos inferiores (tasa de referencia vs. inflación, tipo de cambio e indicadores estructurales). | `BCRP_LOCAL_SNAPSHOT`, `M.state.bcrpData`, `M.state.countryData.PER` (`js/ui/experiences.js`) | E2E (`observatorio del Perú y ficha de la fuente: series nacionales BCRP y colecciones académicas`) |
| **T2** | **Biblioteca de Fuentes y Ficha de la Fuente** | `#fuentes` | **COMPLETO** | Directorio filtrable por curso, ámbito, tipo de acceso y búsqueda libre, integrado en layout de dos columnas (`fuentes-workspace`) con el panel lateral **Ficha de la fuente** (`#sourceDetailSheet`, referencia `7.png`), cita académica APA 7 dinámica, botón de copia al portapapeles y 4 botones de **Colecciones rápidas** (*Principales en Perú*, *Comparación internacional*, *Series de tiempo*, *Microdatos y encuestas*). | `js/data/sources-catalog.js`, `js/ui/student-views.js` | Unit (`tests/sources-catalog.test.mjs`) + E2E (`fuentes: filtros compartidos...`, `observatorio del Perú y ficha de la fuente...`) |
| **T3** | **Ayuda y Glosario** | `#ayuda` | **COMPLETO** | Flujo de trabajo en 5 pasos, buscador instantáneo de términos del glosario con enlace profundo (`#ayuda?term=...`) y preguntas frecuentes sobre datos, metodología y citación. | `js/data/lab-content.js`, `js/ui/student-views.js` | E2E (`fuentes: filtros compartidos, avisos, cita y glosario enlazado`) |

---

## 4. Tabla Completa de Rutas y Navegación

Todas las rutas son accesibles desde la portada orbital (`#inicio`), desde la cinta contextual de las 7 experiencias (`[data-exp-ribbon]`), desde la barra superior y mediante navegación directa por hash (`location.hash`) con soporte completo para `Atrás`/`Adelante`:

| Hash | Vista activa (`data-view`) | Rol en la arquitectura |
| :--- | :--- | :--- |
| `#inicio` | `inicio` | Portada orbital con las 7 experiencias numeradas (`01`–`07`) y acceso rápido al Observatorio del Perú |
| `#aprendizaje` | `aprendizaje` | Experiencia `01` — Aprendizaje Guiado |
| `#historico` | `historico` | Experiencia `02` — Análisis Histórico |
| `#indicadores` | `indicadores` | Experiencia `03` — Indicadores Macroeconómicos |
| `#exploracion` | `exploracion` (`#tab-overview`) | Experiencia `04` — Exploración de Datos (ruta canónica de la tarjeta `04`) |
| `#panorama` | `panorama` (`#tab-overview`) | Alias retrocompatible hacia Exploración de Datos / Panorama |
| `#comparacion` | `comparacion` (`#tab-comparison`) | Experiencia `05` — Comparación Internacional |
| `#simulacion` | `simulacion` (`#tab-simulator`) | Experiencia `06` — Simulación Macroeconómica (ruta canónica de la tarjeta `06`) |
| `#laboratorio` | `laboratorio` (`#tab-simulator`) | Alias retrocompatible hacia Simulación Macroeconómica / Laboratorio |
| `#modelos` | `modelos` | Experiencia `07` — Modelos Económicos |
| `#observatorio` | `observatorio` | Sección transversal — Observatorio Macroeconómico del Perú |
| `#fuentes` | `fuentes` | Sección transversal — Biblioteca de Fuentes y Ficha de la Fuente |
| `#ayuda` | `ayuda` | Sección transversal — Guía de uso, Glosario y Preguntas Frecuentes |

---

## 5. Archivos Creados y Modificados

| Archivo | Tipo de cambio | Descripción técnica |
| :--- | :--- | :--- |
| `index.html` | Modificado (463 líneas, `< 500`) | Enlaces de las 7 tarjetas orbitales (`#aprendizaje`, `#historico`, `#indicadores`, `#exploracion`, `#comparacion`, `#simulacion`, `#modelos`), contenedores de las nuevas vistas, cintas de navegación de experiencias y panel `#sourceDetailSheet` en `#fuentes`. |
| `css/tokens.css` | Modificado | Armonización cromática de temas claro (`Cold White / Ice Blue / Cobalt`) y oscuro (`Deep Navy / Electric Blue`) con variables semánticas de superficie, borde, texto y acento. |
| `css/experiences.css` | Nuevo | Estilos modulares y reglas responsive (`1920px` a `360px`) para la cinta de experiencias, `#aprendizaje`, `#historico`, `#indicadores`, `#modelos`, `#observatorio`, `#sourceDetailSheet` y barra de escenarios guardados. |
| `js/services/models-engine.js` | Nuevo | Motor puro (compatible con navegador y Node ESM) con `createAsAdModel`, `createSupplyDemandModel`, `HISTORICAL_MILESTONES`, `buildHistoricalAnalysis`, `INDICATOR_CATEGORIES`, `INDICATORS_CATALOG`, `BCRP_LOCAL_SNAPSHOT`, `resolveIndicatorSeries`, `LEARNING_ROUTES` y `MODELS_LIBRARY`. |
| `js/ui/experiences.js` | Nuevo | Renderizado interactivo, gráficos Chart.js / SVG, exportación CSV, persistencia en `localStorage` y navegación cruzada para `#aprendizaje`, `#historico`, `#indicadores`, `#modelos`, `#observatorio` y escenarios guardados en `#simulacion`. |
| `js/ui/student-views.js` | Modificado | Enrutador `route()` ampliado a las 13 rutas (7 experiencias + alias + secciones transversales) y renderizado interactivo de `#sourceDetailSheet` (ficha de la fuente, cita APA y colecciones rápidas). |
| `js/app.js` | Modificado | Inicialización de `M.setupExperiences()` y actualización de `M.renderAllExperiences()` al cambiar de tema o recibir datos en vivo. |
| `package.json` | Modificado | Inclusión de `tests/models-engine.test.mjs` en `npm run test:unit`. |
| `tests/models-engine.test.mjs` | Nuevo | Pruebas unitarias para motores OA–DA, Oferta–Demanda microeconómica, análisis histórico sin interpolar nulos, catálogo de indicadores y biblioteca de 5 modelos. |
| `tests/e2e.mjs` | Modificado | Pruebas E2E para las 7 experiencias, alias retrocompatibles, Observatorio del Perú, Ficha de la fuente y generación de capturas multi-resolución (`desktop`, `tablet`, `mobile`) y `light`/`dark`. |
| `README.md` | Modificado | Documentación actualizada de las 7 experiencias, rutas, arquitectura y comandos de prueba. |
| `docs/arquitectura.md` | Modificado | Documentación de los nuevos motores (`js/services/models-engine.js`), vistas (`js/ui/experiences.js`) y estilos (`css/experiences.css`). |
| `docs/ux/referencias/MAPEO-REFERENCIAS.md` | Nuevo | Mapeo detallado de las 7 referencias visuales (`1.png` ... `7.png`). |
| `docs/INFORME-HARMONIA-FINAL.md` | Nuevo | Este informe técnico integral de entrega y auditoría. |

---

## 6. Resultados de Pruebas Automatizadas

- **`npm.cmd run test:smoke`**:
  - `MacroScope OK: 34 controles, 28 archivos JS válidos, referencias locales y SRI verificados.`
  - `index.html` verificado en 463 líneas (límite `< 500` líneas).
- **`npm.cmd run test:unit`**:
  - **72 pruebas unitarias ejecutadas, 72 aprobadas (`pass 72`, `fail 0`)** cubriendo `islm-model`, `bcrp`, `lab-content`, `wdi`, `compare`, `comparison-dashboard`, `comparison-map-data`, `sources-catalog`, `panorama-data` y `models-engine`.
- **`npm.cmd run test:e2e`**:
  - **`MacroScope e2e OK: 83 comprobaciones` (`0` fallos)** en Playwright, incluyendo la matriz responsive `A1–A13` en `360px`, `390px`, `768px`, `1024px`, `1280px`, `1440px` y `1920px` (en modos `light` y `dark`), más las pruebas funcionales de las 7 experiencias, Observatorio del Perú, Ficha de la fuente y capturas visuales.

---

## 7. Índice de Capturas Verificadas

Las 44 capturas automatizadas generadas por Playwright en la corrida final se encuentran en `test-results/experiencias/` (además de las capturas de `test-results/rediseno/`):

### `test-results/experiencias/` (Siete experiencias + secciones transversales)
- **Portada (`#inicio`)**: `inicio-desktop-light.png`, `inicio-desktop-dark.png`, `inicio-tablet-light.png`, `inicio-tablet-dark.png`, `inicio-mobile-light.png`, `inicio-mobile-dark.png`
- **01 · Aprendizaje Guiado (`#aprendizaje`)**: `aprendizaje-desktop-light.png`, `aprendizaje-desktop-dark.png`, `aprendizaje-tablet-light.png`, `aprendizaje-tablet-dark.png`, `aprendizaje-mobile-light.png`, `aprendizaje-mobile-dark.png`
- **02 · Análisis Histórico (`#historico`)**: `historico-desktop-light.png`, `historico-desktop-dark.png`, `historico-tablet-light.png`, `historico-tablet-dark.png`, `historico-mobile-light.png`, `historico-mobile-dark.png`
- **03 · Indicadores Macroeconómicos (`#indicadores`)**: `indicadores-desktop-light.png`, `indicadores-desktop-dark.png`, `indicadores-tablet-light.png`, `indicadores-tablet-dark.png`, `indicadores-mobile-light.png`, `indicadores-mobile-dark.png`
- **04 · Exploración de Datos (`#exploracion`)**: `exploracion-desktop-light.png`, `exploracion-desktop-dark.png` (y en `test-results/rediseno/`: `panorama-desktop-light.png`, `panorama-desktop-dark.png`, `panorama-tablet-light.png`, `panorama-mobile-light.png`)
- **05 · Comparación Internacional (`#comparacion`)**: `comparacion-desktop-light.png`, `comparacion-desktop-dark.png` (y en `test-results/rediseno/`: `comparacion-desktop-light.png`, `comparacion-desktop-dark.png`, `comparacion-tablet-light.png`, `comparacion-mobile-light.png`)
- **06 · Simulación Macroeconómica (`#simulacion`)**: `simulacion-desktop-light.png`, `simulacion-desktop-dark.png` (y en `test-results/rediseno/`: `laboratorio-desktop-light.png`, `laboratorio-desktop-dark.png`, `laboratorio-tablet-light.png`, `laboratorio-mobile-light.png`)
- **07 · Modelos Económicos (`#modelos`)**: `modelos-desktop-light.png`, `modelos-desktop-dark.png`, `modelos-tablet-light.png`, `modelos-tablet-dark.png`, `modelos-mobile-light.png`, `modelos-mobile-dark.png`
- **Observatorio del Perú (`#observatorio`)**: `observatorio-desktop-light.png`, `observatorio-desktop-dark.png`, `observatorio-tablet-light.png`, `observatorio-tablet-dark.png`, `observatorio-mobile-light.png`, `observatorio-mobile-dark.png`
- **Biblioteca de Fuentes (`#fuentes`)**: `fuentes-desktop-light.png`, `fuentes-desktop-dark.png` (y validación responsive sin desbordamiento en `360px`, `390px` y `768px` en `light`/`dark`)

---

## 8. Limitaciones Metodológicas y Reglas de Procedencia

1. **Preservación estricta de observaciones ausentes (`null`)**: Ningún motor ni vista interpola años vacíos ni convierte `null` en `0`. En tablas y tarjetas los valores ausentes se muestran como `N/D` y en las gráficas como discontinuidades explícitas.
2. **Separación entre series oficiales y series demostrativas**:
   - Las series de **Banco Mundial (WDI)** y **BCRPData** utilizan observaciones oficiales con respaldo local verificado (`js/data/wdi-fallback.js` y `BCRP_LOCAL_SNAPSHOT`) y actualización en vivo cuando hay red.
   - En el catálogo de **03 · Indicadores Macroeconómicos** (`#indicadores`), las dos tarjetas complementarias de frecuencia mensual no incluidas en el corte WDI (*Índice de Confianza Empresarial* y *Resultado Primario del Sector Público No Financiero*) están marcadas explícitamente con la insignia **`DEMO`** (`isDemo: true`) y nota metodológica visible para no confundirse jamás con estadísticas oficiales en vivo.
3. **Alcance pedagógico de los modelos teóricos (`#simulacion` y `#modelos`)**: Los modelos IS–LM–BP / Mundell–Fleming, OA–DA, Oferta y Demanda microeconómica, Curva de Phillips y Solow–Swan utilizan formas estructurales lineales calibradas con fines docentes; sus resultados representan ejercicios de estática comparativa y no pronósticos econométricos.
