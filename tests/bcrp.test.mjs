import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import handler,{parseBcrp,SERIES} from '../api/bcrp.js';
const raw=await readFile(new URL('./fixtures/bcrp-real.json',import.meta.url),'utf8');
const codes=['PD04722MM','PN01273PM','PN01207PM','PN00027MM'];
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
test('BCRP: trimestral 2025-2026 usa fecha de primer mes y frecuencia quarter',()=>{
 const quarterly={config:{series:[{name:'Producto bruto interno (variación porcentual interanual) - PBI Global'}]},periods:[{name:'T4.25',values:['3.32']},{name:'T1.26',values:['n.d.']},{name:'T2.26',values:['2.56']}]};
 const [pbi]=parseBcrp(quarterly,['PN02507AQ'],'2026-10-25T00:00:00Z');
 assert.equal(pbi.frequency,'quarterly');
 assert.deepEqual(pbi.observations.map(x=>[x.date,x.value]),[['2025-10-01',3.32],['2026-01-01',null],['2026-04-01',2.56]]);
 assert.throws(()=>parseBcrp({...quarterly,periods:[{name:'T5.26',values:['1']}]},['PN02507AQ']),/Periodo/);
});
test('BCRP: balanza comercial y expectativas usan títulos oficiales distintos',()=>{
 const monthly={config:{series:[
  {name:'Balanza comercial - valores FOB (millones US$) - Balanza Comercial'},
  {name:'Expectativas empresariales totales - Índice de expectativas de la economía a 3 meses'}
 ]},periods:[{name:'Ago.2026',values:['4713.99','57.31']},{name:'Sep.2026',values:['n.d.','56.83']}]};
 const [expectations,trade]=parseBcrp(monthly,['PD38045AM','PN38723BM']);
 assert.equal(expectations.observations[1].value,56.83);
 assert.equal(trade.observations[0].value,4713.99);
 assert.equal(trade.observations[1].value,null);
 assert.throws(()=>parseBcrp({...monthly,config:{series:[{name:'Incorrecto'},{name:'Incorrecto'}]}},['PD38045AM','PN38723BM']),/Título/);
});
test('BCRP: tres nuevas series oficiales validan título, frecuencia y observaciones',()=>{
 const newCodes=['PN01773AM','PN38714BM','PN38718BM'];
 const titles=[
  'Producto bruto interno y demanda interna (índice 2007 = 100) - PBI Desestacionalizado - mensual',
  'Balanza comercial - valores FOB (millones US$) - Exportaciones',
  'Balanza comercial - valores FOB (millones US$) - Importaciones'
 ];
 const payload={config:{series:titles.map(name=>({name}))},periods:[{name:'Ago.2026',values:['197.067951906273','10815.4041778185','6101.41347990082']}]};
 const series=parseBcrp(payload,newCodes);
 assert.deepEqual(series.map(row=>row.code),newCodes);
 assert.deepEqual(series.map(row=>row.frequency),['monthly','monthly','monthly']);
 assert.equal(series[0].observations[0].value,197.067951906273);
 assert.equal(series[2].unit,'millones US$');
 assert.throws(()=>parseBcrp({...payload,config:{series:[...payload.config.series.slice(0,2),{name:'Erróneo'}]}},newCodes),/Título/);
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
