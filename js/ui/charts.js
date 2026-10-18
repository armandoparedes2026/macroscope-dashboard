
/* Lightweight, self-contained chart renderer. Used when remote Chart.js is unavailable.
   Chart.js loads with `defer`, so the decision is taken on DOMContentLoaded (deferred scripts run before it).
   This listener is registered before the app's own DOMContentLoaded handler, so it always runs first. */
(function(){
 const M=globalThis.MacroScope;
 class ChartFallback {
  constructor(canvas,config){
   this.canvas=canvas;this.config=config;this.ctx=canvas.getContext('2d');this.destroyed=false;
   this.bars=[];this.points=[];
   this.tooltip=document.createElement('div');
   this.tooltip.style.cssText='position:absolute;z-index:8;max-width:215px;pointer-events:none;padding:10px 12px;color:var(--surface);background:var(--primary);border:1px solid var(--primary);box-shadow:0 8px 20px var(--tint-54);border-radius:9px;font:11px/1.6 DM Sans,Arial,sans-serif;display:none;white-space:pre-line;';
   this.canvas.parentElement.appendChild(this.tooltip);
   this.mouseHandler=e=>this.onMove(e);
   this.leaveHandler=()=>this.tooltip.style.display='none';
   canvas.addEventListener('mousemove',this.mouseHandler);
   canvas.addEventListener('mouseleave',this.leaveHandler);
   if(typeof ResizeObserver !== 'undefined'){this.ro=new ResizeObserver(()=>{if(!this.destroyed)this.render();});this.ro.observe(canvas.parentElement);}
   this.render();
  }
  color(index,dataset,pointIndex=0){
   const v=dataset.borderColor||dataset.backgroundColor;
   if(Array.isArray(v))return v[pointIndex%v.length];
   return v || M.color('--series-'+(index%6+1));
  }
  fmt(n){if(!Number.isFinite(n))return 'N/D';if(Math.abs(n)>=1e6)return `${(n/1e6).toFixed(1)} M`;if(Math.abs(n)>=1000)return `${(n/1000).toFixed(n%1000===0?0:1)} mil`;return Number(n).toLocaleString('es-PE',{maximumFractionDigits:1});}
  render(){
   const c=this.canvas;if(!c.isConnected||this.destroyed)return;
   const rect=c.getBoundingClientRect();
   if(!rect.width||!rect.height)return;
   const dpr=Math.min(window.devicePixelRatio||1,2);
   c.width=Math.round(rect.width*dpr);c.height=Math.round(rect.height*dpr);
   this.ctx.setTransform(dpr,0,0,dpr,0,0);
   const ctx=this.ctx,w=rect.width,h=rect.height,cfg=this.config;
   ctx.clearRect(0,0,w,h);
   const labels=cfg.data.labels||[],ds=cfg.data.datasets||[];
   const dark=document.documentElement.dataset.theme==='dark';
   const text=dark?M.color('--primary'):M.color('--primary'),axisText=dark?M.color('--primary'):M.color('--primary');
   const grid=dark?M.color('--tint-2'):M.color('--tint-88');
   const horizontal=cfg.options?.indexAxis==='y';
   const bars=ds.filter(d=>(d.type||cfg.type)==='bar'),lines=ds.filter(d=>(d.type||cfg.type)==='line');
   const showLegend=ds.length>1 && cfg.options?.plugins?.legend?.display!==false;
   const pad={left:horizontal?124:52,right:horizontal?34:14,top:showLegend?41:17,bottom:horizontal?33:43};
   if(w<470&&horizontal)pad.left=105;
   const plot={x:pad.left,y:pad.top,w:Math.max(30,w-pad.left-pad.right),h:Math.max(30,h-pad.top-pad.bottom)};
   this.plot=plot;this.horizontal=horizontal;this.labels=labels;this.ds=ds;
   const values=ds.flatMap(d=>d.data||[]).filter(v=>Number.isFinite(v));
   let min=Math.min(0,...values), max=Math.max(0,...values);
   if(min===max){min-=1;max+=1;}
   let extra=(max-min)*.09;max+=extra;min-=extra;
   this.min=min;this.max=max;
   ctx.font='500 10px DM Sans,Arial,sans-serif';ctx.textBaseline='middle';
   if(showLegend){let xx=plot.x;
    ds.forEach((d,i)=>{
      if(xx>w-110) return;
      ctx.fillStyle=this.color(i,d);ctx.beginPath();ctx.arc(xx+4,14,4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=axisText;ctx.textAlign='left';let name=d.label||'Serie';const maxWidth=Math.max(90,w-xx-14);
      while(ctx.measureText(name).width>maxWidth&&name.length>5)name=name.slice(0,-2)+'…';
      ctx.fillText(name,xx+13,14);xx+=ctx.measureText(name).width+35;
    });
   }
   const nTicks=4;
   for(let j=0;j<=nTicks;j++){
    const value=min+(max-min)*(horizontal?j:nTicks-j)/nTicks;
    if(horizontal){const x=plot.x+plot.w*j/nTicks;
      ctx.strokeStyle=grid;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,plot.y);ctx.lineTo(x,plot.y+plot.h);ctx.stroke();
      ctx.fillStyle=text;ctx.textAlign='center';ctx.fillText(this.fmt(value),x,plot.y+plot.h+15);
    }else{const y=plot.y+plot.h*j/nTicks;
      ctx.strokeStyle=grid;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(plot.x,y);ctx.lineTo(plot.x+plot.w,y);ctx.stroke();
      ctx.fillStyle=text;ctx.textAlign='right';ctx.fillText(this.fmt(value),plot.x-11,y);
    }
   }
   this.points=[];this.bars=[];
   const scaleY=v=>plot.y+plot.h-(v-min)/(max-min)*plot.h;
   const scaleX=v=>plot.x+(v-min)/(max-min)*plot.w;
   if(horizontal){
    const band=plot.h/Math.max(1,labels.length),space=Math.min(23,band*.58),barWidth=Math.max(3,space/Math.max(1,bars.length));
    labels.forEach((lab,i)=>{let label=String(lab),size=w<500?9.5:10;
      ctx.fillStyle=axisText;ctx.textAlign='right';ctx.font=`600 ${size}px DM Sans,Arial,sans-serif`;
      while(ctx.measureText(label).width>plot.x-13&&label.length>8)label=label.slice(0,-2)+'…';
      ctx.fillText(label,plot.x-10,plot.y+band*(i+.5));
      bars.forEach((d,k)=>{const v=d.data?.[i];if(!Number.isFinite(v))return;
       const zero=scaleX(0),end=scaleX(v),y=plot.y+band*(i+.5)-space/2+k*barWidth;
       ctx.fillStyle=this.color(k,d,i);this.roundRect(ctx,Math.min(zero,end),y,Math.max(2,Math.abs(end-zero)),Math.max(4,barWidth-2),4);ctx.fill();
       this.bars.push({x:Math.min(zero,end),y,w:Math.abs(end-zero),h:barWidth+2,value:v,label:lab,series:d.label});
      });
    });
   }else{
    labels.forEach((lab,i)=>{const skip=w<400?3:w<620?2:labels.length>10?2:1;if(i%skip&&i!==labels.length-1)return;
     const x=plot.x+plot.w*(i+.5)/Math.max(1,labels.length);
     ctx.font='500 10px DM Sans,Arial,sans-serif';ctx.fillStyle=text;ctx.textAlign='center';ctx.fillText(String(lab),x,plot.y+plot.h+18);
    });
    if(bars.length){
     const band=plot.w/Math.max(1,labels.length),barGroup=band*.66,one=barGroup/Math.max(1,bars.length);
     labels.forEach((lab,i)=>bars.forEach((d,k)=>{
      const v=d.data?.[i];if(!Number.isFinite(v))return;
      const x=plot.x+band*i+(band-barGroup)/2+one*k,zero=scaleY(0),top=scaleY(v);
      ctx.fillStyle=this.color(k,d,i);this.roundRect(ctx,x,Math.min(zero,top),Math.max(2,one-3),Math.max(1,Math.abs(zero-top)),4);ctx.fill();
      this.bars.push({x,y:Math.min(zero,top),w:one-3,h:Math.abs(zero-top),value:v,label:lab,series:d.label});
     }));
    }
    lines.forEach((d,ix)=>{
      const points=(d.data||[]).map((v,i)=>Number.isFinite(v)?{x:plot.x+plot.w*(i+.5)/Math.max(1,labels.length),y:scaleY(v),v,label:labels[i],series:d.label}:null);
      const color=this.color(ix,d);this.points.push(...points.filter(Boolean));
      if(d.fill){
       const gradient=ctx.createLinearGradient(0,plot.y,0,plot.y+plot.h);
       gradient.addColorStop(0,M.color('--tint-78'));gradient.addColorStop(1,M.color('--tint-89'));
       ctx.beginPath();let start=null;
       points.forEach((p,i)=>{if(!p)return;if(!start){ctx.moveTo(p.x,scaleY(0));ctx.lineTo(p.x,p.y);start=p;}else ctx.lineTo(p.x,p.y);});
       if(start){const last=points.filter(Boolean).at(-1);ctx.lineTo(last.x,scaleY(0));ctx.closePath();ctx.fillStyle=gradient;ctx.fill();}
      }
      ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=d.borderWidth||2.4;ctx.lineCap='round';ctx.lineJoin='round';
      if(d.borderDash)ctx.setLineDash(d.borderDash);
      let prev=false;points.forEach(p=>{if(!p){prev=false;return;}if(prev)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);prev=true;});ctx.stroke();ctx.setLineDash([]);
      points.forEach(p=>{if(!p)return;ctx.beginPath();ctx.arc(p.x,p.y,3.15,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle=dark?M.color('--primary'):M.color('--surface');ctx.stroke();});
    });
   }
  }
  roundRect(ctx,x,y,w,h,r){ctx.beginPath();const rr=Math.min(r,w/2,h/2);ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath();}
  onMove(e){
   const canvasRect=this.canvas.getBoundingClientRect();const x=e.clientX-canvasRect.left,y=e.clientY-canvasRect.top;
   const item=this.bars.find(v=>x>=v.x-4&&x<=v.x+v.w+4&&y>=v.y-5&&y<=v.y+v.h+5);
   let near=item;
   if(!near && !this.horizontal){let best=20;this.points.forEach(p=>{const d=Math.hypot(p.x-x,p.y-y);if(d<best){near=p;best=d;}});}
   if(!near){this.tooltip.style.display='none';return;}
   this.tooltip.textContent=`${near.label} · ${near.series||'Serie'}\n${this.fmt(near.value??near.v)}`;
   this.tooltip.style.display='block';
   const tw=this.tooltip.offsetWidth,th=this.tooltip.offsetHeight;
   this.tooltip.style.left=`${Math.max(2,Math.min(canvasRect.width-tw-2,x+12))}px`;
   this.tooltip.style.top=`${Math.max(2,Math.min(canvasRect.height-th-2,y-th-8))}px`;
  }
  get data(){return this.config.data;}
  update(){this.render();}
  destroy(){this.destroyed=true;this.ro?.disconnect();this.canvas.removeEventListener('mousemove',this.mouseHandler);this.canvas.removeEventListener('mouseleave',this.leaveHandler);this.tooltip.remove();}
 }
 window.addEventListener('DOMContentLoaded',()=>{if(typeof window.Chart==='undefined')window.Chart=ChartFallback;});
})();


(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { COUNTRIES, INDICATORS, YEARS, runtimeDB, state } = M;
  let trendChartInstance = null;
  let regionalChartInstance = null;
  let macroMixChartInstance = null;
  let comparisonChartInstance = null;
  function drawComparisonChart(years,datasets,unit) {
    if(typeof Chart==='undefined')return;
    comparisonChartInstance?.destroy();
    const palette=chartTheme();
    comparisonChartInstance=new Chart(document.getElementById('compareChart'),{type:'line',data:{labels:years,datasets},options:{responsive:true,maintainAspectRatio:false,animation:window.matchMedia('(prefers-reduced-motion: reduce)').matches?false:{duration:250},plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.parsed.y===null?'sin dato':ctx.parsed.y.toLocaleString('es-PE')} · ${unit}`}}},scales:{x:{ticks:{color:palette.tick,maxRotation:0},grid:{color:palette.grid}},y:{title:{display:true,text:unit,color:palette.ink},ticks:{color:palette.tick},grid:{color:palette.grid}}}}});
  }
  M.drawComparisonChart=drawComparisonChart;
  // Resolve cross-view callbacks when invoked, after every deferred script has loaded.
  const fmtNum = (...args) => M.fmtNum(...args);
  const formatValue = (...args) => M.formatValue(...args);
  const getFilteredYears = (...args) => M.getFilteredYears(...args);
  const roundTo = (...args) => M.roundTo(...args);
    function chartTheme() {
      const vars = getComputedStyle(document.documentElement);
      return {tick:vars.getPropertyValue('--chart-tick').trim()||M.color('--primary'),grid:vars.getPropertyValue('--grid').trim()||M.color('--tint-59'),ink:vars.getPropertyValue('--ink').trim()||M.color('--primary'),paper:vars.getPropertyValue('--paper').trim()||M.color('--surface')};
    }
    function renderCharts() {
      M.renderComparison?.();
      const years=getFilteredYears();
      const meta=INDICATORS[state.activeIndicator];
      const c=COUNTRIES[state.country],b=COUNTRIES[state.benchmark];
      const palette=chartTheme();
      document.getElementById('trendChartTitle').textContent=`Evolución · ${meta.title}`;
      document.getElementById('trendChartSubtitle').textContent=`${c.flag} ${c.name} frente a ${b.flag} ${b.name} · ${meta.unit}`;
      const countries=['PER','CHL','COL','MEX','BRA','LCN','USA'];
      const commonYear=YEARS.slice().reverse().find(y=>countries.every(k=>Number.isFinite(runtimeDB[k]?.[state.activeIndicator]?.[y])));
      document.getElementById('regionalChartTitle').textContent=`Comparación internacional · ${meta.title}`;
      document.getElementById('regionalChartSubtitle').textContent=`${commonYear||'Sin datos comparables'} · mismo año para las siete economías`;
      if(typeof Chart==='undefined')return;
      const ticks={color:palette.tick,font:{family:'DM Sans',size:10},maxRotation:0};
      const grid={color:palette.grid};
      const legend={labels:{color:palette.ink,usePointStyle:true,pointStyle:'circle',boxWidth:7,boxHeight:7,padding:18,font:{family:'DM Sans',size:11,weight:'600'}}};
      const tooltip={backgroundColor:M.color('--primary'),titleColor:M.color('--surface'),bodyColor:M.color('--text-muted'),padding:12,cornerRadius:9,displayColors:true,callbacks:{label(ctx){return `${ctx.dataset.label}: ${formatValue(ctx.parsed.y??ctx.parsed.x,state.activeIndicator)}`;}}};
      const core={responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend,tooltip}};
      const primary=years.map(y=>runtimeDB[state.country]?.[state.activeIndicator]?.[y]??null);
      const bench=years.map(y=>runtimeDB[state.benchmark]?.[state.activeIndicator]?.[y]??null);
      if(trendChartInstance)trendChartInstance.destroy();
      trendChartInstance=new Chart(document.getElementById('trendChart'),{type:'line',data:{labels:years,datasets:[{label:c.name,data:primary,borderColor:M.color('--primary'),backgroundColor:M.color('--tint-79'),fill:true,tension:.28,borderWidth:2.5,pointRadius:3.3,pointHoverRadius:6,pointBackgroundColor:M.color('--primary'),pointBorderWidth:2,pointBorderColor:palette.paper},...(state.country===state.benchmark?[]:[{label:b.name,data:bench,borderColor:M.color('--success'),borderDash:[6,5],tension:.28,borderWidth:2,pointRadius:2.6,pointHoverRadius:5,pointBackgroundColor:M.color('--success')}])]},options:{...core,scales:{x:{ticks,grid:{display:false},border:{display:false}},y:{ticks,grid,border:{display:false}}}}});
      if(regionalChartInstance)regionalChartInstance.destroy();
      regionalChartInstance=new Chart(document.getElementById('regionalChart'),{type:'bar',data:{labels:countries.map(k=>COUNTRIES[k].name),datasets:[{label:`${meta.title} (${meta.unit})`,data:countries.map(k=>commonYear?runtimeDB[k]?.[state.activeIndicator]?.[commonYear]:null),backgroundColor:countries.map(k=>k===state.country?M.color('--primary'):k===state.benchmark?M.color('--success'):M.color('--primary')),borderRadius:5,barPercentage:.65}]},options:{...core,indexAxis:'y',plugins:{legend:{display:false},tooltip:{...tooltip,callbacks:{label(ctx){return formatValue(ctx.parsed.x,state.activeIndicator);}}}},scales:{x:{ticks,grid,border:{display:false}},y:{ticks:{...ticks,color:palette.ink},grid:{display:false},border:{display:false}}}}});
      const gdp=years.map(y=>runtimeDB[state.country]?.['NY.GDP.MKTP.KD.ZG']?.[y]??null);
      const inf=years.map(y=>runtimeDB[state.country]?.['FP.CPI.TOTL.ZG']?.[y]??null);
      if(macroMixChartInstance)macroMixChartInstance.destroy();
      macroMixChartInstance=new Chart(document.getElementById('macroMixChart'),{type:'bar',data:{labels:years,datasets:[{type:'bar',label:'Crecimiento PBI (%)',data:gdp,backgroundColor:gdp.map(v=>v===null?M.color('--primary'):v>=0?M.color('--tint-90'):M.color('--tint-91')),borderRadius:4,barPercentage:.7},{type:'line',label:'Inflación IPC (%)',data:inf,borderColor:M.color('--warning'),backgroundColor:M.color('--warning'),borderWidth:2.5,pointRadius:2.7,pointHoverRadius:5,tension:.25}]},options:{...core,plugins:{...core.plugins,tooltip:{...tooltip,callbacks:{label(ctx){return `${ctx.dataset.label}: ${ctx.parsed.y===null?'N/D':Number(ctx.parsed.y).toFixed(1)+'%'}`;}}}},scales:{x:{ticks,grid:{display:false},border:{display:false}},y:{ticks,grid,border:{display:false}}}}});
    }

    function clipLine(line, xr, yr) {
      const { a, b, c } = line, pts = [];
      if (Math.abs(b) > 1e-12) [xr[0], xr[1]].forEach(x => { const y = (c - a * x) / b; if (y >= yr[0] - 1e-9 && y <= yr[1] + 1e-9) pts.push([x, y]); });
      if (Math.abs(a) > 1e-12) [yr[0], yr[1]].forEach(y => { const x = (c - b * y) / a; if (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9) pts.push([x, y]); });
      if (pts.length < 2) return null;
      let best = [pts[0], pts[1]], dist = -1;
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
        if (d > dist) { dist = d; best = [pts[i], pts[j]]; }
      }
      return best;
    }
    const sameLine = (l1, l2) => {
      const n1 = Math.hypot(l1.a, l1.b) || 1, n2 = Math.hypot(l2.a, l2.b) || 1;
      return Math.abs(l1.a / n1 - l2.a / n2) < 1e-9 && Math.abs(l1.b / n1 - l2.b / n2) < 1e-9 && Math.abs(l1.c / n1 - l2.c / n2) < 1e-6;
    };
    function niceTicks(lo, hi, count = 4) {
      const raw = (hi - lo) / count, mag = 10 ** Math.floor(Math.log10(raw)), norm = raw / mag;
      const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
      const ticks = [];
      for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) ticks.push(roundTo(v, 6));
      return { ticks, decimals: step >= 1 ? 0 : step >= 0.1 ? 1 : 2 };
    }
    function axisRange(values, center, minHalf) {
      const finite = values.filter(Number.isFinite);
      const pad = minHalf * 0.3;
      return [Math.min(center - minHalf, ...finite.map(v => v - pad)), Math.max(center + minHalf, ...finite.map(v => v + pad))];
    }
    function drawDiagram(canvas, spec) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);
      const css = getComputedStyle(document.documentElement);
      const color = name => css.getPropertyValue(name).trim() || M.color('--text-muted');
      const font = (size, weight = 500) => `${weight} ${size}px 'DM Sans', system-ui, sans-serif`;
      if (spec.message) {
        ctx.fillStyle = color('--muted'); ctx.font = font(12, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const words = spec.message.split(' '); let line = '', y = h / 2 - 18;
        words.forEach(word => { if (ctx.measureText(`${line}${word} `).width > w - 40) { ctx.fillText(line.trim(), w / 2, y); line = ''; y += 18; } line += `${word} `; });
        ctx.fillText(line.trim(), w / 2, y);
        return;
      }
      const pad = { l: 46, r: 16, t: 14, b: 32 };
      const pw = w - pad.l - pad.r, ph = h - pad.t - pad.b;
      const [x0, x1] = spec.x.range, [y0, y1] = spec.y.range;
      const sx = x => pad.l + (x - x0) / (x1 - x0) * pw, sy = y => pad.t + ph - (y - y0) / (y1 - y0) * ph;
      ctx.lineWidth = 1; ctx.font = font(10); ctx.fillStyle = color('--chart-tick'); ctx.strokeStyle = color('--grid');
      const xt = niceTicks(x0, x1), yt = niceTicks(y0, y1);
      xt.ticks.forEach(xv => {
        ctx.beginPath(); ctx.moveTo(sx(xv), pad.t); ctx.lineTo(sx(xv), pad.t + ph); ctx.stroke();
        ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(fmtNum(xv, xt.decimals), sx(xv), pad.t + ph + 6);
      });
      yt.ticks.forEach(yv => {
        ctx.beginPath(); ctx.moveTo(pad.l, sy(yv)); ctx.lineTo(pad.l + pw, sy(yv)); ctx.stroke();
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(fmtNum(yv, yt.decimals), pad.l - 6, sy(yv));
      });
      ctx.strokeStyle = color('--line-strong'); ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + ph); ctx.lineTo(pad.l + pw, pad.t + ph); ctx.stroke();
      ctx.fillStyle = color('--muted'); ctx.font = font(10, 700);
      ctx.textAlign = 'right'; ctx.textBaseline = 'bottom'; ctx.fillText(spec.x.label, pad.l + pw, pad.t + ph - 4);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(spec.y.label, pad.l + 6, pad.t + 2);
      ctx.save(); ctx.beginPath(); ctx.rect(pad.l, pad.t, pw, ph); ctx.clip();
      const labels = [];
      spec.lines.forEach(l => {
        const seg = clipLine(l.line, spec.x.range, spec.y.range);
        if (!seg) return;
        ctx.strokeStyle = color(l.color); ctx.globalAlpha = l.initial ? 0.55 : 1; ctx.lineWidth = l.initial ? 1.6 : 2.4;
        ctx.setLineDash(l.initial ? [6, 5] : []);
        ctx.beginPath(); ctx.moveTo(sx(seg[0][0]), sy(seg[0][1])); ctx.lineTo(sx(seg[1][0]), sy(seg[1][1])); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        if (l.label) {
          // Final curves are labelled at their top-right end, initial ones at the opposite end, so pairs never collide.
          const ranked = seg.slice().sort((p, q) => (sx(q[0]) - sy(q[1])) - (sx(p[0]) - sy(p[1])));
          const end = l.initial ? ranked[1] : ranked[0];
          labels.push({ text: l.label, x: sx(end[0]), y: sy(end[1]), color: color(l.color), initial: l.initial });
        }
      });
      (spec.points || []).forEach(p => {
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
        const px = sx(p.x), py = sy(p.y);
        if (p.guides) {
          ctx.strokeStyle = color('--subtle'); ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, pad.t + ph); ctx.moveTo(px, py); ctx.lineTo(pad.l, py); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.arc(px, py, p.hollow ? 4.5 : 5, 0, Math.PI * 2);
        ctx.lineWidth = 2; ctx.strokeStyle = color(p.color || '--ink-deep');
        if (p.hollow) { ctx.fillStyle = color('--paper-3'); ctx.fill(); ctx.stroke(); }
        else { ctx.fillStyle = color(p.color || '--ink-deep'); ctx.fill(); }
        ctx.fillStyle = color(p.color || '--ink-deep'); ctx.font = font(10.5, 800); ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, px + 7, py - 4);
      });
      ctx.restore();
      labels.forEach(l => {
        ctx.font = font(10.5, 800); ctx.fillStyle = l.color; ctx.globalAlpha = l.initial ? 0.75 : 1;
        const tw = ctx.measureText(l.text).width;
        const x = Math.min(Math.max(l.x + 4, pad.l + 2), pad.l + pw - tw - 2), y = Math.min(Math.max(l.y + 2, pad.t + 12), pad.t + ph - 2);
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'; ctx.fillText(l.text, x, y); ctx.globalAlpha = 1;
      });
    }

  Object.assign(M, { axisRange, chartTheme, clipLine, drawDiagram, niceTicks, renderCharts, sameLine });
})();
