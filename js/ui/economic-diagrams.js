/* Shared Laboratory rendering, motion and accessible enlargement. No economic state lives here. */
(function () {
  'use strict';
  const M=globalThis.MacroScope, frames=new WeakMap(), records=new Map();
  const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const currentTheme=()=>document.documentElement.dataset.theme||'';
  const stageSignature=spec=>[...new Set((spec.lines||[]).flatMap(l=>l.stages||[]))].sort((a,b)=>a-b).join(',');
  function animate(canvas,target){
    if(!canvas)return;
    const old=frames.get(canvas);if(old?.frame)cancelAnimationFrame(old.frame);
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,previous=old?.spec;
    const rect=canvas.getBoundingClientRect(),visible=rect.width>0&&rect.height>0;
    const sameKind=Boolean(previous&&previous.x?.label===target.x?.label&&previous.y?.label===target.y?.label&&Boolean(previous.x?.categories)===Boolean(target.x?.categories));
    const moving=visible&&sameKind&&!previous.message&&!target.message&&!reduced&&JSON.stringify(previous)!==JSON.stringify(target);
    const entry={spec:previous,frame:0,animating:moving};frames.set(canvas,entry);
    const start=performance.now(),mix=(a,b,t)=>a+(b-a)*t;
    canvas.dataset.animating=String(Boolean(moving));canvas.dataset.motion=reduced?'reduced':'full';
    const paintFrame=now=>{
      if(!canvas.isConnected){entry.animating=false;return;}
      const t=moving?Math.min(1,(now-start)/400):1,f=1-(1-t)**3;
      const spec=t===1?target:{...target,lines:(target.lines||[]).map(l=>{
        const before=(previous.lines||[]).find(v=>(v.family||v.color)===(l.family||l.color)&&(v.stage||(v.initial?'initial':'final'))===(l.stage||(l.initial?'initial':'final')))||l;
        if(l.path)return {...l,path:l.path.map((p,i)=>({x:mix(before.path?.[i]?.x??p.x,p.x,f),y:mix(before.path?.[i]?.y??p.y,p.y,f)}))};
        if(l.line&&before.line)return {...l,line:Object.fromEntries(['a','b','c'].map(k=>[k,mix(before.line[k]??l.line[k],l.line[k],f)]))};
        return l;
      }),points:(target.points||[]).map(p=>{const before=(previous.points||[]).find(v=>v.label===p.label)||p;return {...p,x:mix(before.x,p.x,f),y:mix(before.y,p.y,f)};}),bars:(target.bars||[]).map(p=>{const before=(previous.bars||[]).find(v=>v.label===p.label)||p;return {...p,value:mix(before.value,p.value,f)};})};
      M.drawDiagram(canvas,spec);entry.spec=spec;
      canvas.dataset.points=JSON.stringify(spec.points||[]);canvas.dataset.curves=JSON.stringify(spec.lines||[]);canvas.dataset.bars=JSON.stringify(spec.bars||[]);
      if(t<1){entry.frame=requestAnimationFrame(paintFrame);}else{entry.animating=false;canvas.dataset.animating='false';}
    };
    paintFrame(start);
  }
  function stages(initial,impact,final,color,family){
    const groups=[];[initial,impact,final].forEach((line,stage)=>{if(!line)return;const same=groups.find(g=>M.sameLine(g.line,line));if(same)same.stages.push(stage);else groups.push({line,stages:[stage],color,family});});
    return groups.map(g=>({...g,label:g.stages.map(n=>family+['₀','₁','₂'][n]).join('='),initial:g.stages.length===1&&g.stages[0]===0,stage:g.stages.includes(2)?'final':g.stages.includes(1)?'impact':'initial',dash:g.stages.includes(2)?[]:g.stages.includes(1)?[9,3,2,3]:[5,4]}));
  }
  function filtered(r){return {...r.spec,lines:(r.spec.lines||[]).filter(l=>!l.stages||l.stages.some(n=>!r.hidden.has(n))),points:(r.spec.points||[]).filter(p=>p.stage===undefined||!r.hidden.has(p.stage))};}
  const connected=group=>[...records.values()].filter(r=>r.group===group&&r.host.isConnected);
  function recordDims(canvas){const rect=canvas?.getBoundingClientRect();return rect?{w:Math.round(rect.width),h:Math.round(rect.height)}:{w:0,h:0};}
  function paintCanvas(canvas,r,keyPrefix=''){
    if(!canvas?.isConnected)return;
    const d=recordDims(canvas),theme=currentTheme();
    animate(canvas,filtered(r));
    r[keyPrefix+'w']=d.w;r[keyPrefix+'h']=d.h;r[keyPrefix+'theme']=d.w>0&&d.h>0?theme:'';
  }
  function paint(r){
    paintCanvas(r.canvas,r,'');
    if(r.zoomCanvas?.isConnected)paintCanvas(r.zoomCanvas,r,'z');
  }
  function controls(r){
    const available=[...new Set((r.spec.lines||[]).flatMap(l=>l.stages||[]))].sort((a,b)=>a-b);
    return available.length>1?`<div class="economic-stage-controls" aria-label="Etapas visibles">${available.map(n=>`<label><input type="checkbox" data-economic-stage="${n}" data-economic-record="${esc(r.id)}" ${r.hidden.has(n)?'':'checked'}> ${esc(r.spec.stageLabels?.[n]||['Inicial','Impacto','Final'][n])}</label>`).join('')}</div>`:'';
  }
  function syncControls(container,r){
    const sig=stageSignature(r.spec);
    if(container.dataset.stageSig!==sig){container.dataset.stageSig=sig;container.innerHTML=controls(r);}
    else{container.querySelectorAll('[data-economic-stage]').forEach(el=>{el.checked=!r.hidden.has(Number(el.dataset.economicStage));});}
  }
  let dialog=null,zoomGroup='',origin=null,originId='',mode='all',renderedZoomKey='';
  function finalizeClose(d){
    if(!d||d!==dialog)return;
    document.documentElement.classList.remove('has-economic-zoom');
    renderedZoomKey='';
    for(const r of records.values())r.zoomCanvas=null;
    const target=origin?.isConnected?origin:(originId?document.getElementById(originId):null);
    origin=null;originId='';
    if(target?.isConnected)target.focus({preventScroll:true});
  }
  function close(){
    if(!dialog)return;
    const d=dialog;
    if(d.open)d.close();
    finalizeClose(d);
  }
  function syncZoomModeSelect(list){
    const select=dialog?.querySelector('[data-economic-mode]');if(!select)return;
    const nextKey=list.map(r=>`${r.id}:${r.title}`).join('|');
    if(select.dataset.optionsKey===nextKey)return;
    select.dataset.optionsKey=nextKey;
    const prev=select.value;
    select.innerHTML='<option value="all">Todos los gráficos</option>'+list.map(r=>`<option value="${esc(r.id)}">${esc(r.title)}</option>`).join('');
    select.value=[...select.options].some(o=>o.value===mode)?mode:[...select.options].some(o=>o.value===prev)?prev:'all';
    mode=select.value;
  }
  function renderZoom(forceRebuild=false){
    if(!dialog?.open)return;
    const list=connected(zoomGroup);syncZoomModeSelect(list);
    const visible=mode==='all'?list:list.filter(r=>r.id===mode);
    const key=`${zoomGroup}::${mode}::${visible.map(r=>r.id).join(',')}`;
    const content=dialog.querySelector('[data-economic-zoom-content]');
    if(!forceRebuild&&renderedZoomKey===key&&visible.every(r=>r.zoomCanvas?.isConnected)){
      for(const r of visible){
        const card=content.querySelector(`[data-economic-zoom-card="${CSS.escape(r.id)}"]`);
        if(card){
          card.querySelector('h3').textContent=r.title;
          card.querySelector('figcaption p').textContent=r.spec.description||'';
          syncControls(card.querySelector('[data-economic-zoom-stages]'),r);
          r.zoomCanvas.setAttribute('aria-label',`${r.title} ampliado`);
        }
      }
      return;
    }
    for(const r of records.values())r.zoomCanvas=null;
    renderedZoomKey=key;
    content.innerHTML=visible.map(r=>`<figure class="economic-zoom-card" data-economic-zoom-card="${esc(r.id)}"><figcaption><h3>${esc(r.title)}</h3><p>${esc(r.spec.description||'')}</p></figcaption><div data-economic-zoom-stages></div><canvas id="${esc(r.id)}-zoom" role="img" aria-label="${esc(r.title)} ampliado"></canvas></figure>`).join('');
    content.classList.toggle('is-single',visible.length===1);
    for(const r of visible){
      const card=content.querySelector(`[data-economic-zoom-card="${CSS.escape(r.id)}"]`);
      syncControls(card.querySelector('[data-economic-zoom-stages]'),r);
      r.zoomCanvas=dialog.querySelector('#'+CSS.escape(r.id)+'-zoom');
      paintCanvas(r.zoomCanvas,r,'z');
    }
  }
  function open(group,trigger){
    const list=connected(group);if(!list.length)return;
    const id=list[0].options.dialogId||'economicZoomDialog';
    if(dialog?.open)close();
    if(dialog&&dialog.id!==id){const old=dialog;dialog=null;old.remove();}
    if(!dialog){
      const d=document.createElement('dialog');d.id=id;d.className='lab-zoom-dialog economic-zoom-dialog';d.setAttribute('aria-labelledby',id+'-title');
      d.innerHTML=`<header class="economic-zoom-header"><div><h2 id="${id}-title">Gráficos ampliados</h2><p>Mismos parámetros y etapas que la vista de la sección.</p></div><label>Vista<select data-economic-mode aria-label="Vista de gráficos ampliados"></select></label><button type="button" id="${id==='policyZoomDialog'?'policy-zoom-close':'economicZoomClose'}" data-economic-close>Cerrar ×</button></header><div class="economic-zoom-grid" data-economic-zoom-content></div>`;
      document.body.append(d);
      d.addEventListener('cancel',e=>{e.preventDefault();close();});
      d.addEventListener('close',()=>{if(d===dialog&&!d.open)finalizeClose(d);});
      d.addEventListener('click',e=>{if(e.target===d||e.target.closest('[data-economic-close]'))close();});
      d.addEventListener('change',e=>{if(e.target.matches('[data-economic-mode]')){mode=e.target.value;renderZoom(true);}});
      d.addEventListener('change',changeStage);
      dialog=d;
    }
    origin=trigger;originId=trigger?.id||'';zoomGroup=group;mode='all';renderedZoomKey='';
    syncZoomModeSelect(list);
    dialog.showModal();document.documentElement.classList.add('has-economic-zoom');renderZoom(true);
  }
  function changeStage(e){
    const control=e.target.closest('[data-economic-stage]');if(!control)return;
    const r=records.get(control.dataset.economicRecord),n=Number(control.dataset.economicStage);if(!r)return;
    if(control.checked)r.hidden.delete(n);else r.hidden.add(n);
    document.querySelectorAll(`[data-economic-record="${CSS.escape(r.id)}"][data-economic-stage="${n}"]`).forEach(el=>el.checked=control.checked);
    paint(r);
  }
  function mount(host,id,title,spec,options={}){
    if(!host)return;let r=records.get(id);
    if(!r||r.host!==host){
      r?.observer?.disconnect();
      r={id,host,title,spec,options,group:options.group||id,hidden:new Set(),w:0,h:0,theme:'',zw:0,zh:0,ztheme:''};
      records.set(id,r);
      host.innerHTML=`<figure class="economic-diagram"><div class="economic-diagram-tools"><span class="economic-diagram-kind">${esc(options.kind||'Diagrama económico interactivo')}</span><button type="button" id="${esc(options.buttonId||id+'-expand')}" data-economic-expand aria-haspopup="dialog">Ampliar gráficos ↗</button></div><div data-economic-stages></div><canvas id="${esc(id)}-canvas" tabindex="0" role="img" aria-haspopup="dialog" aria-label="${esc(title)}. Pulsa Enter para ampliar."></canvas><figcaption class="economic-diagram-note"></figcaption></figure>`;
      r.canvas=host.querySelector('canvas');
      host.addEventListener('click',e=>{if(e.target===r.canvas||e.target.closest('[data-economic-expand]'))open(r.group,e.target.closest('[data-economic-expand]')||r.canvas);});
      r.canvas.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();open(r.group,r.canvas);}});
      host.addEventListener('change',changeStage);
      r.observer=new ResizeObserver(()=>{
        if(!r.host.isConnected)return;
        const d=recordDims(r.canvas);
        if(d.w===0||d.h===0){r.w=0;r.h=0;return;}
        if(d.w!==r.w||d.h!==r.h){if(!frames.get(r.canvas)?.animating)paintCanvas(r.canvas,r,'');else{r.w=d.w;r.h=d.h;}}
      });
      r.observer.observe(host);
    }
    r.title=title;r.spec=spec;r.options=options;r.group=options.group||id;
    r.canvas.setAttribute('aria-label',`${title}. Pulsa Enter para ampliar.`);
    syncControls(host.querySelector('[data-economic-stages]'),r);
    host.querySelector('.economic-diagram-note').textContent=spec.description||'';
    paint(r);
    if(dialog?.open&&zoomGroup===r.group)renderZoom(false);
    return r;
  }
  let scheduled=false;
  const refresh=()=>{
    if(scheduled)return;scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;const theme=currentTheme();
      for(const [id,r]of records){
        if(!r.host.isConnected){r.observer.disconnect();records.delete(id);continue;}
        const d=recordDims(r.canvas);
        if(d.w===0||d.h===0){r.w=0;r.h=0;}
        else if(d.w!==r.w||d.h!==r.h||theme!==r.theme){if(!frames.get(r.canvas)?.animating)paintCanvas(r.canvas,r,'');}
        if(r.zoomCanvas?.isConnected){
          const zd=recordDims(r.zoomCanvas);
          if(zd.w>0&&zd.h>0&&(zd.w!==r.zw||zd.h!==r.zh||theme!==r.ztheme)){if(!frames.get(r.zoomCanvas)?.animating)paintCanvas(r.zoomCanvas,r,'z');}
        }
      }
    });
  };
  new MutationObserver(refresh).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  const observeHidden=()=>new MutationObserver(refresh).observe(document.body,{subtree:true,attributes:true,attributeFilter:['hidden']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeHidden);else observeHidden();
  window.addEventListener('resize',refresh,{passive:true});
  M.animateEconomicDiagram=animate;M.diagramStageLines=stages;M.EconomicDiagrams={mount,open};
})();
