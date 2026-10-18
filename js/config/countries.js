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
      LCN: { name: 'Latinoamérica y el Caribe', flag: '🌎', currency: 'USD', aggregate: true },
      ARG: { name: 'Argentina', flag: '🇦🇷', currency: 'ARS', group: 'América Latina' },
      BOL: { name: 'Bolivia', flag: '🇧🇴', currency: 'BOB', group: 'América Latina' },
      ECU: { name: 'Ecuador', flag: '🇪🇨', currency: 'USD', group: 'América Latina' },
      URY: { name: 'Uruguay', flag: '🇺🇾', currency: 'UYU', group: 'América Latina' },
      PRY: { name: 'Paraguay', flag: '🇵🇾', currency: 'PYG', group: 'América Latina' },
      CRI: { name: 'Costa Rica', flag: '🇨🇷', currency: 'CRC', group: 'América Latina' },
      CHN: { name: 'China', flag: '🇨🇳', currency: 'CNY', group: 'Economías internacionales' },
      JPN: { name: 'Japón', flag: '🇯🇵', currency: 'JPY', group: 'Economías internacionales' },
      DEU: { name: 'Alemania', flag: '🇩🇪', currency: 'EUR', group: 'Economías internacionales' },
      ESP: { name: 'España', flag: '🇪🇸', currency: 'EUR', group: 'Economías internacionales' },
      CAN: { name: 'Canadá', flag: '🇨🇦', currency: 'CAD', group: 'Economías internacionales' },
      KOR: { name: 'Corea del Sur', flag: '🇰🇷', currency: 'KRW', group: 'Economías internacionales' }
    };


  Object.entries(COUNTRIES).forEach(([code, country]) => { country.group ||= code === 'USA' ? 'Economías internacionales' : 'América Latina'; });
  Object.assign(M, { COUNTRIES });
})();
