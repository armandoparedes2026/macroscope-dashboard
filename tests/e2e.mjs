// End-to-end checks on the real page in headless Chromium, with outbound network fully controlled:
// every external request is either blocked (offline/fallback mode) or answered with a fixture.
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('test-results', {recursive:true});
const PAGE_URL = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch();
let failures = 0;
let checks = 0;

async function check(name, fn) {
  if(process.env.E2E_FILTER&&!name.includes(process.env.E2E_FILTER))return;
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error'&&!/Failed to load resource|net::|Access to fetch/.test(message.text()))errors.push(message.text());});
  try {
    await fn(page, context);
    assert.deepEqual(errors, [], 'errores de JavaScript en la página');
    checks++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    console.error(`  ✗ ${name}\n    ${err.message.split('\n').join('\n    ')}`);
  } finally {
    await context.close();
  }
}

async function openOffline(page) {
  await page.route(/^https?:/, (route) => route.abort());
  await page.goto(PAGE_URL);
  await page.waitForFunction(() => document.getElementById('apiStatusText').textContent === 'Respaldo local — no actualizado');
  await page.evaluate(()=>{location.hash='panorama';});
  await page.waitForFunction(()=>!document.querySelector('#tab-overview').hidden);
}

const deltaClass = (page, title) =>
  page.getByRole('button', {name:`Explorar ${title==='Inflación'?'Inflación (IPC)':title}:`}).locator('.kpi-delta').getAttribute('class');

console.log('MacroScope e2e');

await check('modo sin conexión: respaldo local y gráficos alternativos', async (page) => {
  await openOffline(page);
  assert.equal(await page.evaluate(() => window.Chart.name), 'ChartFallback');
  assert.equal(await page.locator('.kpi-card').count(), 9);
  assert.ok(await page.locator('#macroTableBody td.cell-fallback').count() > 0, 'las celdas de respaldo deben marcarse');
});

await check('seis destinos visibles y navegación accesible', async page => {
  await openOffline(page);
  for(const route of ['inicio','laboratorio','panorama','comparacion','fuentes','ayuda']) {
    await page.click(`[data-route="${route}"]`);
    await page.waitForFunction(route=>!document.querySelector(`[data-view="${route}"]`).hidden,route);
    assert.equal(await page.isVisible(`[data-view="${route}"]`),true);
  }
  assert.equal(await page.isHidden('#tab-overview'),true);
});

await check('inicio orbital: siete módulos, flechas, teclado, enlaces y accesibilidad',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  assert.equal(await page.locator('.orbit-card').count(),7);
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Exploración macroeconómica');
  await page.click('#homeNext');
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías');
  assert.equal(await page.locator('[data-home-dot="4"]').getAttribute('aria-pressed'),'true');
  await page.locator('#homeCarousel').focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Exploración macroeconómica');
  await page.click('[data-home-dot="0"]');
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Aprendizaje guiado');
  assert.equal(await page.locator('.orbit-card-open:visible').count(),1);
  await page.locator('.orbit-card-open:visible').click();
  await page.waitForFunction(()=>!document.querySelector('[data-view="aprendizaje"]').hidden);
});

await check('comparación de economías abre pantalla independiente desde Inicio',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  await page.locator('#homeCarousel').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(()=>document.querySelector('.orbit-card.is-active h2')?.textContent==='Comparación de economías');
  await page.locator('.orbit-card.is-active .orbit-card-open').focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>location.hash==='#comparacion');
  await page.waitForFunction(()=>!document.querySelector('[data-view="comparacion"]').hidden);
  assert.equal(await page.isVisible('[data-view="comparacion"]'),true,'la sección debe estar visible');
  assert.equal(await page.getAttribute('[data-route="comparacion"]','aria-current'),'page','el enlace debe marcarse activo');
  for(const id of ['cd-filters','cd-kpis','cd-chart','cd-ranking','cd-export']){
    assert.equal(await page.locator(`#${id}`).count(),1,`falta ${id}`);
  }
  await page.click('[data-route="panorama"]');
  await page.waitForFunction(()=>document.querySelector('[data-view="comparacion"]').hidden);
  assert.equal(await page.isHidden('[data-view="comparacion"]'),true,'al volver a Panorama debe ocultarse Comparación');
});

await check('comparación premium: series WDI, ranking anual y vistas interactivas',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='comparacion';});
  await page.waitForFunction(()=>!document.querySelector('#comparacion').hidden);
  await page.waitForFunction(()=>document.querySelectorAll('#cd-kpis .cd-kpi').length===6,null,{timeout:3500});
  assert.equal(await page.locator('#cd-countries .cd-chip').count(),4);
  assert.equal(await page.locator('#cd-countries .cd-flag').count(),4,'las banderas deben tener gráficos locales, sin depender de emoji del sistema');
  assert.match(await page.textContent('#cd-ranking'),/Perú|Chile|Colombia|México/);
  assert.match(await page.textContent('#cd-status'),/Banco Mundial|respaldo local/i);
  assert.doesNotMatch(await page.textContent('#cd-status'),/\[object Object\]/);
  assert.ok(await page.locator('#cd-map svg').count()>0,'debe haber un mapa orientativo vectorial');
  assert.equal(await page.locator('#cd-map svg[aria-hidden="true"] [tabindex]').count(),0,'un mapa decorativo no puede contener controles ocultos a lectores de pantalla');
  assert.ok(await page.locator('#cd-table-body tr').count()>=6);
  await page.selectOption('#cd-indicator','FP.CPI.TOTL.ZG');
  assert.match(await page.textContent('#cd-chart-title'),/Inflación/);
  await page.click('[data-cd-mode="ranking"]');
  assert.equal(await page.getAttribute('#comparacion','data-mode'),'ranking');
  await page.click('[data-cd-mode="regions"]');
  assert.equal(await page.getAttribute('#comparacion','data-mode'),'regions');
  assert.match(await page.textContent('#cd-ranking-subtitle'),/región|grupo/i);
  await page.click('[data-cd-mode="indicators"]');
  assert.equal(await page.getAttribute('#comparacion','data-mode'),'indicators');
});

await check('comparación premium: economía única, límite cuatro y exportación trazable',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='comparacion';});
  await page.waitForFunction(()=>document.querySelectorAll('#cd-countries .cd-chip').length===4);
  assert.equal(await page.isDisabled('#cd-add-country'),true);
  await page.click('[data-cd-remove="MEX"]');
  assert.equal(await page.locator('#cd-countries .cd-chip').count(),3);
  await page.selectOption('#cd-add-country','BRA');
  assert.equal(await page.locator('#cd-countries .cd-chip').count(),4);
  assert.equal(await page.locator('#cd-countries [data-cd-remove="BRA"]').count(),1);
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('#cd-export')]);
  const csv=(await readFile(await download.path(),'utf8')).replace(/^\uFEFF/,'');
  assert.match(csv,/"pais_iso3","indicador_codigo","anio","valor","unidad","procedencia"/);
  assert.match(csv,/"PER","NY\.GDP\.MKTP\.KD\.ZG","\d{4}","[^"\n]+","% anual","respaldo_local"/);
  assert.ok(!csv.includes(',undefined,'));
});

await check('comparación premium: datos actualizados y móvil sin overflow',async page=>{
  await openOffline(page);
  await page.setViewportSize({width:360,height:800});
  await page.evaluate(()=>{location.hash='comparacion';});
  await page.waitForFunction(()=>document.querySelectorAll('#cd-kpis .cd-kpi').length===6);
  const audit=()=>page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth,boxes:['#comparacion','.cd-shell','.cd-secondary-grid','.cd-data-table','.cd-table-scroll','.cd-table-scroll table'].map(q=>{const el=document.querySelector(q);const r=el.getBoundingClientRect();return {q,width:Math.round(r.width),right:Math.round(r.right),overflow:getComputedStyle(el).overflowX,scroll:el.scrollWidth};}),offenders:[...document.querySelectorAll('#comparacion *')].filter(el=>el.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(el=>({tag:el.tagName,cls:el.className?.baseVal??el.className,right:Math.round(el.getBoundingClientRect().right)}))}));
  assert.equal((await audit()).scroll<=360+1,true,JSON.stringify(await audit()));
  await page.evaluate(()=>{
    const M=globalThis.MacroScope;
    const latest=M.latestAvailable(M.runtimeDB.PER['NY.GDP.MKTP.KD.ZG'],M.YEARS);
    M.runtimeDB.PER['NY.GDP.MKTP.KD.ZG'][latest.year]=99.5;
    M.renderAll();
  });
  assert.match(await page.textContent('#cd-kpis'),/99\.5/);
  await page.click('#themeBtn');
  assert.equal(await page.getAttribute('html','data-theme'),'dark');
  assert.equal((await audit()).scroll<=360+1,true,JSON.stringify(await audit()));

});

await check('home premium: rueda del mouse con cooldown, dirección inversa y enlaces funcionales',async page=>{
  await page.setViewportSize({width:1440,height:900});
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  await page.locator('.orbit-stage').hover();
  await page.mouse.wheel(0,110);
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías');
  await page.mouse.wheel(0,260); // inercia: no debe adelantar otra tarjeta
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías');
  await page.waitForTimeout(650);
  await page.mouse.wheel(0,-110);
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Exploración macroeconómica');
  assert.equal(await page.evaluate(()=>scrollY),0,'el scroll sobre el carrusel no desplaza la página');
  await page.locator('#homeCarousel').focus();
  await page.keyboard.press('Home');
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Aprendizaje guiado');
  await page.keyboard.press('End');
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Modelos y tendencias');
});

await check('home premium: arrastre horizontal continuo con mouse, retorno y prevención de clics accidentales',async page=>{
  await page.setViewportSize({width:1440,height:900});
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  const first=page.locator('.orbit-card.is-active');
  const rect=await first.boundingBox();
  const x=rect.x+rect.width*.50;
  const y=rect.y+rect.height*.68; // gráfico, sin tocar el botón de acceso
  await page.mouse.move(x,y);
  await page.mouse.down();
  await page.mouse.move(x-85,y,{steps:12});
  assert.equal(await page.locator('.orbit-stage.is-dragging').count(),1);
  const displaced=await first.evaluate(el=>({
    drag:parseFloat(el.style.getPropertyValue('--orbit-drag')),
    tilt:parseFloat(el.style.getPropertyValue('--orbit-drag-angle'))
  }));
  assert.ok(displaced.drag< -40,'la tarjeta debe moverse mientras se arrastra: '+JSON.stringify(displaced));
  assert.ok(displaced.tilt< -1,'la tarjeta debe girar con el puntero');
  await page.mouse.up();
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías');
  assert.equal(await page.locator('.orbit-stage.is-dragging').count(),0);
  assert.equal(await page.locator('.orbit-card.is-active').evaluate(el=>el.style.getPropertyValue('--orbit-drag')),'0px');
  await page.waitForTimeout(400);
  const second=await page.locator('.orbit-card.is-active').boundingBox();
  const x2=second.x+second.width*.5,y2=second.y+second.height*.65;
  await page.mouse.move(x2,y2);
  await page.mouse.down();
  await page.mouse.move(x2+95,y2,{steps:10});
  await page.mouse.up();
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Exploración macroeconómica');
  await page.waitForTimeout(400);
  const same=await page.locator('.orbit-card.is-active').boundingBox();
  const x3=same.x+same.width*.5,y3=same.y+same.height*.67;
  await page.mouse.move(x3,y3);await page.mouse.down();
  await page.mouse.move(x3-18,y3,{steps:5});await page.mouse.up();
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Exploración macroeconómica',
    'un arrastre corto debe devolver las tarjetas a su posición, sin navegar');
});

await check('home premium: gesto táctil horizontal cambia tarjeta, gesto vertical no secuestra scroll',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  await page.evaluate(()=>{
    const stage=document.querySelector('.orbit-stage');
    const pointer=(type,x,y)=>stage.dispatchEvent(new PointerEvent(type,{
      bubbles:true,pointerId:77,pointerType:'touch',clientX:x,clientY:y,isPrimary:true
    }));
    pointer('pointerdown',220,340);
    pointer('pointermove',132,342);
    if(!stage.classList.contains('is-dragging')) throw Error('touch drag no reconocido');
    pointer('pointerup',112,343);
  });
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías');
  await page.evaluate(()=>{
    const stage=document.querySelector('.orbit-stage');
    const pointer=(type,x,y)=>stage.dispatchEvent(new PointerEvent(type,{
      bubbles:true,pointerId:78,pointerType:'touch',clientX:x,clientY:y,isPrimary:true
    }));
    pointer('pointerdown',220,300);
    pointer('pointermove',211,425);
    pointer('pointerup',212,450);
  });
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),'Comparación de economías',
    'la intención vertical no debe cambiar de tarjeta');
});

await check('home premium: botón de tema solo icono y mini ilustraciones SVG diferenciadas',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='inicio';});
  await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  assert.equal(await page.locator('.orbit-illustration').count(),7);
  assert.equal(await page.locator('.orbit-illustration filter').count(),14);
  const semantics=[
    ['learning','.ms-book-leaf-left','.ms-book-leaf-right'],
    ['history','.ms-history-line','.ms-history-grid'],
    ['indicators','.ms-map-ghost','.ms-indicator-bars'],
    ['exploration','.ms-explore-bars','.ms-exploration-curve'],
    ['comparison','.ms-map-network','.ms-map-nodes'],
    ['simulation','.ms-decision-curves','.ms-decision-marker'],
    ['trends','.ms-wave-ribbons','.ms-projection-line']
  ];
  const kinds=await page.locator('.orbit-illustration').evaluateAll(nodes=>nodes.map(n=>n.dataset.chartKind));
  assert.deepEqual(kinds,semantics.map(row=>row[0]),'cada tarjeta debe tener su propio concepto gráfico');
  for(const [type,primary,secondary] of semantics){
    const card=page.locator('.orbit-illustration[data-chart-kind="'+type+'"]');
    assert.equal(await card.locator(primary).count(),1,type+' gráfico principal');
    assert.equal(await card.locator(secondary).count(),1,type+' contexto propio');
  }
  assert.equal(await page.locator('.orbit-illustration .ms-prism').count(),9,
    'solo indicadores (4) y exploración (5) incluyen barras 3D');
  assert.equal(await page.locator('.orbit-illustration[data-chart-kind="comparison"] .ms-prism').count(),0);
  assert.equal(await page.locator('.orbit-illustration[data-chart-kind="learning"] .ms-prism').count(),0);
  assert.equal(await page.locator('.orbit-illustration[data-chart-kind="simulation"] .ms-prism').count(),0);
  const defsValid=await page.locator('.orbit-illustration').evaluateAll(nodes=>{
    const gradientIds=nodes.flatMap(svg=>[...svg.querySelectorAll('linearGradient,radialGradient')]
      .map(node=>node.id));
    return gradientIds.length===42&&new Set(gradientIds).size===gradientIds.length;
  });
  assert.equal(defsValid,true,'las siete tarjetas usan 42 gradientes independientes sin colisiones');
  assert.equal(await page.locator('.orbit-illustration[role="img"]').count(),7);
  const vectors=await page.locator('.orbit-illustration').evaluateAll(nodes=>nodes.map(node=>node.querySelectorAll('path,rect,circle,ellipse').length));
  assert.ok(vectors.every(count=>count>=7),'las siete ilustraciones contienen gráficos vectoriales detallados');
  await page.evaluate(()=>MacroScope.setTheme('light'));
  const button=page.locator('#themeBtn');
  await page.waitForFunction(()=>document.getElementById('themeBtn').getAttribute('aria-label')==='Cambiar a modo oscuro');
  let style=await button.evaluate(el=>({border:getComputedStyle(el).borderStyle,background:getComputedStyle(el).backgroundColor,borderRadius:getComputedStyle(el).borderRadius}));
  assert.equal(style.border,'none');
  assert.ok(Number(style.background.match(/[\d.]+(?=\))/)?.[0] || 0)<.15,'fondo de hover casi transparente');
  assert.equal(style.borderRadius,'50%');
  await button.click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
  assert.equal(await button.getAttribute('aria-label'),'Cambiar a modo claro');
  await button.click();
  await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
});


await check('home premium: los siete artes son específicos, legibles y conservan referencias SVG accesibles',async page=>{
  for(const [width,height] of [[390,844],[1440,900]]){
    await page.setViewportSize({width,height});
    await openOffline(page);
    await page.evaluate(()=>{location.hash='inicio';});
    await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
    const semantics=await page.locator('.orbit-illustration.module-art').evaluateAll(svgs=>
      svgs.map(svg=>({
        kind:svg.dataset.chartKind,
        title:svg.getAttribute('aria-label'),
        uniqueDefs:[...svg.querySelectorAll('linearGradient,radialGradient,filter')].map(x=>x.id),
        nonEmpty:svg.querySelectorAll('path,rect,ellipse,circle').length>=5
      }))
    );
    assert.equal(semantics.length,7);
    assert.ok(semantics.every(x=>x.title&&x.nonEmpty));
    const allIds=semantics.flatMap(x=>x.uniqueDefs);
    assert.equal(allIds.length,new Set(allIds).size,'no debe haber ID SVG duplicado');
    const active=page.locator('.orbit-card.is-active');
    const box=await active.locator('.orbit-illustration').boundingBox();
    const parent=await active.boundingBox();
    assert.ok(box.height>=70&&box.y>parent.y+parent.height*.42,
      'el gráfico debe estar en el tercio inferior a '+width);
  }
});

await check('home premium: composición responsive y preferencia de movimiento reducido',async page=>{
  for(const [width,height] of [[360,740],[390,844],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    await openOffline(page);
    await page.evaluate(()=>{location.hash='inicio';});
    await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
    const metrics=await page.evaluate(()=>{
      const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};};
      return {viewport:innerHeight,horizontalOverflow:document.documentElement.scrollWidth-innerWidth,
        documentHeight:document.documentElement.scrollHeight,bodyHeight:document.body.scrollHeight,landing:rect('.landing-premium'),intro:rect('.landing-intro'),stage:rect('.orbit-stage'),footer:rect('.orbit-footer'),cta:rect('.landing-cta'),
        benefits:rect('.landing-trust'),card:rect('.orbit-card.is-active'),
        duration:getComputedStyle(document.querySelector('.orbit-card')).transitionDuration};
    });
    assert.ok(metrics.horizontalOverflow<=0,'sin desbordamiento horizontal a '+width);
    assert.ok(metrics.card.top>=0&&metrics.card.bottom<=height,'card principal visible a '+width);
    assert.ok(metrics.cta.top>=0&&metrics.cta.bottom<=height+2,'CTA visible a '+width);
    assert.equal(metrics.duration,'0s','respetar reduce motion a '+width);
    if(width>=1280) assert.ok(metrics.documentHeight<=height+2,'hero sin scroll vertical a '+width+'x'+height+': '+JSON.stringify(metrics));
    if(width===390) assert.ok(metrics.benefits.bottom<=height+2,'beneficios en pantalla a 390x844');
  }
});

await check('color de la variación según si subir es bueno o malo', async (page) => {
  await openOffline(page);
  await page.selectOption('#countrySelect', 'USA');
  // Current WDI: USA unemployment rises and GDP per capita rises.
  assert.match(await deltaClass(page, 'Tasa de Desempleo'), /negative/);
  assert.match(await deltaClass(page, 'PBI per Cápita'), /positive/);
  await page.selectOption('#countrySelect', 'PER');
  // Current WDI: Peru annual-average inflation falls.
  assert.match(await deltaClass(page, 'Inflación'), /positive/);
});

await check('inflación clasificada frente a la meta del banco central', async (page) => {
  await openOffline(page);
  const pulse = page.locator('.pulse-card', { hasText: 'Inflación anual' });
  assert.match(await pulse.textContent(), /Meta BCRP: 2% ± 1 pp/);
  assert.match(await pulse.textContent(), /En meta/);
  await page.selectOption('#countrySelect', 'COL');
  assert.match(await pulse.textContent(), /Sobre meta/); // WDI 2025: 5.1% vs 3% ± 1.
});

await check('el país no puede compararse consigo mismo', async (page) => {
  await openOffline(page);
  await page.selectOption('#benchmarkSelect', 'USA');
  await page.selectOption('#countrySelect', 'USA');
  assert.equal(await page.inputValue('#benchmarkSelect'), 'LCN');
  assert.equal(await page.locator('#benchmarkSelect option[value="USA"]').isDisabled(), true);
  assert.equal(await page.locator('#benchmarkSelect option[value="BRA"]').count(), 1);
});

const openModel = async (page) => {
  await openOffline(page);
  await page.evaluate(()=>{location.hash='laboratorio';});
  await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
  await page.waitForFunction(() => document.querySelectorAll('#islmResults tr').length > 0);
};
const cell = (page, variable, col) => page.textContent(`#islmResults tr[data-var="${variable}"] .${col}`);

await check('IS–LM: calibración con datos del país y cuatro diagramas dibujados', async (page) => {
  await openModel(page);
  assert.match(await page.textContent('#islmCalibration'), /Perú.*BCRP/);
  assert.equal(await cell(page, 'Y', 'v2'), '100.0');
  for (const id of ['islmPanelISLM', 'islmPanelMF', 'islmPanelMoney', 'islmPanelCross']) {
    const painted = await page.$eval(`#${id}`, (c) => {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k]) n++;
      return n;
    });
    assert.ok(painted > 1000, `${id} debe estar dibujado`);
  }
});

await check('Mundell–Fleming flexible con movilidad perfecta: la política fiscal no mueve Y y aprecia', async (page) => {
  await openModel(page);
  await page.selectOption('#islmMobility', 'perfect');
  await page.click('[data-preset="fiscal"]');
  assert.equal(await cell(page, 'Y', 'dv'), '0.0 %');
  assert.match(await cell(page, 'e', 'dv'), /^−/);
  assert.match(await page.textContent('#islmNarrative'), /Resultado clásico de Mundell–Fleming/);
  // Playwright's isDisabled() does not report <option> state, so read the DOM property.
  assert.equal(await page.$eval('#islmInstrument option[value="rate"]', (o) => o.disabled), true, 'trilema: sin regla de tasa');
});

await check('tipo de cambio fijo: M endógena, devaluación disponible y política fiscal eficaz', async (page) => {
  await openModel(page);
  await page.selectOption('#islmMobility', 'perfect');
  await page.selectOption('#islmRegime', 'fixed');
  assert.equal(await page.isDisabled('#islm-Mpct'), true);
  assert.equal(await page.isDisabled('#islmInstrument'), true);
  assert.equal(await page.isDisabled('[data-preset="devaluation"]'), false);
  assert.equal(await page.isDisabled('[data-preset="monetary"]'), true);
  assert.match(await page.textContent('#islmClasses [data-class="endo"]'), /Oferta monetaria \(M\) y reservas/);
  assert.match(await page.textContent('#islmClasses [data-class="control"]'), /Tipo de cambio fijado/);
  await page.click('[data-preset="fiscal"]');
  const dY = parseFloat((await cell(page, 'Y', 'dv')).replace('+', ''));
  assert.ok(dY > 3, `ΔY = ${dY} debe ser grande con tipo de cambio fijo`);
  assert.match(await cell(page, 'M', 'dv'), /^\+/);
  assert.equal(await page.locator('#islmPolicyTable thead th.is-current').getAttribute('data-regime'), 'fixed');
});

await check('economía cerrada: sin Mundell–Fleming y con crowding out', async (page) => {
  await openModel(page);
  await page.selectOption('#islmRegime', 'closed');
  assert.equal(await page.isDisabled('[data-preset="fed"]'), true);
  assert.equal(await page.isDisabled('#islm-istar'), true);
  assert.equal(await page.locator('#islmResults tr[data-var="e"]').count(), 0);
  await page.click('[data-preset="fiscal"]');
  assert.match(await cell(page, 'Y', 'dv'), /^\+/);
  assert.match(await cell(page, 'I', 'dv'), /^−/);
  assert.match(await page.textContent('#islmNarrative'), /crowding out/);
});

await check('regla de tasa: mover la tasa de política cambia Y y M se acomoda', async (page) => {
  await openModel(page);
  await page.selectOption('#islmInstrument', 'rate');
  assert.equal(await page.isDisabled('#islm-ipol'), false);
  assert.equal(await page.isDisabled('#islm-Mpct'), true);
  await page.click('[data-preset="monetary"]');
  assert.match(await cell(page, 'Y', 'dv'), /^\+/);
  assert.match(await cell(page, 'M', 'dv'), /^\+/);
});

await check('CSV con columnas de procedencia', async (page) => {
  await openOffline(page);
  await page.evaluate(()=>{location.hash='panorama';});
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#exportCsvBtn')]);
  const csv = (await readFile(await download.path(), 'utf8')).replace(/^﻿/, '');
  const [header, firstRow] = csv.split('\r\n');
  assert.match(header, /NY\.GDP\.MKTP\.KD\.ZG,NY\.GDP\.MKTP\.KD\.ZG_fuente/);
  assert.match(firstRow, /,respaldo/);
});

await check('procedencia: los datos del API se distinguen del respaldo', async (page) => {
  await page.route(/^https?:/, (route) => {
    const url = route.request().url();
    if (url.includes('api.worldbank.org') && url.includes('NY.GDP.MKTP.KD.ZG')) {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([{ page: 1, pages: 1 }, [{ countryiso3code: 'PER', date: '2024', value: 3.05, indicator: { id: 'NY.GDP.MKTP.KD.ZG' }, country: { value: 'Peru' } }]]),
      });
    }
    return route.abort();
  });
  await page.goto(PAGE_URL+'#panorama');
  await page.waitForFunction(() => document.getElementById('apiStatusText').textContent === 'Conexión parcial · WDI');
  const row2024 = page.locator('#macroTableBody tr', { hasText: '2024' }).first();
  const cells = row2024.locator('td');
  assert.doesNotMatch(await cells.nth(1).getAttribute('class'), /cell-fallback/, 'PBI 2024 vino del API');
  assert.match(await cells.nth(2).getAttribute('class'), /cell-fallback/, 'IPC 2024 sigue en respaldo');
});

await check('tema persistente y única barra superior móvil', async page => {
  await openOffline(page);
  await page.evaluate(()=>MacroScope.setTheme('dark'));
  await page.click('#themeBtn');await page.reload();
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
  assert.ok(await page.locator('.topbar').evaluate(el=>el.getBoundingClientRect().height<=56));
  assert.equal(await page.locator('.mobile-nav').count(),0);
});
await check('lecturas fijas: sin temporizador ni pausa por foco, incluso con movimiento reducido',async page=>{
  await page.emulateMedia({reducedMotion:'reduce'});await openOffline(page);
  assert.equal(await page.locator('#insightGrid article').count(),3);
  assert.equal(await page.locator('#carouselNext,#carouselPrev,#insightCarousel').count(),0);
  assert.equal(await page.evaluate(()=>MacroScope.state.carouselTimer),undefined);
  assert.equal(await page.evaluate(()=>MacroScope.setupCarousel),undefined);
  await page.locator('#copyBriefBtn').focus();
  assert.ok(await page.locator('#insightGrid article').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).opacity==='1')));
});
for(const [width,height]of [[1440,900],[768,1024],[390,844],[360,740]]) {
  await check(`destinos de navegación y foco a ${width}px`,async page=>{
    await page.setViewportSize({width,height});await openOffline(page);
    for(const view of ['inicio','laboratorio','panorama','fuentes','ayuda']){
      await page.evaluate(view=>{location.hash=view;},view);
      await page.waitForFunction(view=>!document.querySelector(`[data-view="${view}"]`).hidden,view);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
      assert.equal(await page.evaluate(()=>document.activeElement.dataset.view),view);
    }
  });
}

await check('calibración: NX, NFI, CA separados y naturaleza explícita',async page=>{
  await openModel(page);
  assert.match(await page.textContent('#islmCalibration'),/propensión media × elasticidad-ingreso supuesta = 1/);
  assert.match(await page.textContent('#islmCalibration'),/supuesto ilustrativo/);
  assert.match(await page.textContent('#islmCalibration'),/NE.RSB.GNFS.ZS/);
  for(const key of ['NX','NFI','CA'])assert.equal(await page.locator(`#islmResults tr[data-var="${key}"]`).count(),1);
  await page.click('[data-preset="fiscal"]');
  assert.match(await cell(page,'i','dv'),/ pp$/);
  for(const key of ['Y','e','M'])assert.match(await cell(page,key,'dv'),/ %$/);
});

const wdiRow=(code,year,value)=>({countryiso3code:'PER',date:year,value,indicator:{id:code},country:{value:'Peru'}});
await check('WDI: paginación, nulos, último año real, caché y actualización manual',async page=>{
  let calls=0;
  await page.route(/^https?:/,route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='api.worldbank.org'&&url.pathname.includes('NE.IMP.GNFS.ZS')) {
      calls++;
      const pageNumber=Number(url.searchParams.get('page'));
      return route.fulfill({contentType:'application/json',body:JSON.stringify([{page:pageNumber,pages:2},[wdiRow('NE.IMP.GNFS.ZS',pageNumber===1?'2025':'2023',pageNumber===1?null:19.75)]])});
    }
    return route.abort();
  });
  await page.goto(PAGE_URL+'#panorama');
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  assert.equal(calls,2);
  assert.deepEqual(await page.evaluate(()=>MacroScope.getLatestYearAndValue('PER','NE.IMP.GNFS.ZS').year),'2023');
  assert.equal(await page.evaluate(()=>MacroScope.runtimeDB.PER['NE.IMP.GNFS.ZS']['2025']),null);
  await page.reload();
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  assert.equal(calls,2,'caché vigente evita red');
  await page.click('#syncApiBtn');
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  assert.equal(calls,4,'actualización manual evita caché');
  await page.evaluate(()=>{const key='macroscope_wdi_v2_NE.IMP.GNFS.ZS';const d=JSON.parse(localStorage.getItem(key));d.fetchedAt='2000-01-01T00:00:00Z';localStorage.setItem(key,JSON.stringify(d));});
  await page.reload();
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  assert.equal(calls,6,'caché vencida se renueva');
});

await check('WDI: respuesta malformada reintenta dos veces y conserva respaldo',async page=>{
  let calls=0;
  await page.route(/^https?:/,route=>{
    if(route.request().url().includes('api.worldbank.org')) {calls++;return route.fulfill({contentType:'application/json',body:JSON.stringify([{page:1,pages:1},[{date:'2025',value:'inválido'}]])});}
    return route.abort();
  });
  await page.goto(PAGE_URL+'#panorama');
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  assert.equal(calls,27);
  assert.equal(await page.textContent('#apiStatusText'),'Respaldo local — no actualizado');
});

for(const mode of ['success','failure','malformed']) {
  await check(`BCRP: ${mode}`,async page=>{
    const fixture=JSON.parse(await readFile(new URL('./fixtures/bcrp-normalized.json',import.meta.url),'utf8'));
    await page.route(/^https?:/,route=>{
      if(route.request().url().includes('/api/bcrp'))return route.fulfill({status:mode==='failure'?502:200,contentType:'application/json',body:JSON.stringify(mode==='success'?fixture:mode==='malformed'?{unexpected:true}:{error:'No disponible'})});
      return route.abort();
    });
    await page.goto(PAGE_URL);
    await page.waitForFunction(()=>!document.querySelector('#bcrpResults').textContent.includes('Consultando'));
    assert.match(await page.textContent('#bcrpResults'),mode==='success'?/PD04722MM.*Fuente: BCRP/:/BCRP no disponible/);
    if(mode==='success'){
      assert.deepEqual(await page.locator('.bcrp-card h3').allTextContents(),['Tasa de referencia','IPC Lima interanual','Tipo de cambio interbancario','Reservas internacionales netas']);
      assert.match(await page.locator('.bcrp-card').nth(1).textContent(),/PN01273PM.*IPC del mes frente al mismo mes/);
      assert.doesNotMatch(await page.textContent('#bcrpResults'),/\d{4}-\d{2}-\d{2}T/);
    }
  });
}

for(const width of [1440,768,390,360]) {
  await check(`comparador: cuatro economías, IPC ausente y años comunes a ${width}px`,async page=>{
    await page.setViewportSize({width,height:900});
    await page.emulateMedia({reducedMotion:'reduce'});
    await openOffline(page);
    for(const [i,code]of ['ARG','BOL','USA','CHN'].entries())await page.selectOption(`#compareCountry${i}`,code);
    assert.deepEqual(await page.evaluate(()=>MacroScope.comparison.countries),['ARG','BOL','USA','CHN']);
    await page.selectOption('#compareIndicator','FP.CPI.TOTL.ZG');
    await page.selectOption('#compareStart','2014');
    await page.selectOption('#compareEnd','2025');
    for(const year of ['2014','2015','2016','2017'])assert.equal(await page.locator('#compareTableBody tr').filter({has:page.locator('th',{hasText:year})}).locator('td').first().textContent(),'sin dato');
    assert.match(await page.textContent('#compareMissing'),/Argentina: sin dato en 2014, 2015, 2016, 2017/);
    assert.equal(await page.locator('#compareMode option[value="base"]').evaluate(option=>option.disabled),true);
    assert.equal(await page.locator('#compareTableHead th').count(),5);
    await page.check('#compareCommon');
    assert.match(await page.textContent('#compareMissing'),/Años comunes: 7\/12/);
    assert.equal(await page.locator('#compareTableBody tr').count(),12,'el aviso y tabla conservan ausencias excluidas del gráfico');
    await page.locator('#comparisonPanel').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    await page.locator('#comparisonPanel').screenshot({path:`test-results/compare-${width}.png`,style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}'});
    await page.selectOption('#compareIndicator','NY.GDP.PCAP.PP.KD');
    await page.selectOption('#compareMode','base');
    const firstRow=await page.locator('#compareTableBody tr').first().locator('td').allTextContents();
    assert.deepEqual(firstRow,['100','100','100','100']);
    await page.selectOption('#compareMode','convergence');
    assert.equal(await page.locator('#compareTableBody tr').first().locator('td').nth(2).textContent(),'100');
    await page.selectOption('#compareIndicator','NY.GDP.MKTP.KD.ZG');
    assert.equal(await page.inputValue('#compareMode'),'raw','cambiar indicador restablece una transformación compatible');
    await page.selectOption('#compareMode','cumulative');
    assert.match(await page.textContent('#compareSubtitle'),/acumulado/);
    await page.selectOption('#compareCountry3','');
    assert.equal(await page.locator('#compareTableHead th').count(),4);
  });
}
await check('economías nuevas y agregado: referencias explícitas y sin calibración LCN',async page=>{
  await openOffline(page);
  assert.equal(await page.locator('#countrySelect option[value="LCN"]').count(),0);
  assert.equal(await page.locator('#benchmarkSelect option[value="LCN"]').count(),1);
  for(const code of ['ECU','DEU','ESP','ARG']) {
    await page.selectOption('#countrySelect',code);
    assert.match(await page.textContent('#pulseStrip'),/Sin meta de inflación de referencia/);
    assert.match(await page.textContent('#islmCalibration'),/supuesto ilustrativo/);
  }
});

await mkdir('test-results/fase3', {recursive:true});
const settleLab = page => page.waitForFunction(() => [...document.querySelectorAll('.islm-panel canvas')].every(c => c.dataset.animating === 'false'));
const verifyDrawnEquilibria = async page => {
  await settleLab(page);
  const checks = await page.evaluate(() => {
    const {model,u} = MacroScope.labs.islm.snapshot();
    const E = [model.solve(model.baseline),model.solve(u,'impact'),model.solve(u,'final')];
    return ['islmPanelISLM','islmPanelMF','islmPanelMoney','islmPanelCross'].flatMap((id,index) => {
      const points = JSON.parse(document.getElementById(id).dataset.points);
      if (!model.open && index===1) return [];
      return points.map(p => {
        const e = E[{'E₀':0,'E₁':1,'E₂':2}[p.label]];
        return Math.abs(p.x-(index===2?e.M:e.Y)) < 1e-9 && Math.abs(p.y-(index===0||index===2?e.i:index===1?e.e:e.Y)) < 1e-9;
      });
    });
  });
  assert.ok(checks.length >= 9 && checks.every(Boolean), 'los puntos dibujados deben coincidir con solve() después de la interpolación');
};
await check('laboratorio: predecir, ejecutar, calificar, niveles y comparación de regímenes', async page => {
  await openModel(page);
  await page.locator('#islmGuided>summary').click();
  await page.click('#islmRun');
  assert.match(await page.textContent('#islmGrade'),/Completa/);
  await page.selectOption('[data-predict="Y"]','1');
  await page.selectOption('[data-predict="i"]','1');
  await page.click('#islmRun');
  assert.match(await page.textContent('#islmGrade'),/Calificación: 2\/2/);
  for (const level of ['intro','intermediate','advanced']) {
    await page.selectOption('#islmLevel',level);
    const expected = await page.evaluate(level => MacroScope.LAB_CONTENT.SCENARIOS[0].levels[level],level);
    assert.ok((await page.textContent('#islmTheory')).includes(expected));
    assert.equal(await page.isVisible('#islmEquations'),level==='advanced');
  }
  assert.match(await page.textContent('#islmEquations'),/dY\/dG = 1/);
  await verifyDrawnEquilibria(page);
  await page.selectOption('#islmScenario','fiscal-regimes');
  await page.selectOption('[data-predict="Y"]','0');
  await page.click('#islmRun');
  assert.match(await page.textContent('#islmGrade'),/Calificación: 1\/1/);
  assert.equal(await page.locator('#islmRegimeCompare section').count(),2);
  assert.match(await page.textContent('#islmRegimeCompare'),/Régimen flexible.*Régimen fijo/s);
  await verifyDrawnEquilibria(page);
  await page.locator('#islmGuided').screenshot({path:'test-results/fase3/escenario-guiado-completo.png',style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}'});
  await page.click('#islmWhy');
  assert.equal(await page.isVisible('#islmHelp'),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.isVisible('#islmHelp'),false);
});
await check('laboratorio: A/B inmutable, capas, unidades y reduced-motion', async page => {
  await openModel(page);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.click('#islmSaveA');
  await page.click('[data-preset="fiscal"]');
  const a = await page.textContent('#islmResults [data-var="Y"] .va');
  assert.equal(a,'100.00');
  assert.match(await cell(page,'i','dv'),/ pp$/);
  assert.match(await page.textContent('#islmResults [data-var="Y"] .dab'),/%$/);
  await verifyDrawnEquilibria(page);
  assert.equal(await page.getAttribute('#islmPanelISLM','data-motion'),'reduced');
  await page.uncheck('[data-curve="--blue"]');
  await settleLab(page);
  assert.ok(await page.$eval('#islmPanelISLM',c=>JSON.parse(c.dataset.curves).every(l=>l.color!=='--blue')));
  await page.check('[data-curve="--blue"]');
  await page.uncheck('#islmInitial');
  assert.ok(await page.$eval('#islmPanelISLM',c=>JSON.parse(c.dataset.curves).every(l=>!l.initial)));
  await page.click('#islmClearA');
  assert.equal(await page.locator('#islmResults .va').count(),0);
  await page.click('#islmResetBtn');
  assert.equal(await cell(page,'Y','v2'),'100.0');
});
for (const width of [1440,768,390,360]) {
  await check(`laboratorio responsive ${width}: panel, diagramas y F15 operables`, async page => {
    await page.setViewportSize({width,height:1000});
    await openOffline(page);
    await page.evaluate(()=>{location.hash='laboratorio';});
    await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
    const panel=page.locator('.islm-controls');
    if (!(await panel.getAttribute('open')) && await panel.evaluate(el=>!el.open)) await panel.locator(':scope>summary').click();
    await page.selectOption('#islmRegime','fixed');
    await page.selectOption('#islmMobility','perfect');
    assert.ok(await page.locator('.islm-controls select').evaluateAll(nodes => nodes.every(el => {
      const ctx=document.createElement('canvas').getContext('2d');ctx.font=getComputedStyle(el).font;
      return ctx.measureText(el.selectedOptions[0].textContent).width <= el.clientWidth-38;
    })), 'los textos seleccionados caben dentro de sus controles');
    await page.click('[data-preset="fiscal"]');
    await verifyDrawnEquilibria(page);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    const boxes=await page.locator('.islm-panel').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,right:r.right,width:r.width};}));
    assert.ok(boxes.every(b=>b.width>200&&b.x>=0&&b.right<=width));
    const badge=await page.$eval('#apiStatusBadge',el=>({full:el.scrollWidth<=el.clientWidth,rect:el.getBoundingClientRect().right}));
    if(width<=390) {assert.ok(badge.full);assert.ok(badge.rect<=width);}
    if(width<1120) {
      await panel.screenshot({path:`test-results/fase3/parametros-${width}.png`,style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}'});
      await panel.locator(':scope>summary').click();
    }
    await settleLab(page);
    await page.locator('#tab-simulator').screenshot({path:`test-results/fase3/laboratorio-${width}.png`,style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}'});
    await page.locator('.islm-panel').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const s=getComputedStyle(document.querySelector('.islm-main>.chart-card'));return s.opacity==='1' && ['none','blur(0px)'].includes(s.filter); });
    await page.screenshot({path:`test-results/fase3/laboratorio-viewport-${width}.png`});
  });
}


// Student redesign: every view, seven widths, both themes, file:// and controlled offline data.
await mkdir('test-results/rediseno',{recursive:true});
const acceptance=[];
const contrast=(a,b)=>{
  const linear=hex=>hex.match(/[a-f\d]{2}/gi).slice(0,3).map(v=>{const n=parseInt(v,16)/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((sum,n,i)=>sum+n*[.2126,.7152,.0722][i],0);
  const x=linear(a),y=linear(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
for(const width of [360,390,768,1024,1280,1440,1920])for(const theme of ['light','dark']){
  await check(`A1–A13 matriz ${width}px ${theme}`,async page=>{
    const matrixErrors=[];page.on('pageerror',error=>matrixErrors.push(error.message));
    const height=width===390?844:900;
    await page.setViewportSize({width,height});await page.emulateMedia({colorScheme:theme,reducedMotion:'reduce'});
    await openOffline(page);await page.evaluate(theme=>MacroScope.setTheme(theme),theme);
    for(const view of ['inicio','laboratorio','panorama','fuentes','ayuda']){
      await page.evaluate(view=>{location.hash=view;},view);
      await page.waitForFunction(view=>!document.querySelector(`[data-view="${view}"]`).hidden,view);
      const metrics=await page.evaluate(({view,width})=>{
        const root=document.documentElement,bar=document.querySelector('.topbar').getBoundingClientRect();
        const active=document.querySelector(`[data-view="${view}"]`);
        const exposed=el=>{
          if(el.closest('[hidden]'))return false;
          for(let parent=el.parentElement;parent;parent=parent.parentElement)if(parent.matches('details:not([open])')&&!parent.querySelector(':scope>summary')?.contains(el))return false;
          return true;
        };
        const visible=el=>{
          if(!exposed(el))return false;
          const r=el.getBoundingClientRect(),style=getComputedStyle(el);
          return r.width>0&&r.height>0&&style.visibility!=='hidden';
        };
        const controls=[...document.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')].filter(el=>exposed(el)&&(visible(el)||el.closest('.topbar')&&el.getBoundingClientRect().width));
        const overlaps=[];
        for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
          const a=controls[i],b=controls[j];if(a.contains(b)||b.contains(a))continue;
          const x=a.getBoundingClientRect(),y=b.getBoundingClientRect();
          if(Math.min(x.right,y.right)-Math.max(x.left,y.left)>1&&Math.min(x.bottom,y.bottom)-Math.max(x.top,y.top)>1)overlaps.push([a.id||a.textContent.slice(0,24),b.id||b.textContent.slice(0,24)]);
        }
        const renderedControls=[...document.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')].filter(el=>exposed(el)&&el.getBoundingClientRect().width>0&&getComputedStyle(el).visibility!=='hidden');
        const small=width<=1024?renderedControls.filter(el=>{
          const target=el.matches('input[type=checkbox]')?el.closest('label')||el:el;
          const r=target.getBoundingClientRect();return r.width<43.5||r.height<43.5;
        }).map(el=>[el.tagName,el.id||el.textContent.slice(0,35),el.getBoundingClientRect().width,el.getBoundingClientRect().height]):[];
        const clipped=[...active.querySelectorAll('h1,h2,h3,.status-pill,.text-chip,.api-indicator,.source-card,.path-card')].filter(el=>{
          const style=getComputedStyle(el);return el.getBoundingClientRect().width>0&&['hidden','clip'].includes(style.overflowX)&&el.scrollWidth>el.clientWidth+1;
        }).map(el=>el.id||el.className);
        const vars=getComputedStyle(root),colors=Object.fromEntries(['--bg','--surface','--surface-2','--text','--text-muted','--primary','--accent','--border','--focus','--on-primary',...Array.from({length:6},(_,i)=>'--series-'+(i+1))].map(key=>[key,vars.getPropertyValue(key).trim()]));
        const focusable=[...active.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),summary')].filter(el=>exposed(el)&&el.getBoundingClientRect().width>0);
        // Programmatic traversal verifies every exposed control; keyboard traversal follows below.
        let focusOK=true;
        for(const el of focusable){el.focus({preventScroll:true});if(document.activeElement!==el){focusOK=false;break;}}
        const activeHomeCard=document.querySelector('.orbit-card.is-active')?.getBoundingClientRect();
        const homeCard=activeHomeCard?{top:activeHomeCard.top,bottom:activeHomeCard.bottom,width:activeHomeCard.width}:null;
        return {overflow:root.scrollWidth-root.clientWidth,overlaps,small,clipped,barHeight:bar.height,anchor:active.getBoundingClientRect().top,barBottom:bar.bottom,colors,focusOK,homeCard,chart:document.querySelector('#islmPanelISLM').getBoundingClientRect().top,controls:document.querySelector('.islm-controls').getBoundingClientRect().top};
      },{view,width});
      const row={width,theme,view,criteria:{}};
      const verify=(key,value,detail)=>{row.criteria[key]=value;assert.ok(value,`${key} ${view} ${width} ${theme}: ${JSON.stringify(detail)}`);};
      verify('A1',metrics.overflow<=0,metrics.overflow);
      verify('A2',metrics.overlaps.length===0,metrics.overlaps);
      verify('A3',metrics.small.length===0,metrics.small);
      verify('A4',metrics.clipped.length===0,metrics.clipped);
      verify('A5',metrics.anchor>=metrics.barBottom-1&&metrics.barHeight<=(width<=760?56:64),metrics);
      const c=metrics.colors;
      const ratios=[];
      for(const bg of ['--bg','--surface','--surface-2'])for(const text of ['--text','--text-muted','--primary','--accent'])ratios.push([text,bg,contrast(c[text],c[bg]),4.5]);
      for(const bg of ['--bg','--surface','--surface-2'])for(const ui of ['--border','--focus'])ratios.push([ui,bg,contrast(c[ui],c[bg]),3]);
      for(let i=1;i<=6;i++)ratios.push(['--series-'+i,'--surface',contrast(c['--series-'+i],c['--surface']),3]);
      ratios.push(['--on-primary','--primary',contrast(c['--on-primary'],c['--primary']),4.5]);
      verify('A6',ratios.every(([, ,ratio,min])=>ratio>=min),ratios.filter(([, ,ratio,min])=>ratio<min));
      await page.locator(`[data-view="${view}"]`).focus();await page.keyboard.press('Tab');
      const ring=await page.evaluate(()=>{const el=document.activeElement,style=getComputedStyle(el);return el.matches(':focus-visible')&&parseFloat(style.outlineWidth)>=3&&style.outlineStyle==='solid';});
      verify('A7',metrics.focusOK&&ring,{focusOK:metrics.focusOK,ring});
      verify('A8',view!=='inicio'||![390,1440].includes(width)||Boolean(metrics.homeCard && metrics.homeCard.top>=0 && metrics.homeCard.bottom<=height),metrics.homeCard);
      verify('A9',view!=='laboratorio'||width!==1440||(metrics.chart<900&&metrics.controls<900),{chart:metrics.chart,controls:metrics.controls});
      verify('A10',await page.isVisible(`[data-view="${view}"]`),view);
      verify('A11',await page.evaluate(()=>!('carouselTimer' in MacroScope.state)&&!MacroScope.setupCarousel&&!document.querySelector('#insightCarousel')),'lecturas fijas sin estado ni temporizador');
      // check() additionally asserts zero uncaught page errors, including all asynchronous requests.
      verify('A12',matrixErrors.length===0,matrixErrors);
      verify('A13',page.url().startsWith('file:'),page.url());
      acceptance.push(row);
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await page.screenshot({path:`test-results/rediseno/${view}-${width}-${theme}.png`});
    }
  });
}
await check('rutas: Atrás y hash desconocido; menú móvil siempre etiquetado',async page=>{
  await openOffline(page);await page.evaluate(()=>{location.hash='fuentes';});await page.waitForFunction(()=>!document.querySelector('#fuentes').hidden);
  await page.evaluate(()=>{location.hash='ayuda';});await page.waitForFunction(()=>!document.querySelector('#ayuda').hidden);
  await page.goBack();await page.waitForFunction(()=>!document.querySelector('#fuentes').hidden);
  await page.evaluate(()=>{location.hash='desconocido';});await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
  await page.setViewportSize({width:360,height:900});await page.click('.nav-menu>summary');
  assert.deepEqual(await page.locator('.primary-nav a').allTextContents(),['Inicio','Aprender','Explorar datos','Comparación','Buscar fuentes','Ayuda']);
  await page.click('[data-route="fuentes"]');await page.waitForFunction(()=>!document.querySelector('#fuentes').hidden);
  assert.equal(await page.locator('.nav-menu').getAttribute('open'),null);
});
await check('fuentes: filtros compartidos, avisos, cita y glosario enlazado',async page=>{
  await openOffline(page);await page.evaluate(()=>{location.hash='fuentes?course=econometria&scope=peru&access=microdatos&q=hogares';});
  await page.waitForFunction(()=>document.querySelector('#sourceQuery').value==='hogares');
  assert.equal(await page.locator('#sourceResults article').count(),1);
  assert.match(await page.textContent('#sourceResults'),/ENAHO/);
  await page.reload();assert.equal(await page.inputValue('#sourceQuery'),'hogares');
  await page.click('#sourceFilters button[type=reset]');await page.waitForFunction(()=>document.querySelectorAll('#sourceResults article').length>20);
  assert.ok(await page.locator('.source-warning').count()>0);
  assert.match(await page.textContent('#sourceResults'),/verificación del navegador/);
  assert.ok(await page.locator('#sourceResults a[target=_blank][rel=noopener]').count()>20);
  const citation=await page.evaluate(()=>MacroScope.dataCitation({provider:'wdi',code:'FP.CPI.TOTL.ZG',country:'Perú',extracted:'2026-10-18'}));
  assert.match(citation,/Banco Mundial\. \(s\. f\.\).*World Development Indicators.*FP.CPI.TOTL.ZG.*18 de octubre de 2026/);
  await page.evaluate(()=>{location.hash='laboratorio';});await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
  await page.getByRole('button',{name:'Definición de IS',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#help-term-IS').open);
  assert.match(page.url(),/#ayuda\?term=IS/);
  await page.fill('#glossarySearch','trilema');assert.match(await page.textContent('#helpGlossary'),/Trilema/);
});

await check('Chart.js: colores resueltos, codificación redundante y reconstrucción al cambiar tema',async page=>{
  await page.route(/^https?:/,route=>route.abort());
  // Test the existing Chart.js integration contract without adding a dependency or relying on a live CDN.
  // Inject before deferred scripts; the real page continues to enforce the original CDN SRI.
  await page.addInitScript(()=>{window.chartCalls=[];window.Chart=class Chart {constructor(canvas,config){this.config=config;window.chartCalls.push({id:canvas.id,config});}destroy(){}};});
  await page.goto(PAGE_URL+'#panorama');await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  const first=await page.evaluate(()=>{MacroScope.setTheme('light');return window.chartCalls.at(-1).config.data.datasets[0].backgroundColor;});
  const before=await page.evaluate(()=>window.chartCalls.length);
  await page.evaluate(()=>MacroScope.setTheme('dark'));
  const after=await page.evaluate(()=>window.chartCalls.length);
  assert.ok(after>before);
  const last=await page.evaluate(()=>window.chartCalls.at(-1).config.data.datasets[0].backgroundColor);
  assert.notDeepEqual(first,last);
  assert.ok(await page.evaluate(()=>window.chartCalls.filter(call=>call.id==='compareChart').at(-1).config.data.datasets.every(ds=>/^#/.test(ds.borderColor)&&Array.isArray(ds.borderDash)&&ds.pointStyle)));
});
await check('preferencia del sistema con almacenamiento restringido y copia de cita real',async page=>{
  await page.emulateMedia({colorScheme:'dark'});
  await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('storage restricted');};Storage.prototype.setItem=()=>{throw Error('storage restricted');};Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{window.copiedCitation=text;}}});});
  await openOffline(page);
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'dark');
  await page.click('#themeBtn');assert.equal(await page.evaluate(()=>document.documentElement.dataset.theme),'light');
  await page.evaluate(()=>{location.hash='fuentes?scope=peru';});await page.waitForFunction(()=>!document.querySelector('#fuentes').hidden);
  await page.locator('[data-cite-source]').first().click();
  assert.match(await page.evaluate(()=>window.copiedCitation),/Banco Central de Reserva del Perú.*BCRPData.*Recuperado el/);
});
// Text over its effective background (walks up through transparent ancestors), WCAG ratio.
const textContrast=(page,selector)=>page.$eval(selector,el=>{
  const parse=c=>c.match(/[\d.]+/g).map(Number);
  const lum=rgb=>rgb.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  let node=el,bg=parse(getComputedStyle(node).backgroundColor);
  while(bg[3]===0&&node.parentElement){node=node.parentElement;bg=parse(getComputedStyle(node).backgroundColor);}
  const a=lum(parse(getComputedStyle(el).color)),b=lum(bg);
  return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
});
await check('colorimetría: encabezados de tabla e inspector legibles en ambos temas',async page=>{
  await openOffline(page);
  for(const theme of ['dark','light']){
    await page.evaluate(theme=>MacroScope.setTheme(theme),theme);
    await page.waitForTimeout(400); // let the .22s background transitions finish before measuring
    for(const selector of ['#tab-data .data-table thead th','#compareTableHead th','#rawJsonPreview','#endpointList']){
      const ratio=await textContrast(page,selector);
      assert.ok(ratio>=4.5,`${selector} en tema ${theme}: contraste ${ratio.toFixed(2)} < 4.5`);
    }
    await page.evaluate(()=>{location.hash='laboratorio';});await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
    const ratio=await textContrast(page,'#islmPolicyTable thead th');
    assert.ok(ratio>=4.5,`tabla de eficacia en tema ${theme}: contraste ${ratio.toFixed(2)}`);
    await page.evaluate(()=>{location.hash='panorama';});await page.waitForFunction(()=>!document.querySelector('#tab-overview').hidden);
  }
  const overflow=await page.$eval('#endpointList',el=>el.scrollWidth-el.clientWidth);
  assert.ok(overflow<=1,'las URL del inspector no deben desbordar en horizontal');
});
await check('panorama: un indicador activo para tarjetas, evolución y comparador, en orden lógico',async page=>{
  await openOffline(page);
  const inOrder=await page.evaluate(()=>['kpiGrid','trendChart','macroMixChart','comparisonPanel','tab-data'].map(id=>document.getElementById(id))
    .every((el,i,list)=>!i||(list[i-1].compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING)));
  assert.ok(inOrder,'orden esperado: indicadores → evolución → crecimiento e inflación → comparador → datos');
  await page.getByRole('button',{name:/^Explorar Exportaciones:/}).click();
  assert.equal(await page.inputValue('#compareIndicator'),'NE.EXP.GNFS.ZS');
  assert.equal(await page.inputValue('#indicatorSelectChart'),'NE.EXP.GNFS.ZS');
  await page.selectOption('#compareIndicator','NY.GDP.PCAP.PP.KD');
  assert.equal(await page.inputValue('#indicatorSelectChart'),'NY.GDP.PCAP.PP.KD');
  assert.match(await page.textContent('.kpi-card.active-kpi .kpi-title'),/PPA constante/);
  await page.selectOption('#indicatorSelectChart','FP.CPI.TOTL.ZG');
  assert.equal(await page.inputValue('#compareIndicator'),'FP.CPI.TOTL.ZG');
});
await check('laboratorio: controles fijos con scroll propio y transmisión antes del resultado',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='laboratorio';});await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
  const sections=await page.$$eval('.islm-main > article',list=>list.map(a=>a.getAttribute('aria-label')));
  assert.deepEqual(sections,['Diagramas del modelo','Mecanismo de transmisión','Resultados del modelo']);
  // The page uses smooth scrolling; jump instantly so the baseline is not taken mid-animation.
  await page.evaluate(()=>document.querySelector('.islm-layout').scrollIntoView({behavior:'instant'}));
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>({y:scrollY,diagram:document.getElementById('islmPanelISLM').getBoundingClientRect().top}));
  await page.locator('.islm-controls').hover();await page.mouse.wheel(0,800);await page.waitForTimeout(300);
  const after=await page.evaluate(()=>({y:scrollY,controls:document.querySelector('.islm-controls').scrollTop,diagram:document.getElementById('islmPanelISLM').getBoundingClientRect().top}));
  assert.ok(after.controls>0,'el panel de controles debe desplazarse por sí mismo');
  assert.ok(Math.abs(after.diagram-before.diagram)<5,'los diagramas no deben moverse al recorrer los controles');
  const box=await page.$eval('.islm-controls',el=>{const r=el.getBoundingClientRect();return {bottom:r.bottom,vh:innerHeight};});
  assert.ok(box.bottom<=box.vh+1,'el panel de controles cabe en la pantalla');
});
await check('panorama premium: seis indicadores con procedencia y categorías conectadas',async page=>{
  await openOffline(page);
  assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),6);
  assert.match(await page.textContent('#headingPeriod'),/mensuales y trimestrales/);
  assert.match(await page.locator('[data-panorama-card="unemployment"]').textContent(),/OIT/);
  assert.match(await page.locator('[data-panorama-card="gdp"]').textContent(),/N\/D/);
  await page.getByRole('tab',{name:'Precios'}).click();
  assert.match(await page.textContent('#panoramaMainTitle'),/Inflación/);
  assert.equal(await page.getByRole('tab',{name:'Precios'}).getAttribute('aria-selected'),'true');
  await page.selectOption('#countrySelect','CHL');
  assert.match(await page.textContent('#headingPeriod'),/Indicadores anuales del Banco Mundial/);
  assert.equal(await page.locator('#panoramaKpis .p-kpi-tag').filter({hasText:'Respaldo histórico'}).count(),6);
  assert.match(await page.textContent('#panoramaMainSource'),/Banco Mundial/);
});
await check('panorama premium: navegación accesible, móvil sin desbordamiento y tema oscuro',async page=>{
  await page.setViewportSize({width:390,height:844});
  await openOffline(page);
  await page.getByRole('tab',{name:'Actividad'}).focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.getByRole('tab',{name:'Precios'}).getAttribute('aria-selected'),'true');
  assert.equal(await page.getByRole('tab',{name:'Precios'}).evaluate(el=>document.activeElement===el),true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=2,`Panorama móvil no debe causar overflow horizontal: ${overflow}px`);
  const allSegmentsVisible=await page.evaluate(()=>{
    const container=document.querySelector('.p-segments').getBoundingClientRect();
    return [...document.querySelectorAll('.p-segments button')].every(button=>{
      const rect=button.getBoundingClientRect();return rect.left>=container.left-1&&rect.right<=container.right+1&&button.scrollWidth<=button.clientWidth+1;
    });
  });
  assert.equal(allSegmentsVisible,true,'las cuatro categorías deben quedar completamente visibles en móvil');
  const beforeTheme=await page.locator('html').getAttribute('data-theme');
  await page.click('#themeBtn');
  assert.notEqual(await page.locator('html').getAttribute('data-theme'),beforeTheme);
  assert.equal(await page.locator('.p-kpi-source-link').count(),6);
});
await check('panorama premium: caída parcial de BCRP conserva indicadores válidos sin atribuir valores inventados',async page=>{
  await page.route(/^https?:/,async route=>{
    const url=route.request().url();
    if(!url.includes('/api/bcrp'))return route.abort();
    if(url.includes('PN02507AQ'))return route.fulfill({status:502,contentType:'application/json',body:'{"error":"fuente caída"}'});
    if(url.includes('PD38045AM'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{source:'BCRP',code:'PD38045AM',frequency:'monthly',title:'Expectativas empresariales totales - Índice de expectativas de la economía a 3 meses',unit:'puntos',fetchedAt:'2026-10-25T00:00:00Z',observations:[{date:'2026-09-01',period:'Sep.2026',value:56.8}]}])});
    return route.fulfill({status:502,contentType:'application/json',body:'{"error":"fuente caída"}'});
  });
  await page.goto(PAGE_URL);
  await page.evaluate(()=>{location.hash='panorama';});
  await page.waitForFunction(()=>document.querySelector('#panoramaDataBadge')?.textContent?.includes('trimestral: error'));
  assert.match(await page.locator('[data-panorama-card="confidence"]').textContent(),/56[.,]8/);
  assert.match(await page.locator('[data-panorama-card="gdp"]').textContent(),/N\/D/);
  assert.match(await page.textContent('#panoramaDataBadge'),/mensual: partial/);
});
await check('panorama referencia: módulo de la tarjeta 03, filtros y tarjetas expandibles',async page=>{
 await openOffline(page);
 assert.equal(await page.locator('[data-home-slide="3"] .orbit-card-open').getAttribute('data-destination'),'#exploracion');
 assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),6);
 assert.equal(await page.locator('#panoramaFilterShell').count(),1);
 assert.equal(await page.locator('#panoramaFrequencySelect').count(),1);
 assert.equal(await page.locator('#panoramaSourceSelect').count(),1);
 await page.locator('#panoramaMoreMetrics').click();
 assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),8);
 await page.locator('#panoramaMoreMetrics').click();
 assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),6);
 await page.selectOption('#panoramaSourceSelect','BCRP');
 assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),5);
 await page.selectOption('#panoramaSourceSelect','all');
 await page.selectOption('#panoramaFrequencySelect','annual');
 assert.equal(await page.locator('#panoramaKpis [data-panorama-card]').count(),1);
});
await check('panorama referencia: grilla PBI, inflación, lectura y tres gráficos bajo la línea superior',async page=>{
 await page.setViewportSize({width:1672,height:941});
 await openOffline(page);
 const areas=await page.evaluate(()=>{
  const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom};};
  return {main:rect('.p-main-panel'),side:rect('.p-side-panel'),reading:rect('.p-reading'),minis:rect('.p-minis'),overflow:document.documentElement.scrollWidth-innerWidth};
 });
 assert.equal(areas.overflow,0);
 assert.ok(areas.main.right<areas.side.left&&areas.side.right<areas.reading.left,'PBI, IPC y lecturas deben alinearse en tres columnas');
 assert.ok(Math.abs(areas.main.top-areas.side.top)<2&&Math.abs(areas.side.top-areas.reading.top)<2,'paneles superiores en una fila');
 assert.ok(areas.minis.top>=areas.main.bottom-1,'tres minigráficos bajo PBI e IPC');
 assert.ok(areas.reading.bottom>=areas.minis.bottom-1,'lectura ocupa ambas filas');
 assert.ok(areas.minis.bottom<=930,`los minigráficos deben caber en el alto de la referencia de 941 px: ${areas.minis.bottom}`);
 assert.ok(areas.reading.bottom<=930,`la columna de lectura debe caber en el alto de la referencia: ${areas.reading.bottom}`);
 assert.equal(await page.locator('#panoramaMinis canvas').count(),3);
 assert.equal(await page.locator('#panoramaLevelToggle').count(),1);
});
await check('panorama referencia: gráfico local sin puntos decorativos y escala de índice no truncada',async page=>{
 await openOffline(page);
 const metric=await page.evaluate(()=>{
  const container=document.createElement('div');container.style.cssText='position:absolute;left:-9999px;width:360px;height:180px';
  const canvas=document.createElement('canvas');canvas.style.cssText='display:block;width:100%;height:100%';container.appendChild(canvas);document.body.appendChild(container);
  const ctx=canvas.getContext('2d'),arc=ctx.arc.bind(ctx);let circles=0;
  ctx.arc=(...args)=>{circles++;return arc(...args);};
  const chart=new Chart(canvas,{type:'line',data:{labels:['2015','2016','2017'],datasets:[{label:'PBI indexado',data:[99,103,109],pointRadius:0,borderColor:'#267aff',fill:false}]},options:{plugins:{legend:{display:false}},scales:{y:{beginAtZero:false}}}});
  const metric={min:chart.min,circles};chart.destroy();container.remove();return metric;
 });
 assert.ok(metric.min>85,`el nivel de PBI debe mantener escala real sin forzar cero: ${metric.min}`);
 assert.equal(metric.circles,0,'pointRadius:0 evita un círculo por cada observación mensual');
});
await check('panorama referencia: las ocho tarjetas abren su propia serie al seleccionarlas',async page=>{
 await openOffline(page);
 await page.locator('[data-panorama-card="confidence"]').click();
 assert.match(await page.locator('#panoramaMainTitle').textContent(),/Confianza empresarial/);
 assert.equal(await page.locator('[data-panorama-card="confidence"]').getAttribute('aria-pressed'),'true');
 await page.locator('[data-panorama-card="fx"]').click();
 assert.match(await page.locator('#panoramaMainTitle').textContent(),/Tipo de cambio/);
 await page.locator('#panoramaMoreMetrics').click();
 await page.locator('[data-panorama-card="reserves"]').click();
 assert.match(await page.locator('#panoramaMainTitle').textContent(),/Reservas internacionales/);
 await page.locator('[data-panorama-area="activity"]').click();
 assert.match(await page.locator('#panoramaMainTitle').textContent(),/PBI real/);
});
await check('panorama referencia: minigráficos con etiquetas legibles, sin solapamiento ni escala bajo cero',async page=>{
 await openOffline(page);
 const result=await page.evaluate(()=>{
  const host=document.createElement('div');host.style.cssText='position:absolute;left:-9999px;width:280px;height:105px';
  const canvas=document.createElement('canvas');canvas.style.cssText='width:100%;height:100%;display:block';host.appendChild(canvas);document.body.appendChild(host);
  const ctx=canvas.getContext('2d'),draw=ctx.fillText.bind(ctx),texts=[];
  ctx.fillText=(value,x,y,...args)=>{if(y>80&&String(value).includes('202'))texts.push({left:x-ctx.measureText(String(value)).width/2,right:x+ctx.measureText(String(value)).width/2});return draw(value,x,y,...args);};
  const labels=['ene 2025','feb 2025','mar 2025','abr 2025','may 2025','jun 2025','jul 2025','ago 2025','sep 2025','oct 2025','nov 2025'];
  const chart=new Chart(canvas,{type:'bar',data:{labels,datasets:[{label:'Serie anual',data:labels.map((_,i)=>5+i/10),backgroundColor:'#2478ff'}]},options:{premiumPanorama:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{maxTicksLimit:4}},x:{ticks:{maxTicksLimit:5}}}}});
  const output={min:chart.min,texts};chart.destroy();host.remove();return output;
 });
 assert.equal(result.min,0,'las barras no negativas empiezan en cero');
 for(let i=0;i<result.texts.length;i++){
  assert.ok(result.texts[i].right<=280&&result.texts[i].left>=0,'ninguna etiqueta sale de la figura');
  if(i)assert.ok(result.texts[i].left>=result.texts[i-1].right+5,'las etiquetas mantienen espacio legible');
 }
});
await check('panorama referencia: los pies de las tres minigráficas permanecen dentro de su tarjeta',async page=>{
 await page.setViewportSize({width:1440,height:900});
 await openOffline(page);
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('.p-mini')].map(card=>{
  const frame=card.getBoundingClientRect(),footer=card.querySelector('.p-mini-footer').getBoundingClientRect();
  return Math.round(footer.bottom-frame.bottom);
 }));
 assert.equal(overflow.length,3);
 assert.ok(overflow.every(value=>value<=-5),`pies fuera de sus tarjetas: ${overflow.join(', ')}`);
});
await writeFile('test-results/rediseno/aceptacion.json',JSON.stringify(acceptance,null,2));

await mkdir('test-results/experiencias',{recursive:true});

await check('siete experiencias desde la portada orbital y compatibilidad con rutas heredadas',async page=>{
  await openOffline(page);
  const expectedSlides=[
    [0,'Aprendizaje guiado','#aprendizaje','aprendizaje'],
    [1,'Análisis histórico','#historico','historico'],
    [2,'Indicadores macroeconómicos','#indicadores','indicadores'],
    [3,'Exploración macroeconómica','#exploracion','exploracion'],
    [4,'Comparación de economías','#comparacion','comparacion'],
    [5,'Simulación de escenarios','#simulacion','simulacion'],
    [6,'Modelos y tendencias','#modelos','modelos']
  ];
  for(const [idx,title,hash,view] of expectedSlides){
    await page.evaluate(()=>{location.hash='inicio';});
    await page.waitForFunction(()=>!document.querySelector('#inicio').hidden);
    await page.click(`[data-home-dot="${idx}"]`);
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(),title);
    assert.equal(await page.locator('.orbit-card.is-active .orbit-card-open').getAttribute('href'),hash);
    await page.locator('.orbit-card.is-active .orbit-card-open').focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(v=>{const el=document.querySelector(`[data-view="${v}"]`);return Boolean(el&&!el.hidden);},view);
    assert.equal(await page.isVisible(`[data-view="${view}"]`),true);
  }
  await page.evaluate(()=>{location.hash='panorama';});
  await page.waitForFunction(()=>!document.querySelector('#tab-overview').hidden);
  assert.equal(await page.getAttribute('#tab-overview','data-view'),'panorama');
  await page.evaluate(()=>{location.hash='laboratorio';});
  await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
  assert.equal(await page.getAttribute('#tab-simulator','data-view'),'laboratorio');
});

await check('módulo 01 aprendizaje guiado: rutas, simulación, predicción calificada y persistencia',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='aprendizaje';});
  await page.waitForFunction(()=>!document.querySelector('#aprendizaje').hidden);
  assert.match(await page.textContent('#apTitle'),/Aprendizaje guiado/);
  assert.ok(await page.locator('.ap-lesson-btn').count()>=5);
  await page.click('[data-ap-level="advanced"]');
  assert.equal(await page.getAttribute('[data-ap-level="advanced"]','aria-pressed'),'true');
  await page.click('[data-ap-option="opt-correct"]');
  await page.click('#apCheckAnswerBtn');
  assert.equal(await page.isVisible('#apFeedbackBox'),true);
  assert.match(await page.textContent('#apFeedbackBox'),/Respuesta correcta/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('macroscope_learning_progress_v1')||'{}'));
  assert.ok(Array.isArray(saved.completedIds)&&saved.completedIds.length>=1);
});

await check('módulo 02 análisis histórico: series, subperiodos, transformaciones y exportación CSV',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='historico';});
  await page.waitForFunction(()=>!document.querySelector('#historico').hidden);
  assert.match(await page.textContent('#hiTitle'),/Análisis histórico/);
  assert.equal(await page.locator('.hi-kpi-card').count(),4);
  assert.ok(await page.locator('#hiDataTable tbody tr').count()>=8);
  await page.selectOption('#hiIndicatorSelect','NY.GDP.PCAP.PP.KD');
  await page.click('[data-hi-mode="base100"]');
  assert.equal(await page.getAttribute('[data-hi-mode="base100"]','aria-pressed'),'true');
  const [download]=await Promise.all([page.waitForEvent('download'),page.click('#hiExportBtn')]);
  const csv=(await readFile(await download.path(),'utf8')).replace(/^\uFEFF/,'');
  assert.match(csv,/"pais_iso3","indicador_codigo","periodo","valor_observado"/);
});

await check('módulo 03 indicadores macroeconómicos: catálogo categorizado, ficha analítica y separación demo/oficial',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='indicadores';});
  await page.waitForFunction(()=>!document.querySelector('#indicadores').hidden);
  assert.match(await page.textContent('#indTitle'),/Indicadores macroeconómicos/);
  assert.ok(await page.locator('[data-ind-card]').count()>=16);
  await page.click('[data-ind-cat="fiscal"]');
  assert.equal(await page.getAttribute('[data-ind-cat="fiscal"]','aria-selected'),'true');
  assert.match(await page.textContent('#indDetailSheet'),/Demostrativo · No oficial/);
  await page.click('[data-ind-cat="prices"]');
  assert.match(await page.textContent('#indDetailSheet'),/Serie Oficial Verificada/);
  await page.click('[data-ind-card="PN01273PM"]');
  assert.match(await page.textContent('#indDetailSheet'),/2026-10-18/);
  assert.match(await page.textContent('#indDetailSheet'),/2026-09/);
  await page.click('[data-ind-cat="activity"]');
  await page.click('[data-ind-card="PN02507AQ"]');
  assert.match(await page.textContent('#indDetailSheet'),/Sin dato local/);
});

await check('módulo 06 y 07 simulación y modelos: persistencia completa de escenarios y coherencia geométrica SVG',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='simulacion';});
  await page.waitForFunction(()=>!document.querySelector('#tab-simulator').hidden);
  await page.evaluate(()=>localStorage.removeItem('macroscope_saved_scenarios_v1'));
  await page.selectOption('#islmCountry','CHL');
  await page.selectOption('#islmRegime','fixed');
  await page.selectOption('#islmMobility','perfect');
  await page.evaluate(()=>{
    const g=document.getElementById('islm-G');g.value='24';g.dispatchEvent(new Event('input',{bubbles:true}));
    const eb=document.getElementById('islm-ebar');eb.value='110';eb.dispatchEvent(new Event('input',{bubbles:true}));
    const c=document.getElementById('islm-p-c');c.value='0.8';c.dispatchEvent(new Event('input',{bubbles:true}));
  });
  const savedSnap=await page.evaluate(()=>{
    const s=MacroScope.labs.islm.snapshot();
    return {config:s.config,params:s.params,u:s.u,E2:s.E2};
  });
  assert.equal(savedSnap.config.country,'CHL');
  await page.click('#simSaveCurrentBtn');
  assert.equal(await page.locator('[data-load-sim]').count(),1);

  // Cambiar economía, régimen, movilidad, parámetros y choques y comprobar que al cargar se restaura todo
  await page.selectOption('#islmCountry','PER');
  await page.click('#islmResetBtn');
  const resetSnap=await page.evaluate(()=>MacroScope.labs.islm.snapshot());
  assert.equal(resetSnap.config.country,'PER');
  assert.equal(resetSnap.config.regime,'flex');
  assert.equal(resetSnap.E2.Y,100);

  await page.click('[data-load-sim="0"]');
  const restoredSnap=await page.evaluate(()=>{
    const s=MacroScope.labs.islm.snapshot();
    return {config:s.config,params:s.params,u:s.u,E2:s.E2};
  });
  assert.deepEqual(restoredSnap.config,savedSnap.config);
  assert.deepEqual(restoredSnap.params,savedSnap.params);
  assert.deepEqual(restoredSnap.u,savedSnap.u);
  assert.deepEqual(restoredSnap.E2,savedSnap.E2);

  await page.evaluate(()=>{location.hash='modelos';});
  await page.waitForFunction(()=>!document.querySelector('#modelos').hidden);
  assert.match(await page.textContent('#modTitle'),/Modelos y tendencias/);
  assert.equal(await page.locator('[data-mod-select]').count(),5);
  for(const modId of ['islm','asad','micro-sd','phillips','solow']){
    await page.click(`[data-mod-select="${modId}"]`);
    assert.equal(await page.getAttribute(`[data-mod-select="${modId}"]`,'aria-selected'),'true');
    assert.equal(await page.locator('#modSvgContainer svg').count(),1);
  }

  // Verificar coherencia matemática de intersección de curvas y puntos de equilibrio en el SVG de OA-DA y Oferta-Demanda
  await page.click('[data-mod-select="asad"]');
  await page.evaluate(()=>{
    const g=document.getElementById('modAsadG');g.value='4';g.dispatchEvent(new Event('change',{bubbles:true}));
    const z=document.getElementById('modAsadZ');z.value='2';z.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const asadCheck=await page.evaluate(()=>{
    const svg=document.querySelector('#modSvgContainer svg');
    const line=name=>{const el=svg.querySelector(`[data-curve="${name}"]`);return {x1:+el.getAttribute('x1'),y1:+el.getAttribute('y1'),x2:+el.getAttribute('x2'),y2:+el.getAttribute('y2')};};
    const pt=name=>{const el=svg.querySelector(`[data-point="${name}"]`);return {cx:+el.getAttribute('cx'),cy:+el.getAttribute('cy')};};
    const intersect=(a,b)=>{
      const d=(a.x1-a.x2)*(b.y1-b.y2)-(a.y1-a.y2)*(b.x1-b.x2);
      const x=((a.x1*a.y2-a.y1*a.x2)*(b.x1-b.x2)-(a.x1-a.x2)*(b.x1*b.y2-b.y1*b.x2))/d;
      const y=((a.x1*a.y2-a.y1*a.x2)*(b.y1-b.y2)-(a.y1-a.y2)*(b.x1*b.y2-b.y1*b.x2))/d;
      return {x,y};
    };
    const i1=intersect(line('ad1'),line('as1'));
    const i2=intersect(line('ad1'),line('as2'));
    const e1=pt('E1'),e2=pt('E2');
    return Math.hypot(i1.x-e1.cx,i1.y-e1.cy)<0.2 && Math.hypot(i2.x-e2.cx,i2.y-e2.cy)<0.2;
  });
  assert.equal(asadCheck,true,'E1 y E2 en el SVG de OA-DA deben coincidir con las intersecciones de DA1/OACP1 y DA1/OACP2');

  await page.click('[data-mod-select="micro-sd"]');
  await page.evaluate(()=>{
    const d=document.getElementById('modSdD');d.value='30';d.dispatchEvent(new Event('change',{bubbles:true}));
    const t=document.getElementById('modSdTax');t.value='20';t.dispatchEvent(new Event('change',{bubbles:true}));
  });
  const sdCheck=await page.evaluate(()=>{
    const svg=document.querySelector('#modSvgContainer svg');
    const line=name=>{const el=svg.querySelector(`[data-curve="${name}"]`);return {x1:+el.getAttribute('x1'),y1:+el.getAttribute('y1'),x2:+el.getAttribute('x2'),y2:+el.getAttribute('y2')};};
    const pt=name=>{const el=svg.querySelector(`[data-point="${name}"]`);return {cx:+el.getAttribute('cx'),cy:+el.getAttribute('cy')};};
    const intersect=(a,b)=>{
      const d=(a.x1-a.x2)*(b.y1-b.y2)-(a.y1-a.y2)*(b.x1-b.x2);
      const x=((a.x1*a.y2-a.y1*a.x2)*(b.x1-b.x2)-(a.x1-a.x2)*(b.x1*b.y2-b.y1*b.x2))/d;
      const y=((a.x1*a.y2-a.y1*a.x2)*(b.y1-b.y2)-(a.y1-a.y2)*(b.x1*b.y2-b.y1*b.x2))/d;
      return {x,y};
    };
    const i1=intersect(line('d1'),line('s1'));
    const e1=pt('E1');
    return Math.hypot(i1.x-e1.cx,i1.y-e1.cy)<0.2;
  });
  assert.equal(sdCheck,true,'E1 en el SVG de Oferta-Demanda debe coincidir con la intersección de D1 y S1');
});

await check('observatorio del Perú y ficha de la fuente: series nacionales BCRP y colecciones académicas',async page=>{
  await openOffline(page);
  await page.evaluate(()=>{location.hash='observatorio';});
  await page.waitForFunction(()=>!document.querySelector('#observatorio').hidden);
  assert.match(await page.textContent('#obsTitle'),/Observatorio del Perú/);
  assert.equal(await page.locator('.obs-kpi-card').count(),6);
  assert.equal(await page.locator('#observatorio canvas').count(),4);

  await page.evaluate(()=>{location.hash='fuentes';});
  await page.waitForFunction(()=>!document.querySelector('#fuentes').hidden);
  assert.equal(await page.locator('#sourceDetailSheet').count(),1);
  assert.match(await page.textContent('#sourceDetailSheet'),/FICHA DE LA FUENTE/);
  await page.locator('[data-select-source="wdi"]').click();
  assert.match(await page.textContent('#sourceSheetTitle'),/World Development Indicators/);
});

await check('capturas multi-resolución y claro/oscuro de las siete experiencias y observatorio',async page=>{
  await openOffline(page);
  const viewsToCapture=['inicio','aprendizaje','historico','indicadores','exploracion','comparacion','simulacion','modelos','observatorio','fuentes'];
  for(const [label,width,height] of [['desktop',1440,900],['tablet',768,1024],['mobile',390,844]]){
    await page.setViewportSize({width,height});
    for(const theme of ['light','dark']){
      await page.evaluate(t=>MacroScope.setTheme(t),theme);
      for(const v of viewsToCapture){
        await page.evaluate(route=>{location.hash=route;},v);
        await page.waitForFunction(route=>{const el=document.querySelector(`[data-view="${route}"]`);return Boolean(el&&!el.hidden);},v);
        const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
        assert.ok(overflow<=2,`Sin desbordamiento horizontal en ${v} (${label} ${theme}): ${overflow}px`);
        if(label==='desktop'||(v==='inicio'||v==='aprendizaje'||v==='historico'||v==='indicadores'||v==='modelos'||v==='observatorio')){
          await page.screenshot({path:`test-results/experiencias/${v}-${label}-${theme}.png`});
        }
      }
    }
  }
});

await browser.close();
if (failures) {
  console.error(`\n${failures} comprobación(es) fallida(s)`);
  process.exit(1);
}
console.log(`\nMacroScope e2e OK: ${checks} comprobaciones`);
