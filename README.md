# MacroScope — Laboratorio Interactivo de Economía Aplicada

Plataforma para aprender, experimentar y analizar economía aplicada: un laboratorio IS–LM–BP / Mundell–Fleming con escenarios guiados en tres niveles, estadísticas oficiales (Banco Mundial WDI y BCRP) y comparaciones internacionales que explicitan sus límites. Distingue siempre la simulación teórica de la evidencia empírica.

## Abrir el proyecto

Abre [`index.html`](index.html) en un navegador moderno. No requiere un proceso de compilación ni servidor de aplicaciones. Para publicar el sitio más adelante, `index.html` está preparado como punto de entrada para alojamiento estático.

## Funciones

- Panorama económico con indicadores del Banco Mundial (WDI) y series mensuales del BCRP.
- Comparación entre países y América Latina y el Caribe.
- **Comparación de economías** (`#comparacion`): panel independiente con cuatro países simultáneos, seis indicadores, gráficos históricos, ranking, mapa de orientación, lectura económica, relaciones entre variables, mercado laboral y exportación CSV.
- Gráficas de series históricas y comparaciones internacionales.
- Carrusel de lecturas económicas y visualización adaptable.
- Referencias cambiarias con Open ER API.
- Simulador **IS–LM–BP / Mundell–Fleming ampliado** con cuatro diagramas enlazados (ver abajo).
- Tabla histórica con exportación CSV e inspector de las consultas API.
- Tema claro/oscuro.

## Simulador IS–LM–BP / Mundell–Fleming

La pestaña **Modelo IS–LM y divisas** explica cómo se ajusta una economía a corto plazo, con precios fijos, ante decisiones de política y shocks externos.

**Cuatro diagramas enlazados**, que muestran el mismo equilibrio:

1. **IS–LM–BP** en (Y, i): equilibrio de bienes, dinero y balanza de pagos.
2. **Mundell–Fleming** en (Y, e): IS* y LM* (o LM–BP con movilidad imperfecta, y ē con tipo de cambio fijo).
3. **Mercado de dinero** en (M/P, i): demanda L(Y) y oferta Mˢ.
4. **Cruz keynesiana** en (Y, DA): demanda agregada y recta de 45°.

En cada diagrama, la línea discontinua es la situación inicial (E₀), la línea continua el nuevo equilibrio (E₂) y el punto hueco el impacto antes del ajuste externo (E₁).

**Tipos de economía:**

- **Régimen:** cerrada, abierta con tipo de cambio flexible o abierta con tipo de cambio fijo.
- **Movilidad de capital:** nula (BP vertical), baja (BP más inclinada que la LM), alta (BP más plana) o perfecta (Mundell–Fleming clásico).
- **Instrumento monetario:** oferta monetaria (LM clásica) o tasa de interés de política (LM horizontal). Las combinaciones imposibles según el **trilema de Mundell** se bloquean y se explican.

**Qué controla la economía:**

- **Instrumentos (controlables):** G, T, y M o la tasa de política (o ē con tipo de cambio fijo).
- **Shocks (no controlables):** i*, prima de riesgo ρ, ingreso mundial Y*, términos de intercambio y confianza privada.
- **Endógenas:** Y, i, e (o M y reservas con tipo de cambio fijo), C, I, NX y flujos de capital.
- **Parámetros estructurales:** c, t, b, h, m, n y movilidad de capital.

La clasificación se actualiza con el régimen.

**Calibración con datos:**

- La propensión a importar se deriva de las exportaciones (% del PBI, WDI).
- Las exportaciones netas iniciales igualan el saldo en cuenta corriente observado, financiado con flujos de capital autónomos.
- La tasa inicial es la meta de inflación del banco central más una tasa real neutral **supuesta** (Perú 1,5 %, Chile 1 %, Colombia 2 %, México 2,5 %, Brasil 5 %, EE. UU. 1 %).
- La tasa internacional de referencia es del 3 %. El equilibrio inicial se normaliza en Y = 100 y e = 100.

**Resultados en pantalla:** la tabla de resultados (E₀, E₁ y E₂), los multiplicadores efectivos del régimen elegido, una explicación paso a paso del mecanismo de transmisión y la tabla clásica de eficacia de políticas.

El modelo está en [`js/islm-model.js`](js/islm-model.js): son funciones puras, probadas en `tests/islm-model.test.mjs` contra los resultados de libro de texto (por ejemplo, la ineficacia fiscal con flotación y movilidad perfecta, y la monetaria con tipo de cambio fijo).

**Limitaciones:**

- Precios fijos y expectativas estáticas.
- Economía pequeña, lo que no se cumple bien para EE. UU.
- No recoge la flotación administrada del BCRP ni el efecto hoja de balance de la dolarización; ambos se mencionan en la interfaz cuando corresponde.

## Fuentes y limitaciones

- Banco Mundial (World Development Indicators): https://api.worldbank.org/v2/
- Tipos de cambio indicativos: https://open.er-api.com/v6/latest/USD
- Cartografía del mapa interactivo de comparación: [OpenFreeMap](https://openfreemap.org/) (estilos Positron y Dark, teselas de OpenStreetMap; servicio público sin clave) y [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/).
- Fronteras simplificadas de países: [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/), 1:110m, dominio público; copia local de sus 177 geometrías, conservando solo los atributos ISO3 y nombre para minimizar la transferencia (`data/geo/ne_110m_admin_0_countries.geojson`).

Los indicadores macroeconómicos son de periodicidad **anual**, no cifras intradía. Si fallan las APIs, el dashboard muestra **datos históricos locales de respaldo**. La procedencia se registra **por celda**: en la tabla, los valores de respaldo aparecen en cursiva con `*`, y el CSV exportado incluye una columna `<indicador>_fuente` (`wdi` o `respaldo`).

En la vista **Comparación de economías**, la fuente principal es igualmente WDI y la actualización utiliza el servicio existente. Puedes seleccionar hasta cuatro países, el periodo (últimos 5/10/20 años o todo el historial), el grupo temático y el indicador activo. Las modalidades **Indicadores**, **Ranking** y **Regiones** comparten las mismas observaciones. La referencia de América Latina y el Caribe es el agregado oficial WDI `LCN`, que no debe interpretarse como un promedio simple de los países seleccionados. El **mapa interactivo** permite ampliar, desplazar y pulsar economías: los polígonos de los países seleccionados se colorean de acuerdo con los valores del indicador en el último año común y los marcadores de color diferencian cada economía. La posición de los marcadores es referencial; el color por país representa magnitud relativa entre seleccionados y **no** valor absoluto comparable entre indicadores diferentes. Si el proveedor cartográfico o WebGL no está disponible, se conserva el mapa SVG de respaldo. El diagrama de dispersión sirve para explorar relaciones, pero no establece causalidad.

El gráfico histórico permite observar valores originales, índices base 100 para indicadores de nivel y variación acumulada cuando se analiza el crecimiento anual del PBI. Si faltan años consecutivos en una serie de crecimiento, no se interpola ni se calcula una acumulación falsa. Rankings y tarjetas muestran los valores anuales sin transformar. La tabla presenta el último año **común** de cada indicador, evitando comparar cifras de años distintos. Las celdas ausentes se muestran sin inventar ceros. El reporte CSV contiene país ISO3, código WDI, año, valor, unidad y procedencia de cada observación; no incluye las transformaciones visuales.

Los valores de respaldo se transcribieron del WDI, pero **todavía no se han contrastado de nuevo con el API**; algunos datos de 2024 pueden ser estimaciones preliminares. Antes de usarlos en un análisis formal, compáralos con el API del Banco Mundial y anota la fecha de extracción.

Notas metodológicas:

- **Inflación** (`FP.CPI.TOTL.ZG`): variación del IPC *promedio anual*. No equivale a la variación diciembre–diciembre con la que los bancos centrales evalúan su meta. La lectura "En meta / Sobre meta / Bajo meta" usa la meta de cada banco central: BCRP 2 % ± 1, BCCh 3 % ± 1, BanRep 3 % ± 1, Banxico 3 % ± 1, BCB 3 % ± 1,5 y Fed 2 % (con ± 1 pp solo como banda de referencia). Para América Latina y el Caribe, que no tiene meta, se usan umbrales genéricos.
- **Desempleo** (`SL.UEM.TOTL.ZS`): estimación *modelada de la OIT* a nivel nacional. No es comparable con la tasa de Lima Metropolitana que publica el INEI.

Los resultados del simulador IS–LM–BP son **didácticos**, no pronósticos econométricos validados ni asesoramiento financiero. Los tipos de cambio de referencia no equivalen a cotizaciones bancarias de compra/venta.

## Tecnología

HTML, CSS y JavaScript modularizados. Chart.js 4.4.1 se carga desde jsDelivr con `defer` y verificación de integridad (SRI); si no carga, se usa un renderizador de gráficos alternativo. MapLibre GL JS 5.12.0 se carga desde jsDelivr y renderiza teselas OpenFreeMap cuando existe WebGL y conexión; Natural Earth se sirve localmente. Las tipografías se solicitan a Google Fonts.

## Estructura

```text
macroscope-dashboard/
??? index.html                  # Estructura HTML y guardia m?nima de tema antes del pintado
??? css/                        # tokens, base, layout, componentes e IS?LM (orden de cascada)
??? js/
?   ??? config/                 # pa?ses, indicadores, metas, supuestos y estado compartido
?   ??? data/fallback-wdi.js     # respaldo anual y cambiario con fechas de extracci?n disponibles
?   ??? services/               # WDI (paginaci?n/cach?/reintentos), BCRP y FX
?   ??? ui/                     # formato, gr?ficos, panorama/datos y laboratorio IS?LM
?   ??? app.js                  # arranque y enlaces entre vistas
?   ??? islm-model.js           # modelo puro (contrato conservado)
?   ??? lab-content.js          # escenarios y contenido puro de la auditor?a
??? api/bcrp.js                 # proxy del servidor; no se carga como script del navegador
??? tests/                      # smoke, unitarias, e2e, comparaci?n visual y fixtures reales
??? docs/arquitectura.md         # dependencias, orden de carga y l?mites DOM/Node
??? docs/evidence/fase-modularizacion/
??? package.json
??? .github/workflows/validate.yml
```

Los scripts del navegador son cl?sicos con `defer` y comparten `globalThis.MacroScope`; no requieren bundler ni m?dulos ES y funcionan abriendo `index.html` por `file://`. La decisi?n y los contratos est?n documentados en [arquitectura](docs/arquitectura.md).

## Desarrollo seguro con Git y worktrees

Mantén `main` como versión estable y trabaja las modificaciones en ramas independientes. Por ejemplo:

```bash
git clone https://github.com/armandoparedes2026/macroscope-dashboard.git
cd macroscope-dashboard
git worktree add ../macroscope-ui -b feature/ui-premium
git worktree add ../macroscope-data -b feature/datos-wdi
```

Puedes asignar un worktree a Codex y el otro a Claude Code. Revisa los cambios antes de integrar cada rama mediante un pull request. No edites los mismos archivos simultáneamente desde dos agentes.

## Pruebas

```bash
npm install                                  # instala Playwright
npx playwright install chromium              # solo la primera vez
npm test                                     # smoke + todas las unitarias + e2e
npm run test:unit                            # modelo, BCRP, contenido y WDI
npm run test:smoke                           # sintaxis y referencias locales
node tests/visual-modularization.mjs after    # comparaci?n con la referencia versionada
```

En PowerShell con scripts deshabilitados, usa `npm.cmd` en lugar de `npm`.

- `tests/smoke.mjs` comprueba los controles principales, la sintaxis de todos los `.js` del proyecto (excepto dependencias y metadatos Git), los scripts cl?sicos con `defer`, las referencias locales en ambos sentidos, el SRI de Chart.js y el l?mite de 450 l?neas del HTML.
- `tests/islm-model.test.mjs` valida los resultados cl?sicos, reg?menes, trilema, calibraci?n y curvas del modelo.
- `tests/lab-content.test.mjs` verifica escenarios y predicciones del laboratorio contra el modelo.
- `tests/bcrp.test.mjs` comprueba normalizaci?n de respuestas reales y contratos del proxy.
- `tests/wdi.test.mjs` importa el servicio cl?sico en Node sin DOM y valida paginaci?n con fixtures reales, nulos, ?ltimo a?o disponible, errores oficiales, cach? y actualizaci?n forzada. La procedencia de los fixtures est? en `tests/fixtures/wdi-source.json`.
- `tests/e2e.mjs` abre `file://` en Chromium con red controlada y verifica respaldo, procedencia por celda y CSV, indicadores, accesibilidad, simulador, temas, m?vil, carrusel, paginaci?n, reintentos y BCRP. Las capturas de este test se guardan en `docs/evidence/fase-modularizacion/e2e-hero-*.png`.
- `tests/visual-modularization.mjs` compara p?gina completa de Panorama, IS?LM y Datos, en temas claro/oscuro a 1440 y 390 px, con fechas fijas y APIs bloqueadas. Conserva las capturas originales en `before/`; usa `before` ?nicamente para crear una nueva referencia deliberada. El umbral y los resultados est?n en [la evidencia](docs/evidence/fase-modularizacion/README.md).

GitHub Actions ejecuta `npm test` en cada push a `main` y en los pull requests. Estas pruebas usan fixtures y no garantizan disponibilidad de las APIs reales.

## Estado del repositorio

El `macroscope-dashboard.zip` subido inicialmente se eliminó del árbol de trabajo; sigue disponible en el historial de Git (commit `7bbf414`).

## Despliegue de producción en Vercel (CS_CORP)

El proyecto Vercel **`macroscope-dashboard`** ya está creado sin conexión Git directa, para mantener las cuentas GitHub independientes.

- **Sitio:** https://macroscope-dashboard-cs-corp.vercel.app
- **Equipo Vercel:** `cs-corp`
- **ID de equipo:** `team_2SUUXoaYVzUfyptfKrG51Of9`
- **ID de proyecto:** `prj_ynewA8npY6iYShQpYA6vYe13wZzg`
- **Rama de producción:** `main`

### Activación de GitHub Actions

Queda **un único secreto** por configurar, sin compartirlo por chat ni añadirlo a archivos del repositorio:

1. Accede a https://vercel.com/account/tokens y crea un token de Vercel con acceso a **CS_CORP**.
2. En https://github.com/armandoparedes2026/macroscope-dashboard/settings/secrets/actions elige **New repository secret**.
3. Nombre exacto: `VERCEL_TOKEN`. Pega el token en **Secret** y guarda.
4. Abre https://github.com/armandoparedes2026/macroscope-dashboard/actions/workflows/vercel-deploy.yml y pulsa **Run workflow** sobre `main`. Cuando esa ejecución termine satisfactoriamente, los siguientes `push` a `main` desencadenarán automáticamente despliegues de producción.

La automatización usa `.github/workflows/vercel-deploy.yml` y el `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` públicos. **No guardes un token de acceso en `index.html`, `README.md`, YAML, commits ni archivos `.env` versionados.**

> El primer despliegue se realizó directamente en Vercel. Los siguientes despliegues automáticos requieren el secreto configurado y una ejecución satisfactoria del workflow. El sitio puede exigir autenticación según las protecciones de Vercel.
