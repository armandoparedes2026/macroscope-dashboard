import test from 'node:test';
import assert from 'node:assert/strict';
await import('../js/services/compare.js');
await import('../js/services/comparison-dashboard-data.js');

const {normalizeCountries,commonLatestYear,rankCountries,buildEconomySummary,transformSeries} = globalThis.MacroScope.compareDashboardData;

const countries=['PER','CHL','COL','MEX'];
const indicator='NY.GDP.MKTP.KD.ZG';
const db={
  PER:{[indicator]:{'2022':2.7,'2023':0,'2024':3.1}},
  CHL:{[indicator]:{'2022':2.4,'2023':2.5,'2024':null}},
  COL:{[indicator]:{'2022':1.7,'2023':1.9,'2024':2.3}},
  MEX:{[indicator]:{'2022':2.0,'2023':2.2,'2024':2.9}}
};

test('selector mantiene países únicos, válidos, orden y límite de cuatro',()=>{
  assert.deepEqual(normalizeCountries(['PER','PER','XYZ','CHL','COL','MEX','USA'],[...countries,'USA']),countries);
  assert.deepEqual(normalizeCountries([],countries),['PER']);
  assert.deepEqual(normalizeCountries(['???'],countries),['PER']);
});

test('año común usa solo valores finitos, incluido cero',()=>{
  assert.equal(commonLatestYear(db,countries,indicator,['2022','2023','2024']),'2023');
  assert.equal(commonLatestYear(db,['PER','CHL'],indicator,['2024']),null);
  assert.equal(commonLatestYear(db,[],indicator,['2023']),null);
});

test('ranking es comparativo y no sustituye ausencias por ceros',()=>{
  assert.deepEqual(rankCountries(db,countries,indicator,'2023').map(row=>[row.code,row.value]),[
    ['CHL',2.5],['MEX',2.2],['COL',1.9],['PER',0]
  ]);
  assert.deepEqual(rankCountries(db,countries,indicator,'2024').map(row=>row.code),['PER','MEX','COL']);
});

test('lectura comparativa incluye periodo, líder y rango; si no hay datos no inventa',()=>{
  const result=buildEconomySummary(db,countries,indicator,['2022','2023','2024']);
  assert.equal(result.year,'2023');
  assert.equal(result.leader.code,'CHL');
  assert.equal(result.last.code,'PER');
  assert.equal(result.spread,2.5);
  assert.equal(buildEconomySummary(db,countries,indicator,['2024']).year,null);
});

test('modo por regiones aplica la misma transformación a país y agregado',()=>{
  const data={...db,LCN:{[indicator]:{'2022':1,'2023':2,'2024':3}}};
  const ys=['2022','2023','2024'];
  assert.ok(Math.abs(transformSeries(data,'PER',indicator,ys,'cumulative')['2024']-5.8837)<0.001);
  assert.ok(Math.abs(transformSeries(data,'LCN',indicator,ys,'cumulative')['2024']-6.1106)<0.001);
  assert.equal(transformSeries(data,'CHL',indicator,ys,'cumulative')['2024'],null);
});
