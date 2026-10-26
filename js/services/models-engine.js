/*
 * Motores matemáticos puros y constructores analíticos para las siete experiencias de MacroScope.
 * Importable en Node sin DOM ni red; publica sus contratos en globalThis.MacroScope.
 * Preserva estrictamente nulos (null), procedencia de datos y separación entre estadísticas
 * oficiales verificadas (WDI / BCRP) y series o esquemas demostrativos.
 */
(function () {
  'use strict';
  const M = (globalThis.MacroScope ||= {});

  /**
   * 1. MOTOR MATEMÁTICO PURO: OFERTA Y DEMANDA AGREGADA (OA–DA)
   * Equilibrio base normalizado en Y0 = 100, P0 = 100, Yn = 100, Pe = 100.
   * DA:   Y = Y0 + alphaG*dG + alphaM*dM + alphaA*dA - gamma*(P - 100)
   * OACP: P = Pe + lambda*(Y - Yn) + dz
   * OALP: Y = Yn (con Yn = 100 + dYn)
   */
  function createAsAdModel(params = {}) {
    const p = {
      alphaG: 1.4,
      alphaM: 1.1,
      alphaA: 1.0,
      gamma: 1.25,
      lambda: 0.65,
      ...params
    };
    const baseline = { dG: 0, dM: 0, dA: 0, dz: 0, dPe: 0, dYn: 0 };

    function solve(input = {}, stage = 'short') {
      const u = { ...baseline, ...input };
      const Yn = 100 + u.dYn;
      const demandShift = p.alphaG * u.dG + p.alphaM * u.dM + p.alphaA * u.dA;
      if (stage === 'medium') {
        // En el medio plazo las expectativas de precios se ajustan (Y2 = Yn)
        const Y = Yn;
        const P = 100 + (100 + demandShift - Yn) / p.gamma;
        const Pe = P - u.dz;
        return {
          Y: Number(Y.toFixed(4)),
          P: Number(P.toFixed(4)),
          Yn: Number(Yn.toFixed(4)),
          Pe: Number(Pe.toFixed(4)),
          outputGap: 0,
          demandShift: Number(demandShift.toFixed(4))
        };
      }
      const Pe = 100 + u.dPe;
      // Y = 100 + demandShift - gamma*(Pe + lambda*(Y - Yn) + dz - 100)
      const denom = 1 + p.gamma * p.lambda;
      const Y = (100 + demandShift - p.gamma * (Pe - p.lambda * Yn + u.dz - 100)) / denom;
      const P = Pe + p.lambda * (Y - Yn) + u.dz;
      return {
        Y: Number(Y.toFixed(4)),
        P: Number(P.toFixed(4)),
        Yn: Number(Yn.toFixed(4)),
        Pe: Number(Pe.toFixed(4)),
        outputGap: Number((Y - Yn).toFixed(4)),
        demandShift: Number(demandShift.toFixed(4))
      };
    }

    function curves(input = {}) {
      const u = { ...baseline, ...input };
      const E0 = solve(baseline, 'short');
      const E1 = solve(u, 'short');
      const E2 = solve(u, 'medium');
      const yRange = [75, 125];
      const ad0 = yRange.map(y => ({ x: y, y: 100 + (100 - y) / p.gamma }));
      const ad1 = yRange.map(y => ({ x: y, y: 100 + (100 + E1.demandShift - y) / p.gamma }));
      const as0 = yRange.map(y => ({ x: y, y: 100 + p.lambda * (y - 100) }));
      const as1 = yRange.map(y => ({ x: y, y: E1.Pe + p.lambda * (y - E1.Yn) + u.dz }));
      const lras = [{ x: E1.Yn, y: 75 }, { x: E1.Yn, y: 125 }];
      return { E0, E1, E2, ad0, ad1, as0, as1, lras };
    }

    function explain(input = {}) {
      const u = { ...baseline, ...input };
      const { E0, E1, E2 } = curves(u);
      const steps = [];
      if (Math.abs(E1.demandShift) > 1e-4) {
        steps.push(
          E1.demandShift > 0
            ? `Impulso de demanda agregada (+${E1.demandShift.toFixed(1)}): la curva DA se desplaza a la derecha por política expansiva o mayor confianza.`
            : `Contracción de demanda agregada (${E1.demandShift.toFixed(1)}): la curva DA se desplaza a la izquierda.`
        );
      }
      if (Math.abs(u.dz) > 1e-4 || Math.abs(u.dPe) > 1e-4) {
        steps.push(
          u.dz + u.dPe > 0
            ? `Shock de costos / expectativas (+${(u.dz + u.dPe).toFixed(1)}): la OACP se desplaza hacia arriba (presión estanflacionaria).`
            : `Mejora de costos / oferta (${(u.dz + u.dPe).toFixed(1)}): la OACP se desplaza hacia abajo.`
        );
      }
      if (!steps.length) {
        steps.push('Equilibrio inicial estacionario: el producto coincide con el potencial (Y = Yn = 100) y el nivel de precios se mantiene en P = 100.');
      } else {
        steps.push(`Corto plazo (E₁): el producto se ubica en Y₁ = ${E1.Y.toFixed(1)} (brecha de ${E1.outputGap >= 0 ? '+' : ''}${E1.outputGap.toFixed(1)}%) y el nivel de precios en P₁ = ${E1.P.toFixed(1)}.`);
        steps.push(`Medio plazo (E₂): al ajustarse las expectativas salariales y de precios, la economía converge a Y₂ = ${E2.Y.toFixed(1)} con nivel de precios P₂ = ${E2.P.toFixed(1)}.`);
      }
      return steps;
    }

    return { id: 'asad', params: p, baseline, solve, curves, explain };
  }

  /**
   * 2. MOTOR MATEMÁTICO PURO: OFERTA Y DEMANDA MICROECONÓMICA
   * Equilibrio base en Q0 = 100, P0 = 100.
   * Demanda inversa: P_d(Q) = 200 + dD - Q / bD
   * Oferta inversa:  P_s(Q) = dS + tau + Q / bS
   */
  function createSupplyDemandModel(params = {}) {
    const p = { bD: 1.0, bS: 1.0, ...params };
    const baseline = { dD: 0, dS: 0, tau: 0 };

    function solve(input = {}) {
      const u = { ...baseline, ...input };
      // En equilibrio: 200 + dD - Q/bD = dS + tau + Q/bS
      const invSlope = 1 / p.bD + 1 / p.bS;
      const Q = Math.max(0, (200 + u.dD - u.dS - u.tau) / invSlope);
      const Pd = 200 + u.dD - Q / p.bD;
      const Ps = Pd - u.tau;
      const maxChokeDemand = 200 + u.dD;
      const minChokeSupply = u.dS;
      const consumerSurplus = Math.max(0, 0.5 * Q * (maxChokeDemand - Pd));
      const producerSurplus = Math.max(0, 0.5 * Q * (Ps - minChokeSupply));
      const taxRevenue = Q * u.tau;
      const QnoTax = Math.max(0, (200 + u.dD - u.dS) / invSlope);
      const deadweightLoss = Math.max(0, 0.5 * Math.abs(u.tau) * Math.abs(QnoTax - Q));
      return {
        Q: Number(Q.toFixed(4)),
        Pd: Number(Pd.toFixed(4)),
        Ps: Number(Ps.toFixed(4)),
        consumerSurplus: Number(consumerSurplus.toFixed(2)),
        producerSurplus: Number(producerSurplus.toFixed(2)),
        taxRevenue: Number(taxRevenue.toFixed(2)),
        deadweightLoss: Number(deadweightLoss.toFixed(2))
      };
    }

    function curves(input = {}) {
      const u = { ...baseline, ...input };
      const E0 = solve(baseline);
      const E1 = solve(u);
      const qRange = [20, 180];
      const d0 = qRange.map(q => ({ x: q, y: 200 - q / p.bD }));
      const d1 = qRange.map(q => ({ x: q, y: 200 + u.dD - q / p.bD }));
      const s0 = qRange.map(q => ({ x: q, y: q / p.bS }));
      const s1 = qRange.map(q => ({ x: q, y: u.dS + u.tau + q / p.bS }));
      return { E0, E1, d0, d1, s0, s1 };
    }

    return { id: 'micro-sd', params: p, baseline, solve, curves };
  }

  /**
   * 3. ANÁLISIS HISTÓRICO PURO (MÓDULO 02 — #historico)
   * Hitos históricos verificados y documentados con fuentes oficiales.
   */
  const HISTORICAL_MILESTONES = [
    {
      year: '2015',
      title: 'Fin del superciclo de materias primas',
      summary: 'Moderación de términos de intercambio en economías exportadoras de metales e hidrocarburos de América Latina.',
      source: 'FMI WEO / BCRP Memorias Anuales'
    },
    {
      year: '2020',
      title: 'Choque pandémico global COVID-19',
      summary: 'Contracción sincrónica de la actividad económica mundial y respuesta extraordinaria de política monetaria y fiscal.',
      source: 'Banco Mundial WDI / BCRP Reporte de Inflación'
    },
    {
      year: '2021',
      title: 'Rebote estadístico y reapertura productiva',
      summary: 'Recuperación acelerada de la demanda interna y cuellos de botella en cadenas globales de suministro.',
      source: 'Banco Mundial WDI / CEPAL'
    },
    {
      year: '2022',
      title: 'Choque inflacionario global de energía y alimentos',
      summary: 'Aceleración internacional de la inflación por encima de los rangos meta y ciclo de alzas de tasas de referencia.',
      source: 'FMI / BCRP / Bancos Centrales regionales'
    },
    {
      year: '2024',
      title: 'Convergencia gradual de la inflación hacia metas',
      summary: 'Desinflación progresiva y normalización gradual de las tasas de interés de política monetaria.',
      source: 'BCRP / Banco Mundial WDI'
    }
  ];

  function buildHistoricalAnalysis({
    series = [],
    startPeriod = null,
    endPeriod = null,
    splitPeriod = null,
    mode = 'raw',
    isRate = false
  } = {}) {
    const sorted = [...series]
      .filter(p => p && typeof p.date === 'string')
      .sort((a, b) => a.date.localeCompare(b.date));

    const filtered = sorted.filter(p => {
      if (startPeriod && p.date < String(startPeriod)) return false;
      if (endPeriod && p.date > String(endPeriod)) return false;
      return true;
    });

    const firstValidIdx = filtered.findIndex(p => Number.isFinite(p.value) && p.value !== 0);
    const baseVal = firstValidIdx >= 0 ? filtered[firstValidIdx].value : null;

    const rows = filtered.map((point, idx) => {
      const val = Number.isFinite(point.value) ? point.value : null;
      const prev = idx > 0 && Number.isFinite(filtered[idx - 1].value) ? filtered[idx - 1].value : null;
      const diff = val !== null && prev !== null ? val - prev : null;
      const pctChange =
        val !== null && prev !== null && prev !== 0
          ? isRate
            ? val - prev
            : ((val - prev) / Math.abs(prev)) * 100
          : null;
      // No se normalizan en base 100 tasas con valores negativos/cero sin nivel positivo
      const base100 =
        !isRate && val !== null && baseVal !== null && baseVal > 0
          ? (val / baseVal) * 100
          : null;
      // Promedio móvil de 3 observaciones consecutivas reales (sin interpolar huecos)
      const window3 = idx >= 2 ? filtered.slice(idx - 2, idx + 1) : [];
      const ma3 =
        window3.length === 3 && window3.every(w => Number.isFinite(w.value))
          ? window3.reduce((s, w) => s + w.value, 0) / 3
          : null;

      let displayValue = val;
      if (mode === 'variation') displayValue = pctChange;
      else if (mode === 'base100') displayValue = base100;
      else if (mode === 'trend') displayValue = ma3 ?? val;

      return {
        date: point.date,
        value: val,
        diff,
        pctChange,
        base100,
        ma3,
        displayValue,
        source: point.source || 'fallback'
      };
    });

    const finiteRows = rows.filter(r => Number.isFinite(r.value));
    const firstObs = finiteRows[0] || null;
    const lastObs = finiteRows.at(-1) || null;
    const values = finiteRows.map(r => r.value);
    const mean = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const minObs = finiteRows.length ? finiteRows.reduce((a, b) => (b.value < a.value ? b : a)) : null;
    const maxObs = finiteRows.length ? finiteRows.reduce((a, b) => (b.value > a.value ? b : a)) : null;
    const stdDev =
      values.length > 1
        ? Math.sqrt(values.reduce((acc, v) => acc + (v - mean) ** 2, 0) / values.length)
        : null;

    const totalVariation =
      firstObs && lastObs && firstObs !== lastObs
        ? isRate
          ? lastObs.value - firstObs.value
          : firstObs.value !== 0
            ? ((lastObs.value - firstObs.value) / Math.abs(firstObs.value)) * 100
            : null
        : null;

    // Subperiod comparison (Subperiodo A vs Subperiodo B)
    const pivot =
      splitPeriod ||
      (filtered.length >= 2 ? filtered[Math.floor(filtered.length / 2)].date : '2019');
    const subA = finiteRows.filter(r => r.date <= String(pivot));
    const subB = finiteRows.filter(r => r.date > String(pivot));
    const meanA = subA.length ? subA.reduce((s, r) => s + r.value, 0) / subA.length : null;
    const meanB = subB.length ? subB.reduce((s, r) => s + r.value, 0) / subB.length : null;
    const subDelta = meanA !== null && meanB !== null ? meanB - meanA : null;

    const milestones = HISTORICAL_MILESTONES.filter(m =>
      rows.some(r => r.date.startsWith(m.year))
    );

    return {
      rows,
      summary: {
        count: finiteRows.length,
        missingCount: rows.length - finiteRows.length,
        firstObs,
        lastObs,
        mean,
        stdDev,
        minObs,
        maxObs,
        totalVariation,
        variationUnit: isRate ? 'p.p.' : '%',
        subperiods: {
          pivot,
          labelA: subA.length ? `${subA[0].date} – ${subA.at(-1).date}` : 'Sin observaciones',
          labelB: subB.length ? `${subB[0].date} – ${subB.at(-1).date}` : 'Sin observaciones',
          countA: subA.length,
          countB: subB.length,
          meanA,
          meanB,
          subDelta
        }
      },
      milestones
    };
  }

  /**
   * 4. CATÁLOGO ANALÍTICO DE INDICADORES (MÓDULO 03 — #indicadores)
   * Cubre las 8 categorías requeridas por la especificación.
   * Las series oficiales WDI / BCRP usan exclusivamente datos observados;
   * las fichas de referencia metodológica adicionales están explícitamente marcadas con isDemo: true.
   */
  const INDICATOR_CATEGORIES = {
    all: 'Todas las categorías',
    activity: 'Actividad económica',
    prices: 'Precios',
    labor: 'Mercado laboral',
    monetary: 'Sector monetario',
    external: 'Sector externo',
    fiscal: 'Finanzas públicas',
    financial: 'Sistema financiero',
    development: 'Desarrollo económico'
  };

  const INDICATORS_CATALOG = [
    {
      id: 'NY.GDP.MKTP.KD.ZG',
      code: 'NY.GDP.MKTP.KD.ZG',
      title: 'Crecimiento del PBI real',
      category: 'activity',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% anual',
      isRate: true,
      isDemo: false,
      formula: 'g_t = ((PBI_real_t / PBI_real_{t-1}) - 1) × 100',
      definition: 'Variación porcentual anual del Producto Bruto Interno a precios constantes de mercado en moneda local.',
      interpretation: 'Mide el ritmo de expansión de la actividad agregada descontando el efecto de la inflación.',
      sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG'
    },
    {
      id: 'PN02507AQ',
      code: 'PN02507AQ',
      title: 'PBI real trimestral (Perú)',
      category: 'activity',
      provider: 'BCRP · Series Oficiales',
      providerKey: 'BCRP',
      frequency: 'Trimestral',
      unit: '% interanual',
      isRate: true,
      isDemo: false,
      formula: '((PBI_{t,q} / PBI_{t-1,q}) - 1) × 100',
      definition: 'Variación porcentual interanual del Producto Bruto Interno real trimestral del Perú a precios constantes de 2007.',
      interpretation: 'Indicador oficial de alta frecuencia para el seguimiento del ciclo económico peruano.',
      sourceUrl: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/trimestrales/resultados/PN02507AQ/html'
    },
    {
      id: 'FP.CPI.TOTL.ZG',
      code: 'FP.CPI.TOTL.ZG',
      title: 'Inflación (IPC promedio anual)',
      category: 'prices',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% anual',
      isRate: true,
      isDemo: false,
      formula: 'π_t = ((IPC_prom_t / IPC_prom_{t-1}) - 1) × 100',
      definition: 'Variación porcentual del Índice de Precios al Consumidor promedio anual. Refleja el ritmo de cambio del costo de la canasta representativa.',
      interpretation: 'Permite comparaciones internacionales homogéneas; difiere de la variación diciembre-diciembre usada en metas de inflación.',
      sourceUrl: 'https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG'
    },
    {
      id: 'PN01273PM',
      code: 'PN01273PM',
      title: 'Inflación IPC Lima Metropolitana (12 meses)',
      category: 'prices',
      provider: 'BCRP · Series Oficiales',
      providerKey: 'BCRP',
      frequency: 'Mensual',
      unit: '% interanual',
      isRate: true,
      isDemo: false,
      formula: '((IPC_{m,t} / IPC_{m,t-1}) - 1) × 100',
      definition: 'Variación porcentual acumulada en doce meses del Índice de Precios al Consumidor de Lima Metropolitana.',
      interpretation: 'Referencia oficial con la que el BCRP evalúa el cumplimiento del rango meta de inflación (1% – 3%).',
      sourceUrl: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01273PM/html'
    },
    {
      id: 'SL.UEM.TOTL.ZS',
      code: 'SL.UEM.TOTL.ZS',
      title: 'Tasa de desempleo nacional (OIT)',
      category: 'labor',
      provider: 'Banco Mundial · WDI / OIT',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% de la PEA',
      isRate: true,
      isDemo: false,
      formula: '(Desempleados / Fuerza laboral total) × 100',
      definition: 'Proporción de la población económicamente activa que no tiene empleo pero busca trabajo activamente (estimación modelada OIT).',
      interpretation: 'Comparable entre países; en economías con alta informalidad debe complementarse con indicadores de subempleo e informalidad.',
      sourceUrl: 'https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS'
    },
    {
      id: 'PD04722MM',
      code: 'PD04722MM',
      title: 'Tasa de interés de referencia monetaria',
      category: 'monetary',
      provider: 'BCRP · Series Oficiales',
      providerKey: 'BCRP',
      frequency: 'Mensual',
      unit: '% anual',
      isRate: true,
      isDemo: false,
      formula: 'Tasa meta operativa para préstamos interbancarios overnight fijada por el Directorio del BCRP',
      definition: 'Instrumento operativo principal de la política monetaria del Banco Central de Reserva del Perú bajo el esquema de metas explícitas de inflación.',
      interpretation: 'Aumentos indican una postura contractiva para anclar expectativas de inflación; reducciones buscan estimular el crédito y la demanda.',
      sourceUrl: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PD04722MM/html'
    },
    {
      id: 'PN01207PM',
      code: 'PN01207PM',
      title: 'Tipo de cambio nominal interbancario',
      category: 'monetary',
      provider: 'BCRP · Series Oficiales',
      providerKey: 'BCRP',
      frequency: 'Mensual',
      unit: 'S/ por US$',
      isRate: false,
      isDemo: false,
      formula: 'Promedio mensual de las cotizaciones de venta en el mercado interbancario (S/ por US$)',
      definition: 'Precio promedio mensual del dólar estadounidense expresado en soles en el mercado interbancario peruano.',
      interpretation: 'Un incremento refleja una depreciación nominal del sol; una disminución indica apreciación cambiaria.',
      sourceUrl: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN01207PM/html'
    },
    {
      id: 'PN00027MM',
      code: 'PN00027MM',
      title: 'Reservas Internacionales Netas (RIN)',
      category: 'monetary',
      provider: 'BCRP · Series Oficiales',
      providerKey: 'BCRP',
      frequency: 'Mensual',
      unit: 'millones US$',
      isRate: false,
      isDemo: false,
      formula: 'Activos internacionales brutos menos pasivos internacionales de corto plazo del BCRP',
      definition: 'Liquidez internacional disponible del banco central para enfrentar choques externos y salidas abruptas de capital.',
      interpretation: 'Respaldo fundamental de la estabilidad cambiaria y financiera en una economía bimonetaria.',
      sourceUrl: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/mensuales/resultados/PN00027MM/html'
    },
    {
      id: 'NE.EXP.GNFS.ZS',
      code: 'NE.EXP.GNFS.ZS',
      title: 'Exportaciones de bienes y servicios',
      category: 'external',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% del PBI',
      isRate: true,
      isDemo: false,
      formula: '(Exportaciones de bienes y servicios / PBI) × 100',
      definition: 'Valor de todos los bienes y servicios de mercado provistos al resto del mundo como proporción del PBI.',
      interpretation: 'Refleja la inserción exportadora y el peso de la demanda externa en la economía.',
      sourceUrl: 'https://data.worldbank.org/indicator/NE.EXP.GNFS.ZS'
    },
    {
      id: 'NE.IMP.GNFS.ZS',
      code: 'NE.IMP.GNFS.ZS',
      title: 'Importaciones de bienes y servicios',
      category: 'external',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% del PBI',
      isRate: true,
      isDemo: false,
      formula: '(Importaciones de bienes y servicios / PBI) × 100',
      definition: 'Valor de los bienes y servicios adquiridos del resto del mundo como porcentaje del PBI. Se usa para calibrar la propensión a importar en el laboratorio.',
      interpretation: 'Mide la dependencia de insumos, bienes de capital y consumo importados.',
      sourceUrl: 'https://data.worldbank.org/indicator/NE.IMP.GNFS.ZS'
    },
    {
      id: 'NE.RSB.GNFS.ZS',
      code: 'NE.RSB.GNFS.ZS',
      title: 'Balanza comercial de bienes y servicios (NX)',
      category: 'external',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% del PBI',
      isRate: true,
      isDemo: false,
      formula: 'NX = ((Exportaciones - Importaciones) / PBI) × 100',
      definition: 'Saldo neto de bienes y servicios que integra directamente la identidad de demanda agregada (Y = C + I + G + NX).',
      interpretation: 'Positivo indica superávit comercial; difiere de la cuenta corriente por la renta de factores y transferencias.',
      sourceUrl: 'https://data.worldbank.org/indicator/NE.RSB.GNFS.ZS'
    },
    {
      id: 'BN.CAB.XOKA.GD.ZS',
      code: 'BN.CAB.XOKA.GD.ZS',
      title: 'Saldo en cuenta corriente (CA)',
      category: 'external',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: '% del PBI',
      isRate: true,
      isDemo: false,
      formula: 'CA = (NX + Renta Primaria Neta + Renta Secundaria Neta) / PBI × 100',
      definition: 'Suma de exportaciones netas de bienes y servicios, ingreso primario neto (utilidades e intereses) e ingreso secundario neto (remesas).',
      interpretation: 'Mide las necesidades de financiamiento externo neto de la economía.',
      sourceUrl: 'https://data.worldbank.org/indicator/BN.CAB.XOKA.GD.ZS'
    },
    {
      id: 'NY.GDP.PCAP.CD',
      code: 'NY.GDP.PCAP.CD',
      title: 'PBI per cápita (US$ corrientes)',
      category: 'development',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: 'US$ corrientes',
      isRate: false,
      isDemo: false,
      formula: 'PBI nominal en US$ / Población a mitad de año',
      definition: 'Producto Bruto Interno dividido entre la población total a mitad de año, expresado en dólares corrientes.',
      interpretation: 'Aproxima el nivel de producto promedio por habitante, sensible a variaciones del tipo de cambio nominal.',
      sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.CD'
    },
    {
      id: 'NY.GDP.PCAP.PP.KD',
      code: 'NY.GDP.PCAP.PP.KD',
      title: 'PBI per cápita PPA constante (2021)',
      category: 'development',
      provider: 'Banco Mundial · WDI',
      providerKey: 'WDI',
      frequency: 'Anual',
      unit: 'US$ PPA 2021',
      isRate: false,
      isDemo: false,
      formula: 'PBI ajustado por Paridad de Poder Adquisitivo (precios constantes 2021) / Población',
      definition: 'Producto por habitante corregido por diferencias en el nivel de precios entre países, a precios internacionales constantes de 2021.',
      interpretation: 'Indicador estándar para evaluar convergencia económica y estándares de vida comparados de largo plazo.',
      sourceUrl: 'https://data.worldbank.org/indicator/NY.GDP.PCAP.PP.KD'
    },
    {
      id: 'DEMO.FISCAL.RESULT',
      code: 'GC.BAL.CASH.GD.ZS (Ref. Metodológica)',
      title: 'Resultado económico del Sector Público No Financiero',
      category: 'fiscal',
      provider: 'Demostrativo · Contrato MEF / FMI',
      providerKey: 'DEMO',
      frequency: 'Anual',
      unit: '% del PBI (Demostrativo)',
      isRate: true,
      isDemo: true,
      formula: '(Ingresos totales SPNF - Gastos totales SPNF) / PBI × 100',
      definition: 'Ficha demostrativa preparada para integrar series fiscales del MEF / FMI. Los valores mostrados son sintéticos e ilustrativos para explicar la regla fiscal.',
      interpretation: 'SERIE DEMOSTRATIVA: No utilizar como estadística oficial verificada. Ilustra el seguimiento de déficit fiscal y regla de sostenibilidad.',
      sourceUrl: 'https://www.mef.gob.pe/es/estadisticas-fiscales',
      demoSeries: [
        { date: '2018', value: -2.3 },
        { date: '2019', value: -1.6 },
        { date: '2020', value: -8.9 },
        { date: '2021', value: -2.5 },
        { date: '2022', value: -1.7 },
        { date: '2023', value: -2.8 },
        { date: '2024', value: -3.0 }
      ]
    },
    {
      id: 'DEMO.FIN.CREDIT',
      code: 'FD.AST.PRVT.GD.ZS (Ref. Metodológica)',
      title: 'Crédito del sistema financiero al sector privado',
      category: 'financial',
      provider: 'Demostrativo · Contrato SBS / BCRP',
      providerKey: 'DEMO',
      frequency: 'Anual',
      unit: '% del PBI (Demostrativo)',
      isRate: true,
      isDemo: true,
      formula: '(Saldo de colocaciones al sector privado / PBI nominal) × 100',
      definition: 'Ficha demostrativa preparada para conectar la serie de profundización financiera de la SBS y BCRP. Contiene trayectoria sintética identificada.',
      interpretation: 'SERIE DEMOSTRATIVA: No utilizar como estadística oficial verificada. Ilustra el indicador de profundización crediticia.',
      sourceUrl: 'https://www.sbs.gob.pe/estadisticas',
      demoSeries: [
        { date: '2018', value: 42.1 },
        { date: '2019', value: 43.4 },
        { date: '2020', value: 52.8 },
        { date: '2021', value: 45.2 },
        { date: '2022', value: 43.0 },
        { date: '2023', value: 41.2 },
        { date: '2024', value: 40.8 }
      ]
    }
  ];

  // Snapshot local verificado de las 4 series principales del BCRP (de tests/fixtures/bcrp-normalized.json)
  // para garantizar que cuando la app se abre por file:// sin proxy en vivo se identifique explícitamente
  // como respaldo histórico local BCRP sin inventar cifras.
  const BCRP_LOCAL_SNAPSHOT = {
    PD04722MM: {
      code: 'PD04722MM',
      title: 'Tasa de Referencia de la Política Monetaria',
      frequency: 'monthly',
      unit: '%',
      extractedAt: '2026-04-17',
      observations: [
        { date: '2024-01-01', value: 6.5 },
        { date: '2024-03-01', value: 6.25 },
        { date: '2024-06-01', value: 5.75 },
        { date: '2024-09-01', value: 5.25 },
        { date: '2024-12-01', value: 5.0 },
        { date: '2025-03-01', value: 4.75 },
        { date: '2025-06-01', value: 4.5 },
        { date: '2025-09-01', value: 4.25 },
        { date: '2025-12-01', value: 4.25 },
        { date: '2026-03-01', value: 4.0 }
      ]
    },
    PN01273PM: {
      code: 'PN01273PM',
      title: 'IPC Lima Metropolitana (var. % 12 meses)',
      frequency: 'monthly',
      unit: '%',
      extractedAt: '2026-04-17',
      observations: [
        { date: '2024-01-01', value: 3.02 },
        { date: '2024-03-01', value: 3.05 },
        { date: '2024-06-01', value: 2.29 },
        { date: '2024-09-01', value: 1.78 },
        { date: '2024-12-01', value: 1.97 },
        { date: '2025-03-01', value: 1.28 },
        { date: '2025-06-01', value: 1.69 },
        { date: '2025-09-01', value: 1.74 },
        { date: '2025-12-01', value: 1.51 },
        { date: '2026-03-01', value: 2.13 }
      ]
    },
    PN01207PM: {
      code: 'PN01207PM',
      title: 'Tipo de cambio interbancario promedio venta',
      frequency: 'monthly',
      unit: 'S/ por US$',
      extractedAt: '2026-04-17',
      observations: [
        { date: '2024-01-01', value: 3.742 },
        { date: '2024-03-01', value: 3.715 },
        { date: '2024-06-01', value: 3.778 },
        { date: '2024-09-01', value: 3.765 },
        { date: '2024-12-01', value: 3.739 },
        { date: '2025-03-01', value: 3.661 },
        { date: '2025-06-01', value: 3.611 },
        { date: '2025-09-01', value: 3.511 },
        { date: '2025-12-01', value: 3.368 },
        { date: '2026-03-01', value: 3.437 }
      ]
    },
    PN00027MM: {
      code: 'PN00027MM',
      title: 'Reservas Internacionales Netas (RIN)',
      frequency: 'monthly',
      unit: 'millones US$',
      extractedAt: '2026-04-17',
      observations: [
        { date: '2024-01-01', value: 73420 },
        { date: '2024-03-01', value: 74910 },
        { date: '2024-06-01', value: 73950 },
        { date: '2024-09-01', value: 78150 },
        { date: '2024-12-01', value: 78986 },
        { date: '2025-03-01', value: 81240 },
        { date: '2025-06-01', value: 84120 },
        { date: '2025-09-01', value: 87949 },
        { date: '2025-12-01', value: 92099 },
        { date: '2026-03-01', value: 97014 }
      ]
    },
    PN02507AQ: {
      code: 'PN02507AQ',
      title: 'PBI real trimestral (var. % interanual)',
      frequency: 'quarterly',
      unit: '%',
      extractedAt: '2026-04-17',
      observations: [
        { date: '2024-03-01', value: 1.4 },
        { date: '2024-06-01', value: 3.6 },
        { date: '2024-09-01', value: 3.8 },
        { date: '2024-12-01', value: 4.2 },
        { date: '2025-03-01', value: 3.9 },
        { date: '2025-06-01', value: 2.8 },
        { date: '2025-09-01', value: 3.8 },
        { date: '2025-12-01', value: 3.3 }
      ]
    }
  };

  function resolveIndicatorSeries(indicator, country = 'PER', context = {}) {
    const wdi = context.wdi || M.runtimeDB || {};
    const sourceMap = context.source || M.runtimeSource || {};
    const bcrpLive = context.bcrp || M.panoramaBcrp || {};

    if (indicator.isDemo) {
      return {
        isDemo: true,
        series: indicator.demoSeries.map(d => ({ ...d, source: 'demo' })),
        provenance: 'Demostrativo · Serie sintética ilustrativa',
        status: 'demo'
      };
    }

    if (indicator.providerKey === 'BCRP') {
      const liveRow = bcrpLive[indicator.code];
      const fallbackRow = BCRP_LOCAL_SNAPSHOT[indicator.code];
      const activeRow = liveRow?.observations?.length ? liveRow : fallbackRow;
      const isLive = Boolean(liveRow?.observations?.length);
      const pts = (activeRow?.observations || [])
        .filter(p => Number.isFinite(p.value))
        .map(p => ({ date: p.date.slice(0, 7), value: p.value, source: isLive ? 'bcrp' : 'respaldo_bcrp' }));
      return {
        isDemo: false,
        series: pts,
        provenance: isLive ? 'BCRP · API Oficial en línea' : 'BCRP · Respaldo histórico oficial (2026-04-17)',
        status: isLive ? 'live' : 'fallback'
      };
    }

    const countryData = wdi?.[country]?.[indicator.code] || {};
    const countrySource = sourceMap?.[country]?.[indicator.code] || {};
    const years = Object.keys(countryData).filter(y => /^\d{4}$/.test(y)).sort();
    const pts = years.map(year => ({
      date: year,
      value: Number.isFinite(countryData[year]) ? countryData[year] : null,
      source: countrySource[year] === 'wdi' ? 'wdi' : 'respaldo_local'
    }));
    const latestFinite = pts.findLast(p => Number.isFinite(p.value));
    const isLive = latestFinite?.source === 'wdi';
    return {
      isDemo: false,
      series: pts,
      provenance: isLive ? 'Banco Mundial (WDI) · API en línea' : 'Banco Mundial (WDI) · Respaldo local verificado',
      status: latestFinite ? (isLive ? 'live' : 'fallback') : 'unavailable'
    };
  }

  /**
   * 5. BIBLIOTECA DE MODELOS ECONÓMICOS (MÓDULO 07 — #modelos)
   */
  const MODELS_LIBRARY = [
    {
      id: 'islm',
      title: 'IS–LM–BP / Mundell–Fleming',
      subtitle: 'Equilibrio general de corto plazo en economía abierta y cerrada',
      horizon: 'Corto plazo (precios fijos)',
      category: 'short-run',
      status: 'functional',
      statusBadge: 'Motor matemático activo',
      question: '¿Cómo interactúan el mercado de bienes, el mercado monetario y la balanza de pagos ante políticas fiscales, monetarias y choques externos según el régimen cambiario?',
      variables: {
        endogenous: ['Producto de equilibrio (Y)', 'Tasa de interés doméstica (i)', 'Tipo de cambio nominal/real (e) o Oferta monetaria (M)', 'Exportaciones netas (NX) y Cuenta corriente (CA)'],
        exogenous: ['Gasto público (G) e Impuestos (T)', 'Oferta monetaria (M) o Tasa de política (i_pol)', 'Tasa internacional (i*) y Prima de riesgo (ρ)', 'Términos de intercambio / Shock externo (nx)']
      },
      assumptions: [
        'Nivel de precios fijo en el corto plazo (P = 1), de modo que las variaciones nominales son reales.',
        'Expectativas estáticas sobre el tipo de cambio y la inflación.',
        'Condición de Marshall–Lerner satisfecha (una depreciación mejora la balanza comercial: n > 0).',
        'Economía pequeña: las decisiones domésticas no alteran la tasa internacional i* ni el ingreso mundial Y*.'
      ],
      equations: [
        'IS (Bienes): Y = C(Y - T) + I(i) + G + NX(Y, e)',
        'LM (Dinero): M/P = k·Y - h·i   (o regla de tasa i = i_pol)',
        'BP (Balanza de pagos): NX(Y, e) + NFI + κ·(i - i* - ρ) = 0'
      ],
      empiricalIndicator: 'NY.GDP.MKTP.KD.ZG',
      refs: ['Hicks (1937)', 'Mundell (1963)', 'Fleming (1962)', 'Blanchard']
    },
    {
      id: 'asad',
      title: 'Oferta y Demanda Agregada (OA–DA)',
      subtitle: 'Determinación conjunta de la producción y el nivel de precios en corto y medio plazo',
      horizon: 'Corto a medio plazo (precios flexibles)',
      category: 'short-run',
      status: 'functional',
      statusBadge: 'Motor matemático activo',
      question: '¿Cómo se transmiten los impulsos de demanda y los choques de costos sobre la producción real y la inflación a medida que se ajustan las expectativas de precios?',
      variables: {
        endogenous: ['Producción agregada (Y)', 'Nivel de precios / Inflación (P)', 'Brecha del producto (Y - Yn)'],
        exogenous: ['Impulso fiscal (ΔG) y monetario (ΔM)', 'Expectativas de precios (P^e)', 'Shock de oferta / costos (Δz)', 'Producto potencial (Yn)']
      },
      assumptions: [
        'La demanda agregada tiene pendiente negativa respecto al nivel de precios (efecto saldos reales y tasa de interés).',
        'En el corto plazo los salarios nominales y las expectativas P^e están predeterminados (OACP con pendiente positiva λ > 0).',
        'En el medio plazo las expectativas se corrigen (P^e = P) y el producto retorna a su nivel potencial Yn (OALP vertical).'
      ],
      equations: [
        'DA (Demanda Agregada): Y = Y₀ + α_G·ΔG + α_M·ΔM - γ·(P - P₀)',
        'OACP (Oferta de Corto Plazo): P = P^e + λ·(Y - Y_n) + Δz',
        'OALP (Oferta de Medio/Largo Plazo): Y = Y_n'
      ],
      empiricalIndicator: 'FP.CPI.TOTL.ZG',
      refs: ['Blanchard', 'Mankiw', 'Mendoza Bellido']
    },
    {
      id: 'micro-sd',
      title: 'Oferta y Demanda de Mercado',
      subtitle: 'Equilibrio parcial, precios relativos, impuestos y excedentes de bienestar',
      horizon: 'Equilibrio parcial microeconómico',
      category: 'micro',
      status: 'functional',
      statusBadge: 'Motor matemático activo',
      question: '¿Cómo determinan las preferencias de los consumidores y los costos de los productores el precio y la cantidad de equilibrio, y cómo se reparte la carga de un impuesto?',
      variables: {
        endogenous: ['Cantidad transada de equilibrio (Q*)', 'Precio pagado por el consumidor (P_d)', 'Precio recibido por el productor (P_s)', 'Excedente del consumidor, del productor y pérdida de eficiencia'],
        exogenous: ['Desplazamiento de demanda / ingreso (ΔD)', 'Desplazamiento de costos de oferta (ΔS)', 'Impuesto o subsidio específico por unidad (τ)']
      },
      assumptions: [
        'Mercado competitivo con agentes tomadores de precios y bien homogéneo.',
        'Ausencia de externalidades o asimetrías de información en el escenario base.',
        'Curvas lineales locales alrededor del equilibrio para el cálculo exacto de excedentes.'
      ],
      equations: [
        'Demanda inversa: P_d(Q) = a₀ + ΔD - Q / b_D',
        'Oferta inversa: P_s(Q) = c₀ + ΔS + Q / b_S',
        'Condición de equilibrio con impuesto: P_d(Q*) - P_s(Q*) = τ'
      ],
      empiricalIndicator: 'NE.EXP.GNFS.ZS',
      refs: ['Marshall (1890)', 'Varian', 'Pindyck & Rubinfeld']
    },
    {
      id: 'phillips',
      title: 'Curva de Phillips con Expectativas',
      subtitle: 'Disyuntiva de corto plazo entre inflación y desempleo y tasa natural (NAIRU)',
      horizon: 'Corto y medio plazo',
      category: 'short-run',
      status: 'conceptual',
      statusBadge: 'Ficha conceptual y contraste empírico',
      question: '¿Cuándo existe una relación inversa entre inflación y desempleo y por qué desaparece cuando se desanclan las expectativas inflacionarias?',
      variables: {
        endogenous: ['Inflación efectiva (π_t)', 'Brecha de desempleo (u_t - u_n)'],
        exogenous: ['Inflación esperada (π_t^e)', 'Tasa natural de desempleo / NAIRU (u_n)', 'Choques de oferta de costos (ν_t)']
      },
      assumptions: [
        'Esquema conceptual analítico (no presentado como estimación econométrica en vivo).',
        'Cuando las expectativas están ancladas en la meta del banco central, menores tasas de desempleo presionan al alza los salarios y precios.',
        'En el largo plazo la curva de Phillips es vertical en u = u_n (hipótesis aceleracionista de Friedman–Phelps).'
      ],
      equations: [
        'Curva de Phillips aumentada: π_t = π_t^e - α·(u_t - u_n) + ν_t',
        'Ley de Okun (vínculo con producto): u_t - u_n = -β·(Y_t - Y_n)'
      ],
      empiricalIndicator: 'SL.UEM.TOTL.ZS',
      refs: ['Phillips (1958)', 'Friedman (1968)', 'Phelps (1967)', 'Blanchard']
    },
    {
      id: 'solow',
      title: 'Modelo de Crecimiento de Solow–Swan',
      subtitle: 'Acumulación de capital, progreso tecnológico y convergencia de largo plazo',
      horizon: 'Largo plazo (crecimiento económico)',
      category: 'long-run',
      status: 'conceptual',
      statusBadge: 'Ficha conceptual y contraste empírico',
      question: '¿Por qué la acumulación de capital físico explica niveles de ingreso pero solo la productividad total de factores sostiene el crecimiento per cápita a largo plazo?',
      variables: {
        endogenous: ['Capital por trabajador efectivo (k*)', 'Producto por trabajador efectivo (y*)', 'Consumo de estado estacionario (c*)'],
        exogenous: ['Tasa de ahorro / inversión (s)', 'Tasa de depreciación (δ)', 'Crecimiento poblacional (n) y tecnológico (g)', 'Productividad total de factores (A)']
      },
      assumptions: [
        'Esquema conceptual analítico (no presentado como simulación numérica calibrada).',
        'Función de producción neoclásica con rendimientos constantes a escala y productividades marginales decrecientes.',
        'Economía en pleno empleo de largo plazo donde el ahorro determina la inversión bruta.'
      ],
      equations: [
        'Función intensiva: y = A · k^α   (con 0 < α < 1)',
        'Ecuación fundamental de acumulación: Δk = s·f(k) - (n + g + δ)·k',
        'Estado estacionario: s·f(k*) = (n + g + δ)·k*'
      ],
      empiricalIndicator: 'NY.GDP.PCAP.PP.KD',
      refs: ['Solow (1956)', 'Swan (1956)', 'Barro & Sala-i-Martin']
    }
  ];

  Object.assign(M, {
    createAsAdModel,
    createSupplyDemandModel,
    HISTORICAL_MILESTONES,
    buildHistoricalAnalysis,
    INDICATOR_CATEGORIES,
    INDICATORS_CATALOG,
    BCRP_LOCAL_SNAPSHOT,
    resolveIndicatorSeries,
    MODELS_LIBRARY
  });
})();
