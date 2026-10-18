(function () {
  'use strict';
  const M = globalThis.MacroScope;
  const { INDICATORS, INFLATION_TARGETS, state } = M;
    function formatValue(val, indicatorCode) {
      if (!Number.isFinite(val)) return 'N/D';
      const meta = INDICATORS[indicatorCode];
      const formatted = Number(val).toLocaleString('es-PE', {minimumFractionDigits:meta.decimals,maximumFractionDigits:meta.decimals});
      return `${meta.prefix}${formatted}${meta.suffix}`;
    }

    function formatDelta(value, indicatorCode) {
      if (!Number.isFinite(value)) return 'N/D';
      const sign = value > 0 ? '+' : '';
      if (indicatorCode === 'NY.GDP.PCAP.CD') return `${sign}${Math.round(value).toLocaleString('es-PE')} US$`;
      return `${sign}${value.toLocaleString('es-PE',{minimumFractionDigits:1,maximumFractionDigits:1})} pp`;
    }
    function determineTone(indicatorCode, value, countryCode = state.country) {
      const dir = INDICATORS[indicatorCode].goodDirection;
      if (!Number.isFinite(value)) return {label:'Sin dato', cls:'neutral'};
      if (indicatorCode === 'FP.CPI.TOTL.ZG') {
        const target = INFLATION_TARGETS[countryCode];
        if (!target) {
          // No inflation target (regional aggregate): generic thresholds.
          if (value <= 3.5) return {label:'Estable', cls:'positive'};
          if (value <= 6) return {label:'Vigilancia', cls:'warning'};
          return {label:'Presión', cls:'negative'};
        }
        const low = target.center - target.tolerance, high = target.center + target.tolerance;
        if (value < low) return {label:'Bajo meta', cls:'warning'};
        if (value <= high) return {label:'En meta', cls:'positive'};
        if (value <= high + 2) return {label:'Sobre meta', cls:'warning'};
        return {label:'Presión', cls:'negative'};
      }
      if (indicatorCode === 'SL.UEM.TOTL.ZS') {
        if (value <= 5) return {label:'Contenido', cls:'positive'};
        if (value <= 8) return {label:'Mixto', cls:'warning'};
        return {label:'Elevado', cls:'negative'};
      }
      if (indicatorCode === 'BN.CAB.XOKA.GD.ZS') {
        if (value >= 0) return {label:'Superávit', cls:'positive'};
        if (value >= -2.5) return {label:'Manejable', cls:'warning'};
        return {label:'Déficit', cls:'negative'};
      }
      // Level indicators that are never negative: a sign-based rating carries no information.
      if (indicatorCode === 'NY.GDP.PCAP.CD' || indicatorCode === 'NE.EXP.GNFS.ZS') return {label:'Nivel', cls:'neutral'};
      if (dir === 'high') return value >= 0 ? {label:'Favorable', cls:'positive'} : {label:'Débil', cls:'negative'};
      return value <= 0 ? {label:'Favorable', cls:'positive'} : {label:'Presión', cls:'warning'};
    }
    function inflationTargetText(countryCode){
      const t=INFLATION_TARGETS[countryCode];
      if(!t) return 'Sin meta de inflación de referencia';
      const fmt=n=>n.toLocaleString('es-PE',{maximumFractionDigits:1});
      return `Meta ${t.bank}: ${fmt(t.center)}% ± ${fmt(t.tolerance)} pp`;
    }
    const roundTo = (n, d) => Math.round(n * 10 ** d) / 10 ** d || 0;
    const fmtAbs = (n, d) => Math.abs(n).toLocaleString('es-PE', { minimumFractionDigits: d, maximumFractionDigits: d });
    const fmtNum = (n, d = 1) => { if (!Number.isFinite(n)) return 'N/D'; const r = roundTo(n, d); return `${r < 0 ? '−' : ''}${fmtAbs(r, d)}`; };
    const fmtSigned = (n, d = 1) => { if (!Number.isFinite(n)) return 'N/D'; const r = roundTo(n, d); return `${r > 0 ? '+' : r < 0 ? '−' : ''}${fmtAbs(r, d)}`; };

  Object.assign(M, { determineTone, fmtAbs, fmtNum, fmtSigned, formatDelta, formatValue, inflationTargetText, roundTo });
})();
