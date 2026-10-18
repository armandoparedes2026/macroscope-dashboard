(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
    async function loadBcrp() {
      const node=document.getElementById('bcrpResults');
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
      try {
        const origin=location.protocol==='file:'?'http://localhost':location.origin;
        const response=await fetch(origin+'/api/bcrp?codes=PD04722MM-PN01273PM-PN01207PM-PN00027MM&start=2024-1&end='+new Date().getFullYear()+'-'+(new Date().getMonth()+1),{signal:controller.signal});
        if(!response.ok)throw Error('BCRP no disponible');
        const data=await response.json();
        if(!Array.isArray(data)||data.length!==4||data.some(row=>row.source!=='BCRP'||typeof row.title!=='string'||!Array.isArray(row.observations)))throw Error('Respuesta BCRP inválida');
        node.replaceChildren();
        data.forEach(row=>{
          const latest=row.observations.filter(obs=>Number.isFinite(obs.value)).at(-1);
          const item=document.createElement('p');
          item.textContent=row.title+': '+(latest?latest.value.toLocaleString('es-PE')+' '+row.unit+' · Observación: '+latest.period:'N/D')+' · '+row.code+' · Fuente: BCRP · Extracción: '+row.fetchedAt;
          node.appendChild(item);
        });
      }catch{node.textContent='BCRP no disponible. No se pudieron consultar las series oficiales; vuelva a actualizar los datos. En una copia local se requiere el proxy del servidor.';}
      finally{clearTimeout(timer);}
    }

  Object.assign(M, { loadBcrp });
})();
