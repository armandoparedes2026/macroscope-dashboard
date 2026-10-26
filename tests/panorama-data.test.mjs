import assert from 'node:assert/strict';
import test from 'node:test';
globalThis.MacroScope={};
await import('../js/services/panorama-data.js');
const {buildPanoramaMetrics,rollingTwelveMonths,rebaseBcrpIndex,getPanoramaLevelSeries}=globalThis.MacroScope;
const monthly=(code,values)=>({code,source:'BCRP',frequency:'monthly',unit:'%',fetchedAt:'2026-10-25T10:00:00Z',observations:values.map(([date,value])=>({date,period:date,value}))});
const quarterly=values=>({code:'PN02507AQ',source:'BCRP',frequency:'quarterly',unit:'% interanual',fetchedAt:'2026-10-25T10:00:00Z',observations:values.map(([date,value])=>({date,period:date,value}))});
const seq=Array.from({length:12},(_,i)=>[`${i<4?'2025':'2026'}-${String((i+8)%12+1).padStart(2,'0')}-01`,i+1]);
test('balanza: doce meses consecutivos exactos generan suma y periodo final',()=>{
 assert.deepEqual(rollingTwelveMonths(seq.map(([date,value])=>({date,value}))),{value:78,date:'2026-08-01'});
});
test('balanza: doce meses incompletos, con brecha o n.d. no generan acumulado',()=>{
 assert.equal(rollingTwelveMonths(seq.slice(1).map(([date,value])=>({date,value}))),null);
 assert.equal(rollingTwelveMonths(seq.map(([date,value],i)=>({date,value:i===5?null:value}))),null);
 assert.equal(rollingTwelveMonths(seq.filter((_,i)=>i!==4).map(([date,value])=>({date,value}))),null);
});
test('PBI desestacionalizado: nivel 2015=100 usa los doce meses oficiales de 2015 como base',()=>{
 const months=Array.from({length:12},(_,i)=>({date:`2015-${String(i+1).padStart(2,'0')}-01`,value:100+i}));
 const result=rebaseBcrpIndex([...months,{date:'2016-01-01',value:211}],2015);
 assert.equal(result.length,13);
 assert.ok(Math.abs(result[0].value-100*100/105.5)<1e-8);
 assert.ok(Math.abs(result[12].value-200)<1e-8);
});
test('PBI desestacionalizado: base incompleta o n.d. impide rebase sin interpolar',()=>{
 const months=Array.from({length:12},(_,i)=>({date:`2015-${String(i+1).padStart(2,'0')}-01`,value:i===5?null:101}));
 assert.equal(rebaseBcrpIndex(months,2015),null);
 assert.equal(rebaseBcrpIndex(months.slice(1),2015),null);
 assert.equal(getPanoramaLevelSeries({PN01773AM:monthly('PN01773AM',months.map(p=>[p.date,p.value]))}),null);
});
test('Perú: tasa de referencia y reservas internacionales aparecen como KPI adicionales',()=>{
 const bcrp={PD04722MM:monthly('PD04722MM',[['2026-09-01',4.25]]),PN00027MM:monthly('PN00027MM',[['2026-09-01',90250]])};
 const metrics=buildPanoramaMetrics({country:'PER',bcrp});
 assert.deepEqual(metrics.extras.map(card=>card.id),['policy','reserves']);
 assert.deepEqual(metrics.extras.map(card=>card.code),['PD04722MM','PN00027MM']);
 assert.ok(metrics.extras.every(card=>card.provider==='BCRP'));
 const chile=buildPanoramaMetrics({country:'CHL',bcrp});
 assert.deepEqual(chile.extras,[]);
});
test('Perú: seis KPI con periodo, código y frecuencia oficiales; desempleo OIT nacional anual',()=>{
 const bcrp={
  PN02507AQ:quarterly([['2026-01-01',3.56],['2026-04-01',2.56]]),
  PN01273PM:monthly('PN01273PM',[['2026-08-01',1.4],['2026-09-01',1.6]]),
  PN01207PM:monthly('PN01207PM',[['2026-08-01',3.4],['2026-09-01',3.5]]),
  PN38723BM:monthly('PN38723BM',seq),
  PD38045AM:monthly('PD38045AM',[['2026-08-01',57.3],['2026-09-01',56.8]])
 };
 const result=buildPanoramaMetrics({country:'PER',wdi:{PER:{'SL.UEM.TOTL.ZS':{'2025':5.4}}},source:{PER:{'SL.UEM.TOTL.ZS':{'2025':'wdi'}}},bcrp});
 assert.equal(result.cards.length,6);
 assert.deepEqual(result.cards.map(c=>c.id),['gdp','inflation','unemployment','fx','trade','confidence']);
 assert.equal(result.cards[0].frequency,'quarterly');
 assert.equal(result.cards[0].period,'2026-04-01');
 assert.equal(result.cards[1].provider,'BCRP');
 assert.equal(result.cards[2].title,'Desempleo nacional (OIT)');
 assert.equal(result.cards[2].provider,'Banco Mundial · WDI');
 assert.equal(result.cards[2].period,'2025');
 assert.equal(result.cards[4].value,78);
 assert.equal(result.cards[4].aggregation,'12 meses completos');
 assert.deepEqual(result.cards[4].series.map(point=>point.value),[78]);
 assert.equal(result.cards[5].unit,'puntos');
 assert.match(result.cards[0].sourceUrl,/PN02507AQ/);
 assert.match(result.cards[5].sourceUrl,/PD38045AM/);
});
test('país no Perú: no atribuye series BCRP a Chile y emplea indicadores WDI',()=>{
 const wdi={CHL:{'NY.GDP.MKTP.KD.ZG':{'2024':2.4},'FP.CPI.TOTL.ZG':{'2024':4.5},'SL.UEM.TOTL.ZS':{'2024':8},'NE.EXP.GNFS.ZS':{'2024':30},'BN.CAB.XOKA.GD.ZS':{'2024':-1},'NY.GDP.PCAP.CD':{'2024':17000}}};
 const metrics=buildPanoramaMetrics({country:'CHL',wdi,source:{CHL:{'NY.GDP.MKTP.KD.ZG':{'2024':'wdi'}}},dates:{live:{'NY.GDP.MKTP.KD.ZG':'2026-10-25T10:00:00Z'},fallback:{'FP.CPI.TOTL.ZG':'2026-10-18T10:00:00Z'}},bcrp:{PN02507AQ:quarterly([['2026-04-01',2.56]])}});
 assert.equal(metrics.cards.length,6);
 assert.ok(metrics.cards.every(c=>c.provider==='Banco Mundial · WDI'));
 assert.equal(metrics.cards[0].value,2.4);
 assert.equal(metrics.cards[0].frequency,'annual');
 assert.equal(metrics.cards[0].extractedAt,'2026-10-25T10:00:00Z');
 assert.equal(metrics.cards[1].extractedAt,'2026-10-18T10:00:00Z');
});
test('series incompletas: no inventa número ni delta temporal a través de huecos',()=>{
 const metrics=buildPanoramaMetrics({country:'PER',wdi:{PER:{}},source:{},bcrp:{PN01273PM:monthly('PN01273PM',[['2026-06-01',1.1],['2026-08-01',1.7]])}});
 assert.equal(metrics.cards[1].value,1.7);
 assert.equal(metrics.cards[1].delta,null);
 assert.equal(metrics.cards[0].value,null);
 assert.equal(metrics.cards[0].status,'unavailable');
 assert.equal(metrics.cards[4].value,null);
});
test('cliente Panorama: fallo trimestral conserva mensual verificado y registra error por frecuencia',async()=>{
 await import('../js/services/panorama-client.js');
 const {loadPanoramaBcrp}=globalThis.MacroScope;
 const mockFetch=async url=>{
  if(url.includes('PN02507AQ'))return {ok:false,status:502};
  return {ok:true,json:async()=>[
   {source:'BCRP',code:'PD38045AM',frequency:'monthly',unit:'puntos',title:'Expectativas',observations:[{date:'2026-09-01',period:'Sep.2026',value:56.8}],fetchedAt:'2026-10-25T00:00:00Z'}
  ]};
 };
 const data=await loadPanoramaBcrp({fetchImpl:mockFetch});
 assert.equal(data.PD38045AM.observations[0].value,56.8);
 assert.equal(data.PN02507AQ,undefined);
 assert.equal(globalThis.MacroScope.panoramaStatus.monthly,'partial');
 assert.equal(globalThis.MacroScope.panoramaStatus.quarterly,'error');
});
