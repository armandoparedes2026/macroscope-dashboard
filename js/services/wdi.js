(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
  const { COUNTRIES } = M;
    const wdiFetchedAt = {};
    const WDI_TTL = 24*60*60*1000;
    const validWdiRow=(row,indicator)=>row&&COUNTRIES[row.countryiso3code]&&row.indicator?.id===indicator&&/^\d{4}$/.test(row.date)&&(row.value===null||Number.isFinite(row.value));
    async function fetchWdiPage(url, indicator) {
      for(let attempt=0;attempt<3;attempt++) {
        const controller=new AbortController();
        const timer=setTimeout(()=>controller.abort(),12000);
        try {
          const response=await fetch(url,{signal:controller.signal});
          if(!response.ok) throw Error('WDI HTTP '+response.status);
          const data=await response.json();
          return parseWdiPage(data,indicator);
        } catch(error) {
          if(attempt===2) throw error;
        } finally {clearTimeout(timer);}
        await new Promise(resolve=>setTimeout(resolve,250*2**attempt));
      }
    }
    async function loadWdiSeries(url,indicator,force) {
      const key='macroscope_wdi_v2_'+indicator;
      if(!force) {try {
        const cached=JSON.parse(localStorage.getItem(key));
        if(cached&&Date.now()-Date.parse(cached.fetchedAt)<WDI_TTL&&Date.now()>=Date.parse(cached.fetchedAt)&&Array.isArray(cached.rows)&&cached.rows.every(row=>validWdiRow(row,indicator))) return cached;
      }catch{}}
      const first=await fetchWdiPage(url+'&page=1',indicator);
      parseWdiPage(first,indicator,1);
      const pages=[first];
      for(let page=2;page<=Number(first[0].pages);page++) {
        const next=await fetchWdiPage(url+'&page='+page,indicator);
        parseWdiPage(next,indicator,page,Number(first[0].pages));
        pages.push(next);
      }
      const rows=normalizeWdiPages(pages,indicator);
      const result={rows,fetchedAt:new Date().toISOString()};
      try {localStorage.setItem(key,JSON.stringify(result));}catch{}
      return result;
    }
    function normalizeWdiValue(value) {
      if (value === null || Number.isFinite(value)) return value;
      throw Error('Valor WDI inválido');
    }
    function parseWdiPage(data, indicator, expectedPage, expectedPages) {
      if(!Array.isArray(data)||data.length!==2||!data[0]||!Array.isArray(data[1])||
        !Number.isInteger(Number(data[0].pages))||Number(data[0].pages)<1||Number(data[0].pages)>100||
        !Number.isInteger(Number(data[0].page))||Number(data[0].page)<1||
        data[1].some(row=>!validWdiRow(row,indicator))) throw Error('Respuesta WDI malformada');
      if ((expectedPage !== undefined && Number(data[0].page)!==expectedPage) ||
          (expectedPages !== undefined && Number(data[0].pages)!==expectedPages)) throw Error('Paginación WDI inválida');
      return [data[0], data[1].map(row=>({...row,value:normalizeWdiValue(row.value)}))];
    }
    function normalizeWdiPages(pages, indicator) {
      if (!Array.isArray(pages) || !pages.length) throw Error('Respuesta WDI malformada');
      const first = parseWdiPage(pages[0],indicator,1);
      const total = Number(first[0].pages);
      if (pages.length !== total) throw Error('Paginación WDI incompleta');
      return pages.flatMap((page,index)=>parseWdiPage(page,indicator,index+1,total)[1]);
    }
    function latestAvailable(series, years = Object.keys(series).sort()) {
      const available = years.filter(y => Number.isFinite(series[y]));
      if (!available.length) return {year:'N/D',value:null,prevYear:null,prevValue:null};
      const year = available.at(-1), prevYear = available.at(-2) || null;
      return {year,value:series[year],prevYear,prevValue:prevYear?series[prevYear]:null};
    }


  Object.assign(M, { wdiFetchedAt, WDI_TTL, validWdiRow, normalizeWdiValue, parseWdiPage, normalizeWdiPages, latestAvailable, fetchWdiPage, loadWdiSeries });
})();
