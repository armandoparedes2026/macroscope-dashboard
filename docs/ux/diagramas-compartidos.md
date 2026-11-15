# Diagramas interactivos compartidos (Aprendizaje, Modelos y Política económica)

**Fecha:** 2026-11-15  
**Rama:** `cristivenog88-prog/harmonia-final` (base `48a74ff139fa9661ffe30271e7981533c9318d4f`)  
**Plan de referencia:** [2026-11-15-diagramas-compartidos.md](../superpowers/plans/2026-11-15-diagramas-compartidos.md)

## Objetivo

Unificar los gráficos económicos interactivos de **Aprendizaje**, **Modelos** y **Política económica** sobre el mismo motor de renderizado `<canvas>`, animación de transición entre etapas, agrupación de curvas coincidentes y diálogo accesible de ampliación que utiliza el Laboratorio IS–LM–BP (`drawDiagram` en `js/ui/charts.js`), adaptando cada vista a su marco analítico y sin modificar los motores económicos existentes.

## Arquitectura implementada

1. **Servicio compartido (`js/ui/economic-diagrams.js`, `css/economic-diagrams.css`):**
   - `MacroScope.animateEconomicDiagram` y `MacroScope.diagramStageLines`: animación temporal de `400 ms` con soporte `prefers-reduced-motion`, salto de animación si el canvas está oculto o cambia de naturaleza geométrica/ejes, y atributos `data-curves`, `data-points`, `data-bars` y `data-animating` reflejando la geometría enviada al renderer.
   - `MacroScope.EconomicDiagrams.mount(host, id, title, spec, options)` y `.open(group, trigger)`: montaje persistente de tarjeta con controles de etapa (`Inicial`, `Impacto`, `Final`, agrupando curvas coincidentes), sincronización en vivo con `#economicZoomDialog` / diálogos específicos sin reconstruir el `<canvas>` ampliado durante arrastres continuos (`input`), cierre por `Escape`/backdrop y restauración segura de foco (con respaldo `originId`).
   - Observadores de redimensionamiento (`ResizeObserver`), cambio de tema (`data-theme`) y visibilidad de sección (`body[hidden]` / `[hidden]`) sin reiniciar animaciones activas.
2. **Adaptadores económicos (`js/ui/economic-diagram-specs.js`):**
   - `islm(model, patch)`: genera `E₀`, impacto `E₁` y equilibrio final `E₂` usando `ISLMModel` sin acoplar el estado global del Laboratorio.
   - `asad(input)`: genera equilibrio OA–DA con corto plazo (`E₁`) y ajuste de medio plazo (`E₂` sobre `OALP`) usando `ModelsEngine`.
   - `supplyDemand(input)`: equilibrio parcial estático (`E₀` base y `E₂` final, sin etapa intermedia artificial), incluyendo cuña fiscal (`τ`) sobre el precio al productor (`Ps`).
   - `conceptual(id, shift)`: curvas conceptuales normalizadas para Phillips (con expectativas) y Solow–Swan (trayectorias `path` sin tratamiento de recta en flechas, explicitadas como esquemas conceptuales).
   - `policyMarket(result)` y `welfare(result)`: equilibrio comercial estático (`E₀`/`E₂`) y barras de bienestar en unidades monetarias (`UM`) con eje horizontal en cero cuando hay variaciones positivas y negativas.
3. **Renderer base (`js/ui/charts.js`) y Laboratorio (`js/ui/islm-lab.js`):**
   - Soporte extendido en `drawDiagram` para curvas `path`, barras/categorías con sujeción de etiquetas en anchos móviles (`<300 px`) y flechas únicamente entre etapas presentes (`[0, 2]` en estática, `[0, 1, 2]` en ajuste en dos etapas).
   - `islm-lab.js` delega animación y formato de etapas al servicio compartido manteniendo sus filtros de capas y cálculos intactos.
4. **Integración por módulo (`js/ui/experiences.js` y `js/ui/policy.js`):**
   - **Aprendizaje (`#apDiagramContainer`, id `learning-equilibrium`):** sustitución de SVG previo por `EconomicDiagramSpecs.islm`; sliders (`#apSliderG`, `#apSliderM`, `#apSliderIstar`) y selector `#apRegimeSelect` actualizan en vivo con evento `input` (manteniendo `change`), conservando nodos del DOM y coherencia de ΔM deshabilitado en tipo de cambio fijo. `renderAllExperiences()` evita reconstruir el módulo en segundo plano si el host ya está montado.
   - **Modelos (`#modSvgContainer`, ids `models-*`):** sustitución de SVGs de los 5 modelos; handlers `input`/`change` en vivo sin destruir sliders; en `islm` se reemplaza `#modAsadZ` por `#modIslmM` para choque monetario real; se preserva la serie empírica WDI en `#modTrendCanvas`.
   - **Política económica (`#policy-market`, `#policy-welfare`, `#policy-macro-chart`):** mercado y bienestar comparten `group: 'policy-trade'` (`dialogId: 'policyZoomDialog'`, primer botón `policy-zoom`) sin botón ni diálogo duplicado; macroeconomía añade `#policy-macro-chart` persistente fuera de `#policy-macro-result` con su propio grupo `policy-macro`.

## Integridad de motores económicos

Se verificó `git diff` vacío tras la implementación en:
- `js/islm-model.js`
- `js/services/models-engine.js`
- `js/policy-model.js`

## Evidencia visual seleccionada

- [Aprendizaje — escritorio claro](../evidence/diagramas-compartidos/aprendizaje-escritorio.png)
- [Aprendizaje — móvil 390 px claro](../evidence/diagramas-compartidos/aprendizaje-movil.png)
- [Modelos (OA–DA) — escritorio claro](../evidence/diagramas-compartidos/modelos-escritorio.png)
- [Modelos (OA–DA) — escritorio 1672 px oscuro](../evidence/diagramas-compartidos/modelos-oscuro.png)
- [Política económica (comercio y bienestar) — escritorio claro](../evidence/diagramas-compartidos/politica-comercio-escritorio.png)
- [Política económica (comercio y bienestar) — móvil 360 px oscuro](../evidence/diagramas-compartidos/politica-comercio-movil-oscuro.png)
- [Política económica (mezcla macroeconómica IS–LM–BP) — escritorio claro](../evidence/diagramas-compartidos/politica-macro-escritorio.png)

## Verificación ejecutada

Suite completa ejecutada tras la integración de código y actualización de pruebas (`tests/economic-diagrams.mjs` integrada en `npm test` y `tests/e2e.mjs` actualizada a `<canvas>` / `data-curves` / `data-points`):

- `npm run test:smoke` (`tests/smoke.mjs`): 34 controles y 34 archivos JS válidos, referencias locales e integridad SRI verificadas.
- `npm run test:unit`: 85 pruebas unitarias aprobadas (`pass 85, fail 0`).
- `npm test`:
  - `tests/smoke.mjs` — verde
  - `node --test tests/unit.mjs` — 85/85 verde
  - `tests/e2e.mjs` — 89 comprobaciones verde (incluyendo intersecciones OA–DA e Oferta–Demanda en `<canvas>`)
  - `tests/landing-touch.mjs` — 7 verificaciones táctiles verde
  - `tests/lab-stages.mjs` — 7 escenarios, 3 etapas, retorno y zoom verde
  - `tests/policy-e2e.mjs` — instrumentos, paquetes, persistencia, exportación, macro, casos y ocho destinos verde
  - `tests/economic-diagrams.mjs` — input continuo, etapas, zoom sincronizado y restauración de foco, `reduced-motion`, 5 modelos, macro política y auditoría sin desbordamiento en `360`/`390`/`1440`/`1672` claro/oscuro verde

## Alcance y límites

- **Safari / iOS físico:** no verificado en dispositivo físico Apple/WebKit; las pruebas automatizadas corrieron en Chromium/Playwright sobre Windows.
- **Vista previa / producción remota (Vercel):** se amplió el utilitario local ignorado `test-results/verify-release.mjs` con los nuevos assets (`js/ui/economic-diagrams.js`, `js/ui/economic-diagram-specs.js`, `css/economic-diagrams.css`) y `tests/economic-diagrams.mjs`, pero no se ejecutó despliegue ni verificación contra URL pública/preview al no contar con despliegue/tokens en esta sesión; requiere verificación en CI / preview del PR.
