(function () {
  'use strict';
  // Embedded experiments use the portal's navigation. Extracted packages stay independent.
  if (window.parent !== window) return;
  const scene = document.body.dataset.scene;
  const route = location.pathname.match(/^(.*\/)(?:cases\/[^/]+\/demo\/index\.html)$/);
  if (!scene || !route) return;
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', '实验返回导航');
  nav.className = 'demo-return-nav';
  const back = document.createElement('a');
  back.href = route[1] + 'index.html#/scene/' + encodeURIComponent(scene) + '?tab=demo';
  back.textContent = '← 返回案例详情';
  const home = document.createElement('a');
  home.href = route[1] + 'index.html#/labmap';
  home.textContent = '案例实验室';
  nav.append(back, home);
  const style = document.createElement('style');
  style.textContent = '.demo-return-nav{display:flex;gap:20px;align-items:center;padding:12px 18px;background:#f0f6f2;border-bottom:1px solid #d5e4da;font:13px/1.5 system-ui,sans-serif}.demo-return-nav a{color:#296e59;text-decoration:none;padding:6px 0}.demo-return-nav a:first-child{font-weight:600}.demo-return-nav a:hover{text-decoration:underline}.demo-return-nav a:focus-visible{outline:2px solid #296e59;outline-offset:4px}';
  document.head.append(style);
  document.body.prepend(nav);
})();
