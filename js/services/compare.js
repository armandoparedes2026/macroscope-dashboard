(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
  const LEVEL_INDICATORS = ['NY.GDP.PCAP.CD', 'NY.GDP.PCAP.PP.KD'];
  function normalizeBase(series, baseYear, indicator) {
    if (!LEVEL_INDICATORS.includes(indicator)) throw Error('Solo se normalizan indicadores de nivel');
    const base = series[baseYear];
    return Object.fromEntries(Object.entries(series).map(([year, value]) => [year,
      Number.isFinite(base) && base !== 0 && Number.isFinite(value) ? value / base * 100 : null]));
  }
  function cumulativeGrowth(series, years = Object.keys(series).sort()) {
    let product = 1, valid = true, previous = null;
    return Object.fromEntries(years.map(year => {
      const value = series[year];
      valid = valid && Number.isFinite(value) && (previous === null || Number(year) === Number(previous) + 1);
      previous = year;
      if (valid) product *= 1 + value / 100;
      return [year, valid ? (product - 1) * 100 : null];
    }));
  }
  function commonYears(series, years) {
    return series.length ? years.filter(year => series.every(values => Number.isFinite(values[year]))) : [];
  }
  function relativeToUSA(series, usa) {
    return Object.fromEntries(Object.entries(series).map(([year, value]) => [year,
      Number.isFinite(value) && Number.isFinite(usa[year]) && usa[year] !== 0 ? value / usa[year] * 100 : null]));
  }
  Object.assign(M, { LEVEL_INDICATORS, normalizeBase, cumulativeGrowth, commonYears, relativeToUSA });
})();
