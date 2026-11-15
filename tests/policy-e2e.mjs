import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/^https?:/,r=>r.abort());
 await page.goto(new URL('../index.html#politica-economica',import.meta.url).href);
 assert.ok(await page.locator('#policy-panel-foundations').isVisible(),'La entrada debe explicar la política económica antes de simular');
 assert.match(await page.textContent('#policy-definition'),/autoridades públicas/);
 assert.equal(await page.locator('[data-policy-area]').count(),8);
 assert.equal(await page.locator('#policy-components article').count(),6);
 for(const area of ['fiscal','monetary','exchange','trade','financial','structural','social','environment']){
  await page.click(`[data-policy-area="${area}"]`);
  assert.equal(await page.locator(`[data-policy-area="${area}"]`).getAttribute('aria-pressed'),'true');
  assert.ok(await page.locator('#policy-area-detail a[target="_blank"]').count()>0,'Cada ámbito debe identificar su fuente');
  assert.match(await page.textContent('#policy-area-detail'),/Alcance en Macroscope/);
 }
 await page.selectOption('#policy-goal','sustainability');
 assert.match(await page.textContent('#policy-goal-reading'),/emisiones/i);
 await page.click('[data-policy-area="environment"]');
 assert.match(await page.textContent('#policy-area-detail'),/sin simulación numérica/i);
 await page.click('[data-policy-evaluate]');assert.equal(await page.locator('#policy-evaluation').evaluate(el=>el===document.activeElement),true);
 await page.click('[data-policy-area="fiscal"]');await page.click('[data-policy-foundation-target="macro"]');
 assert.ok(await page.locator('#policy-panel-macro').isVisible());
 await page.click('[data-policy-section="foundations"]');await page.click('[data-policy-area="trade"]');await page.click('[data-policy-foundation-target="trade"]');
 assert.ok(await page.locator('#policy-panel-trade').isVisible());
 assert.equal(await page.locator('#policy-preset').count(),1,'Debe existir una experiencia propia de Política económica');
 await page.selectOption('#policy-preset','tariff');
 assert.match(await page.textContent('#policy-results'),/60,0|60\.0/);
 await page.check('#policy-quotaEnabled');
 await page.locator('#policy-quota').evaluate(el=>{el.value=30;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.match(await page.textContent('#policy-regime'),/vinculante/);
 await page.click('#policy-zoom');assert.ok(await page.locator('#policyZoomDialog').isVisible());await page.keyboard.press('Escape');
 assert.equal(await page.locator('#policy-zoom').evaluate(el=>el===document.activeElement),true);
 await page.fill('#policy-package-name','Prueba <segura>');await page.click('#policy-save');
 await page.click('[data-policy-section="packages"]');
 assert.match(await page.textContent('#policy-saved'),/Prueba <segura>/);
 await page.locator('[data-policy-load]').first().click();assert.match(await page.textContent('#policy-regime'),/vinculante/);
 const download=page.waitForEvent('download');await page.click('#policy-export');const file=await download;assert.match(file.suggestedFilename(),/\.csv$/);
 const csv=await readFile(await file.path(),'utf8');assert.match(csv,/resultado_teorico,price,UM\/unidad/);assert.match(csv,/fao.org/);
 for(const [key,value] of [['worldPrice',80],['demandSlope',1.4],['supplySlope',1.4]])await page.locator('#policy-'+key).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 assert.ok(await page.locator('#policy-error').isVisible());assert.ok(await page.locator('#policy-save').isDisabled());
 await page.click('[data-policy-section="packages"]');assert.ok(await page.locator('[data-policy-capture="A"]').isDisabled());
 await page.click('[data-policy-section="trade"]');await page.selectOption('#policy-preset','mix');
 await page.click('[data-policy-section="macro"]');
 await page.selectOption('#policy-macro-mobility','perfect');
 await page.locator('#policy-macro-G').evaluate(el=>{el.value=3;el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await page.locator('#policy-macro-result').getAttribute('data-dy'),'0.000000');
 await page.selectOption('#policy-macro-regime','closed');assert.ok(await page.locator('#policy-macro-mobility').isDisabled());
 await page.selectOption('#policy-macro-regime','fixed');assert.ok(await page.locator('#policy-macro-M').isDisabled());
 await page.selectOption('#policy-macro-regime','flex');
 await page.click('[data-policy-section="library"]');await page.fill('#policy-search','arancel');assert.ok(await page.locator('#policy-library .policy-instrument').count()<12);assert.match(await page.textContent('#policy-library'),/Arancel/);
 await page.click('[data-policy-section="cases"]');await page.selectOption('#policy-case-answer','subsidy');await page.click('#policy-case-check');assert.match(await page.textContent('#policy-case-feedback'),/Correcto/);
 await page.click('[data-policy-section="trade"]');
 await page.selectOption('#policy-preset','mix');await page.fill('#policy-package-name','');
 await page.locator('#toastContainer').waitFor({state:'hidden'});
 for(const [w,h,theme] of [[1440,1000,'light'],[1672,941,'dark'],[390,844,'light'],[360,800,'dark']]){
  await page.setViewportSize({width:w,height:h});await page.evaluate(t=>MacroScope.setTheme(t),theme);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,'Sin overflow a '+w);
  await page.screenshot({path:`test-results/policy-${w}-${theme}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>MacroScope.setTheme('light'));
 for(const section of ['foundations','packages','macro','library','cases','method']){
  await page.click(`[data-policy-section="${section}"]`);if(section==='library')await page.fill('#policy-search','');
  await page.screenshot({path:`test-results/policy-section-${section}.png`,fullPage:true});
 }
 for(const [width,height,theme] of [[390,844,'light'],[360,800,'dark'],[1672,941,'dark']]){
  await page.setViewportSize({width,height});await page.evaluate(t=>MacroScope.setTheme(t),theme);await page.click('[data-policy-section="foundations"]');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=2,'Fundamentos sin overflow en '+width);
  await page.screenshot({path:`test-results/policy-foundations-${width}-${theme}.png`,fullPage:true});
 }
 await page.setViewportSize({width:1440,height:1000});await page.evaluate(()=>MacroScope.setTheme('light'));
 await page.locator('#policy-tab-foundations').focus();await page.keyboard.press('ArrowRight');assert.ok(await page.locator('#policy-panel-trade').isVisible());
 assert.equal(await page.locator('#policy-preset').inputValue(),'mix','La guía conserva el paquete configurado');
 await page.click('[data-policy-section="foundations"]');await page.reload();assert.ok(await page.locator('#policy-panel-foundations').isVisible());
 await page.reload();assert.equal(await page.locator('.orbit-card').count(),8);
 await page.evaluate(()=>location.hash='inicio');await page.waitForSelector('#inicio',{state:'visible'});await page.locator('#homeCarousel').focus();await page.keyboard.press('End');assert.match(await page.textContent('.orbit-card.is-active h2'),/Política/);
 await page.keyboard.press('Enter');await page.waitForSelector('#politica-economica',{state:'visible'});
 await page.evaluate(()=>location.hash='inicio');await page.waitForSelector('#inicio',{state:'visible'});await page.locator('#homeCarousel').focus();await page.keyboard.press('End');
 await page.waitForTimeout(650);await page.screenshot({path:'test-results/policy-inicio-card.png',fullPage:true});
 await page.evaluate(()=>localStorage.setItem('macroscope_policy_packages_v1',JSON.stringify({version:1,items:[{id:'invalid',name:'Sin parámetros'}]})));
 await page.reload();assert.deepEqual(errors,[],'Un paquete local incompleto no debe impedir arrancar la plataforma');
 await writeFile('test-results/policy-e2e-report.json',JSON.stringify({passed:true,errors,sizes:[1440,1672,390,360]}));
 console.log('Policy E2E OK: instrumentos, paquetes, persistencia, exportación, macro, casos y ocho destinos');
}finally{await browser.close();}
