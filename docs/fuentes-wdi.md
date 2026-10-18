# Fuentes y transformaciones WDI

Extracción: **2026-10-18T07:16:40.460Z**. Fuente: World Development Indicators (API v2). Periodo solicitado: 2014–2025; frecuencia anual. Regenerar con Node 22: `node scripts/build-fallback.mjs`. Se recorren todas las páginas; se preservan null y obs_status sin redondear, interpolar ni sustituir por cero. lastupdated es la fecha del proveedor, distinta de extractedAt, y se conserva por indicador en FALLBACK_METADATA. Las cotizaciones FX anteriores son un respaldo referencial separado y no provienen de WDI.

| Código | Nombre y definición oficial WDI | Unidad | Frecuencia | Transformación | Extracción / última revisión WDI |
|---|---|---|---|---|---|
| [NY.GDP.MKTP.KD.ZG](https://api.worldbank.org/v2/indicator/NY.GDP.MKTP.KD.ZG?format=json) | GDP growth (annual %). Gross domestic product is the total income earned through the production of goods and services in an economic territory during an accounting period. It can be measured in three different ways: using either the expenditure approach, the income approach, or the production approach. This indicator denotes the percentage change over each previous year of the constant price (base year 2015) series in United States dollars. | % anual | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [FP.CPI.TOTL.ZG](https://api.worldbank.org/v2/indicator/FP.CPI.TOTL.ZG?format=json) | Inflation, consumer prices (annual %). Inflation as measured by the consumer price index reflects the annual percentage change in the cost to the average consumer of acquiring a basket of goods and services that may be fixed or changed at specified intervals, such as yearly. | % anual (promedio) | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [SL.UEM.TOTL.ZS](https://api.worldbank.org/v2/indicator/SL.UEM.TOTL.ZS?format=json) | Unemployment, total (% of total labor force) (modeled ILO estimate). Unemployment refers to the share of the labor force that is without work but available for and seeking employment. | % fuerza laboral (OIT, modelado) | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [NY.GDP.PCAP.CD](https://api.worldbank.org/v2/indicator/NY.GDP.PCAP.CD?format=json) | GDP per capita (current US$). Gross domestic product is the total income earned through the production of goods and services in an economic territory during an accounting period. It can be measured in three different ways: using either the expenditure approach, the income approach, or the production approach. The core indicator has been divided by the general population to achieve a per capita estimate.This indicator is expressed in current prices, meaning no adjustment has been made to account for price changes over time. This indicator is expressed in United States dollars. | US$ actuales | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [NE.EXP.GNFS.ZS](https://api.worldbank.org/v2/indicator/NE.EXP.GNFS.ZS?format=json) | Exports of goods and services (% of GDP). Exports of goods includes changes in the economic ownership of goods from residents of the compiling economy to non-residents, irrespective of physical movement of goods across national borders. Exports of services includes services provided by residents to non-residents. This indicator is expressed as a percentage of Gross Domestic Product (GDP) which is the total income earned through the production of goods and services in an economic territory during an accounting period. | % del PBI | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [BN.CAB.XOKA.GD.ZS](https://api.worldbank.org/v2/indicator/BN.CAB.XOKA.GD.ZS?format=json) | Current account balance (% of GDP). Balance of current transactions (transactions in goods and services, earned income and transfer income) between residents and non-residents. The term current account balance is used in the external accounts and is expressed from the perspective of resident units. The term current external balance is used in the national accounts and is expressed from the perspective of the non-resident units, and therefore with the opposite sign. This indicator is expressed as a percentage of Gross Domestic Product (GDP) which is the total income earned through the production of goods and services in an economic territory during an accounting period. | % del PBI | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [NY.GDP.PCAP.PP.KD](https://api.worldbank.org/v2/indicator/NY.GDP.PCAP.PP.KD?format=json) | GDP per capita, PPP (constant 2021 international $). This indicator provides values for gross domestic product (GDP) per person expressed in constant international dollars, converted by purchasing power parities (PPPs). PPPs account for the different price levels across countries and thus PPP-based comparisons of economic output are more appropriate for comparing the output of economies and the average material well-being of their inhabitants than exchange-rate based comparisons.   Gross domestic product is the total income earned through the production of goods and services in an economic territory during an accounting period. It can be measured in three different ways: using either the expenditure approach, the income approach, or the production approach. The core indicator has been divided by the general population to achieve a per capita estimate. This indicator is expressed in constant prices, meaning the series has been adjusted to account for price changes over time. The reference year for this adjustment is 2021. The PPP conversion factor is a currency conversion factor and a spatial price deflator. PPPs convert different currencies to a common currency and, in the process of conversion, equalize their purchasing power by eliminating the differences in price levels between countries, thereby allowing volume or output comparisons of GDP and its expenditure components. | dólares internacionales constantes de 2021 | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [NE.RSB.GNFS.ZS](https://api.worldbank.org/v2/indicator/NE.RSB.GNFS.ZS?format=json) | External balance on goods and services (% of GDP). The balance of international trade in goods and services is the difference between the exports and imports of goods and services. This indicator is expressed as a percentage of Gross Domestic Product (GDP) which is the total income earned through the production of goods and services in an economic territory during an accounting period. | % PBI | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |
| [NE.IMP.GNFS.ZS](https://api.worldbank.org/v2/indicator/NE.IMP.GNFS.ZS?format=json) | Imports of goods and services (% of GDP). Imports of goods includes change in the economic ownership of goods from non-residents to     residents of the compiling economy, irrespective of physical movement of goods across national borders. Imports of services includes services provided by non-residents to residents. This indicator is expressed as a percentage of Gross Domestic Product (GDP) which is the total income earned through the production of goods and services in an economic territory during an accounting period. | % PBI | Anual | Ninguna en el respaldo | 2026-10-18T07:16:40.460Z; 2026-10-08 |

## Cobertura por economía e indicador

Cuenta observaciones finitas en el periodo solicitado; último año con dato real. Los años ausentes permanecen null.

| Economía | Indicador | Cobertura | Último año | Años sin dato |
|---|---|---|---|---|
| PER — Perú | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| PER — Perú | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| PER — Perú | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| PER — Perú | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| PER — Perú | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| PER — Perú | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| PER — Perú | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| PER — Perú | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| PER — Perú | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHL — Chile | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| CHL — Chile | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| CHL — Chile | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| CHL — Chile | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| CHL — Chile | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHL — Chile | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| CHL — Chile | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| CHL — Chile | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHL — Chile | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| COL — Colombia | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| COL — Colombia | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| COL — Colombia | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| COL — Colombia | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| COL — Colombia | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| COL — Colombia | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| COL — Colombia | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| COL — Colombia | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| COL — Colombia | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| MEX — México | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| MEX — México | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| MEX — México | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| MEX — México | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| MEX — México | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| MEX — México | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| MEX — México | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| MEX — México | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| MEX — México | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| BRA — Brasil | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| BRA — Brasil | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| BRA — Brasil | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| BRA — Brasil | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| BRA — Brasil | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| BRA — Brasil | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| BRA — Brasil | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| BRA — Brasil | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| BRA — Brasil | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | FP.CPI.TOTL.ZG | 11/12 | 2024 | 2025 |
| USA — Estados Unidos | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | NE.EXP.GNFS.ZS | 11/12 | 2024 | 2025 |
| USA — Estados Unidos | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| USA — Estados Unidos | NE.RSB.GNFS.ZS | 11/12 | 2024 | 2025 |
| USA — Estados Unidos | NE.IMP.GNFS.ZS | 11/12 | 2024 | 2025 |
| LCN — Latinoamérica y el Caribe | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | BN.CAB.XOKA.GD.ZS | 0/12 | sin dato | 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025 |
| LCN — Latinoamérica y el Caribe | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| LCN — Latinoamérica y el Caribe | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| ARG — Argentina | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| ARG — Argentina | FP.CPI.TOTL.ZG | 7/12 | 2024 | 2014, 2015, 2016, 2017, 2025 |
| ARG — Argentina | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| ARG — Argentina | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| ARG — Argentina | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| ARG — Argentina | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| ARG — Argentina | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| ARG — Argentina | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| ARG — Argentina | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| BOL — Bolivia | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| BOL — Bolivia | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| BOL — Bolivia | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| BOL — Bolivia | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| BOL — Bolivia | NE.EXP.GNFS.ZS | 11/12 | 2024 | 2025 |
| BOL — Bolivia | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| BOL — Bolivia | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| BOL — Bolivia | NE.RSB.GNFS.ZS | 11/12 | 2024 | 2025 |
| BOL — Bolivia | NE.IMP.GNFS.ZS | 11/12 | 2024 | 2025 |
| ECU — Ecuador | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| ECU — Ecuador | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| ECU — Ecuador | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| ECU — Ecuador | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| ECU — Ecuador | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| ECU — Ecuador | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| ECU — Ecuador | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| ECU — Ecuador | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| ECU — Ecuador | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| URY — Uruguay | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| URY — Uruguay | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| URY — Uruguay | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| URY — Uruguay | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| URY — Uruguay | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| URY — Uruguay | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| URY — Uruguay | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| URY — Uruguay | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| URY — Uruguay | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| PRY — Paraguay | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| PRY — Paraguay | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| PRY — Paraguay | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| PRY — Paraguay | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| CRI — Costa Rica | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHN — China | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| CHN — China | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| CHN — China | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| CHN — China | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| CHN — China | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHN — China | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| CHN — China | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| CHN — China | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| CHN — China | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| JPN — Japón | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| JPN — Japón | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| JPN — Japón | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| JPN — Japón | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| JPN — Japón | NE.EXP.GNFS.ZS | 11/12 | 2024 | 2025 |
| JPN — Japón | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| JPN — Japón | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| JPN — Japón | NE.RSB.GNFS.ZS | 11/12 | 2024 | 2025 |
| JPN — Japón | NE.IMP.GNFS.ZS | 11/12 | 2024 | 2025 |
| DEU — Alemania | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| DEU — Alemania | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| DEU — Alemania | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| DEU — Alemania | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| DEU — Alemania | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| DEU — Alemania | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| DEU — Alemania | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| DEU — Alemania | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| DEU — Alemania | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| ESP — España | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| ESP — España | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| ESP — España | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| ESP — España | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| ESP — España | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| ESP — España | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| ESP — España | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| ESP — España | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| ESP — España | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CAN — Canadá | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| CAN — Canadá | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| CAN — Canadá | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| CAN — Canadá | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| CAN — Canadá | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| CAN — Canadá | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| CAN — Canadá | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| CAN — Canadá | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| CAN — Canadá | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NY.GDP.MKTP.KD.ZG | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | FP.CPI.TOTL.ZG | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | SL.UEM.TOTL.ZS | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NY.GDP.PCAP.CD | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NE.EXP.GNFS.ZS | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | BN.CAB.XOKA.GD.ZS | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NY.GDP.PCAP.PP.KD | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NE.RSB.GNFS.ZS | 12/12 | 2025 | ninguno |
| KOR — Corea del Sur | NE.IMP.GNFS.ZS | 12/12 | 2025 | ninguno |

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
