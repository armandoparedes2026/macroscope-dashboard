(function () {
  'use strict';
  const M = globalThis.MacroScope;
  function route() {
    const [requested, query=''] = location.hash.slice(1).split('?');
    const view = ['inicio','laboratorio','panorama','comparacion','fuentes','ayuda'].includes(requested) ? requested : 'inicio';
    M.state.activeTab = view === 'panorama' ? 'overview' : view === 'laboratorio' ? 'simulator' : view;
    document.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== view; });
    document.querySelectorAll('[data-route]').forEach(el => {
      if(el.dataset.route === view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    });
    document.querySelector('.nav-menu').open = innerWidth>1120;
    const target=document.querySelector(`[data-view="${view}"]`);
    target.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
    if(view==='panorama') {
      M.renderCharts();
      M.renderPanorama?.();
      // Deep-link desde la portada al comparador, sin crear otra ruta.
      if(new URLSearchParams(query).get('focus')==='compare'){
        requestAnimationFrame(()=>document.getElementById('compareTitle')?.scrollIntoView({block:'start',behavior:'instant'}));
      }
    }
    if(view==='comparacion') M.renderComparisonDashboard?.();
    if(view==='laboratorio') M.renderIslm();
    M.renderSourceDirectory?.(new URLSearchParams(query));
    M.showGlossaryTerm?.(new URLSearchParams(query).get('term'));
  }
  const escapeHTML = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); M.showToast('Cita copiada'); }
    catch { M.fallbackCopy(text,'Cita copiada'); }
  }
  function renderSourceDirectory(params) {
    const catalog=M.SOURCES_CATALOG;
    const filters={course:params.get('course')||'',scope:params.get('scope')||'',access:params.get('access')||'',query:params.get('q')||''};
    for(const [key,id] of [['course','Course'],['scope','Scope'],['access','Access'],['query','Query']]) document.getElementById('source'+id).value=filters[key];
    const sources=catalog.filterSources(filters);
    document.getElementById('sourceCount').textContent=`${sources.length} fuentes encontradas`;
    document.getElementById('sourceResults').innerHTML=sources.length?sources.map(source=>`<article class="source-card surface"><div class="eyebrow">${escapeHTML(catalog.SCOPES[source.scope])}</div><h2>${escapeHTML(source.name)}</h2><p class="source-org">${escapeHTML(source.org)}</p><p>${escapeHTML(source.useFor)}</p><p class="data-note">Temas: ${escapeHTML(source.topics.join(', '))}</p><dl><dt>Frecuencia</dt><dd>${escapeHTML(source.frequency)}</dd><dt>Acceso</dt><dd>${escapeHTML(source.access.map(key=>catalog.ACCESS[key]).join(' · '))}</dd><dt>Nivel</dt><dd>${escapeHTML({basico:'Básico',intermedio:'Intermedio',avanzado:'Avanzado'}[source.level])}</dd></dl>${source.note?`<p class="source-warning">${escapeHTML(source.note)}</p>`:''}${source.linkStatus==='antibot'?'<p class="source-warning">Puede pedir una verificación del navegador al abrirse</p>':''}<div class="source-actions"><a class="control-action primary" href="${escapeHTML(source.url)}" target="_blank" rel="noopener">Abrir fuente</a><button class="control-action" type="button" data-cite-source="${source.id}">Copiar cita</button></div></article>`).join(''):'<p>Sin resultados. Prueba otro tema o limpia los filtros.</p>';
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
    document.getElementById('sourceResults').addEventListener('click',event=>{const btn=event.target.closest('[data-cite-source]');if(btn)copyText(catalog.citeSource(catalog.SOURCES.find(s=>s.id===btn.dataset.citeSource),new Date()));});
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
  function setupStudentViews() { setupSourceDirectory(); window.addEventListener('resize',()=>{document.querySelector('.nav-menu').open=innerWidth>1120;}); renderGlossary(); document.getElementById('glossarySearch').addEventListener('input',renderGlossary); window.addEventListener('hashchange',route); route(); }
  Object.assign(M,{setupStudentViews,route,renderSourceDirectory,copyText,escapeHTML,showGlossaryTerm,localDate,dataCitation,citationButton});
})();
