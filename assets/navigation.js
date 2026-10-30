(function (global) {
  'use strict';
  // Only entries created in this document are eligible for browser back.
  // A directly opened case therefore returns to its stage, never another site.
  const key = 'petroAtlasNavigation', session = Date.now() + '-' + Math.random();
  let current = 0, enabled = true;
  const positions = [0];
  function mark() {
    try { history.replaceState(Object.assign({}, history.state, { [key]: { session, index: current } }), '', location.href); }
    catch (_) { enabled = false; }
  }
  mark();
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  global.addEventListener('scroll', function () { positions[current] = global.scrollY; }, { passive: true });
  global.addEventListener('hashchange', function () {
    const state = history.state && history.state[key];
    const returning = enabled && state && state.session === session && state.index !== current;
    if (returning) current = state.index;
    else {
      current++;
      positions.length = current + 1;
      positions[current] = 0;
      mark();
    }
    const y = positions[current] || 0;
    if (returning) requestAnimationFrame(function () { global.scrollTo(0, y); });
  });
  function parent(p) {
    if (p[0] === 'scene') {
      const scene = global.ATLAS.index.byScene[p[1]];
      if (scene) return { href: '#/stage/' + scene.stageId, label: '返回' + scene.stageName };
    }
    if (p[0] === 'stage' || p[0] === 'method') return { href: '#/explore', label: '返回案例库' };
    if (p[0] === 'admin') return { href: '#/cases', label: '返回案例管理' };
    return { href: '#/', label: '返回首页' };
  }
  const canBack = () => enabled && current > 0;
  function header(p) {
    if (!p.length) return '';
    const target = parent(p), esc = global.K.esc;
    return '<nav class="p-return-nav" aria-label="返回导航">' +
      '<a class="p-back" data-atlas-back href="' + target.href + '" title="' + (canBack() ? '回到刚才浏览的位置' : esc(target.label)) + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7"/></svg>' +
      '<span>' + (canBack() ? '返回上一页' : esc(target.label)) + '</span></a>' +
      '</nav>';
  }
  document.addEventListener('click', function (event) {
    const link = event.target.closest('[data-atlas-back]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (canBack()) { event.preventDefault(); history.back(); }
  });
  global.AtlasNavigation = { header, parent, canBack };
})(window);
