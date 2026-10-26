(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
  const BCRP_URL='https://estadisticas.bcrp.gob.pe/estadisticas/series/';
  const WDI_URL='https://data.worldbank.org/indicator/';
  const PERU=[
    ['gdp','PBI real','PN02507AQ','Crecimiento interanual','quarterly','%'],
    ['inflation','Inflación IPC','PN01273PM','IPC de Lima Metropolitana, variación a 12 meses','monthly','%'],
    ['unemployment','Desempleo nacional (OIT)','SL.UEM.TOTL.ZS','Estimación modelada por OIT, no desempleo urbano','annual','%'],
    ['fx','Tipo de cambio','PN01207PM','Promedio interbancario, soles por dólar','monthly','S/ por US$'],
    ['trade','Balanza comercial','PN38723BM','Acumulado móvil de doce meses FOB','monthly','millones US$'],
    ['confidence','Confianza empresarial','PD38045AM','Expectativa de la economía a tres meses','monthly','puntos']
  ];
  const PERU_EXTRAS=[
    ['policy','Tasa de referencia','PD04722MM','Tasa de política monetaria del BCRP','monthly','%'],
    ['reserves','Reservas internacionales','PN00027MM','Reservas internacionales netas del BCRP','monthly','millones US$']
  ];
  const GLOBAL=[
    ['gdp','Crecimiento del PBI','NY.GDP.MKTP.KD.ZG','Variación anual del PBI real','annual','%'],
    ['inflation','Inflación promedio anual','FP.CPI.TOTL.ZG','IPC promedio anual, no inflación diciembre a diciembre','annual','%'],
    ['unemployment','Desempleo nacional (OIT)','SL.UEM.TOTL.ZS','Estimación modelada por OIT','annual','%'],
    ['fx','PBI por habitante','NY.GDP.PCAP.CD','Dólares estadounidenses corrientes','annual','US$'],
    ['trade','Exportaciones','NE.EXP.GNFS.ZS','Bienes y servicios como porcentaje del PBI','annual','% PBI'],
    ['confidence','Cuenta corriente','BN.CAB.XOKA.GD.ZS','Saldo de cuenta corriente como porcentaje del PBI','annual','% PBI']
  ];
  const calendarMonth=date=>{const [year,month]=date.split('-').map(Number);return year*12+month;};
  function observations(row) {
    return (row?.observations||[])
      .filter(point=>/^\d{4}-\d{2}-01$/.test(point.date)&&Number(point.date.slice(5,7))>=1&&Number(point.date.slice(5,7))<=12)
      .map(point=>({date:point.date,value:Number.isFinite(point.value)?point.value:null}))
      .sort((a,b)=>a.date.localeCompare(b.date));
  }
  /** Return a rolling 12-month sum only for consecutive real monthly observations. */
  function rollingTwelveMonths(points) {
    const sorted=[...points].sort((a,b)=>a.date.localeCompare(b.date));
    const end=sorted.findLastIndex(p=>Number.isFinite(p.value));
    if(end<11)return null;
    const months=sorted.slice(end-11,end+1);
    if(months.length!==12||months.some(p=>!Number.isFinite(p.value)))return null;
    for(let i=1;i<12;i++)if(calendarMonth(months[i].date)-calendarMonth(months[i-1].date)!==1)return null;
    return {value:months.reduce((sum,p)=>sum+p.value,0),date:months[11].date};
  }
  /** The 2007-based official index is rebased to the full calendar-2015 monthly mean. */
  function rebaseBcrpIndex(points,baseYear=2015){
    const sorted=[...points].sort((a,b)=>a.date.localeCompare(b.date));
    const base=sorted.filter(point=>point.date.startsWith(`${baseYear}-`));
    if(base.length!==12||base.some(point=>!Number.isFinite(point.value)||point.value<=0))return null;
    if(new Set(base.map(point=>point.date.slice(5,7))).size!==12)return null;
    const average=base.reduce((sum,point)=>sum+point.value,0)/12;
    return sorted.map(point=>({date:point.date,value:Number.isFinite(point.value)?point.value/average*100:null}));
  }
  function getPanoramaLevelSeries(bcrp){
    const row=bcrp?.PN01773AM;
    return row?.frequency==='monthly'?rebaseBcrpIndex(observations(row),2015):null;
  }
  function fromBcrp(definition,bcrp) {
    const [id,title,code,description,frequency,unit]=definition;
    const row=bcrp?.[code];
    const series=observations(row);
    const recent=series.findLast(p=>Number.isFinite(p.value));
    const rollingSeries=id==='trade'?series.flatMap((point,i)=>{
      const value=rollingTwelveMonths(series.slice(0,i+1));
      return value?.date===point.date?[value]:[];
    }):null;
    const rolling=id==='trade'?rollingSeries.at(-1)||null:null;
    const value=id==='trade'?rolling?.value??null:recent?.value??null;
    const period=id==='trade'?rolling?.date??null:recent?.date??null;
    const step=frequency==='quarterly'?3:1;
    const prev=recent&&series.find(p=>calendarMonth(p.date)===calendarMonth(recent.date)-step);
    const delta=id==='trade'||!Number.isFinite(prev?.value)?null:value-prev.value;
    const sourceUrl=`${BCRP_URL}${frequency==='quarterly'?'trimestrales':'mensuales'}/resultados/${code}/html`;
    return {id,title,code,description,frequency,unit,provider:'BCRP',sourceUrl,period,
      value,delta,deltaUnit:unit==='%'?'p.p.':unit,status:Number.isFinite(value)?'live':'unavailable',
      aggregation:id==='trade'&&Number.isFinite(value)?'12 meses completos':null,
      extractedAt:row?.fetchedAt||null,series:rollingSeries||series};
  }
  function fromWdi(definition,country,wdi,source,dates) {
    const [id,title,code,description,frequency,unit]=definition;
    const yearValues=wdi?.[country]?.[code]||{};
    const series=Object.entries(yearValues).filter(([year])=>/^\d{4}$/.test(year)).map(([date,value])=>({date,value:Number.isFinite(value)?value:null})).sort((a,b)=>a.date.localeCompare(b.date));
    const latest=series.findLast(p=>Number.isFinite(p.value));
    const prev=latest&&series.find(p=>Number(p.date)===Number(latest.date)-1);
    const value=latest?.value??null;
    const origin=latest&&source?.[country]?.[code]?.[latest.date]==='wdi'?'live':'fallback';
    return {id,title,code,description,frequency,unit,provider:'Banco Mundial · WDI',sourceUrl:WDI_URL+code,
      period:latest?.date||null,value,delta:Number.isFinite(prev?.value)?value-prev.value:null,
      deltaUnit:unit==='%'?'p.p.':unit,status:Number.isFinite(value)?origin:'unavailable',
      aggregation:null,extractedAt:origin==='live'?dates?.live?.[code]||null:dates?.fallback?.[code]||null,series};
  }
  function buildPanoramaMetrics({country,wdi={},source={},bcrp={},dates={}}) {
    const peru=country==='PER';
    const cards=(peru?PERU:GLOBAL).map(def=>peru&&def[0]!=='unemployment'?fromBcrp(def,bcrp):fromWdi(def,country,wdi,source,dates));
    const extras=peru?PERU_EXTRAS.map(def=>fromBcrp(def,bcrp)):[];
    const latestDates=cards.filter(c=>c.status==='live').map(c=>c.period).filter(Boolean);
    return {country,cards,extras,asOf:latestDates.length?latestDates.sort().at(-1):null};
  }
  Object.assign(M,{buildPanoramaMetrics,rollingTwelveMonths,rebaseBcrpIndex,getPanoramaLevelSeries});
})();
