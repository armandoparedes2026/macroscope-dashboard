/* One navigation contract for the orbital home, header, search and legacy links. */
(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const destinations = Object.freeze([
    { id: 'inicio', label: 'Inicio', icon: 'grid', description: 'Las siete experiencias de Macroscope' },
    { id: 'aprendizaje', label: 'Aprendizaje guiado', short: 'Aprendizaje', icon: 'book', description: 'Lecciones, ejercicios y progreso de aprendizaje' },
    { id: 'historico', label: 'Análisis histórico', icon: 'calendar', description: 'Series de tiempo, periodos y exportación' },
    { id: 'indicadores', label: 'Indicadores macroeconómicos', icon: 'chart', description: 'Catálogo, definiciones y fichas analíticas' },
    { id: 'exploracion', label: 'Exploración macroeconómica', short: 'Panorama', icon: 'chart', tab: 'overview', description: 'Panorama, datos oficiales y lectura económica' },
    { id: 'comparacion', label: 'Comparación de economías', short: 'Comparador', icon: 'compare', description: 'Países, mapas y comparaciones internacionales' },
    { id: 'simulacion', label: 'Simulación de escenarios', short: 'Laboratorio', icon: 'flask', tab: 'simulator', description: 'Laboratorio IS–LM–BP y escenarios guardados' },
    { id: 'modelos', label: 'Modelos y tendencias', icon: 'model', description: 'Biblioteca de modelos económicos' },
    { id: 'observatorio', label: 'Observatorio del Perú', short: 'Perú', icon: 'globe', description: 'Indicadores nacionales y fuentes peruanas' },
    { id: 'fuentes', label: 'Biblioteca de fuentes', short: 'Fuentes', icon: 'database', description: 'Organismos, bases, APIs y metodología' },
    { id: 'ayuda', label: 'Ayuda y metodología', icon: 'info', description: 'Guía de uso, glosario y citación' }
  ]);
  const aliases = Object.freeze({ panorama: 'exploracion', laboratorio: 'simulacion', aprender: 'aprendizaje', explorar: 'exploracion', comparador: 'comparacion' });
  const canonicalView = id => aliases[id] || (destinations.some(d => d.id === id) ? id : 'inicio');
  const canonicalHash = hash => {
    const [id, ...query] = String(hash || '').replace(/^#/, '').split('?');
    return '#' + canonicalView(id) + (query.length ? '?' + query.join('?') : '');
  };
  const paths = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    book: 'M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-3-1-7-2-10 1zm0 0v15',
    calendar: 'M4 5h16v16H4zM8 2v6m8-6v6M4 10h16',
    chart: 'M4 20V11m6 9V4m6 16V8m5 12V2',
    compare: 'M3 6h17m-4-4 4 4-4 4M21 18H4m4-4-4 4 4 4',
    flask: 'M9 2h6m-5 0v7L4 19q-1 3 2 3h12q3 0 2-3L14 9V2M7 15h10',
    model: 'm12 3 9 17H3L12 3zm0 0v17M3 20l15-10M6 10l15 10',
    globe: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18',
    database: 'M4 5c0-4 16-4 16 0s-16 4-16 0zm0 0v14c0 4 16 4 16 0V5M4 12c0 4 16 4 16 0',
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 11v6m0-10v1'
  };
  const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[key] || paths.grid}"/></svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function setupNavigation() {
    const nav = document.querySelector('.primary-nav');
    const primary = ['exploracion', 'comparacion', 'observatorio', 'simulacion', 'aprendizaje', 'fuentes'];
    const link = (d, extra = '') => `<a href="#${d.id}" data-route="${d.id}" class="${extra}">${icon(d.icon)}<span>${esc(d.short || d.label)}</span></a>`;
    nav.innerHTML = primary.map(id => link(destinations.find(d => d.id === id))).join('') +
      `<details class="nav-more"><summary aria-label="Más experiencias">Más <span aria-hidden="true">⌄</span></summary><div class="nav-more-panel">${destinations.filter(d => !primary.includes(d.id)).map(d => link(d)).join('')}</div></details>`;
    document.querySelectorAll('a[href^="#"]').forEach(a => a.setAttribute('href', canonicalHash(a.getAttribute('href'))));
    document.querySelectorAll('.orbit-card-open[data-destination]').forEach(a => { a.dataset.destination = canonicalHash(a.dataset.destination); });
    const search = document.createElement('button');
    search.type = 'button'; search.className = 'platform-search'; search.id = 'platformSearchBtn';
    search.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/></svg><span>Buscar en Macroscope</span>';
    search.setAttribute('aria-label', 'Buscar experiencias, indicadores y fuentes');
    search.setAttribute('aria-haspopup', 'dialog');
    document.querySelector('.top-right').prepend(search);
    const dialog = document.createElement('dialog'); dialog.id = 'platformSearch'; dialog.className = 'platform-search-dialog';
    dialog.setAttribute('aria-labelledby', 'platformSearchTitle');
    dialog.innerHTML = '<div class="search-heading"><div><span class="platform-eyebrow">EXPLORA MACROSCOPE</span><h2 id="platformSearchTitle">Encuentra tu próximo paso</h2></div><button type="button" class="icon-button" data-close-search aria-label="Cerrar búsqueda">×</button></div><label class="search-field" for="platformSearchInput">Experiencia, indicador o fuente<input id="platformSearchInput" type="search" placeholder="Prueba: inflación, histórico, BCRP…" autocomplete="off"></label><div id="platformSearchResults" class="platform-search-results" aria-live="polite"></div>';
    document.body.append(dialog);
    const input = dialog.querySelector('input');
    const renderSearch = () => {
      const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const q = normalize(input.value.trim());
      let results = destinations.filter(d => !q || normalize(d.label + ' ' + d.description).includes(q)).map(d => ({ ...d, href: '#' + d.id }));
      if (q) {
        results = results.concat((M.INDICATORS_CATALOG || []).filter(d => normalize(d.title + ' ' + d.code).includes(q)).map(d => ({ label: d.title, description: d.code + ' · ' + d.provider, icon: 'chart', href: '#indicadores?id=' + encodeURIComponent(d.id) })));
        results = results.concat((M.SOURCES_CATALOG?.SOURCES || []).filter(d => normalize(d.name + ' ' + d.org).includes(q)).map(d => ({ label: d.name, description: d.org, icon: 'database', href: '#fuentes?q=' + encodeURIComponent(d.name) })));
      }
      dialog.querySelector('#platformSearchResults').innerHTML = results.length ? results.slice(0, 24).map(d => `<a href="${esc(d.href)}">${icon(d.icon)}<span><strong>${esc(d.label)}</strong><small>${esc(d.description)}</small></span><span aria-hidden="true">↗</span></a>`).join('') : '<p class="data-note">Sin coincidencias. Prueba otro concepto o código de serie.</p>';
    };
    search.addEventListener('click', () => { input.value = ''; renderSearch(); dialog.showModal(); input.focus(); });
    input.addEventListener('input', renderSearch);
    dialog.querySelector('[data-close-search]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target.closest('a')) dialog.close(); if (e.target === dialog) dialog.close(); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) nav.querySelectorAll('details').forEach(d => { d.open = false; }); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') nav.querySelectorAll('details').forEach(d => { d.open = false; }); });
  }
  function setupReferenceLayout() {
    const lab = document.getElementById('tab-simulator');
    const heading = lab.querySelector('.page-heading');
    heading.classList.add('platform-hero');
    heading.innerHTML = `<div class="platform-hero-copy"><span class="platform-hero-icon">${icon('flask')}</span><div><h1>Laboratorio IS–LM–BP</h1><p>Experimenta con políticas y shocks bajo supuestos explícitos. Comprende cada mecanismo de transmisión.</p></div></div><button type="button" class="platform-primary" id="labHeroSave">Guardar escenario <span aria-hidden="true">→</span></button>`;
    heading.querySelector('button').addEventListener('click', () => { document.getElementById('simSaveCurrentBtn')?.click(); document.getElementById('simSavedScenariosPanel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    const filters = document.createElement('div'); filters.className = 'lab-context-bar'; filters.setAttribute('aria-label', 'Contexto del escenario');
    for (const [id, title] of [['islmCountry', 'Economía'], ['islmRegime', 'Régimen cambiario'], ['islmMobility', 'Movilidad de capitales'], ['islmInstrument', 'Instrumento monetario'], ['islmLevel', 'Nivel de aprendizaje']]) {
      const select = document.getElementById(id);
      const label = document.createElement('label'); label.htmlFor = id; label.textContent = title; label.append(select); filters.append(label);
    }
    heading.after(filters);
    for (const [id, labels] of [
      ['islmRegime', { closed: 'Economía cerrada', flex: 'Flexible', fixed: 'Fijo' }],
      ['islmMobility', { none: 'Nula', low: 'Baja', high: 'Alta', perfect: 'Perfecta' }],
      ['islmInstrument', { money: 'Oferta (M)', rate: 'Tasa (i)' }]
    ]) {
      const select = document.getElementById(id);
      [...select.options].forEach(option => { if (labels[option.value]) option.textContent = labels[option.value]; });
    }
    const layout = lab.querySelector('.islm-layout');
    const main = layout.querySelector('.islm-main');
    const reading = main.querySelector('[aria-label="Mecanismo de transmisión"]');
    reading.classList.add('lab-reading');
    const readingTitle = reading.querySelector('h3'); readingTitle.textContent = 'Lectura del mecanismo';
    lab.querySelector('.islm-controls .card-top h3').textContent = 'Parámetros';
    lab.querySelector('.islm-controls > summary').textContent = 'Configurar y experimentar';
    const learning = lab.querySelector('.islm-learning'); layout.after(learning);
    const guidedLink = document.createElement('a'); guidedLink.className = 'control-action'; guidedLink.href = '#aprendizaje'; guidedLink.textContent = 'Abrir aprendizaje guiado →';
    learning.querySelector('.islm-toolbar').append(guidedLink);
    // Selects have moved into the context bar; remove their empty wrappers.
    lab.querySelectorAll('.islm-controls .islm-select, .islm-controls .islm-selects').forEach(el => el.remove());
    const controls = lab.querySelector('.islm-controls');
    const assumptions = document.createElement('details'); assumptions.className = 'lab-assumptions';
    assumptions.innerHTML = '<summary>Régimen y supuestos del modelo</summary>';
    assumptions.append(document.getElementById('islmTrilemma')); controls.append(assumptions);
    const presets = document.createElement('details'); presets.className = 'lab-assumptions';
    presets.innerHTML = '<summary>Escenarios rápidos</summary>';
    presets.append(document.getElementById('islmPresets')); controls.append(presets);
    controls.querySelector('.sim-section-heading')?.remove();
    controls.querySelector('p.data-note')?.remove();
    const layers = document.getElementById('islmLayers');
    const options = document.createElement('details'); options.className = 'lab-diagram-options';
    options.innerHTML = '<summary>Capas, glosario y comparación A/B <span aria-hidden="true">⌄</span></summary>';
    layers.before(options); options.append(layers);
    for (const [id, title, subtitle, symbol] of [
      ['fuentes', 'Biblioteca de fuentes', 'Organismos, bases de datos, APIs y metodología para investigar con evidencia.', 'database'],
      ['ayuda', 'Ayuda y metodología', 'Encuentra tu recorrido, comprende las fuentes y consulta los conceptos económicos.', 'info']
    ]) {
      const hero = document.querySelector('#' + id + ' > .view-heading');
      hero.classList.add('platform-hero');
      const h = hero.querySelector('h1'); h.textContent = title;
      const p = hero.querySelector('p'); p.textContent = subtitle;
      const copy = document.createElement('div'); copy.className = 'platform-hero-copy';
      const text = document.createElement('div'); text.append(h, p);
      const badge = document.createElement('span'); badge.className = 'platform-hero-icon'; badge.innerHTML = icon(symbol); copy.append(badge, text);
      hero.querySelector('.eyebrow')?.remove(); hero.prepend(copy);
    }
    const sourceTabs = document.createElement('div'); sourceTabs.className = 'source-access-tabs';
    sourceTabs.setAttribute('role', 'group'); sourceTabs.setAttribute('aria-label', 'Tipo de acceso a las fuentes');
    sourceTabs.innerHTML = [['', 'Todas las fuentes'], ['api', 'APIs'], ['microdatos', 'Microdatos'], ['descarga', 'Descargas']].map(([value,label]) => `<button type="button" data-source-access="${value}" aria-pressed="${value === ''}">${label}</button>`).join('');
    document.getElementById('sourceFilters').after(sourceTabs);
    sourceTabs.addEventListener('click', e => {
      const button = e.target.closest('[data-source-access]'); if (!button) return;
      const select = document.getElementById('sourceAccess'); select.value = button.dataset.sourceAccess;
      select.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const directoryHeading = document.createElement('div'); directoryHeading.className = 'source-catalog-heading';
    directoryHeading.innerHTML = '<div><h2>Organismos y recursos de investigación</h2><p>Selecciona una fuente para consultar su ficha y metodología.</p></div>';
    directoryHeading.append(document.getElementById('sourceCount')); sourceTabs.after(directoryHeading);
  }
  M.navigation = Object.freeze({ destinations, aliases, canonicalView, canonicalHash, icon });
  Object.assign(M, { setupNavigation, setupReferenceLayout });
})();
