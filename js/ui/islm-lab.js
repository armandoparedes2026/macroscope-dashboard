(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { COUNTRIES, INFLATION_TARGETS, ISLM_COUNTRY, FALLBACK_EXTRACTED_AT, cellSource, state, wdiFetchedAt } = M;
  const ISLM = M.ISLM = globalThis.ISLM;
  // Resolve cross-view callbacks when invoked, after every deferred script has loaded.
  const axisRange = (...args) => M.axisRange(...args);
  const drawDiagram = (...args) => M.drawDiagram(...args);
  const fmtNum = (...args) => M.fmtNum(...args);
  const fmtSigned = (...args) => M.fmtSigned(...args);
  const formatValue = (...args) => M.formatValue(...args);
  const getLatestYearAndValue = (...args) => M.getLatestYearAndValue(...args);
  const sameLine = (...args) => M.sameLine(...args);
  const showToast = (...args) => M.showToast(...args);
  const updateRangeStyles = (...args) => M.updateRangeStyles(...args);
    const SOURCE_LABELS = {observed:'Dato observado',calibrated:'Parámetro calibrado',assumption:'Supuesto teórico',illustrative:'Valor ilustrativo',result:'Resultado del modelo'};
    const ISLM_FOREIGN_RATE = 3; // reference international rate (assumption)
    // Round first so tiny residuals never print as "-0.0"/"+0.0"; use a true minus sign.
    const ISLM_INPUTS = [
      { key: 'G', group: 'policy', tag: 'Política fiscal', label: 'Gasto público (G)', min: 10, max: 30, step: 0.5, fmt: v => fmtNum(v), help: 'Desplaza la IS. Inicial: 18 (% del producto).' },
      { key: 'T0', group: 'policy', tag: 'Política fiscal', label: 'Impuestos autónomos (ΔT)', min: -5, max: 5, step: 0.5, fmt: v => fmtSigned(v), help: 'Más impuestos reducen el ingreso disponible y el consumo: IS a la izquierda.' },
      { key: 'Mpct', group: 'policy', tag: 'Política monetaria', label: 'Oferta monetaria (ΔM/M)', min: -20, max: 20, step: 1, fmt: v => `${fmtSigned(v, 0)}%`, help: 'Desplaza la LM (y la LM* en Mundell–Fleming).' },
      { key: 'ipol', group: 'policy', tag: 'Política monetaria', label: 'Tasa de interés de política (i)', min: 0, max: 15, step: 0.25, fmt: v => `${fmtNum(v, 2)}%`, help: 'Regla de tasa: el banco central fija i y suministra el dinero que se demande.' },
      { key: 'ebar', group: 'policy', tag: 'Política cambiaria', label: 'Tipo de cambio fijado (ē)', min: 80, max: 130, step: 1, fmt: v => fmtNum(v, 0), help: 'Subir ē es devaluar (100 = paridad inicial).' },
      { key: 'istar', group: 'external', tag: 'Externo', label: 'Tasa de interés internacional (i*)', min: 0, max: 10, step: 0.25, fmt: v => `${fmtNum(v, 2)}%`, help: 'La fija el resto del mundo (p. ej., la Reserva Federal). Desplaza la BP.' },
      { key: 'rho', group: 'external', tag: 'Externo / mercados', label: 'Prima de riesgo país y depreciación esperada (ρ)', min: 0, max: 10, step: 0.25, fmt: v => `${fmtNum(v, 2)} pp`, help: 'Rendimiento extra que exigen los inversionistas; sube con la incertidumbre.' },
      { key: 'Ystar', group: 'external', tag: 'Externo', label: 'Ingreso mundial (Y*)', min: 85, max: 115, step: 1, fmt: v => fmtNum(v, 0), help: 'Demanda externa por exportaciones (índice, 100 = inicial).' },
      { key: 'nxShock', group: 'external', tag: 'Externo', label: 'Términos de intercambio (Δ NX autónomas)', min: -6, max: 6, step: 0.5, fmt: v => fmtSigned(v), help: 'Precios de exportación (cobre, oro, petróleo): desplaza IS y BP.' },
      { key: 'confShock', group: 'external', tag: 'Sector privado', label: 'Confianza privada (Δ C e I autónomos)', min: -6, max: 6, step: 0.5, fmt: v => fmtSigned(v), help: 'Expectativas de hogares y empresas: desplaza la IS.' },
      { key: 'c', group: 'param', label: 'Propensión marginal a consumir (c)', min: 0.5, max: 0.9, step: 0.01, fmt: v => fmtNum(v, 2), help: 'Mayor c → mayor multiplicador y una IS más plana.' },
      { key: 't', group: 'param', label: 'Tasa impositiva (t)', min: 0.1, max: 0.4, step: 0.01, fmt: v => fmtNum(v, 2), help: 'Estabilizador automático: reduce el multiplicador.' },
      { key: 'b', group: 'param', label: 'Sensibilidad de la inversión a i (b)', min: 0.5, max: 4, step: 0.1, fmt: v => fmtNum(v), help: 'Mayor b → IS más plana y más crowding out.' },
      { key: 'h', group: 'param', label: 'Sensibilidad de la demanda de dinero a i (h)', min: 0.5, max: 4, step: 0.1, fmt: v => fmtNum(v), help: 'Mayor h → LM más plana (hacia la trampa de liquidez).' },
      { key: 'm', group: 'param', label: 'Propensión marginal a importar (m)', min: 0, max: 0.5, step: 0.01, fmt: v => fmtNum(v, 2), help: 'Aproximación: propensión media × elasticidad-ingreso supuesta = 1; no es una estimación.' },
      { key: 'n', group: 'param', label: 'Sensibilidad de NX al tipo de cambio (n)', min: 0.05, max: 0.5, step: 0.01, fmt: v => fmtNum(v, 2), help: 'Condición de Marshall–Lerner: una depreciación mejora NX.' }
    ];
    const ISLM_PRESETS = [
      { id: 'fiscal', label: 'Expansión fiscal', patch: u0 => ({ G: u0.G + 3 }) },
      { id: 'monetary', label: 'Expansión monetaria', requires: 'monetary', patch: u0 => islm.instrument === 'rate' ? { ipol: Math.max(0, u0.ipol - 1.5) } : { Mpct: 10 } },
      { id: 'fed', label: 'Alza de la Fed (↑i*)', requires: 'open', patch: u0 => ({ istar: u0.istar + 2 }) },
      { id: 'risk', label: 'Aumento del riesgo país (↑ρ)', requires: 'open', patch: u0 => ({ rho: u0.rho + 2 }) },
      { id: 'commodity', label: 'Caída de precios de exportación', requires: 'open', patch: () => ({ nxShock: -3 }) },
      { id: 'world', label: 'Recesión mundial (↓Y*)', requires: 'open', patch: u0 => ({ Ystar: u0.Ystar - 8 }) },
      { id: 'confidence', label: 'Caída de la confianza', patch: () => ({ confShock: -3 }) },
      { id: 'devaluation', label: 'Devaluación (↑ē)', requires: 'fixed', patch: u0 => ({ ebar: u0.ebar + 10 }) }
    ];
    const islm = { regime: 'flex', mobility: 'high', instrument: 'money', params: { ...ISLM.DEFAULT_PARAMS }, u: null, model: null, country: null, mTouched: false, notes: [] };

    function islmCalibrationData() {
      const exp = getLatestYearAndValue(state.country, 'NE.EXP.GNFS.ZS');
      const imp = getLatestYearAndValue(state.country, 'NE.IMP.GNFS.ZS');
      const nx = getLatestYearAndValue(state.country, 'NE.RSB.GNFS.ZS');
      const cab = getLatestYearAndValue(state.country, 'BN.CAB.XOKA.GD.ZS');
      const target = INFLATION_TARGETS[state.country];
      const i0 = (target ? target.center : 3) + (ISLM_COUNTRY[state.country]?.neutralReal ?? 1.5);
      return { exp, imp, nx, cab, target, i0 };
    }
    function islmDisabledReason(def) {
      const open = islm.regime !== 'closed';
      switch (def.key) {
        case 'Mpct': return islm.regime !== 'fixed' && islm.instrument === 'money'
          ? '' : islm.regime === 'fixed' ? 'Endógena con tipo de cambio fijo: el banco central compra o vende divisas para sostener ē.' : 'Con regla de tasa, M se ajusta a la demanda de dinero (es endógena).';
        case 'ipol': return islm.instrument === 'rate' && islm.regime !== 'fixed'
          ? '' : 'Elige «Tasa de interés de política» como instrumento (no disponible con tipo de cambio fijo ni con flotación y movilidad perfecta).';
        case 'ebar': return islm.regime === 'fixed' ? '' : 'Solo con tipo de cambio fijo: en flotación, e lo determina el mercado.';
        case 'istar': case 'rho': case 'Ystar': case 'nxShock': case 'm': case 'n':
          return open ? '' : 'No aplica en una economía cerrada.';
        default: return '';
      }
    }
    function islmBuildModel() {
      const { config, notes } = ISLM.normalizeConfig({ regime: islm.regime, mobility: islm.mobility, instrument: islm.instrument });
      islm.instrument = config.instrument;
      islm.notes = notes;
      const { cab, nx, i0 } = islmCalibrationData();
      islm.model = ISLM.createModel({ ...config, params: islm.params, i0, nx0: nx.value, cab: cab.value, istar0: Math.min(ISLM_FOREIGN_RATE, i0) });
      if (!islm.u) islm.u = { ...islm.model.baseline };
      // Inputs that are not instruments under the current regime go back to baseline so the display never lies.
      ISLM_INPUTS.filter(d => d.group !== 'param' && islmDisabledReason(d)).forEach(d => { islm.u[d.key] = islm.model.baseline[d.key]; });
    }
    const islmCalibrationKey = () => JSON.stringify([state.country, islmCalibrationData()]);
    /** Re-calibrates when the country or its data change. */
    function islmSyncCountry() {
      const { imp } = islmCalibrationData();
      islm.calKey = islmCalibrationKey();
      const dataM = ISLM.importPropensityFromShare(imp.value) ?? ISLM.DEFAULT_PARAMS.m;
      if (islm.country !== state.country) {
        islm.country = state.country;
        islm.params = { ...ISLM.DEFAULT_PARAMS, m: dataM };
        islm.mTouched = false;
        islm.u = null;
      } else if (!islm.mTouched) {
        islm.params.m = dataM;
      }
      islmBuildModel();
    }
    function renderIslmInputs() {
      const groups = { policy: 'islmPolicyInputs', external: 'islmExternalInputs', param: 'islmParamInputs' };
      Object.entries(groups).forEach(([group, id]) => {
        const node = document.getElementById(id);
        if (!node || node.childElementCount) return;
        node.innerHTML = ISLM_INPUTS.filter(d => d.group === group).map(d => {
          const inputId = group === 'param' ? `islm-p-${d.key}` : `islm-${d.key}`;
          const tag = d.tag ? `<span class="islm-tag ${group === 'policy' ? 'control' : 'external'}">${d.tag}</span>` : '';
          return `<div class="sim-field islm-field" data-key="${d.key}"><div class="sim-label"><label for="${inputId}">${d.label}</label><output class="sim-value" id="${inputId}-val" for="${inputId}"></output></div><input class="sim-range" id="${inputId}" type="range" min="${d.min}" max="${d.max}" step="${d.step}"><div class="sim-hint">${tag} <span class="islm-hint-text">${d.help} · <span class="islm-source-kind">${SOURCE_LABELS[ISLM.PARAM_SOURCES[d.key]] || (d.group==='param'?'Valor ilustrativo':'Supuesto teórico')}</span></span></div></div>`;
        }).join('');
        node.querySelectorAll('input').forEach(input => input.addEventListener('input', () => {
          const key = input.closest('.islm-field').dataset.key;
          const def = ISLM_INPUTS.find(d => d.key === key);
          if (def.group === 'param') {
            islm.params[key] = Number(input.value);
            if (key === 'm') islm.mTouched = true;
            islmBuildModel();
          } else {
            islm.u[key] = Number(input.value);
          }
          renderIslm();
        }));
      });
      const presets = document.getElementById('islmPresets');
      if (presets && !presets.childElementCount) {
        presets.innerHTML = ISLM_PRESETS.map(p => `<button type="button" class="islm-preset" data-preset="${p.id}">${p.label}</button>`).join('');
        presets.addEventListener('click', e => {
          const btn = e.target.closest('.islm-preset');
          if (!btn || btn.disabled) return;
          const preset = ISLM_PRESETS.find(p => p.id === btn.dataset.preset);
          islm.u = { ...islm.model.baseline, ...preset.patch(islm.model.baseline) };
          renderIslm();
        });
      }
    }
    function syncIslmControls() {
      const mKind=document.querySelector('[data-key="m"] .islm-source-kind');
      if(mKind)mKind.textContent=!islm.mTouched&&Number.isFinite(islmCalibrationData().imp.value)?SOURCE_LABELS.calibrated:SOURCE_LABELS[ISLM.PARAM_SOURCES.m];
      const m = islm.model;
      document.getElementById('islmRegime').value = islm.regime;
      document.getElementById('islmMobility').value = islm.mobility;
      document.getElementById('islmMobility').disabled = islm.regime === 'closed';
      const instrument = document.getElementById('islmInstrument');
      const allowed = ISLM.availableInstruments(islm.regime, islm.mobility);
      [...instrument.options].forEach(opt => { opt.disabled = islm.regime !== 'closed' && !allowed.includes(opt.value); });
      instrument.disabled = islm.regime === 'fixed';
      instrument.value = islm.instrument;
      ISLM_INPUTS.forEach(d => {
        const isParam = d.group === 'param';
        const input = document.getElementById(isParam ? `islm-p-${d.key}` : `islm-${d.key}`);
        if (!input) return;
        const value = isParam ? islm.params[d.key] : islm.u[d.key];
        if (Number(input.value) !== value) input.value = value;
        document.getElementById(`${input.id}-val`).textContent = d.fmt(value);
        const reason = islmDisabledReason(d);
        input.disabled = Boolean(reason);
        const field = input.closest('.islm-field');
        field.classList.toggle('is-disabled', Boolean(reason));
        field.querySelector('.islm-hint-text').textContent = reason || (d.key === 'ipol' ? `${d.help} Neutral supuesta: ${fmtNum(m.baseline.ipol, 2)}%.` : d.help);
      });
      document.querySelectorAll('.islm-preset').forEach(btn => {
        const preset = ISLM_PRESETS.find(p => p.id === btn.dataset.preset);
        const blocked = preset.requires === 'open' && islm.regime === 'closed'
          ? 'Requiere una economía abierta.'
          : preset.requires === 'fixed' && islm.regime !== 'fixed' ? 'Requiere tipo de cambio fijo.'
          : preset.requires === 'monetary' && islm.regime === 'fixed' ? 'Con tipo de cambio fijo no hay política monetaria autónoma (trilema).' : '';
        btn.disabled = Boolean(blocked);
        btn.title = blocked;
      });
      updateRangeStyles();
    }
    function islmRegimeText() {
      const parts = [];
      if (islm.regime === 'closed') parts.push('Economía cerrada: sin comercio ni flujos de capital. El banco central elige su instrumento (M o i); la política fiscal desplaza la IS.');
      if (islm.regime === 'flex') parts.push(islm.mobility === 'perfect'
        ? 'Flotación con movilidad perfecta (Mundell–Fleming clásico): la tasa doméstica queda anclada en i* + ρ y el ajuste recae en el tipo de cambio. El banco central conserva autonomía para mover M.'
        : 'Flotación: el banco central conserva autonomía monetaria y el tipo de cambio se ajusta para equilibrar la balanza de pagos.');
      if (islm.regime === 'fixed') parts.push(islm.mobility === 'none'
        ? 'Tipo de cambio fijo sin movilidad de capital: el producto queda restringido por el equilibrio de la balanza comercial; M y las reservas son endógenas.'
        : 'Tipo de cambio fijo con movilidad de capital: trilema de Mundell. El banco central renuncia a la política monetaria; M y las reservas se ajustan para defender ē.');
      parts.push(...islm.notes);
      if (islm.regime !== 'closed' && ISLM_COUNTRY[state.country]) parts.push(ISLM_COUNTRY[state.country].note);
      return parts.join(' ');
    }

    // --- Results, multipliers, narrative and classification ------------------------------------
    function islmFmtKF(v) {
      if (v === null) return '—';
      if (v === Infinity) return '+∞ (entrada)';
      if (v === -Infinity) return '−∞ (salida)';
      return fmtNum(v);
    }
    function renderIslmResults(E0, E1, E2) {
      const open = islm.model.open;
      const comparison = ISLM.compareEquilibria(E0,E2);
      const rows = [
        ['Y', 'Producto (Y)', r => r.Y, 1],
        ['i', 'Tasa de interés (i, %)', r => r.i, 2],
        ...(open ? [['e', 'Tipo de cambio (e)', r => r.e, 1]] : []),
        ['M', islm.regime === 'fixed' ? 'Oferta monetaria (M/P) · reservas' : 'Oferta monetaria (M/P)', r => r.M, 1],
        ['C', 'Consumo (C)', r => r.C, 1],
        ['I', 'Inversión (I)', r => r.I, 1],
        ['G', 'Gasto público (G)', r => r.G, 1],
        ...(open ? [['NX', 'NX (bienes y servicios)', r => r.NX, 1], ['NFI','Renta primaria y secundaria neta (NFI)',r=>r.NFI,1], ['CA','Cuenta corriente (CA)',r=>r.CA,1], ['KF', 'Flujos de capital (KF)', r => r.KF, 1, true], ['BP', 'Saldo de balanza de pagos', r => r.BP, 1, true]] : [])
      ];
      document.getElementById('islmResults').innerHTML = rows.map(([key, label, get, d, special]) => {
        const v0 = get(E0), v1 = get(E1), v2 = get(E2);
        const f = v => special ? islmFmtKF(v) : fmtNum(v, d);
        const delta = ['Y','e','M'].includes(key) ? comparison[key].pct : comparison[key]?.abs ?? (Number.isFinite(v0) && Number.isFinite(v2) ? v2-v0 : null);
        const unit = key==='i'?' pp':['Y','e','M'].includes(key)?' %':' puntos de Y₀';
        const cls = key === 'Y' && delta !== null && Math.abs(delta) > 0.005 ? (delta > 0 ? 'positive' : 'negative') : '';
        return `<tr data-var="${key}"><td>${label}<small style="display:block">Resultado del modelo</small></td><td class="v0">${f(v0)}</td><td class="v1">${f(v1)}</td><td class="v2">${f(v2)}</td><td class="dv ${cls}">${delta === null ? '—' : fmtSigned(delta, d)+unit}</td></tr>`;
      }).join('');
    }
    function renderIslmMultipliers() {
      const mult = islm.model.multipliers();
      const items = [
        ['Multiplicador fiscal efectivo', 'ΔY ante +1 de G', mult.fiscal],
        mult.monetary !== null ? ['Eficacia monetaria', islm.instrument === 'rate' ? 'ΔY ante −1 pp de tasa' : 'ΔY ante +1% de M', mult.monetary] : null,
        mult.devaluation !== null ? ['Eficacia de la devaluación', 'ΔY ante +1% de ē', mult.devaluation] : null,
        mult.foreignRate !== null ? ['Sensibilidad a i*', 'ΔY ante +1 pp de i*', mult.foreignRate] : null
      ].filter(Boolean);
      document.getElementById('islmMultipliers').innerHTML = items.map(([title, sub, v]) => `<div class="islm-mult" data-mult="${title}"><span>${title}</span><strong>${fmtSigned(v, 2)}</strong><span>${sub}</span></div>`).join('');
    }
    function islmShiftText(name, delta, unit = 'de Y a la tasa inicial') {
      if (!Number.isFinite(delta) || Math.abs(delta) < 0.005) return null;
      return `la ${name} se desplaza a la ${delta > 0 ? 'derecha' : 'izquierda'} (${fmtSigned(delta)} ${unit})`;
    }
    function islmNarrative(E0, E1, E2) {
      const m = islm.model, u = islm.u, u0 = m.baseline, open = m.open, steps = [];
      const changed = ISLM_INPUTS.filter(d => d.group !== 'param' && !islmDisabledReason(d) && Math.abs(u[d.key] - u0[d.key]) > 1e-9);
      if (!changed.length) {
        steps.push(`Escenario base: la economía está en E₀ (Y = 100, i = ${fmtNum(E0.i, 2)}%${open ? ', e = 100' : ''}). Aplica un escenario guiado o mueve un instrumento o un shock para ver el ajuste.`);
        return steps;
      }
      steps.push(`Cambio aplicado: ${changed.map(d => `${d.label.replace(/ \(.*\)$/, '')} ${u[d.key] > u0[d.key] ? '↑' : '↓'} (${d.fmt(u0[d.key])} → ${d.fmt(u[d.key])})`).join('; ')}. ${changed.map(d => d.group === 'policy' ? 'Es una decisión de política (controlable).' : 'Es un shock que la economía no controla.').filter((v, i, a) => a.indexOf(v) === i).join(' ')}`);
      // Horizontal shifts measured at the initial interest rate and exchange rate.
      const yAt = (line, y) => Math.abs(line.a) < 1e-12 ? NaN : (line.c - line.b * y) / line.a;
      const shifts = [islmShiftText('IS', yAt(m.curves.IS(u, 100), E0.i) - yAt(m.curves.IS(u0, 100), E0.i))];
      if (islm.instrument === 'rate' && islm.regime !== 'fixed') {
        if (Math.abs(u.ipol - u0.ipol) > 1e-9) shifts.push(`la LM (horizontal) se ${u.ipol > u0.ipol ? 'eleva' : 'reduce'} a i = ${fmtNum(u.ipol, 2)}%`);
      } else if (islm.regime !== 'fixed') {
        shifts.push(islmShiftText('LM', yAt(m.curves.LM(u, m.money(u)), E0.i) - yAt(m.curves.LM(u0, m.M0), E0.i)));
      }
      if (open) {
        const bp0 = m.curves.BP(u0, 100), bp1 = m.curves.BP(u, 100);
        if (m.kappa === Infinity) {
          if (Math.abs(bp1.c - bp0.c) > 1e-9) shifts.push(`la BP (horizontal) se ${bp1.c > bp0.c ? 'eleva' : 'reduce'} a i* + ρ = ${fmtNum(bp1.c, 2)}%`);
        } else {
          shifts.push(islmShiftText('BP', yAt(bp1, E0.i) - yAt(bp0, E0.i)));
        }
      }
      const shiftList = shifts.filter(Boolean);
      if (shiftList.length) steps.push(`Desplazamiento de curvas: ${shiftList.join('; ')}.`);
      if (open) {
        let impact = `Impacto (E₁), antes del ajuste externo: Y = ${fmtNum(E1.Y)}, i = ${fmtNum(E1.i, 2)}%.`;
        const parity = u.istar + u.rho;
        if (m.kappa > 0 && Math.abs(E1.i - parity) > 0.005) impact += ` La tasa doméstica queda ${E1.i > parity ? 'por encima' : 'por debajo'} de i* + ρ (${fmtNum(parity, 2)}%), lo que ${E1.i > parity ? 'atrae' : 'expulsa'} capitales.`;
        const surplus = E1.BP > 0.005, deficit = E1.BP < -0.005;
        if (!surplus && !deficit) impact += ' La balanza de pagos sigue equilibrada: no hay presión externa adicional.';
        else if (islm.regime === 'flex') impact += surplus ? ' Hay superávit de balanza de pagos (entran divisas): presión hacia la apreciación.' : ' Hay déficit de balanza de pagos (salen divisas): presión hacia la depreciación.';
        else impact += surplus ? ' Hay superávit: para defender ē el banco central compra divisas, acumula reservas y expande M.' : ' Hay déficit: para defender ē el banco central vende divisas, pierde reservas y contrae M.';
        steps.push(impact);
        if (islm.regime === 'flex' && Math.abs(E2.e - E1.e) > 0.05) {
          const pctE = (E2.e / E1.e - 1) * 100;
          steps.push(`Ajuste cambiario: e pasa de ${fmtNum(E1.e)} a ${fmtNum(E2.e)} (${pctE < 0 ? 'apreciación' : 'depreciación'} de ${fmtNum(Math.abs(pctE))}%). Las exportaciones netas cambian en ${fmtSigned(E2.NX - E1.NX)} y la IS se desplaza ${E2.e > E1.e ? 'a la derecha' : 'a la izquierda'}${m.kappa > 0 && m.kappa < Infinity ? ' (la BP también se mueve con e)' : ''} hasta E₂.`);
        }
        if (islm.regime === 'fixed' && Math.abs(E2.M - E1.M) > 0.05) {
          steps.push(`Ajuste monetario por reservas: M pasa de ${fmtNum(E1.M)} a ${fmtNum(E2.M)} (${fmtSigned(E2.M - E1.M)}); la LM se desplaza hasta que la balanza de pagos vuelve al equilibrio en E₂.`);
        }
      }
      const dY = E2.Y - E0.Y;
      const iText = Math.abs(E2.i - E0.i) < 0.005 ? `i se mantiene en ${fmtNum(E2.i, 2)}%` : `i pasa de ${fmtNum(E0.i, 2)}% a ${fmtNum(E2.i, 2)}%`;
      const eText = !open ? '' : Math.abs(E2.e - E0.e) < 0.05 ? `; e se mantiene en ${fmtNum(E2.e)}${islm.regime === 'fixed' ? ' (tipo de cambio fijo)' : ''}` : `; e pasa de 100 a ${fmtNum(E2.e)}`;
      steps.push(`Equilibrio final (E₂): Y ${Math.abs(dY) < 0.005 ? 'no cambia' : `${dY > 0 ? 'sube' : 'baja'} ${fmtNum(Math.abs(dY))} (de 100 a ${fmtNum(E2.Y)})`}; ${iText}${eText}.`);
      const comp = [['consumo', E2.C - E0.C], ['inversión', E2.I - E0.I], ['gasto público', E2.G - E0.G], ...(open ? [['exportaciones netas', E2.NX - E0.NX]] : [])]
        .filter(([, v]) => Math.abs(v) > 0.005).map(([k, v]) => `${k} ${fmtSigned(v)}`);
      if (comp.length) steps.push(`Composición del cambio en la demanda: ${comp.join(', ')}.`);
      const fiscalUp = u.G > u0.G || u.T0 < u0.T0;
      if (fiscalUp && E2.I < E0.I - 0.05) steps.push('Efecto desplazamiento (crowding out) vía tasa de interés: la mayor i reduce la inversión privada.');
      if (fiscalUp && islm.regime === 'flex' && E2.NX < E0.NX - 0.05) steps.push('Desplazamiento vía tipo de cambio: la apreciación reduce las exportaciones netas.');
      if (fiscalUp && islm.regime === 'flex' && islm.mobility === 'perfect') steps.push('Resultado clásico de Mundell–Fleming: con flotación y movilidad perfecta la política fiscal no altera el producto; solo cambia su composición (más G, menos NX).');
      if (fiscalUp && islm.regime === 'fixed' && islm.mobility === 'perfect') steps.push('Resultado clásico de Mundell–Fleming: con tipo de cambio fijo y movilidad perfecta la política fiscal es muy eficaz, porque la expansión monetaria endógena evita que suba la tasa.');
      if (islm.instrument === 'rate' && islm.regime !== 'fixed' && Math.abs(E2.M - E0.M) > 0.05) steps.push(`Con regla de tasa el banco central suministra el dinero que se demande: M pasa de ${fmtNum(E0.M)} a ${fmtNum(E2.M)}.`);
      if (state.country === 'PER' && open && E2.e > 100.5) steps.push('Contexto peruano: con alta dolarización financiera, una depreciación encarece las deudas en dólares (efecto hoja de balance) y puede ser menos expansiva que en este modelo; por eso el BCRP suele intervenir para suavizar el tipo de cambio.');
      return steps;
    }
    function renderIslmClasses() {
      const open = islm.regime !== 'closed';
      const groups = [
        { title: 'Instrumentos de política', tag: ['control', 'Controlables'], items: ['Gasto público (G)', 'Impuestos (T)',
          ...(islm.regime !== 'fixed' ? [islm.instrument === 'rate' ? 'Tasa de interés de política (i)' : 'Oferta monetaria (M)'] : []),
          ...(islm.regime === 'fixed' ? ['Tipo de cambio fijado (ē): devaluar o revaluar'] : []),
          'Elección del régimen cambiario (decisión institucional de largo plazo)'] },
        { title: 'Variables exógenas', tag: ['external', 'No controlables'], items: [
          ...(open ? ['Tasa de interés internacional (i*)', 'Prima de riesgo país (ρ)', 'Ingreso mundial (Y*)', 'Términos de intercambio (precios de exportación)'] : []),
          'Confianza y expectativas privadas', 'Nivel de precios (P, fijo a corto plazo)'] },
        { title: 'Variables endógenas', tag: ['endo', 'Resultado del modelo'], items: ['Producto (Y)', 'Consumo (C) e inversión (I)',
          islm.instrument === 'rate' && islm.regime !== 'fixed' ? 'Oferta monetaria (M): se acomoda a la tasa' : 'Tasa de interés (i)',
          ...(islm.regime === 'fixed' ? ['Oferta monetaria (M) y reservas internacionales'] : []),
          ...(islm.regime === 'flex' ? ['Tipo de cambio (e)'] : []),
          ...(open ? ['Exportaciones netas (NX) y flujos de capital (KF)'] : [])] },
        { title: 'Parámetros estructurales', tag: ['param', 'Fijos a corto plazo'], items: ['Propensión a consumir (c) y tasa impositiva (t)', 'Sensibilidad de la inversión (b) y de la demanda de dinero (h)',
          ...(open ? ['Apertura comercial (m) y respuesta de NX al tipo de cambio (n)', `Movilidad de capital: ${ISLM.MOBILITY[islm.mobility].label.toLowerCase()}`] : [])] }
      ];
      document.getElementById('islmClasses').innerHTML = groups.map(g => `<div class="islm-class" data-class="${g.tag[0]}"><h4>${g.title}<span class="islm-tag ${g.tag[0]}">${g.tag[1]}</span></h4><ul>${g.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('');
    }

    // --- Diagrams (custom canvas renderer: lines a·x + b·y = c) --------------------------------
    function islmLinePair(initial, final, color, base) {
      const out = [];
      if (!sameLine(initial, final)) out.push({ line: initial, color, initial: true, label: `${base}₀` });
      out.push({ line: final, color, label: sameLine(initial, final) ? base : `${base}₁` });
      return out;
    }
    function drawIslmPanels(E0, E1, E2) {
      const m = islm.model, u = islm.u, u0 = m.baseline, c = m.curves, open = m.open;
      const pts = [E0, E1, E2];
      const yRange = axisRange(pts.map(p => p.Y), 100, 15);
      const iRange = axisRange([...pts.map(p => p.i), u.ipol, u.istar + u.rho], m.i0, 4);
      const eRange = axisRange([...pts.map(p => p.e), u.ebar], 100, 20);
      const mRange = axisRange(pts.map(p => p.M), m.M0, Math.max(8, m.M0 * 0.4));
      const points = (fx, fy) => [
        { x: fx(E0), y: fy(E0), label: 'E₀', color: '--subtle' },
        ...(open && [E0, E2].every(E => Math.abs(E1.Y - E.Y) > 0.01 || Math.abs(E1.i - E.i) > 0.001) ? [{ x: fx(E1), y: fy(E1), label: 'E₁', hollow: true, color: '--muted' }] : []),
        { x: fx(E2), y: fy(E2), label: 'E₂', guides: true }
      ];
      const lmLabel = islm.instrument === 'rate' && islm.regime !== 'fixed' ? 'LM (i fija)' : 'LM';
      drawDiagram(document.getElementById('islmPanelISLM'), {
        x: { range: yRange, label: 'Y' }, y: { range: iRange, label: 'i (%)' },
        lines: [
          ...islmLinePair(c.IS(u0, 100), c.IS(u, E2.e), '--blue', 'IS'),
          ...islmLinePair(c.LM(u0, m.M0), c.LM(u, E2.M), '--teal', lmLabel),
          ...(open ? islmLinePair(c.BP(u0, 100), c.BP(u, E2.e), '--amber', 'BP') : [])
        ],
        points: points(p => p.Y, p => p.i)
      });
      const mfLabel = m.kappa === Infinity ? 'LM*' : m.kappa === 0 ? 'BP*' : 'LM–BP';
      drawDiagram(document.getElementById('islmPanelMF'), open ? {
        x: { range: yRange, label: 'Y' }, y: { range: eRange, label: 'e (↑ depreciación)' },
        lines: [
          ...islmLinePair(c.ISstar(u0, E0.i), c.ISstar(u, E2.i), '--blue', 'IS*'),
          ...islmLinePair(c.LMstar(u0, m.M0), c.LMstar(u, E2.M), '--teal', mfLabel),
          ...(islm.regime === 'fixed' ? islmLinePair({ a: 0, b: 1, c: 100 }, { a: 0, b: 1, c: u.ebar }, '--amber', 'ē') : [])
        ],
        points: points(p => p.Y, p => p.e)
      } : { message: 'En una economía cerrada no hay tipo de cambio. Elige un régimen abierto para ver el diagrama de Mundell–Fleming.' });
      const rateRule = islm.instrument === 'rate' && islm.regime !== 'fixed';
      drawDiagram(document.getElementById('islmPanelMoney'), {
        x: { range: mRange, label: 'M/P' }, y: { range: iRange, label: 'i (%)' },
        lines: [
          ...islmLinePair(c.moneyDemand(E0.Y), c.moneyDemand(E2.Y), '--blue', 'L(Y)'),
          ...islmLinePair({ a: 1, b: 0, c: E0.M }, { a: 1, b: 0, c: E2.M }, '--teal', 'Mˢ'),
          ...(rateRule ? islmLinePair({ a: 0, b: 1, c: u0.ipol }, { a: 0, b: 1, c: u.ipol }, '--amber', 'i política') : [])
        ],
        points: points(p => p.M, p => p.i)
      });
      drawDiagram(document.getElementById('islmPanelCross'), {
        x: { range: yRange, label: 'Y' }, y: { range: yRange, label: 'DA' },
        lines: [
          { line: { a: -1, b: 1, c: 0 }, color: '--subtle', label: '45°' },
          ...islmLinePair(c.aggregateDemand(u0, E0.i, E0.e), c.aggregateDemand(u, E2.i, E2.e), '--violet', 'DA')
        ],
        points: points(p => p.Y, p => p.Y)
      });
      const summary = `inicial Y = 100, i = ${fmtNum(E0.i, 2)}%; final Y = ${fmtNum(E2.Y)}, i = ${fmtNum(E2.i, 2)}%${open ? `, e = ${fmtNum(E2.e)}` : ''}`;
      document.getElementById('islmPanelISLM').setAttribute('aria-label', `Diagrama IS-LM-BP: ${summary}`);
      document.getElementById('islmPanelMF').setAttribute('aria-label', open ? `Diagrama Mundell-Fleming: ${summary}` : 'Diagrama Mundell-Fleming: no aplica en economía cerrada');
      document.getElementById('islmPanelMoney').setAttribute('aria-label', `Mercado de dinero: M/P pasa de ${fmtNum(E0.M)} a ${fmtNum(E2.M)}`);
      document.getElementById('islmPanelCross').setAttribute('aria-label', `Cruz keynesiana: ${summary}`);
    }
    function renderIslm() {
      if (!document.getElementById('islmRegime')) return;
      if (!islm.model || islm.country !== state.country || islm.calKey !== islmCalibrationKey()) islmSyncCountry();
      renderIslmInputs();
      syncIslmControls();
      const m = islm.model, u = islm.u;
      const E0 = m.solve(m.baseline), E1 = m.solve(u, 'impact'), E2 = m.solve(u);
      document.getElementById('islmTrilemma').textContent = islmRegimeText();
      const { imp, nx, cab, target, i0 } = islmCalibrationData();
      const observed = (label,code,data) => `${label}: ${formatValue(data.value,code)} — ${Number.isFinite(data.value)?'Dato observado':'N/D'} (WDI, ${code}, observación ${data.year}; ${cellSource(state.country,code,data.year)==='wdi'?'extracción '+(wdiFetchedAt[code]||'N/D'):'Respaldo local — no actualizado; extracción '+(FALLBACK_EXTRACTED_AT[code]||'no registrada')})`;
      document.getElementById('islmCalibration').textContent = `${COUNTRIES[state.country].name}: ${observed('Importaciones','NE.IMP.GNFS.ZS',imp)}. ${observed('NX bienes y servicios','NE.RSB.GNFS.ZS',nx)}. ${observed('Cuenta corriente','BN.CAB.XOKA.GD.ZS',cab)}. NX: ${m.provenance.nx==='observed'?'Dato observado':'aproximación con CA, no NX observado'}. m = ${fmtNum(islm.params.m,2)} — ${islm.mTouched||!Number.isFinite(imp.value)?'Valor ilustrativo':'Parámetro calibrado; aproximación: propensión media × elasticidad-ingreso supuesta = 1'}. i₀ = ${fmtNum(i0,2)}% = meta ${target?.bank||'genérica'} + tasa real neutral — supuesto ilustrativo. i* = ${Math.min(ISLM_FOREIGN_RATE,i0)}% — Supuesto teórico. NFI = CA − NX — Parámetro calibrado (cortes de cada serie indicados arriba). Y₀ = e₀ = 100 — normalización ilustrativa. G₀ = 18, I₀ = 20, k = 0,5 y f = 0,15 — Valor ilustrativo. C₀, Ī, M₀, ρ₀ y KF₀ — Parámetro calibrado.`;
      document.getElementById('islmRegimeBadge').textContent = ({ closed: 'CERRADA', flex: 'FLEXIBLE', fixed: 'FIJO' })[islm.regime];
      document.querySelectorAll('#islmPolicyTable [data-regime]').forEach(el => el.classList.toggle('is-current', el.dataset.regime === islm.regime));
      if (!E0 || !E1 || !E2) {
        document.getElementById('islmNarrative').innerHTML = '<li>El sistema no tiene solución con esta combinación de parámetros. Prueba otros valores.</li>';
        return;
      }
      renderIslmResults(E0, E1, E2);
      renderIslmMultipliers();
      document.getElementById('islmNarrative').innerHTML = islmNarrative(E0, E1, E2).map(s => `<li>${s}</li>`).join('');
      renderIslmClasses();
      drawIslmPanels(E0, E1, E2);
    }
    function setupIslm() {
      const onConfig = (key) => e => { islm[key] = e.target.value; islmBuildModel(); renderIslm(); };
      document.getElementById('islmRegime').addEventListener('change', onConfig('regime'));
      document.getElementById('islmMobility').addEventListener('change', onConfig('mobility'));
      document.getElementById('islmInstrument').addEventListener('change', onConfig('instrument'));
      document.getElementById('islmResetBtn').addEventListener('click', () => {
        islm.params = { ...ISLM.DEFAULT_PARAMS };
        islm.country = null; islm.u = null;
        renderIslm(); showToast('Modelo restablecido al escenario base');
      });
      // Canvases are sized from CSS; redraw when their panels resize (tab switches, viewport changes).
      if (typeof ResizeObserver !== 'undefined') {
        let frame = 0;
        const ro = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { if (state.activeTab === 'simulator') renderIslm(); }); });
        document.querySelectorAll('.islm-panel').forEach(el => ro.observe(el));
      }
    }


  Object.assign(M, { drawIslmPanels, islmBuildModel, islmCalibrationData, islmDisabledReason, islmFmtKF, islmLinePair, islmNarrative, islmRegimeText, islmShiftText, islmSyncCountry, renderIslm, renderIslmClasses, renderIslmInputs, renderIslmMultipliers, renderIslmResults, setupIslm, syncIslmControls });
})();
