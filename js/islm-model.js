/*
 * Modelo IS–LM–BP / Mundell–Fleming ampliado (corto plazo, precios fijos, P = 1).
 * Funciones puras sin acceso al DOM: las usa index.html y las prueba tests/islm-model.test.mjs.
 *
 * Bienes (IS):   Y = C + I + G + NX
 *                C = C0 + conf + c·(Y − T),   T = T0 + t·Y
 *                I = Ī − b·i
 *                NX = NX0 + nx + n·(e − 100) − m·(Y − 100) + f·(Y* − 100)
 * Dinero (LM):   M/P = k·Y − h·i              (o regla de tasa: i = i_pol)
 * Balanza (BP):  NX + KF = 0,  KF = KF0 + κ·(i − i* − ρ)
 *
 * Y es un índice (producto inicial = 100), i en %, e es un índice del tipo de cambio nominal = real
 * (precios fijos) con base 100; e sube = depreciación de la moneda local (unidades de moneda local por USD).
 * La calibración fija el equilibrio inicial en Y = 100, i = i0, e = 100, con exportaciones netas iguales
 * al saldo en cuenta corriente observado y flujos de capital autónomos que lo financian.
 */
(function () {
  'use strict';

  const Y0 = 100;
  const E0 = 100;
  const G0 = 18;   // gasto público inicial (% del producto inicial)
  const I0 = 20;   // inversión inicial (% del producto inicial)
  const K_MONEY = 0.5; // sensibilidad de la demanda de dinero al ingreso
  const F_WORLD = 0.15; // respuesta de las exportaciones netas al ingreso mundial

  const MOBILITY = {
    none: { kappa: 0, label: 'Nula' },
    low: { kappa: 0.5, label: 'Baja' },
    high: { kappa: 10, label: 'Alta' },
    perfect: { kappa: Infinity, label: 'Perfecta' }
  };

  const DEFAULT_PARAMS = { c: 0.75, t: 0.2, b: 1.5, h: 2, m: 0.2, n: 0.25 };

  /** Instrumentos disponibles según régimen y movilidad (trilema de Mundell). */
  function availableInstruments(regime, mobility) {
    if (regime === 'fixed') return [];                               // M es endógena
    if (regime === 'flex' && mobility === 'perfect') return ['money']; // i queda anclada en i* + ρ
    return ['money', 'rate'];
  }

  /** Normaliza la configuración: corrige combinaciones imposibles y devuelve los avisos. */
  function normalizeConfig(cfg) {
    const out = { ...cfg };
    const notes = [];
    const allowed = availableInstruments(out.regime, out.mobility);
    if (out.instrument === 'rate' && !allowed.includes('rate')) {
      out.instrument = 'money';
      notes.push(out.regime === 'fixed'
        ? 'Con tipo de cambio fijo el banco central no controla ni M ni i: ambas se ajustan para defender ē.'
        : 'Con movilidad perfecta y tipo de cambio flexible la tasa doméstica queda fijada en i* + ρ: el banco central solo puede mover M.');
    }
    return { config: out, notes };
  }

  /**
   * Construye el modelo calibrado.
   * @param {object} cfg { regime: 'closed'|'flex'|'fixed', mobility, instrument: 'money'|'rate', params, i0, cab }
   */
  function createModel(cfg) {
    const { config } = normalizeConfig(cfg);
    const p = { ...DEFAULT_PARAMS, ...(config.params || {}) };
    const open = config.regime !== 'closed';
    const mEff = open ? p.m : 0;
    const nEff = open ? p.n : 0;
    const fEff = open ? F_WORLD : 0;
    const kappa = MOBILITY[config.mobility]?.kappa ?? MOBILITY.high.kappa;
    const i0 = config.i0;
    const NX0 = open ? (Number.isFinite(config.cab) ? config.cab : 0) : 0;
    const KF0 = -NX0;
    const s = 1 - p.c * (1 - p.t) + mEff;           // inversa del multiplicador keynesiano abierto
    const Abar = (1 - p.c * (1 - p.t)) * Y0 + p.b * i0 - G0 - NX0; // C0 + Ī
    const Ibar = I0 + p.b * i0;
    const C0 = Abar - Ibar;
    const M0 = K_MONEY * Y0 - p.h * i0;
    const istar0 = Number.isFinite(config.istar0) ? config.istar0 : i0;

    const baseline = {
      G: G0, T0: 0, Mpct: 0, ipol: i0, ebar: E0,
      istar: istar0, rho: i0 - istar0, Ystar: 100, nxShock: 0, confShock: 0
    };

    // Término autónomo de la IS (todo lo que no depende de Y, i, e).
    const K = (u) => Abar + u.confShock - p.c * u.T0 + u.G + NX0 + u.nxShock
      - nEff * E0 + mEff * Y0 + fEff * (u.Ystar - 100);
    // Exportaciones netas "autónomas" de la BP (sin los términos en Y y e).
    const nxAuto = (u) => NX0 + u.nxShock - nEff * E0 + mEff * Y0 + fEff * (u.Ystar - 100);
    const money = (u) => M0 * (1 + u.Mpct / 100);

    const rows = {
      IS: (u) => [s, p.b, -nEff, 0, K(u)],
      LM: () => [K_MONEY, -p.h, 0, -1, 0],
      M: (u) => [0, 0, 0, 1, money(u)],
      rate: (u) => [0, 1, 0, 0, u.ipol],
      e: (value) => [0, 0, 1, 0, value],
      BP: (u) => kappa === Infinity
        ? [0, 1, 0, 0, u.istar + u.rho]
        : [-mEff, kappa, nEff, 0, -(nxAuto(u) + KF0) + kappa * (u.istar + u.rho)]
    };

    function components(u, Y, i, e, M) {
      const T = u.T0 + p.t * Y;
      const C = C0 + u.confShock + p.c * (Y - T);
      const I = Ibar - p.b * i;
      const NX = nxAuto(u) - mEff * Y + nEff * e;
      let KF = null;
      let BP = null;
      if (open) {
        if (kappa === Infinity) {
          const gap = i - u.istar - u.rho;
          KF = Math.abs(gap) < 1e-9 ? -NX : Math.sign(gap) * Infinity;
          BP = Math.abs(gap) < 1e-9 ? 0 : KF;
        } else {
          KF = KF0 + kappa * (i - u.istar - u.rho);
          BP = NX + KF;
        }
      }
      return { Y, i, e, M, C, I, G: u.G, NX, KF, BP, T };
    }

    /**
     * Resuelve un equilibrio.
     * stage 'final'  → equilibrio completo (IS, LM y BP se cumplen).
     * stage 'impact' → antes del ajuste externo: e (flexible) o M (fijo) aún no se han movido.
     */
    function solve(u, stage = 'final') {
      const eqs = [rows.IS(u), rows.LM()];
      const monetary = config.instrument === 'rate' ? rows.rate(u) : rows.M(u);
      if (config.regime === 'closed') {
        eqs.push(monetary, rows.e(E0));
      } else if (config.regime === 'flex') {
        eqs.push(monetary, stage === 'impact' ? rows.e(E0) : rows.BP(u));
      } else {
        // Tipo de cambio fijo: la devaluación (ē) actúa ya en el impacto; M se ajusta vía reservas después.
        eqs.push(rows.e(u.ebar), stage === 'impact' ? [0, 0, 0, 1, M0] : rows.BP(u));
      }
      const x = solveLinear(eqs);
      if (!x) return null;
      return components(u, x[0], x[1], x[2], x[3]);
    }

    // --- Curvas como rectas a·x + b·y = c, para dibujarlas -------------------------------------
    const curves = {
      /** IS en (Y, i) dado e. */
      IS: (u, e) => ({ a: s, b: p.b, c: K(u) + nEff * e }),
      /** LM en (Y, i): vertical en M dado, u horizontal con regla de tasa. */
      LM: (u, M) => config.instrument === 'rate' && config.regime !== 'fixed'
        ? { a: 0, b: 1, c: u.ipol }
        : { a: K_MONEY, b: -p.h, c: M },
      /** BP en (Y, i) dado e. */
      BP: (u, e) => kappa === Infinity
        ? { a: 0, b: 1, c: u.istar + u.rho }
        : { a: -mEff, b: kappa, c: -(nxAuto(u) + KF0) + kappa * (u.istar + u.rho) - nEff * e },
      /** IS* en (Y, e) dado i. */
      ISstar: (u, i) => ({ a: s, b: -nEff, c: K(u) - p.b * i }),
      /** LM* en (Y, e): combina LM y BP (vertical con movilidad perfecta). */
      LMstar: (u, M) => {
        if (kappa === Infinity) return { a: K_MONEY, b: 0, c: M + p.h * (u.istar + u.rho) };
        const bpC = -(nxAuto(u) + KF0) + kappa * (u.istar + u.rho);
        if (config.instrument === 'rate') return { a: -mEff, b: nEff, c: bpC - kappa * u.ipol };
        return { a: -mEff + kappa * K_MONEY / p.h, b: nEff, c: bpC + kappa * M / p.h };
      },
      /** Demanda de dinero en (M/P, i) dado Y. */
      moneyDemand: (Y) => ({ a: 1, b: p.h, c: K_MONEY * Y }),
      /** Demanda agregada en (Y, DA) dados i y e. */
      aggregateDemand: (u, i, e) => ({ a: -(p.c * (1 - p.t) - mEff), b: 1, c: K(u) + nEff * e - p.b * i })
    };

    /** Multiplicadores efectivos del régimen actual (ΔY final ante un cambio unitario). */
    function multipliers() {
      const base = solve(baseline);
      const dY = (patch) => {
        const r = solve({ ...baseline, ...patch });
        return r && base ? r.Y - base.Y : null;
      };
      return {
        fiscal: dY({ G: baseline.G + 1 }),
        monetary: config.regime === 'fixed' ? null
          : config.instrument === 'rate' ? dY({ ipol: baseline.ipol - 1 }) : dY({ Mpct: 1 }),
        devaluation: config.regime === 'fixed' ? dY({ ebar: baseline.ebar + 1 }) : null,
        foreignRate: config.regime === 'closed' ? null : dY({ istar: baseline.istar + 1 })
      };
    }

    return {
      config, params: p, open, kappa, i0, M0, NX0, baseline, money,
      solve, curves, multipliers,
      constants: { Y0, E0, G0, I0, K_MONEY, F_WORLD }
    };
  }

  /** Eliminación gaussiana con pivoteo parcial; filas [a1..an | b]. Devuelve null si es singular. */
  function solveLinear(rows) {
    const n = rows.length;
    const A = rows.map((r) => r.slice());
    for (let col = 0; col < n; col++) {
      let pivot = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[pivot][col])) pivot = r;
      if (Math.abs(A[pivot][col]) < 1e-12) return null;
      [A[col], A[pivot]] = [A[pivot], A[col]];
      for (let r = 0; r < n; r++) {
        if (r === col) continue;
        const factor = A[r][col] / A[col][col];
        for (let k = col; k <= n; k++) A[r][k] -= factor * A[col][k];
      }
    }
    return A.map((r, i) => r[n] / r[i]);
  }

  globalThis.ISLM = { createModel, normalizeConfig, availableInstruments, solveLinear, MOBILITY, DEFAULT_PARAMS };
})();
