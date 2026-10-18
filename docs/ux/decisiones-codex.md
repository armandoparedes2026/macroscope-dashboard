# Decisiones de implementación

- Se adopta Cuaderno Índigo y Cobre Solar. El acento claro se oscurece a `#A13F0A`: la propuesta original no alcanzaba 4,5:1 sobre la superficie secundaria.
- Los gráficos se presentan sobre `--surface`; las seis series se resuelven desde estilos computados, con guiones y marcadores redundantes. Cambiar de tema reconstruye gráficos y diagramas.
- Se sustituyen fondos radiales, trama y efectos de perspectiva por superficies planas. Los colores heredados se expresan con tokens semánticos; sus mezclas transparentes viven únicamente en tokens.css.
- Se conservan las familias existentes con los siete pesos recomendados y Georgia del sistema.
- Se reemplaza el carrusel por tres lecturas fijas. Se retiran temporizador, estado, manejadores de foco y CSS exclusivos del carrusel. A11 se verifica como ausencia de automatismo.
- El inspector de API y la exportación CSV se conservan dentro de Panorama. La barra única ofrece las cinco rutas; en pantallas estrechas abre un menú con etiquetas.
- El escenario guiado se mantiene como acordeón visible y compacto: abrirlo es una elección del estudiante, mientras el simulador permanece sobre el pliegue inicial. Se preservan todos sus escenarios, predicciones y explicaciones.
- Las pruebas antiguas de sidebar, carrusel y cue se adaptan a navegación por hash y lecturas fijas; se conservan las regresiones del modelo, fuentes, BCRP, comparador, respaldo y exportaciones.
