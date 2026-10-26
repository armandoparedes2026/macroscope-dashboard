(function () {
  'use strict';
  const M=globalThis.MacroScope;
  const {COUNTRIES,INDICATORS,YEARS,runtimeDB,runtimeSource,compareDashboardData:D}=M;
  const SERIES=['NY.GDP.MKTP.KD.ZG','FP.CPI.TOTL.ZG','SL.UEM.TOTL.ZS','NY.GDP.PCAP.CD','NE.EXP.GNFS.ZS','BN.CAB.XOKA.GD.ZS'];
  const GROUPS={all:SERIES,activity:[SERIES[0],SERIES[2],SERIES[3]],prices:[SERIES[1]],external:[SERIES[4],SERIES[5]]};
  const ICONS=['M6 23v-7m8 7V7m8 16V12m8 11V4','M3 20c6-12 10 4 16-6s8-6 14-14','M4 21h26M9 21V9m8 12V4m8 17V13','M5 24V11m8 13V6m8 18V3m8 21V14','M5 26l9-8 6 4 10-13M22 9h8v8','M5 20l7-7 7 6 10-12M22 7h7v7'];
  const PALETTE=['#1556dd','#e94c61','#09aa96','#f6b90a'];
  const POS={PER:[-75.0,-9.2],CHL:[-71.5,-33.4],COL:[-74.1,4.7],MEX:[-102.5,23.6],BRA:[-52.9,-14.2],USA:[-98.6,38.5],ARG:[-63.6,-38.4],BOL:[-64.7,-16.3],ECU:[-78.2,-1.8],URY:[-56.0,-32.5],PRY:[-58.4,-23.4],CRI:[-84.0,9.7],CHN:[103.8,35.9],JPN:[138.3,36.2],DEU:[10.5,51.2],ESP:[-3.7,40.4],CAN:[-106.3,56.1],KOR:[127.9,36.4]};
  const model={countries:['PER','CHL','COL','MEX'],indicator:SERIES[0],period:'10',group:'all',mode:'indicators',transform:'raw'};
  const charts={history:null,labor:null};
  const mapState={map:null,geo:null,markers:[],failed:false,style:null,styleReady:false,lastSelection:null,timeout:null,geometryRequested:false,handlersBound:false};
  const MAP_STYLE={light:'https://tiles.openfreemap.org/styles/positron',dark:'https://tiles.openfreemap.org/styles/dark'};
  const $=id=>document.getElementById('cd-'+id);
  const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const flag=code=>`<span class="cd-flag" data-country="${code}" role="img" aria-label="Bandera de ${escapeHTML(COUNTRIES[code].name)}"></span>`;
  const years=()=>{
    const published=YEARS.filter(y=>Number(y)<=new Date().getFullYear()-1);
    return model.period==='all'?published:published.slice(-Number(model.period));
  };
  const number=(value,digits=1)=>Number.isFinite(value)?value.toLocaleString('es-PE',{minimumFractionDigits:digits,maximumFractionDigits:digits}):'sin dato';
  const valueText=(value,code)=>{
    if(!Number.isFinite(value))return 'sin dato';
    const meta=INDICATORS[code];
    return (meta.unit.includes('US$')?'US$ ':'')+number(value,meta.decimals)+(meta.unit.includes('%')?'%':'');
  };
  const source=(country,code,year)=>runtimeSource[country]?.[code]?.[year]==='wdi'?'API WDI':'respaldo local';
  const available=Object.keys(COUNTRIES).filter(code=>!COUNTRIES[code].aggregate);
  const info=(code,selectedYears=years())=>{
    const year=D.commonLatestYear(runtimeDB,model.countries,code,selectedYears);
    return {year,ranking:D.rankCountries(runtimeDB,model.countries,code,year)};
  };

  function sparkline(country,code,selectedYears) {
    const observations=selectedYears.map(year=>runtimeDB[country]?.[code]?.[year]);
    const finite=observations.filter(Number.isFinite);
    if(!finite.length)return '<span class="cd-no-spark">—</span>';
    const low=Math.min(...finite),high=Math.max(...finite),span=high-low||1;
    const segments=[];let current=[];
    observations.forEach((value,i)=>{
      if(!Number.isFinite(value)){if(current.length)segments.push(current);current=[];return;}
      current.push(`${(i/Math.max(1,observations.length-1)*75+2).toFixed(1)},${(25-(value-low)/span*19).toFixed(1)}`);
    });
    if(current.length)segments.push(current);
    return `<svg viewBox="0 0 80 30" preserveAspectRatio="none" aria-hidden="true">${segments.map(points=>`<polyline points="${points.join(' ')}"/>`).join('')}</svg>`;
  }

  function renderChips() {
    $('countries').innerHTML=model.countries.map(code=>`<span class="cd-chip">${flag(code)}${escapeHTML(COUNTRIES[code].name)}<button type="button" data-cd-remove="${code}" aria-label="Quitar ${escapeHTML(COUNTRIES[code].name)}" ${model.countries.length===1?'disabled':''}>×</button></span>`).join('');
    $('add-country').disabled=model.countries.length>=4;
    $('add-country').title=model.countries.length>=4?'Máximo cuatro economías; quita una para agregar otra':'Selecciona una economía para comparar';
    $('add-country').innerHTML='<option value="">Agregar economía</option>'+['América Latina','Economías internacionales'].map(group=>`<optgroup label="${group}">${available.filter(code=>COUNTRIES[code].group===group&&!model.countries.includes(code)).map(code=>`<option value="${code}">${COUNTRIES[code].flag} ${escapeHTML(COUNTRIES[code].name)}</option>`).join('')}</optgroup>`).join('');
  }

  function renderKpis(selectedYears) {
    const codes=GROUPS[model.group];
    $('kpis').innerHTML=codes.map((code,i)=>{
      const meta=INDICATORS[code],{year}=info(code,selectedYears);
      const previous=selectedYears.filter(y=>y<year).at(-1);
      const content=model.countries.map((country,j)=>{
        const current=year?runtimeDB[country]?.[code]?.[year]:null;
        const prior=previous?runtimeDB[country]?.[code]?.[previous]:null;
        const change=Number.isFinite(current)&&Number.isFinite(prior)?current-prior:null;
        const sign=Number.isFinite(change)?`${change>0?'▲':change<0?'▼':'●'} ${change>0?'+':''}${number(change,1)}${meta.unit.includes('%')?' p.p.':''}`:'—';
        return `<div class="cd-kpi-country"><span class="cd-kpi-flag" title="${escapeHTML(COUNTRIES[country].name)}">${flag(country)}</span><span class="cd-kpi-name">${escapeHTML(COUNTRIES[country].name)}</span><strong>${valueText(current,code)}</strong><small class="${change>0?'cd-delta-up':change<0?'cd-delta-down':''}" title="Cambio respecto a ${previous||'sin año previo'}">${sign}</small><span class="cd-spark" style="--spark-color:${PALETTE[j%PALETTE.length]}">${sparkline(country,code,selectedYears)}</span></div>`;
      }).join('');
      return `<button type="button" class="cd-kpi${model.indicator===code?' is-current':''}" data-cd-indicator="${code}" aria-label="Comparar ${escapeHTML(meta.title)}"><span class="cd-kpi-top"><span class="cd-kpi-icon"><svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[SERIES.indexOf(code)]}"/></svg></span><span><strong>${escapeHTML(meta.title)}</strong><small>${escapeHTML(meta.unit)} · ${year||'sin año común'}</small></span></span><span class="cd-kpi-list">${content}</span></button>`;
    }).join('');
  }

  function renderRanking(selectedYears) {
    const {year,ranking}=info(model.indicator,selectedYears),meta=INDICATORS[model.indicator];
    $('ranking-subtitle').textContent=model.mode==='regions'?`Países por grupo regional · ${year||'sin año común'}`:`${meta.unit} · ${year||'sin año común'} · orden descendente`;
    if(!year){$('ranking').innerHTML='<p class="cd-empty">No existe un año con datos para todas las economías seleccionadas.</p>';return;}
    const entries=model.mode==='regions'?[...ranking].sort((a,b)=>COUNTRIES[a.code].group.localeCompare(COUNTRIES[b.code].group)||b.value-a.value):ranking;
    const scale=Math.max(1,...entries.map(entry=>Math.abs(entry.value)));
    $('ranking').innerHTML=`<div class="cd-ranking-heading"><span># &nbsp; Economía</span><span>Valor</span></div>`+entries.map((entry,i)=>`<div class="cd-rank-row"><span class="cd-rank-number">${i+1}</span><span class="cd-rank-flag">${flag(entry.code)}</span><span class="cd-rank-main"><strong>${escapeHTML(COUNTRIES[entry.code].name)}</strong>${model.mode==='regions'?`<small>${escapeHTML(COUNTRIES[entry.code].group)}</small>`:''}<span class="cd-rank-track"><span style="width:${Math.max(3,Math.abs(entry.value)/scale*100)}%;background:${PALETTE[model.countries.indexOf(entry.code)%PALETTE.length]}"></span></span></span><strong class="cd-rank-value">${valueText(entry.value,model.indicator)}</strong></div>`).join('');
  }

  function transformedValues(country,selectedYears) {
    return D.transformSeries(runtimeDB,country,model.indicator,selectedYears,model.transform);
  }

  function renderHistory(selectedYears) {
    const meta=INDICATORS[model.indicator];
    $('chart-title').textContent=model.mode==='ranking'?`Ranking histórico · ${meta.title}`:model.mode==='regions'?`Economías y referencia regional · ${meta.title}`:`Evolución histórica · ${meta.title}`;
    $('chart-subtitle').textContent=`${selectedYears.at(0)||'—'}–${selectedYears.at(-1)||'—'} · ${model.transform==='base'?'Índice primer año disponible = 100':model.transform==='cumulative'?'Variación acumulada (%)':meta.unit} · Banco Mundial`;
    $('transform').querySelector('[value="base"]').disabled=!M.LEVEL_INDICATORS.includes(model.indicator);
    $('transform').querySelector('[value="cumulative"]').disabled=model.indicator!=='NY.GDP.MKTP.KD.ZG';
    if($('transform').selectedOptions[0]?.disabled){model.transform='raw';$('transform').value='raw';}
    const colors=model.countries.map((_,i)=>PALETTE[i%PALETTE.length]);
    const chartData=model.countries.map((country,i)=>({label:COUNTRIES[country].name,data:Object.values(transformedValues(country,selectedYears)),borderColor:colors[i],backgroundColor:colors[i],borderWidth:2.5,pointRadius:2.6,pointStyle:['circle','rect','triangle','rectRot'][i],borderDash:[[],[7,4],[2,3],[8,3,2,3]][i],tension:.2,spanGaps:false}));
    if(model.mode==='regions'){
      chartData.push({label:'América Latina y el Caribe (agregado WDI)',data:Object.values(transformedValues('LCN',selectedYears)),borderColor:'#7890b5',backgroundColor:'#7890b5',borderWidth:3,borderDash:[10,5],pointRadius:1,spanGaps:false});
    }
    const rank=info(model.indicator,selectedYears);
    const isRanking=model.mode==='ranking';
    const labels=isRanking?rank.ranking.map(r=>COUNTRIES[r.code].name):selectedYears;
    const datasets=isRanking?[{label:meta.title,data:rank.ranking.map(r=>r.value),backgroundColor:rank.ranking.map(r=>PALETTE[model.countries.indexOf(r.code)]),borderColor:rank.ranking.map(r=>PALETTE[model.countries.indexOf(r.code)]),borderRadius:8}]:chartData;
    $('legend').innerHTML=model.countries.map((country,i)=>`<span><i style="background:${colors[i]}"></i>${flag(country)} ${escapeHTML(COUNTRIES[country].name)}</span>`).join('')+(model.mode==='regions'?'<span><i style="background:#7890b5"></i>Agregado regional WDI</span>':'');
    charts.history?.destroy();
    if(typeof Chart==='undefined')return;
    charts.history=new Chart($('chart'),{type:isRanking?'bar':'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,indexAxis:isRanking?'y':'x',animation:window.matchMedia('(prefers-reduced-motion: reduce)').matches?false:{duration:360},plugins:{legend:{display:false},tooltip:{callbacks:{label:context=>{
      const value=isRanking?context.parsed.x:context.parsed.y;
      const display=!isRanking&&model.transform==='base'?`${number(value,1)} (base 100)`:
        !isRanking&&model.transform==='cumulative'?`${number(value,1)}% acumulado`:valueText(value,model.indicator);
      return `${context.dataset.label}: ${display}`;
    }}}},scales:{x:{grid:{color:'rgba(85,139,211,.1)'},ticks:{color:'#7693bc'}},y:{grid:{color:'rgba(85,139,211,.1)'},ticks:{color:'#7693bc'}}}}});
  }

  function mapTags(year) {
    return `<div class="cd-map-tags" aria-label="Economías representadas">${model.countries.map((country,i)=>{const value=year?runtimeDB[country]?.[model.indicator]?.[year]:null;return `<button type="button" data-cd-map-country="${country}" class="cd-map-tag"><span class="cd-map-dot" style="background:${PALETTE[i%PALETTE.length]}"></span>${flag(country)} ${escapeHTML(COUNTRIES[country].name)} <strong>${valueText(value,model.indicator)}</strong></button>`;}).join('')}</div>`;
  }

  function renderMapFallback(year) {
    const americas=model.countries.every(c=>COUNTRIES[c].group==='América Latina'||c==='USA'||c==='CAN');
    const project=([lon,lat])=>americas?[(lon+121)/98*560+18,(40-lat)/100*300+16]:[(lon+180)/360*574+14,(90-lat)/180*300+17];
    const land=americas?'<path d="M75 12 117 15 153 48 170 75 189 96 201 120 222 138 257 155 263 173 247 189 256 205 273 221 286 244 281 259 267 279 250 301 239 315 221 300 213 276 197 255 195 235 181 216 180 193 153 174 146 144 125 127 115 106 91 94 88 69 63 47Z"/><path d="M267 152 305 155 327 170 326 189 311 202 294 202 281 183Z"/>':'<path d="M57 54 104 31 145 51 172 94 165 118 191 151 178 184 148 213 119 229 100 197 92 164 70 139Z"/><path d="M170 177 198 190 214 228 203 282 181 321 160 282 155 239Z"/><path d="M299 71 351 34 420 45 471 33 548 65 550 101 506 114 476 136 441 124 414 156 394 179 366 170 348 133 315 124Z"/><path d="M331 178 380 177 396 222 382 272 352 295 323 252Z"/><path d="M478 253 525 245 544 278 519 297 489 286Z"/>';
    const markers=model.countries.map((country,i)=>{
      const point=project(POS[country]||[0,0]);
      return `<g class="cd-map-point"><circle cx="${point[0]}" cy="${point[1]}" r="14" fill="${PALETTE[i%PALETTE.length]}" opacity=".14"/><circle cx="${point[0]}" cy="${point[1]}" r="6" fill="${PALETTE[i%PALETTE.length]}" stroke="#fff" stroke-width="2.5"/></g>`;
    }).join('');
    $('map').classList.remove('is-live');
    $('map').innerHTML=`<svg viewBox="0 0 600 335" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs><radialGradient id="cd-map-grad"><stop stop-color="#c9e2ff"/><stop offset="1" stop-color="#f3f9ff"/></radialGradient></defs><rect width="600" height="335" fill="url(#cd-map-grad)"/><g stroke="#dcebf9" stroke-width="1">${[90,180,270,360,450,540].map(x=>`<path d="M${x} 0v335"/>`).join('')}${[67,134,201,268].map(y=>`<path d="M0 ${y}h600"/>`).join('')}</g><g fill="#a8c8f7" stroke="#f7fbff" stroke-width="2" opacity=".6">${land}</g>${markers}</svg>${mapTags(year)}`;
  }

  function mapPopup(country,year) {
    const value=year?runtimeDB[country]?.[model.indicator]?.[year]:null;
    const unit=INDICATORS[model.indicator].title;
    return `<div class="cd-map-popup"><strong>${escapeHTML(COUNTRIES[country].name)}</strong><span>${escapeHTML(unit)} · ${escapeHTML(year||'sin año común')}</span><b>${valueText(value,model.indicator)}</b><small>Banco Mundial · WDI · ${year&&Number.isFinite(value)?source(country,model.indicator,year):'sin dato'}</small></div>`;
  }

  function mapBounds() {
    if(!mapState.map)return;
    const chosen=model.countries.map(code=>POS[code]).filter(Boolean);
    if(!chosen.length)return;
    const bounds=new maplibregl.LngLatBounds(chosen[0],chosen[0]);
    chosen.forEach(point=>bounds.extend(point));
    mapState.map.fitBounds(bounds,{padding:{top:42,bottom:46,left:42,right:42},maxZoom:4.6,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:450});
  }

  function refreshVectorMap() {
    const map=mapState.map;
    if(!map)return;
    const {year}=info(model.indicator);
    const tags=$('map').querySelector('.cd-map-tags');
    if(tags)tags.outerHTML=mapTags(year);
    mapState.markers.forEach(marker=>marker.remove());
    mapState.markers=model.countries.filter(code=>POS[code]).map((country,i)=>{
      const element=document.createElement('button');
      element.type='button';element.className='cd-map-marker';element.style.setProperty('--marker-color',PALETTE[i%PALETTE.length]);
      element.setAttribute('aria-label',`Ver datos de ${COUNTRIES[country].name}`);
      element.title=`${COUNTRIES[country].name} · ${valueText(year?runtimeDB[country]?.[model.indicator]?.[year]:null,model.indicator)}`;
      element.addEventListener('click',event=>{event.stopPropagation();new maplibregl.Popup({offset:19,closeButton:true,maxWidth:'225px'}).setLngLat(POS[country]).setHTML(mapPopup(country,year)).addTo(map);});
      return new maplibregl.Marker({element,anchor:'bottom'}).setLngLat(POS[country]).addTo(map);
    });
    if(!mapState.geo||!mapState.styleReady)return;
    const featureCollection=M.comparisonMapData.selectedCountryFeatures(mapState.geo,model.countries,runtimeDB,model.indicator,year);
    const values=featureCollection.features.map(feature=>feature.properties.cdValue);
    const [lower,upper]=M.comparisonMapData.indicatorStops(values);
    const sourceId='cd-selected-countries';
    if(!map.getSource(sourceId)){
      map.addSource(sourceId,{type:'geojson',data:featureCollection});
      map.addLayer({id:'cd-no-data',type:'fill',source:sourceId,filter:['==',['get','cdHasValue'],false],paint:{'fill-color':'#8ca5c5','fill-opacity':.28}});
      map.addLayer({id:'cd-country-fill',type:'fill',source:sourceId,filter:['==',['get','cdHasValue'],true],paint:{'fill-color':'#1556dd','fill-opacity':.48}});
      map.addLayer({id:'cd-country-border',type:'line',source:sourceId,paint:{'line-color':'#1556dd','line-width':1.8,'line-opacity':.83}});
      if(!mapState.handlersBound){
        map.on('click','cd-country-fill',event=>{
          const code=event.features?.[0]?.properties?.cdCode;
          if(!COUNTRIES[code])return;
          new maplibregl.Popup({maxWidth:'225px'}).setLngLat(event.lngLat).setHTML(mapPopup(code,info(model.indicator).year)).addTo(map);
        });
        map.on('mouseenter','cd-country-fill',()=>{map.getCanvas().style.cursor='pointer';});
        map.on('mouseleave','cd-country-fill',()=>{map.getCanvas().style.cursor='';});
        mapState.handlersBound=true;
      }
    }else map.getSource(sourceId).setData(featureCollection);
    map.setPaintProperty('cd-country-fill','fill-color',['interpolate',['linear'],['get','cdValue'],lower,'#a8dbf5',upper,'#1654df']);
    const legend=$('map').querySelector('.cd-map-key');
    if(legend)legend.innerHTML=year?`<span>${number(lower,1)}</span><span class="cd-map-gradient" aria-hidden="true"></span><span>${number(upper,1)}</span><small>${escapeHTML(INDICATORS[model.indicator].unit)} · ${year}</small>`:'<small>Sin año común para colorear las fronteras</small>';
  }

  function failVectorMap() {
    if(mapState.failed)return;
    mapState.failed=true;
    clearTimeout(mapState.timeout);
    mapState.markers.forEach(marker=>marker.remove());
    try{mapState.map?.remove();}catch(error){/* Fallback también si falló la inicialización WebGL. */}
    mapState.map=null;
    renderMapFallback(info(model.indicator).year);
    $('map-subtitle').textContent+=' · vista de respaldo';
  }

  function canRenderVectorMap() {
    if(typeof maplibregl==='undefined'||typeof maplibregl.Map!=='function')return false;
    try{return Boolean(document.createElement('canvas').getContext('webgl2'));}
    catch(error){return false;}
  }

  function renderMap(selectedYears) {
    const {year}=info(model.indicator,selectedYears);
    $('map-subtitle').textContent=year?`${INDICATORS[model.indicator].title} · ${year} · desliza y amplía el mapa`:'Sin año común · mapa geográfico';
    if(mapState.failed||!canRenderVectorMap()){
      renderMapFallback(year);
      return;
    }
    if(!mapState.map){
      const surface=$('map');
      surface.classList.add('is-live');
      surface.innerHTML=`<div class="cd-vector-map" aria-label="Mapa mundial interactivo: desplazar, acercar y seleccionar economías"></div><div class="cd-map-key" aria-live="polite"><small>Preparando fronteras oficiales…</small></div>${mapTags(year)}`;
      const theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
      try{
        mapState.map=new maplibregl.Map({container:surface.querySelector('.cd-vector-map'),style:MAP_STYLE[theme],center:[-74,-14],zoom:1.7,minZoom:1,maxZoom:10,attributionControl:false,dragRotate:false,pitchWithRotate:false});
        mapState.style=theme;
        mapState.map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
        mapState.map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
        mapState.map.on('style.load',()=>{mapState.styleReady=true;clearTimeout(mapState.timeout);refreshVectorMap();});
        mapState.map.on('error',event=>{if(!mapState.styleReady&&event.error)console.warn('Proveedor cartográfico temporalmente no disponible:',event.error.message);});
        mapState.timeout=setTimeout(()=>{if(mapState.map&&!mapState.styleReady)failVectorMap();},12000);
        if(!mapState.geometryRequested){
          mapState.geometryRequested=true;
          fetch(new URL('data/geo/ne_110m_admin_0_countries.geojson',document.baseURI))
            .then(response=>{if(!response.ok)throw Error('Natural Earth no disponible');return response.json();})
            .then(geo=>{mapState.geo=geo;refreshVectorMap();})
            .catch(()=>{if(mapState.map)failVectorMap();});
        }
      }catch(error){failVectorMap();return;}
    }
    const theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
    if(mapState.style!==theme){mapState.style=theme;mapState.styleReady=false;mapState.map.setStyle(MAP_STYLE[theme]);}
    refreshVectorMap();
    const selection=model.countries.join(',');
    if(mapState.lastSelection!==selection){mapState.lastSelection=selection;mapBounds();}
    requestAnimationFrame(()=>mapState.map?.resize());
  }

  function renderReadings(selectedYears) {
    const summary=D.buildEconomySummary(runtimeDB,model.countries,model.indicator,selectedYears);
    const meta=INDICATORS[model.indicator];
    const entries=[];
    if(summary.year&&summary.leader){
      entries.push(`<strong>${escapeHTML(COUNTRIES[summary.leader.code].name)} presenta el valor más alto</strong><span>En ${summary.year}, ${meta.title.toLowerCase()} registra ${valueText(summary.leader.value,model.indicator)} entre las economías seleccionadas. Un valor más alto no implica necesariamente mejor desempeño.</span>`);
      if(summary.spread!==null)entries.push(`<strong>Diferencia observada entre economías</strong><span>La distancia entre el mayor y el menor valor es ${number(summary.spread,meta.decimals)} ${meta.unit.includes('%')?'puntos porcentuales':meta.unit}, en el mismo año ${summary.year}.</span>`);
    } else entries.push('<strong>Comparación temporal limitada</strong><span>No existe un año común con valores válidos para todas las economías en el periodo solicitado.</span>');
    const growth=info(SERIES[0],selectedYears),inflation=info(SERIES[1],selectedYears);
    if(growth.year&&inflation.year&&growth.year===inflation.year){
      const g=growth.ranking[0],p=inflation.ranking.at(-1);
      entries.push(`<strong>Actividad y precios en ${growth.year}</strong><span>${escapeHTML(COUNTRIES[g.code].name)} registra el mayor crecimiento (${valueText(g.value,SERIES[0])}); ${escapeHTML(COUNTRIES[p.code].name)} presenta la menor inflación promedio anual (${valueText(p.value,SERIES[1])}). Son indicadores distintos.</span>`);
    } else entries.push('<strong>Fechas heterogéneas</strong><span>El crecimiento y la inflación no tienen un año común suficiente para resumir ambas variables conjuntamente.</span>');
    const provenance=model.countries.some(country=>selectedYears.some(year=>SERIES.some(code=>runtimeSource[country]?.[code]?.[year]==='wdi')));
    entries.push(`<strong>Alcance y trazabilidad</strong><span>Series anuales del Banco Mundial (WDI). ${provenance?'Se incluyen respuestas de API consultadas en esta sesión.':'Se muestra el respaldo local descargado previamente, no una actualización en tiempo real.'} Las ausencias no se interpolan.</span>`);
    $('readings').innerHTML=entries.map((content,i)=>`<li><span class="cd-reading-index">${i+1}</span><span class="cd-reading-copy">${content}</span></li>`).join('');
  }

  function renderScatter(selectedYears) {
    const year=D.commonLatestYear(runtimeDB,model.countries,SERIES[0],selectedYears);
    const matching=[...selectedYears].reverse().find(y=>model.countries.every(c=>Number.isFinite(runtimeDB[c]?.[SERIES[0]]?.[y])&&Number.isFinite(runtimeDB[c]?.[SERIES[1]]?.[y])));
    $('scatter-subtitle').textContent=`Crecimiento (X) · inflación (Y) · ${matching||'sin año común'} · % anual`;
    const canvas=$('scatter'),rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const dpi=Math.min(2,devicePixelRatio||1),w=rect.width,h=rect.height;
    canvas.width=Math.floor(w*dpi);canvas.height=Math.floor(h*dpi);
    const ctx=canvas.getContext('2d');ctx.setTransform(dpi,0,0,dpi,0,0);ctx.clearRect(0,0,w,h);
    const points=matching?model.countries.map(c=>({code:c,x:runtimeDB[c]?.[SERIES[0]]?.[matching],y:runtimeDB[c]?.[SERIES[1]]?.[matching]})):[];
    const maxX=Math.max(4,...points.map(p=>p.x))+1,minX=Math.min(-1,...points.map(p=>p.x))-1;
    const maxY=Math.max(8,...points.map(p=>p.y))+1,minY=Math.min(0,...points.map(p=>p.y))-1;
    const pad={left:40,right:18,top:14,bottom:32},pw=w-pad.left-pad.right,ph=h-pad.top-pad.bottom;
    const x=v=>pad.left+(v-minX)/(maxX-minX)*pw,y=v=>h-pad.bottom-(v-minY)/(maxY-minY)*ph;
    const muted=getComputedStyle($('chart')).getPropertyValue('--cd-muted').trim()||'#6a86b1';
    ctx.strokeStyle='rgba(112,160,226,.2)';ctx.fillStyle=muted;ctx.lineWidth=1;ctx.font='10px DM Sans,Arial';
    for(let i=0;i<=4;i++){let xx=pad.left+pw*i/4,yy=pad.top+ph*i/4;ctx.beginPath();ctx.moveTo(xx,pad.top);ctx.lineTo(xx,h-pad.bottom);ctx.moveTo(pad.left,yy);ctx.lineTo(w-pad.right,yy);ctx.stroke();ctx.textAlign='center';ctx.fillText(number(minX+(maxX-minX)*i/4,1),xx,h-14);ctx.textAlign='right';ctx.fillText(number(maxY-(maxY-minY)*i/4,1),pad.left-8,yy+3);}
    points.forEach((p,i)=>{ctx.beginPath();ctx.arc(x(p.x),y(p.y),6.5,0,Math.PI*2);ctx.fillStyle=PALETTE[i%PALETTE.length];ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='left';ctx.fillText(COUNTRIES[p.code].name,x(p.x)+9,y(p.y)-9);});
    if(!matching){ctx.fillStyle=muted;ctx.textAlign='center';ctx.font='12px DM Sans,Arial';ctx.fillText('Sin observaciones comunes',w/2,h/2);}
  }

  function renderLabor(selectedYears) {
    const lastFive=selectedYears.slice(-5),code=SERIES[2];
    $('labor-subtitle').textContent=`Desempleo modelado OIT · ${lastFive[0]||'—'}–${lastFive.at(-1)||'—'} · % fuerza laboral`;
    charts.labor?.destroy();if(typeof Chart==='undefined')return;
    charts.labor=new Chart($('labor'),{type:'bar',data:{labels:lastFive,datasets:model.countries.map((country,i)=>({label:COUNTRIES[country].name,data:lastFive.map(y=>runtimeDB[country]?.[code]?.[y]??null),backgroundColor:PALETTE[i%PALETTE.length],borderRadius:4,barPercentage:.7}))},options:{responsive:true,maintainAspectRatio:false,animation:matchMedia('(prefers-reduced-motion: reduce)').matches?false:{duration:300},plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#7693bc'},grid:{display:false}},y:{ticks:{color:'#7693bc'},grid:{color:'rgba(85,139,211,.1)'}}}}});
  }

  function renderTable(selectedYears) {
    $('table-head').innerHTML=`<tr><th scope="col">Indicador / año</th>${model.countries.map(country=>`<th scope="col">${flag(country)} ${escapeHTML(COUNTRIES[country].name)}</th>`).join('')}</tr>`;
    $('table-body').innerHTML=SERIES.map(code=>{
      const {year}=info(code,selectedYears);
      return `<tr><th scope="row">${escapeHTML(INDICATORS[code].title)}<small>${year||'Sin año común'}</small></th>${model.countries.map(country=>{const v=year?runtimeDB[country]?.[code]?.[year]:null;return `<td title="${year?source(country,code,year):'sin dato'}">${valueText(v,code)}</td>`;}).join('')}</tr>`;
    }).join('');
  }

  function renderProvenance(selectedYears) {
    let api=0,fallback=0;
    model.countries.forEach(country=>SERIES.forEach(code=>selectedYears.forEach(year=>{
      if(!Number.isFinite(runtimeDB[country]?.[code]?.[year]))return;
      if(source(country,code,year)==='API WDI')api++;else fallback++;
    })));
    const extracted=M.FALLBACK_EXTRACTED_AT?.[model.indicator];
    const fallbackDate=extracted?` (copia del ${new Date(extracted).toLocaleDateString('es-PE')})`:'';
    $('status').textContent=`Banco Mundial · WDI · frecuencia anual · ${api} observaciones de API en esta sesión · ${fallback} observaciones de respaldo local${fallback?fallbackDate:''}. Los valores pueden revisarse.`;
  }

  function renderComparisonDashboard() {
    if(!$('kpis')||document.getElementById('comparacion').hidden)return;
    const selectedYears=years();
    document.getElementById('comparacion').dataset.mode=model.mode;
    renderChips();renderKpis(selectedYears);renderRanking(selectedYears);renderHistory(selectedYears);renderMap(selectedYears);renderReadings(selectedYears);renderScatter(selectedYears);renderLabor(selectedYears);renderTable(selectedYears);renderProvenance(selectedYears);
    document.querySelectorAll('[data-cd-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cdMode===model.mode)));
  }

  function populateIndicators() {
    const codes=GROUPS[model.group];
    if(!codes.includes(model.indicator))model.indicator=codes[0];
    $('indicator').innerHTML=codes.map(code=>`<option value="${code}">${escapeHTML(INDICATORS[code].title)}</option>`).join('');
    $('indicator').value=model.indicator;
  }

  function exportComparison() {
    const selectedYears=years();
    const rows=[['pais_iso3','indicador_codigo','anio','valor','unidad','procedencia']];
    model.countries.forEach(country=>SERIES.forEach(code=>selectedYears.forEach(year=>{
      const value=runtimeDB[country]?.[code]?.[year];
      rows.push([country,code,year,Number.isFinite(value)?String(value):'',INDICATORS[code].unit,Number.isFinite(value)?source(country,code,year).replace('API WDI','wdi_api').replace('respaldo local','respaldo_local'):'sin_dato']);
    })));
    const csv='\uFEFF'+rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\r\n');
    const file=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(file);
    const link=document.createElement('a');link.href=url;link.download=`macroscope-comparacion-${selectedYears.at(-1)||'datos'}.csv`;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  function setup() {
    if(!$('kpis'))return;
    populateIndicators();
    $('countries').addEventListener('click',e=>{const button=e.target.closest('[data-cd-remove]');if(!button||model.countries.length<=1)return;model.countries=model.countries.filter(code=>code!==button.dataset.cdRemove);renderComparisonDashboard();});
    $('add-country').addEventListener('change',e=>{const candidate=e.target.value;if(candidate&&!model.countries.includes(candidate)){model.countries=D.normalizeCountries([...model.countries,candidate],available);renderComparisonDashboard();}});
    $('period').addEventListener('change',e=>{model.period=e.target.value;renderComparisonDashboard();});
    $('indicator-group').addEventListener('change',e=>{model.group=e.target.value;populateIndicators();renderComparisonDashboard();});
    $('indicator').addEventListener('change',e=>{model.indicator=e.target.value;renderComparisonDashboard();});
    $('transform').addEventListener('change',e=>{model.transform=e.target.value;renderComparisonDashboard();});
    $('kpis').addEventListener('click',e=>{const card=e.target.closest('[data-cd-indicator]');if(!card)return;model.indicator=card.dataset.cdIndicator;$('indicator').value=model.indicator;renderComparisonDashboard();});
    document.querySelectorAll('[data-cd-mode]').forEach(button=>button.addEventListener('click',()=>{model.mode=button.dataset.cdMode;renderComparisonDashboard();}));
    $('map').addEventListener('click',e=>{const el=e.target.closest('[data-cd-map-country]');if(!el)return;$('map-subtitle').textContent=`${COUNTRIES[el.dataset.cdMapCountry].name} · ${INDICATORS[model.indicator].title}`;});
    $('export').addEventListener('click',exportComparison);
    new MutationObserver(()=>renderComparisonDashboard()).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    renderComparisonDashboard();
  }

  M.renderComparisonDashboard=renderComparisonDashboard;
  M.comparisonDashboard=model;
  window.addEventListener('DOMContentLoaded',setup);
})();
