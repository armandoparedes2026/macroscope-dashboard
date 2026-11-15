import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
const browser=await chromium.launch();
try {
 await mkdir('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1672,height:941},reducedMotion:'reduce'});
 await page.route(/^https?:/,r=>r.abort());
 await page.goto(new URL('../index.html#simulacion',import.meta.url).href);
 await page.waitForFunction(()=>MacroScope.labs.islm.snapshot().E0);
 await page.selectOption('#islmMobility','perfect');
 await page.evaluate(()=>document.querySelector('[data-preset="fiscal"]').click());
 const result=await page.evaluate(()=>{
  const s=MacroScope.labs.islm.snapshot();
  return {s:{E0:s.E0,E1:s.E1,E2:s.E2},panels:['islmPanelISLM','islmPanelMF','islmPanelMoney','islmPanelCross'].map(id=>({id,lines:JSON.parse(document.getElementById(id).dataset.curves)}))};
 });
 assert.ok(result.s.E1.Y>result.s.E0.Y,'La expansión fiscal tiene impacto interno antes de la neutralidad final');
 for(const p of result.panels){
  assert.ok(p.lines.some(l=>l.stages?.includes(1)),p.id+': falta curva de impacto persistente');
  const point=p.id==='islmPanelISLM'?[result.s.E1.Y,result.s.E1.i]:p.id==='islmPanelMF'?[result.s.E1.Y,result.s.E1.e]:p.id==='islmPanelMoney'?[result.s.E1.M,result.s.E1.i]:[result.s.E1.Y,result.s.E1.Y];
  const impact=p.lines.filter(l=>l.stages?.includes(1) && ['IS','IS*','L(Y)','DA'].includes(l.family));
  assert.equal(impact.length,1,p.id+': una relación de demanda de impacto');
  const {a,b,c}=impact[0].line;assert.ok(Math.abs(a*point[0]+b*point[1]-c)<1e-7,p.id+': la curva debe pasar por E1');
 }
 await page.click('#islmExpandChartsBtn');
 assert.deepEqual(await page.locator('#islmZoomISLM').evaluate(c=>JSON.parse(c.dataset.curves)),result.panels[0].lines);
 await page.keyboard.press('Escape');
 await page.selectOption('#islmRegime','closed');
 assert.match(await page.textContent('#islmNarrative'),/E₁|E1/);
 const reports=[];
 for(const [regime,mobility,preset] of [['flex','perfect','fiscal'],['flex','high','fiscal'],['flex','high','monetary'],['fixed','perfect','fiscal'],['fixed','high','devaluation'],['flex','high','fed'],['closed','high','fiscal']]) {
  await page.click('#islmResetBtn');await page.selectOption('#islmRegime',regime);if(regime!=='closed')await page.selectOption('#islmMobility',mobility);
  await page.evaluate(id=>document.querySelector(`[data-preset="${id}"]`).click(),preset);
  const data=await page.evaluate(()=>{
   const s=MacroScope.labs.islm.snapshot(),eq=[s.E0,s.E1,s.E2];
   const families=[['islmPanelISLM','IS','Y','i'],['islmPanelISLM','LM','Y','i'],['islmPanelMF','IS*','Y','e'],['islmPanelMoney','L(Y)','M','i'],['islmPanelCross','DA','Y','Y']];
   const checks=[];
   for(const [id,family,x,y] of families){if(id==='islmPanelMF'&&s.config.regime==='closed')continue;
    const lines=JSON.parse(document.getElementById(id).dataset.curves);
    for(let stage=0;stage<3;stage++){const line=lines.find(l=>l.family===family&&l.stages.includes(stage));checks.push({id,family,stage,residual:line?Math.abs(line.line.a*eq[stage][x]+line.line.b*eq[stage][y]-line.line.c):null});}
   }
   const is=JSON.parse(document.getElementById('islmPanelISLM').dataset.curves).filter(l=>l.family==='IS');
   return {checks,is,Y:eq.map(e=>e.Y),e:eq.map(e=>e.e)};
  });
  assert.ok(data.checks.every(c=>c.residual!==null&&c.residual<1e-7),JSON.stringify({regime,mobility,preset,data}));
  if(regime==='flex'&&mobility==='perfect'&&preset==='fiscal'){
   assert.ok(data.is.some(l=>l.stages.includes(0)&&l.stages.includes(2)&&!l.stages.includes(1)),'IS vuelve a la posición base sin borrar IS1: '+JSON.stringify(data));
   await page.screenshot({path:'test-results/lab-stages-fiscal-perfect.png'});
   await page.click('#islmExpandChartsBtn');await page.screenshot({path:'test-results/lab-stages-zoom.png'});await page.keyboard.press('Escape');
  }
  if(regime==='flex'&&mobility==='high'&&preset==='fiscal')await page.screenshot({path:'test-results/lab-stages-fiscal-high.png'});
  reports.push({regime,mobility,preset,...data});
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.locator('#islm-G').evaluate(el=>{el.value=24;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>[...document.querySelectorAll('.islm-grid canvas')].every(c=>c.dataset.animating==='false'));
 assert.ok(await page.locator('#islmPanelISLM').evaluate(c=>JSON.parse(c.dataset.curves).some(l=>l.stages?.includes(1))));
 await writeFile('test-results/lab-stages-report.json',JSON.stringify(reports,null,2));
 console.log('Lab stages OK: 7 escenarios, 3 etapas geométricamente compatibles, retorno, zoom y permanencia tras animación');
} finally {await browser.close();}
