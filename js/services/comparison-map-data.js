(function () {
  'use strict';
  const M=globalThis.MacroScope=globalThis.MacroScope||{};

  function selectedCountryFeatures(geojson,countries,database,indicator,year) {
    const selected=new Set(countries);
    const features=(Array.isArray(geojson?.features)?geojson.features:[]).flatMap(feature=>{
      const properties=feature?.properties||{};
      const code=[properties.ADM0_A3,properties.ISO_A3,properties.SOV_A3].find(value=>selected.has(value));
      if(!code||!feature.geometry)return [];
      const raw=year==null?null:database?.[code]?.[indicator]?.[year];
      const value=typeof raw==='number'&&Number.isFinite(raw)?raw:null;
      return [{...feature,properties:{...properties,cdCode:code,cdValue:value,cdHasValue:value!==null}}];
    });
    return {type:'FeatureCollection',features};
  }

  function indicatorStops(values) {
    const finite=values.filter(value=>typeof value==='number'&&Number.isFinite(value));
    if(!finite.length)return [0,1];
    const minimum=Math.min(...finite),maximum=Math.max(...finite);
    if(minimum===maximum){const span=Math.max(Math.abs(minimum)*.1,.5);return [minimum-span,maximum+span];}
    return [minimum,maximum];
  }

  M.comparisonMapData={selectedCountryFeatures,indicatorStops};
})();
