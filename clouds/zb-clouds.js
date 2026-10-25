/* zb-clouds — near cumulus behind the Work page's tiles, the Experience strip and Contact.
   The clouds are stills rendered from the About page's cloud engine (sun from in front of the viewer, so the faces read bright white;
   night: darker, moonlit from a different angle) and crossfade with the site's light/dark mode.
   Two depths per spot: a near cloud the content sits on, and a farther one behind it. As the page scrolls the near
   clouds run a little ahead of the page and the far ones lag behind it, so they read as layers of sky at different distances.
   Only runs when <html> has the class zb-cloud-cards (preview address, or ?clouds). */
(function () {
  'use strict';
  if (window.__zbClouds) return; window.__zbClouds = true;
  var html = document.documentElement;
  if (!html.classList.contains('zb-cloud-cards')) return;
  var BASE = (document.currentScript && document.currentScript.src.replace(/zb-clouds\.js.*$/, '')) || '';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NEAR = 0.1, FAR = -0.12;   // parallax: share of the distance from the screen centre each layer is pushed by

  var css = document.createElement('style');
  css.textContent = [
    '.zbc-host{position:relative;isolation:isolate}',
    /* the work tiles' clouds overlap their neighbours, so they share the grid's layer (all clouds under all tiles' content) */
    '.work_card.zbc-host{isolation:auto}',
    '.zbc-layer{isolation:isolate}',
    '.zbc-clip{overflow-x:clip}',
    '.zbc-clip :is(h1,h2,h3,.zbx-h){position:relative;z-index:1}',   /* section headings stay in front of the clouds */   /* clouds are wider than the screen on phones: never let them widen the page */
    '.zbc{position:absolute;pointer-events:none;will-change:transform;z-index:-2}',   /* -1 is left for the coin's own layer, so it stays in front */
    '.zbc.far{z-index:-3;opacity:.9}',
    '.zbc img.d{filter:brightness(1.07) saturate(.9)}',
    '.zbc img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;transition:opacity 900ms cubic-bezier(.65,0,.35,1)}',
    '.zbc img.n{opacity:0}',
    'html[data-mode="dark"] .zbc img.d{opacity:0}',
    'html[data-mode="dark"] .zbc img.n{opacity:1}',
    '.zbc .sway{position:absolute;inset:0;animation:zbcSway var(--t,26s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}',
    '@keyframes zbcSway{from{transform:translateX(-1.6%)}to{transform:translateX(1.6%)}}',
    '@media (prefers-reduced-motion:reduce){.zbc .sway{animation:none}}'
  ].join('');
  document.head.appendChild(css);

  // n: sprite number (1-12, see the clouds folder), w: width as a share of the host, x/y: centre, as shares of the host, aspect: h/w of the sprite
  var AR = { 1: .568, 2: .52, 3: .6, 4: .44, 5: .767, 6: .599, 7: .572, 8: .473, 9: .605, 10: .539, 11: .506, 12: .477 };
  var PLAN = [
    { sel: '.work_card', each: [
      [{ n: 4, w: 2.0, x: .5, y: .56, depth: 'near' }, { n: 5, w: 1.0, x: .8, y: .26, depth: 'far' }],
      [{ n: 12, w: 2.0, x: .5, y: .57, depth: 'near' }, { n: 9, w: 1.0, x: .22, y: .25, depth: 'far' }],
      [{ n: 8, w: 2.0, x: .5, y: .56, depth: 'near' }, { n: 3, w: .95, x: .78, y: .25, depth: 'far' }]
    ] },
    { sel: '[data-zb-experience]', each: [[
      { n: 2, w: .5, x: .16, y: .68, depth: 'near' }, { n: 11, w: .5, x: .5, y: .72, depth: 'near' }, { n: 10, w: .5, x: .84, y: .68, depth: 'near' },
      { n: 6, w: .32, x: .33, y: .42, depth: 'far' }, { n: 7, w: .32, x: .68, y: .44, depth: 'far' }
    ]] },
    { sel: '#contact .cta_band', each: [[
      { n: 1, w: 1.5, x: .45, y: .56, depth: 'near' }, { n: 5, w: .55, x: .88, y: .25, depth: 'far' }
    ]] }
  ];

  var layers = [];
  function build(only) {
    PLAN.forEach(function (p) {
      if (only && p.sel !== only) return;
      // the Experience strip writes its section with innerHTML once it loads, which would wipe clouds added before it
      if (!only && p.sel === '[data-zb-experience]') { waitFor('[data-zb-experience] .zbx-track', function () { build(p.sel); run(); }); return; }
      var hosts = document.querySelectorAll(p.sel);
      [].forEach.call(hosts, function (host, i) {
        var set = p.each[i % p.each.length];
        host.classList.add('zbc-host');
        if (host.parentElement) host.parentElement.classList.add('zbc-layer');
        var sec = host.closest('section') || host.parentElement; if (sec) sec.classList.add('zbc-clip');
        set.forEach(function (c, j) {
          var el = document.createElement('div');
          el.className = 'zbc ' + c.depth; el.setAttribute('aria-hidden', 'true');
          var w = c.w * 100, h = c.w * AR[c.n];   // height in host-width units
          el.style.cssText = 'width:' + w + '%;left:' + (c.x * 100 - w / 2) + '%;aspect-ratio:' + (1 / AR[c.n]) + ';top:calc(' + (c.y * 100) + '% - ' + (h * 50) + 'cqw)';
          el.innerHTML = '<div class="sway" style="--t:' + (22 + ((i * 3 + j * 5) % 9)) + 's;--dl:-' + ((i * 7 + j * 4) % 13) + 's">' +
            '<img class="d" alt="" decoding="async" loading="lazy" src="' + BASE + 'cloud' + c.n + '-day.webp">' +
            '<img class="n" alt="" decoding="async" loading="lazy" src="' + BASE + 'cloud' + c.n + '-night.webp"></div>';
          host.appendChild(el);
          layers.push({ el: el, host: host, k: c.depth === 'near' ? NEAR : FAR });
        });
        host.style.containerType = host.style.containerType || 'inline-size';
      });
    });
  }
  function waitFor(sel, cb) { var n = 0; (function t() { if (document.querySelector(sel)) cb(); else if (++n < 60) setTimeout(t, 250); })(); }
  var q = false;
  function run() {
    q = false; var mid = innerHeight / 2;
    for (var i = 0; i < layers.length; i++) {
      var r = layers[i].host.getBoundingClientRect();
      if (r.bottom < -innerHeight || r.top > innerHeight * 2) continue;
      layers[i].el.style.transform = 'translate3d(0,' + (((r.top + r.height / 2) - mid) * layers[i].k).toFixed(1) + 'px,0)';
    }
  }
  function ask() { if (!q) { q = true; requestAnimationFrame(run); } }
  function init() { build(); run(); if (!reduce) { addEventListener('scroll', ask, { passive: true }); addEventListener('resize', ask); } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
