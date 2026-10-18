# Evidencia: modularización incremental

## Referencia y entorno

Las capturas `before/` se tomaron antes de extraer CSS o JavaScript, después de integrar `audit/technical-review`. `reference-index.html.txt` conserva el HTML utilizado para la referencia. Las capturas `after/` corresponden a la extracción completa.

- URL local `file://`; Chromium de Playwright 1.56.1; Node 24.21.0 en Windows (CI conserva Node 22).
- Viewports de 1440 × 900 y 390 × 900, DPR 1.
- Panorama, IS–LM y Datos; temas oscuro y claro: **12 pares de página completa**.
- Todas las solicitudes HTTP(S) bloqueadas, incluidos Chart.js y fuentes: usa datos y gráficos de respaldo.
- Fecha fija: `2026-10-18T12:00:00Z`; localStorage vacío antes de cada combinación de tamaño y tema.
- Movimiento reducido; scroll de toda la página para resolver observadores de aparición; captura después de volver al inicio.

## Método y umbral

El script `tests/visual-modularization.mjs` compara primero los buffers PNG. Después decodifica ambos PNG con el canvas de Chromium y recorre todos los píxeles RGBA, sin dependencias nuevas. Exige dimensiones idénticas; cuenta un píxel como cambiado si al menos un canal difiere **más de 8/255**, y falla si la fracción supera **0,001 (0,1 %)**. Este margen permite pequeñas diferencias de rasterizado, pero no tolera desplazamientos de estructura.

**Resultado: los 12 pares tienen buffers PNG idénticos, cero píxeles cambiados y diferencia máxima de canal cero.** El informe verificable está en `visual-comparison.json`. No se aplicaron máscaras ni se excluyeron regiones.

| Tamaño | Tema | Panorama | IS–LM | Datos |
| --- | --- | --- | --- | --- |
| 1440 px | Oscuro | Idéntico | Idéntico | Idéntico |
| 1440 px | Claro | Idéntico | Idéntico | Idéntico |
| 390 px | Oscuro | Idéntico | Idéntico | Idéntico |
| 390 px | Claro | Idéntico | Idéntico | Idéntico |

## Pruebas y límites

`npm-test.txt` contiene la salida completa de `npm test`: smoke, 36 unitarias y 24 comprobaciones e2e. Las pruebas se ejecutaron completas y en verde después de cada paso: CSS, configuración/datos, servicios y UI. En Windows se utilizó `npm.cmd` porque la política de PowerShell impide ejecutar `npm.ps1`; la orden npm y su script son los mismos.

La comparación visual comprueba el modo offline determinista solicitado. Los e2e adicionales simulan WDI (paginación, nulos, reintentos, caché) y BCRP (éxito, error HTTP y respuesta inválida). No certifican disponibilidad actual de APIs, tipografías remotas o CDN.

Los fixtures WDI de `tests/fixtures/wdi-*.json` se descargaron del API real el 18 de octubre de 2026: dos páginas de Perú, una serie de EE. UU. con 2025 nulo y el error de un indicador inválido. URLs y fecha están en `tests/fixtures/wdi-source.json`. Estas descargas no modificaron el respaldo que utiliza la aplicación.

El archivo HTML final tiene **188 líneas**, conserva el SRI de Chart.js y carga scripts clásicos con `defer`. Los archivos protegidos `js/islm-model.js`, `js/lab-content.js` y sus pruebas permanecen sin modificaciones respecto de la integración de auditoría.

## Reproducir

```bash
npm test
node tests/visual-modularization.mjs after
```

El modo `before` recrea la referencia y solo debe ejecutarse sobre una versión elegida deliberadamente como nuevo punto de comparación. Las capturas `e2e-hero-*.png` pertenecen a los e2e habituales y no forman parte de los 12 pares comparados.
