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
