// Official series verified against the BCRP API; see docs/fuentes-bcrp.md.
export const SERIES = {
  "PD04722MM": {
    "title": "Tasas de interés del Banco Central de Reserva - Tasa de Referencia de la Política Monetaria",
    "unit": "%",
    "frequency": "monthly"
  },
  "PN01273PM": {
    "title": "Índice de precios Lima Metropolitana (var% 12 meses) - IPC",
    "unit": "% en 12 meses",
    "frequency": "monthly"
  },
  "PN01207PM": {
    "title": "Tipo de cambio - promedio del periodo (S/ por US$) - Interbancario - Promedio",
    "unit": "S/ por US$",
    "frequency": "monthly"
  },
  "PN00027MM": {
    "title": "Cuentas monetarias del Banco Central de Reserva del Perú - Reservas Internacionales Netas (millones US$)",
    "unit": "millones US$",
    "frequency": "monthly"
  },
  "PN02507AQ": {
    "title": "Producto bruto interno (variación porcentual interanual) - PBI Global",
    "unit": "% interanual",
    "frequency": "quarterly"
  },
  "PD38045AM": {
    "title": "Expectativas empresariales totales - Índice de expectativas de la economía a 3 meses",
    "unit": "puntos",
    "frequency": "monthly"
  },
  "PN38723BM": {
    "title": "Balanza comercial - valores FOB (millones US$) - Balanza Comercial",
    "unit": "millones US$",
    "frequency": "monthly"
  },
  "PN01773AM": {
    "title": "Producto bruto interno y demanda interna (índice 2007 = 100) - PBI Desestacionalizado - mensual",
    "unit": "índice 2007=100",
    "frequency": "monthly"
  },
  "PN38714BM": {
    "title": "Balanza comercial - valores FOB (millones US$) - Exportaciones",
    "unit": "millones US$",
    "frequency": "monthly"
  },
  "PN38718BM": {
    "title": "Balanza comercial - valores FOB (millones US$) - Importaciones",
    "unit": "millones US$",
    "frequency": "monthly"
  }
};
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export function parseBcrp(raw,codes,fetchedAt=new Date().toISOString()) {
  // BCRP sometimes appends PHP diagnostics after an otherwise complete JSON document.
  const data=typeof raw==='string'?JSON.parse(raw.split('<br')[0]):raw;
  if(!data?.config||!Array.isArray(data.config.series)||!Array.isArray(data.periods)||data.config.series.length!==codes.length)throw Error('Respuesta BCRP malformada');
  return codes.map(code=>{
    const meta=SERIES[code];
    if(!meta)throw Error('Código no permitido');
    const index=data.config.series.findIndex(s=>s.name===meta.title);
    if(index<0)throw Error('Título BCRP inesperado para '+code);
    const observations=data.periods.map(row=>{
      const monthly=/^([A-Za-z]{3})\.(\d{4})$/.exec(row.name);
      const quarter=/^T([1-4])\.(\d{2}|\d{4})$/.exec(row.name);
      let date;
      if(meta.frequency==='monthly'&&monthly&&MONTHS.includes(monthly[1])){
        date=monthly[2]+'-'+String(MONTHS.indexOf(monthly[1])+1).padStart(2,'0')+'-01';
      }else if(meta.frequency==='quarterly'&&quarter){
        const fragment=quarter[2];
        const year=fragment.length===2?(Number(fragment)>=70?1900:2000)+Number(fragment):Number(fragment);
        date=year+'-'+String(1+(Number(quarter[1])-1)*3).padStart(2,'0')+'-01';
      }
      if(!date||!Array.isArray(row.values)||row.values.length!==codes.length)throw Error('Periodo BCRP inválido');
      const rawValue=row.values[index];
      const value=rawValue===null||String(rawValue).trim().toLowerCase()==='n.d.'?null:Number(rawValue);
      if(value!==null&&(String(rawValue).trim()===''||!Number.isFinite(value)))throw Error('Valor BCRP inválido');
      return {period:row.name,date,value};
    }).sort((a,b)=>a.date.localeCompare(b.date));
    return {source:'BCRP',code,...meta,observations,fetchedAt};
  });
}
const validPeriod=value=>typeof value==='string'&&/^(19|20)\d{2}-(?:[1-9]|1[0-2])$/.test(value);
export default async function handler(req,res) {
  if(req.method!=='GET'){res.setHeader('Allow','GET');return res.status(405).json({error:'Solo GET'});}
  const {codes:input,start,end}=req.query||{};
  const codes=typeof input==='string'?input.split('-'):[];
  if(!codes.length||codes.some(code=>!Object.hasOwn(SERIES,code))||new Set(codes).size!==codes.length)return res.status(400).json({error:'Códigos no permitidos'});
  if(new Set(codes.map(code=>SERIES[code].frequency)).size!==1)return res.status(400).json({error:'Las series deben tener la misma frecuencia'});
  if(!validPeriod(start)||!validPeriod(end))return res.status(400).json({error:'Periodo inválido; use AAAA-M'});
  const periodNumber=value=>{const [y,m]=value.split('-').map(Number);return y*12+m;};
  if(periodNumber(start)>periodNumber(end)||periodNumber(end)-periodNumber(start)>1200)return res.status(400).json({error:'Rango de periodos inválido (máximo 100 años)'});
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),10000);
  try {
    const response=await fetch('https://estadisticas.bcrp.gob.pe/estadisticas/series/api/'+codes.join('-')+'/json/'+start+'/'+end,{signal:controller.signal});
    if(!response.ok)throw Error('HTTP '+response.status);
    const result=parseBcrp(await response.text(),codes);
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(result.length===1?result[0]:result);
  }catch(error){return res.status(502).json({error:error.name==='AbortError'?'BCRP excedió el tiempo de espera':'No se pudo obtener una respuesta válida del BCRP'});}
  finally {clearTimeout(timer);}
}
