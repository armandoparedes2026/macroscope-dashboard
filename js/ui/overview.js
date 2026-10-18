(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { COUNTRIES, INDICATORS, YEARS, FALLBACK_EXTRACTED_AT, runtimeDB, runtimeFX, runtimeSource, cellSource, state, wdiFetchedAt, FX_URL } = M;
  // Resolve cross-view callbacks when invoked, after every deferred script has loaded.
  const determineTone = (...args) => M.determineTone(...args);
  const formatDelta = (value,code) => code==='NY.GDP.PCAP.PP.KD' && Number.isFinite(value) ? `${value>0?'+':''}${value.toLocaleString('es-PE',{maximumFractionDigits:0})} dólares internacionales` : M.formatDelta(value,code);
  const formatValue = (value,code) => Number.isFinite(value) ? M.formatValue(value,code) : 'sin dato';
  const inflationTargetText = (...args) => M.inflationTargetText(...args);
  const loadFxRates = (...args) => M.loadFxRates(...args);
  const loadWdiSeries = (...args) => M.loadWdiSeries(...args);
  const renderAll = (...args) => M.renderAll(...args);
  const renderCharts = (...args) => M.renderCharts(...args);
  const renderIslm = (...args) => M.renderIslm(...args);
  const comparison = { countries: ['PER','ARG','USA','CHN'], indicator: 'NY.GDP.MKTP.KD.ZG', start: '2014', end: '2025', mode: 'raw', common: false, base: '2014' };
  function countryOptions(includeAggregate = true) {
    return ['América Latina','Economías internacionales'].map(group => `<optgroup label="${group}">${Object.entries(COUNTRIES).filter(([,c])=>c.group===group&&(includeAggregate||!c.aggregate)).map(([code,c])=>`<option value="${code}">${c.flag} ${c.name}</option>`).join('')}</optgroup>`).join('');
  }
  function renderComparison() {
    const root=document.getElementById('comparisonPanel');
    if(!root)return;
    const meta=INDICATORS[comparison.indicator];
    const level=M.LEVEL_INDICATORS.includes(comparison.indicator);
    const modeSelect=document.getElementById('compareMode');
    for(const option of modeSelect.options) option.disabled=(option.value==='base'&&!level)||(option.value==='cumulative'&&comparison.indicator!=='NY.GDP.MKTP.KD.ZG')||(option.value==='convergence'&&comparison.indicator!=='NY.GDP.PCAP.PP.KD');
    if(modeSelect.selectedOptions[0]?.disabled)comparison.mode='raw';
    modeSelect.value=comparison.mode;
    document.getElementById('compareBase').disabled=comparison.mode!=='base';
    const years=YEARS.filter(y=>y>=comparison.start&&y<=comparison.end);
    const transformed=comparison.countries.map(country=>{
      const raw=Object.fromEntries(years.map(y=>[y,runtimeDB[country]?.[comparison.indicator]?.[y]??null]));
      if(comparison.mode==='base')return M.normalizeBase({...raw,[comparison.base]:runtimeDB[country]?.[comparison.indicator]?.[comparison.base]??null},comparison.base,comparison.indicator);
      if(comparison.mode==='cumulative')return M.cumulativeGrowth(raw,years);
      if(comparison.mode==='convergence')return M.relativeToUSA(raw,runtimeDB.USA?.['NY.GDP.PCAP.PP.KD']||{});
      return raw;
    });
    const shared=M.commonYears(transformed,years);
    const chartYears=comparison.common?shared:years;
    const missing=comparison.countries.map((c,i)=>({country:c,years:years.filter(y=>!Number.isFinite(transformed[i][y]))})).filter(item=>item.years.length);
    document.getElementById('compareMissing').textContent=(years.length?'':'Periodo inválido: el inicio debe ser anterior o igual al fin. ')+(missing.length?missing.map(item=>`${COUNTRIES[item.country].name}: sin dato en ${item.years.join(', ')}`).join(' · '):'Sin observaciones ausentes en el periodo.')+(comparison.common?` · Años comunes: ${shared.length}/${years.length}. La tabla conserva todos los años solicitados.`:'');
    const units={raw:meta.unit,base:`Índice ${comparison.base} = 100`,cumulative:'Crecimiento acumulado (%)',convergence:'PPA constante relativa a EE. UU. (EE. UU. = 100%)'};
    document.getElementById('compareSubtitle').textContent=`${meta.title} · ${units[comparison.mode]} · ${comparison.start}–${comparison.end}`;
    const colors=Array.from({length:6},(_,i)=>M.color('--series-'+(i+1)));
    document.getElementById('compareLegend').innerHTML=comparison.countries.map((c,i)=>`<span><i style="background:${colors[i]}"></i>${COUNTRIES[c].flag} ${COUNTRIES[c].name}</span>`).join('');
    const number=value=>Number.isFinite(value)?value.toLocaleString('es-PE',{maximumFractionDigits:comparison.mode==='raw'?meta.decimals:2}):'sin dato';
    document.getElementById('compareTableHead').innerHTML=`<tr><th scope="col">Año</th>${comparison.countries.map(c=>`<th scope="col">${COUNTRIES[c].name}</th>`).join('')}</tr>`;
    document.getElementById('compareTableBody').innerHTML=years.map(y=>`<tr><th scope="row">${y}</th>${comparison.countries.map((c,i)=>`<td>${number(transformed[i][y])}</td>`).join('')}</tr>`).join('');
    const added=comparison.countries.filter(c=>!['PER','CHL','COL','MEX','BRA','USA','LCN'].includes(c));
    document.getElementById('compareInstitution').textContent=added.length ? `${added.map(c=>COUNTRIES[c].name).join(', ')}: Sin meta de referencia. En el simulador, tasa real neutral de 1,5% e inflación de referencia de 3% son supuestos genéricos ilustrativos (tasa nominal inicial de 4,5%). ${added.filter(c=>['ECU','DEU','ESP'].includes(c)).map(c=>M.ISLM_COUNTRY[c].note).join(' ')}` : '';
    M.drawComparisonChart(chartYears,comparison.countries.map((c,i)=>({label:COUNTRIES[c].name,data:chartYears.map(y=>transformed[i][y]),borderColor:colors[i],spanGaps:false,fill:false,pointRadius:2,borderWidth:2,borderDash:[[],[8,4],[2,3],[8,3,2,3]][i%4],pointStyle:['circle','rect','rectRot','triangle'][i%4]})),units[comparison.mode]);
  }
  window.addEventListener('DOMContentLoaded',()=>{
    for(const [id,includeAggregate]of [['countrySelect',false],['benchmarkSelect',true]])document.getElementById(id).innerHTML=countryOptions(includeAggregate);
    document.querySelector('#macroTableBody').closest('table').tHead.innerHTML=`<tr><th>Año</th>${Object.values(INDICATORS).map(meta=>`<th>${meta.title}<br>(${meta.unit})</th>`).join('')}</tr>`;
    const trendSelect=document.getElementById('indicatorSelectChart');
    for(const [code,meta]of Object.entries(INDICATORS))if(![...trendSelect.options].some(option=>option.value===code))trendSelect.add(new Option(meta.title,code));
    if(COUNTRIES[state.country]?.aggregate)state.country='PER';
    const years=YEARS.filter(y=>y<=String(new Date().getFullYear()-1));
    comparison.end=years.at(-1);
    document.getElementById('compareCountries').innerHTML=Array.from({length:4},(_,i)=>`<label>Economía ${i+1}<select class="field-select" id="compareCountry${i}" aria-label="Economía ${i+1}">${i?'<option value="">Sin economía adicional</option>':''}${countryOptions()}</select></label>`).join('');
    for(let i=0;i<4;i++){
      const select=document.getElementById(`compareCountry${i}`);select.value=comparison.countries[i];
      select.addEventListener('change',()=>{
        comparison.countries=Array.from({length:4},(_,j)=>document.getElementById(`compareCountry${j}`).value).filter(Boolean);
        comparison.countries=[...new Set(comparison.countries)];
        const seen=new Set();for(let j=0;j<4;j++){const el=document.getElementById(`compareCountry${j}`);if(el.value&&seen.has(el.value))el.value='';else seen.add(el.value);}
        renderComparison();
      });
    }
    document.getElementById('compareIndicator').innerHTML=Object.entries(INDICATORS).map(([c,m])=>`<option value="${c}">${m.title} (${m.unit})</option>`).join('');
    for(const [id,key]of [['compareIndicator','indicator'],['compareStart','start'],['compareEnd','end'],['compareMode','mode'],['compareBase','base']]){
      const select=document.getElementById(id);
      if(['start','end','base'].includes(key))select.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');
      select.value=comparison[key];select.addEventListener('change',()=>{comparison[key]=select.value;renderComparison();});
    }
    document.getElementById('compareCommon').addEventListener('change',e=>{comparison.common=e.target.checked;renderComparison();});
  });
  Object.assign(M,{comparison,renderComparison});
    let toastTimer;
    function showToast(msg, isSuccess = true) {
      const el = document.getElementById('toastContainer');
      if (!el) return;
      document.getElementById('toastMessage').textContent = msg;
      document.getElementById('toastIcon').className = isSuccess ? 'toast-dot' : 'toast-dot warning';
      el.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { el.hidden = true; }, 4000);
    }

    function getFilteredYears() {
      const available = YEARS.filter(y => Object.keys(INDICATORS).some(code => Number.isFinite(runtimeDB[state.country]?.[code]?.[y])));
      if (state.period === '5') return available.slice(-5);
      if (state.period === '10') return available.slice(-10);
      return available;
    }

    function getLatestYearAndValue(countryCode, indicatorCode) {
      return globalThis.MacroScope.latestAvailable(runtimeDB[countryCode]?.[indicatorCode] || {}, YEARS);
    }

    function setTheme(mode) {
      document.documentElement.dataset.theme = mode;
      document.getElementById('themeIcon')?.setAttribute('href', mode==='dark' ? '#i-sun' : '#i-moon');
      try {localStorage.setItem('macroscope_theme',mode);} catch(e) {}
      renderCharts(); renderIslm();
    }
    function updateRangeStyles() {
      document.querySelectorAll('.sim-range').forEach(el=>{
        const min=Number(el.min),max=Number(el.max),val=Number(el.value);
        el.style.setProperty('--range-progress',`${(val-min)/(max-min)*100}%`);
      });
    }


    function renderHeroPanels(){
      const gdp=getLatestYearAndValue(state.country,'NY.GDP.MKTP.KD.ZG');
      const inf=getLatestYearAndValue(state.country,'FP.CPI.TOTL.ZG');
      const cab=getLatestYearAndValue(state.country,'BN.CAB.XOKA.GD.ZS');
      const uem=getLatestYearAndValue(state.country,'SL.UEM.TOTL.ZS');
      const benchmark=COUNTRIES[state.benchmark];
      const pulse=[
        {label:'Crecimiento anual', code:'NY.GDP.MKTP.KD.ZG', item:gdp, foot:`Comparado con ${benchmark.name}`},
        {label:'Inflación anual', code:'FP.CPI.TOTL.ZG', item:inf, foot:inflationTargetText(state.country)},
        {label:'Cuenta corriente', code:'BN.CAB.XOKA.GD.ZS', item:cab, foot:'Balance del frente externo'}
      ];
      const pulseStrip=document.getElementById('pulseStrip');
      if(pulseStrip){
        pulseStrip.innerHTML=pulse.map(entry=>{const tone=determineTone(entry.code,entry.item.value); return `<div class="pulse-card premium-ring"><div class="pulse-label">${entry.label}</div><div class="pulse-value">${formatValue(entry.item.value,entry.code)}</div><div class="pulse-foot"><span>${entry.foot}</span><span class="micro-badge ${tone.cls}"><span class="micro-dot"></span>${tone.label}</span></div></div>`}).join('');
      }
      const summary=document.getElementById('heroSummaryMini');
      if(summary){
        summary.innerHTML=`<div class="summary-mini"><span class="mini-label">Desempleo</span><span class="mini-number">${formatValue(uem.value,'SL.UEM.TOTL.ZS')}</span><span class="mini-caption">${uem.year} · Mercado laboral observado bajo estándar OIT.</span></div><div class="summary-mini"><span class="mini-label">PBI per cápita</span><span class="mini-number">${formatValue(getLatestYearAndValue(state.country,'NY.GDP.PCAP.CD').value,'NY.GDP.PCAP.CD')}</span><span class="mini-caption">Ingreso promedio por habitante en el último corte disponible.</span></div>`;
      }
      const heroChip=document.getElementById('heroStatusChip');
      if(heroChip){
        const tone = determineTone('FP.CPI.TOTL.ZG', inf.value);
        heroChip.textContent = `Inflación ${tone.label.toLowerCase()}`;
      }
    }
    function buildInsightSlides(){
      const country=COUNTRIES[state.country], benchmark=COUNTRIES[state.benchmark];
      const gdp=getLatestYearAndValue(state.country,'NY.GDP.MKTP.KD.ZG');
      const gdpB=getLatestYearAndValue(state.benchmark,'NY.GDP.MKTP.KD.ZG');
      const inf=getLatestYearAndValue(state.country,'FP.CPI.TOTL.ZG');
      const uem=getLatestYearAndValue(state.country,'SL.UEM.TOTL.ZS');
      const exp=getLatestYearAndValue(state.country,'NE.EXP.GNFS.ZS');
      const cab=getLatestYearAndValue(state.country,'BN.CAB.XOKA.GD.ZS');
      const gdpGap = Number.isFinite(gdp.value) && Number.isFinite(gdpB.value) && gdp.year===gdpB.year ? gdp.value-gdpB.value : null;
      return [
        {
          overline:'Momentum macro',
          title:`${country.name} ${Number.isFinite(gdp.value)&&gdp.value>=0?'avanza':'corrige'} con un PBI de ${formatValue(gdp.value,'NY.GDP.MKTP.KD.ZG')}`,
          text:`La actividad económica del último corte (${gdp.year}) ${gdpGap===null?'no puede compararse directamente con el benchmark por diferencias de corte.':(gdpGap>=0?`supera a ${benchmark.name} en ${formatDelta(gdpGap,'NY.GDP.MKTP.KD.ZG')}.`:`se ubica por debajo de ${benchmark.name} en ${formatDelta(gdpGap,'NY.GDP.MKTP.KD.ZG')}.`)} Esta lectura sirve para contextualizar demanda, inversión y ritmo de expansión empresarial.`,
          chips:[`${country.flag} ${country.name}`, `${benchmark.flag} Benchmark: ${benchmark.name}`, `Dato anual · ${gdp.year}`],
          signals:[
            ['Crecimiento', formatValue(gdp.value,'NY.GDP.MKTP.KD.ZG'), `Comparación ${gdpGap===null?'no homogénea':'con benchmark homogénea'}`],
            ['PBI per cápita', formatValue(getLatestYearAndValue(state.country,'NY.GDP.PCAP.CD').value,'NY.GDP.PCAP.CD'), 'Nivel de ingreso por habitante'],
            ['Exportaciones', formatValue(exp.value,'NE.EXP.GNFS.ZS'), 'Apertura comercial relativa']
          ]
        },
        {
          overline:'Estabilidad interna',
          title:`Presión de precios en ${formatValue(inf.value,'FP.CPI.TOTL.ZG')} y desempleo en ${formatValue(uem.value,'SL.UEM.TOTL.ZS')}`,
          text:`El binomio inflación–empleo condiciona precios, costos y consumo. Una inflación más alta puede tensionar márgenes; un desempleo elevado puede anticipar una demanda más débil o heterogénea por segmentos.`,
          chips:[`IPC · ${inf.year}`, `Desempleo · ${uem.year}`, `${determineTone('FP.CPI.TOTL.ZG',inf.value).label}`],
          signals:[
            ['Inflación', formatValue(inf.value,'FP.CPI.TOTL.ZG'), 'Sensibilidad sobre costos y precios'],
            ['Desempleo', formatValue(uem.value,'SL.UEM.TOTL.ZS'), 'Lectura del mercado laboral'],
            ['Cuenta corriente', formatValue(cab.value,'BN.CAB.XOKA.GD.ZS'), 'Condición externa agregada']
          ]
        },
        {
          overline:'Frente externo',
          title:`Sector externo con exportaciones de ${formatValue(exp.value,'NE.EXP.GNFS.ZS')} y cuenta corriente de ${formatValue(cab.value,'BN.CAB.XOKA.GD.ZS')}`,
          text:`Estas señales ayudan a leer exposición externa, tracción exportadora y balance agregado. Úsalas como contexto para decisiones de cobertura, abastecimiento importado y diversificación comercial; no como señal operativa única.`,
          chips:[`Exportaciones · ${exp.year}`, `Cuenta corriente · ${cab.year}`, `Monitoreo internacional`],
          signals:[
            ['Exportaciones', formatValue(exp.value,'NE.EXP.GNFS.ZS'), 'Participación sobre el PBI'],
            ['Cuenta corriente', formatValue(cab.value,'BN.CAB.XOKA.GD.ZS'), 'Saldo agregado del sector externo'],
            ['USD referencias', `${runtimeFX[country.currency]?.rate?.toLocaleString('es-PE',{maximumFractionDigits:2,minimumFractionDigits:2})||'N/D'} ${country.currency}`, 'Referencia cambiaria por 1 USD']
          ]
        }
      ];
    }
    const carouselPause=new Set();
    const reducedMotionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');
    // Rebuilds slide content; only needed when the underlying data or selection changes.
    function renderInsightCarousel(resetIndex=false){
      const track=document.getElementById('insightTrack');
      const dots=document.getElementById('carouselDots');
      if(!track || !dots) return;
      const slides=buildInsightSlides();
      if(resetIndex) state.carouselIndex=0;
      track.innerHTML=slides.map((slide,i)=>`<div class="insight-slide" role="group" aria-roledescription="slide" aria-label="${i+1} de ${slides.length}"><div class="insight-copy premium-ring"><div class="insight-overline">${slide.overline}</div><h3 class="insight-title">${slide.title}</h3><p class="insight-text">${slide.text}</p><div class="insight-meta">${slide.chips.map(c=>`<span class="meta-chip">${c}</span>`).join('')}</div></div><div class="insight-side"><div class="signal-board premium-ring"><div class="signal-header"><div><strong>Radar ejecutivo</strong><span>Lecturas resumidas del país seleccionado</span></div><span class="text-chip">Slide ${i+1}/${slides.length}</span></div><div class="signal-list">${slide.signals.map(([k,v,s])=>`<div class="signal-item"><div class="signal-key"><strong>${k}</strong><span>${s}</span></div><div class="signal-value">${v}</div></div>`).join('')}</div></div><div class="data-note" style="margin-top:0">La narrativa se actualiza automáticamente cuando cambias de país, benchmark o periodo.</div></div></div>`).join('');
      dots.innerHTML=slides.map((_,i)=>`<button type="button" class="carousel-dot" data-index="${i}" aria-label="Ir a slide ${i+1}"></button>`).join('');
      goToSlide(state.carouselIndex);
    }
    // Moves between already-rendered slides without touching their markup.
    function goToSlide(index){
      const track=document.getElementById('insightTrack');
      const slides=track?[...track.children]:[];
      if(!slides.length) return;
      state.carouselIndex=((index%slides.length)+slides.length)%slides.length;
      track.style.transform=`translateX(-${state.carouselIndex*100}%)`;
      slides.forEach((el,i)=>el.setAttribute('aria-hidden',String(i!==state.carouselIndex)));
      document.querySelectorAll('#carouselDots .carousel-dot').forEach((btn,i)=>{
        btn.classList.toggle('is-active',i===state.carouselIndex);
        if(i===state.carouselIndex)btn.setAttribute('aria-current','true');else btn.removeAttribute('aria-current');
      });
    }
    function moveCarousel(step=1){goToSlide(state.carouselIndex+step);}
    // Autoplay only while the carousel is visible, not hovered/focused and motion is allowed (WCAG 2.2.2).
    function restartCarouselAuto(){
      clearInterval(state.carouselTimer);
      state.carouselTimer=null;
      if(reducedMotionQuery.matches || carouselPause.size || document.hidden || state.activeTab!=='overview') return;
      state.carouselTimer=setInterval(()=>moveCarousel(1),6500);
    }
    function setupCarousel(){
      const box=document.getElementById('insightCarousel');
      if(!box) return;
      let startX=0;
      box.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
      box.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX; if(Math.abs(dx)>40){moveCarousel(dx>0?-1:1); restartCarouselAuto();}},{passive:true});
      document.getElementById('carouselDots')?.addEventListener('click',e=>{
        const btn=e.target.closest('.carousel-dot');
        if(btn){goToSlide(Number(btn.dataset.index));restartCarouselAuto();}
      });
      const pause=reason=>{carouselPause.add(reason);restartCarouselAuto();};
      const resume=reason=>{carouselPause.delete(reason);restartCarouselAuto();};
      box.addEventListener('mouseenter',()=>pause('hover'));
      box.addEventListener('mouseleave',()=>resume('hover'));
      box.addEventListener('focusin',()=>pause('focus'));
      box.addEventListener('focusout',e=>{if(!box.contains(e.relatedTarget))resume('focus');});
      document.addEventListener('visibilitychange',restartCarouselAuto);
      reducedMotionQuery.addEventListener?.('change',restartCarouselAuto);
    }

    function updateScrollProgress(){
      const el=document.documentElement;
      const scrollable=Math.max(1, el.scrollHeight - el.clientHeight);
      const pct=Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100));
      const bar=document.getElementById('scrollProgressBar');
      if(bar) bar.style.width=`${pct}%`;
    }
    function setupHeroScrollCue(){
      const cue=document.getElementById('heroScrollCue');
      const target=document.getElementById('overviewFilters');
      if(!cue || !target) return;
      target.tabIndex = -1;
      cue.addEventListener('click',()=>{
        const stickyHeight = [...document.querySelectorAll('.topbar,.mobile-nav')]
          .filter(el=>getComputedStyle(el).position==='sticky' && el.getBoundingClientRect().height>0)
          .reduce((sum,el)=>sum+el.getBoundingClientRect().height,0);
        target.focus({preventScroll:true});
        window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-stickyHeight-12,
          behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      });
    }
    function setupParallaxCards(){
      document.querySelectorAll('.page-heading,.executive').forEach(el=>{
        el.addEventListener('pointermove',e=>{
          if(window.innerWidth < 900) return;
          const r=el.getBoundingClientRect();
          const px=((e.clientX-r.left)/r.width - .5) * 2;
          const py=((e.clientY-r.top)/r.height - .5) * 2;
          el.style.setProperty('--mx', `${px * 2.2}deg`);
          el.style.setProperty('--my', `${py * 1.8}deg`);
        });
        el.addEventListener('pointerleave',()=>{el.style.setProperty('--mx','0deg');el.style.setProperty('--my','0deg');});
      });
    }
    function setupRevealAnimations(){
      if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));return;}
      const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}})},{threshold:.16});
      document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
    }

    // ============================================================================
    // 3. LIVE WORLD BANK API & FX API FETCHER
    // ============================================================================
    async function syncLiveWorldBankData(showNotification = false) {
      const token = ++state.syncToken;
      const syncBtn = document.getElementById('syncApiBtn');
      const syncIcon = document.getElementById('syncIcon');
      const badgeDot = document.getElementById('apiStatusDot');
      const badgeText = document.getElementById('apiStatusText');
      const latencyBadge = document.getElementById('inspectorLatencyBadge');
      const start = performance.now();
      syncBtn.disabled = true;
      syncIcon.classList.add('spinner');
      badgeText.textContent = 'Consultando API...';
      badgeDot.className = 'status-dot';
      const countries = Object.keys(COUNTRIES);
      const ids = Object.keys(INDICATORS);
      const controller = new AbortController();
      const timeout = setTimeout(()=> controller.abort(), 14000);
      let macroSuccess = 0, fxSuccess = false, rawSample = null;
      let fxUpdated = null;
      const endpoints = [];
      try {
        const tasks = ids.map(ind=> {
          const url = `https://api.worldbank.org/v2/country/${countries.join(';')}/indicator/${ind}?date=2014:${YEARS.at(-1)}&format=json&per_page=250`;
          endpoints.push(url);
          return loadWdiSeries(url,ind,showNotification).then(data=> {
            if(token!==state.syncToken)return;
            macroSuccess++;
            wdiFetchedAt[ind]=data.fetchedAt;
            if(!rawSample)rawSample=data.rows.slice(0,3);
            // Replace the entire series: an API null must never silently become a fallback number.
            countries.forEach(country=>{
              runtimeDB[country][ind]={};
              ((runtimeSource[country] ||= {})[ind])={};
            });
            data.rows.forEach(entry=>{
              const country=entry.countryiso3code,year=String(entry.date);
              if(COUNTRIES[country]&&YEARS.includes(year)){
                runtimeDB[country][ind][year]=entry.value;
                runtimeSource[country][ind][year]='wdi';
              }
            });
          }).catch(()=>null);
        });
        endpoints.push(FX_URL);
        tasks.push(loadFxRates(runtimeFX,controller.signal).then(result=>{
          fxSuccess=result.success;fxUpdated=result.updated;
        }));
        await Promise.all(tasks);
      } finally { clearTimeout(timeout); }
      if (token!==state.syncToken) return;
      state.liveMacroSuccess=macroSuccess;
      state.liveFxSuccess=fxSuccess;
      state.fxUpdated=fxUpdated;
      state.lastEndpoints=endpoints;
      state.sampleRawJson = macroSuccess ? rawSample : null;
      const ms=Math.round(performance.now()-start);
      syncBtn.disabled=false;
      syncIcon.classList.remove('spinner');
      badgeText.textContent=macroSuccess===ids.length?'Banco Mundial conectado':macroSuccess>0?'Conexión parcial · WDI':'Respaldo local — no actualizado';
      badgeDot.className=macroSuccess?'status-dot online':'status-dot cache';
      latencyBadge.textContent=macroSuccess?`${macroSuccess}/${ids.length} indicadores · ${ms} ms`:'Sin respuesta API · respaldo local';
      document.getElementById('lastUpdatedLabel').textContent=`Consulta: ${new Date().toLocaleString('es-PE',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}`;
      const fxBadge=document.getElementById('fxStatusBadge');
      fxBadge.textContent=fxSuccess ? `Cotización API · ${fxUpdated?new Date(fxUpdated).toLocaleDateString('es-PE'):'fecha no especificada'}` : 'Valores de respaldo · no vigentes';
      renderAll();
      if(showNotification) showToast(macroSuccess ? `Datos del Banco Mundial consultados (${macroSuccess}/${ids.length} series)` : 'Sin conexión a la API; se muestran datos históricos de respaldo',macroSuccess>0);
    }

    // ============================================================================
    // 4. RENDERING FUNCTIONS
    // ============================================================================
    function renderExecutiveBanner() {
      const country=COUNTRIES[state.country], benchmark=COUNTRIES[state.benchmark];
      const gdp=getLatestYearAndValue(state.country,'NY.GDP.MKTP.KD.ZG');
      const inf=getLatestYearAndValue(state.country,'FP.CPI.TOTL.ZG');
      const uem=getLatestYearAndValue(state.country,'SL.UEM.TOTL.ZS');
      const gdpB=getLatestYearAndValue(state.benchmark,'NY.GDP.MKTP.KD.ZG');
      const sameYear = gdp.year===gdpB.year;
      const comp = sameYear && Number.isFinite(gdpB.value) ? `Frente a ${benchmark.name}, la diferencia en ${gdp.year} es de ${formatDelta(gdp.value-gdpB.value,'NY.GDP.MKTP.KD.ZG')}.` : `Los datos de ${benchmark.name} tienen un corte diferente; consulta el gráfico para comparar años comunes.`;
      document.getElementById('summaryYearTag').textContent=`Crecimiento: ${gdp.year} · IPC: ${inf.year}`;
      document.getElementById('executiveHeadline').textContent=`${country.flag} ${country.name} registra un crecimiento del PBI de ${formatValue(gdp.value,'NY.GDP.MKTP.KD.ZG')} (${gdp.year})`;
      document.getElementById('executiveNarrative').textContent=`${comp} La inflación alcanza ${formatValue(inf.value,'FP.CPI.TOTL.ZG')} (${inf.year}) y el desempleo ${formatValue(uem.value,'SL.UEM.TOTL.ZS')} (${uem.year}). Estas cifras son anuales y pueden corresponder a ejercicios distintos; no son un reporte en tiempo real.`;
      const years=getFilteredYears();
      document.getElementById('headingPeriod').textContent=years.length?`Serie anual · ${years[0]}–${years.at(-1)}`:'Serie sin registros';
      document.getElementById('tableCountrySubtitle').textContent=`${country.flag} ${country.name} · observaciones anuales por indicador y año.`;
    }

    function sparkSvg(code) {
      const years=getFilteredYears();
      const vals=years.map(y=>runtimeDB[state.country]?.[code]?.[y]).filter(Number.isFinite);
      if(vals.length<2)return '';
      let min=Math.min(...vals),max=Math.max(...vals);if(min===max){min-=1;max+=1;}
      const coords=vals.map((v,i)=>`${(i/(vals.length-1)*82+2).toFixed(1)},${(34-(v-min)/(max-min)*27).toFixed(1)}`).join(' ');
      const hue=vals.at(-1)>=vals.at(-2)?'var(--teal)':'var(--blue)';
      return `<svg class="kpi-spark" viewBox="0 0 87 38" aria-hidden="true"><polyline points="${coords}" fill="none" stroke="${hue}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${coords.split(' ').at(-1).split(',')[0]}" cy="${coords.split(' ').at(-1).split(',')[1]}" r="3.5" fill="${hue}" stroke="var(--paper)" stroke-width="1.8"/></svg>`;
    }
    function renderKpiCards() {
      const node=document.getElementById('kpiGrid');
      const indicator=INDICATORS[state.activeIndicator];
      document.getElementById('activeIndicatorBadge').textContent=`Explorando: ${indicator.title}`;
      node.innerHTML='';
      Object.entries(INDICATORS).forEach(([code,meta])=>{
        const latest=getLatestYearAndValue(state.country,code);
        const benchmark=getLatestYearAndValue(state.benchmark,code);
        const prevDelta=Number.isFinite(latest.prevValue)?latest.value-latest.prevValue:null;
        const equalYear=latest.year===benchmark.year;
        const pill= prevDelta===null ? 'Sin referencia' : Math.abs(prevDelta)<0.05 ? 'Sin cambio' : prevDelta>0 ? 'En aumento' : 'En descenso';
        // Color the change by whether it is good for this indicator (e.g. rising inflation or unemployment is negative).
        const deltaCls= prevDelta===null || Math.abs(prevDelta)<0.05 ? 'neutral' : (prevDelta>0)===(meta.goodDirection==='high') ? 'positive' : 'negative';
        const card=document.createElement('button');
        card.type='button';
        card.className='kpi-card'+(state.activeIndicator===code?' active-kpi':'');
        card.setAttribute('aria-pressed',String(state.activeIndicator===code));
        card.setAttribute('aria-label',`Explorar ${meta.title}: ${formatValue(latest.value,code)} en ${latest.year}`);
        card.innerHTML=`<span class="kpi-top"><span class="kpi-col"><span class="kpi-title">${meta.title}</span><span class="kpi-number">${formatValue(latest.value,code)}</span><span class="kpi-year">Último dato: ${latest.year} · ${meta.unit} · Extracción: ${wdiFetchedAt[code]||FALLBACK_EXTRACTED_AT[code]||'no registrada'}${cellSource(state.country,code,latest.year)==='fallback'&&latest.year!=='N/D'?' · Respaldo local — no actualizado':''}</span></span><span class="status-pill neutral">${pill}</span></span><span class="kpi-bottom"><span class="kpi-col"><span class="kpi-delta ${deltaCls}">${prevDelta===null?'Variación N/D':formatDelta(prevDelta,code)}</span><span class="kpi-benchmark">${latest.prevYear ? 'vs. '+latest.prevYear : 'Año previo N/D'} · ${COUNTRIES[state.benchmark].flag} ${equalYear?formatValue(benchmark.value,code):'corte diferente'}</span></span>${sparkSvg(code)}</span>`;
        card.addEventListener('click',()=>{state.activeIndicator=code;document.getElementById('indicatorSelectChart').value=code;renderKpiCards();renderCharts();});
        node.appendChild(card);
      });
    }

    function renderDecisionMatrix() {
      const node=document.getElementById('decisionCardsContainer');
      const indicators=[['NY.GDP.MKTP.KD.ZG','Actividad y capacidad operativa','La evolución del crecimiento puede alterar la demanda y los planes de inversión. Contrasta el dato con tus ventas y el desempeño sectorial.'],['FP.CPI.TOTL.ZG','Precios y costos','Una variación del IPC puede influir en costos y poder adquisitivo. Evalúa contratos, proveedores y elasticidades antes de cambiar precios.'],['BN.CAB.XOKA.GD.ZS','Exposición externa','El saldo en cuenta corriente ayuda a contextualizar el sector externo, pero no predice por sí solo el tipo de cambio ni determina una cobertura específica.']];
      node.innerHTML=indicators.map(([code,title,advice],i)=>{
        const x=getLatestYearAndValue(state.country,code);
        return `<div class="decision-item"><div class="decision-item-top"><strong>${String(i+1).padStart(2,'0')} / ${title}</strong><span class="status-pill neutral">${formatValue(x.value,code)} · ${x.year}</span></div><p>${advice}</p></div>`;
      }).join('');
    }

    // ============================================================================
    // 5. TAB 2: FX GRID & IS–LM–BP / MUNDELL–FLEMING SIMULATOR
    // ============================================================================
    function renderFxGrid() {
      const container=document.getElementById('fxGrid');
      container.innerHTML=Object.values(runtimeFX).map(item=>`<div class="fx-card"><div class="fx-caption"><span class="fx-code">USD / ${item.code}</span><span class="fx-flag" aria-hidden="true">${item.flag}</span></div><div class="fx-rate">${item.rate.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}</div><div class="fx-currency">${item.name}</div></div>`).join('');
    }

    // ---------------------------------------------------------------------------
    // IS–LM–BP / Mundell–Fleming simulator (model in js/islm-model.js)
    // ---------------------------------------------------------------------------
    // Illustrative assumptions per country: neutral real rate (baseline nominal rate = inflation target + this)
    // and institutional context that the textbook model does not capture.
    // ============================================================================
    // 6. TAB 3: DATA TABLE, CSV EXPORT & API INSPECTOR
    // ============================================================================
    function renderDataTableAndInspector() {
      const filtered=YEARS.slice().reverse().filter(y=>Object.values(INDICATORS).some(meta=>Number.isFinite(runtimeDB[state.country]?.[meta.code]?.[y])));
      const rows=filtered.filter(y=>y.includes(state.tableFilter.trim()));
      const tbody=document.getElementById('macroTableBody');
      if(!rows.length){tbody.innerHTML='<tr><td colspan="7" class="table-empty">No se encontraron registros para el año indicado.</td></tr>';} else {
        tbody.innerHTML=rows.map(y=>{
          const codes=Object.keys(INDICATORS);
          const vals=codes.map(code=>runtimeDB[state.country]?.[code]?.[y]);
          return `<tr><td>${y}</td>${vals.map((val,i)=>{
            const tone=i===0||i===5?(Number.isFinite(val)?val>=0?'value-pos':'value-neg':''):i===3?'value-blue':'';
            const fallback=Number.isFinite(val)&&cellSource(state.country,codes[i],y)==='fallback';
            return `<td class="${tone}${fallback?' cell-fallback':''}"${fallback?' title="Respaldo local: no confirmado por la API en esta sesión"':''}>${formatValue(val,codes[i])}</td>`;
          }).join('')}</tr>`;
        }).join('');
      }
      document.getElementById('endpointList').innerHTML=state.lastEndpoints.length ? state.lastEndpoints.map(url=>`<li>${url.replaceAll('&','&amp;').replaceAll('<','&lt;')}</li>`).join('') : '<li>No se ha realizado ninguna consulta todavía.</li>';
      document.getElementById('rawJsonPreview').textContent=state.sampleRawJson?JSON.stringify(state.sampleRawJson,null,2):'Sin muestra de API. Se están mostrando datos locales de respaldo.';
    }
    function exportCsv() {
      const codes=Object.keys(INDICATORS);
      // Each indicator gets a companion "<code>_fuente" column: wdi (live API) or respaldo (local fallback).
      const headers=['Anio','Pais',...codes.flatMap(k=>[k,`${k}_fuente`])];
      const sourceLabel=(code,y)=>Number.isFinite(runtimeDB[state.country]?.[code]?.[y])?(cellSource(state.country,code,y)==='wdi'?'wdi':'respaldo'):'';
      const lines=[headers.join(','),...YEARS.filter(y=>codes.some(code=>Number.isFinite(runtimeDB[state.country]?.[code]?.[y]))).reverse().map(y=>[y,`"${COUNTRIES[state.country].name}"`,...codes.flatMap(code=>[runtimeDB[state.country]?.[code]?.[y]??'',sourceLabel(code,y)])].join(','))];
      const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;
      a.download=`macroscope_${state.country}_${YEARS[0]}_${YEARS.at(-1)}.csv`;
      document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
      showToast(`CSV exportado: ${COUNTRIES[state.country].name}`);
    }

    function copyExecutiveBrief() {
      const headline = document.getElementById('executiveHeadline')?.textContent || '';
      const narrative = document.getElementById('executiveNarrative')?.textContent || '';
      const textToCopy = `LECTURA ECONÓMICA\n${headline}\n${narrative}\nFuente: World Bank Open Data (WDI), corte anual por indicador`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast('Resumen ejecutivo copiado al portapapeles');
        }).catch(() => fallbackCopy(textToCopy));
      } else {
        fallbackCopy(textToCopy);
      }
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        showToast('Resumen ejecutivo copiado al portapapeles');
      } catch (e) {
        showToast('No se pudo copiar automáticamente', false);
      }
      document.body.removeChild(ta);
    }

    // A country cannot be compared with itself: disable it in the benchmark list and move away if selected.
    function syncBenchmarkOptions() {
      const select=document.getElementById('benchmarkSelect');
      if(!select) return;
      [...select.options].forEach(opt=>{opt.disabled=opt.value===state.country;});
      if(state.benchmark===state.country){
        state.benchmark=state.country==='LCN'?'USA':'LCN';
        select.value=state.benchmark;
      }
    }


  Object.assign(M, { buildInsightSlides, copyExecutiveBrief, exportCsv, fallbackCopy, getFilteredYears, getLatestYearAndValue, goToSlide, moveCarousel, renderDataTableAndInspector, renderDecisionMatrix, renderExecutiveBanner, renderFxGrid, renderHeroPanels, renderInsightCarousel, renderKpiCards, restartCarouselAuto, setTheme, setupCarousel, setupHeroScrollCue, setupParallaxCards, setupRevealAnimations, showToast, sparkSvg, syncBenchmarkOptions, syncLiveWorldBankData, updateRangeStyles, updateScrollProgress });
})();
