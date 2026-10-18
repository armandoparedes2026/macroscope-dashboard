import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const requiredIds = [
  'countrySelect', 'benchmarkSelect', 'periodSelect',
  'kpiGrid', 'trendChart', 'regionalChart', 'macroMixChart',
  'simChart', 'simRevenueInput', 'simMarginInput',
  'simUsdCostInput', 'simGdpShock', 'simInfShock', 'simFxShock',
  'macroTableBody', 'exportCsvBtn', 'insightTrack',
  'carouselPrev', 'carouselNext'
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    throw new Error(`Falta el elemento principal #${id}`);
  }
}

const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1].trim())
  .filter(Boolean);
if (scripts.length < 2) throw new Error('No se encontraron los scripts principales');
for (const [index, source] of scripts.entries()) {
  new Script(source, { filename: `inline-${index + 1}.js` });
}

for (const fragment of ['api.worldbank.org', 'open.er-api.com', 'name="viewport"', '@media']) {
  if (!html.includes(fragment)) throw new Error(`No se encontró: ${fragment}`);
}

console.log(`MacroScope OK: ${requiredIds.length} controles, ${scripts.length} scripts JavaScript válidos, APIs y estilos adaptables presentes.`);
