# Navegación canónica y armonización visual

La tarjeta de Inicio, el menú principal, el menú móvil, la búsqueda y los enlaces contextuales conducen a una sola experiencia por destino. Aprendizaje y Simulación son experiencias independientes; la selección activa de una no se atribuye a la otra.

| Experiencia | Destino canónico | Alias compatibles |
| --- | --- | --- |
| Inicio | `#inicio` | Hash desconocido o vacío |
| Aprendizaje guiado | `#aprendizaje` | `#aprender` |
| Análisis histórico | `#historico` | — |
| Indicadores macroeconómicos | `#indicadores` | — |
| Exploración macroeconómica / Panorama | `#exploracion` | `#panorama`, `#explorar` |
| Comparación de economías | `#comparacion` | `#comparador` |
| Simulación / Laboratorio | `#simulacion` | `#laboratorio` |
| Modelos y tendencias | `#modelos` | — |
| Observatorio del Perú | `#observatorio` | — |
| Biblioteca de fuentes | `#fuentes` | — |
| Ayuda y metodología | `#ayuda` | — |

`MacroScope.navigation` en `js/ui/navigation.js` mantiene los destinos, etiquetas, iconos y alias. El enrutador conserva los parámetros de consulta y normaliza los alias mediante `history.replaceState`: no añade una entrada redundante al historial. Las secciones tienen un `data-view` canónico estable. Se conservan la actualización directa de enlaces, Atrás/Adelante y la apertura mediante `file://` con scripts clásicos `defer`.

## Composición visual

Las siete referencias de `docs/ux/referencias/` definen la composición. Se comparte cabecera translúcida, iconografía vectorial, selección azul con subrayado, búsqueda real de experiencias/indicadores/fuentes, tipografía y superficies de hielo en claro y marino en oscuro. La portada orbital conserva sus siete tarjetas y sus interacciones.

Se elimina la cinta repetida de once botones que competía con la cabecera. Los destinos adicionales están en «Más» y en la búsqueda, también disponibles en móvil. Los enlaces contextuales entre módulos se mantienen.

El Laboratorio utiliza una franja superior de contexto, parámetros de política, cuatro diagramas, resultados reales y un panel lateral del mecanismo de transmisión. Los selectores existentes se reubican conservando nodos, IDs y eventos. Las opciones avanzadas, capas, comparación A/B, escenarios rápidos y supuestos permanecen disponibles en desplegables. Guardar escenario en la cabecera usa la persistencia existente. No se modifican el motor, las ecuaciones ni los resultados para reproducir cifras ilustrativas.

Fuentes incorpora tarjetas de organismo/recurso, filtros de acceso, ficha lateral y citación. Los distintivos textuales identifican organismos; no se incorporan logotipos remotos ni recuentos ilustrativos. Aprendizaje, Histórico, Indicadores, Modelos, Observatorio, Panorama, Comparación y Ayuda comparten el mismo lienzo y jerarquía de superficies.

## Verificación

- `npm.cmd run test:smoke`: referencias, scripts clásicos y sintaxis.
- `npm.cmd run test:unit`: conservación de contratos de datos y modelos.
- `npm.cmd run test:e2e`: navegación canónica desde tarjeta/cabecera/búsqueda/menú móvil; alias, parámetros, actualizar, Atrás/Adelante; funciones existentes y matriz responsive.
- `node tests/platform-visual.mjs`: 66 capturas de once vistas, en escritorio/tablet/móvil y claro/oscuro; medición de desbordamiento y errores JavaScript. Resultados en `test-results/platform/visual-results.json`.
- Regresión móvil de escenarios: guardar, cargar y eliminar a 360 px sin desbordamiento. Captura en `test-results/experiencias/simulacion-360-escenario-guardado.png`.

Resultado del 26 de octubre de 2026: `npm test` completo aprobado, con smoke (34 controles y 29 scripts), 73 pruebas unitarias y 87 comprobaciones E2E. La galería adicional produjo 66 capturas, sin errores JavaScript ni desbordamientos horizontales en sus mediciones. Las trece capturas representativas se publican en `docs/evidence/platform/`.

La validación de CI en Linux detectó desbordamiento con fuentes de reserva más anchas. Los enlaces contextuales de Panorama ahora pueden partir líneas dentro de su columna y los selectores del Laboratorio conservan etiquetas legibles a 360 px. Una regresión adicional comprueba Arial, Verdana y DejaVu Sans; las pruebas conservan sus límites de ancho originales.

Las capturas de la galería se realizaron sin red para verificar estados de respaldo y ausencia de datos; no certifican disponibilidad permanente de APIs externas. Se conservan los datos ausentes y su procedencia. La aproximación visual adapta las referencias a los controles, modelos y fuentes realmente implementados, sin copiar estadísticas ilustrativas ni inventar usuarios, notificaciones o resultados.

Destino de producción: <https://macroscope-dashboard.vercel.app>. El PR y la revisión de despliegue se registran en el informe de entrega después de publicarlos.
