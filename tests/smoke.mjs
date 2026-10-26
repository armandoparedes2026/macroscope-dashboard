import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { Script } from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html',root),'utf8');
const requiredIds = ['countrySelect','benchmarkSelect','periodSelect','kpiGrid','trendChart','regionalChart','macroMixChart','islmRegime','islmMobility','islmInstrument','islmPresets','islmPanelISLM','islmPanelMF','islmPanelMoney','islmPanelCross','islmResults','islmNarrative','islmClasses','islmPolicyTable','macroTableBody','exportCsvBtn','insightGrid','inicio','fuentes','ayuda','sourceFilters','helpGlossary','panoramaKpis','panoramaMainChart','panoramaSideChart','panoramaInsights','panoramaSegmentActivity','panoramaReportBtn','panoramaDataBadge'];
for(const id of requiredIds) if(!html.includes(`id="${id}"`)) throw Error(`Falta #${id}`);
for(const [i,match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].entries())new Script(match[1],{filename:`inline-${i}.js`});
function walk(dir){return readdirSync(dir).filter(n=>!['node_modules','.git','test-results'].includes(n)).flatMap(n=>{const p=new URL(n,dir);return statSync(p).isDirectory()?walk(new URL(n+'/',dir)):[p];});}
const files=walk(root);
const scripts=files.filter(p=>p.pathname.endsWith('.js'));
for(const path of scripts){if(path.href.startsWith(new URL('js/',root).href))new Script(readFileSync(path,'utf8'),{filename:fileURLToPath(path)});const r=spawnSync(process.execPath,['--check',fileURLToPath(path)],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}
if(html.split('\n').length>=450)throw Error('index.html debe tener menos de 450 l?neas');
for(const match of html.matchAll(/<script\b[^>]*src="[^"]+"[^>]*>/gi)){if(!/\bdefer\b/.test(match[0])||/type="module"/.test(match[0]))throw Error('Los scripts externos deben ser cl?sicos con defer');}
const refs=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/gi)].map(m=>m[1]).filter(r=>!/^https?:/.test(r));
for(const ref of refs)if(!existsSync(new URL(ref,root)))throw Error(`Referencia inexistente: ${ref}`);
for(const p of files.filter(p=>/\/(?:js|css)\//.test(p.pathname)&&/\.(js|css)$/.test(p.pathname))){const rel=p.href.slice(root.href.length);if(!refs.includes(rel))throw Error(`Recurso del navegador sin referencia: ${rel}`);}
const source=html+'\n'+files.filter(p=>/\.(js|css)$/.test(p.pathname)).map(p=>readFileSync(p,'utf8')).join('\n');
for(const fragment of ['api.worldbank.org','open.er-api.com','name="viewport"','@media'])if(!source.includes(fragment))throw Error(`Falta: ${fragment}`);
if(!/<script[^>]*integrity="sha384-dug\+JxfBvklEQdJ4AYuBBAIScUz0bVN73xpy273gcAwHjb3qI0fXmuYNaNfdyYJG"/.test(html))throw Error('Falta SRI de Chart.js');
console.log(`MacroScope OK: ${requiredIds.length} controles, ${scripts.length} archivos JS válidos, referencias locales y SRI verificados.`);
