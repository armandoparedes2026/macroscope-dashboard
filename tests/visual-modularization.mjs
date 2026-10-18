import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const phase = process.argv[2] || 'after';
const root = new URL('../docs/evidence/fase-modularizacion/', import.meta.url);
await mkdir(new URL(phase+'/', root), {recursive:true});
const browser = await chromium.launch();
const results=[];
try {
 for (const width of [1440,390]) for(const theme of ['dark','light']) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',deviceScaleFactor:1});
  const page=await context.newPage();
  await page.route(/^https?:/, route=>route.abort());
  await page.addInitScript(({theme})=>{
   const RealDate=Date; const stamp=RealDate.parse('2026-10-18T12:00:00Z');
   globalThis.Date=class extends RealDate {constructor(...args){super(...(args.length?args:[stamp]));} static now(){return stamp;}};
   localStorage.clear();localStorage.setItem('macroscope_theme',theme);
  },{theme});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(new URL('../index.html',import.meta.url).href);
  await page.waitForFunction(()=>!document.querySelector('#syncApiBtn').disabled);
  for(const tab of ['overview','simulator','data']) {
   await page.locator(`.tab-btn[data-tab="${tab}"]`).locator('visible=true').first().click();
   // Settle reveal observers over the full page before recording.
   for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=650){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(30);}
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);
   const name=`${width}-${theme}-${tab}.png`;
   const png=await page.screenshot({fullPage:true,animations:'disabled',path:new URL(`${phase}/${name}`,root).pathname.replace(/^\/([A-Z]:)/,'$1')});
   if(phase==='after') {
    const before=await readFile(new URL(`before/${name}`,root));
    const diff=await page.evaluate(async ({a,b})=>{
     async function decode(src){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);return {width:c.width,height:c.height,data:ctx.getImageData(0,0,c.width,c.height).data};}
     const x=await decode(a),y=await decode(b);let changed=0,maxDelta=0;
     if(x.width!==y.width||x.height!==y.height)return {sameSize:false,before:[x.width,x.height],after:[y.width,y.height],ratio:1};
     for(let i=0;i<x.data.length;i+=4){let d=0;for(let j=0;j<4;j++)d=Math.max(d,Math.abs(x.data[i+j]-y.data[i+j]));if(d>8)changed++;maxDelta=Math.max(maxDelta,d);}
     return {sameSize:true,width:x.width,height:x.height,changed,ratio:changed/(x.width*x.height),maxDelta};
    },{a:'data:image/png;base64,'+before.toString('base64'),b:'data:image/png;base64,'+png.toString('base64')});
    results.push({name,identicalBuffer:before.equals(png),...diff});
   }
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 if(phase==='after') {await writeFile(new URL('visual-comparison.json',root),JSON.stringify({threshold:{channelDelta:8,maxChangedPixelRatio:0.001},results},null,2)+'\n');assert.ok(results.every(r=>r.sameSize&&r.ratio<=0.001),'visual difference exceeds threshold');}
 console.log(`${phase}: 12 screenshots, offline, file://, 1440/390, dark/light; visual checks passed`);
} finally {await browser.close();}
