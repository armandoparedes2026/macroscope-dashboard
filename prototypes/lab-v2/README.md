# Laboratorio Macroeconómico IS–LM–BP y Mundell–Fleming — Prototipo v2 (Pestaña Única)

Prototipo autónomo y funcional ubicado en `prototypes/lab-v2/` (`index.html`, `lab.css`, `lab.js`) que propone el rediseño integral del simulador IS–LM–BP / Mundell–Fleming de **MacroScope** en **una sola pestaña** sin duplicar ni reimplementar la lógica matemática del motor oficial (`../../js/islm-model.js`).

---

## 1. Decisiones de diseño

### 1.1. Disposición en una sola pestaña y jerarquía visual
- **Escritorio (`1440px`, `.lab-workspace`)**:
  - **Panel lateral izquierdo de parámetros (`376px`, `.lab-sidebar`)**: divide con claridad conceptual los supuestos institucionales de las perturbaciones:
    - **Sección A · Configuración de la economía**: selector de país/contexto institucional (Perú · BCRP, Chile · BCCh, Colombia · BanRep, México · Banxico, Brasil · BCB, EE. UU. · Fed y Estándar académico), régimen cambiario (`flex`, `fixed`, `closed`), movilidad internacional de capital (`none`, `low`, `high`, `perfect`) e instrumento monetario (`money`, `rate`), acompañado de un aviso dinámico del **Trilema de Mundell** (`#trilemmaCallout`) y de la nota explícita de **valores ilustrativos por defecto** (`i₀ = 4%`, `i*₀ = 3%`, `CC₀ = −2%`, `P = 1`).
    - **Sección B · Experimentación interactiva**: controles deslizantes agrupados y plegables (`<details class="exp-details">`) en 5 bloques con contador de cambios activos por grupo:
      1. *Política fiscal* (`G`, `T0`) — Controlable · `IS`
      2. *Política monetaria* (`Mpct`, `ipol`) — Controlable · `LM`
      3. *Política cambiaria* (`ebar`) — Controlable · `ē` (activo solo en régimen fijo)
      4. *Shocks externos y confianza* (`istar`, `rho`, `Ystar`, `nxShock`, `confShock`) — Exógeno · `BP / IS`
      5. *Parámetros estructurales* (`c`, `t`, `b`, `h`, `m`, `n`) — Pendientes y sensibilidades
  - **Zona central (`.lab-stage`)**:
    - **Barra de capas y convención gráfica (`.canvas-toolbar`)**: permite mostrar/ocultar de forma independiente las curvas `IS / IS* / DA`, `LM / LM* / M`, `BP / Paridad`, el estado inicial punteado (`E₀`), el punto hueco de impacto (`E₁`), las flechas causales y la superposición del `Escenario A`.
    - **Rejilla 2×2 de los 4 diagramas enlazados (`.diagrams-grid`)**:
      1. **Equilibrio IS–LM–BP** en `(Y, i)`
      2. **Mundell–Fleming (IS*–LM*)** en `(Y, e)` con `↑e = depreciación`
      3. **Mercado Monetario** en `(M/P, i)`
      4. **Cruz Keynesiana (Mercado de bienes)** en `(Y, DA)` con recta de `45° (Y = DA)`
    - **Franja inferior de resultados (`.results-strip`)**: tarjetas ejecutivas de las 4 variables nucleares (`Y`, `i`, `e`, `M/P`), tabla comparativa completa (`Inicial E₀`, `Impacto E₁`, `Final E₂`, `Δ (E₂ − E₀)` y columnas de comparación `Escenario A` y `Dif. B − A`), tarjetas de **multiplicadores efectivos** del régimen y **mecanismo de transmisión paso a paso** (`E₀ → E₁ → E₂`).

### 1.2. Adaptabilidad en Tablet (`768px`) y Móvil (`390px` / `360px`)
- **Hoja/acordeón de parámetros sin solapamiento**: por debajo de `1120px`, el panel lateral se recoge en una hoja plegable controlada por la barra `.mobile-control-strip` (`#btnMobileParams`), que informa en todo momento el régimen activo y el número de perturbaciones aplicadas.
- **Diagramas en carrusel interactivo o pila vertical**: por debajo de `820px` (`768px`, `390px`, `360px`), la barra `.mobile-diagrams-bar` ofrece pestañas directas (`1 · IS–LM–BP`, `2 · IS*–LM*`, `3 · Dinero`, `4 · Cruz`), botones `← Anterior / Siguiente →` y el conmutador `#btnMobileLayoutMode` para alternar entre **vista de carrusel (1 a 1)** y **vista en pila (los 4 diagramas apilados)**.
- **Cero desborde horizontal (`overflow = 0px`)**: verificado programáticamente en `1440px`, `768px`, `390px` y `360px`.

### 1.3. Codificación gráfica, animación y accesibilidad
- **Motor real sin duplicación**: consume exclusivamente `globalThis.ISLM` (`createModel`, `normalizeConfig`, `availableInstruments`) desde `../../js/islm-model.js`.
- **Semántica visual uniforme**:
  - Curvas iniciales en `E₀`: trazo discontinuo (`[6, 5]`) con subíndice `₀`.
  - Curvas finales en `E₂`: trazo continuo de mayor grosor con subíndice `₁`.
  - Equilibrio de impacto `E₁` (`solve(u, 'impact')`): **punto hueco** que visibiliza el desequilibrio externo previo al ajuste del tipo de cambio `e` (en flotación) o de las reservas `M/P` (en tipo fijo).
  - **Flechas causales en el lienzo**: vector dirigido desde la curva inicial hacia la curva final acompañado de una etiqueta en píldora con el motivo económico del desplazamiento (p. ej. `IS: ↑G (+3.0) + ajuste e (aprec.)`, `L(Y): ↑Y (+0.9)`, `DA: ↑G (+3.0), ↑i, ↓e`).
- **Interpolación suave (`~400ms`) y `prefers-reduced-motion`**: cada cambio interpola los coeficientes `(a, b, c)` de las rectas y las coordenadas de `E₁` y `E₂` mediante `requestAnimationFrame` con *cubic ease-out*, y se desactiva automáticamente cuando el sistema operativo o navegador reporta `prefers-reduced-motion: reduce`.

---

## 2. Capturas de pantalla (`prototypes/lab-v2/screenshots/`)

| Archivo | Resolución | Descripción |
| :--- | :---: | :--- |
| [`screenshots/lab-v2-1440px.png`](screenshots/lab-v2-1440px.png) | `1440 × 1080` | Vista de escritorio en modo oscuro: panel lateral izquierdo (Sección A y Sección B plegable), rejilla central 2×2 con los 4 diagramas enlazados y franja inferior de resultados, multiplicadores y transmisión paso a paso. |
| [`screenshots/lab-v2-1440px-light.png`](screenshots/lab-v2-1440px-light.png) | `1440 × 1080` | Vista de escritorio en modo claro editorial (`data-theme="light"`), mostrando los tokens cromáticos de alto contraste AA sobre papel cálido. |
| [`screenshots/lab-v2-768px.png`](screenshots/lab-v2-768px.png) | `768 × 1024` | Vista de tablet: parámetros recogidos en la barra de hoja/acordeón superior, selector de diagrama con conmutador carrusel/pila y síntesis cuantitativa completa sin scroll horizontal. |
| [`screenshots/lab-v2-390px.png`](screenshots/lab-v2-390px.png) | `390 × 844` | Vista móvil estándar (390px): controles superiores adaptados en flujo flexible, carrusel de diagramas y tarjetas de equilibrio en rejilla 2×2 compacta. |
| [`screenshots/lab-v2-360px.png`](screenshots/lab-v2-360px.png) | `360 × 800` | Vista móvil compacta (360px): verificación extrema sin solapamiento de controles ni desborde horizontal (`scrollWidth === innerWidth`). |

---

## 3. Componentes reutilizables para la integración en `index.html`

Para llevar este prototipo al dashboard principal sin introducir dependencias externas, los componentes se diseñaron de forma desacoplada:

1. **Tokens de diseño y paleta semántica de curvas (`lab.css` → `:root` y `[data-theme="light"]`)**:
   - Variables CSS `--curve-is`, `--curve-lm`, `--curve-bp`, `--curve-da`, `--curve-scena`, `--eq-e0`, `--eq-e1`, `--eq-e2` que unifican el color de cada mercado entre los controles del acordeón, los chips de capas y el trazado en `<canvas>`.
2. **Renderizador Canvas 2D con flechas causales (`renderCanvasDiagram`, `computeShiftArrow`, `drawRoundedBadge` en `lab.js`)**:
   - Recibe una especificación declarativa `{ x, y, curves, arrows, points, emptyMessage }` sobre las rectas `{ a, b, c }` devueltas por `ISLM.createModel().curves`.
   - Calcula automáticamente los puntos de anclaje y dibuja flechas vectoriales con etiquetas en píldora sin colisionar con los títulos de los ejes.
3. **Motor de interpolación de estados (`buildTargetSnapshot`, `interpolateSnapshots`, `animateToCurrentModel` en `lab.js`)**:
   - Interpola en `400ms` (`requestAnimationFrame`) entre el estado previo (o el equilibrio base `E₀`) y el nuevo estado final `E₂`, respetando `window.matchMedia('(prefers-reduced-motion: reduce)')`.
4. **Comparador de escenarios A/B (`state.scenarioA`, `#btnCompareToggle`, `#btnClearCompare`)**:
   - Guarda una instantánea inmutable del equilibrio `E₂(A)`, sus curvas y sus multiplicadores, superponiendo la referencia en los 4 diagramas y añadiendo las columnas `Escenario A (E₂)` y `Dif. (B − A)` en la tabla de resultados.
5. **Cajón pedagógico contextual «¿Por qué?» (`#whyDrawer`, `openWhyDrawer`, `renderWhyDrawerContent`)**:
   - Modal/drawer accesible (`role="dialog"`, `aria-modal="true"`, cierre con `Escape` y clic en fondo) con pestañas por mercado que traduce los desplazamientos numéricos actuales en intuición económica y ecuaciones explícitas.
