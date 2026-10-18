import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import handler,{parseBcrp,SERIES} from '../api/bcrp.js';
const raw=await readFile(new URL('./fixtures/bcrp-real.json',import.meta.url),'utf8');
const codes=Object.keys(SERIES);
test('BCRP: fixture real, series reordenadas y sufijo HTML',()=>{
 const result=parseBcrp(raw,codes,'2026-10-18T00:00:00Z');
 assert.equal(result.length,4);
 assert.equal(result[0].code,'PD04722MM');
 assert.equal(result[0].observations[0].value,6.5);
 assert.equal(result.find(s=>s.code==='PN00027MM').observations[0].value,73327.465328);
 assert.equal(result.find(s=>s.code==='PN01273PM').observations[0].value,3.02392174826855);
 assert.equal(result[0].observations[0].date,'2024-01-01');
});
test('BCRP: cada código coincide con su respuesta individual real',async()=>{
 for(const code of codes){
  const text=await readFile(new URL(`./fixtures/bcrp-${code}.txt`,import.meta.url),'utf8');
  const [series]=parseBcrp(text,[code]);
  assert.equal(series.title,SERIES[code].title);
  assert.ok(series.observations.length>12);
 }
});
test('BCRP: n.d. es null y respuestas inválidas se rechazan',()=>{
 const data=JSON.parse(raw.split('<br')[0]);
 data.periods[0].values[0]='n.d.';
 assert.equal(parseBcrp(data,codes)[0].observations[0].value,null);
 data.periods[0].values[0]='no es un número';
 assert.throws(()=>parseBcrp(data,codes));
 assert.throws(()=>parseBcrp({},codes));
 assert.throws(()=>parseBcrp(raw,['PN01288PM']));
});
const response=()=>({headers:{},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;},setHeader(k,v){this.headers[k]=v;}});
test('BCRP proxy: validación de método, allowlist y periodos',async()=>{
 for(const req of [
  {method:'POST',query:{}},
  {method:'GET',query:{codes:'PN01288PM',start:'2024-1',end:'2026-10'}},
  {method:'GET',query:{codes:codes.join('-'),start:'2024-13',end:'2026-10'}},
  {method:'GET',query:{codes:codes.join('-'),start:'2026-10',end:'2024-1'}},
  {method:'GET',query:{codes:['PD04722MM'],start:'2024-1',end:'2026-10'}},
  {method:'GET',query:{codes:'PD04722MM-PD04722MM',start:'2024-1',end:'2026-10'}}
 ]){const res=response();await handler(req,res);assert.ok([400,405].includes(res.statusCode));assert.ok(res.body.error);}
});
test('BCRP proxy: JSON normalizado, caché y errores upstream',async()=>{
 const original=globalThis.fetch;
 try{
  let called;
  globalThis.fetch=async(url,options)=>{called=url;assert.ok(options.signal);return {ok:true,text:async()=>raw};};
  const req={method:'GET',query:{codes:codes.join('-'),start:'2024-1',end:'2026-10'}};
  let res=response();await handler(req,res);
  assert.equal(res.statusCode,200);assert.equal(res.body.length,4);
  assert.equal(res.headers['Cache-Control'],'public, s-maxage=21600, stale-while-revalidate=86400');
  assert.match(called,/estadisticas.bcrp.gob.pe/);
  globalThis.fetch=async()=>({ok:true,text:async()=>'<html>Error</html>'});
  res=response();await handler(req,res);assert.equal(res.statusCode,502);
  globalThis.fetch=async()=>{throw Object.assign(Error('timeout'),{name:'AbortError'});};
  res=response();await handler(req,res);assert.equal(res.statusCode,502);assert.match(res.body.error,/espera/);
 }finally{globalThis.fetch=original;}
});
