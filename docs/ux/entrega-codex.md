# Entrega del rediseño para estudiantes

Fecha: 18 de octubre de 2026. Rama: `armandoparedes2026/rediseno-codex`. Sin merge a main ni despliegue.

## Implementación y commits

| Bloque | Commit | Resultado |
|---|---|---|
| Sistema visual | `9f9c57a` | Paleta clara y oscura, preferencia del sistema y almacenamiento seguro, tokens y series |
| Navegación | `eb382ed` | Cinco rutas por hash y una barra; menú con etiquetas en móvil |
| Inicio | `7fbb232` | Tres caminos, ayuda y mención discreta de docentes |
| Fuentes | `340c56f` | Filtros compartibles, avisos, citas y fecha de comprobación |
| Ayuda | `f58bdfc` | Guías, glosario buscable enlazado desde laboratorio, FAQ y citación |
| Panorama y laboratorio | `662476c` | Lecturas fijas, citas comunes, procedencia y cabecera compacta |
| Limpieza | `4724ab1` | Retirada de carrusel, navegación antigua y efectos decorativos |
| Pruebas y correcciones | Commit que contiene este informe | Matriz A1–A13 y correcciones encontradas durante la verificación |

## Validación

`npm test`, ejecutado con `npm.cmd test` por la política de scripts de PowerShell:

- Smoke: 27 controles y 19 archivos JavaScript válidos; referencias locales y SRI originales verificados.
- Unitarias: **46 pass, 0 fail**.
- E2E: **53 comprobaciones pass, 0 fail**. Incluyen 14 combinaciones de ancho y tema, cada una con las cinco vistas: **70 pantallas**.
- Anchos: 360, 390, 768, 1024, 1280, 1440 y 1920; temas claro y oscuro.
- Respaldo sin conexión, respuestas WDI/BCRP controladas con fixtures, respuestas malformadas, paginación, caché, CSV, escenarios, capas y comparación A/B conservados.
- Contrato de integración con Chart.js probado con un doble de su API: colores resueltos, guiones/marcadores y reconstrucción al cambiar tema. El renderizador de respaldo se prueba en el navegador real; no se afirma una consulta en vivo al CDN o a los proveedores.
- Entorno: Node 24.21.0, Playwright 1.56.1 y Chromium. El repositorio declara Node 22.x; npm mostró esa diferencia de motor, sin fallos en las pruebas.

## Aceptación A1–A13

| Criterio | Estado | Evidencia |
|---|---|---|
| A1 · Sin desborde horizontal | PASS | Medición del documento en 70 pantallas |
| A2 · Sin solapamientos | PASS | Rectángulos de todos los controles expuestos, incluidos los que requieren scroll; se excluyen contenidos de acordeones cerrados |
| A3 · Objetivos táctiles | PASS | Tamaño ≥44 ×44 en controles expuestos hasta 1024 px; la etiqueta completa es el objetivo del checkbox |
| A4 · Texto sin recorte | PASS | Títulos, insignias y tarjetas con overflow que recortaría texto |
| A5 · Destinos y barra | PASS | Destino bajo la barra; barra ≤64 px escritorio y ≤56 px móvil |
| A6 · Contraste | PASS | Pares de tokens de texto ≥4,5:1, bordes/foco y series ≥3:1; gráficos sobre surface |
| A7 · Foco | PASS | Recorrido de controles expuestos y anillo de teclado con focus; orden DOM sin tabindex positivo |
| A8 · Inicio en una pantalla | PASS | Los tres caminos completos a 390×844 y 1440×900, en ambos temas |
| A9 · Simulador sobre el pliegue | PASS | Controles y primer gráfico empiezan antes de 900 px a 1440×900; medición inicial: 400 y 703 px |
| A10 · Hash y Atrás | PASS | Cinco vistas, historial, hash desconocido y menú móvil |
| A11 · Carrusel sustituido | PASS | Tres tarjetas fijas; no quedan temporizador, estado, flechas ni manejadores de pausa por foco |
| A12 · Errores | PASS | Cero errores JavaScript no capturados y cero errores de consola de aplicación; fallos de red deliberados se excluyen y se muestra el respaldo |
| A13 · file:// | PASS | Toda la matriz abre index.html directamente sin servidor |

Resultados por pantalla: [aceptacion.json](../evidence/rediseno/aceptacion.json). Capturas completas de la matriz en `test-results/rediseno/` (ignoradas por Git); selección versionada de **11 imágenes, aproximadamente 711 KiB**, en [docs/evidence/rediseno](../evidence/rediseno/). No se añadieron imágenes a docs/ux/capturas.

## Decisiones y límites

Las decisiones se detallan en [decisiones-codex.md](decisiones-codex.md).

- El acento claro se oscurece a `#A13F0A` para superar 4,5:1 también sobre surface-2. Los colores, espacios, radios y sombras se centralizan en tokens.css.
- Tres lecturas fijas sustituyen al carrusel. El inspector y las exportaciones siguen dentro de Panorama; no se retira ninguna función del modelo ni del comparador.
- La guía de escenarios sigue visible como acordeón compacto, con el simulador sobre el pliegue inicial.
- Se conserva el catálogo sin cambios. No hubo problemas del catálogo que requieran resolución.
- La propuesta UX asociaba nombres incorrectos a códigos BCRP existentes. Se verifica contra los metadatos del proxy y su fixture: **PN01273PM = IPC interanual**, **PN01207PM = tipo de cambio interbancario**, **PN00027MM = reservas internacionales netas**. El aviso metodológico de inflación se coloca en PN01273PM y junto al KPI WDI. Una regresión verifica estas correspondencias y que las fechas no sean ISO crudo.
- Se usa un helper común para citas de KPI WDI y BCRP, con el código y la fecha de extracción correspondiente a la procedencia de la observación.
- Se adaptaron las pruebas de sidebar, cue y carrusel a sus reemplazos; no se eliminaron pruebas del modelo, datos ni exportación.
- No se modifican islm-model.js, lab-content.js, sources-catalog.js, api/, .github/ ni vercel.json.

**Decisiones pendientes del coordinador:** ninguna para completar esta implementación. Corresponde revisar los commits e integrar la rama cuando se considere oportuno; no se ha desplegado.
