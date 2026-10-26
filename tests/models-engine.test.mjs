import test from 'node:test';
import assert from 'node:assert/strict';

await import('../js/config/countries.js');
await import('../js/config/indicators.js');
await import('../js/data/fallback-wdi.js');
await import('../js/config/state.js');
await import('../js/services/models-engine.js');

const M = globalThis.MacroScope;

test('createAsAdModel solves short-run and medium-run equilibria consistently', () => {
  const model = M.createAsAdModel();
  const E0 = model.solve({}, 'short');
  assert.equal(E0.Y, 100);
  assert.equal(E0.P, 100);
  assert.equal(E0.outputGap, 0);

  // Expansión fiscal (dG > 0): en el corto plazo sube Y y sube P; en el medio plazo Y vuelve a Yn y P sube más.
  const E1 = model.solve({ dG: 3 }, 'short');
  const E2 = model.solve({ dG: 3 }, 'medium');
  assert.ok(E1.Y > 100, `Y1 (${E1.Y}) debe superar 100 ante expansión de demanda`);
  assert.ok(E1.P > 100, `P1 (${E1.P}) debe superar 100 en corto plazo`);
  assert.equal(E2.Y, 100, 'en medio plazo el producto converge al potencial Yn = 100');
  assert.ok(E2.P > E1.P, `P2 (${E2.P}) > P1 (${E1.P}) tras ajuste de expectativas`);

  // Shock adverso de costos (dz > 0): estanflación de corto plazo (cae Y, sube P).
  const stag = model.solve({ dz: 2.5 }, 'short');
  assert.ok(stag.Y < 100, `Y (${stag.Y}) cae ante shock de oferta adverso`);
  assert.ok(stag.P > 100, `P (${stag.P}) sube ante shock de oferta adverso`);

  const curveSet = model.curves({ dG: 2, dz: 1 });
  assert.equal(curveSet.ad0.length, 2);
  assert.equal(curveSet.as1.length, 2);
  assert.ok(model.explain({ dG: 2, dz: 1 }).length >= 3);
});

test('createSupplyDemandModel computes market equilibrium, surpluses, tax revenue, and deadweight loss', () => {
  const sd = M.createSupplyDemandModel();
  const base = sd.solve({});
  assert.equal(base.Q, 100);
  assert.equal(base.Pd, 100);
  assert.equal(base.Ps, 100);
  assert.equal(base.consumerSurplus, 5000);
  assert.equal(base.producerSurplus, 5000);
  assert.equal(base.taxRevenue, 0);
  assert.equal(base.deadweightLoss, 0);

  // Aumento de demanda (dD > 0) eleva cantidad y precio de equilibrio.
  const higherD = sd.solve({ dD: 20 });
  assert.equal(higherD.Q, 110);
  assert.equal(higherD.Pd, 110);

  // Impuesto específico (tau = 20) reduce Q, crea brecha Pd - Ps = tau y pérdida de eficiencia > 0.
  const taxed = sd.solve({ tau: 20 });
  assert.equal(taxed.Q, 90);
  assert.equal(taxed.Pd, 110);
  assert.equal(taxed.Ps, 90);
  assert.equal(taxed.taxRevenue, 1800);
  assert.equal(taxed.deadweightLoss, 100);
});

test('buildHistoricalAnalysis preserves nulls without interpolation and computes subperiod comparisons', () => {
  const sampleSeries = [
    { date: '2018', value: 100, source: 'fallback' },
    { date: '2019', value: 110, source: 'fallback' },
    { date: '2020', value: null, source: 'missing' },
    { date: '2021', value: 121, source: 'live' },
    { date: '2022', value: 133.1, source: 'live' }
  ];

  const res = M.buildHistoricalAnalysis({
    series: sampleSeries,
    startPeriod: '2018',
    endPeriod: '2022',
    splitPeriod: '2019',
    mode: 'base100',
    isRate: false
  });

  assert.equal(res.rows.length, 5);
  // El año 2020 con null debe conservarse exactamente como null (nunca 0 ni interpolado).
  const row2020 = res.rows.find(r => r.date === '2020');
  assert.equal(row2020.value, null);
  assert.equal(row2020.base100, null);
  assert.equal(row2020.ma3, null);

  // En 2021 la variación interanual debe ser null porque 2020 es null.
  const row2021 = res.rows.find(r => r.date === '2021');
  assert.equal(row2021.pctChange, null);
  assert.ok(Math.abs(row2021.base100 - 121) < 1e-6);

  assert.equal(res.summary.count, 4);
  assert.equal(res.summary.missingCount, 1);
  assert.equal(res.summary.subperiods.meanA, 105);
  assert.ok(Math.abs(res.summary.subperiods.meanB - 127.05) < 1e-6);
});

test('INDICATORS_CATALOG separates verified official series from explicitly flagged demo cards', () => {
  assert.ok(Array.isArray(M.INDICATORS_CATALOG));
  assert.ok(M.INDICATORS_CATALOG.length >= 16);

  const official = M.INDICATORS_CATALOG.filter(i => !i.isDemo);
  const demos = M.INDICATORS_CATALOG.filter(i => i.isDemo);
  assert.ok(official.length >= 14);
  assert.ok(demos.length >= 2);

  for (const item of official) {
    assert.ok(['WDI', 'BCRP'].includes(item.providerKey), `Official item ${item.id} must come from WDI or BCRP`);
    const resolved = M.resolveIndicatorSeries(item, 'PER');
    assert.equal(resolved.isDemo, false);
    assert.ok(resolved.series.some(p => Number.isFinite(p.value)), `Official series ${item.id} must resolve observations for PER`);
  }

  for (const item of demos) {
    assert.equal(item.providerKey, 'DEMO');
    assert.match(item.provider, /Demostrativo/i);
    const resolved = M.resolveIndicatorSeries(item, 'PER');
    assert.equal(resolved.isDemo, true);
    assert.match(resolved.provenance, /demostrativ/i);
  }
});

test('MODELS_LIBRARY defines all 5 models with explicit functional vs conceptual badges', () => {
  assert.equal(M.MODELS_LIBRARY.length, 5);
  const ids = M.MODELS_LIBRARY.map(m => m.id);
  assert.deepEqual(ids, ['islm', 'asad', 'micro-sd', 'phillips', 'solow']);

  const functional = M.MODELS_LIBRARY.filter(m => m.status === 'functional');
  const conceptual = M.MODELS_LIBRARY.filter(m => m.status === 'conceptual');
  assert.equal(functional.length, 3);
  assert.equal(conceptual.length, 2);
});
