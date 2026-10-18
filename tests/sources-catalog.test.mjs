import test from 'node:test';
import assert from 'node:assert/strict';
await import('../js/data/sources-catalog.js');
const { COURSES, SCOPES, ACCESS, SOURCES, citeSource, filterSources } = globalThis.MacroScope.SOURCES_CATALOG;

test('every source is complete and uses known vocabularies', () => {
  const ids = new Set();
  for (const s of SOURCES) {
    assert.ok(!ids.has(s.id), `duplicate id ${s.id}`); ids.add(s.id);
    for (const key of ['name', 'org', 'orgShort', 'url', 'frequency', 'useFor', 'checked']) assert.ok(s[key], `${s.id}.${key}`);
    assert.match(s.url, /^https:\/\//);
    assert.ok(SCOPES[s.scope], `${s.id} scope`);
    assert.ok(s.courses.length && s.courses.every(c => COURSES[c]), `${s.id} courses`);
    assert.ok(s.access.length && s.access.every(a => ACCESS[a]), `${s.id} access`);
    assert.ok(['basico', 'intermedio', 'avanzado'].includes(s.level));
    assert.ok(['ok', 'antibot'].includes(s.linkStatus));
    if (!s.primary) assert.ok(s.note, `${s.id}: secondary sources must explain what to cite`);
  }
});

test('every course has at least two sources', () => {
  for (const course of Object.keys(COURSES)) assert.ok(filterSources({ course }).length >= 2, course);
});

test('filters combine and search matches topics', () => {
  const peru = filterSources({ scope: 'peru' });
  assert.ok(peru.length > 0 && peru.every(s => s.scope === 'peru'));
  assert.ok(filterSources({ query: 'inflación' }).some(s => s.id === 'bcrpdata'));
  assert.deepEqual(filterSources({ course: 'econometria', access: 'microdatos', scope: 'peru' }).map(s => s.id), ['inei-microdatos']);
  assert.equal(filterSources({ query: 'zzzz' }).length, 0);
});

test('citation follows APA database format with access date', () => {
  const s = SOURCES.find(x => x.id === 'wdi');
  const cite = citeSource(s, new Date(2026, 9, 18));
  assert.match(cite, /^Banco Mundial\. \(s\. f\.\)\. World Development Indicators \(WDI\) \[Base de datos\]\. Recuperado el 18 de octubre de 2026, de https:/);
});
