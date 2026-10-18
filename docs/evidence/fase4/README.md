# Fase 4 — respaldo WDI y comparador

Base: `25098b9` (`feature/ui-premium`). No se modificaron el modelo, contenido, UI o CSS protegidos del laboratorio, sus pruebas, prototipos ni configuración de despliegue. En `index.html` se añadió únicamente el comparador dentro de Panorama y su script clásico diferido.

## Datos

- `scripts/build-fallback.mjs`, ejecutado con Node **22.23.3**, extrajo 19 economías × 9 indicadores × 12 años (2014–2025), recorriendo tres páginas por indicador, sin dependencias externas.
- Extracción final: **2026-10-18T07:16:40.460Z**; revisión WDI indicada por el proveedor: **2026-10-08**. El respaldo conserva cifras originales, `null`, `obs_status`, URLs, definiciones oficiales y `lastupdated`.
- LCN: cuenta corriente ausente en los 12 años; el agregado queda disponible como referencia y en el comparador, pero fuera del selector de país que calibra el laboratorio. Una preferencia previa LCN vuelve a PER.
- ARG IPC: sin observación en **2014–2017 y 2025**. Son siete observaciones finitas, no doce; no se rellenan.
- Documentación regenerable de definiciones, unidades, cobertura por economía/indicador, transformaciones, metas existentes e instituciones: [fuentes-wdi.md](../../fuentes-wdi.md).
- Ninguna economía nueva recibe una meta ni tasa neutral nacional inventada. Se conserva el supuesto genérico real de 1,5% y la inflación de referencia supuesta de 3% (tasa nominal inicial 4,5%). Ecuador y zona euro tienen notas institucionales con fuentes oficiales; los controles del laboratorio siguen siendo contrafactuales didácticos.

## Validación

`npx.cmd -y -p node@22 -c "node --version && npm test"` ejecuta el `npm test` del proyecto con Node 22. La salida completa está en [npm-test.txt](npm-test.txt): smoke, **42 pruebas unitarias** y **29 comprobaciones E2E**, sin eliminar pruebas previas. La sintaxis smoke excluye `test-results/` para no depender de artefactos temporales.

Los E2E usan Chromium por `file://`, con red bloqueada o respuestas controladas, y verifican cuatro economías elegidas, cambios de indicador y periodo, nulos argentinos como «sin dato», intersección de siete años comunes con ausencias aún visibles, normalización PPA, convergencia con USA = 100, crecimiento acumulado, reducción de selección y ausencia de desbordamiento a **360/390/768/1440 px**.

Comprobación adicional en Chromium con el archivo auténtico de **Chart.js 4.4.1** descargado del CDN ya configurado, servido a la página mediante interceptación de Playwright: cuatro datasets, los cuatro nulos iniciales de ARG, convergencia USA = 100, sin errores JS y sin desbordamiento a 1440 y 390 px. Se respeta `prefers-reduced-motion`; las capturas desactivan visualmente las barras fijas solo durante la captura del componente para evitar que lo tapen.

- [Comparador a 1440 px, Chart.js](comparador-1440.png).
- [Comparador a 390 px, Chart.js](comparador-390.png).
- [Años comunes a 1440 px, renderizador local](comparador-fallback-comunes-1440.png).
- [Años comunes a 390 px, renderizador local](comparador-fallback-comunes-390.png).

Los tests escriben sus capturas exclusivamente en `test-results/`, excluido de Git y Vercel. Estas cuatro imágenes se copiaron de forma explícita al directorio de evidencia tras comprobarlas; ejecutar `npm test` no las modifica.

## Alcance no verificado

No se ejecutaron push, merge, despliegue ni pruebas de una URL publicada. No se comprobaron Firefox/Safari ni dispositivos físicos. La descarga WDI real sí se ejecutó; las actualizaciones en el navegador se probaron con respuestas controladas, sin afirmar disponibilidad o CORS de la API en todos los entornos. Las notas de Ecuador y zona euro no convierten los controles genéricos del laboratorio en instrumentos nacionales efectivos. Las cotizaciones FX existentes son un respaldo separado y no se actualizaron ni validaron como cotizaciones vigentes.
