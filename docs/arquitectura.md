# Arquitectura de MacroScope

## Visión general de las Siete Experiencias

MacroScope está organizado en torno a **siete experiencias principales** accesibles desde las siete tarjetas de la portada orbital (`#inicio`) más tres secciones transversales:

1. **Módulo 01 — Aprendizaje guiado (`#aprendizaje`)**: Consume `LAB_CONTENT.SCENARIOS`, `ISLM.createIslmModel` y `LAB_CONTENT.gradePrediction` desde `js/ui/experiences.js`, almacenando el avance real del estudiante en `localStorage` (`macroscope_learning_progress_v1`).
2. **Módulo 02 — Análisis histórico (`#historico`)**: Utiliza la función pura `MacroScope.buildHistoricalAnalysis` y `MacroScope.HISTORICAL_MILESTONES` definidos en `js/services/models-engine.js` para calcular subperiodos A/B, variaciones, índices base 100 (solo para niveles positivos) y medias móviles de 3 observaciones sin interpolar huecos (`null`).
3. **Módulo 03 — Indicadores macroeconómicos (`#indicadores`)**: Consume `MacroScope.INDICATOR_CATEGORIES`, `MacroScope.INDICATORS_CATALOG` y `MacroScope.resolveIndicatorSeries` (`js/services/models-engine.js`), separando estrictamente series oficiales verificadas (WDI / BCRP) de fichas demostrativas identificadas (`isDemo: true`).
4. **Módulo 04 — Exploración macroeconómica (`#exploracion` / `#panorama`)**: Implementado en `js/services/panorama-data.js`, `js/services/panorama-client.js`, `js/ui/panorama-premium.js` y `js/ui/overview.js` sobre `#tab-overview`.
5. **Módulo 05 — Comparación de economías (`#comparacion`)**: Implementado en `js/services/compare.js`, `js/services/comparison-dashboard-data.js`, `js/services/comparison-map-data.js` y `js/ui/comparison-dashboard.js`.
6. **Módulo 06 — Simulación de escenarios (`#simulacion` / `#laboratorio`)**: Implementado en `js/islm-model.js`, `js/lab-content.js` y `js/ui/islm-lab.js` sobre `#tab-simulator`, con guardado local de escenarios en `macroscope_saved_scenarios_v1`.
7. **Módulo 07 — Modelos y tendencias (`#modelos`)**: Consume `MacroScope.MODELS_LIBRARY`, `MacroScope.createAsAdModel` (motor matemático OA–DA) y `MacroScope.createSupplyDemandModel` (motor matemático de oferta y demanda microeconómica) desde `js/services/models-engine.js`, distinguiendo motores matemáticos activos (`status: 'functional'`) de esquemas conceptuales (`status: 'conceptual'`).
8. **Secciones transversales**:
   - **Observatorio del Perú (`#observatorio`)**: Panel nacional especializado basado en series oficiales del BCRP e INEI/OIT.
   - **Biblioteca de fuentes (`#fuentes`)**: Directorio filtrable con panel lateral `Ficha de la fuente` (`#sourceDetailSheet`) y colecciones rápidas en `js/ui/student-views.js`.
   - **Ayuda y glosario (`#ayuda`)**: Guía de uso y glosario interactivo enlazado con los módulos.

## Decisión: scripts clásicos con `defer`, sin compilación y compatibles con `file://`

El contrato de apertura local del proyecto y las pruebas E2E abren `index.html` directamente mediante `file://`. Por ello se conservan scripts clásicos con `defer` sin `type="module"` ni empaquetador. Cada archivo encapsula sus declaraciones en una IIFE en modo estricto y publica sus contratos en **`globalThis.MacroScope`**.

`js/islm-model.js` y `js/lab-content.js` mantienen intactos sus contratos originales para importación directa en Node. Asimismo, `js/services/models-engine.js` es 100% puro e importable en Node sin DOM ni red, probado en `tests/models-engine.test.mjs`.

## Orden de carga en `index.html`

### Hojas de estilo CSS
1. `css/tokens.css`: Variables de diseño armonizadas (paleta Blanco frío / Azul hielo / Cobalto / Azul marino en modo claro y modo oscuro profundo, con contraste WCAG 2.1 AA verificado programáticamente).
2. `css/base.css`: Reset, documento y anillos de foco `:focus-visible`.
3. `css/layout.css`: Topbar y estructura general.
4. `css/components.css`: Componentes compartidos, tablas e inspector.
5. `css/islm.css`: Estilos del simulador IS–LM–BP.
6. `css/students.css`: Estilos de Fuentes y Ayuda.
7. `css/landing.css`: Portada orbital 3D e ilustraciones vectoriales.
8. `css/panorama.css`: Exploración macroeconómica (Panorama).
9. `css/comparison.css`: Comparación de economías.
10. `css/experiences.css`: Estilos unificados de Aprendizaje guiado, Análisis histórico, Indicadores, Modelos y tendencias, Observatorio del Perú y Ficha de la fuente.

### Scripts diferidos (`defer`)
1. `js/islm-model.js` y `js/lab-content.js`
2. `js/config/countries.js`, `js/config/indicators.js`, `js/data/fallback-wdi.js`, `js/data/sources-catalog.js`, `js/config/state.js`
3. `js/services/wdi.js`, `js/services/compare.js`, `js/services/comparison-dashboard-data.js`, `js/services/comparison-map-data.js`, `js/services/bcrp-client.js`, `js/services/panorama-data.js`, `js/services/panorama-client.js`, `js/services/fx.js`, `js/services/models-engine.js`
4. `js/ui/format.js`, `js/ui/charts.js`, `js/ui/overview.js`, `js/ui/panorama-premium.js`, `js/ui/islm-lab.js`, `js/ui/student-views.js`, `js/ui/comparison-dashboard.js`, `js/ui/experiences.js`, `js/ui/landing.js`
5. `js/app.js`

## Enrutador de vistas (`js/ui/student-views.js`)

`MacroScope.route()` soporta tanto las siete rutas canónicas (`#aprendizaje`, `#historico`, `#indicadores`, `#exploracion`, `#comparacion`, `#simulacion`, `#modelos`) como las rutas transversales (`#inicio`, `#observatorio`, `#fuentes`, `#ayuda`) y los alias históricos (`#panorama` y `#laboratorio`). Para `#tab-overview` y `#tab-simulator`, `route()` sincroniza dinámicamente `dataset.view` con el hash activo (`exploracion`/`panorama` y `simulacion`/`laboratorio`), garantizando compatibilidad total con enlaces existentes, botón Atrás/Adelante del navegador y recarga directa con hash y parámetros de consulta (`?id=`, `?indicator=`, `?model=`, `?term=`).
