/* ==========================================================================
   MacroScope · Laboratorio IS–LM–BP (Prototipo v2 — Pestaña Única)
   Usa exclusivamente globalThis.ISLM de ../../js/islm-model.js para todas
   las ecuaciones, curvas y equilibrios (E0, E1, E2).
   ========================================================================== */
(function () {
  'use strict';

  const ISLM = globalThis.ISLM;
  if (!ISLM || typeof ISLM.createModel !== 'function') {
    console.error('No se encontró globalThis.ISLM. Verifica la carga de ../../js/islm-model.js');
    return;
  }

  // Calibración por defecto del modelo (valores ilustrativos, sin inventar datos)
  const DEFAULT_CALIBRATION = Object.freeze({
    i0: 4,
    istar0: 3,
    cab: -2
  });

  // Contexto institucional por país (notas pedagógicas de MacroScope; usa calibración ilustrativa i0=4, istar0=3, cab=-2)
  const COUNTRY_CONTEXT = {
    STD: {
      name: 'Estándar académico',
      bank: 'Banco Central',
      note: 'Configuración de libro de texto abierta pequeña con valores ilustrativos por defecto (i₀ = 4%, i*₀ = 3%, ρ₀ = 1 pp, cuenta corriente inicial = −2% del producto).'
    },
    PER: {
      name: 'Perú',
      bank: 'BCRP',
      note: 'Contexto Perú (BCRP): opera una flotación administrada para moderar la volatilidad cambiaria. Con dolarización financiera parcial, una depreciación brusca (↑e) puede generar efectos hoja de balance que atenúan el impulso exportador.'
    },
    CHL: {
      name: 'Chile',
      bank: 'BCCh',
      note: 'Contexto Chile (BCCh): flotación cambiaria con metas de inflación y alta integración financiera; muy sensible a shocks de términos de intercambio (precio del cobre, ΔNX).'
    },
    COL: {
      name: 'Colombia',
      bank: 'BanRep',
      note: 'Contexto Colombia (BanRep): esquema de inflación objetivo con tipo de cambio flexible; alta sensibilidad a precios de materias primas y prima de riesgo soberano (ρ).'
    },
    MEX: {
      name: 'México',
      bank: 'Banxico',
      note: 'Contexto México (Banxico): flotación libre y estrecha sincronía con el ciclo industrial (Y*) y la política monetaria (i*) de Estados Unidos.'
    },
    BRA: {
      name: 'Brasil',
      bank: 'BCB',
      note: 'Contexto Brasil (BCB): economía de gran mercado interno con flotación cambiaria y diferencial de tasas relevante para los flujos de portafolio.'
    },
    USA: {
      name: 'Estados Unidos',
      bank: 'Fed',
      note: 'Contexto EE. UU. (Reserva Federal): economía grande emisora de moneda de reserva; sus decisiones de tasa mueven la referencia internacional i* para el resto del mundo.'
    }
  };

  // Utilidades de formato numérico
  const roundTo = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d || 0;
  const fmtAbs = (n, d = 1) =>
    Math.abs(n).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtNum = (n, d = 1) => {
    if (!Number.isFinite(n)) return 'N/D';
    const r = roundTo(n, d);
    return `${r < 0 ? '−' : ''}${fmtAbs(r, d)}`;
  };
  const fmtSigned = (n, d = 1) => {
    if (!Number.isFinite(n)) return 'N/D';
    const r = roundTo(n, d);
    return `${r > 0 ? '+' : r < 0 ? '−' : ''}${fmtAbs(r, d)}`;
  };
  const fmtKF = (v, d = 1) => {
    if (v === null || v === undefined) return '—';
    if (v === Infinity) return '+∞ (entrada)';
    if (v === -Infinity) return '−∞ (salida)';
    return fmtNum(v, d);
  };

  // Definición de controles de experimentación (Sección B)
  const INPUT_DEFS = [
    // 1. Política Fiscal
    {
      key: 'G',
      section: 'fiscal',
      isParam: false,
      short: 'G',
      label: 'Gasto público autónomo (G)',
      min: 10,
      max: 30,
      step: 0.5,
      fmt: (v) => `${fmtNum(v, 1)}`,
      help: 'Impulso directo a la demanda de bienes: desplaza IS, IS* y DA hacia la derecha (base = 18).'
    },
    {
      key: 'T0',
      section: 'fiscal',
      isParam: false,
      short: 'ΔT',
      label: 'Impuestos autónomos (ΔT)',
      min: -5,
      max: 5,
      step: 0.5,
      fmt: (v) => `${fmtSigned(v, 1)}`,
      help: 'Mayor carga tributaria reduce el ingreso disponible (Y − T) y contrae el consumo privado C.'
    },
    // 2. Política Monetaria
    {
      key: 'Mpct',
      section: 'monetary',
      isParam: false,
      short: 'ΔM/M',
      label: 'Oferta monetaria real (ΔM/M)',
      min: -20,
      max: 20,
      step: 1,
      fmt: (v) => `${fmtSigned(v, 0)}%`,
      help: 'Expande los saldos reales M/P: desplaza Mˢ, LM y LM* hacia la derecha.'
    },
    {
      key: 'ipol',
      section: 'monetary',
      isParam: false,
      short: 'i pol.',
      label: 'Tasa de interés de política (i_pol)',
      min: 0,
      max: 12,
      step: 0.25,
      fmt: (v) => `${fmtNum(v, 2)}%`,
      help: 'Con regla de tasa, el banco central fija i y acomoda endógenamente la cantidad de dinero M/P.'
    },
    // 3. Política Cambiaria
    {
      key: 'ebar',
      section: 'exchange',
      isParam: false,
      short: 'ē',
      label: 'Paridad cambiaria fijada (ē)',
      min: 80,
      max: 130,
      step: 1,
      fmt: (v) => `${fmtNum(v, 0)}`,
      help: 'Elevar ē equivale a una devaluación oficial (100 = paridad inicial; ↑ = depreciación).'
    },
    // 4. Shocks Externos y Expectativas
    {
      key: 'istar',
      section: 'external',
      isParam: false,
      short: 'i*',
      label: 'Tasa de interés internacional (i*)',
      min: 0,
      max: 10,
      step: 0.25,
      fmt: (v) => `${fmtNum(v, 2)}%`,
      help: 'Rendimiento externo de referencia (p. ej., Fed): eleva el umbral de paridad i* + ρ y desplaza BP.'
    },
    {
      key: 'rho',
      section: 'external',
      isParam: false,
      short: 'ρ',
      label: 'Prima de riesgo país y expectativa cambiaria (ρ)',
      min: 0,
      max: 10,
      step: 0.25,
      fmt: (v) => `${fmtNum(v, 2)} pp`,
      help: 'Mayor riesgo soberano exige una mayor tasa doméstica para evitar salidas de capital (BP arriba).'
    },
    {
      key: 'Ystar',
      section: 'external',
      isParam: false,
      short: 'Y*',
      label: 'Ingreso del resto del mundo (Y*)',
      min: 85,
      max: 115,
      step: 1,
      fmt: (v) => `${fmtNum(v, 0)}`,
      help: 'Tracción de demanda mundial por exportaciones domésticas (base = 100).'
    },
    {
      key: 'nxShock',
      section: 'external',
      isParam: false,
      short: 'ΔNX',
      label: 'Términos de intercambio / exportaciones autónomas (ΔNX)',
      min: -6,
      max: 6,
      step: 0.5,
      fmt: (v) => `${fmtSigned(v, 1)}`,
      help: 'Choque de precios de materias primas o competitividad comercial: desplaza IS y BP.'
    },
    {
      key: 'confShock',
      section: 'external',
      isParam: false,
      short: 'ΔConf.',
      label: 'Confianza de hogares y empresas (ΔC + ΔI autónomos)',
      min: -6,
      max: 6,
      step: 0.5,
      fmt: (v) => `${fmtSigned(v, 1)}`,
      help: 'Optimismo o cautela del sector privado sobre el gasto autónomo: desplaza IS y DA.'
    },
    // 5. Parámetros Estructurales
    {
      key: 'c',
      section: 'structural',
      isParam: true,
      short: 'c',
      label: 'Propensión marginal a consumir (c)',
      min: 0.5,
      max: 0.9,
      step: 0.01,
      fmt: (v) => fmtNum(v, 2),
      help: 'Mayor c amplifica el multiplicador keynesiano y vuelve más horizontal la curva IS.'
    },
    {
      key: 't',
      section: 'structural',
      isParam: true,
      short: 't',
      label: 'Tasa impositiva proporcional (t)',
      min: 0.1,
      max: 0.4,
      step: 0.01,
      fmt: (v) => fmtNum(v, 2),
      help: 'Estabilizador automático del ciclo: amortigua el multiplicador del gasto.'
    },
    {
      key: 'b',
      section: 'structural',
      isParam: true,
      short: 'b',
      label: 'Sensibilidad de la inversión a la tasa de interés (b)',
      min: 0.5,
      max: 4.0,
      step: 0.1,
      fmt: (v) => fmtNum(v, 1),
      help: 'Determina la intensidad de transmisión de la tasa i hacia la inversión privada I(i).'
    },
    {
      key: 'h',
      section: 'structural',
      isParam: true,
      short: 'h',
      label: 'Sensibilidad de la demanda de dinero a la tasa (h)',
      min: 0.5,
      max: 4.0,
      step: 0.1,
      fmt: (v) => fmtNum(v, 1),
      help: 'Mayor h aplana la curva LM y reduce el desplazamiento (crowding out) financiero.'
    },
    {
      key: 'm',
      section: 'structural',
      isParam: true,
      short: 'm',
      label: 'Propensión marginal a importar (m)',
      min: 0,
      max: 0.5,
      step: 0.01,
      fmt: (v) => fmtNum(v, 2),
      help: 'Filtración hacia importaciones cuando crece Y: reduce el multiplicador abierto.'
    },
    {
      key: 'n',
      section: 'structural',
      isParam: true,
      short: 'n',
      label: 'Sensibilidad de exportaciones netas al tipo de cambio (n)',
      min: 0.05,
      max: 0.5,
      step: 0.01,
      fmt: (v) => fmtNum(v, 2),
      help: 'Intensidad Marshall–Lerner: respuesta comercial ante depreciaciones o apreciaciones.'
    }
  ];

  // Escenarios preconfigurados (Presets)
  const PRESETS = [
    {
      id: 'fiscal',
      label: 'Expansión fiscal (+3 G)',
      requires: null,
      groupToOpen: 'fiscal',
      patch: (u0) => ({ G: u0.G + 3 })
    },
    {
      id: 'monetary',
      label: 'Expansión monetaria',
      requires: 'monetary',
      groupToOpen: 'monetary',
      patch: (u0, st) => (st.instrument === 'rate' ? { ipol: Math.max(0, u0.ipol - 1.5) } : { Mpct: 10 })
    },
    {
      id: 'fed',
      label: 'Alza de tasa externa (↑i*)',
      requires: 'open',
      groupToOpen: 'external',
      patch: (u0) => ({ istar: u0.istar + 2 })
    },
    {
      id: 'risk',
      label: 'Shock de riesgo país (↑ρ)',
      requires: 'open',
      groupToOpen: 'external',
      patch: (u0) => ({ rho: u0.rho + 2 })
    },
    {
      id: 'commodity',
      label: 'Caída de exportaciones (↓NX)',
      requires: 'open',
      groupToOpen: 'external',
      patch: () => ({ nxShock: -3 })
    },
    {
      id: 'world',
      label: 'Recesión mundial (↓Y*)',
      requires: 'open',
      groupToOpen: 'external',
      patch: (u0) => ({ Ystar: u0.Ystar - 8 })
    },
    {
      id: 'confidence',
      label: 'Caída de confianza (↓C,I)',
      requires: null,
      groupToOpen: 'external',
      patch: () => ({ confShock: -3 })
    },
    {
      id: 'devaluation',
      label: 'Devaluación oficial (↑ē)',
      requires: 'fixed',
      groupToOpen: 'exchange',
      patch: (u0) => ({ ebar: u0.ebar + 10 })
    }
  ];

  // Estado reactivo del laboratorio
  const state = {
    country: 'PER',
    regime: 'flex',
    mobility: 'high',
    instrument: 'money',
    params: { ...ISLM.DEFAULT_PARAMS },
    u: null,
    model: null,
    notes: [],
    activePreset: 'fiscal',
    layers: {
      IS: true,
      LM: true,
      BP: true,
      initial: true,
      impact: true,
      arrows: true,
      scenA: true
    },
    scenarioA: null, // Snapshot cuando el usuario fija el Escenario A para comparar A/B
    mobileSlide: 0,
    mobileLayoutMode: 'carousel', // 'carousel' | 'stack'
    whyActiveTab: 'all',
    anim: {
      rafId: 0,
      fromSnap: null,
      currentSnap: null
    }
  };

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ============================================================================
  // 1. MOTOR Y REGLAS DE HABILITACIÓN SEGÚN RÉGIMEN (TRILEMA DE MUNDELL)
  // ============================================================================
  function getDisabledReason(def, regime = state.regime, instrument = state.instrument) {
    const open = regime !== 'closed';
    switch (def.key) {
      case 'Mpct':
        if (regime === 'fixed') {
          return 'Endógena bajo tipo de cambio fijo: el banco central ajusta M/P vía reservas para defender ē.';
        }
        if (instrument === 'rate') {
          return 'Endógena bajo regla de tasa: la oferta monetaria se acomoda a la demanda de liquidez.';
        }
        return '';
      case 'ipol':
        if (regime === 'fixed') {
          return 'No disponible con tipo de cambio fijo (trilema de Mundell).';
        }
        if (instrument !== 'rate') {
          return 'Activa el instrumento «Regla de tasa de interés» en la Sección A para fijar i_pol.';
        }
        return '';
      case 'ebar':
        return regime === 'fixed'
          ? ''
          : 'Solo es instrumento bajo tipo de cambio fijo; en flotación e se determina en el mercado.';
      case 'istar':
      case 'rho':
      case 'Ystar':
      case 'nxShock':
      case 'm':
      case 'n':
        return open ? '' : 'No aplica en una economía cerrada sin sector externo.';
      default:
        return '';
    }
  }

  function rebuildModel(preserveShocks = true) {
    const norm = ISLM.normalizeConfig({
      regime: state.regime,
      mobility: state.mobility,
      instrument: state.instrument
    });
    state.instrument = norm.config.instrument;
    state.notes = norm.notes;

    state.model = ISLM.createModel({
      regime: state.regime,
      mobility: state.mobility,
      instrument: state.instrument,
      params: state.params,
      i0: DEFAULT_CALIBRATION.i0,
      istar0: DEFAULT_CALIBRATION.istar0,
      cab: DEFAULT_CALIBRATION.cab
    });

    if (!state.u || !preserveShocks) {
      state.u = { ...state.model.baseline };
    }

    // Restablece a su valor base los controles que no son aplicables en el régimen actual
    INPUT_DEFS.forEach((def) => {
      if (!def.isParam && getDisabledReason(def)) {
        state.u[def.key] = state.model.baseline[def.key];
      }
    });
  }

  // ============================================================================
  // 2. SNAPSHOT GEOMÉTRICO Y INTERPOLACIÓN (~400ms requestAnimationFrame)
  // ============================================================================
  function sameLine(l1, l2) {
    if (!l1 || !l2) return false;
    const n1 = Math.hypot(l1.a, l1.b) || 1;
    const n2 = Math.hypot(l2.a, l2.b) || 1;
    return (
      Math.abs(l1.a / n1 - l2.a / n2) < 1e-6 &&
      Math.abs(l1.b / n1 - l2.b / n2) < 1e-6 &&
      Math.abs(l1.c / n1 - l2.c / n2) < 1e-4
    );
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpLine(l0, l1, t) {
    if (!l0 || !l1) return l1 || l0;
    // Normalizamos el signo para evitar inversiones bruscas al interpolar
    const n0 = Math.hypot(l0.a, l0.b) || 1;
    const n1 = Math.hypot(l1.a, l1.b) || 1;
    const a0 = l0.a / n0, b0 = l0.b / n0, c0 = l0.c / n0;
    let a1 = l1.a / n1, b1 = l1.b / n1, c1 = l1.c / n1;
    if (a0 * a1 + b0 * b1 < 0) {
      a1 = -a1;
      b1 = -b1;
      c1 = -c1;
    }
    return {
      a: lerp(a0, a1, t),
      b: lerp(b0, b1, t),
      c: lerp(c0, c1, t)
    };
  }

  function lerpPoint(p0, p1, t) {
    if (!p0 || !p1) return p1 || p0;
    return {
      Y: lerp(p0.Y, p1.Y, t),
      i: lerp(p0.i, p1.i, t),
      e: lerp(p0.e, p1.e, t),
      M: lerp(p0.M, p1.M, t)
    };
  }

  // Genera las causas legibles del desplazamiento para mostrar en flechas y etiquetas
  function buildShiftReasons(m, u, E0, E2) {
    const u0 = m.baseline;
    const open = m.open;
    const isReasons = [];
    if (Math.abs(u.G - u0.G) > 1e-6) isReasons.push(`${u.G > u0.G ? '↑' : '↓'}G (${fmtSigned(u.G - u0.G, 1)})`);
    if (Math.abs(u.T0 - u0.T0) > 1e-6) isReasons.push(`${u.T0 > u0.T0 ? '↑' : '↓'}T (${fmtSigned(u.T0 - u0.T0, 1)})`);
    if (Math.abs(u.confShock - u0.confShock) > 1e-6) isReasons.push(`${u.confShock > u0.confShock ? '↑' : '↓'}Conf.`);
    if (open && Math.abs(u.nxShock - u0.nxShock) > 1e-6) isReasons.push(`${u.nxShock > u0.nxShock ? '↑' : '↓'}NX`);
    if (open && Math.abs(u.Ystar - u0.Ystar) > 1e-6) isReasons.push(`${u.Ystar > u0.Ystar ? '↑' : '↓'}Y*`);

    const isStarPrimary = isReasons.slice();
    if (open && Math.abs(E2.e - E0.e) > 0.08) {
      isReasons.push(`ajuste e (${E2.e > E0.e ? 'deprec.' : 'aprec.'})`);
    }
    if (Math.abs(E2.i - E0.i) > 0.03) {
      isStarPrimary.push(`${E2.i > E0.i ? '↑' : '↓'}i`);
    }

    const lmReasons = [];
    if (m.config.regime === 'fixed') {
      if (Math.abs(E2.M - E0.M) > 0.05) {
        lmReasons.push(`ΔReservas (${E2.M > E0.M ? '↑' : '↓'}M/P)`);
      }
    } else if (m.config.instrument === 'rate') {
      if (Math.abs(u.ipol - u0.ipol) > 1e-6) {
        lmReasons.push(`i pol. → ${fmtNum(u.ipol, 2)}%`);
      }
    } else if (Math.abs(u.Mpct - u0.Mpct) > 1e-6) {
      lmReasons.push(`${u.Mpct > u0.Mpct ? '↑' : '↓'}M (${fmtSigned(u.Mpct, 0)}%)`);
    }

    const bpReasons = [];
    if (open) {
      if (Math.abs(u.istar - u0.istar) > 1e-6) bpReasons.push(`${u.istar > u0.istar ? '↑' : '↓'}i*`);
      if (Math.abs(u.rho - u0.rho) > 1e-6) bpReasons.push(`${u.rho > u0.rho ? '↑' : '↓'}ρ`);
      if (m.kappa < Infinity) {
        if (Math.abs(u.nxShock - u0.nxShock) > 1e-6) bpReasons.push(`${u.nxShock > u0.nxShock ? '↑' : '↓'}NX`);
        if (Math.abs(u.Ystar - u0.Ystar) > 1e-6) bpReasons.push(`${u.Ystar > u0.Ystar ? '↑' : '↓'}Y*`);
        if (Math.abs(E2.e - E0.e) > 0.08) bpReasons.push(`ajuste e`);
      }
    }

    const lmStarReasons = [...lmReasons];
    if (open && (Math.abs(u.istar - u0.istar) > 1e-6 || Math.abs(u.rho - u0.rho) > 1e-6)) {
      lmStarReasons.push('Δ(i*+ρ)');
    }

    const moneyDemandReason =
      Math.abs(E2.Y - E0.Y) > 0.05 ? `${E2.Y > E0.Y ? '↑' : '↓'}Y (${fmtSigned(E2.Y - E0.Y, 1)})` : '';
    const moneySupplyReason =
      Math.abs(E2.M - E0.M) > 0.05
        ? m.config.regime === 'fixed'
          ? 'ΔReservas'
          : m.config.instrument === 'rate'
          ? 'Acomodación M'
          : `${u.Mpct > 0 ? '↑' : '↓'}M política`
        : '';

    const daReasons = [];
    if (isReasons.length) daReasons.push(isReasons[0]);
    if (Math.abs(E2.i - E0.i) > 0.03) daReasons.push(`${E2.i > E0.i ? '↑' : '↓'}i`);
    if (open && Math.abs(E2.e - E0.e) > 0.08) daReasons.push(`${E2.e > E0.e ? '↑' : '↓'}e`);

    return {
      IS: isReasons.join(' + ') || 'Cambio en demanda',
      LM: lmReasons.join(' + ') || 'Cambio monetario',
      BP: bpReasons.join(' + ') || 'Ajuste externo',
      ISstar: isStarPrimary.join(' + ') || 'Cambio en IS*',
      LMstar: lmStarReasons.join(' + ') || 'Ajuste LM–BP',
      ebar: Math.abs(u.ebar - u0.ebar) > 1e-6 ? `${u.ebar > u0.ebar ? 'Devaluación' : 'Revaluación'} ē` : '',
      L: moneyDemandReason || 'Cambio en Y',
      Ms: moneySupplyReason || 'Cambio en M/P',
      ipol: Math.abs(u.ipol - u0.ipol) > 1e-6 ? `Regla i = ${fmtNum(u.ipol, 2)}%` : '',
      DA: daReasons.join(', ') || 'Cambio en DA'
    };
  }

  function buildTargetSnapshot() {
    const m = state.model;
    const u = state.u;
    const u0 = m.baseline;
    const c = m.curves;
    const E0 = m.solve(u0, 'final');
    const E1 = m.solve(u, 'impact');
    const E2 = m.solve(u, 'final');
    if (!E0 || !E1 || !E2) return null;

    const reasons = buildShiftReasons(m, u, E0, E2);

    return {
      open: m.open,
      regime: m.config.regime,
      instrument: m.config.instrument,
      kappa: m.kappa,
      i0: m.i0,
      M0: m.M0,
      u: { ...u },
      u0: { ...u0 },
      E0,
      E1,
      E2,
      reasons,
      initialLines: {
        IS: c.IS(u0, 100),
        LM: c.LM(u0, m.M0),
        BP: c.BP(u0, 100),
        ISstar: c.ISstar(u0, E0.i),
        LMstar: c.LMstar(u0, m.M0),
        ebar: { a: 0, b: 1, c: 100 },
        L: c.moneyDemand(E0.Y),
        Ms: { a: 1, b: 0, c: E0.M },
        ipol: { a: 0, b: 1, c: u0.ipol },
        DA: c.aggregateDemand(u0, E0.i, E0.e)
      },
      finalLines: {
        IS: c.IS(u, E2.e),
        LM: c.LM(u, E2.M),
        BP: c.BP(u, E2.e),
        ISstar: c.ISstar(u, E2.i),
        LMstar: c.LMstar(u, E2.M),
        ebar: { a: 0, b: 1, c: u.ebar },
        L: c.moneyDemand(E2.Y),
        Ms: { a: 1, b: 0, c: E2.M },
        ipol: { a: 0, b: 1, c: u.ipol },
        DA: c.aggregateDemand(u, E2.i, E2.e)
      }
    };
  }

  function interpolateSnapshots(fromSnap, toSnap, t) {
    if (!fromSnap || t >= 1) {
      return {
        ...toSnap,
        progress: 1,
        animLines: { ...toSnap.finalLines },
        animE1: { ...toSnap.E1 },
        animE2: { ...toSnap.E2 }
      };
    }
    const animLines = {};
    Object.keys(toSnap.finalLines).forEach((k) => {
      const startLine = fromSnap.animLines?.[k] || fromSnap.finalLines?.[k] || toSnap.initialLines[k];
      animLines[k] = lerpLine(startLine, toSnap.finalLines[k], t);
    });
    return {
      ...toSnap,
      progress: t,
      animLines,
      animE1: lerpPoint(fromSnap.animE1 || fromSnap.E1, toSnap.E1, t),
      animE2: lerpPoint(fromSnap.animE2 || fromSnap.E2, toSnap.E2, t)
    };
  }

  function buildBaselineAsStartSnapshot(targetSnap) {
    return {
      ...targetSnap,
      animLines: { ...targetSnap.initialLines },
      animE1: { ...targetSnap.E0 },
      animE2: { ...targetSnap.E0 }
    };
  }

  function animateToCurrentModel(fromBaseline = false) {
    const targetSnap = buildTargetSnapshot();
    if (!targetSnap) return;

    if (state.anim.rafId) {
      cancelAnimationFrame(state.anim.rafId);
      state.anim.rafId = 0;
    }

    const startSnap = fromBaseline
      ? buildBaselineAsStartSnapshot(targetSnap)
      : state.anim.currentSnap || buildBaselineAsStartSnapshot(targetSnap);

    if (reducedMotionQuery.matches) {
      state.anim.currentSnap = interpolateSnapshots(startSnap, targetSnap, 1);
      drawAllDiagrams(state.anim.currentSnap);
      return;
    }

    const duration = 400;
    const startTime = performance.now();

    function step(now) {
      const raw = Math.min(1, (now - startTime) / duration);
      // Cubic ease-out para una transición académica suave y legible
      const eased = 1 - Math.pow(1 - raw, 3);
      state.anim.currentSnap = interpolateSnapshots(startSnap, targetSnap, eased);
      drawAllDiagrams(state.anim.currentSnap);
      if (raw < 1) {
        state.anim.rafId = requestAnimationFrame(step);
      } else {
        state.anim.rafId = 0;
      }
    }

    state.anim.rafId = requestAnimationFrame(step);
  }

  // ============================================================================
  // 3. MOTOR DE DIBUJO EN CANVAS 2D CON FLECHAS CAUSALES Y UNIDADES
  // ============================================================================
  function clipLine(line, xr, yr) {
    if (!line) return null;
    const { a, b, c } = line;
    const pts = [];
    if (Math.abs(b) > 1e-12) {
      [xr[0], xr[1]].forEach((x) => {
        const y = (c - a * x) / b;
        if (y >= yr[0] - 1e-7 && y <= yr[1] + 1e-7) pts.push([x, y]);
      });
    }
    if (Math.abs(a) > 1e-12) {
      [yr[0], yr[1]].forEach((y) => {
        const x = (c - b * y) / a;
        if (x >= xr[0] - 1e-7 && x <= xr[1] + 1e-7) pts.push([x, y]);
      });
    }
    if (pts.length < 2) return null;
    let best = [pts[0], pts[1]];
    let maxDist = -1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d > maxDist) {
          maxDist = d;
          best = [pts[i], pts[j]];
        }
      }
    }
    return maxDist < 1e-6 ? null : best;
  }

  function niceTicks(lo, hi, count = 4) {
    const span = Math.max(1e-6, hi - lo);
    const raw = span / count;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const norm = raw / mag;
    const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    const ticks = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) {
      ticks.push(roundTo(v, 4));
    }
    return {
      ticks,
      decimals: step >= 1 ? 0 : step >= 0.1 ? 1 : 2
    };
  }

  function computeAxisRange(values, center, minHalf) {
    const finite = values.filter(Number.isFinite);
    const pad = minHalf * 0.32;
    return [
      Math.min(center - minHalf, ...finite.map((v) => v - pad)),
      Math.max(center + minHalf, ...finite.map((v) => v + pad))
    ];
  }

  // Calcula el vector de flecha entre la curva inicial y la curva desplazada
  function computeShiftArrow(initialLine, finalLine, xr, yr, refPoint, fractionOffset = 0) {
    if (!initialLine || !finalLine || sameLine(initialLine, finalLine)) return null;
    const xSpan = xr[1] - xr[0];
    const ySpan = yr[1] - yr[0];

    // Si la curva tiene suficiente componente en X (vertical o inclinada), medimos el desplazamiento horizontal
    if (Math.abs(initialLine.a) > 1e-6 && Math.abs(finalLine.a) > 1e-6 && Math.abs(initialLine.b / initialLine.a) < 8) {
      const yAnchor = Math.min(
        yr[1] - ySpan * 0.18,
        Math.max(yr[0] + ySpan * 0.18, (refPoint?.y ?? (yr[0] + yr[1]) / 2) + fractionOffset * ySpan)
      );
      const x0 = (initialLine.c - initialLine.b * yAnchor) / initialLine.a;
      const x1 = (finalLine.c - finalLine.b * yAnchor) / finalLine.a;
      if (x0 >= xr[0] && x0 <= xr[1] && x1 >= xr[0] && x1 <= xr[1]) {
        return { x0, y0: yAnchor, x1, y1: yAnchor };
      }
    }

    // Curva horizontal o casi horizontal (ej. LM con regla de tasa, BP con κ→∞, ē, DA)
    if (Math.abs(initialLine.b) > 1e-6 && Math.abs(finalLine.b) > 1e-6) {
      const xAnchor = Math.min(
        xr[1] - xSpan * 0.22,
        Math.max(xr[0] + xSpan * 0.22, (refPoint?.x ?? (xr[0] + xr[1]) / 2) + fractionOffset * xSpan)
      );
      const y0 = (initialLine.c - initialLine.a * xAnchor) / initialLine.b;
      const y1 = (finalLine.c - finalLine.a * xAnchor) / finalLine.b;
      if (y0 >= yr[0] && y0 <= yr[1] && y1 >= yr[0] && y1 <= yr[1]) {
        return { x0: xAnchor, y0, x1: xAnchor, y1 };
      }
    }
    return null;
  }

  function drawRoundedBadge(ctx, text, cx, cy, fgColor, bgColor, borderColor, plotBounds) {
    ctx.save();
    ctx.font = "700 10px 'DM Sans', system-ui, sans-serif";
    const padX = 6;
    const h = 18;
    const tw = ctx.measureText(text).width;
    const w = tw + padX * 2;
    const x = Math.min(Math.max(cx - w / 2, plotBounds.l + 4), plotBounds.l + plotBounds.w - w - 4);
    const y = Math.min(Math.max(cy - h / 2, plotBounds.t + 4), plotBounds.t + plotBounds.h - h - 4);

    ctx.beginPath();
    const r = 5;
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    ctx.fillStyle = bgColor;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.stroke();

    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2 + 0.5);
    ctx.restore();
  }

  function renderCanvasDiagram(canvas, spec) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const styles = getComputedStyle(document.documentElement);
    const token = (name) => styles.getPropertyValue(name).trim() || '#888';

    if (spec.emptyMessage) {
      ctx.fillStyle = token('--muted');
      ctx.font = "600 12px 'DM Sans', system-ui, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const words = spec.emptyMessage.split(' ');
      let line = '';
      let y = h / 2 - 16;
      words.forEach((word) => {
        if (ctx.measureText(`${line}${word} `).width > w - 44) {
          ctx.fillText(line.trim(), w / 2, y);
          line = '';
          y += 18;
        }
        line += `${word} `;
      });
      ctx.fillText(line.trim(), w / 2, y);
      return;
    }

    const pad = { l: 48, r: 18, t: 18, b: 40 };
    const pw = Math.max(40, w - pad.l - pad.r);
    const ph = Math.max(40, h - pad.t - pad.b);
    const [x0, x1] = spec.x.range;
    const [y0, y1] = spec.y.range;

    const sx = (x) => pad.l + ((x - x0) / (x1 - x0)) * pw;
    const sy = (y) => pad.t + ph - ((y - y0) / (y1 - y0)) * ph;

    // 1. Cuadrícula y marcas de graduación
    const xt = niceTicks(x0, x1, 4);
    const yt = niceTicks(y0, y1, 4);

    ctx.lineWidth = 1;
    ctx.strokeStyle = token('--grid-line');
    ctx.fillStyle = token('--chart-tick');
    ctx.font = "500 10px 'IBM Plex Mono', monospace";

    xt.ticks.forEach((xv) => {
      const px = sx(xv);
      ctx.beginPath();
      ctx.moveTo(px, pad.t);
      ctx.lineTo(px, pad.t + ph);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(fmtNum(xv, xt.decimals), px, pad.t + ph + 5);
    });

    yt.ticks.forEach((yv) => {
      const py = sy(yv);
      ctx.beginPath();
      ctx.moveTo(pad.l, py);
      ctx.lineTo(pad.l + pw, py);
      ctx.stroke();
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(fmtNum(yv, yt.decimals), pad.l - 7, py);
    });

    // 2. Ejes principales y títulos con unidades
    ctx.strokeStyle = token('--axis-line');
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l, pad.t + ph);
    ctx.lineTo(pad.l + pw, pad.t + ph);
    ctx.stroke();

    ctx.fillStyle = token('--muted');
    ctx.font = "700 10.5px 'DM Sans', system-ui, sans-serif";
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(spec.x.label, pad.l + pw, h - 3);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(spec.y.label, pad.l + 7, pad.t + 3);

    // 3. Área recortada de trazado de curvas, flechas y equilibrios
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.l, pad.t, pw, ph);
    ctx.clip();

    const curveLabels = [];

    // Trazado de curvas
    (spec.curves || []).forEach((item) => {
      if (!item || !item.line) return;
      const seg = clipLine(item.line, spec.x.range, spec.y.range);
      if (!seg) return;

      const stroke = token(item.colorToken);
      ctx.strokeStyle = stroke;
      ctx.globalAlpha = item.isInitial ? 0.58 : item.isScenA ? 0.78 : 1;
      ctx.lineWidth = item.isInitial ? 1.65 : item.isScenA ? 1.9 : 2.55;
      ctx.setLineDash(item.isInitial ? [6, 5] : item.isScenA ? [3, 3] : []);

      ctx.beginPath();
      ctx.moveTo(sx(seg[0][0]), sy(seg[0][1]));
      ctx.lineTo(sx(seg[1][0]), sy(seg[1][1]));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      if (item.label) {
        const ranked = seg
          .slice()
          .sort((p, q) => sx(q[0]) - sy(q[1]) - (sx(p[0]) - sy(p[1])));
        const anchor = item.isInitial ? ranked[1] : ranked[0];
        curveLabels.push({
          text: item.label,
          x: sx(anchor[0]),
          y: sy(anchor[1]),
          color: stroke,
          isInitial: item.isInitial
        });
      }
    });

    // Trazado de flechas de desplazamiento con causa ("qué curva se mueve y por qué")
    if (state.layers.arrows && spec.arrows) {
      spec.arrows.forEach((arr) => {
        if (!arr || !arr.vec) return;
        const p0x = sx(arr.vec.x0);
        const p0y = sy(arr.vec.y0);
        const p1x = sx(arr.vec.x1);
        const p1y = sy(arr.vec.y1);
        const distPx = Math.hypot(p1x - p0x, p1y - p0y);
        if (distPx < 4) return;

        const angle = Math.atan2(p1y - p0y, p1x - p0x);
        const headLen = Math.min(7.5, Math.max(5, distPx * 0.45));
        const stroke = token(arr.colorToken);

        ctx.save();
        ctx.strokeStyle = stroke;
        ctx.fillStyle = stroke;
        ctx.lineWidth = 1.9;

        // Línea de la flecha
        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.stroke();

        // Punta de la flecha
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p1x - headLen * Math.cos(angle - Math.PI / 6), p1y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(p1x - headLen * Math.cos(angle + Math.PI / 6), p1y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        if (arr.reasonText && distPx >= 5) {
          const midX = (p0x + p1x) / 2;
          const midY = (p0y + p1y) / 2 - 14;
          drawRoundedBadge(
            ctx,
            arr.reasonText,
            midX,
            midY,
            stroke,
            token('--surface-glass'),
            stroke,
            { l: pad.l, t: pad.t, w: pw, h: ph }
          );
        }
      });
    }

    // Trazado de puntos de equilibrio (E0, E1 hueco, E2 final, y A si hay comparación)
    (spec.points || []).forEach((pt) => {
      if (!pt || !Number.isFinite(pt.x) || !Number.isFinite(pt.y)) return;
      const px = sx(pt.x);
      const py = sy(pt.y);

      if (pt.guides) {
        ctx.strokeStyle = token('--subtle');
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px, pad.t + ph);
        ctx.moveTo(px, py);
        ctx.lineTo(pad.l, py);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const ptColor = token(pt.colorToken || '--eq-e2');
      ctx.beginPath();
      ctx.arc(px, py, pt.hollow ? 4.8 : 5.2, 0, Math.PI * 2);
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = ptColor;

      if (pt.hollow) {
        ctx.fillStyle = token('--surface');
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = ptColor;
        ctx.fill();
        ctx.strokeStyle = token('--surface');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.fillStyle = ptColor;
      ctx.font = "800 10.5px 'Plus Jakarta Sans', sans-serif";
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      const labelX = Math.min(px + 7, pad.l + pw - 26);
      const labelY = Math.max(py - 5, pad.t + 14);
      ctx.fillText(pt.label, labelX, labelY);
    });

    ctx.restore();

    // 4. Etiquetas de curvas dentro del recuadro
    curveLabels.forEach((lbl) => {
      ctx.font = "800 10.5px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = lbl.color;
      ctx.globalAlpha = lbl.isInitial ? 0.76 : 1;
      const tw = ctx.measureText(lbl.text).width;
      const x = Math.min(Math.max(lbl.x + 4, pad.l + 3), pad.l + pw - tw - 4);
      const y = Math.min(Math.max(lbl.y - 4, pad.t + 14), pad.t + ph - 6);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillText(lbl.text, x, y);
      ctx.globalAlpha = 1;
    });
  }

  function makeCurvePair(initial, final, colorToken, baseName, showLayer) {
    if (!showLayer) return [];
    const moved = !sameLine(initial, final);
    const out = [];
    if (moved && state.layers.initial) {
      out.push({
        line: initial,
        colorToken,
        isInitial: true,
        label: `${baseName}₀`
      });
    }
    out.push({
      line: final,
      colorToken,
      isInitial: false,
      label: moved ? `${baseName}₁` : baseName
    });
    return out;
  }

  function drawAllDiagrams(snap) {
    if (!snap) return;
    const { open, regime, instrument, kappa, E0, animE1: E1, animE2: E2, initialLines: L0, animLines: L1, reasons } = snap;
    const scenA = state.scenarioA && state.layers.scenA ? state.scenarioA : null;

    const allPts = [E0, E1, E2, ...(scenA ? [scenA.E2] : [])];
    const yRange = computeAxisRange(allPts.map((p) => p.Y), 100, 15);
    const iRange = computeAxisRange(
      [...allPts.map((p) => p.i), snap.u.ipol, snap.u.istar + snap.u.rho],
      snap.i0,
      3.8
    );
    const eRange = computeAxisRange([...allPts.map((p) => p.e), snap.u.ebar], 100, 18);
    const mRange = computeAxisRange(allPts.map((p) => p.M), snap.M0, Math.max(8, snap.M0 * 0.36));

    const buildEquilibriumPoints = (fx, fy) => {
      const pts = [];
      if (state.layers.initial) {
        pts.push({ x: fx(E0), y: fy(E0), label: 'E₀', colorToken: '--eq-e0' });
      }
      const impactDistinct =
        open &&
        [E0, E2].every((E) => Math.abs(E1.Y - E.Y) > 0.02 || Math.abs(E1.i - E.i) > 0.005);
      if (state.layers.impact && impactDistinct) {
        pts.push({ x: fx(E1), y: fy(E1), label: 'E₁', hollow: true, colorToken: '--eq-e1' });
      }
      if (scenA) {
        pts.push({ x: fx(scenA.E2), y: fy(scenA.E2), label: 'E₂(A)', hollow: true, colorToken: '--eq-a' });
      }
      pts.push({ x: fx(E2), y: fy(E2), label: 'E₂', guides: true, colorToken: '--eq-e2' });
      return pts;
    };

    // --- 1. DIAGRAMA IS-LM-BP ---
    const lmName = instrument === 'rate' && regime !== 'fixed' ? 'LM (i pol.)' : 'LM';
    const islmArrows = [];
    if (state.layers.IS && !sameLine(L0.IS, L1.IS)) {
      islmArrows.push({
        vec: computeShiftArrow(L0.IS, L1.IS, yRange, iRange, { x: E0.Y, y: E0.i }, 0.16),
        colorToken: '--curve-is',
        reasonText: `IS: ${reasons.IS}`
      });
    }
    if (state.layers.LM && !sameLine(L0.LM, L1.LM)) {
      islmArrows.push({
        vec: computeShiftArrow(L0.LM, L1.LM, yRange, iRange, { x: E0.Y, y: E0.i }, -0.18),
        colorToken: '--curve-lm',
        reasonText: `LM: ${reasons.LM}`
      });
    }
    if (open && state.layers.BP && !sameLine(L0.BP, L1.BP)) {
      islmArrows.push({
        vec: computeShiftArrow(L0.BP, L1.BP, yRange, iRange, { x: E0.Y, y: E0.i }, 0.02),
        colorToken: '--curve-bp',
        reasonText: `BP: ${reasons.BP}`
      });
    }

    renderCanvasDiagram(document.getElementById('canvasISLM'), {
      x: { range: yRange, label: 'Y (índice 100)' },
      y: { range: iRange, label: 'i (%)' },
      curves: [
        ...makeCurvePair(L0.IS, L1.IS, '--curve-is', 'IS', state.layers.IS),
        ...makeCurvePair(L0.LM, L1.LM, '--curve-lm', lmName, state.layers.LM),
        ...(open ? makeCurvePair(L0.BP, L1.BP, '--curve-bp', 'BP', state.layers.BP) : []),
        ...(scenA && state.layers.IS
          ? [{ line: scenA.finalLines.IS, colorToken: '--curve-scena', isScenA: true, label: 'IS(A)' }]
          : [])
      ],
      arrows: islmArrows,
      points: buildEquilibriumPoints((p) => p.Y, (p) => p.i)
    });

    // --- 2. DIAGRAMA MUNDELL-FLEMING (IS*-LM*) ---
    const mfName = kappa === Infinity ? 'LM*' : kappa === 0 ? 'BP*' : 'LM–BP';
    const mfArrows = [];
    if (open) {
      if (state.layers.IS && !sameLine(L0.ISstar, L1.ISstar)) {
        mfArrows.push({
          vec: computeShiftArrow(L0.ISstar, L1.ISstar, yRange, eRange, { x: E0.Y, y: E0.e }, 0.16),
          colorToken: '--curve-is',
          reasonText: `IS*: ${reasons.ISstar}`
        });
      }
      if (state.layers.LM && !sameLine(L0.LMstar, L1.LMstar)) {
        mfArrows.push({
          vec: computeShiftArrow(L0.LMstar, L1.LMstar, yRange, eRange, { x: E0.Y, y: E0.e }, -0.18),
          colorToken: '--curve-lm',
          reasonText: `${mfName}: ${reasons.LMstar}`
        });
      }
      if (regime === 'fixed' && state.layers.BP && !sameLine(L0.ebar, L1.ebar)) {
        mfArrows.push({
          vec: computeShiftArrow(L0.ebar, L1.ebar, yRange, eRange, { x: E0.Y, y: E0.e }, 0.05),
          colorToken: '--curve-bp',
          reasonText: reasons.ebar
        });
      }
    }

    renderCanvasDiagram(
      document.getElementById('canvasMF'),
      open
        ? {
            x: { range: yRange, label: 'Y (índice 100)' },
            y: { range: eRange, label: 'e (índice 100, ↑ = depreciación)' },
            curves: [
              ...makeCurvePair(L0.ISstar, L1.ISstar, '--curve-is', 'IS*', state.layers.IS),
              ...makeCurvePair(L0.LMstar, L1.LMstar, '--curve-lm', mfName, state.layers.LM),
              ...(regime === 'fixed'
                ? makeCurvePair(L0.ebar, L1.ebar, '--curve-bp', 'ē', state.layers.BP)
                : []),
              ...(scenA && scenA.open && state.layers.IS
                ? [{ line: scenA.finalLines.ISstar, colorToken: '--curve-scena', isScenA: true, label: 'IS*(A)' }]
                : [])
            ],
            arrows: mfArrows,
            points: buildEquilibriumPoints((p) => p.Y, (p) => p.e)
          }
        : {
            emptyMessage:
              'En una economía cerrada no existen exportaciones netas ni tipo de cambio e. Selecciona un régimen abierto (flexible o fijo) para activar el plano Mundell–Fleming (Y, e).'
          }
    );

    // --- 3. DIAGRAMA MERCADO MONETARIO ---
    const rateRule = instrument === 'rate' && regime !== 'fixed';
    const moneyArrows = [];
    if (state.layers.IS && !sameLine(L0.L, L1.L)) {
      moneyArrows.push({
        vec: computeShiftArrow(L0.L, L1.L, mRange, iRange, { x: E0.M, y: E0.i }, 0.16),
        colorToken: '--curve-is',
        reasonText: `L(Y): ${reasons.L}`
      });
    }
    if (state.layers.LM && !sameLine(L0.Ms, L1.Ms)) {
      moneyArrows.push({
        vec: computeShiftArrow(L0.Ms, L1.Ms, mRange, iRange, { x: E0.M, y: E0.i }, -0.18),
        colorToken: '--curve-lm',
        reasonText: `Mˢ: ${reasons.Ms}`
      });
    }

    renderCanvasDiagram(document.getElementById('canvasMoney'), {
      x: { range: mRange, label: 'M/P (saldos reales)' },
      y: { range: iRange, label: 'i (%)' },
      curves: [
        ...makeCurvePair(L0.L, L1.L, '--curve-is', 'L(Y)', state.layers.IS),
        ...makeCurvePair(L0.Ms, L1.Ms, '--curve-lm', 'Mˢ/P', state.layers.LM),
        ...(rateRule ? makeCurvePair(L0.ipol, L1.ipol, '--curve-bp', 'i pol.', state.layers.BP) : [])
      ],
      arrows: moneyArrows,
      points: buildEquilibriumPoints((p) => p.M, (p) => p.i)
    });

    // --- 4. DIAGRAMA CRUZ KEYNESIANA ---
    const crossArrows = [];
    if (state.layers.IS && !sameLine(L0.DA, L1.DA)) {
      crossArrows.push({
        vec: computeShiftArrow(L0.DA, L1.DA, yRange, yRange, { x: E0.Y, y: E0.Y }, -0.14),
        colorToken: '--curve-da',
        reasonText: `DA: ${reasons.DA}`
      });
    }

    renderCanvasDiagram(document.getElementById('canvasCross'), {
      x: { range: yRange, label: 'Y (ingreso/producto, índice 100)' },
      y: { range: yRange, label: 'DA (demanda agregada, índice 100)' },
      curves: [
        { line: { a: -1, b: 1, c: 0 }, colorToken: '--curve-45', isInitial: false, label: '45° (Y=DA)' },
        ...makeCurvePair(L0.DA, L1.DA, '--curve-da', 'DA', state.layers.IS),
        ...(scenA && state.layers.IS
          ? [{ line: scenA.finalLines.DA, colorToken: '--curve-scena', isScenA: true, label: 'DA(A)' }]
          : [])
      ],
      arrows: crossArrows,
      points: buildEquilibriumPoints((p) => p.Y, (p) => p.Y)
    });

    // Etiquetas accesibles y píldoras de desplazamiento en las cabeceras de cada tarjeta
    updateDiagramHeaderBadges(snap);
  }

  function updateDiagramHeaderBadges(snap) {
    const { open, E0, E2, initialLines: L0, finalLines: L1, reasons } = snap;
    const setBadge = (id, moved, text) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = moved ? text : 'En equilibrio base E₀';
      el.classList.toggle('is-idle', !moved);
    };

    const isMoved = !sameLine(L0.IS, L1.IS);
    const lmMoved = !sameLine(L0.LM, L1.LM);
    const bpMoved = open && !sameLine(L0.BP, L1.BP);
    const islmParts = [];
    if (isMoved) islmParts.push(`IS (${reasons.IS})`);
    if (lmMoved) islmParts.push(`LM (${reasons.LM})`);
    if (bpMoved) islmParts.push(`BP (${reasons.BP})`);
    setBadge('shiftBadgeISLM', islmParts.length > 0, islmParts.join(' · '));

    if (!open) {
      setBadge('shiftBadgeMF', false, 'Economía cerrada (sin e)');
    } else {
      const mfParts = [];
      if (!sameLine(L0.ISstar, L1.ISstar)) mfParts.push(`IS* (${reasons.ISstar})`);
      if (!sameLine(L0.LMstar, L1.LMstar)) mfParts.push(`LM* (${reasons.LMstar})`);
      setBadge('shiftBadgeMF', mfParts.length > 0, mfParts.join(' · '));
    }

    const moneyParts = [];
    if (!sameLine(L0.L, L1.L)) moneyParts.push(`L(Y): ${reasons.L}`);
    if (!sameLine(L0.Ms, L1.Ms)) moneyParts.push(`Mˢ: ${reasons.Ms}`);
    setBadge('shiftBadgeMoney', moneyParts.length > 0, moneyParts.join(' · '));

    const daMoved = !sameLine(L0.DA, L1.DA);
    setBadge('shiftBadgeCross', daMoved, `DA (${reasons.DA})`);

    // Actualizar aria-labels descriptivos en los 4 canvas
    const summary = `Inicial E₀: Y=${fmtNum(E0.Y)}, i=${fmtNum(E0.i, 2)}%. Final E₂: Y=${fmtNum(E2.Y)}, i=${fmtNum(E2.i, 2)}%${open ? `, e=${fmtNum(E2.e)}` : ''}.`;
    document.getElementById('canvasISLM')?.setAttribute('aria-label', `Diagrama IS-LM-BP. ${summary}`);
    document.getElementById('canvasMF')?.setAttribute(
      'aria-label',
      open ? `Diagrama Mundell-Fleming IS*-LM*. ${summary}` : 'Diagrama Mundell-Fleming inactivo en economía cerrada.'
    );
    document.getElementById('canvasMoney')?.setAttribute(
      'aria-label',
      `Mercado monetario: saldos reales M/P pasan de ${fmtNum(E0.M)} a ${fmtNum(E2.M)}.`
    );
    document.getElementById('canvasCross')?.setAttribute('aria-label', `Cruz keynesiana. ${summary}`);
  }

  // ============================================================================
  // 4. CONTROLES, RESULTADOS, MULTIPLICADORES, PASOS Y MODAL "¿POR QUÉ?"
  // ============================================================================
  function buildControlsDOM() {
    const sections = ['fiscal', 'monetary', 'exchange', 'external', 'structural'];
    sections.forEach((sec) => {
      const container = document.getElementById(`inputs-${sec}`);
      if (!container) return;
      const defs = INPUT_DEFS.filter((d) => d.section === sec);
      container.innerHTML = defs
        .map((d) => {
          const id = `ctrl-${d.key}`;
          return `
            <div class="slider-field" data-key="${d.key}">
              <div class="slider-top">
                <label class="slider-label" for="${id}">${d.label}</label>
                <div class="slider-val-group">
                  <output class="slider-output" id="${id}-out" for="${id}"></output>
                </div>
              </div>
              <input class="slider-range" id="${id}" type="range" min="${d.min}" max="${d.max}" step="${d.step}">
              <div class="slider-hint" id="${id}-hint">${d.help}</div>
            </div>
          `;
        })
        .join('');

      container.querySelectorAll('.slider-range').forEach((input) => {
        input.addEventListener('input', () => {
          const key = input.closest('.slider-field').dataset.key;
          const def = INPUT_DEFS.find((d) => d.key === key);
          state.activePreset = null;
          if (def.isParam) {
            state.params[key] = Number(input.value);
            rebuildModel(true);
          } else {
            state.u[key] = Number(input.value);
          }
          refreshLaboratory(false);
        });
      });
    });

    const presetsNode = document.getElementById('presetsContainer');
    if (presetsNode) {
      presetsNode.innerHTML = PRESETS.map(
        (p) => `<button type="button" class="preset-btn" data-preset="${p.id}">${p.label}</button>`
      ).join('');
      presetsNode.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-btn');
        if (!btn || btn.disabled) return;
        const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
        if (!preset) return;
        state.activePreset = preset.id;
        state.u = {
          ...state.model.baseline,
          ...preset.patch(state.model.baseline, state)
        };
        if (preset.groupToOpen) {
          const detailsEl = document.getElementById(`group-${preset.groupToOpen}`);
          if (detailsEl) detailsEl.open = true;
        }
        refreshLaboratory(true);
      });
    }
  }

  function syncSidebarUI() {
    const m = state.model;
    document.getElementById('cfgCountry').value = state.country;
    document.getElementById('cfgRegime').value = state.regime;
    document.getElementById('cfgMobility').value = state.mobility;
    document.getElementById('cfgMobility').disabled = state.regime === 'closed';

    const instSelect = document.getElementById('cfgInstrument');
    const allowed = ISLM.availableInstruments(state.regime, state.mobility);
    [...instSelect.options].forEach((opt) => {
      opt.disabled = state.regime !== 'closed' && !allowed.includes(opt.value);
    });
    instSelect.disabled = state.regime === 'fixed';
    instSelect.value = state.instrument;

    const regimeMap = { flex: 'FLEXIBLE', fixed: 'FIJO (ē)', closed: 'CERRADA' };
    document.getElementById('regimeBadge').textContent = regimeMap[state.regime] || 'FLEXIBLE';

    const mobLabel = ISLM.MOBILITY[state.mobility]?.label || 'Alta';
    document.getElementById('mobileRegimeSummary').textContent =
      state.regime === 'closed'
        ? 'Economía cerrada · IS–LM'
        : `Abierta · ${state.regime === 'flex' ? 'Flexible' : 'Fijo'} · Movilidad ${mobLabel.toLowerCase()}`;

    // Aviso del Trilema y contexto institucional
    const trilemmaParts = [];
    if (state.regime === 'closed') {
      trilemmaParts.push(
        '<strong>Economía cerrada:</strong> sin comercio ni flujos de capital. El banco central controla su instrumento monetario (M/P o i_pol) y la política fiscal desplaza la IS con crowding out vía tasa de interés.'
      );
    } else if (state.regime === 'flex') {
      trilemmaParts.push(
        state.mobility === 'perfect'
          ? '<strong>Mundell–Fleming con movilidad perfecta (κ → ∞):</strong> la tasa doméstica queda anclada en <code>i = i* + ρ</code> y el ajuste recae íntegramente en el tipo de cambio <code>e</code>.'
          : '<strong>Tipo de cambio flexible:</strong> el banco central conserva autonomía monetaria y el tipo de cambio <code>e</code> se ajusta para equilibrar la balanza de pagos (<code>NX + KF = 0</code>).'
      );
    } else {
      trilemmaParts.push(
        '<strong>Trilema de Mundell (Tipo de cambio fijo):</strong> para defender la paridad <code>ē</code>, el banco central interviene comprando o vendiendo reservas internacionales; la oferta monetaria <code>M/P</code> se vuelve endógena.'
      );
    }
    if (state.notes.length) {
      trilemmaParts.push(...state.notes);
    }
    const ctxNote = COUNTRY_CONTEXT[state.country]?.note;
    if (ctxNote) {
      trilemmaParts.push(ctxNote);
    }
    document.getElementById('trilemmaCallout').innerHTML = trilemmaParts.join(' ');

    // Sincronizar sliders y contadores de cambios por grupo
    const groupCounts = { fiscal: 0, monetary: 0, exchange: 0, external: 0, structural: 0 };
    let totalActive = 0;

    INPUT_DEFS.forEach((def) => {
      const input = document.getElementById(`ctrl-${def.key}`);
      const out = document.getElementById(`ctrl-${def.key}-out`);
      const hint = document.getElementById(`ctrl-${def.key}-hint`);
      if (!input || !out || !hint) return;

      const val = def.isParam ? state.params[def.key] : state.u[def.key];
      const baseVal = def.isParam ? ISLM.DEFAULT_PARAMS[def.key] : m.baseline[def.key];
      if (Number(input.value) !== val) input.value = val;
      out.textContent = def.fmt(val);

      const reason = getDisabledReason(def);
      input.disabled = Boolean(reason);
      const field = input.closest('.slider-field');
      field.classList.toggle('is-disabled', Boolean(reason));

      const isModified = !reason && Math.abs(val - baseVal) > 1e-6;
      field.classList.toggle('is-modified', isModified);
      if (isModified) {
        groupCounts[def.section]++;
        totalActive++;
      }

      hint.textContent = reason || def.help;
      const pct = ((val - def.min) / (def.max - def.min)) * 100;
      input.style.setProperty('--range-pct', `${Math.max(0, Math.min(100, pct))}%`);
    });

    Object.entries(groupCounts).forEach(([sec, count]) => {
      const badge = document.getElementById(`count-${sec}`);
      if (badge) {
        badge.textContent = String(count);
        badge.classList.toggle('has-changes', count > 0);
      }
    });

    const activeText = totalActive === 0 ? 'Sin cambios (E₀)' : `${totalActive} ${totalActive === 1 ? 'cambio activo' : 'cambios activos'}`;
    document.getElementById('activeShocksBadge').textContent = activeText;
    document.getElementById('mobileActiveCount').textContent = totalActive === 0 ? 'Base E₀' : `${totalActive} activo${totalActive > 1 ? 's' : ''}`;

    // Botones de presets
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      const preset = PRESETS.find((p) => p.id === btn.dataset.preset);
      if (!preset) return;
      const blocked =
        preset.requires === 'open' && state.regime === 'closed'
          ? 'Requiere economía abierta.'
          : preset.requires === 'fixed' && state.regime !== 'fixed'
          ? 'Requiere régimen de tipo de cambio fijo.'
          : preset.requires === 'monetary' && state.regime === 'fixed'
          ? 'Con tipo de cambio fijo la política monetaria es endógena.'
          : '';
      btn.disabled = Boolean(blocked);
      btn.title = blocked;
      btn.classList.toggle('is-active', !blocked && state.activePreset === preset.id);
    });
  }

  function renderResultsAndMultipliers(E0, E1, E2) {
    const open = state.model.open;
    const scenA = state.scenarioA;

    // 1. Tarjetas rápidas de las 4 variables nucleares (Y, i, e, M/P)
    const coreVars = [
      { key: 'Y', label: 'Producto (Y · índice)', v0: E0.Y, v2: E2.Y, dec: 1, unit: '' },
      { key: 'i', label: 'Tasa doméstica (i · %)', v0: E0.i, v2: E2.i, dec: 2, unit: '%' },
      {
        key: 'e',
        label: open ? 'Tipo de cambio (e · índice)' : 'Tipo de cambio (cerrada)',
        v0: open ? E0.e : null,
        v2: open ? E2.e : null,
        dec: 1,
        unit: ''
      },
      { key: 'M', label: 'Saldos reales (M/P)', v0: E0.M, v2: E2.M, dec: 1, unit: '' }
    ];

    document.getElementById('coreMetricsGrid').innerHTML = coreVars
      .map((item) => {
        if (item.v2 === null) {
          return `
            <div class="core-metric-card">
              <span class="core-metric-label">${item.label}</span>
              <span class="core-metric-val">—</span>
              <div class="core-metric-sub"><span>Economía cerrada</span></div>
            </div>
          `;
        }
        const delta = item.v2 - item.v0;
        const absDelta = Math.abs(delta);
        const cls = absDelta < 0.005 ? 'zero' : delta > 0 ? 'pos' : 'neg';
        return `
          <div class="core-metric-card">
            <span class="core-metric-label">${item.label}</span>
            <span class="core-metric-val">${fmtNum(item.v2, item.dec)}${item.unit}</span>
            <div class="core-metric-sub">
              <span>E₀: ${fmtNum(item.v0, item.dec)}${item.unit}</span>
              <span class="delta-badge ${cls}">${fmtSigned(delta, item.dec)}${item.unit}</span>
            </div>
          </div>
        `;
      })
      .join('');

    // 2. Cabecera y filas de la tabla E0 / E1 / E2 / Variación / Comparación A vs B
    const headRow = document.getElementById('resultsTableHeadRow');
    headRow.innerHTML = `
      <th scope="col">Variable macroeconómica</th>
      <th scope="col">Inicial (E₀)</th>
      <th scope="col">Impacto (E₁)</th>
      <th scope="col">Final (E₂)</th>
      <th scope="col">Δ (E₂ − E₀)</th>
      ${scenA ? '<th scope="col" class="col-scena">Escenario A (E₂)</th><th scope="col" class="col-scena">Dif. (B − A)</th>' : ''}
    `;

    const rows = [
      ['Y', 'Producto agregado (Y, índice 100)', (r) => r.Y, 1, false],
      ['i', 'Tasa de interés doméstica (i, %)', (r) => r.i, 2, false],
      ...(open ? [['e', 'Tipo de cambio nominal/real (e, ↑ deprec.)', (r) => r.e, 1, false]] : []),
      [
        'M',
        state.regime === 'fixed' ? 'Oferta monetaria (M/P · ajuste por reservas)' : 'Oferta monetaria real (M/P)',
        (r) => r.M,
        1,
        false
      ],
      ['C', 'Consumo privado (C)', (r) => r.C, 1, false],
      ['I', 'Inversión privada (I)', (r) => r.I, 1, false],
      ['G', 'Gasto público (G)', (r) => r.G, 1, false],
      ...(open
        ? [
            ['NX', 'Exportaciones netas (NX)', (r) => r.NX, 1, false],
            ['KF', 'Flujos netos de capital (KF)', (r) => r.KF, 1, true],
            ['BP', 'Saldo de balanza de pagos (BP)', (r) => r.BP, 1, true]
          ]
        : [])
    ];

    document.getElementById('resultsTableBody').innerHTML = rows
      .map(([key, label, getter, dec, isSpecial]) => {
        const v0 = getter(E0);
        const v1 = getter(E1);
        const v2 = getter(E2);
        const fmtCell = (v) => (isSpecial ? fmtKF(v, dec) : fmtNum(v, dec));
        const delta = Number.isFinite(v0) && Number.isFinite(v2) ? v2 - v0 : null;
        const deltaCls =
          delta === null || Math.abs(delta) < 0.005 ? '' : delta > 0 ? 'val-pos' : 'val-neg';

        let scenACells = '';
        if (scenA) {
          const vA = getter(scenA.E2);
          const diffBA = Number.isFinite(v2) && Number.isFinite(vA) ? v2 - vA : null;
          scenACells = `
            <td class="col-scena">${fmtCell(vA)}</td>
            <td class="col-scena">${diffBA === null ? '—' : fmtSigned(diffBA, dec)}</td>
          `;
        }

        return `
          <tr data-var="${key}">
            <td>${label}</td>
            <td>${fmtCell(v0)}</td>
            <td>${fmtCell(v1)}</td>
            <td><strong>${fmtCell(v2)}</strong></td>
            <td class="${deltaCls}">${delta === null ? '—' : fmtSigned(delta, dec)}</td>
            ${scenACells}
          </tr>
        `;
      })
      .join('');

    // 3. Multiplicadores efectivos
    const mult = state.model.multipliers();
    const multItems = [
      {
        title: 'Multiplicador fiscal (ΔY / ΔG)',
        val: mult.fiscal,
        valA: scenA?.multipliers?.fiscal,
        sub: 'Cambio final en Y ante +1 unidad de gasto G'
      },
      {
        title: 'Eficacia monetaria',
        val: mult.monetary,
        valA: scenA?.multipliers?.monetary,
        sub:
          state.regime === 'fixed'
            ? 'Nula por endogeneidad de M/P (trilema)'
            : state.instrument === 'rate'
            ? 'ΔY ante recorte de −1 pp en i_pol'
            : 'ΔY ante expansión de +1% en M/P'
      },
      {
        title: 'Eficacia cambiaria (ΔY / Δē)',
        val: mult.devaluation,
        valA: scenA?.multipliers?.devaluation,
        sub: state.regime === 'fixed' ? 'ΔY ante +1 punto de devaluación en ē' : 'No aplica (e flota en el mercado)'
      },
      {
        title: 'Sensibilidad a tasa externa (ΔY / Δi*)',
        val: mult.foreignRate,
        valA: scenA?.multipliers?.foreignRate,
        sub: open ? 'ΔY ante +1 pp en la tasa internacional i*' : 'No aplica en economía cerrada'
      }
    ];

    document.getElementById('multipliersGrid').innerHTML = multItems
      .map((item) => {
        const mainStr = item.val === null ? 'No aplica' : fmtSigned(item.val, 2);
        const aHint =
          scenA && item.valA !== null && item.valA !== undefined
            ? ` · Esc. A: ${fmtSigned(item.valA, 2)}`
            : '';
        return `
          <div class="mult-card">
            <span class="mult-title">${item.title}</span>
            <strong class="mult-value">${mainStr}</strong>
            <span class="mult-sub">${item.sub}${aHint}</span>
          </div>
        `;
      })
      .join('');
  }

  function buildTransmissionSteps(E0, E1, E2) {
    const m = state.model;
    const u = state.u;
    const u0 = m.baseline;
    const open = m.open;
    const steps = [];

    const changed = INPUT_DEFS.filter(
      (d) => !d.isParam && !getDisabledReason(d) && Math.abs(u[d.key] - u0[d.key]) > 1e-6
    );
    const paramChanged = INPUT_DEFS.filter(
      (d) => d.isParam && !getDisabledReason(d) && Math.abs(state.params[d.key] - ISLM.DEFAULT_PARAMS[d.key]) > 1e-6
    );

    if (!changed.length && !paramChanged.length) {
      steps.push(
        `<strong>Equilibrio base (E₀):</strong> La economía se encuentra en reposo en <code>Y = 100</code>, <code>i = ${fmtNum(E0.i, 2)}%</code>${open ? `, <code>e = 100</code>` : ''}. Elige un escenario de referencia o desplaza un control para observar la cadena de transmisión.`
      );
      return steps;
    }

    // Paso 1: Perturbación inicial
    const shockDesc = [
      ...changed.map(
        (d) => `${d.short}: ${d.fmt(u0[d.key])} → <strong>${d.fmt(u[d.key])}</strong>`
      ),
      ...paramChanged.map(
        (d) => `parámetro ${d.short}: ${d.fmt(ISLM.DEFAULT_PARAMS[d.key])} → <strong>${d.fmt(state.params[d.key])}</strong>`
      )
    ].join('; ');
    steps.push(`<strong>1. Impulso inicial:</strong> Se aplica ${shockDesc}.`);

    // Paso 2: Equilibrio de impacto (E1)
    if (open) {
      const parity = u.istar + u.rho;
      let impactTxt = `<strong>2. Impacto interno (E₁, antes del ajuste externo):</strong> El mercado doméstico se mueve hacia <code>Y₁ = ${fmtNum(E1.Y)}</code> e <code>i₁ = ${fmtNum(E1.i, 2)}%</code>.`;
      if (m.kappa > 0 && Math.abs(E1.i - parity) > 0.01) {
        impactTxt += ` La tasa doméstica se sitúa ${E1.i > parity ? 'por encima' : 'por debajo'} de la paridad internacional <code>i* + ρ = ${fmtNum(parity, 2)}%</code>, generando ${E1.i > parity ? 'entrada neta de capitales' : 'salida de capitales'}.`;
      }
      if (Math.abs(E1.BP) > 0.01) {
        impactTxt +=
          E1.BP > 0
            ? ' Se abre un <strong>superávit de balanza de pagos</strong> (exceso de oferta de divisas).'
            : ' Se abre un <strong>déficit de balanza de pagos</strong> (exceso de demanda de divisas).';
      }
      steps.push(impactTxt);

      // Paso 3: Mecanismo de ajuste externo (E1 -> E2)
      if (state.regime === 'flex' && Math.abs(E2.e - E1.e) > 0.05) {
        const deprec = E2.e > E1.e;
        steps.push(
          `<strong>3. Ajuste cambiario en flotación (E₁ → E₂):</strong> El tipo de cambio pasa de <code>${fmtNum(E1.e)}</code> a <code>${fmtNum(E2.e)}</code> (${deprec ? 'depreciación' : 'apreciación'} de la moneda local). Esto varía las exportaciones netas en <code>${fmtSigned(E2.NX - E1.NX)}</code> y desplaza la curva IS hacia la ${deprec ? 'derecha' : 'izquierda'} hasta restablecer el equilibrio externo.`
        );
      } else if (state.regime === 'fixed' && Math.abs(E2.M - E1.M) > 0.05) {
        const expM = E2.M > E1.M;
        steps.push(
          `<strong>3. Intervención por reservas en tipo fijo (E₁ → E₂):</strong> Para defender <code>ē = ${fmtNum(u.ebar, 0)}</code>, el banco central ${expM ? 'compra divisas (acumula reservas) y expande' : 'vende divisas (pierde reservas) y contrae'} la oferta monetaria <code>M/P</code> de <code>${fmtNum(E1.M)}</code> a <code>${fmtNum(E2.M)}</code>, desplazando la curva LM hasta <code>E₂</code>.`
        );
      }
    }

    // Paso 4: Equilibrio final y composición de la demanda
    const dY = E2.Y - E0.Y;
    const comp = [
      ['Consumo ΔC', E2.C - E0.C],
      ['Inversión ΔI', E2.I - E0.I],
      ['Gasto ΔG', E2.G - E0.G],
      ...(open ? [['Exportaciones netas ΔNX', E2.NX - E0.NX]] : [])
    ]
      .filter(([, v]) => Math.abs(v) > 0.01)
      .map(([k, v]) => `${k} = <code>${fmtSigned(v)}</code>`)
      .join(', ');

    steps.push(
      `<strong>${open ? '4' : '2'}. Equilibrio final (E₂) y composición:</strong> El producto cierra en <code>Y₂ = ${fmtNum(E2.Y)}</code> (<code>${fmtSigned(dY)}</code>) con <code>i₂ = ${fmtNum(E2.i, 2)}%</code>${open ? ` y <code>e₂ = ${fmtNum(E2.e)}</code>` : ''}. Desglose de demanda: ${comp || 'sin cambios netos'}.`
    );

    return steps;
  }

  function renderPedagogicalClassification() {
    const open = state.regime !== 'closed';
    const classes = [
      {
        title: 'Instrumentos de política',
        badge: 'Controlables',
        cls: 'control',
        items: [
          'Gasto público (G) e impuestos autónomos (T₀)',
          ...(state.regime !== 'fixed'
            ? [state.instrument === 'rate' ? 'Tasa de interés de política (i_pol)' : 'Oferta monetaria real (M/P)']
            : ['Paridad cambiaria oficial (ē)']),
          'Elección del régimen cambiario'
        ]
      },
      {
        title: 'Variables endógenas',
        badge: 'Resueltas por el modelo',
        cls: 'control',
        items: [
          'Producto (Y), consumo (C) e inversión (I)',
          state.instrument === 'rate' && state.regime !== 'fixed'
            ? 'Oferta monetaria (M/P) acomodada a la demanda'
            : 'Tasa de interés doméstica (i)',
          ...(state.regime === 'flex' ? ['Tipo de cambio nominal y real (e)'] : []),
          ...(state.regime === 'fixed' ? ['Oferta monetaria (M/P) y reservas internacionales'] : []),
          ...(open ? ['Exportaciones netas (NX) y flujos de capital (KF)'] : [])
        ]
      },
      {
        title: 'Variables exógenas / shocks',
        badge: 'Dadas para el país',
        cls: 'external',
        items: [
          ...(open
            ? ['Tasa internacional (i*) y prima de riesgo (ρ)', 'Ingreso mundial (Y*) y precios de exportación (ΔNX)']
            : []),
          'Confianza privada autónoma y nivel de precios fijo (P = 1)'
        ]
      },
      {
        title: 'Parámetros estructurales',
        badge: 'Pendientes',
        cls: 'structural',
        items: [
          `Propensión a consumir (c = ${fmtNum(state.params.c, 2)}) y tasa impositiva (t = ${fmtNum(state.params.t, 2)})`,
          `Sensibilidades de inversión (b = ${fmtNum(state.params.b, 1)}) y liquidez (h = ${fmtNum(state.params.h, 1)})`,
          ...(open
            ? [`Apertura importadora (m = ${fmtNum(state.params.m, 2)}), elasticidad NX (n = ${fmtNum(state.params.n, 2)})`]
            : [])
        ]
      }
    ];

    document.getElementById('varClassesGrid').innerHTML = classes
      .map(
        (c) => `
        <div class="var-class-card">
          <h4><span>${c.title}</span><span class="role-badge ${c.cls}">${c.badge}</span></h4>
          <ul>${c.items.map((item) => `<li>${item}</li>`).join('')}</ul>
        </div>
      `
      )
      .join('');

    document.querySelectorAll('#policyMatrixTable [data-col-regime]').forEach((cell) => {
      cell.classList.toggle('is-current-regime', cell.dataset.colRegime === state.regime);
    });
  }

  // Construye el contenido rico del cajón "¿Por qué?" según la pestaña activa
  function renderWhyDrawerContent() {
    const body = document.getElementById('whyDrawerBody');
    if (!body || !state.anim.currentSnap) return;
    const snap = buildTargetSnapshot();
    if (!snap) return;
    const { open, regime, instrument, E0, E1, E2, reasons } = snap;
    const tab = state.whyActiveTab;

    const cards = [];

    if (tab === 'all' || tab === 'islm') {
      cards.push(`
        <div class="why-card">
          <h3>1 · Plano IS–LM–BP: ¿Por qué se desplazan las curvas en (Y, i)?</h3>
          <p>En el plano principal <code>(Y, i)</code> convergen tres condiciones de equilibrio: bienes (<strong>IS</strong>), dinero (<strong>LM</strong>) y balanza de pagos (<strong>BP</strong>).</p>
          <p><strong>En el escenario actual:</strong> la curva IS ${sameLine(snap.initialLines.IS, snap.finalLines.IS) ? 'permanece en su posición inicial' : `se desplaza debido a <strong>${reasons.IS}</strong>`}. La curva LM ${sameLine(snap.initialLines.LM, snap.finalLines.LM) ? 'permanece fija' : `se mueve por <strong>${reasons.LM}</strong>`}.</p>
          <p>El punto hueco <strong>E₁</strong> (<code>Y = ${fmtNum(E1.Y)}, i = ${fmtNum(E1.i, 2)}%</code>) muestra el equilibrio doméstico instantáneo antes de que actúe el sector externo; el punto sólido <strong>E₂</strong> (<code>Y = ${fmtNum(E2.Y)}, i = ${fmtNum(E2.i, 2)}%</code>) incorpora la retroalimentación cambiaria o monetaria.</p>
          <code class="why-formula">IS: s·Y + b·i = K(u) + n·e   |   LM: k·Y − h·i = M/P   |   BP: −m·Y + κ·(i − i* − ρ) + n·e = −(NX₀ + KF₀)</code>
        </div>
      `);
    }

    if (tab === 'all' || tab === 'mf') {
      cards.push(`
        <div class="why-card">
          <h3>2 · Plano Mundell–Fleming (IS*–LM*): Tipo de cambio e vs. Producto Y</h3>
          <p>${
            open
              ? `Proyecta el equilibrio en el espacio <code>(Y, e)</code>, donde un aumento de <code>e</code> significa <strong>depreciación nominal y real</strong> de la moneda doméstica (más unidades de moneda local por dólar), lo que eleva las exportaciones netas <code>NX</code>.`
              : 'En una economía cerrada no existe sector externo ni tipo de cambio; cambia el régimen a «Abierta» para activar este diagrama.'
          }</p>
          ${
            open
              ? `<p><strong>En el escenario actual:</strong> el tipo de cambio pasa de <code>e₀ = 100</code> a <code>e₂ = ${fmtNum(E2.e)}</code> (${Math.abs(E2.e - 100) < 0.05 ? 'sin variación' : E2.e > 100 ? 'depreciación que impulsa NX' : 'apreciación que resta NX'}).</p>`
              : ''
          }
          <code class="why-formula">IS*(Y, e): s·Y − n·e = K(u) − b·i   |   ↑e ⇒ Depreciación ⇒ ↑NX</code>
        </div>
      `);
    }

    if (tab === 'all' || tab === 'money') {
      cards.push(`
        <div class="why-card">
          <h3>3 · Mercado Monetario: Liquidez real L(Y, i) y oferta M/P</h3>
          <p>Cuando el ingreso <code>Y</code> aumenta, los agentes demandan más saldos reales para transacciones, desplazando la curva de demanda de dinero <code>L(Y)</code> hacia la derecha (<strong>${reasons.L}</strong>).</p>
          <p>${
            regime === 'fixed'
              ? `Bajo <strong>tipo de cambio fijo</strong>, la oferta <code>Mˢ/P</code> es endógena: pasa de <code>${fmtNum(E0.M)}</code> a <code>${fmtNum(E2.M)}</code> por la intervención cambiaria del banco central.`
              : instrument === 'rate'
              ? `Bajo <strong>regla de tasa</strong>, el banco central fija <code>i = ${fmtNum(snap.u.ipol, 2)}%</code> y suministra endógenamente <code>M/P = ${fmtNum(E2.M)}</code>.`
              : `Bajo control de agregados, la oferta real se ubica en <code>M/P = ${fmtNum(E2.M)}</code> y la tasa se ajusta a <code>i₂ = ${fmtNum(E2.i, 2)}%</code>.`
          }</p>
          <code class="why-formula">M/P = k·Y − h·i   (k = ${state.model.constants.K_MONEY}, h = ${fmtNum(state.params.h, 1)})</code>
        </div>
      `);
    }

    if (tab === 'all' || tab === 'cross') {
      cards.push(`
        <div class="why-card">
          <h3>4 · Cruz Keynesiana: Demanda Agregada DA vs. Producción Y</h3>
          <p>El equilibrio en el mercado de bienes ocurre sobre la recta de <code>45° (DA = Y)</code>. La pendiente de la recta <code>DA</code> es <code>c(1 − t) − m</code>, cuya inversa determina el multiplicador keynesiano.</p>
          <p><strong>En el escenario actual:</strong> la ordenada de la demanda agregada incorpora tanto el impulso autónomo directo como los efectos inducidos de la tasa de interés (<code>ΔI = ${fmtSigned(E2.I - E0.I)}</code>) y del tipo de cambio (<code>${open ? `ΔNX = ${fmtSigned(E2.NX - E0.NX)}` : 'economía cerrada'}</code>).</p>
          <code class="why-formula">DA(Y) = C(Y − T) + I(i₂) + G + NX(Y, e₂, Y*) = Y</code>
        </div>
      `);
    }

    body.innerHTML = cards.join('');
  }

  function openWhyDrawer(tab = 'all') {
    state.whyActiveTab = tab;
    document.querySelectorAll('.why-tab').forEach((btn) => {
      const active = btn.dataset.whyTab === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    renderWhyDrawerContent();
    document.getElementById('whyBackdrop').hidden = false;
    const drawer = document.getElementById('whyDrawer');
    drawer.hidden = false;
    document.getElementById('btnWhyGlobal').setAttribute('aria-expanded', 'true');
    document.getElementById('btnCloseWhy').focus();
  }

  function closeWhyDrawer() {
    document.getElementById('whyBackdrop').hidden = true;
    document.getElementById('whyDrawer').hidden = true;
    document.getElementById('btnWhyGlobal').setAttribute('aria-expanded', 'false');
  }

  // Toast informativo
  let toastTimeout = 0;
  function showToast(msg) {
    const el = document.getElementById('labToast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      el.hidden = true;
    }, 3200);
  }

  // Refresco integral de la interfaz
  function refreshLaboratory(fromBaseline = false) {
    syncSidebarUI();
    const m = state.model;
    const u = state.u;
    const E0 = m.solve(m.baseline, 'final');
    const E1 = m.solve(u, 'impact');
    const E2 = m.solve(u, 'final');

    if (!E0 || !E1 || !E2) return;

    renderResultsAndMultipliers(E0, E1, E2);
    document.getElementById('transmissionSteps').innerHTML = buildTransmissionSteps(E0, E1, E2)
      .map((s) => `<li>${s}</li>`)
      .join('');
    renderPedagogicalClassification();
    if (!document.getElementById('whyDrawer').hidden) {
      renderWhyDrawerContent();
    }
    animateToCurrentModel(fromBaseline);
  }

  // ============================================================================
  // 5. EVENTOS DE BARRA SUPERIOR, COMPARACIÓN A/B, TEMA Y NAVEGACIÓN MÓVIL
  // ============================================================================
  function setupEventListeners() {
    // Selectores de Sección A
    document.getElementById('cfgCountry').addEventListener('change', (e) => {
      state.country = e.target.value;
      refreshLaboratory(false);
    });
    document.getElementById('cfgRegime').addEventListener('change', (e) => {
      state.regime = e.target.value;
      rebuildModel(true);
      refreshLaboratory(false);
    });
    document.getElementById('cfgMobility').addEventListener('change', (e) => {
      state.mobility = e.target.value;
      rebuildModel(true);
      refreshLaboratory(false);
    });
    document.getElementById('cfgInstrument').addEventListener('change', (e) => {
      state.instrument = e.target.value;
      rebuildModel(true);
      refreshLaboratory(false);
    });

    // Botón Restaurar
    document.getElementById('btnResetAll').addEventListener('click', () => {
      state.params = { ...ISLM.DEFAULT_PARAMS };
      state.activePreset = null;
      rebuildModel(false);
      refreshLaboratory(false);
      showToast('Parámetros restaurados al equilibrio inicial E₀ (Y = 100)');
    });

    // Botón Reproducir animación (E0 -> E2)
    document.getElementById('btnReplayAnim').addEventListener('click', () => {
      animateToCurrentModel(true);
    });

    // Comparar escenario A/B
    document.getElementById('btnCompareToggle').addEventListener('click', () => {
      const snap = buildTargetSnapshot();
      if (!snap) return;
      state.scenarioA = {
        ...snap,
        multipliers: state.model.multipliers()
      };
      document.getElementById('btnCompareToggle').setAttribute('aria-pressed', 'true');
      document.getElementById('compareBtnText').textContent = 'Actualizar Escenario A';
      document.getElementById('btnClearCompare').hidden = false;
      document.getElementById('chipLayerScenA').hidden = false;
      document.getElementById('compareStatusBadge').hidden = false;
      refreshLaboratory(false);
      showToast('Escenario A fijado. Modifica los controles para compararlo con el Escenario B actual.');
    });

    document.getElementById('btnClearCompare').addEventListener('click', () => {
      state.scenarioA = null;
      document.getElementById('btnCompareToggle').setAttribute('aria-pressed', 'false');
      document.getElementById('compareBtnText').textContent = 'Fijar Escenario A';
      document.getElementById('btnClearCompare').hidden = true;
      document.getElementById('chipLayerScenA').hidden = true;
      document.getElementById('compareStatusBadge').hidden = true;
      refreshLaboratory(false);
      showToast('Comparación A/B desactivada');
    });

    // Chips de capas visibles
    document.querySelectorAll('.layer-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.layer;
        state.layers[key] = !state.layers[key];
        chip.classList.toggle('is-active', state.layers[key]);
        chip.setAttribute('aria-pressed', String(state.layers[key]));
        if (state.anim.currentSnap) drawAllDiagrams(state.anim.currentSnap);
      });
    });

    // Botones "¿Por qué?"
    document.getElementById('btnWhyGlobal').addEventListener('click', () => openWhyDrawer('all'));
    document.getElementById('btnOpenWhyFromSteps').addEventListener('click', () => openWhyDrawer('all'));
    document.querySelectorAll('.btn-why-card').forEach((btn) => {
      btn.addEventListener('click', () => openWhyDrawer(btn.dataset.why));
    });
    document.getElementById('btnCloseWhy').addEventListener('click', closeWhyDrawer);
    document.getElementById('whyBackdrop').addEventListener('click', closeWhyDrawer);
    document.querySelectorAll('.why-tab').forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        state.whyActiveTab = tabBtn.dataset.whyTab;
        document.querySelectorAll('.why-tab').forEach((b) => {
          const active = b === tabBtn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', String(active));
        });
        renderWhyDrawerContent();
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !document.getElementById('whyDrawer').hidden) {
        closeWhyDrawer();
      }
    });

    // Tema claro / oscuro
    const syncThemeIcons = () => {
      const isLight = document.documentElement.dataset.theme === 'light';
      document.getElementById('themeIconSun').hidden = isLight;
      document.getElementById('themeIconMoon').hidden = !isLight;
    };
    syncThemeIcons();
    document.getElementById('btnThemeToggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('macroscope_lab_v2_theme', next);
      } catch (e) {}
      syncThemeIcons();
      if (state.anim.currentSnap) drawAllDiagrams(state.anim.currentSnap);
    });

    // Hoja de parámetros en tablet y móvil
    const sidebar = document.getElementById('labSidebar');
    const mobileTrigger = document.getElementById('btnMobileParams');
    const toggleMobileParams = (forceOpen) => {
      const open = typeof forceOpen === 'boolean' ? forceOpen : !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', open);
      mobileTrigger.setAttribute('aria-expanded', String(open));
    };
    mobileTrigger.addEventListener('click', () => toggleMobileParams());
    document.getElementById('btnCloseMobileParams').addEventListener('click', () => toggleMobileParams(false));

    // Carrusel / Pila de diagramas en móvil y tablet
    const setMobileSlide = (idx) => {
      state.mobileSlide = ((idx % 4) + 4) % 4;
      document.querySelectorAll('.diagram-card').forEach((card, i) => {
        card.classList.toggle('is-current-slide', i === state.mobileSlide);
      });
      document.querySelectorAll('.mob-diag-tab').forEach((tab, i) => {
        const active = i === state.mobileSlide;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      document.getElementById('mobileSlideCounter').textContent = `Diagrama ${state.mobileSlide + 1} de 4`;
      requestAnimationFrame(() => {
        if (state.anim.currentSnap) drawAllDiagrams(state.anim.currentSnap);
      });
    };

    document.querySelectorAll('.mob-diag-tab').forEach((tab) => {
      tab.addEventListener('click', () => setMobileSlide(Number(tab.dataset.diagIndex)));
    });
    document.getElementById('btnPrevSlide').addEventListener('click', () => setMobileSlide(state.mobileSlide - 1));
    document.getElementById('btnNextSlide').addEventListener('click', () => setMobileSlide(state.mobileSlide + 1));

    const layoutBtn = document.getElementById('btnMobileLayoutMode');
    const diagramsGrid = document.getElementById('diagramsGrid');
    const carouselNav = document.getElementById('mobileCarouselNav');
    layoutBtn.addEventListener('click', () => {
      state.mobileLayoutMode = state.mobileLayoutMode === 'carousel' ? 'stack' : 'carousel';
      diagramsGrid.dataset.mobileMode = state.mobileLayoutMode;
      carouselNav.hidden = state.mobileLayoutMode === 'stack';
      layoutBtn.textContent = state.mobileLayoutMode === 'carousel' ? 'Ver los 4 en pila' : 'Ver en carrusel (1 a 1)';
      requestAnimationFrame(() => {
        if (state.anim.currentSnap) drawAllDiagrams(state.anim.currentSnap);
      });
    });

    // Redibujado reactivo al cambiar tamaño del contenedor
    if (typeof ResizeObserver !== 'undefined') {
      let resizeRaf = 0;
      const ro = new ResizeObserver(() => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          if (state.anim.currentSnap) drawAllDiagrams(state.anim.currentSnap);
        });
      });
      document.querySelectorAll('.canvas-box').forEach((box) => ro.observe(box));
    }
  }

  // Inicialización del prototipo
  window.addEventListener('DOMContentLoaded', () => {
    rebuildModel(false);
    // Aplicamos por defecto el experimento didáctico "Expansión fiscal (+3 G)" para que al abrir la pestaña
    // se visualicen de inmediato las curvas discontinuas (E0), continuas (E2), el impacto hueco (E1) y las flechas causales.
    const defaultPreset = PRESETS.find((p) => p.id === 'fiscal');
    if (defaultPreset) {
      state.u = { ...state.model.baseline, ...defaultPreset.patch(state.model.baseline, state) };
      state.activePreset = 'fiscal';
    }
    buildControlsDOM();
    setupEventListeners();
    refreshLaboratory(true);
  });
})();
