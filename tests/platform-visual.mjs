import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const output = 'test-results/platform';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/^https?:/, r => r.abort());
await page.goto(new URL('../index.html', import.meta.url).href);
await page.waitForFunction(() => document.getElementById('apiStatusText').textContent.includes('Respaldo'));
const routes = ['inicio','aprendizaje','historico','indicadores','exploracion','comparacion','simulacion','modelos','observatorio','fuentes','ayuda'];
const metrics = [];
for (const [size,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',360,800]]) {
  await page.setViewportSize({width,height});
  for (const theme of ['light','dark']) {
    await page.evaluate(t => MacroScope.setTheme(t), theme);
    for (const view of routes) {
      await page.evaluate(v => { location.hash = v; }, view);
      await page.waitForFunction(v => document.documentElement.dataset.activeView === v, view);
      await page.waitForTimeout(80);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth-innerWidth);
      metrics.push({size,theme,view,overflow});
      await page.screenshot({path:`${output}/${view}-${size}-${theme}.png`});
    }
  }
}
await writeFile(`${output}/visual-results.json`, JSON.stringify({metrics,errors},null,2));
await browser.close();
console.log(JSON.stringify({captures:metrics.length,overflow:metrics.filter(m=>m.overflow>2),errors}));
if(errors.length || metrics.some(m=>m.overflow>2)) process.exitCode=1;
