import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('test-results', { recursive: true });
const browser = await chromium.launch();
const failures = [];
const measurements = [];
async function check(name, run) {
  try { await run(); console.log('PASS ' + name); }
  catch (error) { failures.push(name); console.error('FAIL ' + name + ': ' + error.message); }
}
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/^https?:/, route => route.abort());
  await page.goto(new URL('../index.html#aprendizaje', import.meta.url).href);
  const input = async (selector, value) => {
    await page.locator(selector).evaluate((el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, String(value));
    await page.waitForTimeout(450);
  };
  for (const [g, direction, outcome] of [[-4, 'izquierda', 'disminuye'], [4, 'derecha', 'aumenta']]) {
    await input('#apSliderG', g);
    await check('lectura y curvas con gasto ' + g, async () => {
      const text = await page.locator('#apTheoryExplanation').innerText();
      assert.match(text, new RegExp('IS se desplaza a la ' + direction));
      assert.match(text, new RegExp('producto ' + outcome));
      assert.match(text, /E₀.*E₁/);
      assert.match(text, /E₁.*E₂/);
      const points = JSON.parse(await page.locator('#apDiagramContainer canvas').getAttribute('data-points'));
      assert.ok(g < 0 ? points[2].x < points[0].x : points[2].x > points[0].x);
      assert.ok(!(await page.locator('.ap-chain').innerText()).includes('(right)'));
      if (g < 0) await page.locator('#apTheoryExplanation').locator('..').screenshot({ path: 'test-results/learning-reading-contraction.png' });
    });
  }
  await input('#apSliderG', 0);
  await check('escenario base sin desplazamientos ficticios', async () => {
    assert.match(await page.locator('#apTheoryExplanation').innerText(), /Sin cambios/);
  });
  await input('#apSliderM', 4);
  await check('expansión monetaria explica LM y ajuste externo', async () => {
    assert.match(await page.locator('#apTheoryExplanation').innerText(), /LM se desplaza a la derecha/);
  });
  await input('#apSliderG', -4);
  await check('mezcla fiscal monetaria mantiene ambas causas', async () => {
    const text = await page.locator('#apTheoryExplanation').innerText();
    assert.match(text, /IS se desplaza a la izquierda/);
    assert.match(text, /LM se desplaza a la derecha/);
  });
  await page.selectOption('#apRegimeSelect', 'fixed');
  await check('tipo fijo explica dinero endógeno', async () => {
    assert.match(await page.locator('#apTheoryExplanation').innerText(), /endógen/);
    assert.ok(await page.locator('#apSliderM').isDisabled());
  });
  await page.selectOption('#apRegimeSelect', 'closed');
  await check('economía cerrada no ofrece shocks externos', async () => {
    assert.ok(await page.locator('#apSliderIstar').isDisabled());
    assert.match(await page.locator('#apTheoryExplanation').innerText(), /E₁.*E₂.*coinciden/);
  });
  await page.selectOption('#apRegimeSelect', 'flex');
  await input('#apSliderG', 0);
  await input('#apSliderM', 0);
  for (const [rate, direction] of [[2, 'arriba'], [-2, 'abajo']]) {
    await input('#apSliderIstar', rate);
    await check('shock externo ' + rate + ' desplaza BP', async () => {
      assert.match(await page.locator('#apTheoryExplanation').innerText(), new RegExp('BP se desplaza hacia ' + direction));
    });
  }
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 800 });
    await page.evaluate(theme => MacroScope.setTheme(theme), width === 390 ? 'dark' : 'light');
    for (const view of ['aprendizaje', 'modelos', 'politica-economica']) {
      await page.evaluate(view => location.hash = view, view);
      if (view === 'politica-economica') await page.click('[data-policy-section="trade"]');
      const card = page.locator('#' + view + ' .economic-diagram').first();
      // ResizeObserver paints on the next frame; do not compare a stale desktop
      // audit immediately after changing the viewport to mobile.
      await page.waitForFunction(view => {
        const canvas = document.querySelector('#' + view + ' .economic-diagram canvas');
        const audit = JSON.parse(canvas?.dataset.layoutAudit || 'null');
        return audit && Math.abs(audit.w - canvas.getBoundingClientRect().width) < 1;
      }, view);
      const normal = JSON.parse(await card.locator('canvas').getAttribute('data-layout-audit'));
      await card.locator('[data-economic-expand]').click();
      const dialog = page.locator('dialog.economic-zoom-dialog[open]');
      await check('ampliación legible ' + view + ' ' + width, async () => {
        const zoom = JSON.parse(await dialog.locator('canvas').first().getAttribute('data-layout-audit'));
        measurements.push({ view, width, normal, zoom });
        assert.ok(zoom.pw >= normal.pw, 'no debe perder anchura útil');
        assert.ok(zoom.pw * zoom.ph >= normal.pw * normal.ph * 1.35, 'área útil al menos 35% mayor');
        assert.ok(zoom.tickFontPx > normal.tickFontPx, 'escalas más grandes');
        assert.ok(zoom.calloutsInBounds);
        const rect = await dialog.locator('canvas').first().boundingBox();
        assert.ok(rect.y < 260, 'el encabezado no debe desplazar el gráfico fuera del foco');
        assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth + 1), 'sin desbordamiento horizontal');
        await dialog.locator('.economic-zoom-description').first().evaluate(el => el.open = true);
        assert.ok((await dialog.locator('.economic-zoom-description p').first().innerText()).length > 20, 'supuestos disponibles');
      });
      await dialog.screenshot({ path: `test-results/zoom-fixed-${view}-${width}.png` });
      if (view === 'politica-economica') {
        await dialog.locator('[data-economic-mode]').selectOption('policy-welfare');
        assert.equal(await dialog.locator('canvas').count(), 1);
        assert.ok(JSON.parse(await dialog.locator('canvas').getAttribute('data-layout-audit')).calloutsInBounds);
      }
      await page.keyboard.press('Escape');
      assert.ok(await card.locator('[data-economic-expand]').evaluate(el => el === document.activeElement));
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, [], 'regresiones pendientes');
  await writeFile('test-results/learning-reading-zoom-report.json', JSON.stringify({ passed: true, measurements, errors }, null, 2));
} finally { await browser.close(); }
