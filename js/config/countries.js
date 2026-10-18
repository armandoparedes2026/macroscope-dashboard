(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
    const COUNTRIES = {
      PER: { name: 'Perú', flag: '🇵🇪', currency: 'PEN' },
      CHL: { name: 'Chile', flag: '🇨🇱', currency: 'CLP' },
      COL: { name: 'Colombia', flag: '🇨🇴', currency: 'COP' },
      MEX: { name: 'México', flag: '🇲🇽', currency: 'MXN' },
      BRA: { name: 'Brasil', flag: '🇧🇷', currency: 'BRL' },
      USA: { name: 'Estados Unidos', flag: '🇺🇸', currency: 'USD' },
      LCN: { name: 'Latinoamérica y el Caribe', flag: '🌎', currency: 'USD' }
    };


  Object.assign(M, { COUNTRIES });
})();
