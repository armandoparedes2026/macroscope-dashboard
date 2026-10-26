(function () {
  'use strict';
  const M=globalThis.MacroScope ||= {};
  M.panoramaBcrp={};
  M.panoramaStatus={monthly:'loading',quarterly:'loading'};
  const groups={monthly:['PD04722MM','PN01273PM','PN01207PM','PN00027MM','PD38045AM','PN38723BM','PN01773AM','PN38714BM','PN38718BM'],quarterly:['PN02507AQ']};
  function endpoint(codes,frequency){
    const endYear=new Date().getFullYear();
    const end=frequency==='quarterly'?`${endYear}-4`:`${endYear}-12`;
    const origin=globalThis.location?.protocol==='file:'?'http://localhost':globalThis.location?.origin||'http://localhost';
    return `${origin}/api/bcrp?codes=${codes.join('-')}&start=2015-1&end=${end}`;
  }
  async function loadPanoramaBcrp({fetchImpl=globalThis.fetch}={}){
    const payload={};
    const status={monthly:'loading',quarterly:'loading'};
    M.panoramaStatus=status;
    const jobs=Object.entries(groups).map(async ([frequency,codes])=>{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),12000);
      try{
        const response=await fetchImpl(endpoint(codes,frequency),{signal:controller.signal});
        if(!response.ok)throw Error(`HTTP ${response.status}`);
        const data=await response.json();
        const items=Array.isArray(data)?data:[data];
        for(const row of items){
          if(!codes.includes(row?.code)||row.source!=='BCRP'||row.frequency!==frequency||typeof row.title!=='string'||!Array.isArray(row.observations))continue;
          payload[row.code]=row;
        }
        const n=codes.filter(code=>payload[code]).length;
        status[frequency]=n===codes.length?'ok':n?'partial':'error';
      }catch{
        status[frequency]='error';
      }finally{clearTimeout(timer);}
    });
    await Promise.all(jobs);
    M.panoramaBcrp=payload;
    if(typeof M.renderPanorama==='function')M.renderPanorama();
    return payload;
  }
  Object.assign(M,{loadPanoramaBcrp});
})();
