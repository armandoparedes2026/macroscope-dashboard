# Panorama premium de Macroscope — diseño aprobado

## Intención

Transformar la vista `#panorama` en un panel económico premium, inspirado en la captura de referencia: encabezado editorial, controles compactos, seis indicadores visuales, gráficos coordinados y lectura económica contextual. El propósito es aprender economía aplicada usando cifras oficiales, fechas y unidades auditables.

## Objetivos

- Pantalla inicial de Panorama con Perú seleccionado y análisis internacional WDI disponible.
- Diseño blanco, hielo y azul cobalto, con superficies sutilmente translúcidas, transiciones funcionales, modo oscuro y presentación responsive.
- Conservar, debajo del nuevo resumen, comparador internacional de hasta cuatro economías, datos tabulares, inspector de consultas y herramientas existentes.
- Incorporar BCRP trimestral para actividad y mensual para inflación, tipo de cambio, balanza comercial y expectativas; conservar sus metadatos y fecha observada.
- Mostrar seis KPI sin confundir series WDI anuales con BCRP mensuales o trimestrales.
- Dar información honesta: valor, unidad, periodo de observación, origen, extracción y ausencia de datos; no reutilizar cifras estáticas de la imagen ni inferir desempleo urbano desde la serie WDI nacional.
- Interacciones accesibles: filtros, tarjetas que seleccionan series, categorías de actividad/precios/laboral/sector externo, tooltips de gráficos, enlaces a fuentes, estados de carga/error y exportación ya existente.

## Restricciones

- HTML/CSS/JS clásicos, namespace `globalThis.MacroScope`, sin añadir bundler ni nuevas dependencias de producción.
- No modificar Inicio, las animaciones orbitales, el simulador ni la navegación global; la otra conversación trabaja Inicio en una rama separada.
- Trabajar en `feature/panorama-premium-official-data`, sin actualizar `main` ni despliegue productivo.
- Adaptar los datos y gráficos a la fuente/periodicidad disponible; nunca interpolar, rellenar observaciones vacías ni sustituir en silencio valores oficiales por respaldo local.
- BCRPData permite lotes de hasta diez códigos de una misma frecuencia. Consultar periodos válidos, aplicar límites y cache en el proxy existente.
- El desempleo WDI/ILO es nacional anual; hasta documentar una serie INEI programáticamente verificable, rotularlo como tal.
- Rendimiento móvil, keyboard focus visible y `prefers-reduced-motion`.

## Enfoques considerados

1. **Elegido: híbrido premium.** Replica la estructura visual de la captura arriba, mientras mantiene herramientas profundas bajo el primer pliegue. Equilibrio entre referencia y escalabilidad.
2. Compacto de una pantalla. Mayor parecido literal, pero datos pequeños y menos espacio para análisis y trazabilidad.
3. Modular exclusivamente por categorías. Escalable, pero menos cercano a la captura.

## Diseño propuesto

1. `panorama-hero`: encabezado y acciones con periodo actualizado de datos, no fecha ficticia.
2. `panorama-controls`: país, ventana de análisis, comparación, sincronización; barra de segmentos que cambia los gráficos principales, no los datos subyacentes.
3. `panorama-kpis`: actividad trimestral BCRP, inflación mensual, desempleo nacional anual WDI, tipo de cambio mensual, balanza comercial mensual con acumulado 12 meses sólo si existen doce meses completos y expectativas de la economía a 3 meses. Cada tarjeta muestra fuente/fecha y mini-tendencia; si falta la fuente, N/D, nunca valores de ejemplo.
4. `panorama-stage`: gráfico principal más uno secundario según categoría y un panel de lectura económica generado con reglas transparentes; no formular causalidad o predicciones automáticas.
5. `panorama-depth`: componentes WDI existentes en `tab-overview` tras un separador explicativo (comparaciones anuales y evidencia), sin romper IDs/eventos.
6. BCRP agrupado por frecuencia (mensual/trimestral); límites de tiempo, títulos y formato validados antes de usar.

## Verificación y criterios de aceptación

- `npm test` sin regresiones; pruebas unitarias del parser para frecuencia trimestral, nulos, códigos desconocidos y título inesperado.
- Pruebas del modelo de KPI ante ausencias, periodos desalineados, cambios de signo, insuficiencia de ventana de 12 meses y no extrapolación.
- E2E: abrir Panorama, navegar filtros y segmentos, fuentes verificables, actualizar/error sin datos ficticios, vista móvil y tema oscuro.
- Capturas de escritorio/móvil inspeccionadas visualmente cuando esté disponible Playwright Chromium.
- README y matriz breve de códigos, fuente, periodicidad, cobertura y limitaciones.
