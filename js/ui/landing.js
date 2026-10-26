/* Portada orbital — interacción independiente de los datos y del motor IS–LM–BP. */
(function () {
  'use strict';

  function setupLanding() {
    const stage = document.querySelector('#inicio .orbit-stage');
    const track = document.getElementById('homeCarousel');
    if (!stage || !track || track.dataset.ready === 'true') return;
    track.dataset.ready = 'true';

    const slides = [...track.querySelectorAll('[data-home-slide]')];
    const dots = [...document.querySelectorAll('[data-home-dot]')];
    const hint = document.getElementById('orbitHint');
    const themeButton = document.getElementById('themeBtn');
    const total = slides.length;
    if (total < 2 || total !== dots.length) return;

    let current = 3; // El módulo principal se ve primero.
    let pointerStart = null;
    let isDragging = false;
    let dragX = 0;
    let suppressSwipeClick = false;
    let dragClickGuard = 0;
    let wheelAccumulated = 0;
    let wheelDirection = 0;
    let lastWheelStep = -Infinity;
    let lastWheelInput = -Infinity;

    const xPositions = [0, 1.16, 1.96, 2.6];
    const scales = [1, .91, .81, .72];
    const yPositions = [0, 20, 35, 48];
    const zPositions = [0, -55, -120, -185];
    const rotations = [0, 12, 20, 27];
    const tilt = [0, 1.5, 2.8, 4];
    const opacities = [1, .97, .85, .7];
    const blurs = [0, 0, .35, .7];

    function isHomeVisible() {
      return !document.getElementById('inicio').hidden;
    }

    function render(announce = true) {
      slides.forEach((slide, index) => {
        let offset = (index - current + total) % total;
        if (offset > Math.floor(total / 2)) offset -= total;
        const distance = Math.abs(offset);
        const direction = Math.sign(offset);
        const active = distance === 0;
        slide.classList.toggle('is-active', active);
        slide.dataset.distance = String(distance);
        slide.style.setProperty('--orbit-x', String(direction * xPositions[distance]));
        slide.style.setProperty('--orbit-y', yPositions[distance] + 'px');
        slide.style.setProperty('--orbit-z', zPositions[distance] + 'px');
        slide.style.setProperty('--orbit-scale', String(scales[distance]));
        slide.style.setProperty('--orbit-rotation', (-direction * rotations[distance]) + 'deg');
        slide.style.setProperty('--orbit-tilt', (-direction * tilt[distance]) + 'deg');
        slide.style.setProperty('--orbit-depth', String(distance));
        slide.style.setProperty('--orbit-opacity', String(opacities[distance]));
        slide.style.setProperty('--orbit-blur', blurs[distance] + 'px');
        slide.setAttribute('aria-hidden', String(!active));

        // Solo el enlace visible entra en el orden de tabulación.
        const link = slide.querySelector('.orbit-card-open');
        if (!link) return;
        if (!link.dataset.destination) link.dataset.destination = link.getAttribute('href') || '';
        if (active) link.setAttribute('href', link.dataset.destination);
        else link.removeAttribute('href');
        link.tabIndex = active ? 0 : -1;
      });

      dots.forEach((dot, index) => {
        dot.setAttribute('aria-pressed', String(index === current));
        dot.setAttribute('aria-current', index === current ? 'true' : 'false');
      });
      if (hint && announce) {
        hint.textContent = (current + 1) + ' / ' + total + ' · ' +
          slides[current].querySelector('h2').textContent +
          ' · Rueda del mouse, flechas o desliza';
      }
    }

    // El arrastre mueve las siete tarjetas de forma continua, con profundidad:
    // la central acompaña al puntero y las laterales se desplazan menos.
    function renderDrag(offset) {
      slides.forEach((slide, index) => {
        let relative = (index - current + total) % total;
        if (relative > Math.floor(total / 2)) relative -= total;
        const distance = Math.abs(relative);
        const weight = [1, .74, .48, .27][distance];
        slide.style.setProperty('--orbit-drag', (offset * weight).toFixed(2) + 'px');
        slide.style.setProperty('--orbit-drag-angle', (offset / 27 * weight).toFixed(2) + 'deg');
      });
    }

    function clearDrag() {
      stage.classList.remove('is-dragging');
      isDragging = false;
      dragX = 0;
      slides.forEach(slide => {
        slide.style.setProperty('--orbit-drag', '0px');
        slide.style.setProperty('--orbit-drag-angle', '0deg');
      });
    }

    function select(index) {
      clearDrag();
      const next = (index + total) % total;
      if (next === current) return;
      current = next;
      render();
    }

    document.getElementById('homePrev')?.addEventListener('click', () => select(current - 1));
    document.getElementById('homeNext')?.addEventListener('click', () => select(current + 1));
    dots.forEach((dot, index) => dot.addEventListener('click', () => select(index)));

    function openSlide(index) {
      const link = slides[index].querySelector('.orbit-card-open');
      const destination = link?.dataset.destination || link?.getAttribute('href');
      if (destination) location.hash = globalThis.MacroScope.navigation.canonicalHash(destination).slice(1);
    }

    slides.forEach((slide, index) => slide.addEventListener('click', event => {
      if (suppressSwipeClick || event.target.closest('a')) return;
      if (index !== current) {
        select(index);
      } else {
        openSlide(index);
      }
    }));

    track.tabIndex = 0;
    track.setAttribute('role', 'region');
    track.setAttribute('aria-roledescription', 'carrusel');
    track.setAttribute('aria-label', 'Módulos de Macroscope. Usa las flechas izquierda y derecha para cambiar');
    track.addEventListener('keydown', event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        select(current + (event.key === 'ArrowRight' ? 1 : -1));
      } else if (event.key === 'Home') {
        event.preventDefault();
        select(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        select(total - 1);
      } else if (event.key === 'Enter' && event.target === track) {
        openSlide(current);
      }
    });

    // Reacciona a mouse wheel y trackpad sin disparar múltiples pasos por una sola ráfaga.
    // Se intercepta únicamente cuando el puntero está sobre el escenario de la portada.
    stage.addEventListener('wheel', event => {
      if (!isHomeVisible() || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (!delta) return;
      const now = performance.now();
      const direction = Math.sign(delta);
      if (direction !== wheelDirection || now - lastWheelInput > 300) {
        wheelAccumulated = 0;
        wheelDirection = direction;
      }
      lastWheelInput = now;
      if (now - lastWheelStep < 580) return;
      wheelAccumulated += Math.min(Math.abs(delta), 150) * direction;
      if (Math.abs(wheelAccumulated) < 65) return;
      select(current + direction);
      lastWheelStep = now;
      wheelAccumulated = 0;
    }, { passive: false });

    // Drag real: mouse y touch. El arrastre mueve las cards antes de soltar.
    // touch-action:pan-y permite el desplazamiento vertical natural en móvil.
    stage.addEventListener('pointerdown', event => {
      if (event.target.closest('a,button')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
      isDragging = false;
      dragX = 0;
    });

    stage.addEventListener('pointermove', event => {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      if (!isDragging) {
        if (Math.abs(dx) < 9 || Math.abs(dx) <= Math.abs(dy) * 1.15) return;
        isDragging = true;
        stage.classList.add('is-dragging');
        try { stage.setPointerCapture(event.pointerId); } catch (_) { /* puntero cancelado */ }
      }
      dragX = Math.max(-160, Math.min(160, dx));
      renderDrag(dragX);
    });

    function finishDrag(event, cancelled = false) {
      if (!pointerStart || event.pointerId !== pointerStart.id) return;
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      const dragged = isDragging;
      const shouldSlide = !cancelled && dragged && Math.abs(dx) >= 55 &&
        Math.abs(dx) > Math.abs(dy) * 1.15;
      pointerStart = null;
      if (stage.hasPointerCapture?.(event.pointerId)) {
        try { stage.releasePointerCapture(event.pointerId); } catch (_) {}
      }
      if (dragged) {
        // El click sintético del pointerup no debe activar otra tarjeta.
        const guard = ++dragClickGuard;
        suppressSwipeClick = true;
        setTimeout(() => {
          if (guard === dragClickGuard) suppressSwipeClick = false;
        }, 350);
      }
      // Animación de retorno suave cuando el gesto no supera el umbral.
      if (shouldSlide) select(current + (dx < 0 ? 1 : -1));
      else clearDrag();
    }

    stage.addEventListener('pointerup', event => finishDrag(event));
    stage.addEventListener('pointercancel', event => finishDrag(event, true));
    stage.addEventListener('lostpointercapture', event => {
      if (pointerStart && pointerStart.id === event.pointerId) {
        pointerStart = null;
        clearDrag();
      }
    });
    stage.addEventListener('click', event => {
      if (!suppressSwipeClick) return;
      event.preventDefault();
      event.stopPropagation();
    }, true);

    // During a perspective transition Chromium can hit the track instead of the
    // visible card. Honour clicks inside the active card's projected bounds,
    // while leaving side-card selection, buttons and drag suppression intact.
    stage.addEventListener('click', event => {
      if (suppressSwipeClick || event.defaultPrevented || ![stage, track].includes(event.target)) return;
      const box = slides[current].getBoundingClientRect();
      if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) openSlide(current);
    });

    // Etiqueta accesible actualizada sin interferir con setTheme() del resto de la web.
    if (themeButton) {
      const syncThemeLabel = () => {
        const dark = document.documentElement.dataset.theme === 'dark';
        const label = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
        themeButton.setAttribute('aria-label', label);
        themeButton.setAttribute('title', label);
      };
      new MutationObserver(syncThemeLabel).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      syncThemeLabel();
    }

    render(false);
    if (hint) {
      hint.setAttribute('aria-live', 'polite');
      hint.textContent = 'Gira la rueda del mouse o usa las flechas para explorar los módulos';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupLanding);
  else setupLanding();
})();
