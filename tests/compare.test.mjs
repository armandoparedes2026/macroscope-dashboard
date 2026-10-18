import test from 'node:test';
import assert from 'node:assert/strict';
await import('../js/services/compare.js');
const { normalizeBase, cumulativeGrowth, commonYears, relativeToUSA } = globalThis.MacroScope;
test('base 100 preserves null and does not mutate source', () => {
  const source = {2014:20,2015:30,2016:null};
  assert.deepEqual(normalizeBase(source,'2014','NY.GDP.PCAP.PP.KD'),{2014:100,2015:150,2016:null});
  assert.equal(source[2015],30);
  assert.deepEqual(normalizeBase(source,'2016','NY.GDP.PCAP.CD'),{2014:null,2015:null,2016:null});
  assert.equal(normalizeBase({2014:0},'2014','NY.GDP.PCAP.CD')[2014],null);
});
test('rates cannot be normalized', () => {
  for(const code of ['NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SL.UEM.TOTL.ZS'])
    assert.throws(()=>normalizeBase({2014:2},'2014',code),/nivel/);
});
test('chain growth multiplies annual factors and propagates gaps', () => {
  const result=cumulativeGrowth({2014:10,2015:-10,2016:null,2017:20});
  assert.ok(Math.abs(result[2015]+1)<1e-10);
  assert.equal(result[2016],null); assert.equal(result[2017],null);
  assert.equal(cumulativeGrowth({2014:5,2016:5})[2016],null);
  assert.equal(cumulativeGrowth({2014:0})[2014],0);
});
test('common years intersects finite observations, retaining zero', () => {
  assert.deepEqual(commonYears([{2014:0,2015:null,2016:3},{2014:1,2015:2,2016:null}],['2014','2015','2016']),['2014']);
  assert.deepEqual(commonYears([],['2014']),[]);
});
test('convergence uses same-year USA denominator, gaps remain null', () => {
  assert.deepEqual(relativeToUSA({2014:20,2015:30,2016:null,2017:5},{2014:40,2015:0,2016:10}),{2014:50,2015:null,2016:null,2017:null});
});
