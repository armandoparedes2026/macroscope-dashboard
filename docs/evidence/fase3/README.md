# Fase 3 · laboratorio en una pestaña

Se integraron primero las ramas `audit/technical-review` (merge `66da2ea`),
`armandoparedes2026/comparador-codex` (merge `b84a75e`) y
`feature/graficos-antigravity` (merge `43b92a7`). El prototipo es referencia de
componentes; la aplicación no carga sus archivos.

## Cambios

- Panel A de configuración y panel B de experimentación con cinco grupos plegables.
  En escritorio el panel queda al lado de los cuatro diagramas; en tablet/móvil es
  un acordeón superior y los diagramas se apilan en móvil.
- Capas de curvas, líneas iniciales discontinuas, puntos E₀/E₁/E₂ y causa del cambio.
  Canvas persistentes con interpolación de 400 ms y modo sin animación por preferencia
  de movimiento reducido; las coordenadas dibujadas quedan en `data-points`.
- Resultados y comparación A/B con unidades de `compareEquilibria`, multiplicadores
  numéricos y fórmulas analíticas disponibles en nivel avanzado. NX, NFI y CA están separados.
  La tabla adopta tarjetas con etiquetas por equilibrio en móvil.
- Escenarios de `LAB_CONTENT`, predicción obligatoria, ejecución, calificación con
  `gradePrediction`, mecanismo y contraste teórico; comparación entre regímenes con
  calibración común cuando el escenario contiene `compareWith`.
- Tres niveles, glosario contextual, referencias y diálogo accesible «¿Por qué?».
  La calibración observada está en un bloque de procedencia separado; se mantiene
  la advertencia explícita de simulación teórica. Se explica el aislamiento de shocks
  autónomos de NX bajo flotación como propiedad de la especificación para toda movilidad.
- Registro `MacroScope.labs.islm` documentado en `docs/arquitectura.md`.
- F15: topbar opaca y estado de API en una fila flexible en pantallas pequeñas,
  sin elipsis ni superposición del título subyacente. Estas reglas viven en
  `css/islm.css`; no se editó la lógica del comparador, WDI, overview ni el fallback,
  y no se hicieron cambios propios en `layout.css` ni `components.css`.

## Evidencia reproducible

`npm.cmd test` ejecuta smoke, todas las pruebas unitarias existentes y e2e de Chromium.
La salida completa está en `npm-test.txt`; los e2e regeneran las capturas de esta carpeta.
Resultado: ejecución completa en verde. Las capturas de elementos largos ocultan la
topbar y navegación fija para no fotografiarlas encima del contenido fuera del viewport;
las capturas `laboratorio-viewport-*` muestran la cabecera real para revisar F15.
El entorno de ejecución disponible fue Windows con Node 24.21.0 (el paquete declara Node 22).

- `laboratorio-{1440,768,390,360}.png`: sección completa del laboratorio.
- `laboratorio-viewport-{1440,768,390,360}.png`: vista del primer diagrama y su entorno.
- `parametros-{768,390,360}.png`: acordeón de parámetros abierto y operable.
- `escenario-guiado-completo.png`: predicción, calificación y contraste entre regímenes.

Los nuevos e2e verifican predicción incompleta, calificación correcta, los tres niveles,
ayuda y cierre con Escape, comparación de regímenes, A/B inmutable, unidades, capas,
movimiento reducido, restauración y los cuatro tamaños. Comprueban ausencia de overflow,
ancho de los diagramas, ajuste del texto de los controles y estado API sin recorte.
Al terminar la animación, comparan las coordenadas que recibió el renderizador para
E₀/E₁/E₂ en cada canvas con los valores de `solve()` con tolerancia de 1e−9.

## Límites de verificación

No se verificaron Safari, Firefox, dispositivos físicos, lectores de pantalla ni
conexiones reales a proveedores: los e2e controlan la red con bloqueo y fixtures.
No se ejecutó con Node 22 porque el entorno tiene Node 24. No se hizo push, merge a
main ni despliegue. Las capturas antiguas de fases 1/modularización que ya estaban
modificadas permanecen fuera del commit de esta fase; las pruebas existentes regeneran
esos archivos.
