# Auditoría económica del simulador IS–LM–BP / Mundell–Fleming

Auditor: Claude Code (coordinador). Fecha: 2026-10-18. Base auditada: `origin/main` 7631444.
Correcciones: rama `audit/technical-review` (commits 2180438 y 5717f1f).

## 1. Especificación verificada

Modelo de corto plazo, precios fijos (P = P* = 1, el tipo de cambio nominal es real), economía pequeña,
expectativas estáticas. Y es un índice (producto inicial = 100); los componentes de la demanda se miden en
puntos del producto inicial; i en %; e es un índice con base 100 (e ↑ = depreciación).

| Bloque | Ecuación | Estado |
|---|---|---|
| Consumo | C = C₀ + conf + c·(Y − T), T = T₀ + t·Y | Correcta |
| Inversión | I = Ī − b·i | Correcta |
| Exportaciones netas | NX = NX₀ + nx + n·(e − 100) − m·(Y − 100) + f·(Y* − 100) | Correcta (Marshall–Lerner supuesto: n > 0) |
| IS | Y = C + I + G + NX ⇒ s·Y + b·i − n·e = K, s = 1 − c(1 − t) + m | Verificada término a término |
| LM | M/P = k·Y − h·i, o regla i = i_pol | Correcta |
| BP | CA + KF = 0, CA = NX + NFI, KF = KF₀ + κ·(i − i* − ρ) | **Corregida** (antes NX + KF = 0 con NX ≡ CA) |
| Movilidad perfecta | κ → ∞ ⇒ i = i* + ρ | Correcta |

Variables endógenas según régimen:

| Régimen | Endógenas | Instrumentos |
|---|---|---|
| Cerrada | Y, i (M si hay regla de tasa) | G, T, M o i_pol |
| Flexible | Y, i, e (M si hay regla de tasa) | G, T, M; i_pol solo si κ < ∞ |
| Fijo | Y, i, M (reservas) | G, T, ē |

Esto cumple el trilema: con ē fijo el banco central no controla M; con flotación y κ → ∞ no puede fijar
i ≠ i* + ρ (`availableInstruments`, `normalizeConfig`).

## 2. Equilibrios E₀, E₁, E₂

* **E₀**: calibrado para que Y = 100, i = i₀, e = 100 y BP = 0 en todos los regímenes (prueba unitaria).
* **E₁ (impacto)**: IS–LM antes del ajuste externo. Flexible: e = 100. Fijo: M = la decidida por el banco
  central. **Corregido**: antes el impacto en régimen fijo usaba M₀, de modo que un intento de expansión
  monetaria no mostraba ningún impacto; ahora baja i, aparece el déficit de BP y en E₂ la pérdida de
  reservas devuelve M a M₀ (resultado de libro).
* **E₂ (final)**: IS, LM y BP simultáneas, resueltas por eliminación gaussiana con pivoteo parcial.

Se comprobó que todas las curvas dibujadas (IS, LM, BP, IS*, LM*, demanda de dinero, demanda agregada)
pasan por el equilibrio calculado, también con NFI ≠ 0.

## 3. Multiplicadores (forma cerrada = resultado numérico, verificado)

| Caso | dY/dG |
|---|---|
| Cerrada, M fija | 1 / (1 − c(1 − t) + b·k/h) |
| Cerrada, regla de tasa | 1 / (1 − c(1 − t)) |
| Flexible, κ → ∞ | 0 (ΔNX = −ΔG) |
| Fijo, κ → ∞ | 1 / (1 − c(1 − t) + m) |
| Fijo, κ = 0 | 0 (Y fijado por el equilibrio de la cuenta corriente) |
| Flexible, κ → ∞, monetario | dY/dM = 1/k |
| Impuestos (cerrada) | −c × multiplicador del gasto |

Con los parámetros por defecto, el multiplicador fiscal con tipo fijo y movilidad perfecta (1,67) supera al
de la economía cerrada (1,29). **Advertencia**: esa comparación depende de m frente a b·k/h y no es un
resultado general; la comparación de libro es fijo frente a flexible.

## 4. Tabla de signos (κ → ∞) comprobada

| Shock | ΔY flexible | Δe flexible | ΔY fijo |
|---|---|---|---|
| ↑G | 0 | − | + |
| ↑T | 0 | + | − |
| ↑i* | + | + | − |
| ↑ρ | + | + | − |
| ↑Y* | 0 | − | + |
| ↓nx (precios de exportación) | 0 | + | − |
| ↓confianza | 0 | + | − |
| ↑ē (devaluación) | — | — | + (M ↑, NX ↑) |

**Hallazgo**: con flotación, los shocks autónomos de NX (nx, Y*) quedan **completamente aislados para
cualquier κ**, no solo con movilidad perfecta: como e entra en el modelo únicamente a través de NX, el
cambio Δe = −Δnx/n restablece a la vez la IS y la BP. Es una propiedad de esta especificación lineal, no
evidencia empírica. El escenario guiado correspondiente se redactó como comparación flexible/fijo y lo
advierte explícitamente; la narrativa de la interfaz debe explicarlo (requisito para la fase del laboratorio).

**Resultado ↑i* expansivo con flotación**: correcto dentro del modelo (∂Y/∂i* = h/k), pero la evidencia para
economías emergentes suele mostrar efectos contractivos por el canal financiero (Rey, 2013) y de hoja de
balance (Céspedes, Chang y Velasco, 2004). Se debe mostrar siempre con esa advertencia.

## 5. Calibración: problemas detectados y correcciones

| # | Problema | Severidad | Corrección |
|---|---|---|---|
| C1 | NX₀ se igualaba al saldo en **cuenta corriente** (BN.CAB.XOKA.GD.ZS). La CA incluye renta primaria y secundaria, que no forman parte del PBI. Perú 2025 (WDI, consultado 2026-10-18): NX = +8,1 % del PBI y CA = +3,6 %: el modelo subestimaba NX en ≈4,5 pp. | Alta (identidad del PBI) | El motor acepta `nx0` (NE.RSB.GNFS.ZS); NFI = CA − NX es autónoma y entra solo en la BP; KF₀ = −CA. Sin `nx0` usa CA y marca `provenance.nx = 'approximation'`. |
| C2 | m = 0,8 × exportaciones/PBI. Usa las exportaciones para una propensión a **importar** y un factor 0,8 sin justificación. | Media | `importPropensityFromShare`: m = ε·(IM/Y) con importaciones observadas (NE.IMP.GNFS.ZS) y ε = 1 como **supuesto declarado** (propensión marginal = media). Houthakker y Magee (1969) y la literatura posterior muestran elasticidades-ingreso que difieren de 1; m es una aproximación, no una estimación. Integración en la UI: tarea Codex 1. |
| C3 | i₀ = meta de inflación + «tasa real neutral» por país (Perú 1,5; Chile 1,0; Colombia 2,0; México 2,5; Brasil 5,0; EE. UU. 1,0). No hay fuente citada para esos valores. | Media | Deben etiquetarse como **supuesto ilustrativo**. Para Perú puede ofrecerse la tasa de referencia observada del BCRP (PD04722MM, verificada) como alternativa de dato observado. |
| C4 | i*₀ = min(3, i₀): «tasa internacional de referencia» fija en 3 %. | Baja | Etiquetar como supuesto. ρ₀ = i₀ − i*₀ es un **residuo calibrado**, no una medición del riesgo país (EMBI). |
| C5 | Textos «Modelo didáctico calibrado» y «calibrado con indicadores del Banco Mundial» sugieren una calibración empírica. | Media (comunicación) | Reemplazar por «equilibrio inicial anclado en datos WDI y supuestos explícitos» y mostrar la naturaleza de cada magnitud. |
| C6 | c, t, b, h, n, k, f, G₀ = 18, I₀ = 20 son valores didácticos. | Informativa | `PARAM_SOURCES` los clasifica como `illustrative`; la UI debe mostrarlo. |
| C7 | Las variaciones de i deben expresarse en pp, no en %. | Baja | `compareEquilibria` devuelve unidad `pp` para i y `index`/% para niveles. |

Clasificación usada en la interfaz (`ISLM.SOURCE_KINDS`): dato observado, parámetro calibrado, supuesto
teórico, valor ilustrativo, resultado del modelo.

## 6. Límites de validez que la plataforma debe comunicar

1. Precios fijos: no hay inflación ni ajuste del tipo de cambio real a mediano plazo.
2. Economía pequeña: i* e Y* son exógenos (no válido para EE. UU., cuya política mueve i*).
3. Expectativas estáticas: ρ agrupa riesgo país y depreciación esperada.
4. Sin efectos hoja de balance ni dolarización (relevantes para Perú; Calvo y Reinhart, 2002).
5. Sin restricción presupuestaria intertemporal ni dinámica de deuda.
6. Flotación administrada (p. ej., BCRP) es un punto intermedio entre los regímenes del modelo.
7. Movilidad «baja/alta» son valores ilustrativos de κ (0,5 y 10), no estimaciones.

## 7. Evidencia

`npm run test:unit`: 22 pruebas del motor (11 originales + 11 de esta auditoría); `node --test
tests/lab-content.test.mjs`: 4 pruebas de contenido pedagógico. Todas en verde el 2026-10-18 (la
incorporación de `lab-content.test.mjs` a `npm test` corresponde a la tarea de integración de Codex).

## Referencias

Ver `js/lab-content.js` (`REFERENCES`): Hicks (1937); Fleming (1962); Mundell (1963); Houthakker y Magee
(1969); Thirlwall (1979); Calvo y Reinhart (2002); Céspedes, Chang y Velasco (2004); Obstfeld, Shambaugh
y Taylor (2005); Rey (2013); FMI, MBP6 (2009); manuales de Blanchard, Mankiw, Krugman–Obstfeld–Melitz y
Mendoza Bellido.
