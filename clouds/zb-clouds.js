/* zb-clouds — near cumulus behind the Work page's tiles, the Experience strip and Contact.
   The clouds are stills rendered from the About page's cloud engine (same sun; day: lit tops bright white, shaded bases;
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
    '.zbc{position:absolute;pointer-events:none;will-change:transform;z-index:-1}',
    '.zbc.far{z-index:-2;opacity:.9}',
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
  var AR = { 1: .80, 2: .59, 3: .56, 4: .64, 5: .57, 6: .46, 7: .91, 8: .76, 9: .60, 10: .70, 11: .55, 12: .47 };
  var PLAN = [
    { sel: '.work_card', each: [
      [{ n: 6, w: 1.5, x: .5, y: .5, depth: 'near' }, { n: 7, w: .8, x: .78, y: .22, depth: 'far' }],
      [{ n: 3, w: 1.45, x: .5, y: .52, depth: 'near' }, { n: 10, w: .78, x: .24, y: .2, depth: 'far' }],
      [{ n: 12, w: 1.5, x: .5, y: .5, depth: 'near' }, { n: 8, w: .7, x: .76, y: .2, depth: 'far' }]
    ] },
    { sel: '[data-zb-experience]', each: [[
      { n: 2, w: .42, x: .16, y: .72, depth: 'near' }, { n: 5, w: .4, x: .5, y: .76, depth: 'near' }, { n: 11, w: .42, x: .84, y: .72, depth: 'near' },
      { n: 1, w: .26, x: .34, y: .5, depth: 'far' }, { n: 9, w: .26, x: .7, y: .52, depth: 'far' }
    ]] },
    { sel: '#contact .cta_band', each: [[
      { n: 6, w: 1.25, x: .44, y: .58, depth: 'near' }, { n: 4, w: .5, x: .86, y: .3, depth: 'far' }
    ]] }
  ];

  var layers = [];
  function build() {
    PLAN.forEach(function (p) {
      var hosts = document.querySelectorAll(p.sel);
      [].forEach.call(hosts, function (host, i) {
        var set = p.each[i % p.each.length];
        host.classList.add('zbc-host');
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
