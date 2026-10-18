import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
await import('../js/config/countries.js');
await import('../js/services/wdi.js');
const { normalizeWdiValue, parseWdiPage, normalizeWdiPages, latestAvailable, loadWdiSeries }=globalThis.MacroScope;
const fixture=name=>JSON.parse(readFileSync(new URL(`fixtures/wdi-${name}.json`,import.meta.url),'utf8'));
const code='NE.IMP.GNFS.ZS';
test('respaldo generado: cobertura, metadatos, obs_status y ausencias WDI preservadas',async()=>{
 await import('../js/config/indicators.js');
 await import('../js/data/fallback-wdi.js');
 const {COUNTRIES,INDICATORS,FALLBACK_DB:db,FALLBACK_METADATA:meta,FALLBACK_OBS_STATUS:status}=globalThis.MacroScope;
 assert.equal(meta.source,'WDI');assert.ok(Number.isFinite(Date.parse(meta.extractedAt)));
 assert.equal(Object.keys(db).length,19);
 for(const country of Object.keys(COUNTRIES))for(const indicator of Object.keys(INDICATORS)){
   assert.equal(Object.keys(db[country][indicator]).length,12);
   assert.deepEqual(Object.keys(status[country][indicator]),Object.keys(db[country][indicator]));
   assert.match(meta.indicators[indicator].apiUrl,/api.worldbank.org/);
   assert.ok(meta.indicators[indicator].definition.sourceNote);
   assert.ok(meta.indicators[indicator].lastupdated.length);
 }
 assert.ok(Object.values(db.LCN['BN.CAB.XOKA.GD.ZS']).every(v=>v===null));
 for(const year of ['2014','2015','2016','2017'])assert.equal(db.ARG['FP.CPI.TOTL.ZG'][year],null);
 assert.equal(db.USA['FP.CPI.TOTL.ZG']['2025'],null);
});
test('WDI: dos páginas reales normalizadas y orden de observaciones conservado',()=>{
 const pages=[fixture('page-1'),fixture('page-2')];
 const rows=normalizeWdiPages(pages,code);
 assert.equal(rows.length,3);assert.deepEqual(rows.map(r=>r.date),['2025','2024','2023']);
 assert.deepEqual(rows,pages.flatMap(p=>p[1]));
 assert.notEqual(rows[0],pages[0][1][0],'normalizar no modifica el fixture');
});
test('WDI: null real conserva ausencia; último año y anterior usan observaciones finitas',()=>{
 const rows=normalizeWdiPages([fixture('null')],code);
 assert.equal(rows[0].value,null);
 const series=Object.fromEntries(rows.map(r=>[r.date,r.value]));
 assert.deepEqual(latestAvailable(series),{year:'2024',value:14.0413208226783,prevYear:'2023',prevValue:13.878624456192});
 assert.deepEqual(latestAvailable(series,['2025']),{year:'N/D',value:null,prevYear:null,prevValue:null});
 assert.deepEqual(latestAvailable({'2024':0,'2023':null}),{year:'2024',value:0,prevYear:null,prevValue:null});
});
test('WDI: conversión estricta impide que null, vacío o cadenas se vuelvan cero',()=>{
 assert.equal(normalizeWdiValue(null),null);assert.equal(normalizeWdiValue(0),0);
 for(const value of ['', '2.5',undefined,NaN,Infinity,{},false])assert.throws(()=>normalizeWdiValue(value));
});
test('WDI: error oficial message y páginas inválidas se rechazan',()=>{
 assert.ok(fixture('error')[0].message);
 assert.throws(()=>parseWdiPage(fixture('error'),code),/malformada/);
 assert.throws(()=>normalizeWdiPages([fixture('page-1')],code),/incompleta/);
 assert.throws(()=>normalizeWdiPages([fixture('page-2'),fixture('page-1')],code),/Paginación/);
 const changed=fixture('page-2');changed[0].pages=3;
 assert.throws(()=>normalizeWdiPages([fixture('page-1'),changed],code),/Paginación/);
 for(const field of ['value','countryiso3code','date','indicator']){
  const data=fixture('page-1');data[1][0][field]='invalid';
  assert.throws(()=>parseWdiPage(data,code),/malformada/);
 }
});
test('WDI: servicio pagina respuestas reales, reutiliza caché y permite actualización forzada',async()=>{
 const oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;
 const cache=new Map();let calls=[];
 globalThis.localStorage={getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,v)};
 globalThis.fetch=async url=>{calls.push(url);return {ok:true,json:async()=>fixture(new URL(url).searchParams.get('page')==='1'?'page-1':'page-2')};};
 try {
  const result=await loadWdiSeries('https://api.worldbank.org/v2/test?format=json',code,false);
  assert.equal(result.rows.length,3);assert.equal(calls.length,2);
  assert.deepEqual(await loadWdiSeries('https://api.worldbank.org/v2/test?format=json',code,false),result);assert.equal(calls.length,2);
  await loadWdiSeries('https://api.worldbank.org/v2/test?format=json',code,true);assert.equal(calls.length,4);
  const key='macroscope_wdi_v2_'+code;const stale=JSON.parse(cache.get(key));stale.fetchedAt='2000-01-01T00:00:00Z';cache.set(key,JSON.stringify(stale));
  await loadWdiSeries('https://api.worldbank.org/v2/test?format=json',code,false);assert.equal(calls.length,6);
 }finally{globalThis.fetch=oldFetch;if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;}
});
