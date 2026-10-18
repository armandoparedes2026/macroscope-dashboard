(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { state } = M;
  // Resolve cross-view callbacks when invoked, after every deferred script has loaded.
  const copyExecutiveBrief = (...args) => M.copyExecutiveBrief(...args);
  const exportCsv = (...args) => M.exportCsv(...args);
  const loadBcrp = (...args) => M.loadBcrp(...args);
  const moveCarousel = (...args) => M.moveCarousel(...args);
  const renderCharts = (...args) => M.renderCharts(...args);
  const renderDataTableAndInspector = (...args) => M.renderDataTableAndInspector(...args);
  const renderDecisionMatrix = (...args) => M.renderDecisionMatrix(...args);
  const renderExecutiveBanner = (...args) => M.renderExecutiveBanner(...args);
  const renderFxGrid = (...args) => M.renderFxGrid(...args);
  const renderHeroPanels = (...args) => M.renderHeroPanels(...args);
  const renderInsightCarousel = (...args) => M.renderInsightCarousel(...args);
  const renderIslm = (...args) => M.renderIslm(...args);
  const renderKpiCards = (...args) => M.renderKpiCards(...args);
  const restartCarouselAuto = (...args) => M.restartCarouselAuto(...args);
  const setTheme = (...args) => M.setTheme(...args);
  const setupCarousel = (...args) => M.setupCarousel(...args);
  const setupHeroScrollCue = (...args) => M.setupHeroScrollCue(...args);
  const setupIslm = (...args) => M.setupIslm(...args);
  const setupParallaxCards = (...args) => M.setupParallaxCards(...args);
  const setupRevealAnimations = (...args) => M.setupRevealAnimations(...args);
  const syncBenchmarkOptions = (...args) => M.syncBenchmarkOptions(...args);
  const syncLiveWorldBankData = (...args) => M.syncLiveWorldBankData(...args);
  const updateScrollProgress = (...args) => M.updateScrollProgress(...args);
  M.LAB_CONTENT = globalThis.LAB_CONTENT;
  delete globalThis.ISLM;
  delete globalThis.LAB_CONTENT;
    function renderAll() {
      renderExecutiveBanner();renderHeroPanels();renderInsightCarousel(false);renderKpiCards();renderDecisionMatrix();renderCharts();renderFxGrid();renderIslm();renderDataTableAndInspector();
    }

    window.addEventListener('DOMContentLoaded',()=>{
      const choose=(id,value,cb)=>{const el=document.getElementById(id);el.value=value;el.addEventListener('change',e=>cb(e.target.value));};
      choose('countrySelect',state.country,val=>{
        state.country=val;
        try{localStorage.setItem('macro_country',val);}catch(e){}
        syncBenchmarkOptions();
        renderAll();
      });
      choose('benchmarkSelect',state.benchmark,val=>{state.benchmark=val;renderAll();});
      syncBenchmarkOptions();
      choose('periodSelect',state.period,val=>{state.period=val;renderExecutiveBanner();renderKpiCards();renderCharts();});
      choose('indicatorSelectChart',state.activeIndicator,val=>{state.activeIndicator=val;renderKpiCards();renderCharts();});
      document.getElementById('syncApiBtn').addEventListener('click',()=>{syncLiveWorldBankData(true);loadBcrp();});
      document.getElementById('copyBriefBtn').addEventListener('click',copyExecutiveBrief);
      document.getElementById('exportCsvBtn').addEventListener('click',exportCsv);
      document.getElementById('tableSearchInput').addEventListener('input',e=>{state.tableFilter=e.target.value;renderDataTableAndInspector();});
      setupIslm();
      function selectTab(target){
        if(!['overview','simulator','data'].includes(target))return;
        state.activeTab=target;
        restartCarouselAuto();
        document.querySelectorAll('.tab-btn').forEach(b=>{
          const current=b.dataset.tab===target;
          b.classList.toggle('is-active',current);
          if(current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
        });
        ['overview','simulator','data'].forEach(key=>{document.getElementById(`tab-${key}`).hidden=key!==target;});
        const activeView=document.getElementById(`tab-${target}`); if(activeView){activeView.style.animation='none'; requestAnimationFrame(()=>{activeView.style.animation='tabFade .52s cubic-bezier(.22,1,.36,1)';});}
        document.getElementById('topTitle').textContent=({overview:'Panorama macroeconómico',simulator:'Modelo IS–LM–BP y Mundell–Fleming',data:'Datos e inspector API'})[target];
        if(target==='overview')renderCharts();
        if(target==='simulator')renderIslm();
        window.scrollTo({top:0,behavior:'smooth'});
      }
      document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>selectTab(btn.dataset.tab)));
      document.getElementById('themeBtn').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
      document.getElementById('carouselPrev')?.addEventListener('click',()=>{moveCarousel(-1);restartCarouselAuto();});
      document.getElementById('carouselNext')?.addEventListener('click',()=>{moveCarousel(1);restartCarouselAuto();});
      let mode='dark';try{mode=localStorage.getItem('macroscope_theme')||'dark';}catch(e){}
      document.documentElement.dataset.theme = mode === 'light' ? 'light' : 'dark';
      document.getElementById('themeIcon').setAttribute('href', mode === 'light' ? '#i-moon' : '#i-sun');
      document.querySelectorAll('.reveal').forEach((el,i)=>el.style.setProperty('--reveal-delay', `${Math.min(i*70,420)}ms`));
      renderAll(); updateScrollProgress(); setupRevealAnimations(); setupCarousel(); setupHeroScrollCue(); setupParallaxCards(); restartCarouselAuto(); syncLiveWorldBankData(false); loadBcrp();
      window.addEventListener('scroll', updateScrollProgress, {passive:true});
      // Keep the sticky mobile nav right below the topbar, whatever its rendered height.
      const topbar=document.querySelector('.topbar');
      if(topbar && typeof ResizeObserver!=='undefined'){
        new ResizeObserver(()=>document.documentElement.style.setProperty('--topbar-h',`${topbar.offsetHeight}px`)).observe(topbar);
      }
    });



  Object.assign(M, { renderAll });
})();
