# Plan — mapas vectoriales OpenFreeMap

**Spec:** `docs/superpowers/specs/2026-10-25-mapas-openfreemap.md`.

### 1. Datos geográficos y transformación pura
- [x] Pruebas RED de selección de GeoJSON, año común y extremos de escala, sin inventar datos.
- [x] Incorporar Natural Earth local (dominio público) y función pura de unión ISO3/WDI.
- [x] GREEN unitarias; comprobada geometría de 18 países.

### 2. Motor cartográfico y fallback
- [x] Prueba E2E offline existente; prueba real con navegador y WebGL, teselas y GeoJSON mediante servidor HTTP.
- [x] Integrar MapLibre 5 UMD con OpenFreeMap, capa temática, marcadores, popups y zoom.
- [x] Dark mode, atribución, errores WebGL/teselas, movimiento reducido y mobile.
- [x] GREEN E2E offline y comprobación manual del mapa real en claro/oscuro sin errores JavaScript.

### 3. QA y publicación aislada
- [x] `npm test` completo, capturas y revisión visual.
- [x] README y limitaciones de los datos.
- [ ] Commit, actualización del PR #7 y preview de Vercel con comprobación HTTP.
