import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const path=fileURLToPath(new URL('./',import.meta.url));
const pageUrl=new URL('../../../index.html#comparacion',import.meta.url).href;
await mkdir(path,{recursive:true});
const browser=await chromium.launch();
const audits=[];
for(const [width,height] of [[1680,940],[1440,900],[768,950],[390,844],[360,800]]){
  for(const theme of ['light','dark']){
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route(/^https?:/,route=>route.abort());
    await page.goto(pageUrl);
    await page.waitForFunction(()=>document.querySelectorAll('#cd-kpis .cd-kpi').length===6);
    await page.waitForFunction(()=>document.querySelector('#apiStatusText')?.textContent?.includes('Respaldo local'),null,{timeout:18000});
    await page.evaluate(t=>{document.documentElement.dataset.theme=t;window.scrollTo(0,0);},theme);
    await page.waitForTimeout(80);
    const audit=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,panels:document.querySelectorAll('#comparacion .cd-panel').length,kpis:document.querySelectorAll('#cd-kpis .cd-kpi').length,mode:document.querySelector('#comparacion').dataset.mode}));
    await page.screenshot({path:`${path}/${width}-${theme}.png`,fullPage:true,animations:'disabled'});
    audits.push({...audit,theme,errors});
    await context.close();
  }
}
await writeFile(`${path}/audit.json`,JSON.stringify(audits,null,2));
console.log(audits);
await browser.close();
