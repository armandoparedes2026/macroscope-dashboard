# Laboratorio IS–LM–BP: Estructura, Correspondencia Visual y Rigor Económico

Este documento describe la arquitectura visual e interactiva del **Laboratorio IS–LM–BP y Mundell–Fleming** (`#simulacion` / `#laboratorio`) y documenta tanto su correspondencia con la referencia visual de diseño como las decisiones donde el rigor teórico y de datos prevalece sobre las cifras o etiquetas ilustrativas de la maqueta.

## 1. Estructura y composición visual

1. **Encabezado compacto (`.lab-hero`)**:
   - Icono vectorial de matraz en baldosa translúcida (`.platform-hero-icon`), antetítulo `SIMULACIÓN TEÓRICA · CORTO PLAZO (P = 1)`, título `Laboratorio IS–LM–BP`, subtítulo explicativo y botón de acción primaria `Guardar escenario →` (`#labHeroSave`) vinculado al guardado local de escenarios.
2. **Franja superior de contexto y navegación de políticas (`.lab-context-bar`)**:
   - **Selectores funcionales (`.lab-context-selects`)**: Cinco selectores reales con iconografía vectorial (`Economía` `#islmCountry`, `Régimen cambiario` `#islmRegime`, `Movilidad de capitales` `#islmMobility`, `Instrumento monetario` `#islmInstrument`, `Nivel de aprendizaje` `#islmLevel`).
   - **Metadatos honestos (`.lab-meta-pills`)**: Dado que el laboratorio opera un único modelo estructural de corto plazo, los campos `Modelo: IS–LM–BP · Mundell–Fleming` y `Horizonte: Corto plazo (P = 1)` se presentan como metadatos explícitos junto al indicador dinámico del escenario activo (`#labActiveScenarioPill`), sin fingir selectores inexistentes.
   - **Pestañas de políticas (`.lab-policy-tabs`)**: Cuatro pestañas segmentadas (`Política fiscal`, `Política monetaria`, `Shock externo`, `Movilidad de capitales`) que resaltan y enfocan los grupos de controles reales correspondientes y despliegan automáticamente los controles de régimen cuando aplica.
3. **Mesa de trabajo en tres columnas en escritorio (`.islm-layout` / `.islm-main`)**:
   - **Columna izquierda — Parámetros (`.islm-controls`)**: Muestra directamente los 7 deslizadores principales (`G`, `T0`, `Mpct`, `istar`, `rho`, `nxShock`, `confShock`) en tarjetas compactas con icono vectorial, nombre, unidad/base explícita, píldora de valor actual, control de rango y extremos mínimo/máximo legibles, además del botón `Restablecer` (`#islmResetBtn`). Los instrumentos específicos de regla de tasa o paridad fija (`ipol`, `ebar`, `Ystar`), los parámetros estructurales (`c`, `t`, `b`, `h`, `m`, `n`), los `Escenarios rápidos` (`#islmPresets`) y el resumen `Régimen y supuestos del modelo` (`#islmTrilemma` + `#islmAssumptionsExtra`) se mantienen accesibles en bloques desplegables con desplazamiento propio independiente.
   - **Columna central superior — Grilla 2×2 de diagramas ampliados (`.islm-grid`) y acción «Ampliar gráficos» (`#islmExpandChartsBtn`)**: Cuatro paneles sincronizados con el motor (`1 · IS–LM–BP`, `2 · Mundell–Fleming`, `3 · Mercado de dinero`, `4 · Mercado de bienes`), con altura de lienzo incrementada (`clamp(228px, calc((100svh - 425px) / 2), 270px)` — `258 px` de alto y área útil `406×201 px` en `1672×941`; `238 px` de alto y área útil `298×181 px` en `1440×900`), escalado real por `devicePixelRatio`, tipografía ampliada en ticks y títulos de ejes (`11 px` en vista normal, `12,2 px` en vista ampliada), margen izquierdo adaptativo para no cortar ni solapar valores de 3 dígitos (`100`, `110`, `120`), curvas iniciales discontinuas y simuladas continuas, flechas de desplazamiento, globos `E₀`, `E₁`, `E₂` posicionados automáticamente dentro de los bordes del área de trazado y leyenda inferior nítida. Incluye la barra `.lab-diagrams-bar` con el botón accesible **«Ampliar gráficos»** (`#islmExpandChartsBtn`) y clic directo sobre cualquiera de los 4 paneles para abrir el diálogo `<dialog id="islmZoomDialog">` con vista `2×2` de gran formato o vista individual por mercado (`1..4`), sincronizado en vivo con el estado del laboratorio, soporte de cierre con `Escape`/botón/fondo, bloqueo de scroll de fondo (`html.has-lab-zoom`) y restauración de foco.
   - **Columna central inferior — Resultados del escenario (`.lab-results-section`)**: Banda comparativa `E₀ → E₂` de 6 tarjetas (`#islmScenarioCards`), acompañada de leyenda (`Escenario base E₀` / `Escenario simulado E₂`), píldora resumen de variación (`#islmScenarioDeltaBadge`), ecuaciones estructurales en nivel avanzado (`#islmEquations`) y desplegable con la tabla analítica completa `E₀ / E₁ / E₂` y multiplicadores (`#islmFullTableDetails`).
   - **Columna derecha — Lectura del mecanismo (`.lab-reading`)**: Tarjeta superior de síntesis dinámica (`#islmReadingHighlight`), pasos numerados de transmisión (`#islmNarrative`) con agrupación desplegable para notas analíticas adicionales, tarjeta inferior `Idea clave` (`#islmKeyIdea`), nota de verificación empírica (`#islmReadingContext`) y botón `¿Por qué se mueve?` conectado al diálogo pedagógico `#islmHelp`.

## 2. Ergonomía de foco permanente (sticky) en escritorio, scroll lateral independiente y adaptación por tamaño

1. **Escritorio amplio (`> 1279 px`, 3 columnas)**:
   - La columna central (`.lab-center`) permanece **anclada en foco (`position: sticky; top: calc(var(--topbar-h, 72px) + 10px)`)** dentro de los límites de `.islm-layout`.
   - Tanto el panel izquierdo de configuración (`.islm-controls`) como el panel derecho de lectura (`.lab-reading`) cuentan con altura acotada al viewport (`max-height: var(--lab-panel-max-h)` sincronizada dinámicamente con `syncLabStickyBounds()`) y desplazamiento vertical propio (`overflow-y: auto; overscroll-behavior: contain`) con contención de rueda del ratón y teclado.
   - Al abrir todas las secciones de parámetros (controles de régimen, parámetros estructurales `c..n`, escenarios rápidos y supuestos) o desplegar todas las notas del mecanismo de transmisión y recorrer cada columna lateral hasta su final, **los cuatro diagramas centrales mantienen sus coordenadas exactas en pantalla (`Δtop = 0 px`, `Δbottom = 0 px`)**.
   - Cuando el usuario continúa desplazándose más allá de `.islm-layout` hacia los paneles inferiores (escenarios guiados, matriz de eficacia, fuentes de calibración y tipos de cambio), el contenedor padre termina y libera el anclaje de forma natural sin tapar ninguna sección posterior.
2. **Escritorio compacto y tableta horizontal (`1121–1279 px`, 2 columnas)**:
   - La mesa se dispone en dos columnas (`245px minmax(0, 1fr)`): el panel izquierdo de parámetros (`.islm-controls`) conserva su anclaje sticky y desplazamiento interno acotado (`max-height: var(--lab-panel-max-h); overflow-y: auto`), mientras que en la columna derecha `.lab-center` (diagramas + tarjetas de resultados en grilla de 3 columnas) y `.lab-reading` (con pasos en 2 columnas) pasan a flujo vertical normal (`position: static; max-height: none; overflow: visible`) para no comprimir horizontalmente los 4 lienzos.
3. **Móvil y tableta estrecha (`<= 1120 px`, 1 columna)**:
   - Se desactiva por completo el anclaje sticky y el scroll interno anidado en las tres regiones (`.islm-controls`, `.lab-center` y `.lab-reading` con `position: static; max-height: none; overflow: visible`) para preservar el flujo vertical natural sin trampas de scroll y con áreas táctiles de `>= 44 px`.
   - El botón **«Ampliar gráficos»** (`min-height: 44 px`) abre el diálogo expandido adaptado en una sola columna vertical legible (`<= 860 px`), evitando comprimir una grilla 2×2 ilegible en pantallas estrechas.

## 3. Diferencias justificadas por rigor económico y consistencia de plataforma

| Aspecto en la imagen de referencia | Implementación en Macroscope | Justificación académica y técnica |
| :--- | :--- | :--- |
| Tarjeta de «Inflación esperada» en resultados | Se muestran exclusivamente variables calculadas por el solver (`Y`, `i`, `e`, `NX`, `CA`, `M/P` o `I`, `C`, `G`) | El modelo IS–LM–BP implementado (`js/islm-model.js`) es de corto plazo con precios fijos (`P = 1`). No se inventa una variable de inflación esperada no resuelta por el sistema. |
| Cifras y desplazamientos fijos de ejemplo | Geometría, equilibrios (`E₀`, `E₁`, `E₂`) y narrativa calculados en vivo por `ISLM.createModel()` | Con flotación y movilidad perfecta (`κ = ∞`), una expansión fiscal aprecia `e` y reduce `NX` hasta que `ΔY = 0`; con tipo fijo, `M/P` es endógena. Las curvas pasan exactamente por las soluciones del motor. |
| Convención del tipo de cambio `e` | Índice normalizado `e₀ = 100` (moneda local por USD: `e ↑` = depreciación, `e ↓` = apreciación) | Evita mezclar niveles observados en S/ por USD con el índice teórico calibrado y mantiene la condición de Marshall–Lerner consistente en IS y BP. |
| Separación entre `NX`, `NFI` y `CA` | Tarjetas y filas diferenciadas para `Balanza comercial (NX)` y `Cuenta corriente (CA = NX + NFI)` | Respeta la identidad de balanza de pagos calibrada con WDI (`NE.RSB.GNFS.ZS` y `BN.CAB.XOKA.GD.ZS`) sin confundir bienes y servicios con renta neta. |
| Cabecera superior de la maqueta antigua | Se preserva el orden canónico del PR #11 (`Inicio, Aprendizaje, Histórico, Indicadores, Panorama, Comparador, Laboratorio, Modelos` + `Más`) | Cumple la instrucción explícita de conservar la arquitectura de navegación vigente y no introducir avatares, usuarios ni notificaciones ficticias. |

## 4. Revisión final, evidencia reproducible y limitaciones

La insignia distingue el escenario base de las perturbaciones compensadas y de la neutralidad exclusivamente en `Y` e `i`. La expansión fiscal con flotación y movilidad perfecta mantiene ambas variables, pero cambia `e`, `NX` y la composición: no se etiqueta como ausencia de perturbación. Una regresión E2E reproduce ese caso. La tarjeta y la tabla identifican `M/P` como saldos reales; la intervención con reservas se explica como mecanismo, sin presentar una cantidad de reservas que el solver no calcula.

`node tests/lab-visual.mjs` regenera las capturas en `test-results/lab-comparison/final/` (incluyendo vistas normales, diálogo ampliado en claro/oscuro/móvil y estado con scroll lateral completo manteniendo la grilla 2×2 estática en pantalla), junto a `metrics.json` con equilibrios, dimensiones de lienzo y área de trazado (`pw × ph`), `devicePixelRatio`, errores JavaScript y desbordamientos. Todas las capturas e2e se toman en modo controlado sin red usando el respaldo local verificable, claramente diferenciado de las consultas API en línea.

Capturas publicadas en `docs/evidence/laboratorio-referencia/`:
- [antes (1672×941)](../evidence/laboratorio-referencia/antes-1672.png)
- [versión final con gráficos ampliados (1672×941)](../evidence/laboratorio-referencia/final-1672.png)
- [vista ampliada «Ampliar gráficos» (1672×941 claro)](../evidence/laboratorio-referencia/final-1672-zoom.png)
- [foco sticky con paneles laterales desplazados al final (1672×941)](../evidence/laboratorio-referencia/final-1672-sticky-scroll.png)
- [tema oscuro (1440×900)](../evidence/laboratorio-referencia/final-oscuro.png)
- [vista ampliada en tema oscuro (1440×900)](../evidence/laboratorio-referencia/final-oscuro-zoom.png)
- [móvil (390×844)](../evidence/laboratorio-referencia/final-movil.png)
- [vista ampliada móvil en 1 columna (390×844)](../evidence/laboratorio-referencia/final-movil-zoom.png)
- [neutralidad fiscal con movilidad perfecta](../evidence/laboratorio-referencia/final-movilidad-perfecta.png)
