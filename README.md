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

Los indicadores macroeconómicos son de periodicidad **anual**, no cifras intradía. Si fallan las APIs, el dashboard puede mostrar **datos históricos locales de respaldo**; verifica el estado de conexión y el año de cada dato antes de usarlo.

Los cálculos del simulador son **supuestos orientativos**, no pronósticos econométricos validados ni asesoramiento financiero. Los tipos de cambio de referencia no equivalen a cotizaciones bancarias de compra/venta.

## Tecnología

HTML, CSS y JavaScript integrados en `index.html`. El documento solicita Chart.js y tipografías desde CDN cuando hay conexión; incluye una representación alternativa de gráficos si Chart.js no carga.

## Estructura

```text
macroscope-dashboard/
├── index.html
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
node tests/smoke.mjs
```

La comprobación automatizada valida que existan los controles principales y que el JavaScript integrado tenga sintaxis válida. GitHub Actions ejecuta la misma prueba en cada push a `main` y en los pull requests. Esta prueba **no** garantiza disponibilidad en tiempo real de las APIs ni constituye una auditoría funcional completa.

## Estado del repositorio

El `macroscope-dashboard.zip` subido inicialmente se conserva como copia histórica. Para desarrollar y revisar el proyecto utiliza **`index.html` de la raíz** y los archivos versionados de Git, no el ZIP.
