/* Equilibrio parcial de una economía pequeña importadora. Precios y cantidades ilustrativos. */
(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
  const defaults = Object.freeze({worldPrice:50,tariff:0,specificTariff:0,subsidy:0,tradeCost:0,quotaEnabled:false,quota:80,rent:'domestic',demandIntercept:160,demandSlope:1,supplyIntercept:-20,supplySlope:1});
  function solve(input = {}) {
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('El paquete debe ser un objeto de parámetros.');
    const p = Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,Object.hasOwn(input,k)?input[k]:v]));
    for (const k of Object.keys(defaults).filter(k=>typeof defaults[k]==='number')) {
      if (typeof p[k]!=='number'||!Number.isFinite(p[k])) throw new Error('Introduce un número finito en '+k+'.');
    }
    if(p.worldPrice<=0||p.demandSlope<=0||p.supplySlope<=0||p.demandIntercept<=0||p.supplyIntercept>0) throw new Error('Demanda, oferta o precio mundial fuera del alcance del modelo.');
    for(const k of ['tariff','specificTariff','subsidy','tradeCost','quota']) if(p[k]<0) throw new Error('Los instrumentos no admiten valores negativos.');
    if(typeof p.quotaEnabled!=='boolean'||!['domestic','auction','foreign'].includes(p.rent)) throw new Error('Selecciona una cuota y una asignación de rentas válidas.');
    const D = price=>Math.max(0,p.demandIntercept-p.demandSlope*price);
    const S = price=>Math.max(0,p.supplyIntercept+p.supplySlope*price);
    const demand0=D(p.worldPrice),supply0=S(p.worldPrice);
    if(demand0-supply0<=0) throw new Error('El mercado base debe ser importador. Reduce el precio mundial o cambia las pendientes.');
    if(S(p.worldPrice+p.subsidy)>demand0+1e-8) throw new Error('Ese subsidio convertiría el sector en exportador; este modelo solo resuelve mercados importadores.');
    const unitTariff=p.worldPrice*p.tariff/100+p.specificTariff;
    const landed=p.worldPrice+unitTariff+p.tradeCost;
    const excess=price=>D(price)-S(price+p.subsidy);
    // Bisection retains the nonnegative supply corner rather than assuming both curves are interior.
    const inverseExcess=q=>{let lo=0,hi=p.demandIntercept/p.demandSlope;for(let j=0;j<90;j++){const mid=(lo+hi)/2;if(excess(mid)>q)lo=mid;else hi=mid;}return (lo+hi)/2;};
    const autarky=inverseExcess(0);
    const unconstrained=Math.max(0,excess(landed));
    const binding=p.quotaEnabled&&p.quota<unconstrained-1e-8;
    const price=Math.min(autarky,binding?inverseExcess(p.quota):landed);
    const producerPrice=price+p.subsidy;
    const demand=D(price),supply=S(producerPrice),imports=Math.max(0,demand-supply);
    const quotaPremium=binding?Math.max(0,price-landed):0;
    const quotaRent=quotaPremium*imports;
    const foreignRent=p.rent==='foreign'?quotaRent:0;
    const privateRent=p.rent==='domestic'?quotaRent:0;
    const auctionRevenue=p.rent==='auction'?quotaRent:0;
    const tariffRevenue=unitTariff*imports,subsidyCost=p.subsidy*supply;
    const fiscal=tariffRevenue+auctionRevenue-subsidyCost;
    const utility=q=>p.demandIntercept/p.demandSlope*q-q*q/(2*p.demandSlope);
    const cost=q=>-p.supplyIntercept/p.supplySlope*q+q*q/(2*p.supplySlope);
    const consumerSurplus=utility(demand)-price*demand;
    const producerSurplus=producerPrice*supply-cost(supply);
    const consumer0=utility(demand0)-p.worldPrice*demand0;
    const producer0=p.worldPrice*supply0-cost(supply0);
    const welfare=consumerSurplus+producerSurplus+fiscal+privateRent;
    const consumptionLoss=utility(demand0)-utility(demand)-p.worldPrice*(demand0-demand);
    const productionLoss=cost(supply)-cost(supply0)-p.worldPrice*(supply-supply0);
    const resourceCost=p.tradeCost*imports;
    const r={params:p,price,producerPrice,demand,supply,imports,autarky,landed,unitTariff,quotaPremium,quotaRent,privateRent,foreignRent,auctionRevenue,tariffRevenue,subsidyCost,fiscal,consumerSurplus,producerSurplus,welfare,welfareChange:welfare-consumer0-producer0,consumptionLoss,productionLoss,resourceCost,consumerChange:consumerSurplus-consumer0,producerChange:producerSurplus-producer0,base:{price:p.worldPrice,demand:demand0,supply:supply0,imports:demand0-supply0,welfare:consumer0+producer0},regime:imports<1e-7?'Sin importaciones':binding?'Cuota vinculante':p.quotaEnabled?'Cuota no vinculante':'Comercio abierto'};
    if(Object.values(r).some(v=>typeof v==='number'&&!Number.isFinite(v)))throw new Error('La combinación excede el rango numérico del modelo.');
    return r;
  }
  const sources = Object.freeze([
    {id:'fao',title:'FAO · Instrumentos de protección y efectos económicos',url:'https://www.fao.org/4/x7352e/X7352E03.htm',use:'Equilibrio parcial, precios, excedentes e instrumentos de apoyo a productores.'},
    {id:'unctad',title:'UNCTAD · Non-tariff measures from A to Z',url:'https://unctad.org/publication/non-tariff-measures-z',use:'Medidas no arancelarias y sus objetivos. Un costo de cumplimiento no representa todos sus efectos o beneficios.'},
    {id:'wto',title:'OMC · Restricciones cuantitativas',url:'https://www.wto.org/english/tratop_e/markacc_e/qr_e.htm',use:'Definiciones y contexto institucional de cuotas; la simulación no evalúa legalidad ni excepciones.'},
    {id:'bcrp',title:'BCRP · Reportes de inflación',url:'https://www.bcrp.gob.pe/publicaciones/reporte-de-inflacion.html',use:'Contexto institucional monetario. El ejercicio IS–LM–BP es teórico, no una estimación de la economía peruana.'}
  ]);
  const instruments = Object.freeze([
    {id:'tariff',name:'Arancel',family:'Comercial',status:'Operativo',text:'Eleva el costo de importación y, mientras se importe, el precio interno. Recauda sobre las importaciones efectivas.',source:'fao'},
    {id:'quota',name:'Cuota de importación',family:'Comercial',status:'Operativo',text:'Limita cantidades cuando es vinculante. Las rentas pueden quedar en importadores nacionales, el Estado o el exterior.',source:'wto'},
    {id:'subsidy',name:'Subsidio a la producción',family:'Fiscal',status:'Operativo',text:'Eleva el precio recibido por productores. Su costo fiscal depende de toda la producción subvencionada.',source:'fao'},
    {id:'cost',name:'Costo de cumplimiento en frontera',family:'Regulatoria',status:'Operativo',text:'Representa un costo real por unidad importada. No es un arancel ni mide los posibles beneficios sanitarios o ambientales.',source:'unctad'},
    {id:'spending',name:'Gasto público',family:'Fiscal',status:'Motor macro',text:'Desplaza la demanda de bienes en IS–LM–BP. Su efecto final depende del régimen y la movilidad de capitales.',source:'bcrp'},
    {id:'tax',name:'Impuestos autónomos',family:'Fiscal',status:'Motor macro',text:'Modifican el ingreso disponible y el consumo en el ejercicio macroeconómico de corto plazo.',source:'bcrp'},
    {id:'money',name:'Oferta monetaria',family:'Monetaria',status:'Motor macro',text:'Afecta liquidez, tasas y tipo de cambio según el cierre del modelo. En paridad fija deja de ser un instrumento autónomo.',source:'bcrp'},
    {id:'fx',name:'Régimen cambiario',family:'Monetaria',status:'Motor macro',text:'Cambia el mecanismo de ajuste externo. La paridad fija vuelve endógenos los saldos monetarios.',source:'bcrp'},
    {id:'sps',name:'Medidas sanitarias y técnicas',family:'Regulatoria',status:'Conceptual',text:'Pueden proteger salud, seguridad o ambiente. Sus efectos y beneficios no se reducen al costo comercial simulado.',source:'unctad'},
    {id:'procurement',name:'Compras públicas',family:'Fiscal',status:'Conceptual',text:'La asignación de contratos y requisitos de origen influye en competencia y proveedores. No hay un mercado de licitaciones en este motor.',source:'unctad'},
    {id:'competition',name:'Competencia y regulación',family:'Regulatoria',status:'Conceptual',text:'Poder de mercado y externalidades pueden cambiar las conclusiones de bienestar del modelo competitivo.',source:'unctad'},
    {id:'retaliation',name:'Represalias comerciales',family:'Comercial',status:'Conceptual',text:'Un país grande o una respuesta extranjera exige otro modelo. Aquí el precio mundial permanece exógeno.',source:'wto'}
  ]);
  const presets=Object.freeze([
    {id:'free',name:'Libre comercio',input:{}},
    {id:'tariff',name:'Arancel del 20 %',input:{tariff:20}},
    {id:'quota',name:'Cuota con licencias nacionales',input:{quotaEnabled:true,quota:60,rent:'domestic'}},
    {id:'foreign',name:'Cuota con renta extranjera',input:{quotaEnabled:true,quota:60,rent:'foreign'}},
    {id:'subsidy',name:'Subsidio productivo de 10',input:{subsidy:10}},
    {id:'mix',name:'Arancel + subsidio + cuota',input:{tariff:20,subsidy:10,quotaEnabled:true,quota:30}},
    {id:'barrier',name:'Costo real en frontera',input:{tradeCost:10}},
    {id:'prohibitive',name:'Arancel prohibitivo',input:{tariff:100}}
  ]);
  M.Policy=Object.freeze({defaults,solve,sources,instruments,presets});
})();
