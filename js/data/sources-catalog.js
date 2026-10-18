// Directorio curado de fuentes de datos para estudiantes.
// Cada enlace fue comprobado el día indicado en `checked`. `linkStatus: 'antibot'`
// significa que el servidor respondió con un desafío anti-bot (no un error 404):
// el enlace abre en un navegador normal, pero no se pudo verificar automáticamente.
// No se registran cifras: solo qué ofrece cada fuente y cómo citarla.
(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};

  const COURSES = {
    'macroeconomia': 'Macroeconomía',
    'economia-peruana': 'Economía peruana',
    'comercio-internacional': 'Comercio internacional',
    'desarrollo': 'Economía del desarrollo',
    'finanzas': 'Finanzas y banca',
    'economia-publica': 'Economía pública',
    'economia-laboral': 'Economía laboral',
    'econometria': 'Econometría',
    'historia-economica': 'Historia económica'
  };

  const SCOPES = { peru: 'Perú', latam: 'América Latina y el Caribe', global: 'Mundial', otros: 'Otras regiones' };

  const ACCESS = {
    web: 'Consulta web',
    descarga: 'Descarga (Excel/CSV)',
    api: 'API',
    microdatos: 'Microdatos',
    registro: 'Requiere registro gratuito'
  };

  const CHECKED = '2026-10-18';

  const SOURCES = [
    { id: 'bcrpdata', name: 'BCRPData — Series estadísticas', org: 'Banco Central de Reserva del Perú', orgShort: 'BCRP',
      url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/', scope: 'peru',
      topics: ['tasas de interés', 'inflación', 'tipo de cambio', 'PBI', 'balanza de pagos', 'crédito', 'reservas'],
      courses: ['macroeconomia', 'economia-peruana', 'finanzas', 'econometria'],
      frequency: 'Diaria, mensual, trimestral y anual', access: ['web', 'descarga', 'api'], level: 'basico',
      useFor: 'Series de tiempo oficiales de la economía peruana para trabajos y ejercicios de econometría.', primary: true },
    { id: 'bcrp-reporte-inflacion', name: 'Reporte de Inflación', org: 'Banco Central de Reserva del Perú', orgShort: 'BCRP',
      url: 'https://www.bcrp.gob.pe/publicaciones/reporte-de-inflacion.html', scope: 'peru',
      topics: ['política monetaria', 'proyecciones', 'inflación'], courses: ['macroeconomia', 'economia-peruana'],
      frequency: 'Publicación periódica', access: ['web'], level: 'intermedio',
      useFor: 'Entender el diagnóstico y las proyecciones oficiales del banco central.', primary: true },
    { id: 'bcrp-nota-semanal', name: 'Nota Semanal', org: 'Banco Central de Reserva del Perú', orgShort: 'BCRP',
      url: 'https://www.bcrp.gob.pe/publicaciones/nota-semanal.html', scope: 'peru',
      topics: ['coyuntura', 'indicadores monetarios', 'mercados'], courses: ['economia-peruana', 'finanzas'],
      frequency: 'Semanal', access: ['web', 'descarga'], level: 'basico',
      useFor: 'Seguir la coyuntura con los cuadros estadísticos más recientes.', primary: true },
    { id: 'inei', name: 'Instituto Nacional de Estadística e Informática', org: 'INEI', orgShort: 'INEI',
      url: 'https://www.gob.pe/inei/', scope: 'peru',
      topics: ['PBI', 'precios al consumidor', 'empleo', 'pobreza', 'censos'],
      courses: ['economia-peruana', 'desarrollo', 'economia-laboral'],
      frequency: 'Mensual, trimestral y anual según la estadística', access: ['web', 'descarga'], level: 'basico',
      useFor: 'Estadísticas oficiales del Perú: cuentas nacionales, precios, empleo y condiciones de vida.', primary: true },
    { id: 'inei-microdatos', name: 'Microdatos del INEI (ENAHO, ENDES y otras encuestas)', org: 'INEI', orgShort: 'INEI',
      url: 'https://proyectos.inei.gob.pe/microdatos/', scope: 'peru',
      topics: ['hogares', 'pobreza', 'ingresos', 'salud', 'empleo'],
      courses: ['econometria', 'desarrollo', 'economia-laboral'],
      frequency: 'Anual o según la encuesta', access: ['descarga', 'microdatos'], level: 'avanzado',
      useFor: 'Bases a nivel de hogar o persona para tesis y regresiones con datos de corte transversal.', primary: true },
    { id: 'mef-consulta-amigable', name: 'Consulta Amigable — Transparencia Económica', org: 'Ministerio de Economía y Finanzas', orgShort: 'MEF',
      url: 'https://apps5.mineco.gob.pe/transparencia/mensual/', scope: 'peru',
      topics: ['presupuesto público', 'gasto', 'ejecución presupuestal'], courses: ['economia-publica', 'economia-peruana'],
      frequency: 'Mensual', access: ['web', 'descarga'], level: 'intermedio',
      useFor: 'Ejecución del gasto público por sector, nivel de gobierno y región.', primary: true },
    { id: 'mef-mmm', name: 'Marco Macroeconómico Multianual', org: 'Ministerio de Economía y Finanzas', orgShort: 'MEF',
      url: 'https://www.mef.gob.pe/es/marco-macroeconomico', scope: 'peru',
      topics: ['proyecciones', 'política fiscal', 'deuda pública'], courses: ['economia-publica', 'macroeconomia', 'economia-peruana'],
      frequency: 'Anual', access: ['web'], level: 'intermedio',
      useFor: 'Supuestos y proyecciones oficiales de la política fiscal.', primary: true },
    { id: 'sbs', name: 'Estadísticas del sistema financiero, de seguros y AFP', org: 'Superintendencia de Banca, Seguros y AFP', orgShort: 'SBS',
      url: 'https://www.sbs.gob.pe/estadisticas', scope: 'peru',
      topics: ['bancos', 'crédito', 'morosidad', 'seguros', 'pensiones'], courses: ['finanzas', 'economia-peruana'],
      frequency: 'Mensual', access: ['web', 'descarga'], level: 'intermedio',
      useFor: 'Indicadores de entidades financieras supervisadas.', primary: true },
    { id: 'sunat', name: 'Estadísticas y estudios', org: 'Superintendencia Nacional de Aduanas y de Administración Tributaria', orgShort: 'SUNAT',
      url: 'https://www.sunat.gob.pe/estadisticasestudios/', scope: 'peru',
      topics: ['recaudación tributaria', 'comercio exterior'], courses: ['economia-publica', 'comercio-internacional', 'economia-peruana'],
      frequency: 'Mensual y anual', access: ['web', 'descarga'], level: 'intermedio',
      useFor: 'Ingresos tributarios y estadísticas aduaneras del Perú.', primary: true },
    { id: 'wdi', name: 'World Development Indicators (WDI)', org: 'Banco Mundial', orgShort: 'Banco Mundial',
      url: 'https://databank.worldbank.org/source/world-development-indicators', scope: 'global',
      topics: ['PBI', 'inflación', 'comercio', 'población', 'pobreza', 'educación'],
      courses: ['macroeconomia', 'desarrollo', 'comercio-internacional', 'econometria'],
      frequency: 'Anual', access: ['web', 'descarga', 'api'], level: 'basico',
      useFor: 'Comparar países con indicadores homogéneos. Es la fuente principal del panorama de MacroScope.', primary: true },
    { id: 'wb-pip', name: 'Poverty and Inequality Platform (PIP)', org: 'Banco Mundial', orgShort: 'Banco Mundial',
      url: 'https://pip.worldbank.org/', scope: 'global',
      topics: ['pobreza', 'desigualdad', 'Gini'], courses: ['desarrollo', 'economia-laboral'],
      frequency: 'Anual (según encuestas disponibles)', access: ['web', 'descarga', 'api'], level: 'intermedio',
      useFor: 'Tasas de pobreza internacional y medidas de desigualdad comparables.', primary: true },
    { id: 'imf-data', name: 'IMF Data (incluye World Economic Outlook)', org: 'Fondo Monetario Internacional', orgShort: 'FMI',
      url: 'https://data.imf.org/', scope: 'global',
      topics: ['proyecciones', 'balanza de pagos', 'finanzas públicas', 'precios'],
      courses: ['macroeconomia', 'comercio-internacional', 'economia-publica'],
      frequency: 'Mensual, trimestral y anual según la base', access: ['web', 'descarga', 'api'], level: 'intermedio',
      useFor: 'Proyecciones macroeconómicas y estadísticas de balanza de pagos y finanzas públicas.', primary: true },
    { id: 'cepalstat', name: 'CEPALSTAT', org: 'Comisión Económica para América Latina y el Caribe', orgShort: 'CEPAL',
      url: 'https://statistics.cepal.org/portal/cepalstat/', scope: 'latam',
      topics: ['cuentas nacionales', 'sector externo', 'social', 'ambiental'],
      courses: ['desarrollo', 'macroeconomia', 'comercio-internacional'],
      frequency: 'Anual y trimestral', access: ['web', 'descarga', 'api'], level: 'basico',
      useFor: 'Comparaciones regionales con series armonizadas para América Latina.', primary: true },
    { id: 'oecd', name: 'OECD Data Explorer', org: 'Organización para la Cooperación y el Desarrollo Económicos', orgShort: 'OCDE',
      url: 'https://data-explorer.oecd.org/', scope: 'otros',
      topics: ['productividad', 'educación', 'impuestos', 'mercado laboral'],
      courses: ['economia-publica', 'economia-laboral', 'macroeconomia'],
      frequency: 'Mensual, trimestral y anual', access: ['web', 'descarga', 'api'], level: 'intermedio',
      useFor: 'Indicadores de países de la OCDE y economías asociadas.', primary: true },
    { id: 'fred', name: 'FRED — Federal Reserve Economic Data', org: 'Banco de la Reserva Federal de St. Louis', orgShort: 'Fed St. Louis',
      url: 'https://fred.stlouisfed.org/', scope: 'global',
      topics: ['Estados Unidos', 'tasas de interés', 'mercados financieros', 'series internacionales'],
      courses: ['macroeconomia', 'finanzas', 'econometria'],
      frequency: 'Diaria a anual', access: ['web', 'descarga', 'api'], level: 'basico',
      useFor: 'Series largas para ejercicios de series de tiempo; gráficos fáciles de exportar.', primary: false,
      note: 'Muchas series se recopilan de otras fuentes: cita también la fuente original indicada en la ficha.' },
    { id: 'pwt', name: 'Penn World Table', org: 'Groningen Growth and Development Centre, Universidad de Groninga', orgShort: 'GGDC',
      url: 'https://www.rug.nl/ggdc/productivity/pwt/', scope: 'global',
      topics: ['PBI real', 'capital', 'productividad total de factores', 'crecimiento'],
      courses: ['macroeconomia', 'desarrollo', 'econometria'],
      frequency: 'Anual (versiones periódicas)', access: ['descarga'], level: 'avanzado',
      useFor: 'Contabilidad del crecimiento y comparaciones de niveles de ingreso entre países.', primary: true },
    { id: 'maddison', name: 'Maddison Project Database', org: 'Groningen Growth and Development Centre, Universidad de Groninga', orgShort: 'GGDC',
      url: 'https://www.rug.nl/ggdc/historicaldevelopment/maddison/', scope: 'global',
      topics: ['PBI per cápita histórico', 'largo plazo'], courses: ['historia-economica', 'desarrollo'],
      frequency: 'Anual (versiones periódicas)', access: ['descarga'], level: 'intermedio',
      useFor: 'Estudiar el crecimiento económico de muy largo plazo.', primary: true },
    { id: 'comtrade', name: 'UN Comtrade', org: 'Naciones Unidas', orgShort: 'ONU',
      url: 'https://comtradeplus.un.org/', scope: 'global',
      topics: ['comercio de bienes', 'socios comerciales', 'productos'], courses: ['comercio-internacional'],
      frequency: 'Mensual y anual', access: ['web', 'descarga', 'api', 'registro'], level: 'intermedio',
      useFor: 'Exportaciones e importaciones por producto y país socio.', primary: true },
    { id: 'wto-stats', name: 'WTO Stats', org: 'Organización Mundial del Comercio', orgShort: 'OMC',
      url: 'https://stats.wto.org/', scope: 'global',
      topics: ['comercio de bienes y servicios', 'aranceles'], courses: ['comercio-internacional'],
      frequency: 'Anual y trimestral', access: ['web', 'descarga', 'api'], level: 'intermedio',
      useFor: 'Flujos comerciales y aranceles para trabajos de política comercial.', primary: true },
    { id: 'unctadstat', name: 'UNCTADstat', org: 'Conferencia de las Naciones Unidas sobre Comercio y Desarrollo', orgShort: 'UNCTAD',
      url: 'https://unctadstat.unctad.org/', scope: 'global',
      topics: ['comercio', 'inversión extranjera directa', 'transporte marítimo'],
      courses: ['comercio-internacional', 'desarrollo'],
      frequency: 'Anual', access: ['web', 'descarga'], level: 'intermedio',
      useFor: 'Inversión extranjera directa y comercio desde la perspectiva de países en desarrollo.', primary: true },
    { id: 'ilostat', name: 'ILOSTAT', org: 'Organización Internacional del Trabajo', orgShort: 'OIT',
      url: 'https://ilostat.ilo.org/data/', scope: 'global',
      topics: ['empleo', 'desempleo', 'salarios', 'informalidad'], courses: ['economia-laboral', 'desarrollo'],
      frequency: 'Anual y trimestral', access: ['web', 'descarga', 'api'], level: 'basico',
      useFor: 'Indicadores laborales comparables entre países.', primary: true, linkStatus: 'antibot' },
    { id: 'bis', name: 'BIS Data Portal', org: 'Banco de Pagos Internacionales', orgShort: 'BPI',
      url: 'https://data.bis.org/', scope: 'global',
      topics: ['crédito', 'tipos de cambio efectivos', 'tasas de política', 'precios de vivienda'],
      courses: ['finanzas', 'macroeconomia'],
      frequency: 'Diaria a trimestral', access: ['web', 'descarga', 'api'], level: 'avanzado',
      useFor: 'Indicadores financieros internacionales, como tipos de cambio reales efectivos.', primary: true },
    { id: 'wid', name: 'World Inequality Database', org: 'World Inequality Lab', orgShort: 'WIL',
      url: 'https://wid.world/', scope: 'global',
      topics: ['distribución del ingreso', 'riqueza'], courses: ['desarrollo', 'economia-publica'],
      frequency: 'Anual', access: ['web', 'descarga'], level: 'intermedio',
      useFor: 'Participaciones del ingreso y la riqueza por percentiles.', primary: true },
    { id: 'eurostat', name: 'Eurostat', org: 'Comisión Europea', orgShort: 'Eurostat',
      url: 'https://ec.europa.eu/eurostat/data/database', scope: 'otros',
      topics: ['Unión Europea', 'cuentas nacionales', 'mercado laboral', 'precios'],
      courses: ['macroeconomia', 'economia-laboral'],
      frequency: 'Mensual, trimestral y anual', access: ['web', 'descarga', 'api'], level: 'intermedio',
      useFor: 'Estadísticas oficiales de los países de la Unión Europea.', primary: true },
    { id: 'ipums-international', name: 'IPUMS International', org: 'IPUMS, Universidad de Minnesota', orgShort: 'IPUMS',
      url: 'https://international.ipums.org/', scope: 'global',
      topics: ['censos', 'microdatos armonizados'], courses: ['econometria', 'desarrollo', 'economia-laboral'],
      frequency: 'Según rondas censales', access: ['microdatos', 'registro'], level: 'avanzado',
      useFor: 'Muestras censales armonizadas entre países y años.', primary: false,
      note: 'Armoniza datos de institutos nacionales: cita IPUMS y el instituto de origen.' },
    { id: 'latinobarometro', name: 'Latinobarómetro', org: 'Corporación Latinobarómetro', orgShort: 'Latinobarómetro',
      url: 'https://www.latinobarometro.org/', scope: 'latam',
      topics: ['opinión pública', 'percepciones económicas', 'instituciones'], courses: ['desarrollo', 'economia-publica'],
      frequency: 'Según ronda de encuesta', access: ['web', 'microdatos'], level: 'intermedio',
      useFor: 'Percepciones ciudadanas sobre economía e instituciones en la región.', primary: true },
    { id: 'owid', name: 'Our World in Data', org: 'Global Change Data Lab', orgShort: 'OWID',
      url: 'https://ourworldindata.org/', scope: 'global',
      topics: ['desarrollo', 'salud', 'energía', 'pobreza'], courses: ['desarrollo', 'historia-economica'],
      frequency: 'Variable', access: ['web', 'descarga'], level: 'basico',
      useFor: 'Explorar un tema y encontrar la fuente primaria; buen punto de partida.', primary: false,
      note: 'Fuente secundaria: en un trabajo académico cita la fuente primaria que indica cada gráfico.' }
  ].map(source => ({ linkStatus: 'ok', checked: CHECKED, note: '', ...source }));

  // Cita en formato APA 7 para bases de datos: Autor. (s. f.). Título [Base de datos]. URL
  function citeSource(source, accessed) {
    const date = accessed instanceof Date ? accessed : new Date();
    const fmt = date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${source.org}. (s. f.). ${source.name} [Base de datos]. Recuperado el ${fmt}, de ${source.url}`;
  }

  function filterSources({ course = '', scope = '', access = '', query = '' } = {}, list = SOURCES) {
    const q = query.trim().toLocaleLowerCase('es');
    return list.filter(s =>
      (!course || s.courses.includes(course)) &&
      (!scope || s.scope === scope) &&
      (!access || s.access.includes(access)) &&
      (!q || [s.name, s.org, s.orgShort, s.useFor, ...s.topics].join(' ').toLocaleLowerCase('es').includes(q)));
  }

  Object.assign(M, { SOURCES_CATALOG: { COURSES, SCOPES, ACCESS, SOURCES, citeSource, filterSources } });
})();
