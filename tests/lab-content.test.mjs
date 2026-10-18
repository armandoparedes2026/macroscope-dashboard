// El texto pedagógico no puede contradecir al simulador: cada signo declarado en `theory`
// se recalcula con js/islm-model.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import '../js/islm-model.js';
import '../js/lab-content.js';

const { createModel } = globalThis.ISLM;
const { SCENARIOS, GLOSSARY, REFERENCES, gradePrediction } = globalThis.LAB_CONTENT;
const calib = { i0: 4, istar0: 3, cab: -2, nx0: 1 };
const sign = (x) => (Math.abs(x) < 1e-6 ? 0 : Math.sign(x));

function run(setup, patch) {
  const m = createModel({ ...setup, ...calib });
  return { m, from: m.solve(m.baseline), to: m.solve({ ...m.baseline, ...patch(m.baseline) }) };
}

test('cada escenario guiado coincide con el resultado del modelo', () => {
  for (const s of SCENARIOS) {
    const { from, to } = run(s.setup, s.patch);
    for (const [k, expected] of Object.entries(s.theory)) {
      assert.equal(sign(to[k] - from[k]), expected, `${s.id}: signo de Δ${k}`);
    }
    if (s.compareWith) {
      const c = run(s.compareWith, s.patch);
      for (const [k, expected] of Object.entries(s.theoryCompare)) {
        assert.equal(sign(c.to[k] - c.from[k]), expected, `${s.id} (comparación): signo de Δ${k}`);
      }
    }
    for (const k of s.predict) assert.ok(k in s.theory, `${s.id}: se pregunta por ${k} sin respuesta teórica`);
  }
});

test('los resultados se mantienen con otra calibración (NX y CA de signo distinto)', () => {
  for (const s of SCENARIOS) {
    const m = createModel({ ...s.setup, i0: 6.5, istar0: 3, cab: 3.6, nx0: 8.1 });
    const from = m.solve(m.baseline), to = m.solve({ ...m.baseline, ...s.patch(m.baseline) });
    for (const [k, expected] of Object.entries(s.theory)) assert.equal(sign(to[k] - from[k]), expected, `${s.id}: Δ${k}`);
  }
});

test('escenarios completos en los tres niveles y con referencias existentes', () => {
  const ids = new Set();
  for (const s of SCENARIOS) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    for (const lvl of ['intro', 'intermediate', 'advanced']) assert.ok(s.levels[lvl]?.length > 40, `${s.id}.${lvl}`);
    assert.ok(s.caveats.length > 0, `${s.id}: advertencias`);
    for (const r of s.refs) assert.ok(REFERENCES[r], `${s.id}: referencia ${r}`);
  }
  for (const [term, g] of Object.entries(GLOSSARY)) for (const r of g.refs) assert.ok(REFERENCES[r], `${term}: ${r}`);
});

test('calificación de la predicción', () => {
  const g = gradePrediction({ Y: 1, i: -1 }, { Y: 100, i: 4 }, { Y: 101, i: 4.5 });
  assert.deepEqual(g.Y, { predicted: 1, simulated: 1, ok: true });
  assert.equal(g.i.ok, false);
});
