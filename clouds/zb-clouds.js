/* zb-clouds — a deck of big cumulus banks from "Selected work" to the bottom of the Work page.
   The banks are stills rendered from the About page's cloud engine (sun in front of the viewer, so their faces are bright
   white; at night, darker and moonlit from the upper left), each a random cluster of 5-7 clouds. They sit in three layers at
   different depths: as the page scrolls the far layer lags, the near one runs ahead, so gaps open and close and the sky
   shows through between them. Light/dark crossfades with the site's mode.
   Only runs when <html> has the class zb-cloud-cards (preview address, or ?clouds). */
(function () {
  'use strict';
  if (window.__zbClouds) return; window.__zbClouds = true;
  var html = document.documentElement;
  if (!html.classList.contains('zb-cloud-cards')) return;
  var BASE = (document.currentScript && document.currentScript.src.replace(/zb-clouds\.js.*$/, '')) || '';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SEED = 11;   // change for a different random sky
  var BANKS = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };   // aspect ratios (h/w) are filled in from the images
  // f: parallax (share of the scroll the layer is held back by; negative runs ahead), gap: px between rows (at 1000px wide),
  // w: bank width range as a share of the deck width, op: opacity, per: banks per row
  var LAYERS = [
    { name: 'far',  f: 0.42, gap: 330, w: [0.7, 1.05], op: 0.7,  per: 1, y: [-40, 40] },
    { name: 'mid',  f: 0.18, gap: 420, w: [0.8, 1.15], op: 0.92, per: 1, y: [-60, 60] },
    { name: 'near', f: -0.14, gap: 560, w: [0.9, 1.3], op: 1,    per: 1, y: [-80, 80] }
  ];

  var css = document.createElement('style');
  css.textContent = [
    '.zbd{position:absolute;left:0;right:0;z-index:-1;pointer-events:none;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 260px);mask-image:linear-gradient(to bottom,transparent 0,#000 260px)}',   /* the deck's top fades in, so it never shows a hard line */
    '.zbd-layer{position:absolute;left:0;right:0;top:0;will-change:transform}',
    '.zbd-b{position:absolute}',
    '.zbd-b img{position:absolute;inset:0;width:100%;height:100%;transition:opacity 900ms cubic-bezier(.65,0,.35,1)}',
    '.zbd-b img.d{filter:brightness(1.05)}',
    '.zbd-b img.n{opacity:0}',
    'html[data-mode="dark"] .zbd-b img.d{opacity:0}',
    'html[data-mode="dark"] .zbd-b img.n{opacity:1}',
    '.zbd-b.flip img{transform:scaleX(-1)}',
    '.zbd-sway{position:absolute;inset:0;animation:zbdSway var(--t,30s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}',
    '@keyframes zbdSway{from{transform:translateX(-1.2%)}to{transform:translateX(1.2%)}}',
    '@media (prefers-reduced-motion:reduce){.zbd-sway{animation:none}}',
    'html.zb-cloud-cards .page_root{overflow-x:clip}'
  ].join('');
  document.head.appendChild(css);

  function rng(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var root, deck, layers = [], startY = 0, maxShift = 0;

  function loadRatios(cb) {
    var left = 8;
    Object.keys(BANKS).forEach(function (k) {
      var im = new Image(); im.onload = im.onerror = function () { BANKS[k] = im.naturalWidth ? im.naturalHeight / im.naturalWidth : 0.22; if (--left === 0) cb(); };
      im.src = BASE + 'bank' + k + '-day.webp';
    });
  }
  function build() {
    root = document.querySelector('.page_root') || document.body;
    var first = document.querySelector('.work_card');
    var sec = first && (first.closest('section') || first.parentElement);
    if (!sec) return;
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    var rr = root.getBoundingClientRect(), sr = sec.getBoundingClientRect();
    startY = Math.max(0, sr.top - rr.top - 180);   /* start a little above the section so the fade-in lands on it */
    var H = rr.height - startY, W = rr.width;
    deck = document.createElement('div'); deck.className = 'zbd'; deck.setAttribute('aria-hidden', 'true');
    deck.style.top = startY + 'px'; deck.style.height = H + 'px';
    var r = rng(SEED * 7919 + 3), keys = Object.keys(BANKS), scale = Math.max(0.6, W / 1000);
    maxShift = H;   // how far a layer can move over the deck's scroll range
    LAYERS.forEach(function (L, li) {
      var lay = document.createElement('div'); lay.className = 'zbd-layer zbd-' + L.name; lay.style.opacity = L.op;
      // cover the deck plus however far this layer travels, so no edge ever scrolls into view
      var reach = Math.abs(L.f) * (H + innerHeight), top = L.f > 0 ? -reach : -innerHeight * 0.3, bottom = L.f > 0 ? H + innerHeight * 0.3 : H + reach;
      lay.style.height = (bottom - top) + 'px'; lay.style.top = top + 'px';
      var gap = L.gap * scale, y = (L.name === 'near' ? 0.6 : 0) * gap;
      for (; y < bottom - top; y += gap) {
        for (var p = 0; p < L.per; p++) {
          var k = keys[Math.floor(r() * keys.length)], w = (L.w[0] + r() * (L.w[1] - L.w[0])) * W, h = w * BANKS[k];
          var x = (p + r()) / L.per * W - w / 2 + (r() - 0.5) * W * 0.3;
          var b = document.createElement('div'); b.className = 'zbd-b' + (r() < 0.5 ? ' flip' : '');
          b.style.cssText = 'left:' + x.toFixed(0) + 'px;top:' + (y + L.y[0] + r() * (L.y[1] - L.y[0]) - h * 0.6).toFixed(0) + 'px;width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px';
          b.innerHTML = '<div class="zbd-sway" style="--t:' + (24 + r() * 14).toFixed(1) + 's;--dl:-' + (r() * 20).toFixed(1) + 's">' +
            '<img class="d" alt="" decoding="async" loading="lazy" src="' + BASE + 'bank' + k + '-day.webp">' +
            '<img class="n" alt="" decoding="async" loading="lazy" src="' + BASE + 'bank' + k + '-night.webp"></div>';
          lay.appendChild(b);
        }
      }
      deck.appendChild(lay); layers.push({ el: lay, f: L.f });
    });
    root.insertBefore(deck, root.firstChild);
  }
  var q = false;
  function run() {
    q = false; if (!deck) return;
    // scroll measured from the moment the deck's top reaches the bottom of the screen
    var s = Math.max(0, -(deck.getBoundingClientRect().top - innerHeight));
    for (var i = 0; i < layers.length; i++) layers[i].el.style.transform = 'translate3d(0,' + (s * layers[i].f).toFixed(1) + 'px,0)';
  }
  function ask() { if (!q) { q = true; requestAnimationFrame(run); } }
  var built = false;
  function rebuild() { if (deck) deck.remove(); layers = []; build(); run(); }
  function init() {
    loadRatios(function () {
      rebuild(); built = true;
      if (!reduce) addEventListener('scroll', ask, { passive: true });
      var lw = innerWidth; addEventListener('resize', function () { if (Math.abs(innerWidth - lw) > 40) { lw = innerWidth; rebuild(); } else ask(); });
      // the page grows as embeds load (logo strip, Lottie): rebuild once it settles
      setTimeout(rebuild, 2500);
    });
  }
  window.zbDeck = { layers: LAYERS, rebuild: function () { rebuild(); }, seed: function (n) { SEED = n; rebuild(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
