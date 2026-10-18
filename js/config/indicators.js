(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
    const INDICATORS = {
      'NY.GDP.MKTP.KD.ZG': {
        code: 'NY.GDP.MKTP.KD.ZG',
        title: 'Crecimiento del PBI',
        unit: '% anual',
        decimals: 1,
        prefix: '',
        suffix: '%',
        goodDirection: 'high',
        description: 'Tasa de crecimiento anual del PBI a precios constantes.'
      },
      'FP.CPI.TOTL.ZG': {
        code: 'FP.CPI.TOTL.ZG',
        title: 'Inflación (IPC)',
        unit: '% anual (promedio)',
        decimals: 1,
        prefix: '',
        suffix: '%',
        goodDirection: 'low',
        description: 'Variación porcentual anual del Índice de Precios al Consumidor.'
      },
      'SL.UEM.TOTL.ZS': {
        code: 'SL.UEM.TOTL.ZS',
        title: 'Tasa de Desempleo',
        unit: '% fuerza laboral (OIT, modelado)',
        decimals: 1,
        prefix: '',
        suffix: '%',
        goodDirection: 'low',
        description: 'Porcentaje de la población económicamente activa sin empleo (OIT).'
      },
      'NY.GDP.PCAP.CD': {
        code: 'NY.GDP.PCAP.CD',
        title: 'PBI per Cápita',
        unit: 'US$ actuales',
        decimals: 0,
        prefix: '$',
        suffix: '',
        goodDirection: 'high',
        description: 'Producto Bruto Interno dividido por la población a mitad de año.'
      },
      'NE.EXP.GNFS.ZS': {
        code: 'NE.EXP.GNFS.ZS',
        title: 'Exportaciones',
        unit: '% del PBI',
        decimals: 1,
        prefix: '',
        suffix: '%',
        goodDirection: 'high',
        description: 'Exportaciones de bienes y servicios como proporción del PBI.'
      },
      'BN.CAB.XOKA.GD.ZS': {
        code: 'BN.CAB.XOKA.GD.ZS',
        title: 'Cuenta Corriente',
        unit: '% del PBI',
        decimals: 1,
        prefix: '',
        suffix: '%',
        goodDirection: 'high',
        description: 'Saldo de la balanza en cuenta corriente como porcentaje del PBI.'
      }
    };

    Object.assign(INDICATORS, {
      'NE.RSB.GNFS.ZS': {code:'NE.RSB.GNFS.ZS',title:'Balanza de bienes y servicios',unit:'% PBI',decimals:2,prefix:'',suffix:'%',goodDirection:'high'},
      'NE.IMP.GNFS.ZS': {code:'NE.IMP.GNFS.ZS',title:'Importaciones de bienes y servicios',unit:'% PBI',decimals:2,prefix:'',suffix:'%',goodDirection:'high'}
    });
    const YEARS = Array.from({length: new Date().getFullYear() - 2013}, (_, i) => String(2014 + i));

    // Inflation targets of each central bank (center ± tolerance, in %). Used to classify the latest CPI reading.
    // Caveat: WDI reports the annual-average CPI change while targets are assessed on 12-month (Dec–Dec) inflation.
    // USA: the Fed's 2% target is a point target on PCE inflation; ±1 pp is only a display band. LCN has no target.
    const INFLATION_TARGETS = {
      PER: { center: 2, tolerance: 1, bank: 'BCRP' },
      CHL: { center: 3, tolerance: 1, bank: 'BCCh' },
      COL: { center: 3, tolerance: 1, bank: 'BanRep' },
      MEX: { center: 3, tolerance: 1, bank: 'Banxico' },
      BRA: { center: 3, tolerance: 1.5, bank: 'BCB' },
      USA: { center: 2, tolerance: 1, bank: 'Fed' }
    };

    const ISLM_COUNTRY = {
      PER: { neutralReal: 1.5, note: 'Perú opera una flotación administrada: el BCRP interviene en el mercado cambiario para reducir la volatilidad, un punto intermedio entre los regímenes del modelo. La alta dolarización financiera hace que una depreciación encarezca deudas en dólares (efecto hoja de balance) y pueda ser menos expansiva de lo que indica Mundell–Fleming.' },
      CHL: { neutralReal: 1.0, note: 'Chile: flotación con metas de inflación y alta movilidad de capital; muy expuesto al precio del cobre (shock de términos de intercambio).' },
      COL: { neutralReal: 2.0, note: 'Colombia: flotación con metas de inflación; sensible al precio del petróleo y a la prima de riesgo soberano.' },
      MEX: { neutralReal: 2.5, note: 'México: flotación libre y fuerte integración comercial y financiera con EE. UU.: Y* e i* pesan mucho.' },
      BRA: { neutralReal: 5.0, note: 'Brasil: flotación con una tasa neutral elevada y comercio exterior relativamente bajo respecto del PBI.' },
      USA: { neutralReal: 1.0, note: 'EE. UU. es una economía grande: su política monetaria mueve la tasa internacional i*, por lo que el supuesto de economía pequeña de Mundell–Fleming no se cumple bien.' }
    };

  Object.assign(M, { INDICATORS, YEARS, INFLATION_TARGETS, ISLM_COUNTRY });
})();
