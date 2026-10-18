# Fuentes BCRP verificadas

Extracción real: 2026-10-18 UTC. Respuestas completas en `tests/fixtures/bcrp-*.txt` y metadatos en `docs/evidence/fase1/bcrp-series.json`.

| Código | Título oficial devuelto | Unidad | Frecuencia | Último periodo | Evidencia |
|---|---|---|---|---|---|
| PD04722MM | Tasas de interés del Banco Central de Reserva - Tasa de Referencia de la Política Monetaria | % | mensual | Oct.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04722MM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.405Z) |
| PN01273PM | Índice de precios Lima Metropolitana (var% 12 meses) - IPC | % en 12 meses | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01273PM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.621Z) |
| PN01207PM | Tipo de cambio - promedio del periodo (S/ por US$) - Interbancario - Promedio | S/ por US$ | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01207PM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.816Z) |
| PN00027MM | Cuentas monetarias del Banco Central de Reserva del Perú - Reservas Internacionales Netas (millones US$) | millones US$ | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN00027MM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:40.009Z) |

El endpoint responde con Content-Type text/html y sin Access-Control-Allow-Origin. También puede añadir diagnósticos PHP después del JSON; el parser admite ese sufijo y valida el documento, los títulos y los periodos. Una petición conjunta reordena las series; el proxy las identifica por título oficial, nunca por posición solicitada.

PN01288PM está descontinuada y se excluye. No se añadieron códigos distintos a los cuatro verificados. El proxy usa exclusivamente series mensuales, timeout de 10 segundos y caché compartida de 6 horas; se comprobó además el handler con una petición real en Node v22.23.3 (`docs/evidence/fase1/bcrp-proxy-live.json`), con HTTP 200 y las cuatro series normalizadas. La ejecución desplegada en Vercel queda pendiente de un despliegue autorizado.
