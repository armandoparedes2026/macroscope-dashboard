# Fuentes BCRP verificadas

Extracción de las cuatro series iniciales: 2026-10-18 UTC. Respuestas completas en `tests/fixtures/bcrp-*.txt` y metadatos en `docs/evidence/fase1/bcrp-series.json`.

| Código | Título oficial devuelto | Unidad | Frecuencia | Último periodo | Evidencia |
|---|---|---|---|---|---|
| PD04722MM | Tasas de interés del Banco Central de Reserva - Tasa de Referencia de la Política Monetaria | % | mensual | Oct.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04722MM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.405Z) |
| PN01273PM | Índice de precios Lima Metropolitana (var% 12 meses) - IPC | % en 12 meses | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01273PM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.621Z) |
| PN01207PM | Tipo de cambio - promedio del periodo (S/ por US$) - Interbancario - Promedio | S/ por US$ | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01207PM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:39.816Z) |
| PN00027MM | Cuentas monetarias del Banco Central de Reserva del Perú - Reservas Internacionales Netas (millones US$) | millones US$ | mensual | Sep.2026 | [API real](https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN00027MM/json/2024-1/2026-10) (HTTP 200, 2026-10-18T06:42:40.009Z) |

El endpoint responde con Content-Type text/html y sin Access-Control-Allow-Origin. También puede añadir diagnósticos PHP después del JSON; el parser admite ese sufijo y valida el documento, los títulos y los periodos. Una petición conjunta reordena las series; el proxy las identifica por título oficial, nunca por posición solicitada.

PN01288PM está descontinuada y se excluye. En la fase inicial, el proxy utilizaba exclusivamente estas cuatro series mensuales, timeout de 10 segundos y caché compartida de 6 horas; se comprobó el handler en Node v22.23.3 (`docs/evidence/fase1/bcrp-proxy-live.json`). La ampliación descrita a continuación incorpora dos series mensuales y una trimestral; su publicación en Vercel depende de integrar y desplegar la rama de Panorama.

## Indicadores complementarios del nuevo Panorama

| Código | Variable observada | Unidad | Frecuencia | Catálogo oficial |
| --- | --- | --- | --- | --- |
| `PN02507AQ` | PBI global, crecimiento interanual | % | Trimestral | [BCRP, PBI variaciones trimestrales](https://estadisticas.bcrp.gob.pe/estadisticas/series/trimestrales/producto-bruto-interno-variaciones-porcentuales) |
| `PD38045AM` | Expectativa empresarial de la economía a 3 meses | Puntos | Mensual | [BCRP, expectativas](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/expectativas-empresariales-m) |
| `PN38723BM` | Balanza comercial FOB | Millones US$ | Mensual | [BCRP, balanza comercial](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/balanza-comercial) |
| `PN01773AM` | PBI mensual desestacionalizado, índice original 2007=100 | Índice | Mensual | [BCRP, PBI índice](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/producto-bruto-interno-y-demanda-interna-variaciones-indice-2007) |
| `PN38714BM` | Exportaciones FOB | Millones US$ | Mensual | [BCRP, balanza comercial](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/balanza-comercial-mill-usd-m-bpm6) |
| `PN38718BM` | Importaciones FOB | Millones US$ | Mensual | [BCRP, balanza comercial](https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/balanza-comercial-mill-usd-m-bpm6) |

Las series nuevas se consultan junto a las ya existentes mediante el proxy `/api/bcrp`, agrupadas por frecuencia. El API BCRP publica `T1.26` para el primer trimestre de 2026: el parser conserva el periodo original y normaliza la fecha a `2026-01-01`. El acumulado de doce meses exige doce observaciones mensuales consecutivas y se marca como derivado, no como valor publicado por el BCRP.

La vista **Nivel** del PBI usa el índice mensual desestacionalizado del BCRP (`PN01773AM`). Macroscope lo rebasa con el promedio aritmético de los doce meses de **2015 = 100**, sin interpolar ni inventar observaciones. Si falta algún mes o el índice es inválido, no ofrece ese modo y mantiene el crecimiento interanual trimestral. Se registra en la gráfica como cálculo derivado. Las barras y líneas del minigráfico del sector externo proceden de los valores mensuales FOB de saldo, exportaciones e importaciones, no de la suma móvil de 12 meses que se muestra en la tarjeta principal.

Consulta real de contraste del 25 de octubre de 2026: la última observación numérica disponible de `PN02507AQ` correspondía a **T2.26**, `PD38045AM` a **Sep.2026** y `PN38723BM` a **Ago.2026**. La conexión comprueba el último valor publicado y no fuerza que todas las series tengan la misma fecha.
