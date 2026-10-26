# Panorama UI, referencia visual de siete módulos

## Decisión aprobada

El usuario suministra `image(7).png` como referencia obligatoria y pide reproducirla con la mayor fidelidad posible y datos reales. Indica expresamente que Panorama debe ser el destino de una de las siete tarjetas del inicio. La tarjeta existente **03/07 — Indicadores macroeconómicos**, que enlaza `#panorama`, identifica ese módulo; no se edita la portada, que se desarrolla en paralelo.

## Enfoque

- Composición de la referencia: cabecera compacta, un renglón de filtros y cuatro pestañas, seis tarjetas alineadas, gráfico principal de PBI (izquierda), IPC (centro), lecturas (derecha); bajo los dos primeros gráficos, tres gráficas pequeñas; notas de fuente al pie. Desplazar la complejidad histórica por debajo de “Profundiza en los datos”, fuera de la primera pantalla.
- Azul hielo, bordes sutiles, fondo translúcido, sombras livianas, tipografía de alto contraste y controles táctiles de al menos 44 px. Diseño adaptable a 360–1920 px, modo oscuro y movimiento reducido.
- Conservar API, estados offline, documentación y comparaciones existentes. No modificar el inicio de siete tarjetas ni la navegación global.
- Las seis tarjetas principales conservan PBI, IPC, desempleo OIT nacional, tipo de cambio, balanza comercial y confianza. Las series adicionales de tasa de referencia y reservas existentes en BCRP se exponen mediante “Más indicadores” bajo demanda; no se inventan nuevos KPI.
- El gráfico principal admite **Nivel** y **Var. %**: nivel de PBI mensual desestacionalizado `PN01773AM`, reescalado con el promedio de 2015=100, y crecimiento interanual trimestral `PN02507AQ`. No interpretar una tasa de crecimiento como nivel de producto.
- El panel IPC incorpora líneas reales del IPC y referencias visuales del rango objetivo de 1–3 % solo para Perú, claramente identificadas.
- El panel comercial puede contrastar exportaciones `PN38714BM`, importaciones `PN38718BM` y saldo `PN38723BM`, con fechas y unidades consistentes. Otros países conservan indicadores WDI anuales y no heredan series BCRP.
- La fuente/período de cada tarjeta y los estados de respuesta parcial son visibles; ningún valor de muestra de la imagen entra en la aplicación.

## Alternativas y trade-offs

1. Solo ajustar CSS: menor cambio, pero imposible reproducir la jerarquía exacta de los tres gráficos y la composición inferior.
2. **Reorganizar Panorama con el DOM y scripts existentes**: reproduce la imagen, mantiene rutas y pruebas, permite paneles expansibles. Elegida por la instrucción expresa de fidelidad.
3. Migrar a framework: reescritura amplia y riesgo de conflicto con la otra rama de la portada, descartada.

## Criterios de aceptación

- Seis indicadores iniciales en una fila a anchura grande y adicionales expandibles sin perder los iniciales.
- Grilla 3 columnas y 2 filas como la referencia, sin solapamientos de controles ni scroll horizontal a 360/390/768/1440/1672 px.
- `#panorama` sigue conectado a la tarjeta 03/07; los otros flujos se mantienen operativos.
- Datos reales/cálculos derivados etiquetados, API oficial verificable, fallo parcial no anula fuentes válidas.
- `npm test` completo y capturas de 1672x941 + móvil oscuro/claro tras el cambio.
