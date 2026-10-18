// Comprueba que el modelo reproduce los resultados clásicos de IS–LM y Mundell–Fleming.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../js/islm-model.js';

const { createModel, availableInstruments, normalizeConfig } = globalThis.ISLM;
const base = { i0: 4, istar0: 3, cab: -2 };
const model = (regime, mobility = 'perfect', instrument = 'money', extra = {}) =>
  createModel({ regime, mobility, instrument, ...base, ...extra });
const shock = (m, patch, stage = 'final') => m.solve({ ...m.baseline, ...patch }, stage);
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('la calibración sitúa el equilibrio inicial en Y = 100, i = i0, e = 100 en todos los regímenes', () => {
  for (const regime of ['closed', 'flex', 'fixed']) {
    for (const mobility of ['none', 'low', 'high', 'perfect']) {
      const m = model(regime, mobility);
      const r = m.solve(m.baseline);
      close(r.Y, 100); close(r.i, 4); close(r.e, 100); close(r.M, m.M0);
      close(r.C + r.I + r.G + r.NX, r.Y);
      if (regime !== 'closed') { close(r.NX, -2); close(r.BP, 0); }
    }
  }
});

test('economía cerrada: expansión fiscal sube Y e i y desplaza inversión (crowding out)', () => {
  const m = model('closed');
  const r = shock(m, { G: m.baseline.G + 2 });
  assert.ok(r.Y > 100 && r.i > 4 && r.I < 20);
  const multiplier = (r.Y - 100) / 2;
  assert.ok(multiplier > 0 && multiplier < 1 / (1 - 0.75 * 0.8), 'menor que el multiplicador keynesiano simple');
});

test('Mundell–Fleming, flexible y movilidad perfecta: la política fiscal es ineficaz (aprecia la moneda)', () => {
  const m = model('flex', 'perfect');
  const r = shock(m, { G: m.baseline.G + 2 });
  close(r.Y, 100); close(r.i, 4);
  assert.ok(r.e < 100, 'apreciación');
  close(r.NX, -2 - 2); // el aumento de G desplaza 1 a 1 a las exportaciones netas
});

test('Mundell–Fleming, flexible y movilidad perfecta: la política monetaria es muy eficaz (deprecia)', () => {
  const m = model('flex', 'perfect');
  const r = shock(m, { Mpct: 10 });
  assert.ok(r.Y > 100 && r.e > 100); close(r.i, 4);
  // Con i anclada, todo el ajuste monetario va a Y: ΔY = ΔM / k.
  close(r.Y - 100, (m.M0 * 0.1) / 0.5);
});

test('Mundell–Fleming, fijo y movilidad perfecta: política fiscal muy eficaz, M endógena sube', () => {
  const m = model('fixed', 'perfect');
  const r = shock(m, { G: m.baseline.G + 2 });
  const closedY = shock(model('closed'), { G: 20 }).Y;
  assert.ok(r.Y > closedY, 'más eficaz que en economía cerrada');
  assert.ok(r.M > m.M0, 'el banco central compra divisas y expande M');
  close(r.e, 100); close(r.i, 4);
});

test('fijo: la oferta monetaria no es instrumento (el impacto se revierte)', () => {
  const m = model('fixed', 'perfect');
  const r = shock(m, { Mpct: 10 });
  close(r.Y, 100); close(r.M, m.M0);
  assert.deepEqual(availableInstruments('fixed', 'perfect'), []);
});

test('flexible: un alza de i* deprecia la moneda; fijo: contrae el producto', () => {
  const flex = shock(model('flex', 'perfect'), { istar: 4 });
  assert.ok(flex.e > 100 && flex.Y > 100);
  const fixed = shock(model('fixed', 'perfect'), { istar: 4 });
  assert.ok(fixed.Y < 100 && fixed.M < model('fixed').M0);
});

test('movilidad imperfecta: resultados intermedios y ordenados por grado de movilidad', () => {
  const fiscal = (mob) => shock(model('flex', mob), { G: 20 }).Y - 100;
  // Con flexible, más movilidad → más apreciación → menor multiplicador fiscal.
  assert.ok(fiscal('none') > fiscal('low') && fiscal('low') > fiscal('high') && fiscal('high') > fiscal('perfect') - 1e-9);
  // Con movilidad nula y flexible, el tipo de cambio equilibra la cuenta corriente.
  close(shock(model('flex', 'none'), { G: 20 }).NX, -2);
});

test('impacto vs. ajuste: con flexible el impacto deja un desequilibrio externo que corrige e', () => {
  const m = model('flex', 'high');
  const impact = shock(m, { G: 20 }, 'impact');
  close(impact.e, 100);
  assert.ok(impact.BP > 0, 'superávit: entran capitales por la mayor tasa');
  const final = shock(m, { G: 20 });
  close(final.BP, 0);
  assert.ok(final.e < 100);
});

test('regla de tasa: el banco central fija i y M se acomoda; trilema bloquea combinaciones imposibles', () => {
  const m = model('closed', 'perfect', 'rate');
  const r = shock(m, { ipol: 3 });
  close(r.i, 3); assert.ok(r.Y > 100 && r.M > m.M0);
  const n = normalizeConfig({ regime: 'flex', mobility: 'perfect', instrument: 'rate' });
  assert.equal(n.config.instrument, 'money'); assert.equal(n.notes.length, 1);
});

test('las curvas dibujadas pasan por el equilibrio que resuelve el modelo', () => {
  for (const [regime, mobility, instrument] of [['flex', 'high', 'money'], ['flex', 'low', 'rate'], ['fixed', 'low', 'money'], ['flex', 'perfect', 'money']]) {
    const m = model(regime, mobility, instrument);
    const u = { ...m.baseline, G: 21, istar: 3.5, Mpct: instrument === 'money' ? 5 : 0 };
    const r = m.solve(u);
    const on = (l, x, y) => close(l.a * x + l.b * y, l.c, 1e-6);
    on(m.curves.IS(u, r.e), r.Y, r.i);
    on(m.curves.LM(u, r.M), r.Y, r.i);
    on(m.curves.BP(u, r.e), r.Y, r.i);
    on(m.curves.ISstar(u, r.i), r.Y, r.e);
    on(m.curves.LMstar(u, r.M), r.Y, r.e);
    on(m.curves.moneyDemand(r.Y), r.M, r.i);
    on(m.curves.aggregateDemand(u, r.i, r.e), r.Y, r.Y);
  }
});

// ---------------------------------------------------------------------------------------------
// Auditoría económica: derivaciones de forma cerrada, tabla clásica de signos y descomposición CA.
// ---------------------------------------------------------------------------------------------
const { compareEquilibria, importPropensityFromShare } = globalThis.ISLM;

test('multiplicadores numéricos = multiplicadores de forma cerrada en los casos de libro', () => {
  const cases = [['closed', 'perfect', 'money'], ['closed', 'perfect', 'rate'], ['flex', 'perfect', 'money'],
    ['fixed', 'perfect', 'money'], ['fixed', 'none', 'money']];
  for (const [regime, mobility, instrument] of cases) {
    const m = model(regime, mobility, instrument);
    const a = m.analyticMultipliers();
    close(m.multipliers().fiscal, a.fiscal, 1e-9);
    if (a.monetaryPerUnitM !== undefined) {
      const dM = m.M0 * 0.01;
      close((shock(m, { Mpct: 1 }).Y - 100) / dM, a.monetaryPerUnitM, 1e-9);
    }
  }
  // 1/(1 − c(1 − t) + b·k/h) con los parámetros por defecto: 1/(0,4 + 0,375)
  close(model('closed').analyticMultipliers().fiscal, 1 / 0.775, 1e-12);
});

test('NX (bienes y servicios) y cuenta corriente se distinguen: NFI = CA − NX es autónoma', () => {
  // Magnitudes del orden de Perú 2025 (WDI): NX ≈ +8,1 % y CA ≈ +3,6 % del PBI.
  for (const mobility of ['none', 'low', 'high', 'perfect']) {
    const m = createModel({ regime: 'flex', mobility, instrument: 'money', i0: 4, istar0: 3, cab: 3.6, nx0: 8.1 });
    const r0 = m.solve(m.baseline);
    close(r0.Y, 100); close(r0.NX, 8.1); close(r0.CA, 3.6); close(r0.NFI, -4.5); close(r0.BP, 0);
    close(r0.C + r0.I + r0.G + r0.NX, r0.Y);           // la identidad del PBI usa NX, no CA
    assert.equal(m.provenance.nx, 'observed');
    const r = shock(m, { G: 21, istar: 3.5 });
    close(r.NFI, -4.5); close(r.CA, r.NX + r.NFI); close(r.BP, 0);
    close(r.C + r.I + r.G + r.NX, r.Y);
  }
  // Movilidad nula y flotación: e equilibra la cuenta corriente, NX vuelve a su valor inicial.
  const none = createModel({ regime: 'flex', mobility: 'none', instrument: 'money', i0: 4, istar0: 3, cab: 3.6, nx0: 8.1 });
  close(shock(none, { G: 21 }).NX, 8.1);
});

test('sin NX observado se usa CA como aproximación y queda etiquetado', () => {
  const m = model('flex', 'high');
  assert.equal(m.provenance.nx, 'approximation');
  assert.equal(m.NFI, 0); close(m.solve(m.baseline).NX, -2);
  assert.equal(model('closed').provenance.nx, 'not-applicable');
});

test('fijo: un intento de expansión monetaria baja i en el impacto y se revierte por pérdida de reservas', () => {
  for (const mobility of ['low', 'high']) {
    const m = model('fixed', mobility);
    const impact = shock(m, { Mpct: 10 }, 'impact');
    assert.ok(impact.i < 4 && impact.Y > 100, 'impacto expansivo');
    assert.ok(impact.BP < 0, 'déficit de balanza de pagos: salen capitales');
    const final = shock(m, { Mpct: 10 });
    close(final.Y, 100); close(final.M, m.M0); close(final.i, 4); close(final.e, 100);
  }
});

test('tabla clásica de signos (Mundell–Fleming, movilidad perfecta)', () => {
  const sign = (x) => (Math.abs(x) < 1e-9 ? 0 : Math.sign(x));
  const flex = model('flex', 'perfect');
  const fixed = model('fixed', 'perfect');
  const b = flex.baseline;
  // [shock, signo ΔY flexible, signo Δe flexible, signo ΔY fijo]
  const table = [
    [{ G: b.G + 2 }, 0, -1, 1],
    [{ T0: 2 }, 0, 1, -1],
    [{ istar: b.istar + 1 }, 1, 1, -1],
    [{ rho: b.rho + 1 }, 1, 1, -1],
    [{ Ystar: 105 }, 0, -1, 1],
    [{ nxShock: -2 }, 0, 1, -1],
    [{ confShock: -2 }, 0, 1, -1]
  ];
  for (const [patch, yFlex, eFlex, yFixed] of table) {
    const f = shock(flex, patch);
    const x = shock(fixed, patch);
    const label = JSON.stringify(patch);
    assert.equal(sign(f.Y - 100), yFlex, `ΔY flexible ${label}`);
    assert.equal(sign(f.e - 100), eFlex, `Δe flexible ${label}`);
    assert.equal(sign(x.Y - 100), yFixed, `ΔY fijo ${label}`);
    close(x.e, 100);
  }
  const deval = shock(fixed, { ebar: 110 });
  assert.ok(deval.Y > 100 && deval.M > fixed.M0 && deval.NX > -2);
});

test('economía cerrada: signos de IS–LM', () => {
  const m = model('closed');
  const g = shock(m, { G: 20 }); assert.ok(g.Y > 100 && g.i > 4);
  const mon = shock(m, { Mpct: 5 }); assert.ok(mon.Y > 100 && mon.i < 4);
  const tax = shock(m, { T0: 1 }); assert.ok(tax.Y < 100 && tax.i < 4);
  // Multiplicador de impuestos: −c veces el de gasto.
  close((tax.Y - 100), -0.75 * (g.Y - 100) / 2, 1e-9);
});

test('sensibilidad: h mayor → política monetaria menos eficaz y fiscal más eficaz (cerrada)', () => {
  const mult = (h) => {
    const m = createModel({ regime: 'closed', mobility: 'perfect', instrument: 'money', i0: 4, params: { h } });
    return { fiscal: m.multipliers().fiscal, monetary: (shock(m, { Mpct: 1 }).Y - 100) / (m.M0 * 0.01) };
  };
  const lo = mult(1), hi = mult(4);
  assert.ok(hi.fiscal > lo.fiscal && hi.monetary < lo.monetary);
});

test('el modelo es estable en todo el rango de los controles', () => {
  for (const c of [0.5, 0.9]) for (const t of [0.1, 0.4]) for (const mm of [0, 0.5]) for (const h of [0.5, 4]) for (const bb of [0.5, 4]) {
    for (const regime of ['closed', 'flex', 'fixed']) {
      const m = createModel({ regime, mobility: 'high', instrument: 'money', i0: 4, istar0: 3, cab: -2, nx0: 1, params: { c, t, m: mm, h, b: bb } });
      const r = shock(m, { G: 25, Mpct: regime === 'fixed' ? 0 : 10, istar: 5 });
      assert.ok(r && [r.Y, r.i, r.e, r.M].every(Number.isFinite), `${regime} c=${c} t=${t} m=${mm}`);
    }
  }
});

test('variaciones con la unidad correcta: i en pp, niveles en % ', () => {
  const m = model('closed');
  const d = compareEquilibria(m.solve(m.baseline), shock(m, { G: 20 }));
  assert.equal(d.i.unit, 'pp'); assert.equal(d.Y.unit, 'index');
  close(d.Y.pct, d.Y.abs);     // Y0 = 100 → Δ% = Δ absoluto
  assert.equal(d.CA, null);
});

test('propensión a importar: m = ε·IM/Y, supuesto ε = 1', () => {
  assert.equal(importPropensityFromShare(21.8456), 0.22);
  assert.equal(importPropensityFromShare(40.28, 1.5), 0.6);
  assert.equal(importPropensityFromShare(NaN), null);
});

test('las curvas siguen pasando por el equilibrio cuando NFI ≠ 0', () => {
  for (const [regime, mobility, instrument] of [['flex', 'high', 'money'], ['flex', 'low', 'rate'], ['fixed', 'low', 'money'], ['fixed', 'perfect', 'money']]) {
    const m = createModel({ regime, mobility, instrument, i0: 4, istar0: 3, cab: 3.6, nx0: 8.1 });
    const u = { ...m.baseline, G: 21, istar: 3.5, nxShock: -1 };
    const r = m.solve(u);
    const on = (l, x, y) => close(l.a * x + l.b * y, l.c, 1e-6);
    on(m.curves.IS(u, r.e), r.Y, r.i); on(m.curves.BP(u, r.e), r.Y, r.i);
    on(m.curves.ISstar(u, r.i), r.Y, r.e); on(m.curves.LMstar(u, r.M), r.Y, r.e);
  }
});
