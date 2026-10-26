# Comparación de economías Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una pantalla independiente de comparación internacional basada en los datos reales existentes, próxima a la composición de la imagen aprobada.

**Architecture:** Ruta hash adicional y un módulo JS autocontenido `js/ui/comparison-dashboard.js` que lee `MacroScope.runtimeDB` y `MacroScope.runtimeSource`. Los estilos se encapsulan en `css/comparison.css`; la recarga de WDI llama al render existente, extendido con una sola invocación opcional.

**Tech Stack:** HTML, CSS, JavaScript clásico, Chart.js/respaldo canvas, Node test, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-25-comparacion-premium-design.md`

## Global Constraints

- No inventar ni interpolar estadísticas y conservar fechas, unidades y procedencia.
- Solo hasta cuatro países, uno como mínimo; comparaciones de valor anual WDI.
- Mantener tema, rutas existentes, accesibilidad y compatibilidad con respaldo sin conexión.
- Probar a 360/390/768/1440 px y respetar `prefers-reduced-motion`.

## Review Focus

- País duplicado o eliminación del último país: no crear selección inválida — prueba de normalización.
- Sin año común: ranking y textos señalan carencia, nunca extrapolan — prueba de disponibilidad.
- Datos `null` o cero: no convertir ausencia en 0 — prueba de series.
- Revisión de WDI durante sesión: actualiza la pantalla — E2E de render tras actualización.
- Móvil estrecho: sin overflow de documento — E2E con 360 px.

---

### Task 1: selectors puros y pruebas

**Files:** Crear `js/services/comparison-dashboard-data.js`; crear `tests/comparison-dashboard.test.mjs`; modificar `package.json`.

**Interfaces:** `normalizeCountries(codes, available, limit=4)`, `commonLatestYear(db,codes,indicator,years)`, `rankCountries(db,codes,indicator,year)`, `buildEconomySummary(db,codes,indicator,years,metadata)` exportados en `MacroScope.compareDashboardData`.

- [x] Escribir tests de normalización, año común, ausencias y narrativa; identificar la función que rompería cada test.
- [x] Ejecutar test para observar errores por funciones ausentes.
- [x] Implementar funciones puras y ejecutar test hasta verde.
- [x] Ejecutar suite de unidad y registrar resultados.
- [x] Commit del bloque.

### Task 2: ruta y estructura del dashboard

**Files:** Modificar `index.html`, `js/ui/student-views.js`, `js/app.js`, `tests/e2e.mjs`, `tests/smoke.mjs`.

**Interfaces:** `#comparacion`, `M.renderComparisonDashboard()`; nuevo HTML con ids prefijados `cd-`.

- [x] Escribir E2E que navega desde Inicio y encuentra estructura, controles y datos existentes; ejecutar RED.
- [x] Añadir ruta y sección visual semántica; vincular sincronización y tema; ejecutar GREEN.
- [x] Comprobar que el resto de rutas sigue navegando y commit.

### Task 3: interactividad y gráficos reales

**Files:** Crear `js/ui/comparison-dashboard.js`, `css/comparison.css`; ampliar `tests/e2e.mjs`.

**Interfaces:** Filtros, selección de países, indicador, modos de presentación, gráficos, ranking, tabla, lecturas y exportación CSV.

- [x] Crear E2E de selección, año común, modos, procedencia, CSV y móvil; ejecutar RED.
- [x] Implementar render de KPIs con sparklines, gráfica histórica, mapa contextual, ranking, dispersión, desempleo, tabla y narrativa.
- [x] Implementar responsive, dark, foco y movimiento reducido; ejecutar GREEN.
- [x] Comprobar build/smoke y commit.

### Task 4: verificación visual y cierre

**Files:** Ampliar `README.md` y evidencias en `docs/evidence/comparacion-premium/`.

- [x] Ejecutar `npm test` completo con Playwright y capturar escritorio/móvil claro/oscuro. 51 pruebas unitarias y 61 comprobaciones E2E.
- [x] Inspeccionar capturas, corregir contraste/overflow y reejecutar pruebas. Auditoría visual sin errores ni scroll horizontal en 360–1680 px.
- [x] Comparar el estado final con la especificación, registrar limitaciones y realizar commit.
- [ ] Crear PR de la rama sin fusionar con `main`.
