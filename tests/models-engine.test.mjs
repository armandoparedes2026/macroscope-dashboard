import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

await import('../js/config/countries.js');
await import('../js/config/indicators.js');
await import('../js/data/fallback-wdi.js');
await import('../js/config/state.js');
await import('../js/services/models-engine.js');

const M = globalThis.MacroScope;
const bcrpFixture = JSON.parse(await readFile(new URL('./fixtures/bcrp-normalized.json', import.meta.url), 'utf8'));

function intersectSegmentPair(segA, segB) {
  const [p1, p2] = segA;
  const [p3, p4] = segB;
  const denom = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(denom) < 1e-12) return null;
  const x =
    ((p1.x * p2.y - p1.y * p2.x) * (p3.x - p4.x) - (p1.x - p2.x) * (p3.x * p4.y - p3.y * p4.x)) / denom;
  const y =
    ((p1.x * p2.y - p1.y * p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x * p4.y - p3.y * p4.x)) / denom;
  return { x, y };
}

test('createAsAdModel solves short-run and medium-run equilibria consistently and curves intersect at E0, E1, E2', () => {
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

  // Verificar que para múltiples choques las curvas intersectan exactamente en E0, E1 y E2
  for (const shock of [
    { dG: 0, dM: 0, dz: 0 },
    { dG: 3, dM: 1, dz: 0 },
    { dG: -2, dM: 0, dz: 2.5 },
    { dG: 2.5, dM: -1.5, dz: -1.5, dYn: 4 }
  ]) {
    const cs = model.curves(shock);
    const i0 = intersectSegmentPair(cs.ad0, cs.as0);
    const i1 = intersectSegmentPair(cs.ad1, cs.as1);
    const i2 = intersectSegmentPair(cs.ad1, cs.as2);
    const iLras = intersectSegmentPair(cs.ad1, cs.lras);
    assert.ok(Math.abs(i0.x - cs.E0.Y) < 1e-3 && Math.abs(i0.y - cs.E0.P) < 1e-3);
    assert.ok(Math.abs(i1.x - cs.E1.Y) < 1e-3 && Math.abs(i1.y - cs.E1.P) < 1e-3);
    assert.ok(Math.abs(i2.x - cs.E2.Y) < 1e-3 && Math.abs(i2.y - cs.E2.P) < 1e-3);
    assert.ok(Math.abs(iLras.x - cs.E2.Y) < 1e-3 && Math.abs(iLras.y - cs.E2.P) < 1e-3);
  }
});

test('createSupplyDemandModel computes equilibrium, surpluses, tax and curves intersect at E0 and E1', () => {
  const sd = M.createSupplyDemandModel();
  const base = sd.solve({});
  assert.equal(base.Q, 100);
  assert.equal(base.Pd, 100);
  assert.equal(base.Ps, 100);
  assert.equal(base.consumerSurplus, 5000);
  assert.equal(base.producerSurplus, 5000);
  assert.equal(base.taxRevenue, 0);
  assert.equal(base.deadweightLoss, 0);

  const higherD = sd.solve({ dD: 20 });
  assert.equal(higherD.Q, 110);
  assert.equal(higherD.Pd, 110);

  const taxed = sd.solve({ tau: 20 });
  assert.equal(taxed.Q, 90);
  assert.equal(taxed.Pd, 110);
  assert.equal(taxed.Ps, 90);
  assert.equal(taxed.taxRevenue, 1800);
  assert.equal(taxed.deadweightLoss, 100);

  for (const shock of [
    { dD: 0, dS: 0, tau: 0 },
    { dD: 25, dS: 0, tau: 0 },
    { dD: -15, dS: 10, tau: 15 },
    { dD: 30, dS: -20, tau: 25 }
  ]) {
    const cs = sd.curves(shock);
    const i0 = intersectSegmentPair(cs.d0, cs.s0);
    const i1 = intersectSegmentPair(cs.d1, cs.s1);
    assert.ok(Math.abs(i0.x - cs.E0.Q) < 1e-3 && Math.abs(i0.y - cs.E0.Pd) < 1e-3);
    assert.ok(Math.abs(i1.x - cs.E1.Q) < 1e-3 && Math.abs(i1.y - cs.E1.Pd) < 1e-3);
  }
});

test('buildHistoricalAnalysis preserves nulls, checks cadence for variations/moving averages, and never replaces missing ma3 with raw values', () => {
  const sampleSeries = [
    { date: '2018', value: 100, source: 'fallback' },
    { date: '2019', value: 110, source: 'fallback' },
    { date: '2020', value: null, source: 'missing' },
    { date: '2021', value: 121, source: 'live' },
    { date: '2022', value: 133.1, source: 'live' },
    // Salto de cadencia (falta 2023 en el arreglo): 2024 no es consecutivo con 2022
    { date: '2024', value: 146.41, source: 'live' }
  ];

  const res = M.buildHistoricalAnalysis({
    series: sampleSeries,
    startPeriod: '2018',
    endPeriod: '2024',
    splitPeriod: '2019',
    mode: 'trend',
    isRate: false,
    frequency: 'Anual'
  });

  assert.equal(res.rows.length, 6);
  // En mode='trend', displayValue es estrictamente ma3 (null en las dos primeras observaciones y alrededor de huecos)
  assert.equal(res.rows[0].ma3, null);
  assert.equal(res.rows[0].displayValue, null, 'no debe sustituir silenciosamente ma3 ausente por valor observado');
  assert.equal(res.rows[1].ma3, null);
  assert.equal(res.rows[1].displayValue, null);

  const row2020 = res.rows.find(r => r.date === '2020');
  assert.equal(row2020.value, null);
  assert.equal(row2020.base100, null);
  assert.equal(row2020.ma3, null);
  assert.equal(row2020.displayValue, null);

  // En 2021 la variación interanual y ma3 deben ser null porque 2020 es null
  const row2021 = res.rows.find(r => r.date === '2021');
  assert.equal(row2021.pctChange, null);
  assert.equal(row2021.ma3, null);
  assert.equal(row2021.displayValue, null);

  // En 2024 la variación y ma3 deben ser null porque falta 2023 (no son periodos consecutivos)
  const row2024 = res.rows.find(r => r.date === '2024');
  assert.equal(row2024.pctChange, null, 'no debe calcular variación entre años no consecutivos (2022 -> 2024)');
  assert.equal(row2024.ma3, null, 'no debe calcular media móvil con salto de año');
  assert.equal(row2024.displayValue, null);
});

test('BCRP_LOCAL_SNAPSHOT matches tests/fixtures/bcrp-normalized.json verbatim and preserves incomplete BCRP series', () => {
  const snapshotCodes = Object.keys(M.BCRP_LOCAL_SNAPSHOT).sort();
  const fixtureCodes = bcrpFixture.map(r => r.code).sort();
  assert.deepEqual(snapshotCodes, fixtureCodes, 'BCRP_LOCAL_SNAPSHOT solo contiene las 4 series verificadas del fixture');
  assert.equal('PN02507AQ' in M.BCRP_LOCAL_SNAPSHOT, false, 'PN02507AQ no tiene respaldo local inventado');

  for (const row of bcrpFixture) {
    const snap = M.BCRP_LOCAL_SNAPSHOT[row.code];
    assert.equal(snap.fetchedAt, '2026-10-18T06:42:40.009Z');
    assert.deepEqual(snap.observations, row.observations);
  }

  // Verificar que resolveIndicatorSeries conserva el null de Oct.2026 en PN01273PM
  const ipcInd = M.INDICATORS_CATALOG.find(i => i.id === 'PN01273PM');
  const ipcRes = M.resolveIndicatorSeries(ipcInd, 'PER');
  assert.equal(ipcRes.series.length, 34);
  assert.equal(ipcRes.series.at(-1).date, '2026-10');
  assert.equal(ipcRes.series.at(-1).value, null, 'Oct.2026 null se conserva sin borrarse');

  const summaryIpc = M.getLatestObservationSummary(ipcRes.series, ipcInd.frequency);
  assert.equal(summaryIpc.latest.date, '2026-09');
  assert.ok(Number.isFinite(summaryIpc.delta), 'Sep.2026 y Ago.2026 son consecutivos');

  // Serie BCRP incompleta con hueco intermedio y salto de mes
  const incompleteBcrp = {
    PN01273PM: {
      source: 'BCRP',
      code: 'PN01273PM',
      frequency: 'monthly',
      fetchedAt: '2026-10-18T06:42:40.009Z',
      observations: [
        { date: '2026-05-01', value: 2.0 },
        { date: '2026-06-01', value: null },
        { date: '2026-07-01', value: 2.4 },
        // Salto de 2026-08: pasa directo a 2026-09
        { date: '2026-09-01', value: 2.8 }
      ]
    }
  };
  const incRes = M.resolveIndicatorSeries(ipcInd, 'PER', { bcrp: incompleteBcrp });
  assert.equal(incRes.series.length, 4);
  assert.equal(incRes.series[1].value, null, 'el hueco de 2026-06 se conserva como null');
  const incSummary = M.getLatestObservationSummary(incRes.series, ipcInd.frequency);
  assert.equal(incSummary.latest.date, '2026-09');
  assert.equal(incSummary.delta, null, 'delta es null cuando falta el mes inmediato anterior (2026-08)');

  const histInc = M.buildHistoricalAnalysis({
    series: incRes.series,
    mode: 'variation',
    isRate: true,
    frequency: 'Mensual'
  });
  assert.equal(histInc.rows.find(r => r.date === '2026-07').pctChange, null, '2026-07 no tiene variación porque 2026-06 es null');
  assert.equal(histInc.rows.find(r => r.date === '2026-09').pctChange, null, '2026-09 no tiene variación porque falta 2026-08');
});

test('INDICATORS_CATALOG separates verified official series from explicitly flagged demo cards and unbacked BCRP quarterly', () => {
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
    if (item.id === 'PN02507AQ') {
      assert.equal(resolved.status, 'unavailable', 'PN02507AQ sin proxy en vivo queda unavailable sin datos inventados');
      assert.equal(resolved.series.length, 0);
    } else {
      assert.ok(resolved.series.some(p => Number.isFinite(p.value)), `Official series ${item.id} must resolve observations for PER`);
    }
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
