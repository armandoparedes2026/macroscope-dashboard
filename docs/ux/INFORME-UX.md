# Informe UX y Sistema Visual — MacroScope (Pregrado de Economía)

> **Propósito para Codex:** Este documento concentra todos los hallazgos, el nuevo sistema de tokens (`docs/ux/tokens-propuestos.css`), la decisión sobre el carrusel y la lista priorizada de cambios con archivos y selectores exactos. Prototipo de referencia en `prototypes/inicio/index.html` y `prototypes/inicio/inicio.css`.

---

## 1. Análisis de Referencias Visuales (Qué adoptar y qué descartar)

| Dimensión | `smart-ranch-tingua.cristiven88.chatgpt.site` | `Brochure_Premium_Ancash_2026...html` | Regla de diseño para MacroScope |
| :--- | :--- | :--- | :--- |
| **Jerarquía tipográfica** | Títulos con `letter-spacing: -0.04em` y palabras clave en cursiva serif (`em { font-family: Georgia, serif }`). | Contraste entre `Inter Display` (`740–850`) en titulares y `Georgia` cursiva en conceptos clave. | Mantener `Plus Jakarta Sans` (títulos) + `DM Sans` (cuerpo) + `IBM Plex Mono` (datos/índices) e incorporar `Georgia, serif` del sistema (0 KB) para énfasis conceptual (`<em>`). |
| **Etiquetas numeradas** | Cejas con índice (`01 · EL CAMPO CONECTADO`, `01 / 08`) que ordenan la lectura. | Encabezados `.top-meta` (`01 / VISIÓN GENERAL` + línea horizontal `.line` de `34px`). | Numerar las rutas y bloques pedagógicos (`01 · APRENDER`, `02 · EXPLORAR DATOS`, `03 · BUSCAR FUENTES`) con cejas en monoespaciada y filete horizontal. |
| **Espaciado y ritmo** | Alternancia limpia entre fondos cálidos (`#f8faf7`, `#edf3ee`) y bloques de énfasis con bordes de `1px`. | Cajas de contenido con filetes nítidos (`1px solid #dce2e1`) y notas al pie con borde lateral (`border-left: 3px solid`). | Sustituir el exceso de `backdrop-filter: blur()`, brillos radiales y rotación 3D (`.page-heading:hover`) por superficies planas cálidas con bordes nítidos de `1px`. |
| **Densidad y trazabilidad** | Distingue explícitamente simulación vs. evidencia con `.demo-badge` y notas metodológicas visibles. | Separa cifra principal, desglose y advertencias (`.caveat`) en columnas claras. | Mostrar siempre etiqueta epistémica («Simulación teórica» vs. «Estadística oficial») y plantilla de cita junto al dato. |
| **Qué NO funciona en móvil** | En `<380px` oculta `.brand-mark`; los pines `.field-image .pin` bajan a `22×22px` visuales. | Usa páginas fijas A4 (`.page { width: 297mm; height: 210mm; overflow: hidden }`) con alturas rígidas (`380px`, `405px`) que desbordan o se solapan en móvil. | Prohibir anchos/altos fijos en contenedores de texto; usar grillas fluidas (`minmax(0, 1fr)`) y garantizar objetivos táctiles $\ge 44\times 44\text{ px}$ en los 7 anchos (`360–1920px`). |

---

## 2. Sistema de Color Nuevo y Tipografía

Se diseñaron dos sistemas completos de primera clase (claro y oscuro no invertidos) dentro de la familia pedida (**azul, verde, dorado, naranja, crema, amarillo**), verificados con `docs/ux/scripts/verify-contrast.mjs` (ver tabla completa en `docs/ux/contraste.md`):
- **Variante A — Recomendada (`docs/ux/tokens-propuestos.css`): «Cuaderno Índigo & Cobre Solar».**
  - *Modo Claro:* Fondo crema papiro (`--bg: #FAF5EA`), superficie marfil (`--surface: #FFFDF8`), superficie secundaria trigo (`--surface-2: #EFE7D6`), texto azul tinta (`--text: #142338`, ratio **14.37:1**), texto secundario pizarra (`--text-muted: #4A5B70`, ratio **6.27:1**), primario azul cobalto (`--primary: #184A8C`, **7.86:1**), acento naranja cobre (`--accent: #B84A0E`, **4.79:1**), éxito verde esmeralda (`--success: #136843`, **6.18:1**), alerta dorado ocre (`--warning: #8A5A00`, **5.25:1**), peligro carmesí (`--danger: #B42B2B`, **5.48:1**), foco dorado (`--focus: #8F5B00`, **4.89:1**), borde piedra (`--border: #7D7362`, **3.51–4.07:1**).
  - *Modo Oscuro:* Observatorio nocturno (`--bg: #0C1523`, `--surface: #132033`, `--surface-2: #1B2C44`) con texto crema marfil (`--text: #F7F2E6`, **15.83:1**) y arena (`--text-muted: #C4BBA8`, **9.34:1**), primario azul luminoso (`#6DA8FF`), acento naranja ámbar (`#F79D42`), éxito verde jade (`#44D492`), alerta amarillo dorado (`#F5C842`).
  - *Paleta de 6 series (`--series-1` a `--series-6`):* Contraste $\ge 3.1:1$ contra `--bg` y `--surface` y distancia perceptual mínima $\Delta E_{\text{OKLab}} \ge 11.7$ bajo **deuteranopía y protanopía**.
  - *Por qué se recomienda la Variante A sobre la B (`docs/ux/tokens-alternativa.css`):* reserva el **azul cobalto** para acciones e identidad académica y deja el **verde esmeralda** libre exclusivamente para variaciones positivas (`--success`) y la curva LM/sector externo, evitando ambigüedad semántica entre botones primarios e indicadores en alza.
- **Tipografía:** Sin dependencias nuevas. Optimizar el `<link>` de Google Fonts en `index.html:11` reduciendo de 13 a 7 pesos (`Plus Jakarta Sans:700;800`, `DM Sans:400;500;700`, `IBM Plex Mono:500;600`, peso total ~92 KB WOFF2) y añadir `--font-serif: Georgia, 'Times New Roman', serif` (sistema, 0 KB).

---

## 3. Evaluación Heurística Centrada en el Estudiante (7 anchos: 360–1920 px)

Escala de severidad: **0** = sin problema · **1** = cosmético · **2** = menor · **3** = mayor · **4** = catastrófico.

| Tarea del estudiante | Sev. | Hallazgo principal y evidencia en los 7 viewports (medidos en 7 anchos; se conservan `docs/ux/capturas/produccion-390.png`, `produccion-1440.png` y `produccion-laboratorio-1440.png`; el resto se regenera con `docs/ux/scripts/capture-and-audit.mjs`) |
| :--- | :---: | :--- |
| **a) Entender qué es y adónde ir en <10 s** | **4** | **Sin portada de orientación ni etiquetas visibles en barra lateral:** En `1024–1920px`, `.sidebar .nav-text` (`css/layout.css:4`) está oculto con `clip: rect(0 0 0 0)`, dejando 3 íconos sin texto. El botón `#heroScrollCue` («Explorar análisis», `js/ui/overview.js:247`) solo baja ~243 px hacia `#overviewFilters`, que ya es visible. En `360px` y `390px`, `#apiStatusBadge` se recorta o fuerza salto de línea en `.topbar`. La narrativa («Lecturas para la gestión», «expansión empresarial») habla a gerentes, no a estudiantes de economía. |
| **b) Predecir en el laboratorio IS–LM–BP y contrastar** | **3** | **Escenario guiado oculto y diagramas bajo el pliegue:** En `#tab-simulator` (`index.html:147`), `<details id="islmGuided">` inicia cerrado; el estudiante no ve que puede predecir antes de simular. A `1440×900`, los 4 diagramas (`#islmPanelISLM`, etc.) inician en `y = 961px` (totalmente bajo el pliegue de `900px`) porque `.page-heading`, `.islm-banner` y `.islm-learning` consumen el primer pantallazo. Los selectores `[data-predict]` muestran `Y, i, e, NX` sin nombre de variable. Botones de `.islm-toolbar` y `.islm-glossary-button` miden `32–34px` de alto (< 44 px). |
| **c) Encontrar inflación de Perú, su fuente y cómo citarla** | **3** | **Dos inflaciones sin explicación conjunta ni formato de cita:** Arriba aparece `#bcrpResults` (`js/services/bcrp-client.js:17`) escupiendo títulos oficiales largos, códigos y timestamps ISO crudos (`fetchedAt`) en `<p>` sin formato, y más abajo la tarjeta KPI muestra inflación WDI (`FP.CPI.TOTL.ZG`, promedio anual). La advertencia crucial (IPC promedio anual WDI $\neq$ IPC dic–dic BCRP) está oculta al final de la pestaña 3 (`index.html:203`). No existe botón «Cómo citar este dato» en las tarjetas ni en el comparador. |
| **d) Encontrar ayuda (glosario, cómo usar)** | **3** | **Ayuda y glosario invisibles desde el inicio:** No hay acceso a Ayuda/Glosario en `.topbar` ni en Panorama. El glosario (`#islmGlossary`, `index.html:193`) está al fondo de la pestaña 2 dentro de un `<details>` cerrado, y el diálogo `#islmHelp` solo se abre con el botón ambiguo `¿Por qué?` (`#islmWhy`). |

**Bugs conocidos confirmados en producción:** (1) `#insightCarousel` se congela tras clic en `#carouselPrev`/`#carouselNext` porque `box.addEventListener('focusin', () => pause('focus'))` (`js/ui/overview.js:233`) mantiene `'focus'` en `carouselPause` mientras el botón conserva el foco; (2) slides lavadas y recortadas por `.insight-carousel-inner { mask-image: linear-gradient(...) }` + `.insight-slide { opacity: .78 }` (`css/components.css:113-115`) y pseudo-elementos `:before/:after` de `110px`; (3) `.insight-head .section-title` y `.section-sub` pegados (`margin: 6px 0 0`); (4) `#heroScrollCue` desplaza solo a `#overviewFilters`; (5) `#bcrpResults` imprime strings crudos con ISO `fetchedAt`; (6) lienzos IS–LM bajo el pliegue a `1440×900`; (7) `#apiStatusBadge` recortada/comprimida a `360px`.

---

## 4. Decisión sobre el Carrusel (`#insightCarousel`)

**Recomendación única: REEMPLAZAR el carrusel por 3 tarjetas fijas en grilla (`Lecturas clave del ciclo`).**
- **Justificación pedagógica:** Un estudiante que analiza macroeconomía necesita contrastar *al mismo tiempo* (1) Actividad y demanda interna, (2) Inflación y mercado laboral, y (3) Sector externo y tipo de cambio. Ocultar dos tercios del análisis detrás de un temporizador de 6.5 s incrementa la carga en memoria de trabajo y dificulta relacionar variables (p. ej., crecimiento vs. cuenta corriente).
- **Justificación técnica y de accesibilidad:** Elimina de raíz el congelamiento por `focusin`, el recorte lateral de `mask-image`, la opacidad `.78` que degrada el contraste y ~55 líneas de estado (`carouselPause`, `carouselTimer`, `goToSlide`, `setupCarousel` en `js/ui/overview.js:185-237`).

---

## 5. Lista Priorizada de Cambios Concretos para Codex (Ordenada por Impacto)

1. **[P0 · Orientación <10 s y Portada] Integrar el bloque de bienvenida y los 3 caminos del estudiante (`prototypes/inicio/index.html`) y mostrar etiquetas en navegación:**
   - En `css/layout.css:1-10`: ampliar `.app-shell` a `grid-template-columns: 220px minmax(0, 1fr)` en `>1120px` y quitar `.nav-text { clip: rect(0 0 0 0); position: absolute }` para que las pestañas muestren icono + etiqueta visible («Panorama y datos», «Laboratorio IS–LM–BP», «Fuentes y citación»).
   - En `index.html:83` y `js/ui/overview.js:246-259`: reemplazar `#heroScrollCue` por 3 botones de ruta rápida (Aprender en IS–LM–BP, Explorar comparador, Buscar fuentes y cómo citar) con `min-height: 44px`.
2. **[P0 · Sistema Visual] Reemplazar `css/tokens.css` por `docs/ux/tokens-propuestos.css` y limpiar efectos decorativos en `css/base.css` y `css/components.css`:**
   - Copiar `docs/ux/tokens-propuestos.css` a `css/tokens.css` (incluye alias `--paper`, `--ink`, `--blue`, `--teal`, `--amber`, `--rose` para no romper JS/CSS existente).
   - En `index.html:2` y `js/app.js:73`: usar `light` como predeterminado cuando no hay `localStorage`, respetando `prefers-color-scheme: dark` y `[data-theme]`.
   - En `css/components.css:96-99` y `js/ui/overview.js:260-272`: eliminar `setupParallaxCards()` y `.page-heading:hover, .executive:hover { transform: perspective(...) }` que distorsionan el texto.
   - En `js/ui/overview.js:43` y `js/ui/charts.js`: usar `['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)', 'var(--series-5)', 'var(--series-6)']` con patrones de línea (`borderDash: [[], [8,4], [2,3], [8,3,2,3]]`) para accesibilidad en deuteranopía y protanopía.
3. **[P0 · Carrusel → 3 Tarjetas Fijas] Sustituir `#insightCarousel` por grilla estática de 3 lecturas:**
   - En `index.html:108-111`: quitar `.carousel-controls`, `#carouselPrev`, `#carouselNext`, `#carouselDots` y `#insightTrack`; usar `<div class="insight-grid" id="insightGrid"></div>`.
   - En `css/components.css:63-77, 106-119`: reemplazar `.insight-carousel`, `.insight-carousel-inner { mask-image: ... }` y `.insight-slide { opacity: .78 }` por `.insight-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px }` (`1fr` bajo `960px`).
   - En `js/ui/overview.js:185-237` y `js/app.js:9,16,19,21,71-72`: renderizar los 3 objetos de `buildInsightSlides()` como 3 `<article class="surface insight-card">` siempre visibles y eliminar `setupCarousel` y `restartCarouselAuto`.
4. **[P1 · Laboratorio IS–LM–BP sobre el pliegue a 1440×900] Compactar cabecera y abrir predicción guiada:**
   - En `index.html:143-148` y `css/islm.css:25-54`: reducir el padding de `#tab-simulator .page-heading` a `18px 22px`, integrar `.islm-banner` como badge dentro de `.page-heading`, y poner `<details id="islmGuided" open>` para que el flujo de predicción sea visible de inmediato, o colocar `.islm-learning` en una fila compacta para que `#islmPanelISLM` inicie en `y < 380px` a `1440×900`.
   - En `js/ui/islm-lab.js:96`: mostrar nombre completo en los selectores `[data-predict]` (`Y · Producto`, `i · Tasa de interés`, `e · Tipo de cambio`, `NX · Exportaciones netas`).
   - En `css/islm.css:43,59`: subir `min-height: 44px` en `.islm-toolbar .control-action`, `.islm-preset` y `.islm-glossary-button`.
5. **[P1 · Trazabilidad BCRP, WDI y Citación Académica] Formatear `#bcrpResults` y añadir cita lista para copiar:**
   - En `js/services/bcrp-client.js:13-19`: reemplazar los `<p>` crudos por una grilla `.bcrp-grid` de 4 tarjetas con etiquetas legibles (`Tasa de referencia BCRP`, `IPC Lima mensual`, `IPC Lima interanual`, `Tipo de cambio bancario`), formatear `row.fetchedAt` con `new Date(row.fetchedAt).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' })` y añadir nota visible que distinga el IPC interanual BCRP del IPC promedio anual WDI.
   - En `index.html:200` y `js/ui/overview.js:395`: añadir un botón/acordeón «Cómo citar» que copie la cita académica con institución, código (`FP.CPI.TOTL.ZG` / código BCRP), país y fecha de consulta.
6. **[P2 · Ayuda Global y Cabecera Móvil 360 px] Acceso directo al glosario y limpieza de `.topbar`:**
   - En `index.html:71-74` y `css/islm.css:75`: añadir en `.top-right` un botón `Ayuda y glosario` (`min-height: 44px`) que abra `#islmHelp` desde cualquier pestaña, y compactar `#apiStatusBadge` en `≤390px` a estado corto (`WDI · En línea` / `WDI · Respaldo`) sin desbordar.
