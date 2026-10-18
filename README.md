# MacroScope — Dashboard macroeconómico

Dashboard ejecutivo interactivo para seguimiento de indicadores macroeconómicos, comparación internacional y simulación financiera exploratoria.

## Abrir el proyecto

Abre [`index.html`](index.html) en un navegador moderno. No requiere un proceso de compilación ni servidor de aplicaciones. Para publicar el sitio más adelante, `index.html` está preparado como punto de entrada para alojamiento estático.

## Funciones

- Panorama ejecutivo con indicadores del Banco Mundial (WDI).
- Comparación entre países y América Latina y el Caribe.
- Gráficas de series históricas y comparaciones internacionales.
- Carrusel de lecturas gerenciales y visualización adaptable.
- Referencias cambiarias con Open ER API.
- Simulación ilustrativa de sensibilidad financiera (ingresos, costos y EBITDA).
- Tabla histórica con exportación CSV e inspector de las consultas API.
- Tema claro/oscuro.

## Fuentes y limitaciones

- Banco Mundial (World Development Indicators): https://api.worldbank.org/v2/
- Tipos de cambio indicativos: https://open.er-api.com/v6/latest/USD

Los indicadores macroeconómicos son de periodicidad **anual**, no cifras intradía. Si fallan las APIs, el dashboard muestra **datos históricos locales de respaldo**. La procedencia se registra **por celda**: en la tabla, los valores de respaldo aparecen en cursiva con `*`, y el CSV exportado incluye una columna `<indicador>_fuente` (`wdi` o `respaldo`).

Los valores de respaldo se transcribieron del WDI, pero **todavía no se han contrastado de nuevo con el API**; algunos datos de 2024 pueden ser estimaciones preliminares. Antes de usarlos en un análisis formal, compáralos con el API del Banco Mundial y anota la fecha de extracción.

Notas metodológicas:

- **Inflación** (`FP.CPI.TOTL.ZG`): variación del IPC *promedio anual*. No equivale a la variación diciembre–diciembre con la que los bancos centrales evalúan su meta. La lectura "En meta / Sobre meta / Bajo meta" usa la meta de cada banco central: BCRP 2 % ± 1, BCCh 3 % ± 1, BanRep 3 % ± 1, Banxico 3 % ± 1, BCB 3 % ± 1,5 y Fed 2 % (con ± 1 pp solo como banda de referencia). Para América Latina y el Caribe, que no tiene meta, se usan umbrales genéricos.
- **Desempleo** (`SL.UEM.TOTL.ZS`): estimación *modelada de la OIT* a nivel nacional. No es comparable con la tasa de Lima Metropolitana que publica el INEI.

El simulador trabaja en la **moneda local** del país seleccionado: los costos locales se ajustan por inflación y los costos dolarizados se reexpresan según la variación cambiaria. Sus cálculos son **supuestos orientativos**, no pronósticos econométricos validados ni asesoramiento financiero. Los tipos de cambio de referencia no equivalen a cotizaciones bancarias de compra/venta.

## Tecnología

HTML, CSS y JavaScript integrados en `index.html`. Chart.js 4.4.1 se carga desde jsDelivr con `defer` y verificación de integridad (SRI); si no carga, se usa un renderizador de gráficos alternativo incluido en la página. Las tipografías se solicitan a Google Fonts.

## Estructura

```text
macroscope-dashboard/
├── index.html                  # Dashboard completo (HTML + CSS + JS)
├── package.json                # Scripts de prueba y dependencia de desarrollo (Playwright)
├── tests/
│   ├── smoke.mjs               # Comprobación estática sin dependencias
│   └── e2e.mjs                 # Pruebas en Chromium sin interfaz, con red controlada
├── .github/workflows/validate.yml
├── README.md
└── .gitignore
```

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
npm test                                     # smoke + e2e
node tests/smoke.mjs                         # solo la comprobación estática (sin dependencias)
```

- `tests/smoke.mjs` valida que existan los controles principales y que el JavaScript integrado tenga sintaxis válida.
- `tests/e2e.mjs` abre la página en Chromium sin interfaz, bloqueando la red o respondiendo con datos de prueba. Verifica el modo de respaldo, la procedencia por celda (tabla y CSV), los colores de variación, la clasificación frente a la meta de inflación, la accesibilidad del sidebar, el simulador, el tema persistente, el diseño móvil y el carrusel con `prefers-reduced-motion`.

GitHub Actions ejecuta ambas pruebas en cada push a `main` y en los pull requests. Las pruebas **no** consultan las APIs reales, así que no garantizan su disponibilidad.

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
