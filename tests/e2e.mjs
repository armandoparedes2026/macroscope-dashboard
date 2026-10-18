// End-to-end checks on the real page in headless Chromium, with outbound network fully controlled:
// every external request is either blocked (offline/fallback mode) or answered with a fixture.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

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
  await page.waitForFunction(() => document.getElementById('apiStatusText').textContent === 'Respaldo histórico local');
}

const deltaClass = (page, title) =>
  page.locator('.kpi-card', { hasText: title }).locator('.kpi-delta').getAttribute('class');

console.log('MacroScope e2e');

await check('modo sin conexión: respaldo local y gráficos alternativos', async (page) => {
  await openOffline(page);
  assert.equal(await page.evaluate(() => window.Chart.name), 'ChartFallback');
  assert.equal(await page.locator('.kpi-card').count(), 6);
  assert.ok(await page.locator('#macroTableBody td.cell-fallback').count() > 0, 'las celdas de respaldo deben marcarse');
});

await check('botones del sidebar con nombre accesible', async (page) => {
  await openOffline(page);
  for (const name of ['Panorama ejecutivo', 'Divisas y simulador', 'Datos e inspector API']) {
    await page.locator('.sidebar').getByRole('button', { name }).click();
  }
  assert.equal(await page.isHidden('#tab-overview'), true);
  assert.equal(await page.isVisible('#tab-data'), true);
});

await check('color de la variación según si subir es bueno o malo', async (page) => {
  await openOffline(page);
  await page.selectOption('#countrySelect', 'USA');
  // USA unemployment 3.6 → 4.0 (rises: bad) and GDP per capita rises (good).
  assert.match(await deltaClass(page, 'Tasa de Desempleo'), /negative/);
  assert.match(await deltaClass(page, 'PBI per Cápita'), /positive/);
  await page.selectOption('#countrySelect', 'PER');
  // Peru inflation 6.5 → 2.4 (falls: good).
  assert.match(await deltaClass(page, 'Inflación'), /positive/);
});

await check('inflación clasificada frente a la meta del banco central', async (page) => {
  await openOffline(page);
  const pulse = page.locator('.pulse-card', { hasText: 'Inflación anual' });
  assert.match(await pulse.textContent(), /Meta BCRP: 2% ± 1 pp/);
  assert.match(await pulse.textContent(), /En meta/); // Peru 2024: 2.4%
  await page.selectOption('#countrySelect', 'COL');
  assert.match(await pulse.textContent(), /Presión/); // Colombia 2024: 6.6% vs 3% ± 1
});

await check('el país no puede compararse consigo mismo', async (page) => {
  await openOffline(page);
  await page.selectOption('#benchmarkSelect', 'USA');
  await page.selectOption('#countrySelect', 'USA');
  assert.equal(await page.inputValue('#benchmarkSelect'), 'LCN');
  assert.equal(await page.locator('#benchmarkSelect option[value="USA"]').isDisabled(), true);
  assert.equal(await page.locator('#benchmarkSelect option[value="BRA"]').count(), 1);
});

await check('simulador en moneda local y actualización sin recrear el gráfico', async (page) => {
  await openOffline(page);
  await page.locator('.sidebar').getByRole('button', { name: 'Divisas y simulador' }).click();
  const chartBefore = await page.evaluate(() => { window.__simChart = simChartInstance; return !!simChartInstance; });
  assert.ok(chartBefore);
  const before = await page.textContent('#simOutEbitda');
  assert.match(before, /^−?PEN /);
  await page.$eval('#simFxShock', (el) => { el.value = '20'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  const after = await page.textContent('#simOutEbitda');
  assert.notEqual(after, before, 'una depreciación debe cambiar el EBITDA');
  assert.equal(await page.evaluate(() => window.__simChart === simChartInstance), true, 'el gráfico debe actualizarse en el sitio');
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
        body: JSON.stringify([{ page: 1 }, [{ countryiso3code: 'PER', date: '2024', value: 3.05, indicator: { id: 'NY.GDP.MKTP.KD.ZG' }, country: { value: 'Peru' } }]]),
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
  assert.equal(await page.evaluate(() => state.carouselTimer), null);
  await page.click('#carouselNext');
  assert.equal(await page.evaluate(() => state.carouselIndex), 1);
  assert.equal(await page.locator('#carouselDots .carousel-dot').nth(1).getAttribute('aria-current'), 'true');
});

await browser.close();
if (failures) {
  console.error(`\n${failures} comprobación(es) fallida(s)`);
  process.exit(1);
}
console.log('\nMacroScope e2e OK');
