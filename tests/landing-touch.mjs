// Independent mobile touch E2E verification for the orbital home carousel (#inicio).
// Uses real browser touch synthesis via Chromium CDP Input.dispatchTouchEvent (with temporal frame steps)
// in mobile contexts (hasTouch: true, isMobile: true) across 360px, 390px, and 412px viewports.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('test-results', { recursive: true });
const PAGE_URL = new URL('../index.html', import.meta.url).href;
const browser = await chromium.launch();
let failures = 0;
let checks = 0;
const report = {
  executedAt: new Date().toISOString(),
  engine: 'Playwright Chromium + CDP Input.dispatchTouchEvent',
  realDeviceSafariIOS: 'NO VERIFICADO (entorno Windows local sin dispositivo iOS físico)',
  results: []
};

const CANONICAL_TITLES = [
  'Aprendizaje guiado',
  'Análisis histórico',
  'Indicadores macroeconómicos',
  'Exploración macroeconómica',
  'Comparación de economías',
  'Simulación de escenarios',
  'Modelos y tendencias'
];

async function check(name, opts, fn) {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }
  const viewport = opts.viewport || { width: 390, height: 844 };
  const context = await browser.newContext({
    viewport,
    hasTouch: true,
    isMobile: opts.isMobile ?? true,
    deviceScaleFactor: 2,
    reducedMotion: opts.reducedMotion || 'no-preference'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && !/Failed to load resource|net::|Access to fetch/.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  try {
    await page.route(/^https?:/, route => route.abort());
    await page.goto(PAGE_URL + '#inicio');
    await page.waitForSelector('.orbit-card.is-active');
    await page.waitForFunction(() => !document.getElementById('inicio').hidden);
    const cdp = await context.newCDPSession(page);
    await fn(page, cdp, context);
    assert.deepEqual(errors, [], 'errores de JavaScript en la página');
    checks++;
    report.results.push({ name, status: 'passed' });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures++;
    report.results.push({ name, status: 'failed', error: err.message });
    console.error(`  ✗ ${name}\n    ${err.message.split('\n').join('\n    ')}`);
  } finally {
    await context.close();
  }
}

async function cdpSwipe(cdp, page, { startX, startY, endX, endY, steps = 10, stepDelayMs = 14, onMidStep }) {
  const sx = Math.round(startX);
  const sy = Math.round(startY);
  const ex = Math.round(endX);
  const ey = Math.round(endY);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: sx, y: sy, id: 1, radiusX: 6, radiusY: 6, force: 1 }]
  });
  let midSnapshot = null;
  const midStep = Math.max(2, Math.floor(steps * 0.7));
  for (let i = 1; i <= steps; i++) {
    await page.waitForTimeout(stepDelayMs);
    const t = i / steps;
    const cx = Math.round(sx + (ex - sx) * t);
    const cy = Math.round(sy + (ey - sy) * t);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: cx, y: cy, id: 1, radiusX: 6, radiusY: 6, force: 1 }]
    });
    if (i === midStep && onMidStep) {
      midSnapshot = await onMidStep();
    }
  }
  await page.waitForTimeout(stepDelayMs);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await page.waitForTimeout(60);
  return midSnapshot;
}

async function cdpTap(cdp, page, x, y) {
  const tx = Math.round(x);
  const ty = Math.round(y);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: tx, y: ty, id: 1, radiusX: 5, radiusY: 5, force: 1 }]
  });
  await page.waitForTimeout(25);
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: []
  });
  await page.waitForTimeout(60);
}

console.log('MacroScope — Inicio táctil (CDP Input.dispatchTouchEvent)');

for (const width of [360, 390, 412]) {
  await check(
    `viewport ${width}px: swipe izquierda/derecha sobre título/texto, ilustración SVG y enlace con movimiento en vivo y settle sin navegar`,
    { viewport: { width, height: 800 } },
    async (page, cdp) => {
      // Verificar touch-action explícito en escenario, tarjeta y descendientes
      const touchActions = await page.evaluate(() => {
        const active = document.querySelector('.orbit-card.is-active');
        return [
          document.querySelector('.orbit-stage'),
          document.querySelector('.orbit-track'),
          active,
          active.querySelector('.orbit-card-inner'),
          active.querySelector('h2'),
          active.querySelector('p'),
          active.querySelector('.orbit-illustration'),
          active.querySelector('.orbit-card-open')
        ].map(el => getComputedStyle(el).touchAction);
      });
      assert.ok(touchActions.every(v => v === 'pan-y'), `touch-action debe ser pan-y en toda la tarjeta (${width}px): ${JSON.stringify(touchActions)}`);

      // 1) Swipe hacia la izquierda iniciado sobre el título/texto (h2/p) -> avanza de índice 3 a 4
      const titleBox = await page.locator('.orbit-card.is-active h2').boundingBox();
      const cardBefore1 = await page.locator('.orbit-card.is-active').boundingBox();
      const mid1 = await cdpSwipe(cdp, page, {
        startX: titleBox.x + titleBox.width * 0.72,
        startY: titleBox.y + titleBox.height * 0.5,
        endX: titleBox.x + titleBox.width * 0.72 - 96,
        endY: titleBox.y + titleBox.height * 0.5 + 4,
        onMidStep: async () => {
          const state = await page.evaluate(() => {
            const stage = document.querySelector('.orbit-stage');
            const active = document.querySelector('.orbit-card.is-active');
            const neighbor = document.querySelector('.orbit-card[data-home-slide="4"]');
            return {
              isDragging: stage.classList.contains('is-dragging'),
              activeDrag: parseFloat(active.style.getPropertyValue('--orbit-drag')),
              activeAngle: parseFloat(active.style.getPropertyValue('--orbit-drag-angle')),
              neighborDrag: parseFloat(neighbor.style.getPropertyValue('--orbit-drag')),
              rectX: active.getBoundingClientRect().x
            };
          });
          if (width === 360) {
            await page.screenshot({ path: 'test-results/landing-touch-360-dragging.png' });
          }
          return state;
        }
      });
      assert.equal(mid1.isDragging, true, `debe activar is-dragging durante el gesto (${width}px)`);
      assert.ok(mid1.activeDrag < -35, `la card activa debe desplazarse en vivo (${mid1.activeDrag}px)`);
      assert.ok(mid1.neighborDrag < -25 && Math.abs(mid1.neighborDrag) < Math.abs(mid1.activeDrag), 'la card vecina acompaña con paralaje');
      assert.ok(mid1.rectX < cardBefore1.x - 30, 'la posición visual X en pantalla debe moverse antes de touchend');
      assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
      assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 0);
      assert.equal(await page.locator('.orbit-card.is-active').evaluate(el => el.style.getPropertyValue('--orbit-drag')), '0px');
      assert.equal(await page.evaluate(() => location.hash), '#inicio', 'el swipe no debe abrir el enlace');

      // 2) Swipe hacia la izquierda iniciado sobre la ilustración SVG (.orbit-illustration) -> avanza de índice 4 a 5
      const svgBox = await page.locator('.orbit-card.is-active .orbit-illustration').boundingBox();
      const mid2 = await cdpSwipe(cdp, page, {
        startX: svgBox.x + svgBox.width * 0.75,
        startY: svgBox.y + svgBox.height * 0.55,
        endX: svgBox.x + svgBox.width * 0.75 - 102,
        endY: svgBox.y + svgBox.height * 0.55 - 3,
        onMidStep: () => page.evaluate(() => ({
          isDragging: document.querySelector('.orbit-stage').classList.contains('is-dragging'),
          activeDrag: parseFloat(document.querySelector('.orbit-card.is-active').style.getPropertyValue('--orbit-drag'))
        }))
      });
      assert.equal(mid2.isDragging, true);
      assert.ok(mid2.activeDrag < -35);
      assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Simulación de escenarios');
      assert.equal(await page.evaluate(() => location.hash), '#inicio');

      // 3) Swipe hacia la derecha iniciado sobre el enlace de la card (.orbit-card-open) -> retrocede de índice 5 a 4 sin navegar
      const linkBox = await page.locator('.orbit-card.is-active .orbit-card-open').boundingBox();
      const mid3 = await cdpSwipe(cdp, page, {
        startX: linkBox.x + linkBox.width * 0.5,
        startY: linkBox.y + linkBox.height * 0.5,
        endX: linkBox.x + linkBox.width * 0.5 + 98,
        endY: linkBox.y + linkBox.height * 0.5 + 2,
        onMidStep: () => page.evaluate(() => ({
          isDragging: document.querySelector('.orbit-stage').classList.contains('is-dragging'),
          activeDrag: parseFloat(document.querySelector('.orbit-card.is-active').style.getPropertyValue('--orbit-drag'))
        }))
      });
      assert.equal(mid3.isDragging, true, 'el gesto iniciado sobre .orbit-card-open debe arrastrar si es horizontal');
      assert.ok(mid3.activeDrag > 35);
      assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
      assert.equal(await page.evaluate(() => location.hash), '#inicio', 'el swipe sobre el enlace no debe navegar');

      // 4) Swipe hacia la derecha sobre el párrafo -> vuelve a índice 3 (Exploración macroeconómica)
      const pBox = await page.locator('.orbit-card.is-active p').boundingBox();
      await cdpSwipe(cdp, page, {
        startX: pBox.x + pBox.width * 0.25,
        startY: pBox.y + pBox.height * 0.5,
        endX: pBox.x + pBox.width * 0.25 + 95,
        endY: pBox.y + pBox.height * 0.5
      });
      assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Exploración macroeconómica');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `sin overflow horizontal a ${width}px`);
      await page.screenshot({ path: `test-results/landing-touch-${width}-settled.png` });
    }
  );
}

await check('recorrido completo de las 7 tarjetas y wrap-around circular en ambos sentidos con tacto real', async (page, cdp) => {
  // Inicialmente en índice 3 (Exploración macroeconómica)
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), CANONICAL_TITLES[3]);
  // 4 swipes a la izquierda: 3 -> 4 -> 5 -> 6 -> 0 (wrap de 07/07 a 01/07)
  for (const expectedIndex of [4, 5, 6, 0]) {
    const box = await page.locator('.orbit-card.is-active').boundingBox();
    await cdpSwipe(cdp, page, {
      startX: box.x + box.width * 0.72,
      startY: box.y + box.height * 0.52,
      endX: box.x + box.width * 0.72 - 96,
      endY: box.y + box.height * 0.52
    });
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), CANONICAL_TITLES[expectedIndex]);
    assert.equal(await page.locator(`[data-home-dot="${expectedIndex}"]`).getAttribute('aria-pressed'), 'true');
  }
  // Swipe a la derecha desde 0 -> 6 (wrap inverso de 01/07 a 07/07)
  const box = await page.locator('.orbit-card.is-active').boundingBox();
  await cdpSwipe(cdp, page, {
    startX: box.x + box.width * 0.28,
    startY: box.y + box.height * 0.52,
    endX: box.x + box.width * 0.28 + 96,
    endY: box.y + box.height * 0.52
  });
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), CANONICAL_TITLES[6]);
  assert.equal(await page.locator('[data-home-dot="6"]').getAttribute('aria-pressed'), 'true');
});

await check('drag corto recupera posición sin click y tap posterior sí navega al módulo', async (page, cdp) => {
  const box = await page.locator('.orbit-card.is-active').boundingBox();
  const midShort = await cdpSwipe(cdp, page, {
    startX: box.x + box.width * 0.5,
    startY: box.y + box.height * 0.55,
    endX: box.x + box.width * 0.5 - 20,
    endY: box.y + box.height * 0.55,
    steps: 6,
    stepDelayMs: 25,
    onMidStep: () => page.evaluate(() => ({
      isDragging: document.querySelector('.orbit-stage').classList.contains('is-dragging'),
      drag: parseFloat(document.querySelector('.orbit-card.is-active').style.getPropertyValue('--orbit-drag'))
    }))
  });
  assert.equal(midShort.isDragging, true, 'el drag corto mueve ligeramente la card');
  assert.ok(midShort.drag < -8, `desplazamiento parcial esperado: ${midShort.drag}`);
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Exploración macroeconómica', 'no cambia de card tras drag corto');
  assert.equal(await page.locator('.orbit-card.is-active').evaluate(el => el.style.getPropertyValue('--orbit-drag')), '0px');
  assert.equal(await page.evaluate(() => location.hash), '#inicio', 'el drag corto no navega');

  // Swipe a Comparación de economías y tap inmediato sobre la card para abrir el módulo
  await cdpSwipe(cdp, page, {
    startX: box.x + box.width * 0.72,
    startY: box.y + box.height * 0.55,
    endX: box.x + box.width * 0.72 - 96,
    endY: box.y + box.height * 0.55
  });
  assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
  const activeBox = await page.locator('.orbit-card.is-active h2').boundingBox();
  await cdpTap(cdp, page, activeBox.x + activeBox.width * 0.5, activeBox.y + activeBox.height * 0.5);
  await page.waitForFunction(() => location.hash === '#comparacion' && !document.getElementById('comparacion').hidden);

  // Regresar a Inicio y probar tap directo sobre .orbit-card-open
  await page.evaluate(() => { location.hash = 'inicio'; });
  await page.waitForFunction(() => !document.getElementById('inicio').hidden);
  const openBtnBox = await page.locator('.orbit-card.is-active .orbit-card-open').boundingBox();
  await cdpTap(cdp, page, openBtnBox.x + openBtnBox.width * 0.5, openBtnBox.y + openBtnBox.height * 0.5);
  await page.waitForFunction(() => location.hash === '#comparacion' && !document.getElementById('comparacion').hidden);
});

await check(
  'scroll vertical natural cambia scrollY sin cambiar card, y lostpointercapture del descendiente vs cancelación real de stage / multitáctil',
  { viewport: { width: 360, height: 520 } },
  async (page, cdp) => {
    const initialTitle = await page.locator('.orbit-card.is-active h2').textContent();
    assert.equal(await page.evaluate(() => window.scrollY), 0);
    const box = await page.locator('.orbit-card.is-active').boundingBox();

    // 1) Gesto vertical con Input.dispatchTouchEvent + gesto de scroll táctil nativo del compositor (Input.synthesizeScrollGesture)
    const sx = Math.round(box.x + box.width * 0.5);
    const sy = Math.round(box.y + box.height * 0.65);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: sx, y: sy, id: 1, radiusX: 6, radiusY: 6 }]
    });
    for (let i = 1; i <= 8; i++) {
      await page.waitForTimeout(16);
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: sx - (i % 3), y: sy - i * 18, id: 1, radiusX: 6, radiusY: 6 }]
      });
    }
    const duringVertical = await page.evaluate(() => ({
      isDragging: document.querySelector('.orbit-stage').classList.contains('is-dragging'),
      drag: document.querySelector('.orbit-card.is-active').style.getPropertyValue('--orbit-drag')
    }));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(40);
    await cdp.send('Input.synthesizeScrollGesture', {
      x: sx,
      y: sy,
      xDistance: 0,
      yDistance: -140,
      gestureSourceType: 'touch',
      speed: 800
    });
    const afterScrollY = await page.evaluate(() => window.scrollY);
    assert.ok(afterScrollY > 0, `el gesto vertical táctil en la card debe desplazar scrollY (${afterScrollY}px)`);
    assert.equal(duringVertical.isDragging, false, 'el gesto vertical no activa is-dragging');
    assert.equal(duringVertical.drag, '0px');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), initialTitle);
    await page.evaluate(() => window.scrollTo(0, 0));

    // 2) Verificar explícitamente que lostpointercapture del descendiente (por captura implícita táctil) NO aborta el drag,
    // pero lostpointercapture directo del propio .orbit-stage SÍ limpia el estado activo.
    await page.evaluate(() => {
      window.__captureLog = [];
      const stage = document.querySelector('.orbit-stage');
      stage.addEventListener('lostpointercapture', e => {
        window.__captureLog.push({
          targetIsStage: e.target === stage,
          targetTag: e.target.tagName,
          stillDraggingAfterHandler: stage.classList.contains('is-dragging')
        });
      });
    });

    // Multitáctil: dedo 1 inicia drag horizontal sobre descendiente (P/H2), dedo 2 toca y se mueve sin provocar saltos
    const box2 = await page.locator('.orbit-card.is-active').boundingBox();
    const x1 = Math.round(box2.x + box2.width * 0.7);
    const y1 = Math.round(box2.y + box2.height * 0.5);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: x1, y: y1, id: 1 }]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x1 - 35, y: y1, id: 1 }]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: x1 - 50, y: y1, id: 1 }]
    });
    const captureEventsMidDrag = await page.evaluate(() => window.__captureLog);
    assert.ok(
      captureEventsMidDrag.some(e => e.targetIsStage === false && e.stillDraggingAfterHandler === true),
      `lostpointercapture del descendiente no debe cancelar el drag: ${JSON.stringify(captureEventsMidDrag)}`
    );
    const dragBeforeSecondFinger = await page.locator('.orbit-card.is-active').evaluate(el => parseFloat(el.style.getPropertyValue('--orbit-drag')));
    assert.ok(dragBeforeSecondFinger < -20);
    // Entra segundo dedo lejos
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [
        { x: x1 - 50, y: y1, id: 1 },
        { x: 40, y: 200, id: 2 }
      ]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        { x: x1 - 85, y: y1, id: 1 },
        { x: 180, y: 220, id: 2 }
      ]
    });
    const dragWithTwoFingers = await page.locator('.orbit-card.is-active').evaluate(el => parseFloat(el.style.getPropertyValue('--orbit-drag')));
    assert.ok(dragWithTwoFingers < -60, `el primer dedo conserva control sin saltos (${dragWithTwoFingers}px)`);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(60);
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');

    // 3) Pérdida real de captura en .orbit-stage (event.target === stage) a mitad de un drag limpia el estado sin avanzar
    const boxStageCancel = await page.locator('.orbit-card.is-active').boundingBox();
    const scx = Math.round(boxStageCancel.x + boxStageCancel.width * 0.7);
    const scy = Math.round(boxStageCancel.y + boxStageCancel.height * 0.5);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: scx, y: scy, id: 4 }]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: scx - 70, y: scy, id: 4 }]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: scx - 85, y: scy, id: 4 }]
    });
    assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 1);
    await page.evaluate(() => {
      const stage = document.querySelector('.orbit-stage');
      for (let pid = 1; pid <= 20; pid++) {
        if (stage.hasPointerCapture?.(pid)) stage.releasePointerCapture(pid);
      }
    });
    // En Blink/W3C Pointer Events, releasePointerCapture se procesa al siguiente evento de puntero,
    // emitiendo lostpointercapture real con event.target === stage.
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: scx - 95, y: scy, id: 4 }]
    });
    await page.waitForTimeout(30);
    const stageLostEvents = await page.evaluate(() => window.__captureLog.filter(e => e.targetIsStage === true));
    assert.ok(stageLostEvents.length >= 1, 'stage debe emitir su propio lostpointercapture al liberar captura');
    assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 0, 'lostpointercapture propio de stage limpia is-dragging');
    assert.equal(await page.locator('.orbit-card.is-active').evaluate(el => el.style.getPropertyValue('--orbit-drag')), '0px');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(40);
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');

    // 4) Cancelación (touchCancel) limpia el estado sin cambiar de tarjeta
    const box3 = await page.locator('.orbit-card.is-active').boundingBox();
    const cx = Math.round(box3.x + box3.width * 0.7);
    const cy = Math.round(box3.y + box3.height * 0.5);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: cx, y: cy, id: 5 }]
    });
    await page.waitForTimeout(16);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: cx - 75, y: cy, id: 5 }]
    });
    assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 1);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchCancel',
      touchPoints: []
    });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 0);
    assert.equal(await page.locator('.orbit-card.is-active').evaluate(el => el.style.getPropertyValue('--orbit-drag')), '0px');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
  }
);

await check(
  'orientación/resize, reduced-motion, modo claro/oscuro, flechas, dots, teclado y mouse intactos',
  { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' },
  async (page, cdp) => {
    assert.equal(await page.locator('.orbit-card.is-active').evaluate(el => getComputedStyle(el).transitionDuration), '0s');

    // Cambio a modo oscuro y verificación táctil
    await page.click('#themeBtn');
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    const box = await page.locator('.orbit-card.is-active').boundingBox();
    await cdpSwipe(cdp, page, {
      startX: box.x + box.width * 0.75,
      startY: box.y + box.height * 0.5,
      endX: box.x + box.width * 0.75 - 95,
      endY: box.y + box.height * 0.5
    });
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
    await page.screenshot({ path: 'test-results/landing-touch-390-dark.png' });

    // Rotación a landscape (844x390) y swipe de regreso
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(50);
    assert.equal(await page.locator('.orbit-stage.is-dragging').count(), 0);
    const lBox = await page.locator('.orbit-card.is-active').boundingBox();
    await cdpSwipe(cdp, page, {
      startX: lBox.x + lBox.width * 0.25,
      startY: lBox.y + lBox.height * 0.5,
      endX: lBox.x + lBox.width * 0.25 + 105,
      endY: lBox.y + lBox.height * 0.5
    });
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Exploración macroeconómica');

    // Flechas, dots, teclado y mouse drag siguen operativos
    await page.click('#homeNext');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Comparación de economías');
    await page.click('#homePrev');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Exploración macroeconómica');
    await page.click('[data-home-dot="0"]');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Aprendizaje guiado');
    await page.locator('#homeCarousel').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Análisis histórico');
    const mBox = await page.locator('.orbit-card.is-active').boundingBox();
    await page.mouse.move(mBox.x + mBox.width * 0.6, mBox.y + mBox.height * 0.6);
    await page.mouse.down();
    await page.mouse.move(mBox.x + mBox.width * 0.6 - 90, mBox.y + mBox.height * 0.6, { steps: 8 });
    await page.mouse.up();
    assert.equal(await page.locator('.orbit-card.is-active h2').textContent(), 'Indicadores macroeconómicos');
  }
);

await writeFile('test-results/landing-touch-report.json', JSON.stringify(report, null, 2));
await browser.close();

if (failures > 0) {
  console.error(`\n${failures} de ${checks + failures} verificaciones táctiles fallaron.`);
  process.exit(1);
}
console.log(`\n${checks} verificaciones táctiles completadas con éxito.`);
