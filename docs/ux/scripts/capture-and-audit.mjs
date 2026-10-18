import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const pwModule = await import('playwright').catch(() =>
  import(pathToFileURL(path.resolve('../auditoria-claude/node_modules/playwright/index.mjs')).href)
);
const { chromium } = pwModule;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];
const CAP_DIR = path.resolve('docs/ux/capturas');
fs.mkdirSync(CAP_DIR, { recursive: true });

const browser = await chromium.launch();

try {
  // 1. Auditar y capturar el prototipo estático (prototypes/inicio/index.html) en claro y oscuro en los 7 anchos
  const protoUrl = pathToFileURL(path.resolve('prototypes/inicio/index.html')).href;
  console.log('=== Auditando Prototipo en 7 anchos (claro y oscuro) ===');

  for (const theme of ['light', 'dark']) {
    const label = theme === 'light' ? 'claro' : 'oscuro';
    for (const w of WIDTHS) {
      const h = w < 768 ? 800 : 900;
      const context = await browser.newContext({ viewport: { width: w, height: h } });
      const page = await context.newPage();
      await page.goto(protoUrl, { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
        const btn = document.getElementById('themeToggleBtn');
        const lbl = document.getElementById('themeToggleLabel');
        if (btn && lbl) {
          btn.setAttribute('aria-pressed', String(t === 'dark'));
          lbl.textContent = t === 'dark' ? 'Modo claro' : 'Modo oscuro';
        }
      }, theme);
      await page.waitForTimeout(150);

      const metrics = await page.evaluate(() => {
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const interactive = [...document.querySelectorAll('a:not(.skip-link), button')];
        const smallTargets = interactive
          .map(el => {
            const r = el.getBoundingClientRect();
            return { text: el.textContent.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) };
          })
          .filter(r => r.w < 44 || r.h < 44);
        return {
          overflowX: docW > winW,
          docW,
          winW,
          smallTargets
        };
      });

      if (metrics.overflowX) {
        console.error(`[PROTO FAIL] Scroll horizontal en ${w}px (${label}): ${metrics.docW} > ${metrics.winW}`);
        process.exitCode = 1;
      }
      if (metrics.smallTargets.length > 0) {
        console.error(`[PROTO FAIL] Objetivos táctiles < 44px en ${w}px (${label}):`, metrics.smallTargets);
        process.exitCode = 1;
      }

      const outPath = path.join(CAP_DIR, `prototipo-inicio-${label}-${w}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      await context.close();
    }
    console.log(`[PROTO OK] ${label}: 7 anchos verificados sin scroll horizontal y con objetivos táctiles >= 44px.`);
  }

  // 2. Auditar y capturar producción (https://macroscope-dashboard.vercel.app) en los 7 anchos
  const prodUrl = 'https://macroscope-dashboard.vercel.app';
  console.log('=== Auditando Producción en 7 anchos ===');
  const prodAudit = {};

  for (const w of WIDTHS) {
    const h = w < 768 ? 800 : 900;
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    await page.goto(prodUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(800);

    const outPath = path.join(CAP_DIR, `produccion-${w}.png`);
    await page.screenshot({ path: outPath, fullPage: false });

    const data = await page.evaluate(() => {
      const cue = document.getElementById('heroScrollCue');
      const filters = document.getElementById('overviewFilters');
      const bcrp = document.getElementById('bcrpResults');
      const track = document.getElementById('insightTrack');
      const inner = document.querySelector('.insight-carousel-inner');
      const slide = document.querySelector('.insight-slide');
      const head = document.querySelector('.insight-head');
      const title = head?.querySelector('.section-title');
      const sub = head?.querySelector('.section-sub');
      const apiBadge = document.getElementById('apiStatusBadge');
      return {
        filterTop: filters ? Math.round(filters.getBoundingClientRect().top) : null,
        bcrpText: bcrp ? bcrp.innerText.slice(0, 220) : null,
        slideOpacity: slide ? getComputedStyle(slide).opacity : null,
        innerMask: inner ? getComputedStyle(inner).maskImage || getComputedStyle(inner).webkitMaskImage : null,
        titleSubGap: title && sub ? Math.round(sub.getBoundingClientRect().top - title.getBoundingClientRect().bottom) : null,
        apiBadgeRect: apiBadge ? { w: Math.round(apiBadge.getBoundingClientRect().width), h: Math.round(apiBadge.getBoundingClientRect().height) } : null,
        sidebarTextsHidden: [...document.querySelectorAll('.sidebar .nav-text')].every(el => getComputedStyle(el).clip === 'rect(0px, 0px, 0px, 0px)')
      };
    });

    if (w === 1440) {
      // Probar también el laboratorio a 1440x900 para medir posición del simulador respecto al pliegue
      await page.click('.sidebar [data-tab="simulator"]');
      await page.waitForTimeout(400);
      const labMetrics = await page.evaluate(() => {
        const panel = document.getElementById('islmPanelISLM');
        const guided = document.getElementById('islmGuided');
        const glossary = document.getElementById('islmGlossary')?.closest('details');
        return {
          canvasTopAt1440x900: panel ? Math.round(panel.getBoundingClientRect().top) : null,
          guidedOpenByDefault: guided ? guided.open : null,
          glossaryTop: glossary ? Math.round(glossary.getBoundingClientRect().top) : null
        };
      });
      data.labMetrics = labMetrics;
      await page.screenshot({ path: path.join(CAP_DIR, `produccion-laboratorio-1440.png`), fullPage: false });
    }

    prodAudit[w] = data;
    await context.close();
  }

  fs.writeFileSync(path.resolve('docs/ux/scripts/audit-metrics.json'), JSON.stringify(prodAudit, null, 2), 'utf8');
  console.log('=== Auditoría completada ===');
} finally {
  await browser.close();
}
