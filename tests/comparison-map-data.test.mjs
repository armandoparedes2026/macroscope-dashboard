import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

globalThis.MacroScope = {};
await import('../js/services/comparison-map-data.js');

const {selectedCountryFeatures,indicatorStops} = globalThis.MacroScope.comparisonMapData;
const geo = {type:'FeatureCollection',features:[
  {type:'Feature',properties:{ADM0_A3:'PER',NAME:'Peru'},geometry:{type:'Polygon',coordinates:[]}},
  {type:'Feature',properties:{ISO_A3:'CHL',NAME:'Chile'},geometry:{type:'Polygon',coordinates:[]}},
  {type:'Feature',properties:{ADM0_A3:'COL',NAME:'Colombia'},geometry:{type:'Polygon',coordinates:[]}},
  {type:'Feature',properties:{ADM0_A3:'BRA',NAME:'Brazil'},geometry:{type:'Polygon',coordinates:[]}}
]};
const data={PER:{GDP:{'2023':0}},CHL:{GDP:{'2023':-2}},COL:{GDP:{'2023':null}}};

test('selección de polígonos usa código ISO3, conserva valores negativos, cero y ausencias',()=>{
  const result=selectedCountryFeatures(geo,['PER','CHL','COL'],data,'GDP','2023');
  assert.equal(result.type,'FeatureCollection');
  assert.equal(result.features.length,3);
  assert.deepEqual(result.features.map(f=>[f.properties.cdCode,f.properties.cdValue,f.properties.cdHasValue]),[
    ['PER',0,true],['CHL',-2,true],['COL',null,false]
  ]);
  assert.equal(geo.features[0].properties.cdCode,undefined,'no debe mutar el GeoJSON original');
});

test('año no disponible jamás se trata como cero',()=>{
  const result=selectedCountryFeatures(geo,['PER','CHL'],data,'GDP',null);
  assert.ok(result.features.every(f=>f.properties.cdValue===null&&!f.properties.cdHasValue));
});

test('escala normalizada no falla con valores iguales, ausentes ni negativos',()=>{
  assert.deepEqual(indicatorStops([-2,0]),[-2,0]);
  assert.deepEqual(indicatorStops([3,3]),[2.5,3.5]);
  assert.deepEqual(indicatorStops([null,NaN]),[0,1]);
});

test('Natural Earth incluye geometría de las 18 economías habilitadas',()=>{
  const real=JSON.parse(readFileSync(new URL('../data/geo/ne_110m_admin_0_countries.geojson',import.meta.url),'utf8'));
  const countries=['PER','CHL','COL','MEX','BRA','USA','ARG','BOL','ECU','URY','PRY','CRI','CHN','JPN','DEU','ESP','CAN','KOR'];
  const selected=selectedCountryFeatures(real,countries,{},'GDP',null);
  assert.deepEqual(new Set(selected.features.map(f=>f.properties.cdCode)),new Set(countries));
  assert.ok(selected.features.every(f=>f.geometry.coordinates.length>0));
});
