/* zb-clouds — the Work page's cloud scene, laid out from Zolton's Figma example ("Work page — Light (1440) Example").
   Open sky behind the hero, then a close, flat-topped cloud floor at "Selected work": everything below sits on clouds.
   Each cloud is a still from the About page's cloud engine (day: sun in front; night: moon behind, dark grey with a rim).
   Positions come from the 1440-wide design and are mapped onto the live page section by section, so a cloud keeps its
   place relative to the hero, Selected work, Experience, Contact and the footer whatever their real heights.
   Parallax: each cloud is exactly where the design puts it when its middle crosses the middle of the screen; far clouds
   lag behind the scroll, near ones run slightly ahead. Light/dark crossfades with the site's mode.
   Only runs when <html> has the class zb-cloud-cards (preview address, or ?clouds).
   Other pages (the case studies) mark where the camera lands on the cloud tops with data-zb-sea-land. */
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
    // a few small high clouds in the open sky
    { key: 'far', src: 'lib/12-scatter', nsrc: 'soft/12-scatter', x: -486,  y: 120,  w: 2785, h: 532,  f: 0.30 },
    // (the sea of clouds itself is the live 3D plane below, not an image)
    // the H1's own cloud, in front of the sea
    { key: 'title', src: 'lib/03-humilis', nsrc: 'soft/03-humilis', x: -425,  y: 174,  w: 1593, h: 694,  f: 0.16 }
  ];
  // Zolton's fade ("going into the clouds"): from clear at FADE.from to solid at FADE.to (design y), then solid to the bottom
  var FADE = { from: 1040, to: 1500 };
  // section tops in the design, matched to the live page's sections
  var ANCHORS = [['hero', 0], ['work', 1008], ['experience', 1536], ['contact', 1867], ['footer', 2263], ['end', 2341]];
  var FLOOR = { day: '#fbfcfd', night: '#1b2433' };   // inside the cloud: clean white by day, clean dark grey at night

  var css = document.createElement('style');
  css.textContent = [
    '.zbs{position:absolute;left:0;top:0;right:0;z-index:-2;pointer-events:none;overflow:hidden}',
    '.zbs-c{position:absolute;will-change:transform;z-index:2}','.zbs-c.behind{z-index:0}',
    '.zbs-c img{position:absolute;inset:0;width:100%;height:100%;transition:opacity 900ms cubic-bezier(.65,0,.35,1)}',
    /* feather the stills' outer edge: their faint edge pixels showed as a hairline frame over the video sky */
    '.zbs-c img{-webkit-mask-image:linear-gradient(to right,transparent,#000 3%,#000 97%,transparent),linear-gradient(to bottom,transparent,#000 4%,#000 96%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent,#000 3%,#000 97%,transparent),linear-gradient(to bottom,transparent,#000 4%,#000 96%,transparent);mask-composite:intersect}',
    '.zbs-c img.n{opacity:0}',
    '.zbs-c.flip img{transform:scaleX(-1)}',
    'html[data-mode="dark"] .zbs-c img.d{opacity:0}',
    'html[data-mode="dark"] .zbs-c img.n{opacity:1}',
    '.zbs{--zf:' + FLOOR.day + ';--zf0:rgba(251,252,253,0)}',
    'html[data-mode="dark"] .zbs{--zf:' + FLOOR.night + ';--zf0:rgba(27,36,51,0)}',
    '.zbs-fade{position:absolute;left:0;right:0;background:linear-gradient(to bottom,var(--zf0),var(--zf))}',
    '.zbs-floor{position:absolute;left:0;right:0;bottom:0;background:var(--zf)}',
    '.zbs-sway{position:absolute;inset:0;animation:zbsSway var(--t,34s) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}',
    '@keyframes zbsSway{from{transform:translateX(-0.6%)}to{transform:translateX(0.6%)}}',
    '@media (prefers-reduced-motion:reduce){.zbs-sway{animation:none}}',
    'html.zb-cloud-cards .page_root{overflow-x:clip}',
    /* keep text readable over the clouds: a soft halo in the page's own ground colour */
    'html.zb-cloud-cards section :is(h1,h2,h3,p,.label-mono){text-shadow:0 1px 18px rgba(242,245,248,.75),0 0 2px rgba(242,245,248,.35)}',
    'html.zb-cloud-cards[data-mode="dark"] section :is(h1,h2,h3,p,.label-mono){text-shadow:0 1px 18px rgba(5,10,22,.8),0 0 2px rgba(5,10,22,.5)}',
    '.zbs-drift{will-change:transform}',
    '.zbs-sea{z-index:1;position:fixed;left:0;top:0;width:100vw;height:100vh;height:100lvh;overflow:hidden;pointer-events:none}',
    '.zbs-strip{position:absolute;left:0;top:0;width:100%;will-change:transform;-webkit-mask-image:linear-gradient(to bottom,transparent 0,transparent 8%,#000 20%);mask-image:linear-gradient(to bottom,transparent 0,transparent 8%,#000 20%);-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat}',
    '.zbs-strip>img,.zbs-strip>video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 0;opacity:0;transition:opacity 700ms cubic-bezier(.65,0,.35,1)}',
    '.zbs-strip>.on{opacity:1}',
    /* the closest clouds melt into the page colour at the bottom of the loop, then the page colour carries on below it */
    '.zbs-near{position:absolute;left:0;right:0;bottom:0;height:22%;background:linear-gradient(to bottom,var(--zf0),var(--zf))}',
    '.zbs-solid{position:absolute;inset:0;background:var(--zf);opacity:0}',
    '.zbs-under{position:absolute;left:0;right:0;top:0;height:400vh;background:var(--zf);will-change:transform}'
  ].join('');
  document.head.appendChild(css);

  var root, scene, items = [];
  function top(el) { if (!el) return null; var rr = root.getBoundingClientRect(); return el.getBoundingClientRect().top - rr.top; }
  function sections() {
    var land = document.querySelector('[data-zb-sea-land]'), card = land || document.querySelector('.work_card'), work = land || (card && (card.closest('section') || card.parentElement));
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
      scene.appendChild(el); items.push({ el: el, f: c.f, key: c.key, cy: y + h / 2 });
    });
    if (sea.canvas) scene.insertBefore(sea.canvas, scene.firstChild);   // the sea sits under the image clouds
    root.insertBefore(scene, root.firstChild);
  }
  // content drifts a little with the clouds: each section's content lags the scroll slightly around the middle of the screen
  var CONTENT_F = 0.05, MAX_DRIFT = 36, drift = [];
  function findDrift() {
    drift = [];
    [].forEach.call(root.querySelectorAll('section'), function (sec) {
      if (sec.hasAttribute('data-zb-experience') || sec.querySelector('[data-zb-experience], .work_card, .gold_coin, canvas')) return;   // the logo field has its own depth motion
      [].forEach.call(sec.children, function (ch) { ch.classList.add('zbs-drift'); drift.push({ el: ch, sec: sec }); });
    });
  }
  // ---- The sea of clouds: a pre-rendered video loop of the cloud sea (rendered offline from the same raymarcher this
  // file used to run live, day and night), so the page draws it with no 3D at all. As you scroll, the horizon rises toward
  // "Selected work" exactly as before (same scroll keyframes); below it the page goes one solid colour.
  // Phones, weak devices and reduced motion get the still of the same loop.
  var SEA_DEFAULTS = {
    // scroll: where the horizon sits
    land: 0.42, lineGap: 46, rise: 0.08,
    // high clouds: when each goes behind the cloud horizon (share of the descent: 0 top of page .. 1 landed), and its parallax
    farBehind: 1.37, titleBehind: 0.5, farParallax: 0.30, titleParallax: 0.16,
    // fade to solid: between these points of the descent (0 top .. 1 landed) the clouds blend toward the page colour, up to this much
    solidFrom: 0.8, solidTo: 1.3, solidAmount: 0.92,
    // Zoltbot: seconds at the footer before he flies up out of the clouds
    botLate: 6,
    // Zoltbot: free-form AI answers per visitor per day before he loops back to the scripted questions (the server caps it too)
    aiReplies: 100,
    // Zoltbot: overall size (1 = his default sizes in the hero, at Contact and on the chat)
    botSize: 1
  };
  var SEA = {};
  (function () { for (var k in SEA_DEFAULTS) SEA[k] = SEA_DEFAULTS[k]; })();   // a saved draft (Draft Controls) is applied on top, preview / ?tune only
  window.ZB_AI_REPLIES = SEA.aiReplies;
  window.ZB_BOT_SIZE = SEA.botSize;
  window.ZB_BOT_LATE = SEA.botLate * 1000;   // read by Zoltbot (password/zb-password.js, late mode)
  var MEDIA = window.ZB_MEDIA || 'https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@bcece79874d7c27ac7f221dccf7a2aab0e35316b/';
  var touch = matchMedia('(pointer: coarse)').matches;
  var seaStill = reduce || touch || !!window.zbLite || /zbstill/.test(location.search);
  var HZ = 200 / 900, ASPECT = 1280 / 800;    // the loop's horizon sits 22% down its frame; the frame is 16:10
  var sea = { canvas: null, layers: {}, mode: '', playing: false };
  function vsrc(base) {
    return '<source src="' + base + '-hevc.mp4" type=\'video/mp4; codecs="hvc1"\'>' +
      '<source src="' + base + '.webm" type=\'video/webm; codecs="vp9"\'>' +
      '<source src="' + base + '.mp4" type="video/mp4">';
  }
  function seaLayer(mode) {
    if (sea.layers[mode]) return sea.layers[mode];
    var L = { }, base = MEDIA + 'sea/sea-' + mode;
    var img = L.img = new Image(); img.alt = ''; img.decoding = 'async';
    img.onload = function () { L.imgReady = true; seaPaint(); };
    img.src = base + '.webp';
    sea.strip.insertBefore(img, sea.solid);
    if (!seaStill) {
      L.start = function () {
        if (L.video) return;
        var v = L.video = document.createElement('video');
        v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.setAttribute('tabindex', '-1');
        v.innerHTML = vsrc(base);
        v.addEventListener('playing', function () { L.playing = true; seaPaint(); });
        sea.strip.insertBefore(v, sea.solid);
        seaFrame();
      };
      var go = function () { setTimeout(L.start, 600); };
      if (document.readyState === 'complete') go(); else addEventListener('load', go);
    }
    return (sea.layers[mode] = L);
  }
  function seaPaint() {
    for (var k in sea.layers) {
      var L = sea.layers[k], cur = k === sea.mode;
      L.img.classList.toggle('on', cur && !!L.imgReady);
      if (L.video) L.video.classList.toggle('on', cur && !!L.playing);
    }
  }
  function seaMode() {
    var m = html.getAttribute('data-mode') === 'dark' ? 'night' : 'day';
    if (m === sea.mode) return;
    sea.mode = m; seaLayer(m); seaPaint(); seaFrame();
  }
  function seaInit() {
    var c = sea.canvas = document.createElement('div'); c.className = 'zbs-sea'; c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="zbs-strip"><div class="zbs-near"></div><div class="zbs-solid"></div></div><div class="zbs-under"></div>';
    sea.strip = c.firstChild; sea.under = c.lastChild; sea.solid = sea.strip.querySelector('.zbs-solid');
    seaMode();
    new MutationObserver(seaMode).observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    document.addEventListener('visibilitychange', seaFrame);
    seaDraft();   // Draft Controls (draft/zb-draft.js): preview address, or ?tune on the live site
  }
  function seaState() {
    if (window.__zbSeaForce) return window.__zbSeaForce;                         // test hook: pin the horizon
    var land = document.querySelector('[data-zb-sea-land]'), card = land || document.querySelector('.work_card'), work = land || (card && (card.closest('section') || card.parentElement));
    if (!work) return null;
    var vh = innerHeight, s = scrollY, wt = work.getBoundingClientRect().top;    // Selected work, on screen
    var L = Math.max(1, wt + s - SEA.land * vh);                                // scroll at which you land on the cloud tops
    return { hz: wt - SEA.lineGap + SEA.rise * Math.max(0, L - s), L: L };
  }
  function seaKick() { ask(); }
  function seaFrame() {
    var st = seaState(); if (!st || !sea.canvas) return;
    var w = innerWidth, h = innerHeight;
    var sh = Math.max(w / ASPECT, h * 0.8);                                       // strip height; on tall screens it crops the sides
    if (sh !== sea.sh) { sea.sh = sh; sea.strip.style.height = sh.toFixed(0) + 'px'; }
    var y = st.hz - HZ * sh;
    sea.strip.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    sea.under.style.transform = 'translate3d(0,' + (y + sh - 1).toFixed(1) + 'px,0)';   // the page colour below the loop
    var pr2 = st.L ? scrollY / st.L : 0, sf = SEA.solidTo > SEA.solidFrom ? (pr2 - SEA.solidFrom) / (SEA.solidTo - SEA.solidFrom) : (pr2 >= SEA.solidFrom ? 1 : 0);
    sf = Math.max(0, Math.min(1, sf)); sf = sf * sf * (3 - 2 * sf) * SEA.solidAmount;
    sea.solid.style.opacity = sf.toFixed(3);
    // One loop at a time: Chrome drops the whole page to ~25 fps while two videos play at once. The sky loop plays while the
    // sky fills most of the screen; once the sea covers half of it the sea plays and the sky holds its frame; deep in the
    // cloud (solid colour) both rest.
    var visible = y < h && y + sh > 0 && sf < 0.98 && !document.hidden;
    var cover = (h - st.hz) / h;
    if (sea.lead !== 'sea' && cover > 0.5 && visible) sea.lead = 'sea';
    else if (sea.lead === 'sea' && (cover < 0.4 || !visible)) sea.lead = 'sky';
    var seaPlays = visible && sea.lead === 'sea';
    if (!sea.sky) sea.sky = document.querySelector('zb-sky');
    if (sea.sky && sea.sky.hold) sea.sky.hold(seaPlays || st.hz <= 0);
    for (var k in sea.layers) {
      var v = sea.layers[k].video; if (!v) continue;
      if (seaPlays && k === sea.mode) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
      else if (!v.paused) v.pause();
    }
  }

  // ---- Draft Controls groups (draft/zb-draft.js shows them on the preview address, or with ?tune) ----
  var SEA_GROUPS = [
    ['High clouds', true, [
      ['farBehind', 'Far clouds go behind horizon at (0 top · 1 landed)', 0, 1.5, .01], ['farParallax', 'Far clouds parallax (higher = sinks)', -.3, .9, .01],
      ['titleBehind', 'Title cloud goes behind horizon at', 0, 1.5, .01], ['titleParallax', 'Title cloud parallax', -.3, .9, .01]]],
    ['Zoltbot', true, [['botLate', 'Seconds at the footer before he shows up', 0, 20, .5], ['aiReplies', 'AI answers per visitor per day, then back to the script', 0, 200, 1], ['botSize', 'His size (1 = default)', .5, 2, .05]], 'bot'],
    ['Fade to solid', true, [
      ['solidFrom', 'Fade starts at (0 top · 1 landed)', 0, 2, .01], ['solidTo', 'Fully faded at', 0, 2.5, .01],
      ['solidAmount', 'How solid (1 = one colour)', 0, 1, .01]]],
    ['Scroll', false, [
      ['land', 'Land when work is this far down', .1, .8, .01], ['lineGap', 'Horizon above Selected work (px)', -100, 200, 1],
      ['rise', 'Horizon rise speed', 0, .6, .01]]]
  ];
  function seaDraft() {
    var change = function () { window.ZB_BOT_SIZE = SEA.botSize; window.ZB_BOT_LATE = SEA.botLate * 1000; window.ZB_AI_REPLIES = SEA.aiReplies; run(); };
    SEA_GROUPS.forEach(function (g, n) {
      var grp = { id: 'work-' + g[0].toLowerCase().replace(/[^a-z]+/g, '-'), title: 'Work · ' + g[0], open: g[1], rows: g[2], order: 20 + n,
        values: SEA, defaults: SEA_DEFAULTS, store: 'zbSeaTune', onChange: change };
      if (g[3] === 'bot') grp.buttons = [['Replay his entrance', function (b) {
        if (window.zbBotReplay) { window.zbBotReplay(); var f = document.querySelector('footer, .page_footer'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'end' }); }
        else b.textContent = 'Scroll to the footer first'; }]];
      if (window.zbDraft) window.zbDraft.add(grp); else (window.__zbDraftQ = window.__zbDraftQ || []).push(grp);
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
    var stp = seaState(), prog = stp && stp.L ? scrollY / stp.L : 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i], d = mid - (rootTop + it.cy);   // >0 once the cloud's middle has scrolled above the screen's middle
      var f = it.key && SEA[it.key + 'Parallax'] != null ? SEA[it.key + 'Parallax'] : it.f;
      it.el.style.transform = 'translate3d(0,' + (d * f).toFixed(1) + 'px,0)';
      // keyframe: from this point of the descent (0 = top of page, 1 = landed) the cloud sits behind the cloud horizon
      if (it.key && SEA[it.key + 'Behind'] != null) it.el.classList.toggle('behind', prog >= SEA[it.key + 'Behind']);
    }
    seaFrame();
  }
  function ask() { if (!q) { q = true; requestAnimationFrame(run); } }
  function rebuild() { if (scene) scene.remove(); build(); run(); }
  function init() {
    seaInit();
    rebuild();
    if (!reduce) { try { findDrift(); } catch (e) {} run(); }
    if (!reduce) addEventListener('scroll', ask, { passive: true });
    var lw = innerWidth; addEventListener('resize', function () { if (Math.abs(innerWidth - lw) > 40) { lw = innerWidth; rebuild(); } else ask(); });
    setTimeout(rebuild, 2500);   // the page grows as embeds load (logo strip, Lottie): rebuild once it settles
  }
  window.zbScene = { scene: SCENE, anchors: ANCHORS, rebuild: rebuild };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
