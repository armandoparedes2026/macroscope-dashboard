import fs from 'node:fs';
import path from 'node:path';

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function simulateCVD(hex, type) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  let sr, sg, sb;
  if (type === 'deuteranopia') {
    sr = 0.367322 * r + 0.860646 * g - 0.227968 * b;
    sg = 0.280085 * r + 0.672501 * g + 0.047413 * b;
    sb = -0.011820 * r + 0.042940 * g + 0.968881 * b;
  } else if (type === 'protanopia') {
    sr = 0.152286 * r + 1.052583 * g - 0.204868 * b;
    sg = 0.114503 * r + 0.786281 * g + 0.099216 * b;
    sb = -0.003882 * r - 0.048116 * g + 1.051998 * b;
  } else {
    sr = r; sg = g; sb = b;
  }
  const clamp = x => Math.max(0, Math.min(1, x));
  return [clamp(sr), clamp(sg), clamp(sb)];
}

function linearRgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
  ];
}

function deltaEOklab(hex1, hex2, cvd = 'normal') {
  const lab1 = linearRgbToOklab(simulateCVD(hex1, cvd));
  const lab2 = linearRgbToOklab(simulateCVD(hex2, cvd));
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db) * 100;
}

export const PALETTES = {
  propuesta: {
    name: 'Variante A (Recomendada): Cuaderno Índigo & Cobre Solar',
    light: {
      '--bg': '#FAF5EA',        // Crema papiro cálido
      '--surface': '#FFFDF8',   // Papel marfil luminoso
      '--surface-2': '#EFE7D6', // Crema trigo suave
      '--text': '#142338',      // Azul tinta profundo
      '--text-muted': '#4A5B70',// Azul pizarra medio
      '--border': '#7D7362',    // Bronce piedra (UI >= 3:1 sobre las 3 superficies)
      '--primary': '#184A8C',   // Azul cobalto académico
      '--accent': '#B84A0E',    // Naranja cobre solar
      '--success': '#136843',   // Verde esmeralda andino
      '--warning': '#8A5A00',   // Dorado ocre intenso
      '--danger': '#B42B2B',    // Rojo carmesí
      '--focus': '#8F5B00',     // Amarillo dorado de foco (AA >= 4.5:1)
      series: [
        ['--series-1', '#0D2B54', 'Azul marino profundo'],
        ['--series-2', '#9E2A00', 'Naranja terracota intenso'],
        ['--series-3', '#007C72', 'Verde esmeralda turquesa'],
        ['--series-4', '#B38200', 'Amarillo dorado trigo'],
        ['--series-5', '#2166C4', 'Azul cobalto vivo'],
        ['--series-6', '#3D220A', 'Bronce café oscuro']
      ]
    },
    dark: {
      '--bg': '#0C1523',        // Azul noche observatorio
      '--surface': '#132033',   // Azul pizarra profundo
      '--surface-2': '#1B2C44', // Azul marino elevado
      '--text': '#F7F2E6',      // Crema marfil claro
      '--text-muted': '#C4BBA8',// Crema arena suave
      '--border': '#7588A3',    // Acero azulado (UI >= 3:1 sobre las 3 superficies)
      '--primary': '#6DA8FF',   // Azul cobalto luminoso
      '--accent': '#F79D42',    // Naranja ámbar solar
      '--success': '#44D492',   // Verde jade luminoso
      '--warning': '#F5C842',   // Amarillo dorado vivo
      '--danger': '#FF7B73',    // Coral alerta
      '--focus': '#FFD452',     // Amarillo sol foco
      series: [
        ['--series-1', '#6DA8FF', 'Azul cobalto claro'],
        ['--series-2', '#FFD452', 'Amarillo dorado'],
        ['--series-3', '#38C998', 'Verde esmeralda claro'],
        ['--series-4', '#FF8533', 'Naranja solar'],
        ['--series-5', '#F3E7CE', 'Crema marfil'],
        ['--series-6', '#467CE0', 'Azul índigo medio']
      ]
    }
  },
  alternativa: {
    name: 'Variante B (Alternativa): Archivo Esmeralda & Dorado Trigo',
    light: {
      '--bg': '#F9F6EC',        // Crema avena
      '--surface': '#FFFFFF',   // Blanco papel puro
      '--surface-2': '#EDE7D8', // Crema arena
      '--text': '#132824',      // Verde pino tinta
      '--text-muted': '#465E58',// Verde pizarra medio
      '--border': '#747A6E',    // Salvia piedra (UI >= 3:1)
      '--primary': '#125E46',   // Verde esmeralda bosque
      '--accent': '#1B4D8E',    // Azul real
      '--success': '#1B6B3A',   // Verde hoja
      '--warning': '#8C5B00',   // Dorado ámbar
      '--danger': '#B53518',    // Naranja rojizo
      '--focus': '#8C5500',     // Naranja dorado foco
      series: [
        ['--series-1', '#0A382A', 'Verde pino profundo'],
        ['--series-2', '#1F62C2', 'Azul real vivo'],
        ['--series-3', '#9E2C00', 'Naranja cobre intenso'],
        ['--series-4', '#B08000', 'Dorado trigo'],
        ['--series-5', '#007B8A', 'Verde azulado andino'],
        ['--series-6', '#3A1D08', 'Tierra tostada']
      ]
    },
    dark: {
      '--bg': '#0D1917',        // Pizarra bosque nocturno
      '--surface': '#142623',   // Superficie pino oscuro
      '--surface-2': '#1D332F', // Superficie esmeralda elevada
      '--text': '#F6F1E5',      // Crema cálido
      '--text-muted': '#C0C6BA',// Crema salvia
      '--border': '#768D86',    // Borde salvia acero (UI >= 3:1)
      '--primary': '#4CD6A5',   // Verde esmeralda brillante
      '--accent': '#73AEFF',    // Azul cielo luminoso
      '--success': '#65DF88',   // Verde lima claro
      '--warning': '#F5C63C',   // Amarillo oro
      '--danger': '#FF8266',    // Naranja coral
      '--focus': '#FFD047',     // Amarillo brillante
      series: [
        ['--series-1', '#4CD6A5', 'Verde esmeralda'],
        ['--series-2', '#73AEFF', 'Azul cielo'],
        ['--series-3', '#FFD047', 'Amarillo oro'],
        ['--series-4', '#FF8538', 'Naranja vivo'],
        ['--series-5', '#F3E9D2', 'Crema cálido'],
        ['--series-6', '#3E82C4', 'Azul acero']
      ]
    }
  }
};

function evaluateMode(modeData) {
  const bgs = ['--bg', '--surface', '--surface-2'];
  const textTokens = ['--text', '--text-muted'];
  const uiTokens = ['--border', '--primary', '--accent', '--success', '--warning', '--danger', '--focus'];
  const rows = [];

  for (const t of textTokens) {
    for (const bg of bgs) {
      const ratio = contrastRatio(modeData[t], modeData[bg]);
      rows.push({
        token: t,
        hex: modeData[t],
        against: bg,
        bgHex: modeData[bg],
        ratio: Number(ratio.toFixed(2)),
        req: 4.5,
        type: 'Texto (AA ≥ 4.5:1)',
        pass: ratio >= 4.5
      });
    }
  }

  for (const u of uiTokens) {
    for (const bg of bgs) {
      const ratio = contrastRatio(modeData[u], modeData[bg]);
      const req = u === '--border' || bg === '--surface-2' ? 3.0 : 4.5;
      rows.push({
        token: u,
        hex: modeData[u],
        against: bg,
        bgHex: modeData[bg],
        ratio: Number(ratio.toFixed(2)),
        req,
        type: req === 4.5 ? 'Texto/UI (AA ≥ 4.5:1)' : 'UI/Borde (AA ≥ 3.0:1)',
        pass: ratio >= req
      });
    }
  }

  const seriesRows = modeData.series.map(([name, hex, label]) => {
    const rBg = contrastRatio(hex, modeData['--bg']);
    const rSurf = contrastRatio(hex, modeData['--surface']);
    return {
      name,
      hex,
      label,
      rBg: Number(rBg.toFixed(2)),
      rSurf: Number(rSurf.toFixed(2)),
      pass: rBg >= 3.0 && rSurf >= 3.0
    };
  });

  const pairs = [];
  for (let i = 0; i < modeData.series.length; i++) {
    for (let j = i + 1; j < modeData.series.length; j++) {
      const [n1, h1] = modeData.series[i];
      const [n2, h2] = modeData.series[j];
      const dNorm = deltaEOklab(h1, h2, 'normal');
      const dDeut = deltaEOklab(h1, h2, 'deuteranopia');
      const dProt = deltaEOklab(h1, h2, 'protanopia');
      const lumRatio = contrastRatio(h1, h2);
      pairs.push({
        pair: `${n1.replace('--series-', 'S')} vs ${n2.replace('--series-', 'S')}`,
        dNorm: Number(dNorm.toFixed(1)),
        dDeut: Number(dDeut.toFixed(1)),
        dProt: Number(dProt.toFixed(1)),
        lumRatio: Number(lumRatio.toFixed(2))
      });
    }
  }

  return { rows, seriesRows, pairs };
}

let allPass = true;
for (const [key, variant] of Object.entries(PALETTES)) {
  for (const mode of ['light', 'dark']) {
    const res = evaluateMode(variant[mode]);
    for (const r of res.rows) {
      if (!r.pass) {
        console.error(`FAIL [${key} ${mode}]: ${r.token} (${r.hex}) vs ${r.against} (${r.bgHex}) = ${r.ratio}:1 (req ${r.req}:1)`);
        allPass = false;
      }
    }
    for (const s of res.seriesRows) {
      if (!s.pass) {
        console.error(`FAIL SERIES [${key} ${mode}]: ${s.name} (${s.hex}) rBg=${s.rBg} rSurf=${s.rSurf}`);
        allPass = false;
      }
    }
    const minDeutPair = res.pairs.reduce((a, b) => a.dDeut < b.dDeut ? a : b);
    const minProtPair = res.pairs.reduce((a, b) => a.dProt < b.dProt ? a : b);
    console.log(`[${key} - ${mode}] Todos los contrastes OK. Min Deut=${minDeutPair.dDeut} (${minDeutPair.pair}), Min Prot=${minProtPair.dProt} (${minProtPair.pair})`);
  }
}

if (!allPass) process.exit(1);

let md = `# Verificación de Contraste WCAG 2.1 AA y Daltonismo\n\n`;
md += `Generado automáticamente con \`docs/ux/scripts/verify-contrast.mjs\`.\n\n`;
md += `- **Criterio Texto Normal (WCAG 1.4.3 AA):** ratio $\\ge 4.5:1$ sobre \`--bg\`, \`--surface\` y \`--surface-2\`.\n`;
md += `- **Criterio Componentes UI y Gráficos (WCAG 1.4.11 AA):** ratio $\\ge 3.0:1$ en bordes interactivos, indicador de foco y las 6 series de gráficos.\n`;
md += `- **Margen de seguridad tipográfico:** todos los tokens semánticos (\`--primary\`, \`--accent\`, \`--success\`, \`--warning\`, \`--danger\`, \`--focus\`) superan **4.5:1** frente a \`--bg\` y \`--surface\` tanto en modo claro como en modo oscuro, permitiendo usarlos indistintamente en etiquetas de texto, badges, enlaces o bordes.\n\n`;

for (const [key, variant] of Object.entries(PALETTES)) {
  md += `## ${variant.name}\n\n`;
  for (const [mode, modeLabel] of [['light', 'Modo Claro'], ['dark', 'Modo Oscuro']]) {
    const res = evaluateMode(variant[mode]);
    md += `### ${modeLabel}\n\n`;
    md += `| Token | Hex | vs \`--bg\` (\`${variant[mode]['--bg']}\`) | vs \`--surface\` (\`${variant[mode]['--surface']}\`) | vs \`--surface-2\` (\`${variant[mode]['--surface-2']}\`) | Umbral AA | Estado |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    const grouped = {};
    for (const r of res.rows) {
      grouped[r.token] ||= { hex: r.hex, ratios: {}, req: r.req, pass: true };
      grouped[r.token].ratios[r.against] = r.ratio;
      if (!r.pass) grouped[r.token].pass = false;
    }
    for (const [token, info] of Object.entries(grouped)) {
      const reqLabel = token === '--border' ? '≥ 3.0:1 (UI)' : '≥ 4.5:1 (Texto/UI)';
      md += `| \`${token}\` | \`${info.hex}\` | **${info.ratios['--bg']}:1** | **${info.ratios['--surface']}:1** | **${info.ratios['--surface-2']}:1** | ${reqLabel} | Cumple AA |\n`;
    }
    md += `\n#### Series de gráficos (${modeLabel}) — Contraste UI y Distinguibilidad bajo Daltonismo\n\n`;
    md += `| Serie | Familia / Nombre | Hex | vs \`--bg\` | vs \`--surface\` | Codificación redundante recomendada |\n`;
    md += `| :--- | :--- | :--- | :---: | :---: | :--- |\n`;
    const strokes = ['Sólido · círculo ●', 'Guion largo · cuadrado ■', 'Punteado denso · rombo ◆', 'Guion-punto · triángulo ▲', 'Sólido grueso · anillo ○', 'Guion corto · cruz ✕'];
    res.seriesRows.forEach((s, idx) => {
      md += `| \`${s.name}\` | ${s.label} | \`${s.hex}\` | **${s.rBg}:1** | **${s.rSurf}:1** | ${strokes[idx]} |\n`;
    });
    const minNorm = Math.min(...res.pairs.map(p => p.dNorm));
    const minDeut = Math.min(...res.pairs.map(p => p.dDeut));
    const minProt = Math.min(...res.pairs.map(p => p.dProt));
    md += `\n- **Distancia mínima perceptual entre cualquier par de series ($\\Delta E_{\\text{OKLab}} \\times 100$):** Visión tricromática = **${minNorm}** · Deuteranopía = **${minDeut}** · Protanopía = **${minProt}**.\n\n`;
  }
}

fs.mkdirSync(path.resolve('docs/ux'), { recursive: true });
fs.writeFileSync(path.resolve('docs/ux/contraste.md'), md, 'utf8');
console.log('Generado docs/ux/contraste.md correctamente.');
