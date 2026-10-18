(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
  const { COUNTRIES, FALLBACK_DB, FALLBACK_FX } = M;
    // Deep clone fallback into runtime DB
    const runtimeDB = JSON.parse(JSON.stringify(FALLBACK_DB));
    const runtimeFX = JSON.parse(JSON.stringify(FALLBACK_FX));
    // Per-cell provenance: runtimeSource[country][indicator][year] === 'wdi' when the live API returned it.
    // Anything absent here is served from FALLBACK_DB.
    const runtimeSource = {};
    const cellSource = (country, code, year) => runtimeSource[country]?.[code]?.[year] === 'wdi' ? 'wdi' : 'fallback';

    // App State
    const state = {
      country: 'PER',
      benchmark: 'LCN',
      period: '10',
      activeIndicator: 'NY.GDP.MKTP.KD.ZG',
      activeTab: 'overview',
      tableFilter: '',
      lastEndpoints: [],
      sampleRawJson: null,
      liveMacroSuccess: 0, liveFxSuccess: false, fxUpdated: null, syncToken: 0, carouselIndex: 0, carouselTimer: null
    };

    // Load saved preferences safely
    try {
      const savedCountry = localStorage.getItem('macro_country');
      if (savedCountry && COUNTRIES[savedCountry]) state.country = savedCountry;
    } catch (e) {
      // Ignore storage restrictions
    }


  Object.assign(M, { runtimeDB, runtimeFX, runtimeSource, cellSource, state });
})();
