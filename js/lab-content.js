/*
 * Contenido pedagógico del laboratorio IS–LM–BP / Mundell–Fleming. Solo datos, sin acceso al DOM.
 * Cada escenario declara en `theory` el signo que predice la teoría para cada variable (+1, −1, 0);
 * tests/lab-content.test.mjs comprueba que coincide con lo que calcula js/islm-model.js, de modo que el
 * texto y el simulador no puedan contradecirse.
 *
 * Niveles: intro (intuición), intermediate (mecanismo y gráficos), advanced (ecuaciones y supuestos).
 * Las referencias bibliográficas se citan por clave de REFERENCES.
 */
(function () {
  'use strict';

  const REFERENCES = {
    hicks1937: 'Hicks, J. R. (1937). Mr. Keynes and the "Classics"; A Suggested Interpretation. Econometrica, 5(2), 147–159.',
    fleming1962: 'Fleming, J. M. (1962). Domestic Financial Policies under Fixed and under Floating Exchange Rates. IMF Staff Papers, 9(3), 369–380.',
    mundell1963: 'Mundell, R. A. (1963). Capital Mobility and Stabilization Policy under Fixed and Flexible Exchange Rates. Canadian Journal of Economics and Political Science, 29(4), 475–485.',
    obstfeld2005: 'Obstfeld, M., Shambaugh, J. C., y Taylor, A. M. (2005). The Trilemma in History: Tradeoffs among Exchange Rates, Monetary Policies, and Capital Mobility. Review of Economics and Statistics, 87(3), 423–438.',
    rey2013: 'Rey, H. (2013). Dilemma not Trilemma: The Global Financial Cycle and Monetary Policy Independence. Proceedings of the Economic Policy Symposium, Jackson Hole, Federal Reserve Bank of Kansas City.',
    calvo2002: 'Calvo, G. A., y Reinhart, C. M. (2002). Fear of Floating. Quarterly Journal of Economics, 117(2), 379–408.',
    cespedes2004: 'Céspedes, L. F., Chang, R., y Velasco, A. (2004). Balance Sheets and Exchange Rate Policy. American Economic Review, 94(4), 1183–1193.',
    houthakker1969: 'Houthakker, H. S., y Magee, S. P. (1969). Income and Price Elasticities in World Trade. Review of Economics and Statistics, 51(2), 111–125.',
    thirlwall1979: 'Thirlwall, A. P. (1979). The Balance of Payments Constraint as an Explanation of International Growth Rate Differences. BNL Quarterly Review, 32(128), 45–53.',
    imf2009: 'Fondo Monetario Internacional (2009). Manual de Balanza de Pagos y Posición de Inversión Internacional, 6.ª edición (MBP6). Washington, D. C.: FMI.',
    blanchard: 'Blanchard, O. Macroeconomics. Pearson (caps. sobre IS–LM y economía abierta; varias ediciones).',
    mankiw: 'Mankiw, N. G. Macroeconomics. Worth Publishers (cap. «The Open Economy Revisited: The Mundell–Fleming Model»; varias ediciones).',
    kom: 'Krugman, P. R., Obstfeld, M., y Melitz, M. J. International Economics: Theory and Policy. Pearson (varias ediciones).',
    mendoza: 'Mendoza Bellido, W. Macroeconomía intermedia para América Latina. Lima: Fondo Editorial de la Pontificia Universidad Católica del Perú.'
  };

  /** Glosario contextual: término → { short, long, refs }. */
  const GLOSSARY = {
    IS: { short: 'Combinaciones de ingreso (Y) y tasa de interés (i) que equilibran el mercado de bienes.', long: 'Pendiente negativa: una tasa más alta reduce la inversión y, por el multiplicador, el ingreso. Se desplaza con G, T, la confianza privada, las exportaciones netas autónomas y el tipo de cambio.', refs: ['hicks1937', 'blanchard'] },
    LM: { short: 'Combinaciones de Y e i que equilibran el mercado de dinero para una oferta monetaria dada.', long: 'Pendiente positiva k/h: más ingreso eleva la demanda de dinero y, con M fija, la tasa debe subir. Con una regla de tasa de interés la LM es horizontal en i = i_pol.', refs: ['hicks1937', 'blanchard'] },
    BP: { short: 'Combinaciones de Y e i con balanza de pagos en equilibrio (cuenta corriente + cuenta financiera = 0).', long: 'Pendiente m/κ: más ingreso aumenta importaciones y exige una tasa más alta para atraer capitales. Es horizontal con movilidad perfecta (κ → ∞) y vertical con movilidad nula (κ = 0). Una depreciación la desplaza hacia la derecha.', refs: ['mundell1963', 'fleming1962'] },
    NX: { short: 'Exportaciones netas: balanza de bienes y servicios (componente del PBI).', long: 'No es lo mismo que la cuenta corriente: esta suma además la renta primaria (utilidades, intereses) y la secundaria (remesas). En el simulador NX entra en la demanda agregada; la diferencia NFI = CA − NX solo entra en la balanza de pagos.', refs: ['imf2009'] },
    CA: { short: 'Cuenta corriente: NX + renta primaria neta + renta secundaria neta.', long: 'En economías con gran inversión extranjera (p. ej., minería en Perú y Chile), las utilidades remitidas hacen que la cuenta corriente sea bastante menor que la balanza de bienes y servicios.', refs: ['imf2009'] },
    trilemma: { short: 'Trilema de Mundell: no se puede tener a la vez tipo de cambio fijo, libre movilidad de capitales y política monetaria autónoma.', long: 'En el simulador: con tipo de cambio fijo el banco central no controla M; con flotación y movilidad perfecta tampoco puede fijar i distinta de i* + ρ. La evidencia sugiere que, con ciclos financieros globales, incluso la flotación no aísla del todo la política monetaria.', refs: ['mundell1963', 'obstfeld2005', 'rey2013'] },
    crowdingOut: { short: 'Desplazamiento (crowding out): la expansión fiscal sube i y reduce la inversión privada.', long: 'En economía abierta con flotación y movilidad perfecta el desplazamiento recae sobre las exportaciones netas por la apreciación, no sobre la inversión.', refs: ['blanchard', 'mankiw'] },
    marshallLerner: { short: 'Condición de Marshall–Lerner: una depreciación real mejora la balanza comercial si las elasticidades-precio de exportaciones e importaciones suman más que 1.', long: 'El simulador la supone cumplida (n > 0). En el corto plazo puede no cumplirse (curva J).', refs: ['kom'] },
    rho: { short: 'Prima ρ: rendimiento adicional exigido por riesgo país y por la depreciación esperada.', long: 'La condición de paridad con movilidad perfecta es i = i* + ρ. En el equilibrio inicial ρ se calibra como residuo: ρ₀ = i₀ − i*₀; no es una medición del riesgo país (como el EMBI).', refs: ['kom'] },
    multiplier: { short: 'Multiplicador: cambio del producto de equilibrio ante un cambio unitario de un componente autónomo.', long: 'Economía cerrada sin efecto tasa: 1/(1 − c(1 − t)). Con LM: 1/(1 − c(1 − t) + b·k/h). Abierta con tipo fijo y movilidad perfecta: 1/(1 − c(1 − t) + m).', refs: ['blanchard'] },
    balanceSheet: { short: 'Efecto hoja de balance: con deudas en dólares, una depreciación encarece los pasivos y puede contraer la inversión.', long: 'No está en el modelo de Mundell–Fleming; por eso en economías dolarizadas una depreciación puede ser menos expansiva que lo que muestra el simulador.', refs: ['cespedes2004', 'calvo2002'] },
    importPropensity: { short: 'Propensión marginal a importar m: aumento de importaciones por unidad adicional de ingreso.', long: 'El simulador la aproxima como m = ε·(IM/Y) con ε = 1 (supuesto). Las elasticidades-ingreso de las importaciones estimadas empíricamente suelen ser distintas de 1 y varían entre países.', refs: ['houthakker1969', 'thirlwall1979'] }
  };

  /**
   * Escenarios guiados. `setup` es la configuración (regime, mobility, instrument); `patch(baseline)`
   * devuelve los cambios exógenos; `theory` los signos esperados del equilibrio final (E₂) respecto de E₀;
   * `predict` las variables por las que se pregunta al estudiante.
   */
  const SCENARIOS = [
    {
      id: 'fiscal-closed',
      title: '¿Qué ocurre si aumenta el gasto público?',
      problem: 'El gobierno aumenta el gasto en 3 puntos del producto inicial en una economía cerrada con oferta monetaria constante.',
      setup: { regime: 'closed', mobility: 'perfect', instrument: 'money' },
      patch: (b) => ({ G: b.G + 3 }),
      predict: ['Y', 'i'],
      theory: { Y: 1, i: 1 },
      shifts: [{ curve: 'IS', direction: 'right', cause: 'Mayor G eleva la demanda agregada para cada tasa de interés.' }],
      levels: {
        intro: 'El gasto público es demanda: las empresas venden y producen más, y los hogares, con más ingreso, consumen más. Pero al haber más actividad la gente necesita más dinero y, como el banco central no emite más, la tasa de interés sube y frena parte de la inversión.',
        intermediate: 'La IS se desplaza a la derecha. A lo largo de la LM fija, Y e i suben. La subida de i reduce la inversión (crowding out), por lo que el multiplicador efectivo es menor que el keynesiano simple 1/(1 − c(1 − t)).',
        advanced: 'dY/dG = 1/(1 − c(1 − t) + b·k/h). El término b·k/h mide el desplazamiento: crece con la sensibilidad de la inversión (b) y del dinero al ingreso (k), y cae con la de la demanda de dinero a la tasa (h). Con h → ∞ (trampa de liquidez) el multiplicador tiende al keynesiano simple.'
      },
      caveats: ['Precios fijos: no hay presión inflacionaria en el modelo.', 'No se modela la financiación del gasto ni la deuda pública.'],
      refs: ['hicks1937', 'blanchard']
    },
    {
      id: 'foreign-rate-flex',
      title: '¿Cómo afecta una subida de la tasa internacional?',
      problem: 'La tasa internacional i* sube 2 pp. La economía es pequeña y abierta, con tipo de cambio flexible y alta movilidad de capitales.',
      setup: { regime: 'flex', mobility: 'perfect', instrument: 'money' },
      patch: (b) => ({ istar: b.istar + 2 }),
      predict: ['Y', 'e'],
      theory: { Y: 1, e: 1, i: 1 },
      shifts: [{ curve: 'BP', direction: 'up', cause: 'Los capitales exigen una tasa doméstica más alta: i = i* + ρ.' },
        { curve: 'IS', direction: 'right', cause: 'La depreciación abarata las exportaciones y eleva NX.' }],
      levels: {
        intro: 'Si afuera pagan más, el dinero sale del país; la moneda local se deprecia y las exportaciones se vuelven más competitivas. En este modelo de libro eso termina elevando la producción.',
        intermediate: 'La BP sube a i* + ρ. La salida de capitales deprecia la moneda (e ↑); la IS se desplaza a la derecha hasta cortar la LM en la nueva tasa. Como i sube con M fija, la demanda de dinero baja y el equilibrio monetario requiere más Y.',
        advanced: 'Con movilidad perfecta, LM fija Y = (M + h(i* + ρ))/k: ∂Y/∂i* = h/k > 0. La IS* determina e. El resultado expansivo depende de h > 0 y de la ausencia de efectos hoja de balance; en economías dolarizadas el signo empírico puede invertirse.'
      },
      caveats: ['El resultado expansivo es un resultado del modelo, no una regularidad empírica: la evidencia para emergentes suele mostrar efectos contractivos de alzas de tasas externas (canal financiero).'],
      refs: ['mundell1963', 'rey2013', 'cespedes2004']
    },
    {
      id: 'devaluation-fixed',
      title: '¿Qué sucede con una devaluación cambiaria?',
      problem: 'Con tipo de cambio fijo y movilidad perfecta, el banco central devalúa la paridad un 10 % (ē de 100 a 110).',
      setup: { regime: 'fixed', mobility: 'perfect', instrument: 'money' },
      patch: (b) => ({ ebar: b.ebar + 10 }),
      predict: ['Y', 'NX', 'M'],
      theory: { Y: 1, NX: 1, M: 1 },
      shifts: [{ curve: 'IS', direction: 'right', cause: 'Las exportaciones netas aumentan con e (Marshall–Lerner).' },
        { curve: 'LM', direction: 'right', cause: 'Para sostener la paridad, el banco central compra divisas y expande M.' }],
      levels: {
        intro: 'Con una moneda más barata, los productos del país son más baratos afuera y las importaciones más caras: se exporta más y se importa menos, lo que impulsa la producción.',
        intermediate: 'La IS* y la IS se desplazan a la derecha. La tasa tiende a subir, entran capitales y el banco central, para no dejar que la moneda se aprecie, compra divisas: M aumenta y la LM acompaña a la IS hasta i = i* + ρ.',
        advanced: 'Con i fija en i* + ρ: dY/dē = n/(1 − c(1 − t) + m). Depende de que la condición de Marshall–Lerner se cumpla (n > 0) y de precios fijos (la devaluación nominal es real).'
      },
      caveats: ['Con precios flexibles la devaluación real se erosiona.', 'Con deuda en dólares el efecto puede ser contractivo (hoja de balance).'],
      refs: ['mundell1963', 'cespedes2004', 'kom']
    },
    {
      id: 'fiscal-regimes',
      title: '¿Por qué cambia la eficacia de la política fiscal según el régimen?',
      problem: 'Compara el mismo aumento del gasto (+3) con movilidad perfecta bajo tipo de cambio flexible y bajo tipo de cambio fijo.',
      setup: { regime: 'flex', mobility: 'perfect', instrument: 'money' },
      compareWith: { regime: 'fixed', mobility: 'perfect', instrument: 'money' },
      patch: (b) => ({ G: b.G + 3 }),
      predict: ['Y'],
      theory: { Y: 0, e: -1 },
      theoryCompare: { Y: 1, M: 1 },
      shifts: [{ curve: 'IS', direction: 'right', cause: 'Mayor G.' }],
      levels: {
        intro: 'Con flotación, el gasto atrae capitales, la moneda se aprecia y las exportaciones caen tanto como sube el gasto: la producción no cambia. Con tipo fijo, el banco central impide la apreciación emitiendo dinero, y esa emisión refuerza el estímulo.',
        intermediate: 'Flexible: la IS se desplaza, pero la apreciación la devuelve a su posición; ΔNX = −ΔG. Fijo: la LM se desplaza con la IS (M endógena), y el producto sube con el multiplicador abierto.',
        advanced: 'Flexible (κ → ∞): dY/dG = 0 porque la LM vertical en (Y, e) fija Y = (M + h(i* + ρ))/k. Fijo (κ → ∞): dY/dG = 1/(1 − c(1 − t) + m). Es el resultado de Mundell (1963) y Fleming (1962).'
      },
      caveats: ['Con movilidad imperfecta los resultados son intermedios; pruebe «baja» y «alta».', 'Economía pequeña: i* no reacciona.'],
      refs: ['mundell1963', 'fleming1962', 'obstfeld2005']
    },
    {
      id: 'commodity-flex',
      title: '¿Cómo afecta una caída del precio internacional de las exportaciones?',
      problem: 'Cae el precio de los principales productos de exportación (cobre, oro, petróleo): las exportaciones netas autónomas bajan 3 puntos del producto inicial. Compara tipo de cambio flexible y fijo, con movilidad alta.',
      setup: { regime: 'flex', mobility: 'high', instrument: 'money' },
      compareWith: { regime: 'fixed', mobility: 'high', instrument: 'money' },
      patch: () => ({ nxShock: -3 }),
      predict: ['Y', 'e'],
      theory: { Y: 0, e: 1, NX: 0 },
      theoryCompare: { Y: -1, M: -1 },
      shifts: [{ curve: 'IS', direction: 'left', cause: 'Menores exportaciones netas reducen la demanda agregada.' },
        { curve: 'BP', direction: 'left', cause: 'El deterioro de la cuenta corriente exige más entrada de capitales.' }],
      levels: {
        intro: 'El país recibe menos dólares por lo que vende afuera. Con flotación, la moneda se deprecia y abarata las exportaciones; en este modelo eso compensa por completo el golpe sobre la producción. Con tipo de cambio fijo no hay ese amortiguador y la producción cae.',
        intermediate: 'Flexible: IS y BP se desplazan a la izquierda; la depreciación las devuelve exactamente a su posición inicial (aislamiento). Fijo: el banco central vende reservas para sostener ē, M cae, la LM se desplaza a la izquierda y Y baja.',
        advanced: 'Como e solo entra en el modelo a través de NX = … + nx + n·(e − 100), un cambio Δnx se neutraliza con Δe = −Δnx/n en la IS y en la BP a la vez, para cualquier κ: dY/dnx = 0 en flotación. El aislamiento completo es una propiedad de esta especificación lineal; un shock de términos de intercambio real también reduce el ingreso nacional disponible y la inversión del sector exportador, canales ausentes del modelo.'
      },
      caveats: ['Aproximación: el modelo no tiene precios relativos de exportación; el shock es un desplazamiento de NX.', 'El aislamiento completo bajo flotación es un resultado del modelo, no de la evidencia: en la práctica los shocks de precios de materias primas afectan la actividad de los exportadores de América Latina.'],
      refs: ['kom', 'mendoza']
    },
    {
      id: 'confidence-closed',
      title: '¿Qué consecuencias produce una pérdida de confianza privada?',
      problem: 'Hogares y empresas reducen su gasto autónomo en 3 puntos del producto inicial (economía cerrada, M constante).',
      setup: { regime: 'closed', mobility: 'perfect', instrument: 'money' },
      patch: () => ({ confShock: -3 }),
      predict: ['Y', 'i'],
      theory: { Y: -1, i: -1 },
      shifts: [{ curve: 'IS', direction: 'left', cause: 'Menor consumo e inversión autónomos.' }],
      levels: {
        intro: 'Si la gente y las empresas desconfían, gastan menos; se vende y produce menos. Al haber menos actividad, se demanda menos dinero y la tasa de interés baja, lo que amortigua parte de la caída.',
        intermediate: 'La IS se desplaza a la izquierda; Y e i bajan a lo largo de la LM. La baja de i estimula parcialmente la inversión.',
        advanced: 'dY/dA = 1/(1 − c(1 − t) + b·k/h) con dA < 0. La política monetaria (↑M) o fiscal (↑G) pueden compensar el shock; pruebe a contrarrestarlo en el simulador.'
      },
      caveats: ['Las expectativas son exógenas: el modelo no explica por qué cae la confianza.'],
      refs: ['hicks1937', 'blanchard']
    }
  ];

  /** Compara la predicción del estudiante con el resultado simulado: {var: {predicted, simulated, ok}}. */
  function gradePrediction(prediction, from, to, tolerance = 1e-6) {
    const out = {};
    for (const [key, predicted] of Object.entries(prediction)) {
      const d = to[key] - from[key];
      const simulated = Math.abs(d) < tolerance ? 0 : Math.sign(d);
      out[key] = { predicted, simulated, ok: predicted === simulated };
    }
    return out;
  }

  globalThis.LAB_CONTENT = { REFERENCES, GLOSSARY, SCENARIOS, gradePrediction };
})();
