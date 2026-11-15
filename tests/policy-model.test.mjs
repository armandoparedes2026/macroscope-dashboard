import test from 'node:test';
import assert from 'node:assert/strict';
await import('../js/policy-model.js').catch(e => { if(e.code !== 'ERR_MODULE_NOT_FOUND') throw e; });
const solve = p => { assert.ok(globalThis.MacroScope?.Policy, 'El motor de política debe estar disponible'); return MacroScope.Policy.solve(p); };
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7, `${a} != ${b}`);
test('libre comercio: mercado importador y excedentes conocidos',()=>{
 const r=solve({}); near(r.price,50);near(r.demand,110);near(r.supply,30);near(r.imports,80);near(r.consumerSurplus,6050);near(r.producerSurplus,450);near(r.welfare,6500);
});
test('arancel de 20%: recauda 600 y pierde 100 de bienestar',()=>{
 const r=solve({tariff:20});near(r.price,60);near(r.imports,60);near(r.tariffRevenue,600);near(r.welfareChange,-100);
});
test('cuota equivalente: mismo mercado; renta nacional, fiscal o extranjera cambia distribución',()=>{
 const a=solve({quotaEnabled:true,quota:60,rent:'domestic'}),b=solve({quotaEnabled:true,quota:60,rent:'auction'}),c=solve({quotaEnabled:true,quota:60,rent:'foreign'});
 near(a.price,60);near(a.quotaRent,600);near(a.welfareChange,-100);near(b.fiscal,600);near(b.welfare,a.welfare);near(c.welfareChange,-700);
});
test('subsidio productivo no sube precio al consumidor y tiene costo presupuestario',()=>{
 const r=solve({subsidy:10});near(r.price,50);near(r.producerPrice,60);near(r.supply,40);near(r.imports,70);near(r.subsidyCost,400);near(r.welfareChange,-50);
});
test('costo real de frontera no es recaudación: disipa recursos',()=>{
 const r=solve({tradeCost:10});near(r.price,60);near(r.fiscal,0);near(r.resourceCost,600);near(r.welfareChange,-700);
});
test('cuota vinculante con arancel y subsidio: cantidades y contabilidad coherentes',()=>{
 const r=solve({tariff:20,subsidy:10,tradeCost:5,quotaEnabled:true,quota:30,rent:'foreign'});
 near(r.price,70);near(r.producerPrice,80);near(r.demand,90);near(r.supply,60);near(r.imports,30);near(r.quotaRent,150);near(r.fiscal,-300);near(r.welfareChange,-950);
});
test('arancel prohibitivo y cuota cero: autarquía sin recaudación ni rentas ficticias',()=>{
 for(const p of [{tariff:200},{quotaEnabled:true,quota:0}]) {const r=solve(p);near(r.price,90);near(r.imports,0);near(r.fiscal,0);near(r.quotaRent,0);near(r.welfareChange,-1600);}
});
test('sin cuota vinculante, su asignación no cambia resultados',()=>{
 const r=solve({quotaEnabled:true,quota:200,rent:'foreign'});near(r.price,50);near(r.welfareChange,0);
});
test('la esquina de oferta cero conserva la identidad de recursos',()=>{
 const r=solve({worldPrice:10,tradeCost:20});near(r.base.supply,0);near(r.price,30);near(r.supply,10);near(r.welfareChange,-2750);near(r.productionLoss,150);
});
test('normaliza el contrato y no propaga campos extra a exportaciones',()=>{
 assert.equal(solve({extra:'=FORMULA()'}).params.extra,undefined);
});
test('identidad independiente de bienestar para toda la grilla válida de combinaciones',()=>{
 for(const tariff of [0,20,80,150]) for(const subsidy of [0,10,30]) for(const tradeCost of [0,10]) for(const quota of [0,30,200]) for(const rent of ['domestic','auction','foreign']) {
  const r=solve({tariff,subsidy,tradeCost,quotaEnabled:true,quota,rent});
  near(r.demand-r.supply,r.imports); near(r.welfareChange,-r.consumptionLoss-r.productionLoss-r.resourceCost-r.foreignRent);assert.ok(r.imports>=0);
 }
});
test('rechaza entradas inválidas y economías exportadoras fuera del alcance',()=>{
 assert.ok(MacroScope.Policy);
 for(const [p,message] of [[{tariff:-1},/negativos/],[{subsidy:200},/exportador/],[{worldPrice:200},/importador/],[{quota:-1},/negativos/],[{tradeCost:NaN},/finito/],[{rent:'unknown'},/asignación/]]) assert.throws(()=>solve(p),message);
});
