(function () {
  'use strict';
  const M = globalThis.MacroScope;
  function route() {
    const [requested, query=''] = location.hash.slice(1).split('?');
    const view = ['inicio','laboratorio','panorama','fuentes','ayuda'].includes(requested) ? requested : 'inicio';
    M.state.activeTab = view === 'panorama' ? 'overview' : view === 'laboratorio' ? 'simulator' : view;
    document.querySelectorAll('[data-view]').forEach(el => { el.hidden = el.dataset.view !== view; });
    document.querySelectorAll('[data-route]').forEach(el => {
      if(el.dataset.route === view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current');
    });
    document.querySelector('.nav-menu').open = false;
    const target=document.querySelector(`[data-view="${view}"]`);
    target.focus({preventScroll:true});
    window.scrollTo({top:0,behavior:'instant'});
    if(view==='panorama') M.renderCharts();
    if(view==='laboratorio') M.renderIslm();
    M.renderSourceDirectory?.(new URLSearchParams(query));
    M.showGlossaryTerm?.(new URLSearchParams(query).get('term'));
  }
  function setupStudentViews() { window.addEventListener('hashchange',route); route(); }
  Object.assign(M,{setupStudentViews,route});
})();
