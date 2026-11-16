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


## Correcciones de la revisi?n t?cnica (2026-11-15)

- **Lectura de Aprendizaje:** el mecanismo se deriva de las mismas rectas IS, LM y BP y de los equilibrios E?/E?/E? que recibe el renderer. Distingue desplazamientos de curvas, movimientos del producto/tasa y ajuste externo; contempla gasto negativo/positivo, pol?tica monetaria, combinaciones, shocks externos y ausencia de cambios. La teor?a y la evaluaci?n del escenario original de la lecci?n permanecen identificadas aparte. En econom?a cerrada se deshabilita y reinicia el shock i*; con cambio fijo se conserva el control monetario deshabilitado por dinero end?geno.
- **Ampliaci?n m?vil compartida:** di?logo de pantalla completa hasta 860 px, encabezado compacto, selector ?nicamente cuando hay varios gr?ficos, cierre accesible y explicaci?n desplegable bajo el gr?fico. El canvas tiene entre 360 y 520 px de altura seg?n el viewport. Las escalas ampliadas son de 13,4 px y las etiquetas de barras/categor?as aumentan tambi?n. El Laboratorio conserva sus dimensiones y tipograf?a existentes.
- **Medici?n local en Chromium:** en 360?800 el trazado de Modelos pasa de 216?242 a 252?412 px (1,99 veces el ?rea); en Pol?tica de 220?242 a 252?412 px (1,95 veces). En 390?800 Pol?tica pasa de 250?242 a 282?412 px (1,92 veces). Estos valores corresponden a las configuraciones del recorrido de regresi?n, con fuentes locales sin conexi?n.
- **Regresi?n:** `node tests/learning-reading-zoom.mjs`, integrado en `npm test`, comprueba direcci?n y ausencia de cambios, combinaci?n fiscal/monetaria, shocks i* positivos/negativos, reg?menes, ?rea ?til ampliada, escalas, etiquetas dentro del lienzo, acceso a supuestos, selector individual, foco y ausencia de desbordamiento en 360/390 px claro/oscuro. El test espera el repintado real de ResizeObserver antes de comparar geometr?a tras cambiar el viewport.

Evidencia de las correcciones:

- [Lectura din?mica ante una contracci?n fiscal](../evidence/diagramas-compartidos/lectura-contraccion.png)
- [Modelos ampliados a 360 px](../evidence/diagramas-compartidos/ampliacion-modelos-360.png)
- [Pol?tica ampliada a 390 px, tema oscuro](../evidence/diagramas-compartidos/ampliacion-politica-390-oscuro.png)

Se mantiene el l?mite de verificaci?n: sin comprobaci?n en Safari/iOS f?sico. La actualizaci?n del PR no equivale a publicaci?n en producci?n.

Validaci?n local de las correcciones: `npm test` termin? con c?digo 0 (smoke, 85 unitarias, 89 E2E, 7 t?ctiles, 7 escenarios de etapas, Pol?tica, diagramas compartidos y los 15 casos nuevos). Los tres motores econ?micos permanecen sin diferencias.
