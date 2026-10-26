# Panorama Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir Panorama híbrido premium con seis indicadores auditables y nuevas conexiones BCRP, preservando el resto de Macroscope.

**Architecture:** Un módulo de datos derivado, separado del cliente/proxy BCRP, calcula los KPI usando series observadas y metadatos de origen. Una vista nueva de Panorama reutiliza Chart.js, los filtros y los datos WDI existentes, y conserva las herramientas detalladas debajo.

**Tech Stack:** HTML5, CSS3, JavaScript nativo, Node 22, Chart.js 4, API REST WDI y proxy Vercel BCRP, pruebas `node --test` y Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-panorama-premium-design.md`

## Global Constraints

- Nunca cambiar `main`, Inicio, simulador ni navegación global.
- Cada dato muestra unidad, fecha de observación, fuente y si es respuesta oficial o respaldo.
- No inventar gráficos, cifras, desempleo urbano, acumulados incompletos o causalidad.
- No añadir dependencias de producción o API keys; mantener responsive, foco y reducción de movimiento.

## Review Focus

1. API BCRP responde sin periodos o con título distinto: no pintar un valor erróneo; prueba de parser.
2. Balanza comercial tiene menos de 12 meses completos: N/D para el acumulado; prueba de agregación.
3. Un país distinto de Perú se selecciona: KPI nacionales BCRP no deben presentarse como pertenecientes a ese país; prueba de presentación.
4. API caída parcial: mostrar series disponibles con estado propio sin esconder origen; prueba de estado.
5. Teclado y pantalla de 390 px: segmentación y tarjetas navegables sin overflow horizontal; prueba E2E.

---

### Task 1: BCRP series data contract

**Files:** `api/bcrp.js`, `tests/bcrp.test.mjs`, `docs/fuentes-bcrp.md`

**Interfaces:** Extender `SERIES`, `parseBcrp(raw,codes,fetchedAt)` con periodicidad trimestral; los periodos pasan a `{period,date,value}` en orden cronológico.

- [ ] **Step 1:** Añadir pruebas fallidas para `PN02507AQ`, `PD38045AM`, `PN38723BM`, formato trimestral `T1.2026`, validación de título y nulos.
- [ ] **Step 2:** Ejecutar `node --test tests/bcrp.test.mjs`; comprobar fallo esperado.
- [ ] **Step 3:** Extender lista permitida de series y parser de trimestre sin cambiar contrato mensual existente; documentar códigos.
- [ ] **Step 4:** Ejecutar pruebas y asegurar PASS.
- [ ] **Step 5:** Commit `feat(data): support official BCRP panorama series`.

### Task 2: Panorama time-series model and loader

**Files:** `js/services/panorama-data.js`, `js/services/panorama-client.js`, `tests/panorama-data.test.mjs`, `index.html`

**Interfaces:** `M.buildPanoramaMetrics({country,wdi,source,bcrp}) -> {cards,charts,asOf}`; `M.loadPanoramaBcrp() -> Promise<void>` consulta mensual y trimestral por separado, publica `M.panoramaBcrp` y `M.renderPanorama()`.

- [ ] **Step 1:** Escribir pruebas de acumulado de 12 meses, último dato observado, deltas comparables, N/D, país no Perú y fallos parciales.
- [ ] **Step 2:** Ejecutar `node --test tests/panorama-data.test.mjs`; comprobar fallo esperado.
- [ ] **Step 3:** Implementar transformaciones puras, cliente con abort/reintentos acotados y status por serie; integrar scripts en orden correcto.
- [ ] **Step 4:** Ejecutar pruebas y asegurar PASS.
- [ ] **Step 5:** Commit `feat(data): derive transparent panorama indicators`.

### Task 3: Hybrid premium dashboard structure

**Files:** `index.html`, `js/ui/panorama-premium.js`, `js/app.js`, `css/panorama.css`, `css/tokens.css`, `tests/smoke.mjs`

**Interfaces:** `M.renderPanorama()` actualiza tarjetas/gráficos/lectura; `M.setupPanorama()` registra controles una sola vez. IDs existentes de WDI/ISLM conservados.

- [ ] **Step 1:** Añadir pruebas smoke para nodos, scripts, indicadores y protección del contenido existente.
- [ ] **Step 2:** Ejecutar `node tests/smoke.mjs` y comprobar fallo esperado.
- [ ] **Step 3:** Montar encabezado, controles, tarjetas, segmentos, dos gráficos, lectura contextual y sección de detalle; estilos acotados a `.panorama-premium`.
- [ ] **Step 4:** Conectar `renderAll`, `syncLiveWorldBankData`, `loadPanoramaBcrp` y eventos en app.js; ejecutar smoke.
- [ ] **Step 5:** Commit `feat(ui): add responsive premium Panorama`.

### Task 4: Chart behavior and verification

**Files:** `js/ui/panorama-premium.js`, `css/panorama.css`, `tests/e2e.mjs`, `README.md`, `docs/fuentes-bcrp.md`

**Interfaces:** Segmented controls choose activity/prices/labor/external; time-window dropdown restricts displayed data without recomputing history; reports use observed figures only.

- [ ] **Step 1:** Añadir E2E para segmentos, selección país, tarjetas, teclado, tema oscuro y ancho móvil; fallos de red muestran N/D sin datos de muestra.
- [ ] **Step 2:** Ejecutar E2E y comprobar falla específica.
- [ ] **Step 3:** Completar gráficos interactivos, etiquetas, responsive, focus, `reduced-motion` y documentación.
- [ ] **Step 4:** Ejecutar `npm test`, contrastar capturas desktop/mobile y reparar regresiones.
- [ ] **Step 5:** Commit `test: verify premium Panorama and source boundaries`.

### Task 5: Branch handoff

**Files:** sólo documentación si surge una limitación no resuelta.

- [ ] **Step 1:** Revisar `git diff --check`, `git status` y resumen de cambios contra `main`.
- [ ] **Step 2:** Confirmar que los cambios afectan Panorama, BCRP y tests, sin tocar Inicio.
- [ ] **Step 3:** Publicar rama y PR sólo si están disponibles los permisos de GitHub; no fusionar ni desplegar a producción.
