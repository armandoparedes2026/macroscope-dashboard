(function(){
  'use strict';
  const M=globalThis.MacroScope ||= {};
  let activeArea='activity';
  let mainChart=null,sideChart=null;
  let miniCharts=[];
  let showExtras=false,frequencyFilter='all',sourceFilter='all',gdpMode='level';
  let focusedCardId=null;
  const AREA={
    activity:{label:'Actividad',main:'gdp',side:'inflation'},
    prices:{label:'Precios',main:'inflation',side:'fx'},
    labor:{label:'Mercado laboral',main:'unemployment',side:'gdp'},
    external:{label:'Sector externo',main:'trade',side:'fx'}
  };
  const SYMBOL={
    gdp:'<path d="M4 20V11h4v9M10 20V4h4v16M16 20v-8h4v8"/>',
    inflation:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/>',
    unemployment:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="7" r="2.5"/><path d="M2.5 20v-3c0-4 11-4 11 0v3m2-8c3-.2 6 1.2 6 4v4"/>',
    fx:'<path d="M4 8h16l-4-4m4 4-4 4M20 16H4l4-4m-4 4 4 4"/>',
    trade:'<rect x="3" y="10" width="8" height="10" rx="1"/><rect x="13" y="6" width="8" height="14" rx="1"/><path d="M2 20h20M7 7V3m0 0-3 3m3-3 3 3M17 3v8m0 0-3-3m3 3 3-3"/>',
    confidence:'<path d="M3 18 9 12l4 3 8-10M16 5h5v5"/><path d="M3 21h18"/>',
    policy:'<path d="M3 18h18M5 14l5-5 4 3 5-7M16 5h3v3"/>',
    reserves:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v13c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'
  };
  const get=id=>document.getElementById(id);
  const formatNumber=(n,dec=1)=>Number.isFinite(n)?n.toLocaleString('es-PE',{minimumFractionDigits:dec,maximumFractionDigits:dec}):'N/D';
  function decimals(card){return ['trade','reserves'].includes(card.id)||card.unit==='US$'?0:card.id==='fx'&&card.code==='PN01207PM'?3:card.id==='inflation'?2:1;}
  function displayPeriod(card){
    if(!card.period)return 'Sin periodo';
    if(card.frequency==='annual')return card.period;
    const [year,month]=card.period.split('-').map(Number);
    if(card.frequency==='quarterly')return `T${Math.ceil(month/3)} ${year}`;
    const date=new Date(Date.UTC(year,month-1,1));
    return date.toLocaleDateString('es-PE',{month:'short',year:'numeric',timeZone:'UTC'}).replace('.','');
  }
  function shortStatus(card){return card.status==='live'?`${card.provider==='BCRP'?'BCRP':'WDI'} · API`:card.status==='fallback'?'Respaldo histórico':'Sin dato';}
  function spark(series,width=120,height=36){
    const data=series.filter(point=>Number.isFinite(point.value)).slice(-20);
    if(data.length<2)return `<svg class="p-kpi-spark" viewBox="0 0 ${width} ${height}" aria-hidden="true"></svg>`;
    const values=data.map(p=>p.value),min=Math.min(...values),max=Math.max(...values),range=max-min||1;
    const points=data.map((p,i)=>[2+(width-4)*i/(data.length-1),height-5-(height-11)*(p.value-min)/range]);
    const line=points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const fill=`${line} L${points.at(-1)[0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
    return `<svg class="p-kpi-spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true"><path class="fill" d="${fill}"/><path class="line" d="${line}"/></svg>`;
  }
  function chartSeries(card){
    const n=M.state.period==='all'?Infinity:Number(M.state.period)*(card.frequency==='annual'?1:card.frequency==='quarterly'?4:12);
    return card.series.slice(-n);
  }
  function renderCards(cards){
    const root=get('panoramaKpis');if(!root)return;
    const selected=cards.filter(card=>(frequencyFilter==='all'||card.frequency===frequencyFilter)&&(sourceFilter==='all'||(sourceFilter==='BCRP'?card.provider==='BCRP':card.provider!=='BCRP')));
    root.setAttribute('aria-label',`${selected.length} indicadores macroeconómicos visibles`);
    root.innerHTML=selected.map(card=>{
      const value=Number.isFinite(card.value)?formatNumber(card.value,decimals(card)):'N/D';
      const delta=card.delta;
      const deltaString=Number.isFinite(delta)?`${delta>0?'+':''}${formatNumber(delta,card.id==='fx'?3:1)} ${card.deltaUnit}`:'Sin variación comparable';
      const changeClass=!Number.isFinite(delta)||Math.abs(delta)<.00001?'flat':delta>0?'up':'down';
      const period=displayPeriod(card);
      const active=(focusedCardId||AREA[activeArea].main)===card.id;
      return `<div class="p-kpi-slot"><button type="button" class="p-kpi" data-panorama-card="${card.id}" aria-pressed="${active}" aria-label="Explorar ${card.title}: ${value} ${card.unit}, ${period}">
        <span class="p-kpi-head"><span class="p-kpi-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${SYMBOL[card.id]}</svg></span><span class="p-kpi-title">${card.title}</span></span>
        <span class="p-kpi-desc">${card.description}</span>
        <span class="p-kpi-value-row"><span class="p-kpi-value">${value}${card.unit==='%'?' %':''}</span><span class="p-kpi-delta ${changeClass}" title="Variación frente al periodo anterior comparable">${Number.isFinite(delta)?deltaString:'—'}</span></span>
        <span class="p-kpi-meta"><span>${period}</span>${spark(chartSeries(card))}</span>
      </button><a class="p-kpi-source-link" href="${card.sourceUrl}" target="_blank" rel="noopener noreferrer" aria-label="Abrir fuente de ${card.title}" title="${card.provider} · ${card.code} · extracción: ${card.extractedAt?new Date(card.extractedAt).toLocaleDateString('es-PE'):'no confirmada'} · ${card.aggregation||card.frequency}"><span class="p-kpi-tag">${shortStatus(card)}</span><span aria-hidden="true">↗</span></a></div>`;
    }).join('');
    if(!selected.length)root.innerHTML='<div class="p-kpi-no-results">No hay indicadores disponibles con la frecuencia y fuente elegidas. Cambia los filtros para continuar.</div>';
  }
  function makeChart(canvasId,emptyId,oldChart,card,{trend=false,targets=false}={}){
    oldChart?.destroy();
    const canvas=get(canvasId),empty=get(emptyId);
    if(!canvas||!empty)return null;
    const points=chartSeries(card);
    const hasData=points.some(p=>Number.isFinite(p.value));
    canvas.hidden=!hasData;empty.hidden=hasData;
    if(!hasData)return null;
    if(typeof globalThis.Chart!=='function'){
      canvas.hidden=true;
      empty.hidden=false;
      empty.textContent='El módulo gráfico no está disponible. Los valores oficiales siguen visibles en las tarjetas.';
      return null;
    }
    const tickEvery=Math.max(1,Math.ceil(points.length/(canvasId==='panoramaSideChart'?5:9)));
    const labels=points.map((point,i)=>i%tickEvery===0||i===points.length-1?displayPeriod({...card,period:point.date}):'');
    const isLine=card.id!=='unemployment';
    const color=getComputedStyle(get('tab-overview')).getPropertyValue('--p-blue').trim()||'#277aff';
    const datasets=[{label:card.title, data:points.map(p=>p.value), borderColor:color,
        backgroundColor:isLine?'rgba(55,133,244,.13)':'rgba(70,146,254,.62)',borderWidth:isLine?2.5:1.3,
        fill:isLine,tension:.25,spanGaps:false,pointRadius:points.length>45?0:2,pointHoverRadius:5,maxBarThickness:24}];
    if(trend&&points.length>=12){
      datasets.push({label:'Promedio móvil de doce meses (calculado)',data:points.map((point,i)=>{
        if(i<11)return null;
        const window=points.slice(i-11,i+1);return window.every(p=>Number.isFinite(p.value))?window.reduce((sum,p)=>sum+p.value,0)/12:null;
      }),borderColor:'#9ec1fa',borderDash:[5,5],borderWidth:1.6,pointRadius:0,fill:false,tension:.2,spanGaps:false});
    }
    if(targets)for(const bound of [1,3])datasets.push({label:`Referencia de meta BCRP: ${bound} %`,data:points.map(()=>bound),borderColor:'#9fc3fc',borderDash:[5,5],borderWidth:1,pointRadius:0,fill:false,tension:0});
    return new globalThis.Chart(canvas,{
      type:isLine?'line':'bar',
      data:{labels,datasets},
      options:{responsive:true,maintainAspectRatio:false,premiumPanorama:true,animation:{duration:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:450},
        interaction:{mode:'nearest',intersect:false},plugins:{legend:{display:false},tooltip:{callbacks:{title:items=>items?.[0]?displayPeriod({...card,period:points[items[0].dataIndex].date}):'',label:item=>`${item.dataset.label}: ${formatNumber(item.parsed?.y??item.raw,decimals(card))} ${card.unit}`}}},
        scales:{x:{grid:{display:false},ticks:{color:'#8195b4',maxTicksLimit:9,maxRotation:0,font:{size:10}}},y:{beginAtZero:false,grid:{color:'rgba(118,161,222,.15)',drawBorder:false},ticks:{color:'#8195b4',maxTicksLimit:6,font:{size:10}}}}}
    });
  }
  function renderReadings(cards){
    const find=id=>cards.find(c=>c.id===id);
    const gdp=find('gdp'),inf=find('inflation'),labor=find('unemployment'),trade=find('trade');
    const fmt=c=>Number.isFinite(c?.value)?`${formatNumber(c.value,decimals(c))} ${c.unit} (${displayPeriod(c)})`:'dato no disponible';
    const readings=[
      {title:'Actividad económica',body:`${gdp.title}: ${fmt(gdp)}. Variación observada, sin inferencia causal.`},
      {title:'Evolución de precios',body:`${inf.title}: ${fmt(inf)}. ${inf.provider==='BCRP'?'IPC de Lima en doce meses.':'IPC promedio anual.'}`},
      {title:'Mercado laboral',body:`${labor.title}: ${fmt(labor)}. Estimación nacional OIT, no desempleo urbano INEI.`},
      {title:'Sector externo',body:`${trade.title}: ${fmt(trade)}. ${trade.aggregation?'Acumulado calculado de 12 meses completos.':'Confirma unidad y periodo comparado.'}`}
    ];
    get('panoramaReadingHighlight').textContent=`Actividad ${fmt(gdp)} · inflación ${fmt(inf)}. Las series tienen fechas de publicación distintas.`;
    get('panoramaInsights').innerHTML=readings.map((item,i)=>`<div class="p-reading-item"><span class="p-reading-number">${i+1}</span><div><strong>${item.title}</strong><p>${item.body}</p></div></div>`).join('');
  }
  function renderMinis(cards){
    const ids=['unemployment','trade','fx'];
    get('panoramaMinis').innerHTML=ids.map(id=>{
      const c=cards.find(x=>x.id===id);
      const value=Number.isFinite(c.value)?`${formatNumber(c.value,decimals(c))} ${c.unit}`:'N/D';
      const heading=id==='unemployment'?'Mercado laboral':id==='trade'?'Sector externo':c.title;
      const description=id==='trade'&&c.provider==='BCRP'?'Saldo mensual, exportaciones e importaciones FOB':c.description;
      return `<article class="p-mini"><div class="p-mini-top"><div><strong>${heading}</strong><span>${description}</span></div><div class="p-mini-val">${value}</div></div><div class="p-mini-chart"><canvas id="panoramaMini${id}Chart" role="img" aria-label="Evolución de ${c.title}"></canvas><div class="p-chart-empty" id="panoramaMini${id}Empty" hidden>Sin datos para graficar.</div></div><div class="p-mini-footer"><span>${displayPeriod(c)}</span><span>${shortStatus(c)}</span></div></article>`;
    }).join('');
  }
  function drawMiniCharts(cards){
    miniCharts.forEach(chart=>chart?.destroy());miniCharts=[];
    const dark=document.documentElement.dataset.theme==='dark';
    const primary=getComputedStyle(get('tab-overview')).getPropertyValue('--p-blue').trim()||'#277aff';
    for(const id of ['unemployment','trade','fx']){
      const c=cards.find(item=>item.id===id),canvas=get(`panoramaMini${id}Chart`),empty=get(`panoramaMini${id}Empty`);
      if(!canvas||!empty)continue;
      const points=chartSeries(c).filter(point=>point&&point.date).slice(-(id==='unemployment'?14:60));
      let datasets=[{label:c.title,data:points.map(p=>p.value),borderColor:primary,backgroundColor:id==='unemployment'?(dark?'rgba(110,168,255,.72)':'rgba(101,169,255,.65)'):(dark?'rgba(110,168,255,.14)':'rgba(63,141,253,.16)'),borderWidth:2,fill:id!=='unemployment',pointRadius:0,tension:.24,maxBarThickness:18}];
      if(id==='trade'&&M.state.country==='PER'){
        const exports=M.panoramaBcrp?.PN38714BM?.observations||[],imports=M.panoramaBcrp?.PN38718BM?.observations||[];
        const exp=new Map(exports.map(p=>[p.date,p.value])),imp=new Map(imports.map(p=>[p.date,p.value]));
        if(exp.size&&imp.size){
          datasets=[
            {type:'bar',label:'Saldo comercial mensual (millones US$)',data:points.map(p=>M.panoramaBcrp?.PN38723BM?.observations?.find(row=>row.date===p.date)?.value??null),backgroundColor:dark?'rgba(110,168,255,.65)':'rgba(82,155,255,.55)',borderWidth:0,maxBarThickness:14},
            {type:'line',label:'Exportaciones FOB',data:points.map(p=>exp.get(p.date)??null),borderColor:primary,borderWidth:1.8,pointRadius:0,tension:.18},
            {type:'line',label:'Importaciones FOB',data:points.map(p=>imp.get(p.date)??null),borderColor:dark?'#cadfff':'#a8c9f9',borderDash:[4,4],borderWidth:1.4,pointRadius:0,tension:.18}
          ];
        }
      }
      const hasData=datasets.some(set=>set.data.some(Number.isFinite));
      canvas.hidden=!hasData;empty.hidden=hasData;
      if(!hasData||typeof globalThis.Chart!=='function')continue;
      const every=Math.max(1,Math.ceil(points.length/5));
      const labels=points.map((point,i)=>i%every===0||i===points.length-1?displayPeriod({...c,period:point.date}):'');
      miniCharts.push(new globalThis.Chart(canvas,{type:id==='unemployment'?'bar':'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,premiumPanorama:true,animation:{duration:globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0:340},plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:'#8ba1c1',font:{size:9},maxRotation:0}},y:{beginAtZero:id==='unemployment',grid:{color:'rgba(118,161,222,.11)'},ticks:{color:'#8ba1c1',font:{size:9},maxTicksLimit:4}}}}}));
    }
  }
  function renderPanorama(){
    if(!get('panoramaKpis'))return;
    get('headingPeriod').textContent=M.state.country==='PER'
      ?'Series BCRP mensuales y trimestrales · desempleo anual OIT'
      :'Indicadores anuales del Banco Mundial · último dato disponible';
    const source={...M.runtimeSource};
    const metrics=M.buildPanoramaMetrics({country:M.state.country,wdi:M.runtimeDB,source,bcrp:M.panoramaBcrp,dates:{live:M.wdiFetchedAt,fallback:M.FALLBACK_EXTRACTED_AT}});
    const cards=metrics.cards;
    const selected=AREA[activeArea];
    const allCards=[...cards,...metrics.extras];
    if(focusedCardId&&!allCards.some(c=>c.id===focusedCardId))focusedCardId=null;
    const main=allCards.find(c=>c.id===focusedCardId)||cards.find(c=>c.id===selected.main);
    const side=cards.find(c=>c.id===(main.id===selected.side?selected.main:selected.side));
    if(M.state.country!=='PER'&&sourceFilter==='BCRP'){sourceFilter='all';get('panoramaSourceSelect').value='all';}
    get('panoramaDataBadge').textContent=M.state.country==='PER'
      ?`BCRP mensual: ${M.panoramaStatus?.monthly||'pendiente'} · trimestral: ${M.panoramaStatus?.quarterly||'pendiente'}`
      :'Banco Mundial · indicadores anuales';
    for(const button of document.querySelectorAll('[data-panorama-area]'))button.setAttribute('aria-selected',String(button.dataset.panoramaArea===activeArea));
    const more=get('panoramaMoreMetrics');
    more.hidden=!metrics.extras.length;
    more.setAttribute('aria-expanded',String(showExtras));
    more.textContent=showExtras?'Mostrar indicadores principales':`Más indicadores +${metrics.extras.length}`;
    renderCards(showExtras?[...cards,...metrics.extras]:cards);renderReadings(cards);renderMinis(cards);
    const level=M.state.country==='PER'&&main.id==='gdp'?M.getPanoramaLevelSeries(M.panoramaBcrp):null;
    const hasLevel=Boolean(level?.some(point=>Number.isFinite(point.value)));
    const toggleVisible=main.id==='gdp'&&M.state.country==='PER';
    get('panoramaLevelToggle').parentElement.hidden=!toggleVisible;
    get('panoramaLevelToggle').disabled=!hasLevel;
    get('panoramaLevelToggle').setAttribute('aria-pressed',String(gdpMode==='level'&&hasLevel));
    get('panoramaGrowthToggle').setAttribute('aria-pressed',String(gdpMode!=='level'||!hasLevel));
    const levelSeries=hasLevel&&gdpMode==='level';
    const levelRow=M.panoramaBcrp?.PN01773AM;
    const chartMain=levelSeries?{...main,title:'Evolución del PBI real',description:'Índice 2015 = 100 · serie desestacionalizada',frequency:'monthly',unit:'índice',code:'PN01773AM',series:level,period:level.findLast(p=>Number.isFinite(p.value))?.date||null,aggregation:'base promedio mensual de 2015',extractedAt:levelRow?.fetchedAt}:main;
    for(const [type,card] of [['Main',chartMain],['Side',side]]){
      get(`panorama${type}Title`).textContent=card.title;
      get(`panorama${type}Subtitle`).textContent=`${card.description} · ${card.unit}`;
      get(`panorama${type}Source`).textContent=`${card.provider} · ${card.code} · ${card.frequency==='annual'?'anual':card.frequency==='quarterly'?'trimestral':'mensual'}${card.aggregation?' · '+card.aggregation:''}${card.status==='fallback'?' · respaldo no actualizado':''}`;
    }
    get('panoramaMainPeriod').textContent=displayPeriod(chartMain);
    const view=get('tab-overview');
    if(view.hidden)return;
    mainChart=makeChart('panoramaMainChart','panoramaMainEmpty',mainChart,chartMain,{trend:levelSeries});
    sideChart=makeChart('panoramaSideChart','panoramaSideEmpty',sideChart,side,{targets:side.id==='inflation'&&side.provider==='BCRP'});
    drawMiniCharts(cards);
  }
  function setupPanorama(){
    document.querySelector('.p-segments').addEventListener('click',event=>{
      const btn=event.target.closest('[data-panorama-area]');if(!btn)return;
      activeArea=btn.dataset.panoramaArea;focusedCardId=null;renderPanorama();
    });
    document.querySelector('.p-segments').addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft'].includes(event.key))return;
      event.preventDefault();
      const buttons=[...document.querySelectorAll('[data-panorama-area]')];
      const index=buttons.findIndex(b=>b.dataset.panoramaArea===activeArea);
      const next=buttons[(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length];
      activeArea=next.dataset.panoramaArea;focusedCardId=null;next.focus();renderPanorama();
    });
    get('panoramaKpis').addEventListener('click',event=>{
      const button=event.target.closest('[data-panorama-card]');if(!button)return;
      const area=Object.keys(AREA).find(key=>AREA[key].main===button.dataset.panoramaCard)||Object.keys(AREA).find(key=>AREA[key].side===button.dataset.panoramaCard);
      if(area)activeArea=area;
      focusedCardId=button.dataset.panoramaCard;
      renderPanorama();
    });
    get('panoramaMoreMetrics').addEventListener('click',()=>{showExtras=!showExtras;if(!showExtras&&['policy','reserves'].includes(focusedCardId))focusedCardId=null;renderPanorama();});
    get('panoramaFrequencySelect').addEventListener('change',event=>{frequencyFilter=event.target.value;renderPanorama();});
    get('panoramaSourceSelect').addEventListener('change',event=>{sourceFilter=event.target.value;renderPanorama();});
    get('panoramaLevelToggle').addEventListener('click',()=>{gdpMode='level';renderPanorama();});
    get('panoramaGrowthToggle').addEventListener('click',()=>{gdpMode='growth';renderPanorama();});
    get('panoramaReportBtn').addEventListener('click',()=>window.print());
  }
  Object.assign(M,{setupPanorama,renderPanorama});
})();
