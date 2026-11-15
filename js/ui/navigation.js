/* One navigation contract for the orbital home, header, search and legacy links. */
(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const destinations = Object.freeze([
    { id: 'inicio', label: 'Inicio', icon: 'grid', description: 'Las ocho experiencias de Macroscope' },
    { id: 'aprendizaje', label: 'Aprendizaje guiado', short: 'Aprendizaje', icon: 'book', description: 'Lecciones, ejercicios y progreso de aprendizaje' },
    { id: 'historico', label: 'Análisis histórico', short: 'Histórico', icon: 'calendar', description: 'Series de tiempo, periodos y exportación' },
    { id: 'indicadores', label: 'Indicadores macroeconómicos', short: 'Indicadores', icon: 'chart', description: 'Catálogo, definiciones y fichas analíticas' },
    { id: 'exploracion', label: 'Exploración macroeconómica', short: 'Panorama', icon: 'chart', tab: 'overview', description: 'Panorama, datos oficiales y lectura económica' },
    { id: 'comparacion', label: 'Comparación de economías', short: 'Comparador', icon: 'compare', description: 'Países, mapas y comparaciones internacionales' },
    { id: 'simulacion', label: 'Simulación de escenarios', short: 'Laboratorio', icon: 'flask', tab: 'simulator', description: 'Laboratorio IS–LM–BP y escenarios guardados' },
    { id: 'modelos', label: 'Modelos y tendencias', short: 'Modelos', icon: 'model', description: 'Biblioteca de modelos económicos' },
    { id: 'politica-economica', label: 'Política económica', short: 'Política', icon: 'compare', description: 'Instrumentos, aranceles, paquetes y bienestar' },
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
    info: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM12 11v6m0-10v1',
    expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7'
  };
  const icon = key => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[key] || paths.grid}"/></svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function setupNavigation() {
    const nav = document.querySelector('.primary-nav');
    // Inicio followed by the seven experiences, in the same order as the home cards.
    const primary = destinations.slice(0, 9);
    const link = (d, extra = '') => `<a href="#${d.id}" data-route="${d.id}" class="${extra}">${icon(d.icon)}<span>${esc(d.short || d.label)}</span></a>`;
    nav.innerHTML = primary.map(d => link(d)).join('') +
      `<details class="nav-more"><summary aria-label="Más experiencias">Más <span aria-hidden="true">⌄</span></summary><div class="nav-more-panel">${destinations.filter(d => !primary.includes(d)).map(d => link(d)).join('')}</div></details>`;
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
    heading.classList.add('platform-hero', 'lab-hero');
    heading.innerHTML = `<div class="platform-hero-copy"><span class="platform-hero-icon">${icon('flask')}</span><div><span class="lab-hero-eyebrow">SIMULACIÓN TEÓRICA · CORTO PLAZO (P = 1)</span><h1>Laboratorio IS–LM–BP</h1><p>Experimenta con políticas y shocks bajo supuestos explícitos. Comprende cada mecanismo de transmisión.</p></div></div><button type="button" class="platform-primary" id="labHeroSave">Guardar escenario <span aria-hidden="true">→</span></button>`;
    heading.querySelector('button').addEventListener('click', () => { document.getElementById('simSaveCurrentBtn')?.click(); document.getElementById('simSavedScenariosPanel')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });

    const filters = document.createElement('div');
    filters.className = 'lab-context-bar';
    filters.setAttribute('aria-label', 'Contexto del escenario');
    const selectsRow = document.createElement('div');
    selectsRow.className = 'lab-context-selects';
    const fieldIcons = { islmCountry: 'globe', islmRegime: 'compare', islmMobility: 'chart', islmInstrument: 'database', islmLevel: 'book' };
    for (const [id, title] of [['islmCountry', 'Economía'], ['islmRegime', 'Régimen cambiario'], ['islmMobility', 'Movilidad de capitales'], ['islmInstrument', 'Instrumento monetario'], ['islmLevel', 'Nivel de aprendizaje']]) {
      const select = document.getElementById(id);
      const label = document.createElement('label');
      label.htmlFor = id;
      label.className = 'lab-ctx-field';
      const titleSpan = document.createElement('span');
      titleSpan.className = 'lab-ctx-title';
      titleSpan.innerHTML = `${icon(fieldIcons[id] || 'grid')}<span>${esc(title)}</span>`;
      label.append(titleSpan, select);
      selectsRow.append(label);
    }
    const policyBar = document.createElement('div');
    policyBar.className = 'lab-policy-bar';
    policyBar.innerHTML = `
      <div class="lab-meta-pills" aria-label="Metadatos del modelo">
        <span class="lab-meta-pill"><strong>Modelo:</strong> IS–LM–BP · Mundell–Fleming</span>
        <span class="lab-meta-pill"><strong>Horizonte:</strong> Corto plazo (P = 1)</span>
        <span class="lab-meta-pill is-scenario" id="labActiveScenarioPill"><strong>Escenario:</strong> Equilibrio base (E₀)</span>
      </div>
      <div class="lab-policy-tabs" role="group" aria-label="Navegación de políticas">
        <button type="button" class="lab-policy-tab" data-policy-tab="fiscal" aria-pressed="true">Política fiscal</button>
        <button type="button" class="lab-policy-tab" data-policy-tab="monetary" aria-pressed="false">Política monetaria</button>
        <button type="button" class="lab-policy-tab" data-policy-tab="external" aria-pressed="false">Shock externo</button>
        <button type="button" class="lab-policy-tab" data-policy-tab="mobility" aria-pressed="false">Movilidad de capitales</button>
      </div>`;
    filters.append(selectsRow, policyBar);
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
    const diagramsCard = main.querySelector('[aria-label="Diagramas del modelo"]');
    const grid = diagramsCard.querySelector('.islm-grid');
    // Place the 2x2 diagram grid at the top of the center column so it aligns with Parameters and Reading.
    diagramsCard.prepend(grid);
    const panelIcons = ['chart', 'globe', 'database', 'model'];
    grid.querySelectorAll('.islm-panel').forEach((panel, idx) => {
      const cap = panel.querySelector('figcaption');
      const canvas = panel.querySelector('canvas');
      if (canvas) panel.dataset.panelCanvas = canvas.id;
      panel.title = 'Clic para ampliar los gráficos';
      const strong = cap.querySelector('strong');
      const span = cap.querySelector('span');
      const copy = document.createElement('div');
      copy.className = 'lab-panel-heading';
      if (strong) copy.append(strong);
      if (span) copy.append(span);
      const badge = document.createElement('span');
      badge.className = 'lab-panel-icon';
      badge.setAttribute('aria-hidden', 'true');
      badge.innerHTML = icon(panelIcons[idx] || 'chart');
      const zoomHint = document.createElement('span');
      zoomHint.className = 'lab-panel-zoom-hint';
      zoomHint.setAttribute('aria-hidden', 'true');
      zoomHint.innerHTML = icon('expand');
      cap.prepend(badge, copy);
      cap.append(zoomHint);
    });

    const reading = main.querySelector('[aria-label="Mecanismo de transmisión"]');
    reading.classList.add('lab-reading');
    const readingTop = reading.querySelector('.card-top');
    const readingTitle = readingTop.querySelector('h3');
    readingTitle.textContent = 'Lectura del mecanismo';
    readingTop.querySelector('p').textContent = 'Del equilibrio inicial al ajuste final.';
    const whyTrigger = document.createElement('button');
    whyTrigger.type = 'button';
    whyTrigger.className = 'control-action lab-why-btn';
    whyTrigger.id = 'islmWhyTrigger';
    whyTrigger.setAttribute('aria-label', '¿Por qué se mueve?');
    whyTrigger.title = '¿Por qué se mueve?';
    whyTrigger.innerHTML = icon('info');
    whyTrigger.addEventListener('click', () => document.getElementById('islmWhy')?.click());
    readingTop.append(whyTrigger);

    const readingHighlight = document.createElement('div');
    readingHighlight.className = 'lab-reading-highlight';
    readingHighlight.id = 'islmReadingHighlight';
    const narrative = document.getElementById('islmNarrative');
    narrative.before(readingHighlight);
    const keyIdea = document.createElement('div');
    keyIdea.className = 'lab-key-idea';
    keyIdea.id = 'islmKeyIdea';
    narrative.after(keyIdea);
    const readingContext = document.createElement('div');
    readingContext.className = 'lab-reading-context';
    readingContext.id = 'islmReadingContext';
    keyIdea.after(readingContext);

    const resultsCard = main.querySelector('[aria-label="Resultados del modelo"]');
    resultsCard.classList.add('lab-results-section');
    const resultsTop = resultsCard.querySelector('.card-top');
    resultsTop.querySelector('h3').textContent = 'Resultados del escenario';
    resultsTop.querySelector('p').textContent = 'Comparación del equilibrio inicial (E₀) frente al simulado (E₂) · precios fijos (P = 1).';
    const resultsLegend = document.createElement('div');
    resultsLegend.className = 'lab-results-legend';
    resultsLegend.innerHTML = `<span class="lab-legend-item is-base"><i aria-hidden="true"></i>Escenario base (E₀)</span><span class="lab-legend-item is-sim"><i aria-hidden="true"></i>Escenario simulado (E₂)</span><span class="lab-delta-pill" id="islmScenarioDeltaBadge">Sin cambios</span>`;
    resultsTop.append(resultsLegend);
    const scenarioCards = document.createElement('div');
    scenarioCards.className = 'lab-scenario-cards';
    scenarioCards.id = 'islmScenarioCards';
    scenarioCards.setAttribute('aria-label', 'Tarjetas comparativas E0 a E2');
    resultsTop.after(scenarioCards);
    const fullTableDetails = document.createElement('details');
    fullTableDetails.className = 'lab-assumptions lab-full-results';
    fullTableDetails.id = 'islmFullTableDetails';
    fullTableDetails.innerHTML = '<summary>Tabla analítica completa (E₀, E₁, E₂) y multiplicadores <span aria-hidden="true">⌄</span></summary>';
    const multEl = document.getElementById('islmMultipliers');
    const tableWrap = resultsCard.querySelector('.data-table-wrap');
    resultsCard.append(fullTableDetails);
    fullTableDetails.append(multEl, tableWrap);

    // Keep the plot/result stack independent of the length of the explanation.
    const center = document.createElement('div');
    center.className = 'lab-center';
    main.insertBefore(center, diagramsCard);
    center.append(diagramsCard, resultsCard);

    lab.querySelector('.islm-controls .card-top h3').textContent = 'Parámetros';
    lab.querySelector('.islm-controls > summary').textContent = 'Configurar y experimentar';
    const learning = lab.querySelector('.islm-learning'); layout.after(learning);
    const guidedLink = document.createElement('a'); guidedLink.className = 'control-action'; guidedLink.href = '#aprendizaje'; guidedLink.textContent = 'Abrir aprendizaje guiado →';
    learning.querySelector('.islm-toolbar').append(guidedLink);
    // Selects have moved into the context bar; remove their empty wrappers.
    lab.querySelectorAll('.islm-controls .islm-select, .islm-controls .islm-selects').forEach(el => el.remove());
    const controls = lab.querySelector('.islm-controls');
    const presets = document.createElement('details'); presets.className = 'lab-assumptions';
    presets.id = 'islmPresetsDetails';
    presets.innerHTML = '<summary>Escenarios rápidos</summary>';
    presets.append(document.getElementById('islmPresets')); controls.append(presets);
    const assumptions = document.createElement('details'); assumptions.className = 'lab-assumptions';
    assumptions.id = 'islmAssumptionsDetails';
    assumptions.innerHTML = '<summary>Régimen y supuestos del modelo</summary>';
    const assumptionsExtra = document.createElement('div');
    assumptionsExtra.className = 'islm-note lab-assumptions-extra';
    assumptionsExtra.id = 'islmAssumptionsExtra';
    assumptions.append(document.getElementById('islmTrilemma'), assumptionsExtra);
    controls.append(assumptions);
    controls.querySelector('.sim-section-heading')?.remove();
    controls.querySelector('p.data-note')?.remove();
    const layers = document.getElementById('islmLayers');
    const diagramsBar = document.createElement('div');
    diagramsBar.className = 'lab-diagrams-bar';
    const options = document.createElement('details'); options.className = 'lab-diagram-options';
    options.innerHTML = '<summary><span>Capas, glosario y comparación A/B</span> <span aria-hidden="true">⌄</span></summary>';
    const expandBtn = document.createElement('button');
    expandBtn.type = 'button';
    expandBtn.className = 'control-action lab-expand-btn';
    expandBtn.id = 'islmExpandChartsBtn';
    expandBtn.setAttribute('aria-haspopup', 'dialog');
    expandBtn.setAttribute('aria-controls', 'islmZoomDialog');
    expandBtn.setAttribute('aria-expanded', 'false');
    expandBtn.innerHTML = `${icon('expand')}<span>Ampliar gráficos</span>`;
    diagramsBar.append(options, expandBtn);
    layers.before(diagramsBar);
    const chartCardTop = diagramsCard.querySelector(':scope > .card-top');
    const shiftsEl = document.getElementById('islmShifts');
    const abStatusEl = document.getElementById('islmABStatus');
    const regimeBadge = document.getElementById('islmRegimeBadge');
    if (regimeBadge) options.querySelector('summary > span')?.append(' · ', regimeBadge);
    options.append(layers);
    if (shiftsEl) options.append(shiftsEl);
    if (abStatusEl) options.append(abStatusEl);
    if (chartCardTop) options.append(chartCardTop);

    // Expanded 4-chart dialog synchronized with the live laboratory model
    const zoomDialog = document.createElement('dialog');
    zoomDialog.id = 'islmZoomDialog';
    zoomDialog.className = 'lab-zoom-dialog';
    zoomDialog.setAttribute('aria-labelledby', 'islmZoomTitle');
    zoomDialog.hidden = true;
    zoomDialog.innerHTML = `
      <div class="lab-zoom-head">
        <div class="lab-zoom-title-block">
          <span class="lab-hero-eyebrow">VISTA AMPLIADA · SINCRONIZACIÓN EN VIVO (P = 1)</span>
          <h2 id="islmZoomTitle">Diagramas del equilibrio IS–LM–BP y Mundell–Fleming</h2>
        </div>
        <div class="lab-zoom-actions">
          <div class="lab-zoom-modes" role="group" aria-label="Selector de diagrama ampliado">
            <button type="button" class="lab-zoom-mode" data-zoom-mode="all" aria-pressed="true">Vista 2×2 (4 gráficos)</button>
            <button type="button" class="lab-zoom-mode" data-zoom-mode="islmPanelISLM" aria-pressed="false">1 · IS–LM–BP</button>
            <button type="button" class="lab-zoom-mode" data-zoom-mode="islmPanelMF" aria-pressed="false">2 · Mundell–Fleming</button>
            <button type="button" class="lab-zoom-mode" data-zoom-mode="islmPanelMoney" aria-pressed="false">3 · Mercado de dinero</button>
            <button type="button" class="lab-zoom-mode" data-zoom-mode="islmPanelCross" aria-pressed="false">4 · Mercado de bienes</button>
          </div>
          <button type="button" class="control-action lab-zoom-close" id="islmCloseZoom" aria-label="Cerrar vista ampliada">Cerrar <span aria-hidden="true">×</span></button>
        </div>
      </div>
      <div class="lab-zoom-meta" id="islmZoomMeta" aria-live="polite"></div>
      <div class="lab-zoom-grid" id="islmZoomGrid" data-zoom-active="all">
        <figure class="lab-zoom-panel" data-zoom-card="islmPanelISLM">
          <figcaption><span class="lab-panel-icon" aria-hidden="true">${icon('chart')}</span><div class="lab-panel-heading"><strong>1 · IS–LM–BP</strong><span>Tasa de interés (i) vs. producto (Y)</span></div></figcaption>
          <canvas id="islmZoomISLM" data-animating="false" role="img" aria-label="Diagrama IS-LM-BP ampliado"></canvas>
        </figure>
        <figure class="lab-zoom-panel" data-zoom-card="islmPanelMF">
          <figcaption><span class="lab-panel-icon" aria-hidden="true">${icon('globe')}</span><div class="lab-panel-heading"><strong>2 · Mundell–Fleming</strong><span>Tipo de cambio (e) vs. producto (Y)</span></div></figcaption>
          <canvas id="islmZoomMF" data-animating="false" role="img" aria-label="Diagrama Mundell-Fleming ampliado"></canvas>
        </figure>
        <figure class="lab-zoom-panel" data-zoom-card="islmPanelMoney">
          <figcaption><span class="lab-panel-icon" aria-hidden="true">${icon('database')}</span><div class="lab-panel-heading"><strong>3 · Mercado de dinero</strong><span>Tasa de interés (i) vs. saldos reales (M/P)</span></div></figcaption>
          <canvas id="islmZoomMoney" data-animating="false" role="img" aria-label="Mercado de dinero ampliado"></canvas>
        </figure>
        <figure class="lab-zoom-panel" data-zoom-card="islmPanelCross">
          <figcaption><span class="lab-panel-icon" aria-hidden="true">${icon('model')}</span><div class="lab-panel-heading"><strong>4 · Mercado de bienes</strong><span>Demanda agregada (DA) vs. producto (Y)</span></div></figcaption>
          <canvas id="islmZoomCross" data-animating="false" role="img" aria-label="Cruz keynesiana ampliada"></canvas>
        </figure>
      </div>`;
    lab.append(zoomDialog);

    let lastZoomTrigger = expandBtn;
    const setZoomMode = (mode = 'all') => {
      const zoomGrid = document.getElementById('islmZoomGrid');
      if (zoomGrid) zoomGrid.dataset.zoomActive = mode;
      zoomDialog.querySelectorAll('[data-zoom-mode]').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.dataset.zoomMode === mode));
      });
      M.renderIslmZoom?.();
    };
    const openIslmZoom = (triggerEl, mode = 'all', highlightCard = '') => {
      lastZoomTrigger = triggerEl || document.activeElement || expandBtn;
      zoomDialog.hidden = false;
      zoomDialog.dataset.highlightedPanel = highlightCard || '';
      if (!zoomDialog.open) zoomDialog.showModal();
      document.documentElement.classList.add('has-lab-zoom');
      expandBtn.setAttribute('aria-expanded', 'true');
      setZoomMode(mode);
      requestAnimationFrame(() => {
        M.renderIslmZoom?.();
        document.getElementById('islmCloseZoom')?.focus({ preventScroll: true });
      });
    };
    const finalizeZoomClose = () => {
      zoomDialog.hidden = true;
      document.documentElement.classList.remove('has-lab-zoom');
      expandBtn.setAttribute('aria-expanded', 'false');
      if (lastZoomTrigger && typeof lastZoomTrigger.focus === 'function') {
        lastZoomTrigger.focus({ preventScroll: true });
      }
    };
    const closeIslmZoom = () => {
      if (zoomDialog.open) zoomDialog.close();
      finalizeZoomClose();
    };
    zoomDialog.addEventListener('cancel', e => {
      e.preventDefault();
      closeIslmZoom();
    });
    zoomDialog.addEventListener('close', finalizeZoomClose);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && zoomDialog.open) {
        e.preventDefault();
        closeIslmZoom();
      }
    });
    expandBtn.addEventListener('click', () => openIslmZoom(expandBtn, 'all'));
    grid.addEventListener('click', e => {
      const panel = e.target.closest('.islm-panel');
      if (!panel) return;
      openIslmZoom(expandBtn, 'all', panel.dataset.panelCanvas || '');
    });
    zoomDialog.querySelector('#islmCloseZoom').addEventListener('click', closeIslmZoom);
    zoomDialog.addEventListener('click', e => {
      const modeBtn = e.target.closest('[data-zoom-mode]');
      if (modeBtn) { setZoomMode(modeBtn.dataset.zoomMode); return; }
      if (e.target === zoomDialog) closeIslmZoom();
    });
    M.openIslmZoom = openIslmZoom;
    M.closeIslmZoom = closeIslmZoom;

    // Keep lateral panels independently scrollable within the visible viewport on desktop
    const syncLabStickyBounds = () => {
      if (lab.hidden) return;
      if (window.innerWidth <= 1120) {
        lab.style.removeProperty('--lab-panel-max-h');
        return;
      }
      const headerBottom = Math.round(document.getElementById('platformHeader')?.getBoundingClientRect().bottom || 72);
      const stickyTop = headerBottom + 10;
      const layoutRect = layout.getBoundingClientRect();
      const effectiveTop = Math.max(stickyTop, Math.min(window.innerHeight - 360, Math.round(layoutRect.top)));
      const maxH = Math.max(420, Math.round(window.innerHeight - effectiveTop - 12));
      lab.style.setProperty('--lab-panel-max-h', `${maxH}px`);
    };
    M.syncLabStickyBounds = syncLabStickyBounds;
    window.addEventListener('scroll', syncLabStickyBounds, { passive: true });
    window.addEventListener('hashchange', () => requestAnimationFrame(syncLabStickyBounds));
    window.addEventListener('resize', () => {
      syncLabStickyBounds();
      if (zoomDialog.open) M.renderIslmZoom?.();
    }, { passive: true });
    for (const sidePanel of [controls, reading]) {
      sidePanel.addEventListener('wheel', e => {
        if (window.innerWidth <= 1120 || e.ctrlKey || e.metaKey) return;
        if (sidePanel.scrollHeight <= sidePanel.clientHeight + 1) return;
        const maxScroll = sidePanel.scrollHeight - sidePanel.clientHeight;
        const next = Math.max(0, Math.min(maxScroll, sidePanel.scrollTop + e.deltaY));
        if (next !== sidePanel.scrollTop) sidePanel.scrollTop = next;
        e.preventDefault();
      }, { passive: false });
    }
    requestAnimationFrame(syncLabStickyBounds);

    policyBar.addEventListener('click', e => {
      const btn = e.target.closest('[data-policy-tab]');
      if (!btn) return;
      const tab = btn.dataset.policyTab;
      policyBar.querySelectorAll('[data-policy-tab]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      controls.dataset.activePolicy = tab;
      controls.querySelectorAll('.islm-control').forEach(row => {
        row.classList.toggle('is-group-highlighted', row.dataset.policyGroup === tab);
      });
      const extDetails = document.getElementById('islmExternalInputs')?.closest('details');
      if ((tab === 'external' || tab === 'monetary' || tab === 'mobility') && extDetails && !extDetails.open) {
        extDetails.open = true;
      }
      if (tab === 'mobility') {
        document.getElementById('islmMobility')?.focus({ preventScroll: true });
      } else {
        const firstInput = controls.querySelector(`.islm-control[data-policy-group="${tab}"] input:not(:disabled)`);
        firstInput?.focus({ preventScroll: true });
      }
    });
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
