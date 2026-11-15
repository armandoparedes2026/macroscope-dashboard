import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const output = 'test-results/lab-comparison/final';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.route(/^https?:/, r => r.abort());
const cases = [
  ['desktop-1440-light-base',1440,900,'light',null,'flex','high'],
  ['desktop-1440-light-fiscal',1440,900,'light','fiscal','flex','high'],
  ['desktop-1672-light-fiscal',1672,941,'light','fiscal','flex','high'],
  ['desktop-1440-dark-fiscal',1440,900,'dark','fiscal','flex','high'],
  ['desktop-1440-light-perfect-fiscal',1440,900,'light','fiscal','flex','perfect'],
  ['desktop-1440-light-fixed-deval',1440,900,'light','devaluation','fixed','perfect'],
  ['mobile-390-light-fiscal',390,844,'light','fiscal','flex','high'],
  ['mobile-360-light-fiscal',360,800,'light','fiscal','flex','high']
];
const results = [];
for (const [name,width,height,theme,preset,regime,mobility] of cases) {
  await page.setViewportSize({width,height});
  await page.goto(new URL('../index.html#simulacion', import.meta.url).href);
  await page.waitForFunction(() => document.querySelectorAll('#islmResults tr').length > 0);
  await page.evaluate(t => MacroScope.setTheme(t), theme);
  await page.selectOption('#islmRegime', regime);
  await page.selectOption('#islmMobility', mobility);
  if (preset) await page.evaluate(p => document.querySelector(`[data-preset="${p}"]`).click(), preset);
  await page.waitForFunction(() => [...document.querySelectorAll('.islm-panel canvas')].every(c => c.dataset.animating === 'false'));
  const metrics = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth-innerWidth,
    resultsBottom: Math.round(document.querySelector('#islmScenarioCards').getBoundingClientRect().bottom),
    readingFont: getComputedStyle(document.querySelector('#islmNarrative')).fontSize,
    badge: document.querySelector('#islmScenarioDeltaBadge').textContent,
    E0: MacroScope.labs.islm.snapshot().E0,
    E2: MacroScope.labs.islm.snapshot().E2
  }));
  results.push({name,width,height,...metrics});
  await page.screenshot({path:`${output}/${name}.png`});
  await page.screenshot({path:`${output}/${name}-full.png`,fullPage:true});
}
await browser.close();
await writeFile(`${output}/metrics.json`, JSON.stringify({results,errors},null,2));
console.log(JSON.stringify({captures:cases.length*2,results:results.map(({E0,E2,...m})=>m),errors}));
if (errors.length || results.some(r=>r.overflow>2)) process.exitCode=1;
