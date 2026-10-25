/* Portada: carrusel de módulos; no altera el motor económico ni las fuentes. */
(function () {
  'use strict';
  function setupLanding() {
    const track = document.getElementById('homeCarousel');
    const stage = document.querySelector('.orbit-stage');
    if (!track || !stage) return;
    const slides = [...track.querySelectorAll('[data-home-slide]')];
    const dots = [...document.querySelectorAll('[data-home-dot]')];
    const hint = document.getElementById('orbitHint');
    const total = slides.length;
    let current = 3;
    let pointerStart = null;
    const xPositions = [0, 1.2, 2.07, 2.72];
    const scales = [1, .91, .8, .72];
    const yPositions = [0, 28, 44, 57];
    const opacity = [1, .96, .8, .7];

    function render(announce = true) {
      slides.forEach((slide, index) => {
        let offset = (index - current + total) % total;
        if (offset > Math.floor(total / 2)) offset -= total;
        const distance = Math.abs(offset);
        const direction = Math.sign(offset);
        const active = distance === 0;
        slide.classList.toggle('is-active', active);
        slide.dataset.distance = String(distance);
        slide.style.setProperty('--orbit-x', String(xPositions[distance] * direction));
        slide.style.setProperty('--orbit-y', yPositions[distance] + 'px');
        slide.style.setProperty('--orbit-scale', String(scales[distance]));
        slide.style.setProperty('--orbit-rotation', (-direction * [0, 7, 12, 16][distance]) + 'deg');
        slide.style.setProperty('--orbit-depth', String(distance));
        slide.style.setProperty('--orbit-opacity', String(opacity[distance]));
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        const link = slide.querySelector('.orbit-card-open');
        if (link) link.tabIndex = active ? 0 : -1;
      });
      dots.forEach((dot, index) => dot.setAttribute('aria-pressed', String(index === current)));
      if (hint && announce) hint.textContent = (current + 1) + ' de ' + total + ' · ' +
        slides[current].querySelector('h2').textContent + ' · Usa las flechas o desliza';
    }
    function select(index) {
      current = (index + total) % total;
      render();
    }
    document.getElementById('homePrev')?.addEventListener('click', () => select(current - 1));
    document.getElementById('homeNext')?.addEventListener('click', () => select(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => select(index)));
    slides.forEach((slide, index) => slide.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      if (index !== current) select(index);
      else {
        const link = slide.querySelector('.orbit-card-open');
        if (link) location.hash = link.getAttribute('href').slice(1);
      }
    }));
    track.tabIndex = 0;
    track.setAttribute('aria-label', 'Carrusel de módulos. Usa las flechas izquierda y derecha');
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        select(current + (event.key === 'ArrowRight' ? 1 : -1));
      }
      if (event.key === 'Enter') {
        const link = slides[current].querySelector('.orbit-card-open');
        link?.click();
      }
    });
    stage.addEventListener('pointerdown', event => {
      if (event.target.closest('a,button')) return;
      pointerStart = { x: event.clientX, y: event.clientY, type: event.pointerType };
    });
    stage.addEventListener('pointerup', event => {
      if (!pointerStart) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      pointerStart = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) select(current + (dx < 0 ? 1 : -1));
    });
    stage.addEventListener('pointercancel', () => { pointerStart = null; });
    render(false);
    if (hint) hint.setAttribute('aria-live', 'polite');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupLanding);
  else setupLanding();
})();
