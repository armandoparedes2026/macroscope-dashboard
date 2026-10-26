(function () {
  'use strict';
  const M=globalThis.MacroScope ||= {};

  function normalizeCountries(codes, available, limit=4) {
    const allowed=new Set(available);
    const unique=[...new Set(codes.filter(code=>allowed.has(code)))].slice(0,limit);
    return unique.length ? unique : available.length ? [available[0]] : [];
  }

  function commonLatestYear(db,codes,indicator,years) {
    if(!codes.length)return null;
    return [...years].reverse().find(year=>codes.every(code=>Number.isFinite(db[code]?.[indicator]?.[year]))) || null;
  }

  function rankCountries(db,codes,indicator,year) {
    if(!year)return [];
    return codes.map(code=>({code,value:db[code]?.[indicator]?.[year]}))
      .filter(row=>Number.isFinite(row.value))
      .sort((a,b)=>b.value-a.value || codes.indexOf(a.code)-codes.indexOf(b.code));
  }

  function buildEconomySummary(db,codes,indicator,years) {
    const year=commonLatestYear(db,codes,indicator,years);
    const ranked=rankCountries(db,codes,indicator,year);
    return {
      year,
      ranked,
      leader:ranked[0]||null,
      last:ranked.at(-1)||null,
      spread:ranked.length>=2 ? ranked[0].value-ranked.at(-1).value : null
    };
  }

  function transformSeries(db,country,indicator,years,mode='raw') {
    const raw=Object.fromEntries(years.map(year=>[year,db[country]?.[indicator]?.[year]??null]));
    if(mode==='base'&&M.LEVEL_INDICATORS.includes(indicator)){
      const baseYear=years.find(year=>Number.isFinite(raw[year])&&raw[year]!==0);
      return baseYear?M.normalizeBase(raw,baseYear,indicator):Object.fromEntries(years.map(year=>[year,null]));
    }
    if(mode==='cumulative'&&indicator==='NY.GDP.MKTP.KD.ZG')return M.cumulativeGrowth(raw,years);
    return raw;
  }

  M.compareDashboardData={normalizeCountries,commonLatestYear,rankCountries,buildEconomySummary,transformSeries};
})();
