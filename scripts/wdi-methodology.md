
## Comparador y límites

Solo NY.GDP.PCAP.CD y NY.GDP.PCAP.PP.KD admiten normalización: valor / valor del año base × 100; base ausente o cero produce null. El crecimiento acumulado encadena NY.GDP.MKTP.KD.ZG: (Π(1 + g/100) − 1) × 100, incluyendo el crecimiento del primer año seleccionado; un hueco o año omitido invalida los resultados posteriores. Se calcula antes de filtrar años comunes, para no encadenar años discontinuos. Convergencia: NY.GDP.PCAP.PP.KD del país / mismo indicador de USA en el mismo año × 100; denominador ausente o cero produce null. Años comunes es la intersección de observaciones finitas de las series seleccionadas y transformadas. Las ausencias del periodo original siguen visibles en la tabla y aviso.

US$ corrientes reflejan precios y tipos de cambio; PPA constante usa precios de 2021 y permite comparar volúmenes por habitante. No se mezclan niveles con tasas en un eje. WDI revisa datos y agregados regionales; LCN no es un país ni un banco central y no tiene cuenta corriente publicada en este periodo: se elimina el respaldo manual previo sin fuente y se excluye del selector que calibra el simulador. Desempleo es estimación modelada OIT y depende de fuentes nacionales; IPC promedio anual no equivale a diciembre contra diciembre y puede diferir por metodología nacional. No se rellenan huecos.

## Metas e instituciones

Las economías nuevas muestran «Sin meta de referencia»: no se incorporan metas sin verificación oficial. Las metas existentes se mantienen como referencias del tablero, con la cautela IPC promedio anual frente a inflación de doce meses; la Fed fija una meta sobre PCE, no IPC, y su banda visual no es una tolerancia oficial.

Fuentes oficiales de las referencias existentes, consultadas el 18 de octubre de 2026:

| Economía | Referencia conservada | Fuente oficial |
|---|---|---|
| PER | 2%, rango 1–3% | [BCRP, esquema de metas](https://investigacion.bcrp.gob.pe/es/investigaciones/revista-moneda/revista-moneda-192/moneda-192-03) |
| CHL | 3%; ±1 pp es banda de lectura del tablero | [BCCh, IPoM diciembre 2025](https://www.bcentral.cl/es/web/banco-central/contenido/-/details/publicaciones/politica-monetaria/ipom-diciembre-2025) |
| COL | 3%, rango 2–4% | [Banco de la República, meta de inflación](https://banrep.gov.co/es/banrep-educa/econo-cimientos/que-es-meta-inflacion) |
| MEX | 3%, intervalo de variabilidad ±1 pp | [Banco de México, educación](https://educa.banxico.org.mx/recursos/videos/video--cuidando-valor-del-d.html) |
| BRA | 3%, tolerancia ±1,5 pp; marco continuo desde 2025 | [BCB, inflation targeting](https://www.bcb.gov.br/en/monetarypolicy/Inflationtargeting) |
| USA | 2% sobre PCE; ±1 pp es solo banda visual | [Federal Reserve, PCE](https://www.federalreserve.gov/economy-at-a-glance-inflation-pce.htm) |

Todos los países nuevos usan la tasa neutral genérica ya existente de 1,5% real, como supuesto ilustrativo y nunca como estimación nacional. La inflación de referencia de 3% cuando falta meta también es un supuesto didáctico, no una meta nacional; la suma produce una tasa nominal inicial de 4,5%.

Ecuador adoptó la dolarización en 2000 ([Banco Central del Ecuador](https://www.bce.fin.ec/25/index.html)); se identifica como régimen fijo extremo sin política monetaria propia. Alemania y España pertenecen al Eurosistema: la política monetaria es común y no nacional ([Banco Central Europeo](https://www.ecb.europa.eu/ecb/orga/escb/eurosystem-mission/html/index.en.html)). Los controles del laboratorio son contrafactuales didácticos y no instrumentos nacionales efectivos para estas economías.
