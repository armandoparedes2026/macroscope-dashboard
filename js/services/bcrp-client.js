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
        node.replaceChildren();node.className='bcrp-grid';
        data.forEach(row=>{
          const latest=row.observations.filter(obs=>Number.isFinite(obs.value)).at(-1);
          const names={PD04722MM:'Tasa de referencia',PN01273PM:'IPC Lima interanual',PN01207PM:'Tipo de cambio interbancario',PN00027MM:'Reservas internacionales netas'};
          const item=document.createElement('article');item.className='bcrp-card';
          const title=document.createElement('h3');title.textContent=names[row.code]||row.title;item.append(title);
          const value=document.createElement('strong');value.className='bcrp-value';const digits={PD04722MM:2,PN01273PM:2,PN01207PM:3,PN00027MM:0}[row.code]??2;value.textContent=latest?latest.value.toLocaleString('es-PE',{minimumFractionDigits:digits,maximumFractionDigits:digits})+' '+row.unit:'N/D';item.append(value);
          const period=document.createElement('p');period.textContent='Observación: '+(latest?(latest.date?new Date(latest.date+'T12:00:00').toLocaleDateString('es-PE',{month:'long',year:'numeric'}):latest.period):'sin dato');item.append(period);
          const source=document.createElement('p');source.className='data-note';source.textContent=row.code+' · Fuente: BCRP · Extracción: '+M.localDate(row.fetchedAt);item.append(source);
          if(row.code==='PN01273PM'){const note=document.createElement('p');note.className='data-note';note.textContent='BCRP: IPC del mes frente al mismo mes del año anterior. WDI: IPC promedio anual; no equivalentes.';item.append(note);}
          item.append(M.citationButton({provider:'bcrp',code:row.code,extracted:row.fetchedAt}));
          node.appendChild(item);
        });
      }catch{node.textContent='BCRP no disponible. No se pudieron consultar las series oficiales; vuelva a actualizar los datos. En una copia local se requiere el proxy del servidor.';}
      finally{clearTimeout(timer);}
    }

  Object.assign(M, { loadBcrp });
})();
