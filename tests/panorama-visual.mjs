// Optional manual visual audit with real official BCRP responses (not part of npm test).
// Run with network permissions: node tests/panorama-visual.mjs
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {parseBcrp} from '../api/bcrp.js';

const monthly=['PD04722MM','PN01273PM','PN01207PM','PN00027MM','PD38045AM','PN38723BM','PN01773AM','PN38714BM','PN38718BM'];
const url=codes=>`https://estadisticas.bcrp.gob.pe/estadisticas/series/api/${codes.join('-')}/json/2015-1/${codes.includes('PN02507AQ')?'2026-4':'2026-10'}`;
const fetchRows=async codes=>parseBcrp(execFileSync('curl',['--fail','--silent','--show-error','--max-time','20',url(codes)],{encoding:'utf8'}),codes);
const [m,q]=await Promise.all([fetchRows(monthly),fetchRows(['PN02507AQ'])]);
console.log('BCRP latest:', [...m,...q].map(row=>`${row.code}: ${row.observations.filter(point=>Number.isFinite(point.value)).at(-1)?.period||'sin observación'}`).join(' · '));
await mkdir('test-results',{recursive:true});
const browser=await chromium.launch();
try{
  for(const [name,width,height,mode]of [['reference-desktop',1672,941,'light'],['desktop',1440,1100,'light'],['tablet',768,1100,'light'],['mobile',390,1100,'light'],['dark',1440,1100,'dark']]){
    const page=await browser.newPage({viewport:{width,height},colorScheme:mode==='dark'?'dark':'light'});
    await page.route(/^https?:/,async route=>{
      const request=route.request().url();
      if(!request.includes('/api/bcrp'))return route.abort();
      const codes=new URL(request).searchParams.get('codes')?.split('-')||[];
      const list=(codes.includes('PN02507AQ')?q:m).filter(row=>codes.includes(row.code));
      return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(list.length===1?list[0]:list)});
    });
    await page.goto(new URL('../index.html',import.meta.url).href+'#panorama');
    await page.waitForFunction(()=>document.getElementById('panoramaDataBadge').textContent.includes('mensual: ok'));
    await page.screenshot({path:`test-results/panorama-${name}.png`,animations:'disabled'});
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,kpis:document.querySelectorAll('#panoramaKpis .p-kpi').length,
      gridRows:getComputedStyle(document.querySelector('.p-analytics-grid')).gridTemplateRows,
      panels:['.p-main-panel','.p-main-chart','.p-side-panel','.p-side-chart','.p-reading','.p-minis'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [selector,Math.round(r.top),Math.round(r.bottom),Math.round(r.height)];}),
      miniFooters:[...document.querySelectorAll('.p-mini')].map(card=>{const r=card.getBoundingClientRect(),footer=card.querySelector('.p-mini-footer').getBoundingClientRect();return {title:card.querySelector('strong').textContent,overhang:Math.round(footer.bottom-r.bottom)};}),
      boxes:['.content','#tab-overview','.filter-bar','.p-dashboard','.p-kpi-grid','.p-analytics-grid','.topbar'].map(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return [selector,Number(r.left.toFixed(1)),Number(r.right.toFixed(1))]})}));
    console.log(name,metrics);
    if(metrics.miniFooters.some(item=>item.overhang>-5))throw new Error(`${name}: pie de minigráfico desborda su tarjeta: ${JSON.stringify(metrics.miniFooters)}`);
    await page.close();
  }
}finally{await browser.close();}
