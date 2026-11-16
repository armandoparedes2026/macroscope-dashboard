/*
 * Controladores de interfaz e interacción para las Siete Experiencias de Macroscope
 * y sus secciones transversales (#aprendizaje, #historico, #indicadores, #exploracion/#panorama,
 * #comparacion, #simulacion/#laboratorio, #modelos, #observatorio, #fuentes, #ayuda).
 */
(function () {
  'use strict';
  const M = (globalThis.MacroScope ||= {});

  const EXP_ROUTES = M.navigation.destinations.map((d, i) => ({ route: d.id, num: String(i).padStart(2, '0'), label: d.label }));

  const esc = val =>
    String(val ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const fmtNum = (val, dec = 1) =>
    Number.isFinite(val)
      ? val.toLocaleString('es-PE', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      : 'N/D';

  function renderRibbonHTML(activeRoute) {
    // Global navigation owns destinations; do not repeat eleven competing tabs in every view.
    return '';
  }

  function downloadCsvFile(filename, csvContent) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function makeSparkSvg(values = [], width = 110, height = 32) {
    const slice = (values || []).slice(-16);
    const finite = slice.filter(Number.isFinite);
    if (!finite.length || slice.length < 2) {
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
    }
    const min = Math.min(...finite);
    const max = Math.max(...finite);
    const span = max - min || 1;
    const segments = [];
    let current = [];
    slice.forEach((v, i) => {
      if (Number.isFinite(v)) {
        const x = 3 + ((width - 6) * i) / Math.max(1, slice.length - 1);
        const y = height - 4 - ((height - 9) * (v - min)) / span;
        current.push([x, y]);
      } else if (current.length) {
        segments.push(current);
        current = [];
      }
    });
    if (current.length) segments.push(current);
    const dLine = segments
      .filter(seg => seg.length >= 2)
      .map(seg => seg.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' '))
      .join(' ');
    const dFill = segments
      .filter(seg => seg.length >= 2)
      .map(seg => {
        const line = seg.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
        return `${line} L${seg.at(-1)[0].toFixed(1)},${height} L${seg[0][0].toFixed(1)},${height} Z`;
      })
      .join(' ');
    const dots = segments
      .filter(seg => seg.length === 1)
      .map(([[x, y]]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#1864ea"/>`)
      .join('');
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" data-segments="${segments.length}">
      ${dFill ? `<path d="${dFill}" fill="rgba(40,123,241,0.14)"/>` : ''}
      ${dLine ? `<path d="${dLine}" fill="none" stroke="#1864ea" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      ${dots}
    </svg>`;
  }

  /* ==========================================================================
     MÓDULO 01 — APRENDIZAJE GUIADO (#aprendizaje, Ref 6.png)
     ========================================================================== */
  const LEARNING_ROUTES = [
    {
      id: 'macro-accion',
      title: 'Macroeconomía en acción (IS–LM–BP)',
      subtitle: 'Demanda agregada, política fiscal, monetaria y economía abierta',
      scenarioIds: ['fiscal-closed', 'foreign-rate-flex', 'devaluation-fixed', 'fiscal-regimes', 'commodity-flex', 'confidence-closed']
    },
    {
      id: 'abierta-cambiaria',
      title: 'Sector externo y regímenes cambiarios',
      subtitle: 'Mundell–Fleming, movilidad de capitales y trilema monetario',
      scenarioIds: ['fiscal-regimes', 'foreign-rate-flex', 'devaluation-fixed', 'commodity-flex', 'fiscal-closed', 'confidence-closed']
    },
    {
      id: 'ciclo-estabilizacion',
      title: 'Ciclo económico y estabilización',
      subtitle: 'Impulsos de demanda, confianza privada y coordinación de políticas',
      scenarioIds: ['confidence-closed', 'fiscal-closed', 'commodity-flex', 'fiscal-regimes', 'foreign-rate-flex', 'devaluation-fixed']
    }
  ];

  const LEARNING_STORAGE_KEY = 'macroscope_learning_progress_v1';
  const learningState = {
    routeId: 'macro-accion',
    lessonIndex: 0,
    level: 'intermediate',
    simG: 2.0,
    simM: 0.0,
    simIstar: 0.0,
    simMobility: 'high',
    simRegime: 'flex',
    selectedOption: null,
    feedback: null,
    completedIds: [],
    correctCount: 0,
    attemptsCount: 0
  };

  function loadLearningProgress() {
    try {
      const raw = localStorage.getItem(LEARNING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.completedIds)) learningState.completedIds = parsed.completedIds;
      if (Number.isFinite(parsed.correctCount)) learningState.correctCount = parsed.correctCount;
      if (Number.isFinite(parsed.attemptsCount)) learningState.attemptsCount = parsed.attemptsCount;
    } catch (_) {}
  }

  function saveLearningProgress() {
    try {
      localStorage.setItem(
        LEARNING_STORAGE_KEY,
        JSON.stringify({
          completedIds: learningState.completedIds,
          correctCount: learningState.correctCount,
          attemptsCount: learningState.attemptsCount
        })
      );
    } catch (_) {}
  }

  function currentLearningRoute() {
    return LEARNING_ROUTES.find(r => r.id === learningState.routeId) || LEARNING_ROUTES[0];
  }

  function currentLearningScenario() {
    const scenarios = M.LAB_CONTENT?.SCENARIOS || [];
    const route = currentLearningRoute();
    const id = route.scenarioIds[learningState.lessonIndex] || route.scenarioIds[0];
    return scenarios.find(s => s.id === id) || scenarios[0];
  }

  function buildQuizOptionsForScenario(scenario) {
    if (!scenario) return [];
    const vars = scenario.predict || ['Y', 'i'];
    const v1 = vars[0] || 'Y';
    const v2 = vars[1] || 'i';
    const expected1 = scenario.theory?.[v1] ?? 1;
    const expected2 = scenario.theory?.[v2] ?? 1;

    const describeSign = (v, s) => {
      const name = v === 'Y' ? 'el producto (Y)' : v === 'i' ? 'la tasa (i)' : v === 'e' ? 'el tipo de cambio (e)' : v;
      return s > 0 ? `Aumenta ${name}` : s < 0 ? `Disminuye ${name}` : `No cambia ${name}`;
    };

    const correctTitle =
      vars.length >= 2
        ? `${describeSign(v1, expected1)} y ${describeSign(v2, expected2).toLowerCase()}`
        : describeSign(v1, expected1);

    return [
      {
        id: 'opt-down',
        title: vars.length >= 2 ? `Disminuyen ${v1} y ${v2}` : `Disminuye ${v1}`,
        desc: 'La demanda agregada se contrae y reduce la actividad de equilibrio.',
        prediction: Object.fromEntries(vars.map(k => [k, -1]))
      },
      {
        id: 'opt-correct',
        title: correctTitle,
        desc: scenario.shifts?.[0]?.cause || 'Desplazamiento consistente con el mecanismo de transmisión del modelo.',
        prediction: Object.fromEntries(vars.map(k => [k, scenario.theory?.[k] ?? 1]))
      },
      {
        id: 'opt-neutral',
        title: `Sin cambio en ${v1}${vars.length >= 2 ? ' y cae ' + v2 : ''}`,
        desc: 'El ajuste externo o monetario neutraliza completamente el impulso inicial.',
        prediction: Object.fromEntries(vars.map((k, idx) => [k, idx === 0 ? (expected1 === 0 ? 1 : 0) : -expected2]))
      }
    ];
  }

  function buildCalibratedIslm(cfg = {}) {
    const factory = M.ISLM?.createModel || M.labs?.islm?.createModel;
    if (!factory) return null;
    return factory({
      regime: 'flex',
      mobility: 'high',
      instrument: 'money',
      i0: 3.5,
      istar0: 3,
      cab: -1.5,
      nx0: -0.5,
      ...cfg
    });
  }

  function learningPatch(model) {
    const fixed = learningState.simRegime === 'fixed';
    if (fixed) learningState.simM = 0;
    return model
      ? {
          G: model.baseline.G + learningState.simG,
          Mpct: fixed ? 0 : learningState.simM,
          istar: model.baseline.istar + learningState.simIstar
        }
      : {};
  }

  function learningTransmission(model, patch, { E0, E1, E2 }) {
    const u = { ...model.baseline, ...patch }, c = model.curves;
    const stages = [E0, E1, E2], inputs = [model.baseline, u, u];
    const sign = value => Math.abs(value) < 0.005 ? 0 : Math.sign(value);
    const movement = (name, from, to) => {
      const direction = sign(to - from);
      return `${name} ${direction > 0 ? 'aumenta' : direction < 0 ? 'disminuye' : 'no cambia'}`;
    };
    // Measure the very same affine curves as the plot, at the initial i (IS/LM)
    // or Y (BP). Moving along a curve is not a shift of that curve.
    const xAt = line => (line.c - line.b * E0.i) / line.a;
    const yAt = line => (line.c - line.a * E0.Y) / line.b;
    const curveAt = n => ({
      IS: c.IS(inputs[n], stages[n].e),
      LM: c.LM(inputs[n], stages[n].M),
      ...(model.open ? { BP: c.BP(inputs[n], stages[n].e) } : {})
    });
    const shifts = (from, to) => {
      const a = curveAt(from), b = curveAt(to);
      return Object.keys(a).map(name => {
        const vertical = name === 'BP';
        const at = vertical ? yAt : xAt;
        const direction = sign(at(b[name]) - at(a[name]));
        return `${name} ${direction === 0 ? 'no se desplaza' : vertical
          ? direction > 0 ? 'se desplaza hacia arriba' : 'se desplaza hacia abajo'
          : direction > 0 ? 'se desplaza a la derecha' : 'se desplaza a la izquierda'}`;
      }).join('; ');
    };
    const shock = [
      sign(learningState.simG) ? `ΔG = ${fmtNum(learningState.simG)} puntos del producto inicial` : '',
      learningState.simRegime !== 'fixed' && sign(learningState.simM) ? `ΔM = ${fmtNum(learningState.simM)} %` : '',
      model.open && sign(learningState.simIstar) ? `Δi* = ${fmtNum(learningState.simIstar)} p.p.` : ''
    ].filter(Boolean).join('; ');
    const impact = shifts(0, 1), adjustment = shifts(1, 2);
    const result = (from, to) => `${movement('el producto', from.Y, to.Y)} y ${movement('la tasa de interés', from.i, to.i)}`;
    const external = !model.open
      ? 'Economía cerrada: E₁ y E₂ coinciden; no hay ajuste externo.'
      : learningState.simRegime === 'fixed'
        ? 'El tipo de cambio permanece fijo; los saldos monetarios se ajustan de forma endógena al equilibrio externo.'
        : `El tipo de cambio ${sign(E2.e - E1.e) < 0 ? 'se aprecia (e disminuye)' : sign(E2.e - E1.e) > 0 ? 'se deprecia (e aumenta)' : 'no cambia'} entre E₁ y E₂. Su efecto sobre las exportaciones netas modifica la IS y la BP cuando corresponde.`;
    return {
      impact,
      text: shock
        ? `Configuración actual: ${shock}. Entre E₀ y E₁ (impacto): ${impact}; ${result(E0, E1)}. ${external} ${model.open ? `Entre E₁ y E₂ (ajuste externo): ${adjustment}; ${result(E1, E2)}. ` : ''}En E₂ respecto de E₀: ${result(E0, E2)}. Etapas analíticas con precios fijos, no una trayectoria temporal ni una predicción empírica.`
        : `Sin cambios en los parámetros: las curvas no se desplazan y E₀, E₁ y E₂ coinciden. ${external}`
    };
  }

  function refreshLearningDiagram() {
    const host = document.getElementById('aprendizaje');
    if (!host) return;
    const fixed = learningState.simRegime === 'fixed';
    const closed = learningState.simRegime === 'closed';
    if (fixed) learningState.simM = 0;
    if (closed) learningState.simIstar = 0;

    const sliderM = host.querySelector('#apSliderM');
    if (sliderM) {
      sliderM.disabled = fixed;
      if (fixed) sliderM.value = '0';
    }
    const sliderIstar = host.querySelector('#apSliderIstar');
    if (sliderIstar) {
      sliderIstar.disabled = closed;
      if (closed) sliderIstar.value = '0';
    }
    const outG = host.querySelector('#apOutG');
    if (outG) outG.textContent = `${learningState.simG >= 0 ? '+' : ''}${learningState.simG.toFixed(1)} pts`;
    const outM = host.querySelector('#apOutM');
    if (outM) outM.textContent = fixed ? '0.0 % (endógena)' : `${learningState.simM >= 0 ? '+' : ''}${learningState.simM.toFixed(1)} %`;
    const outIstar = host.querySelector('#apOutIstar');
    if (outIstar) outIstar.textContent = closed ? 'No aplica' : `${learningState.simIstar >= 0 ? '+' : ''}${learningState.simIstar.toFixed(1)} p.p.`;

    const subtitle = host.querySelector('#apDiagramSubtitle');
    if (subtitle) {
      const regimeLabel =
        learningState.simRegime === 'flex'
          ? 'tipo de cambio flexible'
          : learningState.simRegime === 'fixed'
            ? 'tipo de cambio fijo'
            : 'economía cerrada';
      subtitle.textContent = `Efecto del cambio de parámetros sobre el equilibrio IS–LM (${regimeLabel})`;
    }

    const model = buildCalibratedIslm({
      regime: learningState.simRegime,
      mobility: learningState.simMobility,
      instrument: 'money'
    });
    if (!model || !M.EconomicDiagramSpecs) return;
    const patch = learningPatch(model);
    const spec = M.EconomicDiagramSpecs.islm(model, patch);
    const diagramHost = host.querySelector('#apDiagramContainer');
    M.EconomicDiagrams?.mount(
      diagramHost,
      'learning-equilibrium',
      'Equilibrio del mercado de bienes y dinero (IS–LM–BP)',
      spec,
      { kind: 'Simulación guiada · IS–LM–BP' }
    );

    const chain = host.querySelector('.ap-chain');
    if (chain && spec.equilibria) {
      const { E0, E1, E2 } = spec.equilibria;
      const transmission = learningTransmission(model, patch, spec.equilibria);
      const reading = host.querySelector('#apTheoryExplanation');
      if (reading) reading.textContent = transmission.text;
      const openDiff = model.open && Math.hypot(E2.Y - E1.Y, E2.i - E1.i) > 0.05;
      const yText = openDiff ? `Y: ${E0.Y.toFixed(1)} → ${E1.Y.toFixed(1)} → ${E2.Y.toFixed(1)}` : `Y: ${E0.Y.toFixed(1)} → ${E2.Y.toFixed(1)}`;
      const iText = openDiff ? `i: ${E0.i.toFixed(1)}% → ${E1.i.toFixed(1)}% → ${E2.i.toFixed(1)}%` : `i: ${E0.i.toFixed(1)}% → ${E2.i.toFixed(1)}%`;
      chain.innerHTML = `
        <span class="ap-chain-chip">Shock inicial</span>
        <span>→</span>
        <span class="ap-chain-chip">${esc(transmission.impact)}</span>
        <span>→</span>
        <span class="ap-chain-chip">${esc(yText)}</span>
        <span>→</span>
        <span class="ap-chain-chip">${esc(iText)}</span>
      `;
    }
  }

  function renderAprendizajeView() {
    const host = document.getElementById('aprendizaje');
    if (!host) return;
    const route = currentLearningRoute();
    const scenario = currentLearningScenario();
    const scenarios = M.LAB_CONTENT?.SCENARIOS || [];
    const totalLessons = route.scenarioIds.length;
    const completedInRoute = route.scenarioIds.filter(id => learningState.completedIds.includes(id)).length;
    const pct = Math.round((completedInRoute / totalLessons) * 100);
    const fixed = learningState.simRegime === 'fixed';
    if (fixed) learningState.simM = 0;

    const model = buildCalibratedIslm({
      regime: learningState.simRegime,
      mobility: learningState.simMobility,
      instrument: 'money'
    });

    const patch = learningPatch(model);
    const E0 = model ? model.solve(model.baseline, 'final') : { Y: 100, i: 3.5, e: 100, NX: 0 };
    const E2 = model ? model.solve({ ...model.baseline, ...patch }, 'final') : { Y: 102, i: 4.1, e: 98, NX: -0.5 };
    const options = buildQuizOptionsForScenario(scenario);
    if (!learningState.selectedOption && options[1]) {
      learningState.selectedOption = options[1].id;
    }

    const circumference = 2 * Math.PI * 34;
    const dashOffset = circumference * (1 - pct / 100);

    host.innerHTML = `
      <div class="ms-exp-view">
        ${renderRibbonHTML('aprendizaje')}
        <header class="ms-exp-hero">
          <div class="ms-exp-hero-copy">
            <span class="ms-exp-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>
            </span>
            <div>
              <div class="ms-exp-eyebrow">MÓDULO 01 / 08 · PEDAGOGÍA INTERACTIVA Y PREDICCIÓN</div>
              <h1 id="apTitle">Aprendizaje guiado</h1>
              <p>Comprende la teoría, experimenta con escenarios y aprende economía aplicada paso a paso.</p>
            </div>
          </div>
          <div class="ms-exp-actions">
            <a class="ms-btn-secondary" href="#modelos">Biblioteca de modelos →</a>
            <button type="button" class="ms-btn-primary" id="apContinueBtn">Continuar aprendiendo →</button>
          </div>
        </header>

        <div class="ms-filter-bar" role="region" aria-label="Controles de ruta y nivel de aprendizaje">
          <div class="ms-filter-field">
            <label for="apRouteSelect">Ruta de aprendizaje</label>
            <select id="apRouteSelect">
              ${LEARNING_ROUTES.map(
                r => `<option value="${esc(r.id)}" ${r.id === route.id ? 'selected' : ''}>${esc(r.title)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <label for="apLessonSelect">Lección actual</label>
            <select id="apLessonSelect">
              ${route.scenarioIds
                .map((sid, idx) => {
                  const sc = scenarios.find(s => s.id === sid);
                  return `<option value="${idx}" ${idx === learningState.lessonIndex ? 'selected' : ''}>Lección 0${
                    idx + 1
                  }: ${esc(sc?.title || sid)}</option>`;
                })
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <span class="ms-filter-label">Nivel de aprendizaje</span>
            <div class="ms-seg-group" role="group" aria-label="Nivel de aprendizaje">
              ${[
                ['intro', 'Introductorio'],
                ['intermediate', 'Intermedio'],
                ['advanced', 'Avanzado']
              ]
                .map(
                  ([key, label]) =>
                    `<button type="button" class="ms-seg-btn" data-ap-level="${key}" aria-pressed="${
                      learningState.level === key
                    }">${label}</button>`
                )
                .join('')}
            </div>
          </div>
          <div class="ms-filter-field">
            <span class="ms-filter-label">Secuencia de la ruta</span>
            <div class="ms-badge">Lección 0${learningState.lessonIndex + 1} de 0${totalLessons} · ${pct}% completado</div>
          </div>
        </div>

        <div class="ap-workspace">
          <!-- Columna izquierda: Mi ruta de aprendizaje -->
          <aside class="ms-panel" aria-label="Mi ruta de aprendizaje">
            <div class="ms-panel-head">
              <div>
                <h2>Mi ruta de aprendizaje</h2>
                <p>${esc(route.subtitle)}</p>
              </div>
            </div>
            <div class="ap-route-card">
              <strong>${esc(route.title)}</strong>
              <div class="ap-progress-bar" aria-hidden="true">
                <div class="ap-progress-fill" style="width:${pct}%"></div>
              </div>
              <small>Progreso verificado en este dispositivo: <strong>${pct}%</strong> (${completedInRoute}/${totalLessons})</small>
            </div>
            <div class="ms-exp-eyebrow">CONTENIDO DEL MÓDULO</div>
            <div class="ap-lesson-list">
              ${route.scenarioIds
                .map((sid, idx) => {
                  const sc = scenarios.find(s => s.id === sid);
                  const done = learningState.completedIds.includes(sid);
                  const active = idx === learningState.lessonIndex;
                  return `<button type="button" class="ap-lesson-btn${active ? ' is-active' : ''}${done ? ' is-done' : ''}" data-ap-lesson="${idx}">
                    <span class="ap-lesson-step">${done ? '✓' : '0' + (idx + 1)}</span>
                    <span>
                      <strong>${esc(sc?.title || sid)}</strong>
                      <small>${done ? 'Completado' : active ? 'Simulación · En curso' : 'Pendiente'}</small>
                    </span>
                  </button>`;
                })
                .join('')}
            </div>
            <div class="ap-route-card">
              <strong>Aprende haciendo</strong>
              <p style="font-size:11.5px;margin:4px 0 8px;color:var(--exp-muted)">Experimenta con parámetros completos en el simulador de cuatro diagramas.</p>
              <a class="ms-btn-secondary" href="#simulacion" style="width:100%">Abrir Simulación de escenarios →</a>
            </div>
          </aside>

          <!-- Columna central: Lección activa + simulación + predicción -->
          <div style="display:grid;gap:14px;min-width:0">
            <article class="ms-panel" aria-labelledby="apLessonHeading">
              <div class="ms-panel-head">
                <div>
                  <div class="ms-exp-eyebrow">LECCIÓN 0${learningState.lessonIndex + 1} / EXPLORA Y PREDICE</div>
                  <h2 id="apLessonHeading">${esc(scenario?.title || 'Lección interactiva')}</h2>
                  <p id="apLessonProblem">${esc(scenario?.problem || '')}</p>
                </div>
                <span class="ms-badge">Escenario ilustrativo · Modelo teórico</span>
              </div>

              <div class="ap-sim-grid">
                <div class="ap-diagram-box">
                  <div class="ms-panel-head" style="margin-bottom:6px">
                    <div>
                      <h3 style="font-size:14px">Equilibrio del mercado de bienes y dinero</h3>
                      <p id="apDiagramSubtitle">Efecto del cambio de parámetros sobre el equilibrio IS–LM (${learningState.simRegime === 'flex' ? 'tipo de cambio flexible' : learningState.simRegime === 'fixed' ? 'tipo de cambio fijo' : 'economía cerrada'})</p>
                    </div>
                  </div>
                  <div class="ap-canvas-wrap" id="apDiagramContainer"></div>
                </div>

                <div class="ap-controls-box" aria-label="Controles de simulación de la lección">
                  <strong style="font-size:13px">Controles de simulación</strong>
                  <div class="ap-slider-group">
                    <div class="ap-slider-head">
                      <label for="apSliderG">Gasto público (ΔG)</label>
                      <output id="apOutG">${learningState.simG >= 0 ? '+' : ''}${learningState.simG.toFixed(1)} pts</output>
                    </div>
                    <input id="apSliderG" type="range" min="-4" max="4" step="0.5" value="${learningState.simG}">
                  </div>
                  <div class="ap-slider-group">
                    <div class="ap-slider-head">
                      <label for="apSliderM">Oferta monetaria (ΔM)</label>
                      <output id="apOutM">${fixed ? '0.0 % (endógena)' : `${learningState.simM >= 0 ? '+' : ''}${learningState.simM.toFixed(1)} %`}</output>
                    </div>
                    <input id="apSliderM" type="range" min="-6" max="6" step="0.5" value="${fixed ? 0 : learningState.simM}"${fixed ? ' disabled' : ''}>
                  </div>
                  <div class="ap-slider-group">
                    <div class="ap-slider-head">
                      <label for="apSliderIstar">Tasa externa (Δi*)</label>
                      <output id="apOutIstar">${learningState.simIstar >= 0 ? '+' : ''}${learningState.simIstar.toFixed(1)} p.p.</output>
                    </div>
                    <input id="apSliderIstar" type="range" min="-3" max="3" step="0.5" value="${learningState.simIstar}">
                  </div>
                  <div class="ms-filter-field">
                    <label for="apRegimeSelect">Régimen del ejercicio</label>
                    <select id="apRegimeSelect">
                      <option value="closed" ${learningState.simRegime === 'closed' ? 'selected' : ''}>Cerrada · IS–LM</option>
                      <option value="flex" ${learningState.simRegime === 'flex' ? 'selected' : ''}>Abierta · Tipo flexible</option>
                      <option value="fixed" ${learningState.simRegime === 'fixed' ? 'selected' : ''}>Abierta · Tipo fijo</option>
                    </select>
                  </div>
                  <button type="button" class="ms-btn-secondary" id="apResetSimBtn">↺ Restablecer escenario</button>
                </div>
              </div>
            </article>

            <article class="ms-panel" aria-labelledby="apQuizTitle">
              <div class="ms-panel-head">
                <div>
                  <div class="ms-exp-eyebrow">PREDICCIÓN INTERACTIVA · EVALUACIÓN CON EL MOTOR IS–LM–BP</div>
                  <h3 id="apQuizTitle">Según los supuestos de la lección (${esc(scenario?.title)}), ¿qué ocurre en el equilibrio?</h3>
                </div>
                <span class="ms-badge">Variables evaluadas: ${(scenario?.predict || ['Y', 'i']).join(', ')}</span>
              </div>
              <div class="ap-quiz-options" role="radiogroup" aria-label="Opciones de predicción">
                ${options
                  .map(
                    opt => `<button type="button" role="radio" class="ap-quiz-option${
                      learningState.selectedOption === opt.id ? ' is-selected' : ''
                    }" aria-checked="${learningState.selectedOption === opt.id}" data-ap-option="${opt.id}">
                      <strong>${esc(opt.title)}</strong>
                      <span>${esc(opt.desc)}</span>
                    </button>`
                  )
                  .join('')}
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
                <span style="font-size:11.5px;color:var(--exp-muted)">Contrasta tu predicción con la solución analítica del modelo.</span>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                  <button type="button" class="ms-btn-primary" id="apCheckAnswerBtn">Comprobar respuesta →</button>
                  <button type="button" class="ms-btn-secondary" id="apNextLessonBtn">Siguiente lección →</button>
                </div>
              </div>
              <div id="apFeedbackBox" role="status" aria-live="polite" ${learningState.feedback ? '' : 'hidden'} class="ap-feedback ${
                learningState.feedback?.ok ? 'is-correct' : 'is-wrong'
              }">
                ${learningState.feedback ? esc(learningState.feedback.message) : ''}
              </div>
            </article>
          </div>

          <!-- Columna derecha: Tu progreso, Lectura económica, Conceptos clave -->
          <aside style="display:grid;gap:14px;min-width:0" aria-label="Progreso y lectura teórica">
            <section class="ms-panel" aria-labelledby="apProgressHeading">
              <div class="ms-panel-head">
                <h2 id="apProgressHeading">Tu progreso</h2>
                <button type="button" class="ms-btn-secondary" id="apClearProgressBtn">Reiniciar</button>
              </div>
              <div class="ap-donut-row">
                <svg class="ap-donut-svg" viewBox="0 0 84 84" aria-hidden="true">
                  <circle cx="42" cy="42" r="34" fill="none" stroke="rgba(120,165,235,0.22)" stroke-width="8"/>
                  <circle cx="42" cy="42" r="34" fill="none" stroke="#1864ea" stroke-width="8" stroke-linecap="round"
                    stroke-dasharray="${circumference.toFixed(1)}" stroke-dashoffset="${dashOffset.toFixed(1)}"
                    transform="rotate(-90 42 42)"/>
                  <text x="42" y="46" text-anchor="middle" fill="currentColor" font-size="15" font-weight="800">${pct}%</text>
                </svg>
                <div style="display:grid;gap:4px;font-size:12px">
                  <div>Lecciones completadas: <strong>${completedInRoute} / ${totalLessons}</strong></div>
                  <div>Respuestas correctas: <strong>${learningState.correctCount} / ${learningState.attemptsCount}</strong></div>
                  <div style="color:var(--exp-muted);font-size:11px">Persistencia local en navegador (sin inventar historial).</div>
                </div>
              </div>
            </section>

            <section class="ms-panel" aria-labelledby="apReadingHeading">
              <div class="ms-panel-head">
                <div>
                  <h2 id="apReadingHeading">Lectura económica (${
                    learningState.level === 'intro' ? 'Nivel introductorio' : learningState.level === 'advanced' ? 'Nivel avanzado' : 'Nivel intermedio'
                  })</h2>
                </div>
              </div>
              <p id="apTheoryExplanation" style="font-size:12.5px;line-height:1.6;margin:0 0 10px"></p>
              <div class="ms-exp-eyebrow">SECUENCIA DEL MECANISMO</div>
              <div class="ap-chain">
                <span class="ap-chain-chip">Shock inicial</span>
                <span>→</span>
                <span class="ap-chain-chip">${esc(scenario?.shifts?.[0]?.curve || 'IS')} (${esc(scenario?.shifts?.[0]?.direction || 'right')})</span>
                <span>→</span>
                <span class="ap-chain-chip">Y: ${E0.Y.toFixed(1)} → ${E2.Y.toFixed(1)}</span>
                <span>→</span>
                <span class="ap-chain-chip">i: ${E0.i.toFixed(1)}% → ${E2.i.toFixed(1)}%</span>
              </div>
              <details style="margin-top:12px;font-size:12px;line-height:1.6">
                <summary>Teoría del escenario original de la lección</summary>
                <p>Para el ejercicio de predicción se conservan los supuestos originales de «${esc(scenario?.title)}». La exploración de parámetros anterior tiene su propia lectura dinámica.</p>
                <p>${esc(scenario?.levels?.[learningState.level] || '')}</p>
              </details>
              ${
                scenario?.caveats?.length
                  ? `<p style="font-size:11px;color:var(--exp-muted);margin:10px 0 0"><strong>Límite del modelo:</strong> ${esc(
                      scenario.caveats[0]
                    )}</p>`
                  : ''
              }
            </section>

            <section class="ms-panel" aria-labelledby="apConceptsHeading">
              <div class="ms-panel-head">
                <h2 id="apConceptsHeading">Conceptos clave y fuentes</h2>
              </div>
              <div class="ap-concept-chips">
                ${['IS', 'LM', 'BP', 'trilemma', 'crowdingOut', 'multiplier']
                  .map(
                    term =>
                      `<a class="ms-btn-secondary" href="#ayuda?term=${term}">${esc(
                        term === 'trilemma' ? 'Trilema de Mundell' : term === 'crowdingOut' ? 'Crowding out' : term === 'multiplier' ? 'Multiplicador' : 'Curva ' + term
                      )}</a>`
                  )
                  .join('')}
              </div>
              <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
                <a class="ms-btn-secondary" href="#fuentes?course=macroeconomia" style="flex:1">Fuentes bibliográficas →</a>
                <a class="ms-btn-secondary" href="#exploracion" style="flex:1">Datos reales →</a>
              </div>
            </section>
          </aside>
        </div>
        <p style="font-size:11px;color:var(--exp-muted);margin:12px 4px 0">
          ⓘ Actividad educativa con parámetros y resultados ilustrativos del modelo teórico IS–LM–BP. No representan proyecciones económicas reales.
        </p>
      </div>
    `;

    // Bind events
    host.querySelector('#apRouteSelect')?.addEventListener('change', e => {
      learningState.routeId = e.target.value;
      learningState.lessonIndex = 0;
      learningState.feedback = null;
      learningState.selectedOption = null;
      renderAprendizajeView();
    });
    host.querySelector('#apLessonSelect')?.addEventListener('change', e => {
      learningState.lessonIndex = Number(e.target.value) || 0;
      learningState.feedback = null;
      learningState.selectedOption = null;
      renderAprendizajeView();
    });
    host.querySelectorAll('[data-ap-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        learningState.level = btn.dataset.apLevel;
        renderAprendizajeView();
      });
    });
    host.querySelectorAll('[data-ap-lesson]').forEach(btn => {
      btn.addEventListener('click', () => {
        learningState.lessonIndex = Number(btn.dataset.apLesson) || 0;
        learningState.feedback = null;
        learningState.selectedOption = null;
        renderAprendizajeView();
      });
    });
    const updateSliders = () => {
      learningState.simG = Number(host.querySelector('#apSliderG')?.value || 0);
      learningState.simRegime = host.querySelector('#apRegimeSelect')?.value || 'flex';
      learningState.simM = learningState.simRegime === 'fixed' ? 0 : Number(host.querySelector('#apSliderM')?.value || 0);
      learningState.simIstar = Number(host.querySelector('#apSliderIstar')?.value || 0);
      refreshLearningDiagram();
    };
    ['#apSliderG', '#apSliderM', '#apSliderIstar', '#apRegimeSelect'].forEach(sel => {
      const el = host.querySelector(sel);
      el?.addEventListener('input', updateSliders);
      el?.addEventListener('change', updateSliders);
    });
    host.querySelector('#apResetSimBtn')?.addEventListener('click', () => {
      learningState.simG = 2.0;
      learningState.simM = 0.0;
      learningState.simIstar = 0.0;
      learningState.simRegime = scenario?.setup?.regime || 'flex';
      if (host.querySelector('#apSliderG')) host.querySelector('#apSliderG').value = String(learningState.simG);
      if (host.querySelector('#apSliderM')) host.querySelector('#apSliderM').value = String(learningState.simM);
      if (host.querySelector('#apSliderIstar')) host.querySelector('#apSliderIstar').value = String(learningState.simIstar);
      if (host.querySelector('#apRegimeSelect')) host.querySelector('#apRegimeSelect').value = learningState.simRegime;
      refreshLearningDiagram();
    });
    refreshLearningDiagram();
    host.querySelectorAll('[data-ap-option]').forEach(btn => {
      btn.addEventListener('click', () => {
        learningState.selectedOption = btn.dataset.apOption;
        renderAprendizajeView();
      });
    });
    host.querySelector('#apCheckAnswerBtn')?.addEventListener('click', () => {
      const chosen = options.find(o => o.id === learningState.selectedOption) || options[0];
      if (!chosen || !scenario) return;
      const scModel = buildCalibratedIslm(scenario.setup);
      if (!scModel) return;
      const from = scModel.solve(scModel.baseline, 'final');
      const to = scModel.solve({ ...scModel.baseline, ...scenario.patch(scModel.baseline) }, 'final');
      const graded = M.LAB_CONTENT.gradePrediction(chosen.prediction, from, to);
      const allOk = Object.values(graded).every(g => g.ok);
      learningState.attemptsCount += 1;
      if (allOk) {
        learningState.correctCount += 1;
        if (!learningState.completedIds.includes(scenario.id)) {
          learningState.completedIds.push(scenario.id);
        }
      }
      saveLearningProgress();
      learningState.feedback = {
        ok: allOk,
        message: allOk
          ? `¡Respuesta correcta! ${scenario.levels[learningState.level]}`
          : `Revisa el mecanismo: en este escenario (${scenario.title}), ${scenario.levels.intro}`
      };
      renderAprendizajeView();
    });
    const advanceLesson = () => {
      learningState.lessonIndex = (learningState.lessonIndex + 1) % totalLessons;
      learningState.feedback = null;
      learningState.selectedOption = null;
      renderAprendizajeView();
    };
    host.querySelector('#apNextLessonBtn')?.addEventListener('click', advanceLesson);
    host.querySelector('#apContinueBtn')?.addEventListener('click', advanceLesson);
    host.querySelector('#apClearProgressBtn')?.addEventListener('click', () => {
      learningState.completedIds = [];
      learningState.correctCount = 0;
      learningState.attemptsCount = 0;
      learningState.feedback = null;
      saveLearningProgress();
      renderAprendizajeView();
    });
  }

  /* ==========================================================================
     MÓDULO 02 — ANÁLISIS HISTÓRICO (#historico)
     ========================================================================== */
  const historyState = {
    search: '',
    indicatorId: 'NY.GDP.MKTP.KD.ZG',
    country: 'PER',
    startPeriod: '2014',
    endPeriod: '2025',
    splitPeriod: '2019',
    mode: 'raw'
  };
  let historyChartInstance = null;

  function renderHistoricoView() {
    const host = document.getElementById('historico');
    if (!host) return;
    const catalog = (M.INDICATORS_CATALOG || []).filter(item => !item.isDemo);
    const q = historyState.search.trim().toLocaleLowerCase('es');
    const filteredInds = catalog.filter(
      item => !q || [item.title, item.code, item.provider, item.unit].join(' ').toLocaleLowerCase('es').includes(q)
    );
    const activeInd = filteredInds.find(i => i.id === historyState.indicatorId) || filteredInds[0] || catalog[0];
    if (activeInd) historyState.indicatorId = activeInd.id;

    const resolved = M.resolveIndicatorSeries(activeInd, historyState.country);
    const allDates = resolved.series.map(p => p.date);
    const minDate = allDates[0] || '2014';
    const maxDate = allDates.at(-1) || '2025';
    if (!allDates.includes(historyState.startPeriod)) historyState.startPeriod = minDate;
    if (!allDates.includes(historyState.endPeriod)) historyState.endPeriod = maxDate;

    const analysis = M.buildHistoricalAnalysis({
      series: resolved.series,
      startPeriod: historyState.startPeriod,
      endPeriod: historyState.endPeriod,
      splitPeriod: historyState.splitPeriod,
      mode: historyState.mode,
      isRate: activeInd.isRate,
      frequency: activeInd.frequency
    });
    const sum = analysis.summary;
    const countries = Object.entries(M.COUNTRIES || {});

    host.innerHTML = `
      <div class="ms-exp-view">
        ${renderRibbonHTML('historico')}
        <header class="ms-exp-hero">
          <div class="ms-exp-hero-copy">
            <span class="ms-exp-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2.5"/></svg>
            </span>
            <div>
              <div class="ms-exp-eyebrow">MÓDULO 02 / 08 · EVOLUCIÓN TEMPORAL, SUBPERIODOS Y TENDENCIAS</div>
              <h1 id="hiTitle">Análisis histórico</h1>
              <p>Explora series de tiempo largas, compara subperiodos, evalúa variaciones e interpreta hitos económicos respaldados por fuentes.</p>
            </div>
          </div>
          <div class="ms-exp-actions">
            <a class="ms-btn-secondary" href="#indicadores?id=${encodeURIComponent(activeInd.id)}">Ver ficha del indicador →</a>
            <a class="ms-btn-secondary" href="#comparacion">Comparar economías →</a>
            <button type="button" class="ms-btn-primary" id="hiExportBtn">Exportar serie CSV →</button>
          </div>
        </header>

        <div class="ms-filter-bar" role="region" aria-label="Filtros de análisis histórico">
          <div class="ms-filter-field">
            <label for="hiSearchInput">Buscar indicador</label>
            <input id="hiSearchInput" type="search" placeholder="PBI, inflación, reservas, código..." value="${esc(historyState.search)}">
          </div>
          <div class="ms-filter-field">
            <label for="hiIndicatorSelect">Variable económica</label>
            <select id="hiIndicatorSelect">
              ${filteredInds
                .map(
                  ind =>
                    `<option value="${esc(ind.id)}" ${ind.id === activeInd.id ? 'selected' : ''}>${esc(ind.title)} (${esc(
                      ind.code
                    )})</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <label for="hiCountrySelect">País / Economía</label>
            <select id="hiCountrySelect" ${activeInd.providerKey === 'BCRP' ? 'disabled' : ''}>
              ${countries
                .map(
                  ([code, c]) =>
                    `<option value="${code}" ${(activeInd.providerKey === 'BCRP' ? 'PER' : historyState.country) === code ? 'selected' : ''}>${esc(
                      c.name
                    )}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <label for="hiStartSelect">Desde</label>
            <select id="hiStartSelect">
              ${allDates
                .map(d => `<option value="${esc(d)}" ${d === historyState.startPeriod ? 'selected' : ''}>${esc(d)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <label for="hiEndSelect">Hasta</label>
            <select id="hiEndSelect">
              ${allDates
                .map(d => `<option value="${esc(d)}" ${d === historyState.endPeriod ? 'selected' : ''}>${esc(d)}</option>`)
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field" style="grid-column:span 2">
            <span class="ms-filter-label">Modo de serie temporal</span>
            <div class="ms-seg-group" role="group" aria-label="Transformación de la serie histórica">
              ${[
                ['raw', 'Observado'],
                ['variation', 'Variación'],
                ['base100', 'Base = 100'],
                ['trend', 'Tendencia móvil']
              ]
                .map(
                  ([mKey, mLabel]) =>
                    `<button type="button" class="ms-seg-btn" data-hi-mode="${mKey}" aria-pressed="${
                      historyState.mode === mKey
                    }" ${mKey === 'base100' && activeInd.isRate ? 'disabled title="No aplicable a tasas con valores negativos"' : ''}>${mLabel}</button>`
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="hi-kpi-grid" aria-label="Resumen estadístico del periodo">
          <article class="hi-kpi-card">
            <small>Observación inicial (${esc(sum.firstObs?.date || 'N/D')})</small>
            <strong>${sum.firstObs ? fmtNum(sum.firstObs.value, 2) : 'N/D'}</strong>
            <span>${esc(activeInd.unit)} · ${esc(activeInd.frequency)}</span>
          </article>
          <article class="hi-kpi-card">
            <small>Observación final (${esc(sum.lastObs?.date || 'N/D')})</small>
            <strong>${sum.lastObs ? fmtNum(sum.lastObs.value, 2) : 'N/D'}</strong>
            <span>Cambio extremo a extremo: ${
              Number.isFinite(sum.totalVariation)
                ? `${sum.totalVariation >= 0 ? '+' : ''}${fmtNum(sum.totalVariation, 2)} ${sum.variationUnit}`
                : 'N/D'
            }</span>
          </article>
          <article class="hi-kpi-card">
            <small>Promedio y dispersión (${sum.count} obs.)</small>
            <strong>${Number.isFinite(sum.mean) ? fmtNum(sum.mean, 2) : 'N/D'}</strong>
            <span>Desv. est.: ${Number.isFinite(sum.stdDev) ? fmtNum(sum.stdDev, 2) : 'N/D'} · Huecos: ${sum.missingCount}</span>
          </article>
          <article class="hi-kpi-card">
            <small>Contraste de subperiodos (corte ${esc(sum.subperiods.pivot)})</small>
            <strong>${
              Number.isFinite(sum.subperiods.subDelta)
                ? `${sum.subperiods.subDelta >= 0 ? '+' : ''}${fmtNum(sum.subperiods.subDelta, 2)}`
                : 'N/D'
            }</strong>
            <span>Prom. B (${Number.isFinite(sum.subperiods.meanB) ? fmtNum(sum.subperiods.meanB, 1) : 'N/D'}) vs A (${
              Number.isFinite(sum.subperiods.meanA) ? fmtNum(sum.subperiods.meanA, 1) : 'N/D'
            })</span>
          </article>
        </div>

        <div class="hi-main-grid">
          <article class="ms-panel" aria-labelledby="hiChartHeading">
            <div class="ms-panel-head">
              <div>
                <h2 id="hiChartHeading">${esc(activeInd.title)} · ${esc(
                  M.COUNTRIES?.[activeInd.providerKey === 'BCRP' ? 'PER' : historyState.country]?.name || historyState.country
                )}</h2>
                <p>Código oficial: <strong>${esc(activeInd.code)}</strong> · Unidad: ${esc(activeInd.unit)} · Procedencia: ${esc(
                  resolved.provenance
                )}</p>
              </div>
              <span class="ms-badge">${esc(activeInd.provider)}</span>
            </div>
            <div class="hi-chart-box">
              <canvas id="hiMainChart" role="img" aria-label="Gráfico histórico de ${esc(activeInd.title)}"></canvas>
            </div>
            <div class="ms-exp-eyebrow" style="margin-top:12px">ACONTECIMIENTOS ECONÓMICOS DOCUMENTADOS EN EL PERIODO</div>
            <div class="hi-milestones">
              ${(analysis.milestones.length ? analysis.milestones : M.HISTORICAL_MILESTONES.slice(0, 3))
                .map(
                  ms => `<div class="hi-milestone-card">
                    <strong>${esc(ms.year)} · ${esc(ms.title)}</strong>
                    <p style="margin:0 0 4px;line-height:1.4">${esc(ms.summary)}</p>
                    <small style="color:var(--exp-muted)">Fuente: ${esc(ms.source)}</small>
                  </div>`
                )
                .join('')}
            </div>
          </article>

          <aside class="ms-panel" aria-labelledby="hiInterpHeading">
            <div class="ms-panel-head">
              <div>
                <h2 id="hiInterpHeading">Comparación de subperiodos e interpretación</h2>
                <p>Análisis descriptivo sin interpolar datos faltantes</p>
              </div>
            </div>
            <div class="ms-filter-field" style="margin-bottom:10px">
              <label for="hiSplitSelect">Periodo de corte (Subperiodo A ≤ corte &lt; Subperiodo B)</label>
              <select id="hiSplitSelect">
                ${allDates
                  .map(
                    d => `<option value="${esc(d)}" ${d === sum.subperiods.pivot ? 'selected' : ''}>Corte en ${esc(d)}</option>`
                  )
                  .join('')}
              </select>
            </div>
            <div class="hi-subperiod-bars">
              <div>
                <small style="font-weight:700;color:var(--exp-muted)">Subperiodo A (${esc(sum.subperiods.labelA)})</small>
                <div style="font:800 18px var(--font-heading)">Promedio: ${
                  Number.isFinite(sum.subperiods.meanA) ? fmtNum(sum.subperiods.meanA, 2) + ' ' + activeInd.unit : 'N/D'
                }</div>
              </div>
              <div style="border-top:1px solid var(--exp-stroke);padding-top:8px">
                <small style="font-weight:700;color:var(--exp-muted)">Subperiodo B (${esc(sum.subperiods.labelB)})</small>
                <div style="font:800 18px var(--font-heading);color:var(--exp-blue)">Promedio: ${
                  Number.isFinite(sum.subperiods.meanB) ? fmtNum(sum.subperiods.meanB, 2) + ' ' + activeInd.unit : 'N/D'
                }</div>
              </div>
            </div>
            <div style="display:grid;gap:8px;font-size:12px;line-height:1.55">
              <p style="margin:0"><strong>1. Rango histórico observado:</strong> El valor mínimo del tramo seleccionado se registró en <strong>${esc(
                sum.minObs?.date || 'N/D'
              )}</strong> (${sum.minObs ? fmtNum(sum.minObs.value, 2) : 'N/D'}) y el máximo en <strong>${esc(
                sum.maxObs?.date || 'N/D'
              )}</strong> (${sum.maxObs ? fmtNum(sum.maxObs.value, 2) : 'N/D'}).</p>
              <p style="margin:0"><strong>2. Definición metodológica:</strong> ${esc(activeInd.definition)}</p>
              <p style="margin:0"><strong>3. Nota de integridad:</strong> Las observaciones ausentes se conservan como <code>N/D</code> sin interpolación lineal.</p>
            </div>
          </aside>
        </div>

        <article class="ms-panel" aria-labelledby="hiTableHeading">
          <div class="ms-panel-head">
            <div>
              <h2 id="hiTableHeading">Tabla histórica con trazabilidad por observación</h2>
              <p>Valores observados, variaciones, índice base 100, media móvil de 3 periodos y procedencia</p>
            </div>
          </div>
          <div class="data-table-wrap">
            <table class="data-table" id="hiDataTable">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Valor observado (${esc(activeInd.unit)})</th>
                  <th>Variación / Cambio</th>
                  <th>Índice Base = 100</th>
                  <th>Media móvil (3 obs.)</th>
                  <th>Procedencia</th>
                </tr>
              </thead>
              <tbody>
                ${analysis.rows
                  .map(
                    r => `<tr>
                      <td><strong>${esc(r.date)}</strong></td>
                      <td>${r.value !== null ? fmtNum(r.value, 2) : 'N/D'}</td>
                      <td>${r.pctChange !== null ? (r.pctChange >= 0 ? '+' : '') + fmtNum(r.pctChange, 2) + (activeInd.isRate ? ' p.p.' : ' %') : 'N/D'}</td>
                      <td>${r.base100 !== null ? fmtNum(r.base100, 1) : '—'}</td>
                      <td>${r.ma3 !== null ? fmtNum(r.ma3, 2) : '—'}</td>
                      <td><span class="ms-badge">${esc(r.source)}</span></td>
                    </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    `;

    // Render chart
    historyChartInstance?.destroy();
    const canvas = host.querySelector('#hiMainChart');
    if (canvas && typeof globalThis.Chart === 'function' && analysis.rows.length) {
      const labels = analysis.rows.map(r => r.date);
      const mainData = analysis.rows.map(r => r.displayValue);
      const maData = analysis.rows.map(r => r.ma3);
      historyChartInstance = new globalThis.Chart(canvas, {
        type: historyState.mode === 'variation' ? 'bar' : 'line',
        data: {
          labels,
          datasets: [
            {
              label: `${activeInd.title} (${historyState.mode})`,
              data: mainData,
              borderColor: '#1864ea',
              backgroundColor: historyState.mode === 'variation' ? 'rgba(40,123,241,0.65)' : 'rgba(40,123,241,0.15)',
              borderWidth: 2.4,
              fill: historyState.mode !== 'variation',
              spanGaps: false,
              tension: 0.22,
              pointRadius: 2
            },
            ...(historyState.mode === 'raw'
              ? [
                  {
                    type: 'line',
                    label: 'Promedio móvil (3 obs.)',
                    data: maData,
                    borderColor: '#007a70',
                    borderDash: [5, 4],
                    borderWidth: 1.8,
                    spanGaps: false,
                    fill: false,
                    pointRadius: 0
                  }
                ]
              : [])
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            y: { beginAtZero: historyState.mode === 'variation' }
          }
        }
      });
    }

    // Bind events
    host.querySelector('#hiSearchInput')?.addEventListener('input', e => {
      historyState.search = e.target.value;
      renderHistoricoView();
    });
    host.querySelector('#hiIndicatorSelect')?.addEventListener('change', e => {
      historyState.indicatorId = e.target.value;
      const nextInd = catalog.find(i => i.id === e.target.value);
      if (nextInd?.isRate && historyState.mode === 'base100') historyState.mode = 'raw';
      renderHistoricoView();
    });
    host.querySelector('#hiCountrySelect')?.addEventListener('change', e => {
      historyState.country = e.target.value;
      renderHistoricoView();
    });
    host.querySelector('#hiStartSelect')?.addEventListener('change', e => {
      historyState.startPeriod = e.target.value;
      if (historyState.startPeriod > historyState.endPeriod) historyState.endPeriod = historyState.startPeriod;
      renderHistoricoView();
    });
    host.querySelector('#hiEndSelect')?.addEventListener('change', e => {
      historyState.endPeriod = e.target.value;
      if (historyState.endPeriod < historyState.startPeriod) historyState.startPeriod = historyState.endPeriod;
      renderHistoricoView();
    });
    host.querySelector('#hiSplitSelect')?.addEventListener('change', e => {
      historyState.splitPeriod = e.target.value;
      renderHistoricoView();
    });
    host.querySelectorAll('[data-hi-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        historyState.mode = btn.dataset.hiMode;
        renderHistoricoView();
      });
    });
    host.querySelector('#hiExportBtn')?.addEventListener('click', () => {
      const header = '"pais_iso3","indicador_codigo","periodo","valor_observado","variacion","indice_base_100","media_movil_3","unidad","procedencia"';
      const cIso = activeInd.providerKey === 'BCRP' ? 'PER' : historyState.country;
      const lines = analysis.rows.map(r =>
        [
          cIso,
          activeInd.code,
          r.date,
          r.value ?? '',
          r.pctChange !== null ? r.pctChange.toFixed(2) : '',
          r.base100 !== null ? r.base100.toFixed(2) : '',
          r.ma3 !== null ? r.ma3.toFixed(2) : '',
          activeInd.unit,
          r.source
        ]
          .map(v => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      );
      downloadCsvFile(`macroscope-historico-${cIso}-${activeInd.code}.csv`, [header, ...lines].join('\r\n'));
    });
  }

  /* ==========================================================================
     MÓDULO 03 — INDICADORES MACROECONÓMICOS (#indicadores)
     ========================================================================== */
  const indicatorsState = {
    category: 'all',
    search: '',
    country: 'PER',
    providerFilter: 'all',
    selectedId: 'NY.GDP.MKTP.KD.ZG',
    expandedChart: false
  };
  let indicatorSheetChart = null;

  function renderIndicadoresView() {
    const host = document.getElementById('indicadores');
    if (!host) return;
    const catalog = M.INDICATORS_CATALOG || [];
    const categories = M.INDICATOR_CATEGORIES || {};
    const q = indicatorsState.search.trim().toLocaleLowerCase('es');

    const filtered = catalog.filter(item => {
      if (indicatorsState.category !== 'all' && item.category !== indicatorsState.category) return false;
      if (indicatorsState.providerFilter !== 'all' && item.providerKey !== indicatorsState.providerFilter) return false;
      if (
        q &&
        ![item.title, item.code, item.definition, item.unit, categories[item.category]]
          .join(' ')
          .toLocaleLowerCase('es')
          .includes(q)
      ) {
        return false;
      }
      return true;
    });

    const selected = filtered.find(i => i.id === indicatorsState.selectedId) || filtered[0] || catalog[0];
    if (selected) indicatorsState.selectedId = selected.id;
    const resolvedSelected = M.resolveIndicatorSeries(selected, indicatorsState.country);
    const finiteSelected = resolvedSelected.series.filter(p => Number.isFinite(p.value));
    const { latest: latestPoint, delta: latestDelta } = M.getLatestObservationSummary(
      resolvedSelected.series,
      selected.frequency
    );

    // Comparación básica entre economías para la ficha analítica
    const peerCodes = ['PER', 'CHL', 'COL', 'MEX', 'BRA', 'USA'];
    const peerRows =
      selected.providerKey === 'WDI'
        ? peerCodes.map(code => {
            const r = M.resolveIndicatorSeries(selected, code);
            const last = r.series.findLast(p => Number.isFinite(p.value));
            return { code, name: M.COUNTRIES?.[code]?.name || code, value: last?.value ?? null, date: last?.date || 'N/D' };
          })
        : [];

    host.innerHTML = `
      <div class="ms-exp-view">
        ${renderRibbonHTML('indicadores')}
        <header class="ms-exp-hero">
          <div class="ms-exp-hero-copy">
            <span class="ms-exp-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19v-5M9 19V8M14 19v-9M19 19V4"/></svg>
            </span>
            <div>
              <div class="ms-exp-eyebrow">MÓDULO 03 / 08 · CATÁLOGO ANALÍTICO, METADATOS Y FICHAS TÉCNICAS</div>
              <h1 id="indTitle">Indicadores macroeconómicos</h1>
              <p>Explora el catálogo categorizado de variables económicas, sus definiciones, fórmulas, códigos de serie y fichas analíticas.</p>
            </div>
          </div>
          <div class="ms-exp-actions">
            <a class="ms-btn-secondary" href="#historico?indicator=${encodeURIComponent(selected.id)}">Abrir en Análisis histórico →</a>
            <a class="ms-btn-primary" href="#comparacion">Comparar economías →</a>
          </div>
        </header>

        <div class="ms-filter-bar" role="region" aria-label="Filtros del catálogo de indicadores">
          <div class="ms-filter-field">
            <label for="indSearchInput">Buscar por nombre, código o concepto</label>
            <input id="indSearchInput" type="search" placeholder="Ej. FP.CPI.TOTL.ZG, inflación, reservas..." value="${esc(
              indicatorsState.search
            )}">
          </div>
          <div class="ms-filter-field">
            <label for="indCountrySelect">Economía de referencia</label>
            <select id="indCountrySelect">
              ${Object.entries(M.COUNTRIES || {})
                .filter(([, c]) => !c.aggregate)
                .map(
                  ([code, c]) =>
                    `<option value="${code}" ${code === indicatorsState.country ? 'selected' : ''}>${esc(c.name)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="ms-filter-field">
            <label for="indProviderSelect">Fuente / Naturaleza</label>
            <select id="indProviderSelect">
              <option value="all" ${indicatorsState.providerFilter === 'all' ? 'selected' : ''}>Todas las fuentes (${catalog.length})</option>
              <option value="WDI" ${indicatorsState.providerFilter === 'WDI' ? 'selected' : ''}>Banco Mundial · WDI</option>
              <option value="BCRP" ${indicatorsState.providerFilter === 'BCRP' ? 'selected' : ''}>BCRP · Series Oficiales (Perú)</option>
              <option value="DEMO" ${indicatorsState.providerFilter === 'DEMO' ? 'selected' : ''}>Fichas demostrativas identificadas</option>
            </select>
          </div>
        </div>

        <div class="ind-cat-strip" role="tablist" aria-label="Categorías macroeconómicas">
          ${Object.entries(categories)
            .map(
              ([catKey, catLabel]) =>
                `<button type="button" role="tab" class="ms-seg-btn" data-ind-cat="${catKey}" aria-selected="${
                  indicatorsState.category === catKey
                }">${esc(catLabel)}</button>`
            )
            .join('')}
        </div>

        <div class="ind-workspace">
          <!-- Grilla izquierda: tarjetas del catálogo -->
          <div class="ind-cards-grid" id="indCatalogGrid" aria-label="Catálogo de indicadores (${filtered.length} resultados)">
            ${filtered
              .map(item => {
                const res = M.resolveIndicatorSeries(item, indicatorsState.country);
                const { latest: last, delta: d } = M.getLatestObservationSummary(res.series, item.frequency);
                const isSel = item.id === selected.id;
                return `<button type="button" class="ind-card${isSel ? ' is-selected' : ''}" data-ind-card="${esc(
                  item.id
                )}" aria-pressed="${isSel}">
                  <div style="display:flex;justify-content:space-between;gap:8px;width:100%;align-items:center">
                    <span class="ms-badge ${item.isDemo ? 'demo' : ''}">${esc(categories[item.category] || item.category)}</span>
                    <small style="font:700 10px var(--font-mono);color:var(--exp-muted)">${esc(item.code)}</small>
                  </div>
                  <div>
                    <strong style="display:block;font:800 14px/1.3 var(--font-heading);margin-bottom:3px">${esc(item.title)}</strong>
                    <small style="color:var(--exp-muted);font-size:11px;display:block">${esc(item.provider)} · ${esc(item.frequency)}</small>
                  </div>
                  <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;gap:8px;margin-top:4px">
                    <div>
                      <div class="ind-card-val">${last ? fmtNum(last.value, 1) : 'N/D'}</div>
                      <small style="font-size:10.5px;color:var(--exp-muted)">${esc(item.unit)} · ${esc(last?.date || 'Sin dato')}${
                        d !== null ? ` (${d >= 0 ? '+' : ''}${fmtNum(d, 1)})` : ''
                      }</small>
                    </div>
                    ${makeSparkSvg(res.series.map(p => p.value))}
                  </div>
                </button>`;
              })
              .join('')}
          </div>

          <!-- Panel derecho: Ficha Analítica del Indicador -->
          <aside class="ms-panel" id="indDetailSheet" aria-labelledby="indSheetTitle">
            <div class="ms-panel-head">
              <div>
                <div class="ms-exp-eyebrow">FICHA ANALÍTICA DEL INDICADOR</div>
                <h2 id="indSheetTitle">${esc(selected.title)}</h2>
                <p>${esc(selected.provider)} · Serie <strong>${esc(selected.code)}</strong></p>
              </div>
              <span class="ms-badge ${selected.isDemo || resolvedSelected.status === 'unavailable' ? 'demo' : 'live'}">${
                selected.isDemo
                  ? 'Demostrativo · No oficial'
                  : resolvedSelected.status === 'unavailable'
                    ? 'Serie Oficial · Sin dato local (requiere proxy)'
                    : 'Serie Oficial Verificada'
              }</span>
            </div>

            <div class="ind-meta-list">
              <div><strong>Valor actual (${esc(latestPoint?.date || 'N/D')})</strong><span>${
                latestPoint ? fmtNum(latestPoint.value, 2) + ' ' + selected.unit : 'N/D'
              }</span></div>
              <div><strong>Variación reciente</strong><span>${
                latestDelta !== null ? (latestDelta >= 0 ? '+' : '') + fmtNum(latestDelta, 2) : 'Sin variación comparable'
              }</span></div>
              <div><strong>Frecuencia y Unidad</strong><span>${esc(selected.frequency)} · ${esc(selected.unit)}</span></div>
              <div><strong>Procedencia</strong><span>${esc(resolvedSelected.provenance)}</span></div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <strong style="font-size:12.5px">Trayectoria de la serie</strong>
              <button type="button" class="ms-btn-secondary" id="indExpandChartBtn">
                ${indicatorsState.expandedChart ? 'Compactar gráfico' : 'Ampliar gráfico ⤢'}
              </button>
            </div>
            <div class="ind-sheet-chart${indicatorsState.expandedChart ? ' is-expanded' : ''}">
              <canvas id="indDetailChart" role="img" aria-label="Gráfico de la ficha de ${esc(selected.title)}"></canvas>
            </div>

            <div style="display:grid;gap:8px;font-size:12px;line-height:1.55;margin:10px 0">
              <div><strong>Definición económica:</strong> ${esc(selected.definition)}</div>
              <div class="mod-equation-box"><strong>Fórmula / Criterio:</strong> ${esc(selected.formula)}</div>
              <div><strong>Lectura analítica:</strong> ${esc(selected.interpretation)}</div>
            </div>

            ${
              peerRows.length
                ? `<div style="margin-top:12px">
                    <div class="ms-exp-eyebrow">COMPARACIÓN BÁSICA ENTRE ECONOMÍAS (ÚLTIMO AÑO)</div>
                    <div style="display:grid;gap:6px;margin-top:6px">
                      ${peerRows
                        .map(
                          pr => `<div style="display:flex;justify-content:space-between;font-size:11.5px;padding:6px 10px;border-radius:10px;background:var(--exp-soft)">
                            <span><strong>${esc(pr.name)}</strong> (${esc(pr.date)})</span>
                            <strong>${pr.value !== null ? fmtNum(pr.value, 1) + ' ' + esc(selected.unit) : 'N/D'}</strong>
                          </div>`
                        )
                        .join('')}
                    </div>
                  </div>`
                : ''
            }

            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px">
              ${
                !selected.isDemo
                  ? `<button type="button" class="ms-btn-primary" id="indOpenHistoryBtn">Analizar en Histórico →</button>`
                  : ''
              }
              <a class="ms-btn-secondary" href="${esc(selected.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fuente oficial ↗</a>
              <button type="button" class="ms-btn-secondary" id="indCiteBtn">Copiar cita APA</button>
            </div>
          </aside>
        </div>
      </div>
    `;

    // Render sheet chart (preserving null observations as discontinuities with spanGaps: false)
    indicatorSheetChart?.destroy();
    const canvas = host.querySelector('#indDetailChart');
    if (canvas && typeof globalThis.Chart === 'function' && finiteSelected.length) {
      indicatorSheetChart = new globalThis.Chart(canvas, {
        type: 'line',
        data: {
          labels: resolvedSelected.series.map(p => p.date),
          datasets: [
            {
              label: selected.title,
              data: resolvedSelected.series.map(p => p.value),
              borderColor: selected.isDemo ? '#b37400' : '#1864ea',
              backgroundColor: selected.isDemo ? 'rgba(179,116,0,0.14)' : 'rgba(24,100,234,0.15)',
              borderWidth: 2.3,
              spanGaps: false,
              fill: true,
              tension: 0.24,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: false } }
        }
      });
    }

    // Bind events
    host.querySelector('#indSearchInput')?.addEventListener('input', e => {
      indicatorsState.search = e.target.value;
      renderIndicadoresView();
    });
    host.querySelector('#indCountrySelect')?.addEventListener('change', e => {
      indicatorsState.country = e.target.value;
      renderIndicadoresView();
    });
    host.querySelector('#indProviderSelect')?.addEventListener('change', e => {
      indicatorsState.providerFilter = e.target.value;
      renderIndicadoresView();
    });
    host.querySelectorAll('[data-ind-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        indicatorsState.category = btn.dataset.indCat;
        renderIndicadoresView();
      });
    });
    host.querySelectorAll('[data-ind-card]').forEach(btn => {
      btn.addEventListener('click', () => {
        indicatorsState.selectedId = btn.dataset.indCard;
        renderIndicadoresView();
      });
    });
    host.querySelector('#indExpandChartBtn')?.addEventListener('click', () => {
      indicatorsState.expandedChart = !indicatorsState.expandedChart;
      renderIndicadoresView();
    });
    host.querySelector('#indOpenHistoryBtn')?.addEventListener('click', () => {
      historyState.indicatorId = selected.id;
      historyState.country = indicatorsState.country;
      location.hash = 'historico';
    });
    host.querySelector('#indCiteBtn')?.addEventListener('click', () => {
      const citation = M.dataCitation({
        provider: selected.providerKey === 'BCRP' ? 'bcrp' : 'wdi',
        code: selected.code,
        country: M.COUNTRIES?.[indicatorsState.country]?.name || 'Perú'
      });
      M.copyText(citation);
    });
  }

  /* ==========================================================================
     MÓDULO 07 — MODELOS Y TENDENCIAS (#modelos)
     ========================================================================== */
  const modelsState = {
    selectedModelId: 'islm',
    country: 'PER',
    // Controles para IS-LM-BP (islm)
    islmM: 0,
    // Controles para OA-DA (asad)
    asadG: 2.0,
    asadM: 0.0,
    asadZ: 0.0,
    // Controles para Oferta y Demanda (micro-sd)
    sdDemand: 20,
    sdSupply: 0,
    sdTax: 0,
    // Desplazamiento conceptual para Phillips / Solow
    conceptualShift: 1
  };
  let modelsTrendChart = null;

  function modelDiagramSpec(modelId) {
    const Specs = M.EconomicDiagramSpecs;
    if (!Specs) return null;
    if (modelId === 'asad') {
      return Specs.asad({
        dG: modelsState.asadG,
        dM: modelsState.asadM,
        dz: modelsState.asadZ
      });
    }
    if (modelId === 'micro-sd') {
      return Specs.supplyDemand({
        dD: modelsState.sdDemand,
        dS: modelsState.sdSupply,
        tau: modelsState.sdTax
      });
    }
    if (modelId === 'phillips' || modelId === 'solow') {
      return Specs.conceptual(modelId, modelsState.conceptualShift);
    }
    const m = buildCalibratedIslm({ regime: 'flex', mobility: 'high', instrument: 'money' });
    return m ? Specs.islm(m, { G: m.baseline.G + modelsState.asadG, Mpct: modelsState.islmM }) : null;
  }

  function formatModelReading(activeModel) {
    if (activeModel.id === 'asad') {
      return M.createAsAdModel()
        .explain({ dG: modelsState.asadG, dM: modelsState.asadM, dz: modelsState.asadZ })
        .map((step, i) => `<div><strong>${i + 1}.</strong> ${esc(step)}</div>`)
        .join('');
    }
    return `<div><strong>1. Mecanismo central:</strong> ${esc(activeModel.question)}</div>
       <div><strong>2. Horizonte temporal:</strong> ${esc(activeModel.horizon)}.</div>
       <div><strong>3. Distinción metodológica:</strong> ${
         activeModel.status === 'functional'
           ? 'Este modelo cuenta con un motor matemático puro verificado en pruebas unitarias.'
           : 'Esta vista presenta la estructura conceptual y geométrica del modelo sin simular calibraciones econométricas no verificadas.'
       }</div>`;
  }

  function refreshModelDiagram(activeModel) {
    const host = document.getElementById('modelos');
    if (!host || !activeModel) return;
    const spec = modelDiagramSpec(activeModel.id);
    if (spec) {
      M.EconomicDiagrams?.mount(
        host.querySelector('#modSvgContainer'),
        `models-${activeModel.id}`,
        `Relaciones entre variables: ${activeModel.title}`,
        spec,
        {
          group: `models-${activeModel.id}`,
          kind: activeModel.status === 'functional' ? 'Simulación matemática' : 'Esquema conceptual'
        }
      );
    }
    const outG = host.querySelector('#modAsadGOut');
    if (outG) outG.textContent = `${modelsState.asadG >= 0 ? '+' : ''}${modelsState.asadG}`;
    const outIslmM = host.querySelector('#modIslmMOut');
    if (outIslmM) outIslmM.textContent = `${modelsState.islmM >= 0 ? '+' : ''}${modelsState.islmM}%`;
    const outZ = host.querySelector('#modAsadZOut');
    if (outZ) outZ.textContent = `${modelsState.asadZ >= 0 ? '+' : ''}${modelsState.asadZ}`;
    const outD = host.querySelector('#modSdDOut');
    if (outD) outD.textContent = String(modelsState.sdDemand);
    const outTax = host.querySelector('#modSdTaxOut');
    if (outTax) outTax.textContent = String(modelsState.sdTax);
    host.querySelectorAll('[data-mod-shift]').forEach(btn => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.modShift) === modelsState.conceptualShift));
    });
    const reading = host.querySelector('#modReadingBody');
    if (reading) reading.innerHTML = formatModelReading(activeModel);
  }

  function renderModelosView() {
    const host = document.getElementById('modelos');
    if (!host) return;
    const library = M.MODELS_LIBRARY || [];
    const activeModel = library.find(m => m.id === modelsState.selectedModelId) || library[0];
    if (activeModel) modelsState.selectedModelId = activeModel.id;

    const empInd = (M.INDICATORS_CATALOG || []).find(i => i.id === activeModel.empiricalIndicator) || M.INDICATORS_CATALOG[0];
    const empResolved = M.resolveIndicatorSeries(empInd, modelsState.country);
    const empPoints = empResolved.series.filter(p => Number.isFinite(p.value));

    host.innerHTML = `
      <div class="ms-exp-view">
        ${renderRibbonHTML('modelos')}
        <header class="ms-exp-hero">
          <div class="ms-exp-hero-copy">
            <span class="ms-exp-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="18" r="2.5"/><circle cx="12" cy="5" r="2.5"/><circle cx="19" cy="17" r="2.5"/><path d="m7 16 4-9m3 0 4 8M7.5 18h9"/></svg>
            </span>
            <div>
              <div class="ms-exp-eyebrow">MÓDULO 07 / 08 · BIBLIOTECA VISUAL DE MODELOS ECONÓMICOS Y TENDENCIAS</div>
              <h1 id="modTitle">Modelos y tendencias</h1>
              <p>Comprende la arquitectura teórica, supuestos, ecuaciones y mecanismos de los modelos económicos y contrástalos con las tendencias empíricas.</p>
            </div>
          </div>
          <div class="ms-exp-actions">
            <a class="ms-btn-secondary" href="#aprendizaje">Ir a Aprendizaje guiado →</a>
            <a class="ms-btn-primary" href="#simulacion">Abrir Laboratorio IS–LM–BP →</a>
          </div>
        </header>

        <div class="mod-cards-row" role="tablist" aria-label="Selector de modelo económico">
          ${library
            .map(
              m => `<button type="button" role="tab" class="mod-card-btn${m.id === activeModel.id ? ' is-active' : ''}" data-mod-select="${esc(
                m.id
              )}" aria-selected="${m.id === activeModel.id}">
                <span class="ms-badge ${m.status === 'functional' ? 'live' : ''}">${esc(m.statusBadge)}</span>
                <strong style="font:800 13.5px/1.25 var(--font-heading)">${esc(m.title)}</strong>
                <small style="color:var(--exp-muted);font-size:11px">${esc(m.horizon)}</small>
              </button>`
            )
            .join('')}
        </div>

        <div class="mod-workspace">
          <!-- Columna izquierda: Estructura conceptual, supuestos y ecuaciones -->
          <article class="ms-panel" aria-labelledby="modTheoryHeading">
            <div class="ms-panel-head">
              <div>
                <div class="ms-exp-eyebrow">ESTRUCTURA TEÓRICA Y SUPUESTOS</div>
                <h2 id="modTheoryHeading">${esc(activeModel.title)}</h2>
                <p>${esc(activeModel.subtitle)}</p>
              </div>
            </div>
            <p style="font-size:12.5px;line-height:1.55;margin:0 0 10px"><strong>Pregunta central:</strong> ${esc(
              activeModel.question
            )}</p>
            <div class="ms-exp-eyebrow">ECUACIONES ESTRUCTURALES</div>
            ${activeModel.equations.map(eq => `<div class="mod-equation-box">${esc(eq)}</div>`).join('')}

            <div class="ms-exp-eyebrow" style="margin-top:12px">VARIABLES DEL MODELO</div>
            <div style="font-size:11.5px;display:grid;gap:6px;margin:6px 0 12px">
              <div><strong>Endógenas (determinadas por el modelo):</strong> ${esc(activeModel.variables.endogenous.join(' · '))}</div>
              <div><strong>Exógenas / Instrumentos:</strong> ${esc(activeModel.variables.exogenous.join(' · '))}</div>
            </div>

            <div class="ms-exp-eyebrow">SUPUESTOS EXPLÍCITOS</div>
            <ul style="margin:6px 0 0;padding-left:18px;font-size:11.5px;line-height:1.55">
              ${activeModel.assumptions.map(a => `<li>${esc(a)}</li>`).join('')}
            </ul>
          </article>

          <!-- Columna central: Diagrama interactivo + Contraste de tendencias reales -->
          <div style="display:grid;gap:14px;min-width:0">
            <article class="ms-panel" aria-labelledby="modDiagramHeading">
              <div class="ms-panel-head">
                <div>
                  <div class="ms-exp-eyebrow">${
                    activeModel.status === 'functional' ? 'SIMULACIÓN MATEMÁTICA VERIFICADA' : 'ESQUEMA CONCEPTUAL ANALÍTICO'
                  }</div>
                  <h2 id="modDiagramHeading">Relaciones entre variables: ${esc(activeModel.title)}</h2>
                </div>
                <span class="ms-badge ${activeModel.status === 'functional' ? 'live' : ''}">${esc(activeModel.statusBadge)}</span>
              </div>

              <div class="mod-diagram-box" id="modSvgContainer"></div>

              ${
                activeModel.id === 'islm'
                  ? `<div class="ms-filter-bar" style="margin-bottom:0">
                      <div class="ms-filter-field">
                        <label for="modAsadG">Impulso fiscal / demanda (ΔG): <strong id="modAsadGOut">${modelsState.asadG >= 0 ? '+' : ''}${modelsState.asadG}</strong></label>
                        <input id="modAsadG" type="range" min="-4" max="4" step="0.5" value="${modelsState.asadG}">
                      </div>
                      <div class="ms-filter-field">
                        <label for="modIslmM">Oferta monetaria (ΔM): <strong id="modIslmMOut">${modelsState.islmM >= 0 ? '+' : ''}${modelsState.islmM}%</strong></label>
                        <input id="modIslmM" type="range" min="-10" max="10" step="1" value="${modelsState.islmM}">
                      </div>
                    </div>`
                  : activeModel.id === 'asad'
                    ? `<div class="ms-filter-bar" style="margin-bottom:0">
                        <div class="ms-filter-field">
                          <label for="modAsadG">Impulso fiscal / demanda (ΔG): <strong id="modAsadGOut">${modelsState.asadG >= 0 ? '+' : ''}${modelsState.asadG}</strong></label>
                          <input id="modAsadG" type="range" min="-4" max="4" step="0.5" value="${modelsState.asadG}">
                        </div>
                        <div class="ms-filter-field">
                          <label for="modAsadZ">Shock de costos / oferta (Δz): <strong id="modAsadZOut">${modelsState.asadZ >= 0 ? '+' : ''}${modelsState.asadZ}</strong></label>
                          <input id="modAsadZ" type="range" min="-3" max="3" step="0.5" value="${modelsState.asadZ}">
                        </div>
                      </div>`
                    : activeModel.id === 'micro-sd'
                      ? `<div class="ms-filter-bar" style="margin-bottom:0">
                          <div class="ms-filter-field">
                            <label for="modSdD">Desplazamiento Demanda (ΔD): <strong id="modSdDOut">${modelsState.sdDemand}</strong></label>
                            <input id="modSdD" type="range" min="-30" max="30" step="5" value="${modelsState.sdDemand}">
                          </div>
                          <div class="ms-filter-field">
                            <label for="modSdTax">Impuesto por unidad (τ): <strong id="modSdTaxOut">${modelsState.sdTax}</strong></label>
                            <input id="modSdTax" type="range" min="0" max="30" step="5" value="${modelsState.sdTax}">
                          </div>
                        </div>`
                      : `<div class="ms-filter-bar" style="margin-bottom:0">
                          <div class="ms-filter-field">
                            <span class="ms-filter-label">Exploración conceptual del desplazamiento (no estimación econométrica)</span>
                            <div class="ms-seg-group">
                              <button type="button" class="ms-seg-btn" data-mod-shift="0" aria-pressed="${modelsState.conceptualShift === 0}">Equilibrio base</button>
                              <button type="button" class="ms-seg-btn" data-mod-shift="1" aria-pressed="${modelsState.conceptualShift === 1}">Desplazamiento positivo</button>
                              <button type="button" class="ms-seg-btn" data-mod-shift="-1" aria-pressed="${modelsState.conceptualShift === -1}">Desplazamiento adverso</button>
                            </div>
                          </div>
                        </div>`
              }
            </article>

            <article class="ms-panel" aria-labelledby="modTrendHeading">
              <div class="ms-panel-head">
                <div>
                  <div class="ms-exp-eyebrow">CONTRASTE CON EVIDENCIA EMPÍRICA (WDI)</div>
                  <h3 id="modTrendHeading">Tendencia observada relacionada: ${esc(empInd.title)}</h3>
                  <p>Los datos observados reflejan múltiples choques simultáneos; el modelo teórico aísla mecanismos específicos ceteris paribus.</p>
                </div>
                <select id="modEmpiricalCountry" class="field-select" style="width:auto;height:44px">
                  ${['PER', 'CHL', 'COL', 'MEX', 'BRA', 'USA']
                    .map(
                      c =>
                        `<option value="${c}" ${c === modelsState.country ? 'selected' : ''}>${esc(
                          M.COUNTRIES?.[c]?.name || c
                        )}</option>`
                    )
                    .join('')}
                </select>
              </div>
              <div style="height:190px;position:relative">
                <canvas id="modTrendCanvas" role="img" aria-label="Tendencia observada de ${esc(empInd.title)}"></canvas>
              </div>
            </article>
          </div>

          <!-- Columna derecha: Interpretación económica y conexiones -->
          <aside class="ms-panel" aria-labelledby="modReadingHeading">
            <div class="ms-panel-head">
              <div>
                <h2 id="modReadingHeading">Interpretación económica</h2>
                <p>Transmisión teórica y referencias académicas</p>
              </div>
            </div>
            <div id="modReadingBody" style="display:grid;gap:10px;font-size:12px;line-height:1.55">
              ${formatModelReading(activeModel)}
            </div>
            <div class="ms-exp-eyebrow" style="margin-top:14px">REFERENCIAS CLÁSICAS</div>
            <p style="font-size:11.5px;color:var(--exp-muted);margin:4px 0 14px">${esc(activeModel.refs.join(' · '))}</p>
            <div style="display:grid;gap:8px">
              <a class="ms-btn-primary" href="#simulacion">Experimentar en Simulación IS–LM–BP →</a>
              <a class="ms-btn-secondary" href="#aprendizaje">Practicar con lecciones guiadas →</a>
              <a class="ms-btn-secondary" href="#historico?indicator=${encodeURIComponent(empInd.id)}">Ver serie en Análisis histórico →</a>
            </div>
          </aside>
        </div>
      </div>
    `;

    modelsTrendChart?.destroy();
    modelsTrendChart = null;
    const canvas = host.querySelector('#modTrendCanvas');
    if (canvas && typeof globalThis.Chart === 'function' && empPoints.length) {
      modelsTrendChart = new globalThis.Chart(canvas, {
        type: 'line',
        data: {
          labels: empResolved.series.map(p => p.date),
          datasets: [
            {
              label: `${empInd.title} (${empInd.unit})`,
              data: empResolved.series.map(p => p.value),
              borderColor: '#1864ea',
              backgroundColor: 'rgba(24,100,234,0.14)',
              borderWidth: 2.2,
              spanGaps: false,
              fill: true,
              tension: 0.24,
              pointRadius: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // Bind events
    host.querySelectorAll('[data-mod-select]').forEach(btn => {
      btn.addEventListener('click', () => {
        modelsState.selectedModelId = btn.dataset.modSelect;
        renderModelosView();
      });
    });
    const bindModelControl = (sel, key) => {
      const el = host.querySelector(sel);
      if (!el) return;
      const onUpdate = e => {
        modelsState[key] = Number(e.target.value);
        refreshModelDiagram(activeModel);
      };
      el.addEventListener('input', onUpdate);
      el.addEventListener('change', onUpdate);
    };
    bindModelControl('#modAsadG', 'asadG');
    bindModelControl('#modIslmM', 'islmM');
    bindModelControl('#modAsadZ', 'asadZ');
    bindModelControl('#modSdD', 'sdDemand');
    bindModelControl('#modSdTax', 'sdTax');
    host.querySelectorAll('[data-mod-shift]').forEach(btn => {
      btn.addEventListener('click', () => {
        modelsState.conceptualShift = Number(btn.dataset.modShift);
        refreshModelDiagram(activeModel);
      });
    });
    host.querySelector('#modEmpiricalCountry')?.addEventListener('change', e => {
      modelsState.country = e.target.value;
      renderModelosView();
    });
    refreshModelDiagram(activeModel);
  }

  /* ==========================================================================
     SECCIÓN TRANSVERSAL — OBSERVATORIO DEL PERÚ (#observatorio, Ref 4.png)
     ========================================================================== */
  const obsState = {
    tab: 'resumen',
    benchmark: 'LCN'
  };
  let obsCharts = [];

  function renderObservatorioView() {
    const host = document.getElementById('observatorio');
    if (!host) return;
    const ipc = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'PN01273PM'), 'PER');
    const rate = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'PD04722MM'), 'PER');
    const rin = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'PN00027MM'), 'PER');
    const fx = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'PN01207PM'), 'PER');
    const gdpQ = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'PN02507AQ'), 'PER');
    const gdpA = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'NY.GDP.MKTP.KD.ZG'), 'PER');
    const unemp = M.resolveIndicatorSeries(M.INDICATORS_CATALOG.find(i => i.id === 'SL.UEM.TOTL.ZS'), 'PER');
    const useLiveQuarterlyGdp = gdpQ.status === 'live';

    const { latest: ipcLast } = M.getLatestObservationSummary(ipc.series, 'Mensual');
    const ipcReadingSummary = ipcLast
      ? ipcLast.value > 3
        ? `En ${ipcLast.date}, la inflación interanual (${fmtNum(ipcLast.value, 2)}%) se ubica por encima del rango meta del BCRP (1% – 3%), acompañada de una sólida posición de reservas internacionales.`
        : ipcLast.value < 1
          ? `En ${ipcLast.date}, la inflación interanual (${fmtNum(ipcLast.value, 2)}%) se ubica por debajo del rango meta del BCRP (1% – 3%), acompañada de una sólida posición de reservas internacionales.`
          : `En ${ipcLast.date}, la inflación interanual (${fmtNum(ipcLast.value, 2)}%) se ubica dentro del rango meta del BCRP (1% – 3%), acompañada de una sólida posición de reservas internacionales.`
      : 'Seguimiento de inflación frente al rango meta del BCRP (1% – 3%) y posición de reservas internacionales.';

    const kpis = [
      { id: 'ipc', title: 'Inflación interanual (IPC)', sub: 'Var. % 12 meses · Meta BCRP 1%-3%', unit: '%', freq: 'Mensual', data: ipc },
      { id: 'rate', title: 'Tasa de referencia BCRP', sub: 'Política monetaria · BCRP', unit: '%', freq: 'Mensual', data: rate },
      { id: 'rin', title: 'Reservas internacionales netas', sub: 'Millones de US$ · BCRP', unit: 'mill. US$', freq: 'Mensual', data: rin, dec: 0 },
      { id: 'fx', title: 'Tipo de cambio interbancario', sub: 'S/ por US$ (venta promedio)', unit: 'S/', freq: 'Mensual', data: fx, dec: 3 },
      {
        id: 'gdp',
        title: useLiveQuarterlyGdp ? 'PBI real trimestral' : 'Crecimiento del PBI real',
        sub: useLiveQuarterlyGdp ? 'Var. % interanual · BCRP' : 'Var. % anual · WDI (Banco Mundial)',
        unit: '%',
        freq: useLiveQuarterlyGdp ? 'Trimestral' : 'Anual',
        data: useLiveQuarterlyGdp ? gdpQ : gdpA
      },
      { id: 'unemp', title: 'Desempleo nacional (OIT)', sub: '% de la PEA · WDI / OIT anual', unit: '%', freq: 'Anual', data: unemp }
    ];

    host.innerHTML = `
      <div class="ms-exp-view">
        ${renderRibbonHTML('observatorio')}
        <header class="ms-exp-hero">
          <div class="ms-exp-hero-copy">
            <span class="ms-exp-icon" aria-hidden="true" style="font-size:24px;font-weight:800;color:#d91e36">🇵🇪</span>
            <div>
              <div class="ms-exp-eyebrow">SECCIÓN TRANSVERSAL · SEGUIMIENTO MACROECONÓMICO NACIONAL (BCRP / INEI / MEF / WDI)</div>
              <h1 id="obsTitle">Observatorio del Perú</h1>
              <p>Panel especializado para el monitoreo de indicadores macroeconómicos oficiales del Perú a nivel nacional, sin extrapolar cifras departamentales.</p>
            </div>
          </div>
          <div class="ms-exp-actions">
            <a class="ms-btn-secondary" href="#exploracion">Ir a Panorama global →</a>
            <button type="button" class="ms-btn-primary" id="obsExportBtn">Exportar reporte Perú CSV →</button>
          </div>
        </header>

        <div class="ms-filter-bar" role="region" aria-label="Filtros del Observatorio del Perú">
          <div class="ms-filter-field">
            <span class="ms-filter-label">Cobertura geográfica</span>
            <div class="ms-badge">Nacional (Series oficiales BCRP / INEI / OIT)</div>
          </div>
          <div class="ms-filter-field" style="grid-column:span 2">
            <span class="ms-filter-label">Enfoque del observatorio</span>
            <div class="ms-seg-group" role="tablist" aria-label="Áreas del Observatorio del Perú">
              ${[
                ['resumen', 'Resumen'],
                ['precios', 'Precios y Meta'],
                ['monetario', 'Monetario y RIN'],
                ['externo', 'Tipo de cambio'],
                ['actividad', 'Actividad y Empleo']
              ]
                .map(
                  ([k, label]) =>
                    `<button type="button" role="tab" class="ms-seg-btn" data-obs-tab="${k}" aria-selected="${
                      obsState.tab === k
                    }">${label}</button>`
                )
                .join('')}
            </div>
          </div>
        </div>

        <div class="obs-kpi-grid" aria-label="Seis indicadores principales del Perú">
          ${kpis
            .map(k => {
              const { latest: last, delta: d } = M.getLatestObservationSummary(k.data.series, k.freq);
              return `<article class="obs-kpi-card">
                <small style="font-weight:800;color:var(--exp-ink);font-size:11.5px">${esc(k.title)}</small>
                <small style="color:var(--exp-muted);font-size:10px">${esc(k.sub)}</small>
                <strong>${last ? fmtNum(last.value, k.dec ?? 2) : 'N/D'} <span style="font-size:11px;font-weight:700">${esc(
                  k.unit
                )}</span></strong>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto">
                  <small style="color:var(--exp-blue);font-weight:700">${esc(last?.date || 'N/D')}${
                    d !== null ? ` (${d >= 0 ? '+' : ''}${fmtNum(d, k.dec ?? 2)})` : ''
                  }</small>
                  ${makeSparkSvg(k.data.series.map(p => p.value), 74, 24)}
                </div>
              </article>`;
            })
            .join('')}
        </div>

        <div class="obs-analytics-grid">
          <article class="ms-panel">
            <div class="ms-panel-head">
              <div>
                <h2>Inflación e intervalo meta del BCRP (1% – 3%)</h2>
                <p>Variación interanual del IPC de Lima Metropolitana (PN01273PM)</p>
              </div>
            </div>
            <div class="obs-chart-wrap"><canvas id="obsChartIpc" role="img" aria-label="Inflación e intervalo meta del BCRP"></canvas></div>
          </article>

          <article class="ms-panel">
            <div class="ms-panel-head">
              <div>
                <h2>Tasa de referencia del BCRP</h2>
                <p>Tasa de interés de política monetaria en % anual (PD04722MM)</p>
              </div>
            </div>
            <div class="obs-chart-wrap"><canvas id="obsChartRate" role="img" aria-label="Tasa de referencia del BCRP"></canvas></div>
          </article>

          <aside class="ms-panel obs-reading-panel" aria-labelledby="obsReadingTitle">
            <div class="ms-panel-head">
              <div>
                <h2 id="obsReadingTitle">Lectura del observatorio</h2>
                <p>Síntesis basada en series oficiales peruanas</p>
              </div>
            </div>
            <div style="padding:12px;border-radius:14px;background:var(--exp-soft);border:1px solid var(--exp-stroke);margin-bottom:12px;font-size:12px;font-weight:700;color:var(--exp-blue)">
              ${esc(ipcReadingSummary)}
            </div>
            <div style="display:grid;gap:10px;font-size:11.5px;line-height:1.5">
              <div><strong>1. Inflación y meta explícita:</strong> El BCRP conduce la política monetaria para mantener la inflación interanual en 2% ± 1 p.p. (${esc(
                ipc.provenance
              )}).</div>
              <div><strong>2. Posición externa sólida:</strong> Las Reservas Internacionales Netas (PN00027MM) constituyen el principal amortiguador frente a la volatilidad financiera internacional.</div>
              <div><strong>3. Flotación administrada:</strong> El tipo de cambio interbancario (PN01207PM) refleja condiciones de oferta y demanda con intervenciones para moderar volatilidad extrema.</div>
              <div><strong>4. Nota metodológica:</strong> No se muestran desagregaciones departamentales no verificadas en línea; todas las series corresponden al agregado nacional o Lima Metropolitana según definición oficial.</div>
            </div>
          </aside>

          <article class="ms-panel">
            <div class="ms-panel-head">
              <div>
                <h2>Reservas Internacionales Netas (RIN)</h2>
                <p>Saldo en millones de US$ (PN00027MM · BCRP)</p>
              </div>
            </div>
            <div class="obs-chart-wrap"><canvas id="obsChartRin" role="img" aria-label="Reservas Internacionales Netas del Perú"></canvas></div>
          </article>

          <article class="ms-panel">
            <div class="ms-panel-head">
              <div>
                <h2>Tipo de cambio interbancario</h2>
                <p>Soles por dólar estadounidense (PN01207PM · BCRP)</p>
              </div>
            </div>
            <div class="obs-chart-wrap"><canvas id="obsChartFx" role="img" aria-label="Tipo de cambio interbancario del Perú"></canvas></div>
          </article>
        </div>

        <div class="obs-bottom-grid">
          <article class="ms-panel">
            <div class="ms-panel-head"><h2>Calendario y frecuencias de publicación</h2></div>
            <div style="display:grid;gap:8px;font-size:11.5px">
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:10px;background:var(--exp-soft)"><span><strong>Programa Monetario (Tasa)</strong> · BCRP</span><span>Mensual (2.º jueves)</span></div>
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:10px;background:var(--exp-soft)"><span><strong>IPC Lima Metropolitana</strong> · INEI / BCRP</span><span>Mensual (día 1)</span></div>
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:10px;background:var(--exp-soft)"><span><strong>Nota Semanal</strong> · BCRP</span><span>Semanal (jueves)</span></div>
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:10px;background:var(--exp-soft)"><span><strong>Reporte de Inflación</strong> · BCRP</span><span>Trimestral (mar/jun/sep/dic)</span></div>
            </div>
          </article>

          <article class="ms-panel">
            <div class="ms-panel-head"><h2>Publicaciones oficiales del Perú</h2></div>
            <div style="display:grid;gap:8px;font-size:11.5px">
              <a class="ms-btn-secondary" href="https://www.bcrp.gob.pe/publicaciones/reporte-de-inflacion.html" target="_blank" rel="noopener">Reporte de Inflación · BCRP ↗</a>
              <a class="ms-btn-secondary" href="https://www.bcrp.gob.pe/publicaciones/nota-semanal.html" target="_blank" rel="noopener">Nota Semanal · BCRP ↗</a>
              <a class="ms-btn-secondary" href="https://www.mef.gob.pe/es/marco-macroeconomico" target="_blank" rel="noopener">Marco Macroeconómico Multianual · MEF ↗</a>
            </div>
          </article>

          <article class="ms-panel">
            <div class="ms-panel-head"><h2>Resumen de series oficiales peruanas</h2></div>
            <div style="display:grid;gap:6px;font-size:11.5px">
              ${kpis
                .slice(0, 5)
                .map(k => {
                  const { latest: last } = M.getLatestObservationSummary(k.data.series, k.freq);
                  return `<div style="display:flex;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--exp-stroke)">
                    <span><strong>${esc(k.title)}</strong></span>
                    <span>${last ? fmtNum(last.value, k.dec ?? 2) + ' ' + esc(k.unit) : 'N/D'} (${esc(last?.date || '')})</span>
                  </div>`;
                })
                .join('')}
            </div>
          </article>
        </div>
      </div>
    `;

    obsCharts.forEach(c => c?.destroy());
    obsCharts = [];
    if (typeof globalThis.Chart === 'function') {
      const drawObs = (id, type, pts, label, color, bands = false) => {
        const el = host.querySelector('#' + id);
        if (!el || !pts.length) return;
        const datasets = [
          {
            label,
            data: pts.map(p => p.value),
            borderColor: color,
            backgroundColor: type === 'bar' ? 'rgba(40,123,241,0.62)' : 'rgba(24,100,234,0.14)',
            borderWidth: 2.2,
            spanGaps: false,
            fill: type === 'line',
            tension: 0.22,
            pointRadius: 2
          }
        ];
        if (bands) {
          datasets.push(
            { label: 'Límite superior meta (3%)', data: pts.map(() => 3), borderColor: '#78a9f5', borderDash: [4, 4], borderWidth: 1.2, pointRadius: 0, fill: false },
            { label: 'Límite inferior meta (1%)', data: pts.map(() => 1), borderColor: '#78a9f5', borderDash: [4, 4], borderWidth: 1.2, pointRadius: 0, fill: false }
          );
        }
        obsCharts.push(
          new globalThis.Chart(el, {
            type,
            data: { labels: pts.map(p => p.date), datasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          })
        );
      };
      drawObs('obsChartIpc', 'line', ipc.series, 'Inflación (%)', '#1864ea', true);
      drawObs('obsChartRate', 'line', rate.series, 'Tasa de referencia (%)', '#0d3b8c');
      drawObs('obsChartRin', 'bar', rin.series, 'RIN (millones US$)', '#297bf4');
      drawObs('obsChartFx', 'line', fx.series, 'Tipo de cambio (S/ por US$)', '#007a70');
    }

    host.querySelectorAll('[data-obs-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        obsState.tab = btn.dataset.obsTab;
        renderObservatorioView();
      });
    });
    host.querySelector('#obsExportBtn')?.addEventListener('click', () => {
      const header = '"serie_codigo","indicador","periodo","valor","unidad","procedencia"';
      const rows = kpis.flatMap(k =>
        k.data.series.map(p => `"${k.id}","${k.title}","${p.date}","${p.value}","${k.unit}","${p.source}"`)
      );
      downloadCsvFile('macroscope-observatorio-peru.csv', [header, ...rows].join('\r\n'));
    });
  }

  /* ==========================================================================
     MEJORAS DE NAVEGACIÓN Y GUARDADO DE ESCENARIOS EN VISTAS EXISTENTES
     ========================================================================== */
  const SAVED_SCENARIOS_KEY = 'macroscope_saved_scenarios_v1';

  function isValidSavedScenario(item) {
    if (!item || typeof item !== 'object' || typeof item.name !== 'string') return false;
    const cfg = item.config && typeof item.config === 'object' ? item.config : item;
    if (!['closed', 'flex', 'fixed'].includes(cfg.regime)) return false;
    if (!['low', 'high', 'perfect'].includes(cfg.mobility)) return false;
    if (!['money', 'rate'].includes(cfg.instrument)) return false;
    if (!item.params || typeof item.params !== 'object' || Array.isArray(item.params)) return false;
    if (!item.u || typeof item.u !== 'object' || Array.isArray(item.u)) return false;
    return true;
  }

  function loadSavedScenarios() {
    try {
      const raw = localStorage.getItem(SAVED_SCENARIOS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(isValidSavedScenario) : [];
    } catch (_) {
      return [];
    }
  }

  function saveScenarioList(list) {
    try {
      localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify((list || []).filter(isValidSavedScenario)));
    } catch (_) {}
  }

  function setupSimulatorScenarioSaver() {
    const simSection = document.getElementById('tab-simulator');
    if (!simSection || document.getElementById('simSavedScenariosPanel')) return;
    const panel = document.createElement('article');
    panel.id = 'simSavedScenariosPanel';
    panel.className = 'surface soft-panel';
    simSection.insertBefore(panel, simSection.querySelector('.sim-disclaimer'));
    renderSimulatorScenarioSaver();
  }

  function renderSimulatorScenarioSaver() {
    const panel = document.getElementById('simSavedScenariosPanel');
    if (!panel) return;
    const saved = loadSavedScenarios();
    panel.innerHTML = `
      <div class="card-top" style="flex-wrap:wrap">
        <div>
          <h3>Guardado local de escenarios y conexión con Modelos</h3>
          <p>Conserva configuraciones personalizadas del simulador IS–LM–BP en este navegador para compararlas o retomarlas.</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="control-action primary" id="simSaveCurrentBtn">Guardar escenario actual →</button>
          <a class="control-action" href="#modelos">Biblioteca de modelos →</a>
          <a class="control-action" href="#aprendizaje">Aprendizaje guiado →</a>
        </div>
      </div>
      <div class="sim-saved-chips" id="simSavedList">
        ${
          saved.length
            ? saved
                .map(
                  (item, idx) =>
                    `<div class="ms-badge" style="gap:8px;padding:6px 12px">
                      <button type="button" class="control-action" data-load-sim="${idx}">Cargar: ${esc(
                        item.name
                      )} (${esc(item.config?.country || item.country || 'PER')} · ${esc(
                        item.config?.regime || item.regime
                      )} · Y=${esc(item.Y)})</button>
                      <button type="button" class="control-action" data-del-sim="${idx}" aria-label="Eliminar escenario ${esc(
                        item.name
                      )}">✕</button>
                    </div>`
                )
                .join('')
            : '<span class="data-note">Aún no has guardado escenarios personalizados en esta sesión. Pulsa «Guardar escenario actual» para registrar tu experimento.</span>'
        }
      </div>
    `;

    panel.querySelector('#simSaveCurrentBtn')?.addEventListener('click', () => {
      const snap = M.labs?.islm?.snapshot?.();
      if (!snap) return;
      const country = snap.config?.country || M.state?.country || 'PER';
      const E2 = snap.E2 || snap.model.solve(snap.u, 'final');
      const list = loadSavedScenarios();
      const name = `Escenario #${list.length + 1} (${country})`;
      list.push({
        name,
        country,
        regime: snap.config.regime,
        mobility: snap.config.mobility,
        instrument: snap.config.instrument,
        config: {
          country,
          regime: snap.config.regime,
          mobility: snap.config.mobility,
          instrument: snap.config.instrument
        },
        params: { ...snap.params },
        u: { ...snap.u },
        mTouched: Boolean(snap.mTouched),
        Y: E2.Y.toFixed(1),
        i: E2.i.toFixed(1)
      });
      saveScenarioList(list.slice(-6));
      M.showToast?.('Escenario guardado localmente');
      renderSimulatorScenarioSaver();
    });

    panel.querySelectorAll('[data-load-sim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.loadSim);
        const item = loadSavedScenarios()[idx];
        if (!item) return;
        M.labs?.islm?.restore?.(item);
        M.showToast?.(`Cargado: ${item.name}`);
      });
    });

    panel.querySelectorAll('[data-del-sim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.delSim);
        const list = loadSavedScenarios().filter((_, i) => i !== idx);
        saveScenarioList(list);
        renderSimulatorScenarioSaver();
      });
    });
  }

  function enhanceCrossModuleLinks() {
    // Añade enlaces de conexión entre módulos en Panorama sin alterar las grillas medidas en e2e
    const detailIntro = document.querySelector('#tab-overview .p-detail-intro');
    if (detailIntro && !detailIntro.querySelector('.ms-cross-links')) {
      const nav = document.createElement('div');
      nav.className = 'ms-cross-links';
      nav.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
      nav.innerHTML = `
        <a class="ms-btn-secondary" href="#indicadores">Catálogo de indicadores →</a>
        <a class="ms-btn-secondary" href="#historico">Análisis histórico →</a>
        <a class="ms-btn-secondary" href="#comparacion">Comparar economías →</a>
        <a class="ms-btn-secondary" href="#observatorio">Observatorio del Perú →</a>
      `;
      detailIntro.appendChild(nav);
    }
  }

  function applyExperienceQuery(view, params) {
    if (!params) return;
    if (view === 'indicadores' && params.get('id')) {
      indicatorsState.selectedId = params.get('id');
      renderIndicadoresView();
    } else if (view === 'historico' && params.get('indicator')) {
      historyState.indicatorId = params.get('indicator');
      renderHistoricoView();
    } else if (view === 'modelos' && params.get('model')) {
      modelsState.selectedModelId = params.get('model');
      renderModelosView();
    } else if (view === 'aprendizaje' && params.get('route')) {
      learningState.routeId = params.get('route');
      renderAprendizajeView();
    }
  }

  function renderAllExperiences() {
    if (!document.getElementById('aprendizaje')?.querySelector('#apDiagramContainer')) {
      renderAprendizajeView();
    }
    renderHistoricoView();
    renderIndicadoresView();
    if (!document.getElementById('modelos')?.querySelector('#modSvgContainer')) {
      renderModelosView();
    } else if (modelsTrendChart?.data?.datasets?.[0] && typeof modelsTrendChart.update === 'function') {
      const library = M.MODELS_LIBRARY || [];
      const activeModel = library.find(m => m.id === modelsState.selectedModelId) || library[0];
      const empInd = (M.INDICATORS_CATALOG || []).find(i => i.id === activeModel?.empiricalIndicator) || M.INDICATORS_CATALOG?.[0];
      if (empInd) {
        const empResolved = M.resolveIndicatorSeries(empInd, modelsState.country);
        modelsTrendChart.data.labels = empResolved.series.map(p => p.date);
        modelsTrendChart.data.datasets[0].data = empResolved.series.map(p => p.value);
        modelsTrendChart.update('none');
      }
    }
    renderObservatorioView();
    renderSimulatorScenarioSaver();
  }

  function setupExperiences() {
    loadLearningProgress();
    setupSimulatorScenarioSaver();
    enhanceCrossModuleLinks();
    renderAllExperiences();
  }

  Object.assign(M, {
    EXP_ROUTES,
    setupExperiences,
    renderAllExperiences,
    applyExperienceQuery,
    renderAprendizajeView,
    renderHistoricoView,
    renderIndicadoresView,
    renderModelosView,
    renderObservatorioView
  });
})();
