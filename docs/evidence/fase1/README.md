# Evidencia de fase 1

Se integró `audit/technical-review` (2180438) por fast-forward antes de editar la UI. La línea base pasó con 22 pruebas de motor y 14 e2e; no se editaron `js/islm-model.js` ni sus pruebas.

- `npm-test.txt`: ejecución final exitosa de `npm test`: smoke, 27 unitarias (22 del motor y 5 BCRP), 24 e2e. Runtime local principal Node v24.21.0; las 5 pruebas BCRP también pasaron con Node v22.23.3.
- `hero-1440.png`, `hero-768.png`, `hero-390.png`, `hero-360.png`: capturas tras pulsar Explorar análisis; las pruebas comprueban foco, posición bajo los sticky y ausencia de desborde en panorama, simulador y datos, a 1440×900, 768×1024, 390×844 y 360×740.
- `wdi-NE.RSB.GNFS.ZS.json`, `wdi-NE.IMP.GNFS.ZS.json`: respuestas de la API real para PER;CHL;COL;MEX;BRA;USA;LCN, 2014:2025, con fecha de extracción. Los nulos originales se conservan, incluido USA 2025. Los valores respaldados en index.html provienen de estas respuestas sin redondeo.
- `bcrp-request.json`, `bcrp-series.json`: solicitud conjunta y comprobación individual de los cuatro códigos oficiales. Los fixtures originales completos están en `tests/fixtures/`; contienen un sufijo de diagnósticos HTML del proveedor después del JSON.
- `bcrp-proxy-live.json`: handler local ejecutado con Node v22.23.3 contra BCRP real, HTTP 200 y cuatro series; conserva último periodo, valor, procedencia y cabecera de caché.

El conector WDI se prueba con red interceptada: paginación, nulos, último año disponible, caché vigente y vencida, actualización manual, fallo y respuesta malformada con dos reintentos. El panel BCRP se prueba con éxito, fallo HTTP y respuesta malformada. La copia file:// necesita un servidor con el proxy BCRP para obtener sus datos en vivo; presenta un mensaje explícito al no disponer de él.

## Límites de verificación

No se hizo push, merge a main ni deploy. No se verificó el empaquetado ni la ejecución de funciones en Vercel desplegado, su caché CDN efectiva, ni una sesión de navegador contra las ocho series WDI reales simultáneamente; los e2e aíslan la red y la verificación WDI real cubre los dos indicadores nuevos. No se verificaron ni añadieron otros códigos BCRP; PN01288PM se excluye por la descontinuación indicada por el coordinador. Los respaldos previos de otros indicadores se conservaron y su fecha de extracción no registrada se muestra como tal. El respaldo local de NX y la cuenta corriente pueden tener distintos años de observación: la UI los identifica y advierte que NFI se calibra con esos cortes, sin presentarlos como una observación conjunta.
