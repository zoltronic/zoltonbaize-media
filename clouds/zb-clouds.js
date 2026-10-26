/* zb-clouds — the Work page's cloud scene, laid out from Zolton's Figma example ("Work page — Light (1440) Example").
   Open sky behind the hero, then a close, flat-topped cloud floor at "Selected work": everything below sits on clouds.
   Each cloud is a still from the About page's cloud engine (day: sun in front; night: moon behind, dark grey with a rim).
   Positions come from the 1440-wide design and are mapped onto the live page section by section, so a cloud keeps its
   place relative to the hero, Selected work, Experience, Contact and the footer whatever their real heights.
   Parallax: each cloud is exactly where the design puts it when its middle crosses the middle of the screen; far clouds
   lag behind the scroll, near ones run slightly ahead. Light/dark crossfades with the site's mode.
   Only runs when <html> has the class zb-cloud-cards (preview address, or ?clouds). */
(function () {
  'use strict';
  if (window.__zbClouds) return; window.__zbClouds = true;
  var html = document.documentElement;
  if (!html.classList.contains('zb-cloud-cards')) return;
  var BASE = (document.currentScript && document.currentScript.src.replace(/zb-clouds\.js.*$/, '')) || '';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // The design (1440 wide), bottom to top. src: file under clouds/, x/y/w/h: px in the design, f: parallax
  // (share of the scroll the cloud lags by; negative runs ahead of the page = closer than the content).
  var DESIGN_W = 1440;
  var SCENE = [
    { src: 'lib/03-humilis', nsrc: 'soft/03-humilis', x: 924,   y: 772,  w: 542,  h: 236,  f: 0.35 },
    { src: 'lib/12-scatter', nsrc: 'soft/12-scatter', x: -486,  y: 120,  w: 2785, h: 532,  f: 0.30 },
    { src: 'lib/09-deck',    nsrc: 'soft/09-deck',    x: -175,  y: 842,  w: 1370, h: 204,  f: 0.22 },
    // the cloud sea: flat-topped clouds seen from just above, running to the horizon; behind the big title cloud
    { src: 'sea-flat',                                x: -800,  y: 700,  w: 3040, h: 668,  f: 0.08 },
    { src: 'lib/03-humilis', nsrc: 'soft/03-humilis', x: -425,  y: 174,  w: 1593, h: 694,  f: 0.16 },
    // a second, closer layer of the same sea (mirrored) behind Selected work: it rises a little faster than the page
    { src: 'sea-flat', flip: true,                    x: -1300, y: 980,  w: 4040, h: 888,  f: -0.18 }
  ];
  // Zolton's fade ("going into the clouds"): from clear at FADE.from to solid at FADE.to (design y), then solid to the bottom
  var FADE = { from: 1013, to: 1802 };
  // section tops in the design, matched to the live page's sections
  var ANCHORS = [['hero', 0], ['work', 1008], ['experience', 1536], ['contact', 1867], ['footer', 2263], ['end', 2341]];
  var FLOOR = { day: '#f2f5f8', night: '#1d1f24' };   // inside the cloud: clean white by day, clean dark grey at night

  var css = document.createElement('style');
  css.textContent = [
    '.zbs{position:absolute;left:0;top:0;right:0;z-index:-1;pointer-events:none;overflow:hidden}',
    '.zbs-c{position:absolute;will-change:transform}',
    '.zbs-c img{position:absolute;inset:0;width:100%;height:100%;transition:opacity 900ms cubic-bezier(.65,0,.35,1)}',
    '.zbs-c img.n{opacity:0}',
    '.zbs-c.flip img{transform:scaleX(-1)}',
    'html[data-mode="dark"] .zbs-c img.d{opacity:0}',
    'html[data-mode="dark"] .zbs-c img.n{opacity:1}',
    '.zbs{--zf:' + FLOOR.day + ';--zf0:rgba(242,245,248,0)}',
    'html[data-mode="dark"] .zbs{--zf:' + FLOOR.night + ';--zf0:rgba(29,31,36,0)}',
    '.zbs-fade{position:absolute;left:0;right:0;background:linear-gradient(to bottom,var(--zf0),var(--zf))}',
    '.zbs-floor{position:absolute;left:0;right:0;bottom:0;background:var(--zf)}',
    '.zbs-sway{position:absolute;inset:0;animation:zbsSway var(--t,34s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}',
    '@keyframes zbsSway{from{transform:translateX(-0.6%)}to{transform:translateX(0.6%)}}',
    '@media (prefers-reduced-motion:reduce){.zbs-sway{animation:none}}',
    'html.zb-cloud-cards .page_root{overflow-x:clip}',
    /* keep text readable over the clouds: a soft halo in the page's own ground colour */
    'html.zb-cloud-cards section :is(h1,h2,h3,p,.label-mono){text-shadow:0 1px 18px rgba(242,245,248,.75),0 0 2px rgba(242,245,248,.35)}',
    'html.zb-cloud-cards[data-mode="dark"] section :is(h1,h2,h3,p,.label-mono){text-shadow:0 1px 18px rgba(5,10,22,.8),0 0 2px rgba(5,10,22,.5)}',
    '.zbs-drift{will-change:transform}'
  ].join('');
  document.head.appendChild(css);

  var root, scene, items = [];
  function top(el) { if (!el) return null; var rr = root.getBoundingClientRect(); return el.getBoundingClientRect().top - rr.top; }
  function sections() {
    var card = document.querySelector('.work_card'), work = card && (card.closest('section') || card.parentElement);
    var track = document.querySelector('.zbx-track'), exp = track && (track.closest('section') || track.parentElement);
    var contact = document.getElementById('contact'); contact = contact && (contact.closest('section') || contact);
    var foot = root.querySelector('footer') || document.querySelector('footer');
    var hero = root.querySelector('section');
    var H = root.getBoundingClientRect().height;
    return { hero: top(hero) || 0, work: top(work), experience: top(exp), contact: top(contact), footer: top(foot), end: H };
  }
  // piecewise-linear map from design y to page y through the matched section tops
  function mapper() {
    var s = sections(), pts = [];
    ANCHORS.forEach(function (a) { if (s[a[0]] != null && isFinite(s[a[0]])) pts.push([a[1], s[a[0]]]); });
    pts.sort(function (a, b) { return a[0] - b[0]; });
    return function (y) {
      if (pts.length < 2) return y;
      var i = 0; while (i < pts.length - 2 && y > pts[i + 1][0]) i++;
      var a = pts[i], b = pts[i + 1], t = (y - a[0]) / Math.max(1, b[0] - a[0]);
      return a[1] + t * (b[1] - a[1]);
    };
  }
  function build() {
    root = document.querySelector('.page_root') || document.body;
    if (getComputedStyle(root).position === 'static') root.style.position = 'relative';
    var W = root.getBoundingClientRect().width, H = root.getBoundingClientRect().height;
    var k = Math.max(0.55, W / DESIGN_W), map = mapper();
    scene = document.createElement('div'); scene.className = 'zbs'; scene.setAttribute('aria-hidden', 'true'); scene.style.height = H + 'px';
    items = [];
    SCENE.forEach(function (c, i) {
      var w = c.w * k, h = c.h * k, x = W / 2 + (c.x - DESIGN_W / 2) * k, y = map(c.y);
      var el = document.createElement('div'); el.className = 'zbs-c';
      el.style.cssText = 'left:' + x.toFixed(0) + 'px;top:' + y.toFixed(0) + 'px;width:' + w.toFixed(0) + 'px;height:' + h.toFixed(0) + 'px';
      if (c.flip) el.classList.add('flip');
      el.innerHTML = '<div class="zbs-sway" style="--t:' + (28 + i * 3) + 's;--dl:-' + (i * 4) + 's">' +
        '<img class="d" alt="" decoding="async" src="' + BASE + c.src + '-day.webp">' +
        '<img class="n" alt="" decoding="async" loading="lazy" src="' + BASE + (c.nsrc || c.src) + '-night.webp"></div>';
      scene.appendChild(el); items.push({ el: el, f: c.f, cy: y + h / 2 });
    });
    var f0 = map(FADE.from), f1 = map(FADE.to);
    var fd = document.createElement('div'); fd.className = 'zbs-fade'; fd.style.top = f0.toFixed(0) + 'px'; fd.style.height = Math.max(1, f1 - f0 + 1).toFixed(0) + 'px'; scene.appendChild(fd);
    var fl = document.createElement('div'); fl.className = 'zbs-floor'; fl.style.top = f1.toFixed(0) + 'px'; scene.appendChild(fl);
    root.insertBefore(scene, root.firstChild);
  }
  // content drifts a little with the clouds: each section's content lags the scroll slightly around the middle of the screen
  var CONTENT_F = 0.05, MAX_DRIFT = 36, drift = [];
  function findDrift() {
    drift = [];
    [].forEach.call(root.querySelectorAll('section'), function (sec) {
      if (sec.hasAttribute('data-zb-experience') || sec.querySelector('[data-zb-experience]')) return;   // the logo field has its own depth motion
      [].forEach.call(sec.children, function (ch) { ch.classList.add('zbs-drift'); drift.push({ el: ch, sec: sec }); });
    });
  }
  var q = false;
  function run() {
    q = false; if (!scene) return;
    var rootTop = root.getBoundingClientRect().top, mid = innerHeight / 2;
    for (var j = 0; j < drift.length; j++) {
      var r = drift[j].sec.getBoundingClientRect(), dd = mid - (r.top + r.height / 2);
      var t = Math.max(-MAX_DRIFT, Math.min(MAX_DRIFT, dd * CONTENT_F));
      drift[j].el.style.transform = 'translate3d(0,' + t.toFixed(1) + 'px,0)';
    }
    for (var i = 0; i < items.length; i++) {
      var it = items[i], d = mid - (rootTop + it.cy);   // >0 once the cloud's middle has scrolled above the screen's middle
      it.el.style.transform = 'translate3d(0,' + (d * it.f).toFixed(1) + 'px,0)';
    }
  }
  function ask() { if (!q) { q = true; requestAnimationFrame(run); } }
  function rebuild() { if (scene) scene.remove(); build(); run(); }
  function init() {
    rebuild();
    if (!reduce) { try { findDrift(); } catch (e) {} run(); }
    if (!reduce) addEventListener('scroll', ask, { passive: true });
    var lw = innerWidth; addEventListener('resize', function () { if (Math.abs(innerWidth - lw) > 40) { lw = innerWidth; rebuild(); } else ask(); });
    setTimeout(rebuild, 2500);   // the page grows as embeds load (logo strip, Lottie): rebuild once it settles
  }
  window.zbScene = { scene: SCENE, anchors: ANCHORS, rebuild: rebuild };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
