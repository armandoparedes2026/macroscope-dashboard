# INFORME TÉCNICO FINAL — MACROSCOPE: ARMONIZACIÓN VISUAL Y CONSTRUCCIÓN DE LAS SIETE EXPERIENCIAS

- **Repositorio remoto (`origin`)**: `armandoparedes2026/macroscope-dashboard` (`https://github.com/armandoparedes2026/macroscope-dashboard.git`)
- **Rama de trabajo**: `cristivenog88-prog/harmonia-final`
- **Commit base inicial**: `7db6f4721c74eb3c96d31cf47e89f9d722a2462c`
- **Commit de implementación y auditoría (Fase F)**: `b2ff681cbe7dfcf14ed55faedbebde942d61c1dd`
- **Pull Request**: [#9 — `feat(harmonia): construcción integral y armonización de las siete experiencias de Macroscope`](https://github.com/armandoparedes2026/macroscope-dashboard/pull/9) (**Estado: `MERGED`**, `2026-10-26T06:14:46Z`)
- **Commits de fusión y sincronización en `main` (Fase G)**: `44fb8310db60aa2bc86bff3baea7c0fa8fa6d997` y `ae73928a6e7b59df783d0afcd62330ae0356bbe2`
- **Proyecto y equipo en Vercel**: `macroscope-dashboard` (`prj_ynewA8npY6iYShQpYA6vYe13wZzg`) · Equipo `CS_CORP` (`team_2SUUXoaYVzUfyptfKrG51Of9`)
- **Dominios públicos de producción en Vercel (`READY`)**: [`https://macroscope-dashboard.vercel.app`](https://macroscope-dashboard.vercel.app) y [`https://macroscope-dashboard-cs-corp.vercel.app`](https://macroscope-dashboard-cs-corp.vercel.app)
- **URLs inmutables de revisión (`target: production`, no existe un target `preview` separado)**:
  - Despliegue `dpl_AqL7BoDVMzTJj3qJNsitVdkvAX5i` (`READY`, commit `ae73928a6e7b59df783d0afcd62330ae0356bbe2`, `gitDirty: 1`): [`https://macroscope-dashboard-jj9h9ddef-cs-corp.vercel.app`](https://macroscope-dashboard-jj9h9ddef-cs-corp.vercel.app)
  - Despliegue `dpl_9VAZYAnYK1xQdrSBFUEj15mp1MMk` (`READY`, commit `44fb8310db60aa2bc86bff3baea7c0fa8fa6d997`): [`https://macroscope-dashboard-jmef8vdsk-cs-corp.vercel.app`](https://macroscope-dashboard-jmef8vdsk-cs-corp.vercel.app)
- **Trabajador de implementación**: `ARGON` (`gemini-4-argon`)

---

## 1. Resumen Ejecutivo

Se ejecutó el rediseño armónico y la construcción de las **siete experiencias** de **MacroScope — Laboratorio Interactivo de Economía Aplicada**, junto con las secciones transversales (**Observatorio del Perú**, **Biblioteca de Fuentes con Ficha de la Fuente** y **Ayuda y Glosario**):

1. **Armonización Visual (UI/UX)**: Se unificó en `css/tokens.css` y `css/experiences.css` la paleta institucional frío/cobalto (`#f3f7fe`, `#eaf2fd`, `#1d63e8`) en tema claro y marino profundo (`#081326`, `#0f1f3a`, `#569dff`) en tema oscuro, manteniendo contraste WCAG 2.1 AA, tipografía jerárquica (`Plus Jakarta Sans`, `DM Sans`, `IBM Plex Mono`) y diseño responsive verificado sin desbordamiento horizontal en `1920px`, `1440px`, `1280px`, `1024px`, `768px`, `390px` y `360px`.
2. **Construcción Funcional y Rigor Matemático**:
   - Se implementaron las vistas dedicadas para `#aprendizaje`, `#historico`, `#indicadores`, `#modelos` y `#observatorio`, además de la **Ficha de la fuente** en `#fuentes` y la persistencia completa de escenarios en `#simulacion`/`#laboratorio`.
   - En `#simulacion`, el guardado y carga de escenarios (`macroscope_saved_scenarios_v1`) persiste y restaura íntegramente `country`, `regime`, `mobility`, `instrument`, parámetros estructurales (`params`), choques (`u`), bandera de calibración (`mTouched`) y equilibrio resultante (`E2`) mediante el contrato `M.labs.islm.snapshot()` / `M.labs.islm.restore()`.
   - En `#modelos` y `#aprendizaje`, los diagramas SVG de los 3 motores matemáticos activos (`islm`, `asad`, `micro-sd`) trazan las curvas devueltas por `curves()` y los puntos de equilibrio (`E0`, `E1`, `E2`) bajo una única transformación afín de coordenadas, garantizando que las intersecciones gráficas coincidan exactamente con la solución analítica del motor.
3. **Trazabilidad Estadística, Ausencias y Cadencia**:
   - El respaldo local BCRP (`BCRP_LOCAL_SNAPSHOT`) reproduce de forma exacta e íntegra las 4 series verificadas de `tests/fixtures/bcrp-normalized.json` (`PD04722MM`, `PN01273PM`, `PN01207PM`, `PN00027MM`, `fetchedAt: "2026-10-18T06:42:40.009Z"`, 34 observaciones mensuales cada una incluyendo `null` en `2026-10-01`).
   - Las series BCRP sin respaldo local en el fixture (como `PN02507AQ`, PBI real trimestral) no utilizan cifras inventadas: requieren el proxy `/api/bcrp` en vivo y en modo sin conexión reportan explícitamente estado `unavailable` (`Sin dato local`).
   - Todas las funciones analíticas (`resolveIndicatorSeries`, `buildHistoricalAnalysis`, `getLatestObservationSummary`, `makeSparkSvg` y gráficas Chart.js con `spanGaps: false`) preservan los periodos con valor `null` como discontinuidades reales, verifican que los periodos sean consecutivos en el calendario (`areConsecutivePeriods`) antes de calcular variaciones o medias móviles de 3 observaciones, y jamás sustituyen una media móvil ausente por el valor bruto observado.

---

## 2. Mapeo de Referencias Visuales (`docs/ux/referencias/1.png` ... `7.png`)

Las siete imágenes de referencia ubicadas en `docs/ux/referencias/` se conservaron intactas en sus rutas originales y se documentaron en `docs/ux/referencias/MAPEO-REFERENCIAS.md`:

| Archivo original | Rol visual identificado | Módulo / Ruta en MacroScope |
| :--- | :--- | :--- |
| `docs/ux/referencias/1.png` | Portada orbital con las 7 tarjetas numeradas (`01` a `07`) en arco sobre el globo holográfico | `#inicio` (`[data-view="inicio"]`) |
| `docs/ux/referencias/2.png` | **04 · Exploración de Datos** — Panorama Económico Mundial y del Perú (8 tarjetas KPI, evolución histórica, distribución regional e histograma) | `#exploracion` y `#panorama` (`#tab-overview`) |
| `docs/ux/referencias/3.png` | **05 · Comparación Internacional** — Mapa coroplético interactivo, evolución multi-país, brecha vs. EE. UU., ranking y matriz | `#comparacion` (`#tab-comparison`) |
| `docs/ux/referencias/4.png` | **Observatorio del Perú** — Panel macroeconómico nacional BCRP + WDI (6 KPIs, inflación vs. rango meta 1%–3%, tasa de referencia, RIN, tipo de cambio y lectura ejecutiva) | `#observatorio` (`[data-view="observatorio"]`) |
| `docs/ux/referencias/5.png` | **06 · Simulación Macroeconómica** — Laboratorio interactivo IS–LM–BP / Mundell–Fleming con 4 diagramas sincronizados y guardado local de escenarios | `#simulacion` y `#laboratorio` (`#tab-simulator`) |
| `docs/ux/referencias/6.png` | **01 · Aprendizaje Guiado** — Rutas didácticas paso a paso, gráfico interactivo de equilibrio, pregunta de predicción calificada y progreso persistente | `#aprendizaje` (`[data-view="aprendizaje"]`) |
| `docs/ux/referencias/7.png` | **Biblioteca de Fuentes y Metodología** — Directorio académico filtrable + panel lateral **Ficha de la fuente** con cita APA 7 y colecciones rápidas | `#fuentes` (`[data-view="fuentes"]`) |

---

## 3. Matriz Integral de Estado por Módulo (UI/UX, Funcionalidad, APIs, Demos/Pendientes, Pruebas y Capturas)

| # | Módulo y Ruta (`#hash`) | Estado UI/UX | Estado Funcional | APIs y Fuentes Conectadas | Componentes e Interacciones Implementadas | Demos / Pendientes de Conexión Externa | Pruebas Ejecutadas | Capturas Verificadas (`test-results/experiencias/`) |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :--- | :--- |
| **00** | **Portada Orbital** (`#inicio`) | **COMPLETO** | **COMPLETO** | Metadatos de estado WDI / BCRP | Globo central, 7 tarjetas orbitales enlazadas a `#aprendizaje`, `#historico`, `#indicadores`, `#exploracion`, `#comparacion`, `#simulacion`, `#modelos`, navegación por teclado y acceso al Observatorio del Perú. | Ninguno | Smoke + E2E (`inicio orbital: siete módulos...`, `siete experiencias desde la portada orbital...`) | `inicio-desktop-light.png`, `inicio-desktop-dark.png`, `inicio-tablet-light.png`, `inicio-tablet-dark.png`, `inicio-mobile-light.png`, `inicio-mobile-dark.png` |
| **01** | **Aprendizaje Guiado** (`#aprendizaje`) | **COMPLETO** | **COMPLETO** | Motor `ISLM.createModel` (`js/islm-model.js`) y `LAB_CONTENT.SCENARIOS` (`js/lab-content.js`) | 3 rutas didácticas (`macro-accion`: *Macroeconomía en acción (IS–LM–BP)*; `abierta-cambiaria`: *Sector externo y regímenes cambiarios*; `ciclo-estabilizacion`: *Ciclo económico y estabilización*), 6 lecciones por ruta, selector de nivel (`intro`, `intermediate`, `advanced`), controles de simulación ($\Delta G$, $\Delta M$, $\Delta i^*$), diagrama SVG con intersección exacta `IS`/`LM`, predicción calificada y persistencia en `localStorage` (`macroscope_learning_progress_v1`). | Ninguno | Unit + E2E (`módulo 01 aprendizaje guiado: rutas, simulación, predicción calificada y persistencia`) | `aprendizaje-desktop-light.png`, `aprendizaje-desktop-dark.png`, `aprendizaje-tablet-light.png`, `aprendizaje-tablet-dark.png`, `aprendizaje-mobile-light.png`, `aprendizaje-mobile-dark.png` |
| **02** | **Análisis Histórico** (`#historico`) | **COMPLETO** | **COMPLETO** | Banco Mundial WDI (API + `js/data/fallback-wdi.js`) y BCRP (`BCRP_LOCAL_SNAPSHOT` + proxy `/api/bcrp`) | Buscador y selector de 14 series oficiales, selector de 18 economías, rango de fechas, 4 modos (*Observado*, *Variación*, *Base = 100*, *Tendencia móvil*), gráfico Chart.js con `spanGaps: false`, hitos históricos documentados, comparador de subperiodos (A vs. B), tabla con trazabilidad y exportación CSV. | La serie trimestral `PN02507AQ` requiere el proxy `/api/bcrp` en vivo; sin conexión muestra `0 obs.` sin inventar datos. | Unit (`buildHistoricalAnalysis preserves nulls, checks cadence...`) + E2E (`módulo 02 análisis histórico: series, subperiodos, transformaciones y exportación CSV`) | `historico-desktop-light.png`, `historico-desktop-dark.png`, `historico-tablet-light.png`, `historico-tablet-dark.png`, `historico-mobile-light.png`, `historico-mobile-dark.png` |
| **03** | **Indicadores Macroeconómicos** (`#indicadores`) | **COMPLETO** | **COMPLETO CON FICHAS DEMO ETIQUETADAS** | WDI (10 series anuales verificadas) + BCRP (4 series mensuales en snapshot verificado + 1 trimestral vía proxy) | 8 categorías (`activity`, `prices`, `labor`, `monetary`, `external`, `fiscal`, `financial`, `development`), buscador, filtro por proveedor (`WDI`, `BCRP`, `DEMO`), tarjetas con sparkline SVG que respeta huecos (`null`) y ficha analítica lateral con gráfica, fórmula, comparación entre 6 economías y cita APA. | **2 fichas DEMO explícitas** (`DEMO.FISCAL.RESULT` para resultado económico SPNF MEF/FMI y `DEMO.FIN.CREDIT` para crédito al sector privado SBS/BCRP) + **`PN02507AQ` trimestral** sujeto a disponibilidad del proxy `/api/bcrp` en vivo (mostrado como `Sin dato local` en modo offline). | Unit (`INDICATORS_CATALOG separates verified official series...`, `BCRP_LOCAL_SNAPSHOT matches...`) + E2E (`módulo 03 indicadores macroeconómicos...`) | `indicadores-desktop-light.png`, `indicadores-desktop-dark.png`, `indicadores-tablet-light.png`, `indicadores-tablet-dark.png`, `indicadores-mobile-light.png`, `indicadores-mobile-dark.png` |
| **04** | **Exploración de Datos** (`#exploracion`, alias `#panorama`) | **COMPLETO** | **COMPLETO** | WDI API + respaldo local y proxy `/api/bcrp` (`js/services/panorama-data.js`) | Cinta de las 7 experiencias, filtros de enfoque (Perú / Mundial / Comparado), indicador, horizonte y transformación, 8 tarjetas KPI expandibles, gráfico principal de evolución, lectura automática, 3 minigráficas inferiores y enlaces transversales. | En modo `file://` o sin red, las series exclusivas del proxy BCRP en vivo muestran estado no disponible conservando el respaldo WDI. | Unit (`tests/panorama-data.test.mjs`) + E2E (`panorama referencia...`, `siete experiencias desde la portada orbital...`) | `exploracion-desktop-light.png`, `exploracion-desktop-dark.png` (+ `test-results/rediseno/panorama-*.png`) |
| **05** | **Comparación Internacional** (`#comparacion`) | **COMPLETO** | **COMPLETO** | WDI API + respaldo local y geometrías Natural Earth (`js/services/comparison-map-data.js`) | Cinta de las 7 experiencias, selector de hasta 4 economías + agregado ALC, mapa coroplético interactivo, serie comparada, convergencia vs. EE. UU., ranking y tabla matriz en años comunes. | Ninguno | Unit (`tests/compare.test.mjs`, `tests/comparison-dashboard.test.mjs`, `tests/comparison-map-data.test.mjs`) + E2E (`comparador: cuatro economías...`) | `comparacion-desktop-light.png`, `comparacion-desktop-dark.png` (+ `test-results/rediseno/comparacion-*.png`) |
| **06** | **Simulación Macroeconómica** (`#simulacion`, alias `#laboratorio`) | **COMPLETO** | **COMPLETO** | Motor `ISLM.createModel` calibrado con datos WDI (`NE.IMP.GNFS.ZS`, `NE.RSB.GNFS.ZS`, `BN.CAB.XOKA.GD.ZS`) | Cinta de las 7 experiencias, 3 regímenes cambiarios, movilidad de capitales, regla monetaria, 10 controles de choque y 6 parámetros estructurales, 4 diagramas sincronizados, comparación A/B, escenarios guiados y **guardado/restauración íntegra de escenarios en `localStorage`** (`country`, `regime`, `mobility`, `instrument`, `params`, `u`, `mTouched`, `E2`). | Ninguno | Unit (`tests/islm-model.test.mjs`, `tests/lab-content.test.mjs`) + E2E (`laboratorio...`, `módulo 06 y 07 simulación y modelos: persistencia completa...`) | `simulacion-desktop-light.png`, `simulacion-desktop-dark.png` (+ `test-results/rediseno/laboratorio-*.png`) |
| **07** | **Modelos Económicos** (`#modelos`) | **COMPLETO** | **3 FUNCIONALES + 2 CONCEPTUALES** | Motores `ISLM.createModel`, `createAsAdModel`, `createSupplyDemandModel` + series empíricas WDI/BCRP | Tarjetas selectoras de los 5 modelos, ecuaciones estructurales, supuestos, variables endógenas/exógenas, controles interactivos, diagrama SVG con intersección geométrica exacta para `islm`, `asad` y `micro-sd`, y gráfica de contraste empírico. | **3 motores matemáticos activos** (`islm`, `asad`, `micro-sd`); **2 modelos en modo esquema conceptual interactivo** (`phillips`: Curva de Phillips con expectativas; `solow`: Crecimiento de Solow–Swan), rotulados explícitamente con insignia `Esquema conceptual interactivo`. | Unit (`createAsAdModel...`, `createSupplyDemandModel...`, `MODELS_LIBRARY...`) + E2E (`módulo 06 y 07 simulación y modelos: persistencia completa de escenarios y coherencia geométrica SVG`) | `modelos-desktop-light.png`, `modelos-desktop-dark.png`, `modelos-tablet-light.png`, `modelos-tablet-dark.png`, `modelos-mobile-light.png`, `modelos-mobile-dark.png` |
| **T1** | **Observatorio del Perú** (`#observatorio`) | **COMPLETO** | **COMPLETO** | BCRP (`BCRP_LOCAL_SNAPSHOT` verificado + proxy `/api/bcrp`) y WDI (`NY.GDP.MKTP.KD.ZG`, `SL.UEM.TOTL.ZS`) | 6 tarjetas KPI nacionales con chequeo de cadencia y sparklines con preservación de `null`, 4 gráficos Chart.js (IPC con banda meta 1%–3%, tasa de referencia, RIN, tipo de cambio), lectura ejecutiva, calendario oficial y exportación CSV. | Cuando el proxy `/api/bcrp` no está activo en línea, la tarjeta de crecimiento del PBI muestra la serie anual verificada WDI (`NY.GDP.MKTP.KD.ZG`) en lugar de `PN02507AQ` trimestral; no incluye desagregación departamental no verificada. | E2E (`observatorio del Perú y ficha de la fuente: series nacionales BCRP y colecciones académicas`) | `observatorio-desktop-light.png`, `observatorio-desktop-dark.png`, `observatorio-tablet-light.png`, `observatorio-tablet-dark.png`, `observatorio-mobile-light.png`, `observatorio-mobile-dark.png` |
| **T2** | **Biblioteca de Fuentes y Ficha de la Fuente** (`#fuentes`) | **COMPLETO** | **COMPLETO** | Catálogo académico `SOURCES_CATALOG` (`js/data/sources-catalog.js`) | Filtros por curso, ámbito, acceso y búsqueda libre, tarjetas con botón `Ver ficha`, panel lateral `#sourceDetailSheet` (**Ficha de la fuente**), cita académica APA 7 con copia al portapapeles y 4 botones de **Colecciones rápidas**. | Ninguno | Unit (`tests/sources-catalog.test.mjs`) + E2E (`fuentes: filtros compartidos...`, `observatorio del Perú y ficha de la fuente...`, `A1–A13 matriz 360px...`) | `fuentes-desktop-light.png`, `fuentes-desktop-dark.png` |
| **T3** | **Ayuda y Glosario** (`#ayuda`) | **COMPLETO** | **COMPLETO** | `LAB_CONTENT.GLOSSARY` (`js/lab-content.js`) | Guía de flujo en 5 pasos, buscador instantáneo de términos con enlace profundo (`#ayuda?term=...`) y preguntas frecuentes. | Ninguno | E2E (`fuentes: filtros compartidos, avisos, cita y glosario enlazado`) | Validado en matriz `A1–A13` (`360px` a `1920px`) |

---

## 4. Resolución de Hallazgos de la Auditoría Técnica Única (Fase F)

1. **P1 · Persistencia completa de escenarios en `#simulacion` (`js/ui/islm-lab.js`, `js/ui/experiences.js`)**:
   - Se incorporó `country: state.country` en `M.labs.islm.snapshot().config` y el método `M.labs.islm.restore(saved)` en `js/ui/islm-lab.js`.
   - En `js/ui/experiences.js`, `isValidSavedScenario` valida la estructura almacenada en `localStorage` (`macroscope_saved_scenarios_v1`), `simSaveCurrentBtn` guarda `config` (`country`, `regime`, `mobility`, `instrument`), `params`, `u`, `mTouched` y `E2`, y `[data-load-sim]` restaura íntegramente el estado y los controles del laboratorio.
   - Verificado en `tests/e2e.mjs` mediante el flujo completo: configurar `CHL` + régimen `fixed` + movilidad `perfect` + `G=24` + `ebar=110` + `c=0.8` → guardar → cambiar a `PER` y restablecer a base (`flex`, `Y=100`) → cargar escenario guardado → comprobar igualdad profunda (`assert.deepEqual`) de `config`, `params`, `u` y `E2`.
2. **P1 · Procedencia verificable del respaldo BCRP (`js/services/models-engine.js`)**:
   - Se reemplazó `BCRP_LOCAL_SNAPSHOT` por la copia exacta e íntegra de las 4 series de `tests/fixtures/bcrp-normalized.json` (`PD04722MM`, `PN01273PM`, `PN01207PM`, `PN00027MM`) con sus 34 observaciones cada una (incluyendo `2026-10-01: null`) y `"fetchedAt": "2026-10-18T06:42:40.009Z"`.
   - Se eliminó `PN02507AQ` de `BCRP_LOCAL_SNAPSHOT` para no mantener jamás cifras sin fixture verificable; cuando no hay proxy en vivo, `resolveIndicatorSeries` devuelve `status: 'unavailable'` y `series: []`.
   - Verificado con `assert.deepEqual` contra `tests/fixtures/bcrp-normalized.json` en `tests/models-engine.test.mjs`.
3. **P1 · Preservación de ausencias (`null`), discontinuidades y chequeo de cadencia (`js/services/models-engine.js`, `js/ui/experiences.js`)**:
   - `resolveIndicatorSeries` conserva todas las observaciones con `value: null` sin filtrarlas.
   - `areConsecutivePeriods` y `getLatestObservationSummary` verifican que dos observaciones sean consecutivas en el calendario (anual: $\Delta = 1$ año; mensual: $\Delta = 1$ mes; trimestral: $\Delta = 3$ meses) antes de calcular variaciones (`pctChange`, `delta`) o medias móviles de 3 observaciones (`ma3`).
   - En `buildHistoricalAnalysis`, cuando `mode === 'trend'`, `displayValue` es estrictamente `ma3` (`null` cuando no existen 3 observaciones consecutivas válidas), sin sustituirlo jamás por el valor bruto observado.
   - `makeSparkSvg` conserva las posiciones temporales de los `null` y divide la línea SVG en segmentos separados (`data-segments`), y todas las gráficas Chart.js utilizan `spanGaps: false`.
4. **P1 · Coherencia matemática y geométrica de los diagramas funcionales (`js/services/models-engine.js`, `js/ui/experiences.js`)**:
   - `createAsAdModel().curves()` incluye la curva `as2` de medio plazo ajustada a `E2.Pe`.
   - `renderModelDiagramSvg` (para `asad` y `micro-sd`) y `renderLearningEquilibriumSvg` (para `islm`) utilizan las rectas de `curves()` y una única transformación afín `(mapX, mapY)` compartida entre curvas y puntos de equilibrio (`E0`, `E1`, `E2`).
   - Verificado tanto en pruebas unitarias (`tests/models-engine.test.mjs`) como sobre las coordenadas DOM del SVG renderizado en Playwright (`tests/e2e.mjs`), comprobando que la distancia euclidiana entre la intersección de las líneas `<line data-curve="...">` y el centro de los círculos `<circle data-point="...">` es $< 0.2\text{ px}$.

---

## 5. Resultados de Pruebas Automatizadas sobre la Revisión Final

- **`npm.cmd run test:smoke`**:
  - `MacroScope OK: 34 controles, 28 archivos JS válidos, referencias locales y SRI verificados.` (`index.html` en 463 líneas `< 500`).
- **`npm.cmd run test:unit`**:
  - **`73 tests, 73 pass, 0 fail`** (`tests/islm-model.test.mjs`, `tests/bcrp.test.mjs`, `tests/lab-content.test.mjs`, `tests/wdi.test.mjs`, `tests/compare.test.mjs`, `tests/comparison-dashboard.test.mjs`, `tests/comparison-map-data.test.mjs`, `tests/sources-catalog.test.mjs`, `tests/panorama-data.test.mjs`, `tests/models-engine.test.mjs`).
- **`npm.cmd run test:e2e`**:
  - **`MacroScope e2e OK: 83 comprobaciones` (`0` fallos)** en Playwright, incluyendo la matriz `A1–A13` en `360px`, `390px`, `768px`, `1024px`, `1280px`, `1440px` y `1920px` en modos `light` y `dark`, más las pruebas funcionales, geométricas y de persistencia de las 7 experiencias y secciones transversales, y las 44 capturas regeneradas en `test-results/experiencias/`.

---

## 6. Publicación, Pull Request, CI y Estado de Despliegue (Fase G)

### 6.1 Push, Pull Request, Checks de CI y Merge en GitHub
- **Push de rama**: `git push -u origin cristivenog88-prog/harmonia-final` completado sin force-push hacia `https://github.com/armandoparedes2026/macroscope-dashboard.git`.
- **Pull Request creado y fusionado**:
  - **PR**: [#9 — `feat(harmonia): construcción integral y armonización de las siete experiencias de Macroscope`](https://github.com/armandoparedes2026/macroscope-dashboard/pull/9)
  - **Validación en GitHub Actions (`Validate MacroScope`)**: Run [`40277639149` / Job `121423681408`](https://github.com/armandoparedes2026/macroscope-dashboard/actions/runs/40277639149/job/121423681408) completado con **`conclusion: SUCCESS`** (`8m35s`).
  - **Fusión en `main`**: Estado **`MERGED`** (`2026-10-26T06:14:46Z`), commit de fusión `44fb8310db60aa2bc86bff3baea7c0fa8fa6d997`.

### 6.2 Resumen de Archivos Modificados (`7db6f4721c74eb3c96d31cf47e89f9d722a2462c..b2ff681cbe7dfcf14ed55faedbebde942d61c1dd`)
```text
 README.md                                |  246 ++--
 css/experiences.css                      |  971 +++++++++++++
 css/tokens.css                           |  189 +--
 docs/INFORME-HARMONIA-FINAL.md           |  135 ++
 docs/arquitectura.md                     |  176 +--
 docs/ux/referencias/1.png                |  Bin 0 -> 1699805 bytes
 docs/ux/referencias/2.png                |  Bin 0 -> 1664352 bytes
 docs/ux/referencias/3.png                |  Bin 0 -> 1814084 bytes
 docs/ux/referencias/4.png                |  Bin 0 -> 1783399 bytes
 docs/ux/referencias/5.png                |  Bin 0 -> 1783825 bytes
 docs/ux/referencias/6.png                |  Bin 0 -> 610884 bytes
 docs/ux/referencias/7.png                |  Bin 0 -> 1825021 bytes
 docs/ux/referencias/MAPEO-REFERENCIAS.md |   18 +
 index.html                               |   22 +-
 js/app.js                                |    5 +-
 js/services/models-engine.js             | 1062 ++++++++++++++
 js/ui/experiences.js                     | 2268 ++++++++++++++++++++++++++++++
 js/ui/islm-lab.js                        |   27 +-
 js/ui/student-views.js                   |  136 +-
 package.json                             |    4 +-
 tests/e2e.mjs                            |  216 ++-
 tests/models-engine.test.mjs             |  243 ++++
 22 files changed, 5269 insertions(+), 403 deletions(-)
```

### 6.3 Evidencia Verificada de Despliegue en Vercel y Validación Remota (`2026-10-26`)

#### 6.3.1 Metadatos de Proyecto y Despliegue (Conector Vercel)
Aunque la consulta `gh api repos/armandoparedes2026/macroscope-dashboard/deployments` devuelve `[]` y el token local de `npx.cmd vercel whoami` (`Vercel CLI 65.2.0`) se encuentra expirado en la máquina local, **el proyecto sí está conectado y desplegado automáticamente en Vercel** bajo los siguientes identificadores verificados por el conector de coordinación:
- **Proyecto Vercel**: `macroscope-dashboard` (`prj_ynewA8npY6iYShQpYA6vYe13wZzg`)
- **Equipo Vercel**: `CS_CORP` (`team_2SUUXoaYVzUfyptfKrG51Of9`)
- **Dominios públicos de producción (`target: production`)**:
  - [`https://macroscope-dashboard.vercel.app`](https://macroscope-dashboard.vercel.app) (`HTTP 200 OK`)
  - [`https://macroscope-dashboard-cs-corp.vercel.app`](https://macroscope-dashboard-cs-corp.vercel.app) (`HTTP 200 OK`)
- **URLs inmutables de despliegue (`target: production`)** *(Nota: estas URLs inmutables corresponden a despliegues de `target: production` y se emplean como enlaces inmutables de revisión; no existe un `target: preview` separado para estos despliegues)*:
  - **Último despliegue (`latestDeployment`)**: `dpl_AqL7BoDVMzTJj3qJNsitVdkvAX5i` · Estado **`READY`** · `target: production` · `githubCommitSha: ae73928a6e7b59df783d0afcd62330ae0356bbe2` (`gitDirty: 1`) · URL inmutable: [`https://macroscope-dashboard-jj9h9ddef-cs-corp.vercel.app`](https://macroscope-dashboard-jj9h9ddef-cs-corp.vercel.app) (`HTTP 200 OK`)
  - **Despliegue de fusión del PR #9**: `dpl_9VAZYAnYK1xQdrSBFUEj15mp1MMk` · Estado **`READY`** · `target: production` · `githubCommitSha: 44fb8310db60aa2bc86bff3baea7c0fa8fa6d997` · URL inmutable: [`https://macroscope-dashboard-jmef8vdsk-cs-corp.vercel.app`](https://macroscope-dashboard-jmef8vdsk-cs-corp.vercel.app) (`HTTP 200 OK`)

#### 6.3.2 Comparación Criptográfica (SHA-256) de Assets Desplegados vs. Revisión Local
Se verificó por HTTP contra `https://macroscope-dashboard.vercel.app` que todos los archivos HTML, CSS y JS nuevos y modificados coinciden byte a byte (normalizando saltos de línea LF) con la revisión implementada:
- `index.html`: `HTTP 200` · `match=true` (`sha256: 994051fa7b4ceba2...`)
- `css/tokens.css`: `HTTP 200` · `match=true` (`sha256: c9a5062a90711aff...`)
- `css/experiences.css`: `HTTP 200` · `match=true` (`sha256: 93fd0f28f8d2cdc1...`)
- `js/services/models-engine.js`: `HTTP 200` · `match=true` (`sha256: c82c1988f46a798e...`)
- `js/ui/experiences.js`: `HTTP 200` · `match=true`
- `js/ui/islm-lab.js`: `HTTP 200` · `match=true` (`sha256: bf4c09317af3c768...`)
- `js/ui/student-views.js`: `HTTP 200` · `match=true` (`sha256: 4cb2bd6e42fe4f4a...`)
- `js/app.js`: `HTTP 200` · `match=true` (`sha256: f019c7c5a9e527ea...`)

#### 6.3.3 Verificación en Vivo del Endpoint Serverless `/api/bcrp` en Producción
Se comprobó el funcionamiento real de la función serverless `api/bcrp.js` desplegada en `https://macroscope-dashboard.vercel.app/api/bcrp`:
1. **Series mensuales oficiales (`PD04722MM-PN01273PM-PN01207PM-PN00027MM`)**:
   - `GET https://macroscope-dashboard.vercel.app/api/bcrp?codes=PD04722MM-PN01273PM-PN01207PM-PN00027MM&start=2024-1&end=2025-12` → **`HTTP 200 OK`** (`6,861 bytes`, JSON normalizado con las 4 series oficiales del BCRP en tiempo real).
2. **Serie trimestral de PBI real (`PN02507AQ`)**:
   - `GET https://macroscope-dashboard.vercel.app/api/bcrp?codes=PN02507AQ&start=2024-1&end=2025-4` → **`HTTP 200 OK`** (`728 bytes`, JSON normalizado con `"period":"T1.24","date":"2024-01-01","value":1.48969668620424`, etc.).
3. **Validación de parámetros y allowlist**:
   - Solicitudes con separadores no permitidos o formato de periodo inválido devuelven **`HTTP 400`** con mensaje estructurado (`{"error":"Códigos no permitidos"}` / `{"error":"Periodo inválido; use AAAA-M"}`).

#### 6.3.4 Verificación Remota en Navegador Real (Playwright contra Producción e Inmutable)
Se ejecutó Playwright (`chromium`) directamente contra `https://macroscope-dashboard.vercel.app` y la URL inmutable `https://macroscope-dashboard-jj9h9ddef-cs-corp.vercel.app`:
- **Recorrido de las 7 experiencias + secciones transversales en escritorio (`1440×900`) y móvil (`360×780`)**:
  - `#inicio` (*"Explora la economía, comprende los datos, simula decisiones"*), `#aprendizaje` (*"Aprendizaje guiado"*), `#historico` (*"Análisis histórico"*), `#indicadores` (*"Indicadores macroeconómicos"*), `#exploracion` (*"Panorama macroeconómico"*), `#comparacion` (*"Comparación de economías"*), `#simulacion` (*"IS–LM–BP y Mundell–Fleming."*), `#modelos` (*"Modelos y tendencias"*), `#observatorio` (*"Observatorio del Perú"*), `#fuentes` (*"Buscar fuentes"*) y `#ayuda` (*"Ayuda"*).
  - **Errores de ejecución**: `pageErrors: []` (`0`), `consoleErrors: []` (`0`).
  - **Interacción en vivo**: Selección de modelo `asad` (*"Oferta y Demanda Agregada (OA–DA)"*) en `#modelos` y guardado de escenario en `#simulacion` (`#simSaveCurrentBtn` → `[data-load-sim]` creado y operable). Durante la prueba en `360px` tras guardar un escenario, se detectó y corrigió en `js/ui/experiences.js` un ajuste de `white-space: normal; flex-wrap: wrap` en el chip de escenario guardado para asegurar `0px` de desbordamiento horizontal en móvil incluso con chips de escenarios almacenados.
- **Limitaciones reales vigentes**:
  1. **Módulo 03 (`#indicadores`)**: Contiene 13 series oficiales verificadas (10 WDI + 3/4 BCRP en snapshot y `PN02507AQ` activa en producción vía `/api/bcrp`) y **2 fichas DEMO explícitamente etiquetadas** (`DEMO.FISCAL.RESULT` y `DEMO.FIN.CREDIT`).
  2. **Módulo 07 (`#modelos`)**: Cuenta con **3 modelos con motor matemático activo** (`islm`, `asad`, `micro-sd`) y **2 modelos en modo esquema conceptual interactivo** (`phillips` y `solow`), identificados explícitamente en la interfaz.
  3. **Modo sin conexión (`file://` o sin red)**: La serie trimestral `PN02507AQ` depende del proxy `/api/bcrp` (activo y verificado con `HTTP 200` en el despliegue de Vercel); en ejecución local sin conexión no emplea datos inventados y se muestra como `Sin dato local`.


