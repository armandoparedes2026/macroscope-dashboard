(function () {
  'use strict';
  const M = globalThis.MacroScope;
  let selectedSourceId = 'bcrpdata';

  function route() {
    const [requested, query=''] = location.hash.slice(1).split('?');
    const view = M.navigation.canonicalView(requested);
    const canonical = M.navigation.canonicalHash(location.hash);
    if (location.hash !== canonical) history.replaceState(null, '', canonical);
    document.documentElement.dataset.activeView = view;
    const overviewSection = document.getElementById('tab-overview');
    const simulatorSection = document.getElementById('tab-simulator');
    if (overviewSection) {
      overviewSection.dataset.view = 'exploracion';
    }
    if (simulatorSection) {
      simulatorSection.dataset.view = 'simulacion';
    }
    M.state.activeTab = M.navigation.destinations.find(d => d.id === view)?.tab || view;
    document.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== view; });
    document.querySelectorAll('[data-route]').forEach(el => {
      if(el.dataset.route === view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    });
    document.querySelector('.nav-menu').open = innerWidth>1120;
    const target=document.querySelector(`[data-view="${view}"]`);
    if (target) target.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
    const params = new URLSearchParams(query);
    if(view==='exploracion') {
      M.renderCharts();
      M.renderPanorama?.();
      if(params.get('focus')==='compare'){
        requestAnimationFrame(()=>document.getElementById('compareTitle')?.scrollIntoView({block:'start',behavior:'instant'}));
      }
    }
    if(view==='comparacion') M.renderComparisonDashboard?.();
    if(view==='simulacion') M.renderIslm();
    if(view==='aprendizaje') M.renderAprendizajeView?.();
    if(view==='historico') M.renderHistoricoView?.();
    if(view==='indicadores') M.renderIndicadoresView?.();
    if(view==='modelos') M.renderModelosView?.();
    if(view==='observatorio') M.renderObservatorioView?.();
    M.applyExperienceQuery?.(view, params);
    M.renderSourceDirectory?.(params);
    M.showGlossaryTerm?.(params.get('term'));
  }
  const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); M.showToast('Cita copiada'); }
    catch { M.fallbackCopy(text,'Cita copiada'); }
  }
  function renderSourceDetailSheet(sources) {
    const sheet = document.getElementById('sourceDetailSheet');
    if (!sheet) return;
    const catalog = M.SOURCES_CATALOG;
    const active = sources.find(s => s.id === selectedSourceId) || sources[0] || catalog.SOURCES[0];
    if (!active) return;
    selectedSourceId = active.id;
    const cite = catalog.citeSource(active, new Date());
    sheet.innerHTML = `
      <div class="ms-panel-head">
        <div>
          <div class="ms-exp-eyebrow">FICHA DE LA FUENTE · ${escapeHTML(catalog.SCOPES[active.scope])}</div>
          <h2 id="sourceSheetTitle">${escapeHTML(active.name)}</h2>
          <p>${escapeHTML(active.org)} (${escapeHTML(active.orgShort)})</p>
        </div>
        <span class="ms-badge ${active.primary ? 'live' : 'demo'}">${active.primary ? 'Fuente primaria' : 'Compendio secundario'}</span>
      </div>
      <p style="font-size:12.5px;line-height:1.55;margin:0 0 10px">${escapeHTML(active.useFor)}</p>
      <div class="ind-meta-list">
        <div><strong>Frecuencia</strong><span>${escapeHTML(active.frequency)}</span></div>
        <div><strong>Nivel sugerido</strong><span>${escapeHTML({basico:'Básico',intermedio:'Intermedio',avanzado:'Avanzado'}[active.level])}</span></div>
        <div><strong>Acceso</strong><span>${escapeHTML(active.access.map(k => catalog.ACCESS[k]).join(' · '))}</span></div>
        <div><strong>Verificado</strong><span>${escapeHTML(active.checked)}</span></div>
      </div>
      <div style="font-size:12px;margin:8px 0">
        <strong>Variables y temas principales:</strong> ${escapeHTML(active.topics.join(', '))}
      </div>
      <div style="font-size:12px;margin:8px 0">
        <strong>Cursos recomendados:</strong> ${escapeHTML(active.courses.map(c => catalog.COURSES[c]).join(' · '))}
      </div>
      ${active.note ? `<p class="source-warning">${escapeHTML(active.note)}</p>` : ''}
      <div class="mod-equation-box" style="margin:10px 0">
        <strong>Cita académica (APA 7):</strong><br>${escapeHTML(cite)}
      </div>
      <div class="source-actions" style="margin-bottom:14px">
        <a class="control-action primary" href="${escapeHTML(active.url)}" target="_blank" rel="noopener">Abrir portal oficial ↗</a>
        <button class="control-action" type="button" data-cite-source="${escapeHTML(active.id)}">Copiar cita APA</button>
      </div>
      <div class="ms-exp-eyebrow">COLECCIONES RÁPIDAS</div>
      <div class="fuentes-collections-grid">
        <button type="button" class="fuentes-collection-btn" data-source-preset="scope=peru"><strong>Principales en Perú</strong><small style="color:var(--text-muted)">BCRP, INEI, MEF, SBS</small></button>
        <button type="button" class="fuentes-collection-btn" data-source-preset="scope=global"><strong>Comparación internacional</strong><small style="color:var(--text-muted)">WDI, FMI, CEPAL, OCDE</small></button>
        <button type="button" class="fuentes-collection-btn" data-source-preset="access=series"><strong>Series de tiempo</strong><small style="color:var(--text-muted)">Macro y finanzas</small></button>
        <button type="button" class="fuentes-collection-btn" data-source-preset="access=microdatos"><strong>Microdatos y encuestas</strong><small style="color:var(--text-muted)">ENAHO, ENDES, paneles</small></button>
      </div>
    `;
  }
  function sourceCard(source) {
    const catalog = M.SOURCES_CATALOG;
    return `<article class="source-card surface" data-source-card="${escapeHTML(source.id)}">
      <div class="source-card-identity"><span class="source-emblem" aria-hidden="true">${escapeHTML(source.orgShort)}</span><div><div class="eyebrow">${escapeHTML(catalog.SCOPES[source.scope])}</div><h2>${escapeHTML(source.name)}</h2></div></div>
      <p class="source-org">${escapeHTML(source.org)}</p><p class="source-description">${escapeHTML(source.useFor)}</p>
      <div class="source-access-tags">${source.access.slice(0,3).map(key=>`<span>${escapeHTML(catalog.ACCESS[key])}</span>`).join('')}</div>
      ${source.note?`<p class="source-warning">${escapeHTML(source.note)}</p>`:''}
      ${source.linkStatus==='antibot'?'<p class="source-warning">Puede pedir una verificación del navegador</p>':''}
      <div class="source-actions"><button class="control-action source-sheet-action" type="button" data-select-source="${escapeHTML(source.id)}">Ver ficha <span aria-hidden="true">→</span></button><a class="control-action source-icon-action" href="${escapeHTML(source.url)}" target="_blank" rel="noopener" aria-label="Abrir ${escapeHTML(source.name)}" title="Abrir fuente oficial">↗</a><button class="control-action source-icon-action" type="button" data-cite-source="${escapeHTML(source.id)}" aria-label="Copiar cita de ${escapeHTML(source.name)}" title="Copiar cita">${M.navigation.icon('book')}</button></div>
    </article>`;
  }
  function renderSourceDirectory(params) {
    const catalog=M.SOURCES_CATALOG;
    const filters={course:params.get('course')||'',scope:params.get('scope')||'',access:params.get('access')||'',query:params.get('q')||''};
    for(const [key,id] of [['course','Course'],['scope','Scope'],['access','Access'],['query','Query']]) document.getElementById('source'+id).value=filters[key];
    const sources=catalog.filterSources(filters);
    document.getElementById('sourceCount').textContent=`${sources.length} fuentes encontradas`;
    document.getElementById('sourceResults').innerHTML=sources.length?sources.map(sourceCard).join(''):'<p>Sin resultados. Prueba otro tema o limpia los filtros.</p>';
    document.querySelectorAll('[data-source-access]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sourceAccess===filters.access)));
    renderSourceDetailSheet(sources);
    const dates=[...new Set(catalog.SOURCES.map(source=>source.checked))];
    document.getElementById('sourceChecked').textContent='Enlaces comprobados el '+dates.map(date=>new Date(date+'T12:00:00').toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'})).join(', ');
  }
  function setupSourceDirectory() {
    const catalog=M.SOURCES_CATALOG;
    for(const [id,options] of [['Course',catalog.COURSES],['Scope',catalog.SCOPES],['Access',catalog.ACCESS]]) document.getElementById('source'+id).innerHTML='<option value="">Todos</option>'+Object.entries(options).map(([value,label])=>`<option value="${value}">${escapeHTML(label)}</option>`).join('');
    const update=()=>{
      const params=new URLSearchParams();
      for(const [key,id] of [['course','Course'],['scope','Scope'],['access','Access'],['q','Query']]){const value=document.getElementById('source'+id).value;if(value)params.set(key,value);}
      history.replaceState(null,'','#fuentes'+(params.size?'?'+params:''));
      renderSourceDirectory(params);
    };
    const form=document.getElementById('sourceFilters');
    form.addEventListener('submit',event=>event.preventDefault());
    form.addEventListener('input',update);
    form.addEventListener('reset',()=>{setTimeout(update,0);});
    const fuentesView = document.getElementById('fuentes');
    fuentesView.addEventListener('click',event=>{
      const citeBtn=event.target.closest('[data-cite-source]');
      if(citeBtn){
        copyText(catalog.citeSource(catalog.SOURCES.find(s=>s.id===citeBtn.dataset.citeSource),new Date()));
        return;
      }
      const selBtn=event.target.closest('[data-select-source]');
      if(selBtn){
        selectedSourceId=selBtn.dataset.selectSource;
        const params=new URLSearchParams(location.hash.split('?')[1]||'');
        renderSourceDetailSheet(catalog.filterSources({course:params.get('course')||'',scope:params.get('scope')||'',access:params.get('access')||'',query:params.get('q')||''}));
        return;
      }
      const presetBtn=event.target.closest('[data-source-preset]');
      if(presetBtn){
        const presetParams=new URLSearchParams(presetBtn.dataset.sourcePreset);
        for(const [key,id] of [['course','Course'],['scope','Scope'],['access','Access'],['q','Query']]){
          document.getElementById('source'+id).value=presetParams.get(key)||'';
        }
        update();
      }
    });
  }
  function renderGlossary() {
    const query=document.getElementById('glossarySearch').value.trim().toLocaleLowerCase('es');
    const terms=Object.entries(M.LAB_CONTENT.GLOSSARY).filter(([key,value])=>[key,value.short,value.long].join(' ').toLocaleLowerCase('es').includes(query));
    document.getElementById('helpGlossary').innerHTML=terms.map(([key,value])=>`<details id="help-term-${escapeHTML(key)}"><summary>${escapeHTML(key==='rho'?'ρ · Prima de riesgo':key==='multiplier'?'Multiplicador':key==='trilemma'?'Trilema':key)}</summary><p>${escapeHTML(value.short)}</p><p>${escapeHTML(value.long)}</p></details>`).join('');
    document.getElementById('glossaryCount').textContent=`${terms.length} términos encontrados`;
  }
  function showGlossaryTerm(key) {
    if(!key||!M.LAB_CONTENT.GLOSSARY[key])return;
    document.getElementById('glossarySearch').value='';renderGlossary();
    const term=document.getElementById('help-term-'+key);term.open=true;term.querySelector('summary').focus({preventScroll:true});term.scrollIntoView({block:'start',behavior:'instant'});
  }
  function localDate(value) {
    if(!value)return 'no registrada';
    const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?value+'T12:00:00':value);
    return Number.isNaN(date.getTime())?'no registrada':date.toLocaleDateString('es-PE',{day:'numeric',month:'long',year:'numeric'});
  }
  function dataCitation({provider,code,country='Perú',extracted}) {
    const date=localDate(extracted||new Date().toISOString());
    return provider==='bcrp'?`Banco Central de Reserva del Perú. (s. f.). BCRPData [Base de datos]. Serie: ${code}. País: ${country}. Recuperado el ${date}, de https://estadisticas.bcrp.gob.pe/estadisticas/series/${code}`:`Banco Mundial. (s. f.). World Development Indicators [Base de datos]. Indicador: ${code}. País: ${country}. Recuperado el ${date}, de https://data.worldbank.org/indicator/${code}`;
  }
  function citationButton(options) {
    const button=document.createElement('button');button.type='button';button.className='control-action citation-button';button.textContent='Cómo citar';button.setAttribute('aria-label','Cómo citar '+options.code);button.addEventListener('click',()=>copyText(dataCitation(options)));return button;
  }
  function setupStudentViews() { M.setupNavigation(); M.setupReferenceLayout(); setupSourceDirectory(); window.addEventListener('resize',()=>{document.querySelector('.nav-menu').open=innerWidth>1120;}); renderGlossary(); document.getElementById('glossarySearch').addEventListener('input',renderGlossary); window.addEventListener('hashchange',route); route(); }
  Object.assign(M,{setupStudentViews,route,renderSourceDirectory,copyText,escapeHTML,showGlossaryTerm,localDate,dataCitation,citationButton});
})();
