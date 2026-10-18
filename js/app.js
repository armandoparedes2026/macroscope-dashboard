(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { state } = M;
  // Resolve cross-view callbacks when invoked, after every deferred script has loaded.
  const copyExecutiveBrief = (...args) => M.copyExecutiveBrief(...args);
  const exportCsv = (...args) => M.exportCsv(...args);
  const loadBcrp = (...args) => M.loadBcrp(...args);
  const renderCharts = (...args) => M.renderCharts(...args);
  const renderDataTableAndInspector = (...args) => M.renderDataTableAndInspector(...args);
  const renderDecisionMatrix = (...args) => M.renderDecisionMatrix(...args);
  const renderExecutiveBanner = (...args) => M.renderExecutiveBanner(...args);
  const renderFxGrid = (...args) => M.renderFxGrid(...args);
  const renderHeroPanels = (...args) => M.renderHeroPanels(...args);
  const renderInsightCards = (...args) => M.renderInsightCards(...args);
  const renderIslm = (...args) => M.renderIslm(...args);
  const renderKpiCards = (...args) => M.renderKpiCards(...args);
  const setTheme = (...args) => M.setTheme(...args);
  const setupIslm = (...args) => M.setupIslm(...args);
  const setupRevealAnimations = (...args) => M.setupRevealAnimations(...args);
  const syncBenchmarkOptions = (...args) => M.syncBenchmarkOptions(...args);
  const syncLiveWorldBankData = (...args) => M.syncLiveWorldBankData(...args);
  const updateScrollProgress = (...args) => M.updateScrollProgress(...args);
  M.LAB_CONTENT = globalThis.LAB_CONTENT;
  delete globalThis.ISLM;
  delete globalThis.LAB_CONTENT;
    function renderAll() {
      renderExecutiveBanner();renderHeroPanels();renderInsightCards();renderKpiCards();renderDecisionMatrix();renderCharts();renderFxGrid();renderIslm();renderDataTableAndInspector();
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
      M.setupStudentViews();
      document.getElementById('themeBtn').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
      const mode=document.documentElement.dataset.theme;
      document.documentElement.dataset.theme = mode === 'light' ? 'light' : 'dark';
      document.getElementById('themeIcon').setAttribute('href', mode === 'light' ? '#i-moon' : '#i-sun');
      document.querySelectorAll('.reveal').forEach((el,i)=>el.style.setProperty('--reveal-delay', `${Math.min(i*70,420)}ms`));
      renderAll(); updateScrollProgress(); setupRevealAnimations(); syncLiveWorldBankData(false); loadBcrp();
      window.addEventListener('scroll', updateScrollProgress, {passive:true});
      // Keep the sticky mobile nav right below the topbar, whatever its rendered height.
      const topbar=document.querySelector('.topbar');
      if(topbar && typeof ResizeObserver!=='undefined'){
        new ResizeObserver(()=>document.documentElement.style.setProperty('--topbar-h',`${topbar.offsetHeight}px`)).observe(topbar);
      }
    });



  Object.assign(M, { renderAll });
})();
