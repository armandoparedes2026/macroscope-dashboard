# Comparación de economías — diseño premium

## Propósito

Convertir la tarjeta «Comparación de economías» de Inicio en un módulo de pantalla completa, visualmente cercano a la referencia adjunta (superficies azul hielo, blancos translúcidos, acentos cobalto, controles horizontales y composición densa de gráficos), sin sustituir la identidad Macroscope ni afectar las rutas de Panorama, Laboratorio o Fuentes.

## Decisión y alternativas

- **A: pantalla independiente** (`#comparacion`), aprobada por Cristofer. Ofrece espacio para análisis sincronizado y conserva el comparador histórico dentro de Panorama mientras los otros módulos evolucionan.
- B: panel ampliado dentro de Panorama. Menos navegación, pero sin el lienzo que necesita la referencia.

## Alcance aceptado

1. La tarjeta de Inicio y la navegación abren `#comparacion`; el enlace histórico `#panorama?focus=compare` sigue funcionando en Panorama.
2. Cabecera y barra de filtros con hasta cuatro economías sin duplicados, periodo anual, indicador central y vistas de indicadores/ranking/regiones. Mínimo una economía.
3. Seis tarjetas de series WDI, gráfico histórico, visualización geográfica contextual, ranking del mismo año, comparaciones crecimiento/inflación y desempleo, tabla y conclusiones automáticas limitadas a observaciones calculables.
4. Toda cifra procede de `runtimeDB` existente; se muestran unidad, año y procedencia de API WDI o respaldo local. Los vacíos permanecen vacíos. La imagen es guía visual, no fuente de cifras.
5. Exportación CSV con datos, año, indicador, países y procedencia; no se anuncia un PDF inexistente.
6. Diseño independiente mediante `css/comparison.css`, responsive (360, 390, 768, 1440 px), tema claro/oscuro, teclado, foco visible y movimiento reducido.

## Restricciones

- Conservar arquitectura HTML/CSS/JS clásico, Chart.js con respaldo local, WDI y los métodos de comparación existentes.
- Los indicadores internacionales actuales son **anuales**. No introducir falsamente «trimestral», «tasa de referencia» ni tipo de cambio comparables sin nuevas series oficiales homogéneas.
- La localización del mapa es orientativa y no constituye una cartografía estadística de coropletas.
- Los indicadores no implican automáticamente juicios de bienestar ni causalidad; usar términos descriptivos.
- La rama `feat/comparacion-economias-premium` no modifica producción ni se fusiona automáticamente.

## Comprobación

- Pruebas puras: selección de países, ranking por año común, valores faltantes y narrativa sustentada.
- E2E: navegación desde tarjeta Inicio, filtros, botones de vista, CSV, casos sin datos y ausencia de desplazamiento horizontal.
- Capturas de escritorio y móvil; prueba completa `npm test` y revisión de tema oscuro.
