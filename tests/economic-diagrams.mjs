import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
 await page.goto(new URL('../index.html#aprendizaje',import.meta.url).href);
 const canvas=page.locator('#apDiagramContainer canvas');
 assert.equal(await canvas.count(),1,'Aprendizaje debe usar el mismo renderer canvas del Laboratorio');
 await page.waitForFunction(()=>document.querySelector('#apDiagramContainer canvas')?.dataset.curves);
 const before=await canvas.getAttribute('data-curves');
 await page.locator('#apSliderG').evaluate(el=>{globalThis.testSlider=el;el.value=4;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForTimeout(480);assert.notEqual(await canvas.getAttribute('data-curves'),before,'Debe actualizar durante input, sin esperar change');
 assert.ok(await page.evaluate(()=>testSlider===document.querySelector('#apSliderG')),'Arrastrar conserva el control');
 assert.equal(JSON.parse(await canvas.getAttribute('data-points')).length,3);
 await page.locator('#apDiagramContainer [data-economic-expand]').click();
 assert.ok(await page.locator('#economicZoomDialog').isVisible());
 await page.locator('#apSliderG').evaluate(el=>{el.value=3;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForTimeout(480);
 assert.equal(await page.locator('#economicZoomDialog canvas').getAttribute('data-points'),await canvas.getAttribute('data-points'),'Zoom sincronizado');
 await page.keyboard.press('Escape');assert.equal(await page.locator('#apDiagramContainer [data-economic-expand]').evaluate(el=>el===document.activeElement),true);
 for(const model of ['islm','asad','micro-sd','phillips','solow']){
  await page.evaluate(()=>location.hash='modelos');await page.click(`[data-mod-select="${model}"]`);
  await page.waitForFunction(()=>document.querySelector('#modSvgContainer canvas')?.dataset.layoutAudit);
  assert.ok(JSON.parse(await page.locator('#modSvgContainer canvas').getAttribute('data-layout-audit')).calloutsInBounds,model+' etiquetas dentro');
 }
 await page.click('[data-mod-select="asad"]');const modelCanvas=page.locator('#modSvgContainer canvas');
 const old=await modelCanvas.getAttribute('data-curves');await page.locator('#modAsadG').evaluate(el=>{globalThis.testModelSlider=el;el.value=4;el.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForTimeout(480);assert.notEqual(await modelCanvas.getAttribute('data-curves'),old);assert.ok(await page.evaluate(()=>testModelSlider===document.querySelector('#modAsadG')));
 await page.evaluate(()=>location.hash='politica-economica');await page.click('[data-policy-section="trade"]');
 await page.selectOption('#policy-preset','mix');assert.equal(await page.locator('#policy-market canvas').count(),1);assert.equal(await page.locator('#policy-welfare canvas').count(),1);
 await page.click('#policy-zoom');assert.equal(await page.locator('#policyZoomDialog canvas').count(),2);await page.keyboard.press('Escape');
 await page.click('[data-policy-section="macro"]');assert.equal(await page.locator('#policy-macro-chart canvas').count(),1);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#policy-macro-G').evaluate(el=>{el.value=3;el.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.locator('#policy-macro-chart canvas').getAttribute('data-animating'),'false');
 for(const [width,height,theme] of [[1440,1000,'light'],[1672,941,'dark'],[390,844,'light'],[360,800,'dark']]){
  await page.setViewportSize({width,height});await page.evaluate(t=>MacroScope.setTheme(t),theme);
  for(const view of ['aprendizaje','modelos','politica-economica']){
   await page.evaluate(v=>location.hash=v,view);if(view==='politica-economica')await page.click('[data-policy-section="trade"]');
   await page.waitForTimeout(100);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,view+' sin overflow');
   const all=await page.locator('#'+view+' .economic-diagram canvas').evaluateAll(nodes=>nodes.map(c=>JSON.parse(c.dataset.layoutAudit||'null')).filter(Boolean));
   assert.ok(all.length>0);assert.ok(all.every(a=>a.tickFontPx>=11&&a.calloutsInBounds),view+' escalas y globos');
   await page.screenshot({path:`test-results/economic-${view}-${width}-${theme}.png`,fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);await writeFile('test-results/economic-diagrams-report.json',JSON.stringify({passed:true,errors}));console.log('Diagramas compartidos OK: input continuo, etapas, zoom/foco, geometría, temas y móvil');
}finally{await browser.close();}
