(function () {
  'use strict';
  const M = globalThis.MacroScope ||= {};
    const FX_URL = 'https://open.er-api.com/v6/latest/USD';
    async function loadFxRates(rates, signal) {
      try {
        const response=await fetch(FX_URL,{signal});
        const data=response.ok?await response.json():null;
        if(data?.result==='success' && data?.rates) {
          Object.keys(rates).forEach(k=>{if(Number.isFinite(data.rates[k]))rates[k].rate=data.rates[k];});
          return {success:true,updated:data.time_last_update_utc || null};
        }
      } catch {}
      return {success:false,updated:null};
    }

  Object.assign(M, { FX_URL, loadFxRates });
})();
