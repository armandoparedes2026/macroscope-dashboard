// End-to-end checks on the real page in headless Chromium, with outbound network fully controlled:
// every external request is either blocked (offline/fallback mode) or answered with a fixture.
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('test-results', {recursive:true});
const PAGE_URL = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch();
let failures = 0;

async function check(name, fn) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await fn(page, context);
    assert.deepEqual(errors, [], 'errores de JavaScript en la página');
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

await check('botones del sidebar con nombre accesible', async (page) => {
  await openOffline(page);
  for (const name of ['Panorama ejecutivo', 'Modelo IS–LM y divisas', 'Datos e inspector API']) {
    await page.locator('.sidebar').getByRole('button', { name }).click();
  }
  assert.equal(await page.isHidden('#tab-overview'), true);
  assert.equal(await page.isVisible('#tab-data'), true);
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
  await page.locator('.sidebar').getByRole('button', { name: 'Modelo IS–LM y divisas' }).click();
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
  await page.locator('.sidebar').getByRole('button', { name: 'Datos e inspector API' }).click();
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
  await page.goto(PAGE_URL);
  await page.waitForFunction(() => document.getElementById('apiStatusText').textContent === 'Conexión parcial · WDI');
  const row2024 = page.locator('#macroTableBody tr', { hasText: '2024' }).first();
  const cells = row2024.locator('td');
  assert.doesNotMatch(await cells.nth(1).getAttribute('class'), /cell-fallback/, 'PBI 2024 vino del API');
  assert.match(await cells.nth(2).getAttribute('class'), /cell-fallback/, 'IPC 2024 sigue en respaldo');
});

await check('tema claro persistente y sin desborde horizontal en móvil', async (page) => {
  await openOffline(page);
  await page.click('#themeBtn');
  await page.reload();
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), 0);
  // ResizeObserver updates --topbar-h asynchronously after the viewport change, so wait for it to settle.
  await page.waitForFunction(
    () => parseFloat(getComputedStyle(document.querySelector('.mobile-nav')).top) === document.querySelector('.topbar').offsetHeight,
    null,
    { timeout: 3000 },
  ).catch(() => assert.fail('la navegación móvil debe quedar justo debajo de la barra superior'));
});

await check('carrusel: sin avance automático con prefers-reduced-motion', async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openOffline(page);
  assert.equal(await page.evaluate(() => MacroScope.state.carouselTimer), null);
  await page.click('#carouselNext');
  assert.equal(await page.evaluate(() => MacroScope.state.carouselIndex), 1);
  assert.equal(await page.locator('#carouselDots .carousel-dot').nth(1).getAttribute('aria-current'), 'true');
});


for(const [width,height] of [[1440,900],[768,1024],[390,844],[360,740]]) {
  await check(`hero cue: destino visible y foco a ${width}px`, async page=>{
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'reduce'});
    await openOffline(page);
    await page.click('#heroScrollCue');
    await page.waitForFunction(()=>{
      const target=document.querySelector('#overviewFilters').getBoundingClientRect();
      const bottom=Math.max(...[...document.querySelectorAll('.topbar,.mobile-nav')].filter(el=>getComputedStyle(el).position==='sticky'&&el.getBoundingClientRect().height>0).map(el=>el.getBoundingClientRect().bottom));
      return target.top>=bottom&&target.top<innerHeight;
    });
    assert.equal(await page.evaluate(()=>document.activeElement.id),'overviewFilters');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0);
    await page.screenshot({path:`test-results/e2e-hero-${width}.png`});
    for(const tab of ['simulator','data']) {
      await page.locator(`.tab-btn[data-tab="${tab}"]`).locator('visible=true').first().click();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),0,`${tab} sin desborde a ${width}`);
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
  await page.goto(PAGE_URL);
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
  await page.goto(PAGE_URL);
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

await mkdir('docs/evidence/fase3', {recursive:true});
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
  await page.locator('#islmGuided').screenshot({path:'docs/evidence/fase3/escenario-guiado-completo.png',style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}'});
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
    await page.locator(`${width<=760?'.mobile-nav':'.sidebar'} [data-tab="simulator"]`).click();
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
      await panel.screenshot({path:`docs/evidence/fase3/parametros-${width}.png`,style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}'});
      await panel.locator(':scope>summary').click();
    }
    await settleLab(page);
    await page.locator('#tab-simulator').screenshot({path:`docs/evidence/fase3/laboratorio-${width}.png`,style:'.topbar,.mobile-nav,.scroll-progress{visibility:hidden!important}.reveal{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}'});
    await page.locator('.islm-panel').first().scrollIntoViewIfNeeded();
    await page.waitForFunction(() => { const s=getComputedStyle(document.querySelector('.islm-main>.chart-card'));return s.opacity==='1' && ['none','blur(0px)'].includes(s.filter); });
    await page.screenshot({path:`docs/evidence/fase3/laboratorio-viewport-${width}.png`});
  });
}

await browser.close();
if (failures) {
  console.error(`\n${failures} comprobación(es) fallida(s)`);
  process.exit(1);
}
console.log('\nMacroScope e2e OK');
