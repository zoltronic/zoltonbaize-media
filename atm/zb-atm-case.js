/* ATM case study visuals (zoltonbaize.com/atm).
   Mounts on elements marked data-zb-atm="problem | deposit | sketch | readers | tap | testing".
   All artwork is Zolton's own: the deposit animations (2024 and 2025 sets), his storyboard, his reader audit photos,
   and the tap-to-pay Lottie. Assets live next to this file in atm/case/. */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var me = document.currentScript && document.currentScript.src || '';
  var BASE = me.replace(/zb-atm-case\.js.*$/, ''), A = BASE + 'case/';
  var LOTTIE = BASE + 'atm-nfc-tap.json';

  var css = [
    '.zba{--zba-ink:var(--_zb-mode---mode--ink,#07283D);--zba-muted:var(--_zb-mode---mode--muted,#2A5570);--zba-hair:var(--_zb-mode---mode--hair,rgba(7,40,61,.14));',
    '--zba-card:rgba(255,255,255,.72);--zba-card2:rgba(243,247,250,.92);--zba-green:#1fbf6a;color:var(--zba-ink);margin:28px 0 32px;font-family:inherit}',
    'html[data-mode="dark"] .zba{--zba-card:rgba(255,255,255,.07);--zba-card2:rgba(255,255,255,.06)}',
    '.zba *{box-sizing:border-box}.zba img,.zba video{display:block;max-width:100%}',
    '.zba-box{background:var(--zba-card);border:1px solid var(--zba-hair);border-radius:18px;overflow:hidden}',
    '.zba-cap{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--zba-muted);margin-top:12px;line-height:1.5}',
    '.zba-mono{font-family:"JetBrains Mono",ui-monospace,monospace}',
    '.zba-pill{height:44px;padding:0 16px;border-radius:999px;border:1px solid var(--zba-hair);background:var(--zba-card2);color:var(--zba-ink);font:500 13px "JetBrains Mono",ui-monospace,monospace;cursor:pointer;white-space:nowrap}',
    '.zba-pill[aria-pressed="true"]{background:#06222F;color:#EAFBF6;border-color:#06222F}',
    'html[data-mode="dark"] .zba-pill[aria-pressed="true"]{background:#EAF6FD;color:#06222F;border-color:#EAF6FD}',
    '.zba-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
    /* problem photo */
    '.zba-oos{position:relative}.zba-oos img{width:100%;height:auto}',
    '.zba-oos .tag{position:absolute;left:14px;bottom:14px;background:rgba(6,34,47,.86);color:#EAF6FD;font:500 11px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;padding:8px 12px;border-radius:999px}',
    /* deposit system */
    '.zba-dep{padding:clamp(14px,2.4vw,24px)}',
    '.zba-dep .hd{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
    '.zba-dep .hd b{font:600 15px inherit}',
    '.zba-dg{display:grid;grid-template-columns:72px repeat(3,minmax(0,1fr));gap:10px;align-items:center}',
    '.zba-dg .ch,.zba-dg .rh{font:500 11px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--zba-muted)}',
    '.zba-dg .ch{text-align:center}',
    '.zba-tile{position:relative;aspect-ratio:770/418;border-radius:12px;background:#fff;overflow:hidden;border:1px solid var(--zba-hair)}',
    '.zba-tile video{width:100%;height:100%;object-fit:cover;transition:opacity 300ms ease}',
    '.zba-tile.none{background:transparent;border-style:dashed;display:flex;align-items:center;justify-content:center;text-align:center;font:500 11px "JetBrains Mono",monospace;color:var(--zba-muted);padding:8px}',
    '@media (max-width:640px){.zba-dg{grid-template-columns:52px repeat(3,minmax(0,1fr));gap:6px}.zba-dg .rh{font-size:9px;letter-spacing:.06em}.zba-tile{border-radius:8px}}',
    /* storyboard */
    '.zba-sk{padding:clamp(14px,2.4vw,22px)}',
    '.zba-sk .strip{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}',
    '.zba-sk .st{display:flex;flex-direction:column;gap:8px}',
    '.zba-sk .fr{position:relative;aspect-ratio:770/418;border-radius:10px;overflow:hidden;background:#fff;border:1px solid var(--zba-hair)}',
    '.zba-sk .fr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
    '.zba-sk .fr .sk{object-fit:cover;object-position:top}',
    '.zba-sk .fr .fi{clip-path:inset(0 0 0 var(--cut,50%))}',
    '.zba-sk .fr:after{content:"";position:absolute;top:0;bottom:0;left:var(--cut,50%);width:2px;background:#00a5e0;opacity:.9}',
    '.zba-sk .n{font:500 11px "JetBrains Mono",monospace;color:var(--zba-muted);line-height:1.4}',
    '.zba-sk .n b{color:var(--zba-ink);font-weight:600;margin-right:4px}',
    '.zba-sk .sl{display:flex;align-items:center;gap:12px;margin-top:16px;font:500 11px "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--zba-muted)}',
    '.zba-sk input[type=range]{flex:1;accent-color:#00a5e0;height:44px}',
    '@media (max-width:760px){.zba-sk .strip{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -14px;padding:0 14px 6px;scrollbar-width:none}.zba-sk .strip::-webkit-scrollbar{display:none}.zba-sk .st{flex:0 0 72%;scroll-snap-align:center}}',
    /* reader audit (sits on the dark band) */
    '.zba-rd{margin-top:26px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr)) minmax(0,1.15fr);gap:12px}',
    '.zba-rd .m{border-radius:16px;background:rgba(255,255,255,.05);border:1px solid rgba(234,246,253,.14);overflow:hidden;display:flex;flex-direction:column}',
    '.zba-rd .ph{position:relative;aspect-ratio:4/5;background:#0b1e28;overflow:hidden}',
    '.zba-rd .ph>img{width:100%;height:100%;object-fit:cover;opacity:.92}',
    '.zba-rd .in{position:absolute;right:10px;bottom:10px;width:46%;aspect-ratio:1;border-radius:50%;border:2px solid #EAF6FD;overflow:hidden;background:#111;box-shadow:0 8px 24px rgba(0,0,0,.45)}',
    '.zba-rd .in img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity 350ms ease}',
    '.zba-rd .in .ill{object-fit:contain;background:#e9eef2;padding:12%;opacity:0}',
    '.zba-rd .m:hover .in .ill,.zba-rd.over .in .ill{opacity:1}',
    '.zba-rd .tx{padding:12px 14px 14px;display:flex;flex-direction:column;gap:6px}',
    '.zba-rd .tx b{font:500 11px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(234,246,253,.65);font-weight:500}',
    '.zba-rd .tx span{font-size:14px;line-height:1.4;color:#EAF6FD}',
    '.zba-rd .gen{background:#EAF6FD;color:#06222F;border-color:#EAF6FD}',
    '.zba-rd .gen .ph{background:#e9eef2;display:flex;align-items:center;justify-content:center}',
    '.zba-rd .gen .ph img{width:62%;height:auto;object-fit:contain;opacity:1}',
    '.zba-rd .gen .tx b{color:#2A5570}.zba-rd .gen .tx span{color:#06222F}',
    '.zba-rdc{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-top:14px}',
    '.zba-rdc .zba-cap{color:rgba(234,246,253,.65);margin:0}',
    '.zba-rdc .zba-pill{background:rgba(255,255,255,.06);color:#EAF6FD;border-color:rgba(234,246,253,.2)}',
    '.zba-rdc .zba-pill[aria-pressed="true"]{background:#EAF6FD;color:#06222F}',
    '@media (max-width:900px){.zba-rd{grid-template-columns:repeat(2,minmax(0,1fr))}.zba-rd .gen{grid-column:1/-1}.zba-rd .gen .ph{aspect-ratio:16/7}.zba-rd .gen .ph img{width:auto;height:70%}}',
    /* tap-to-pay player */
    '.zba-tap{padding:clamp(14px,2.4vw,24px)}',
    '.zba-tap .stage{position:relative;aspect-ratio:660/412;background:#fff;border-radius:14px;overflow:hidden;border:1px solid var(--zba-hair)}',
    '.zba-tap .lot{position:absolute;inset:0}.zba-tap .lot svg{display:block;width:100%!important;height:100%!important}',
    '.zba-tap .bar{display:flex;align-items:center;gap:12px;margin-top:14px}',
    '.zba-tap .pp{width:44px;height:44px;flex:0 0 44px;border-radius:50%;border:1px solid var(--zba-hair);background:#06222F;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center}',
    'html[data-mode="dark"] .zba-tap .pp{background:#EAF6FD;color:#06222F}',
    '.zba-tap input[type=range]{flex:1;accent-color:#1fbf6a;height:44px}',
    '.zba-tap .t{font:500 12px "JetBrains Mono",monospace;color:var(--zba-muted);min-width:132px;text-align:right}',
    '.zba-tap .steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px;margin-top:10px}',
    '.zba-tap .steps button{min-height:44px;border-radius:10px;border:1px solid var(--zba-hair);background:var(--zba-card2);color:var(--zba-muted);font:500 11px/1.25 "JetBrains Mono",monospace;cursor:pointer;padding:6px;text-align:left}',
    '.zba-tap .steps button.on{background:rgba(31,191,106,.14);border-color:#1fbf6a;color:var(--zba-ink)}',
    '.zba-tap .steps button i{display:block;font-style:normal;opacity:.7;font-size:10px;margin-bottom:2px}',
    '@media (max-width:640px){.zba-tap .steps{grid-template-columns:repeat(3,minmax(0,1fr))}.zba-tap .t{min-width:0;font-size:11px}}',
    /* Lottie colour fixes carried over from the work-card embed: seam strokes, burgundy sleeves in light mode, LED glow */
    '.zba-tap [fill="rgb(193,108,51)"]{stroke:rgb(193,108,51)}.zba-tap [fill="rgb(156,86,32)"]{stroke:rgb(156,86,32)}.zba-tap [fill="rgb(145,78,27)"]{stroke:rgb(145,78,27)}.zba-tap [fill="rgb(230,165,122)"]{stroke:rgb(230,165,122)}',
    '.zba-tap [fill="rgb(214,226,255)"]{fill:#8c1f2b;stroke:#8c1f2b}.zba-tap [fill="rgb(179,201,255)"]{fill:#64131c;stroke:#64131c}',
    '.zba-tap .zb-led{filter:url(#zbaLedGlow)}',
    /* testing */
    '.zba-ts{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;align-items:stretch}',
    '.zba-ts .scr{border-radius:18px;background:#1b2126;padding:14px;display:flex;flex-direction:column;gap:10px}',
    '.zba-ts .glass{position:relative;border-radius:8px;background:#fff;overflow:hidden;aspect-ratio:4/3;display:flex;flex-direction:column}',
    '.zba-ts .ins{background:#0b4f2e;color:#fff;font-weight:600;font-size:clamp(14px,2vw,19px);text-align:center;padding:0 12px;max-height:0;overflow:hidden;transition:max-height 400ms cubic-bezier(.2,.8,.2,1),padding 400ms}',
    '.zba-ts .on .ins{max-height:80px;padding:14px 12px}',
    '.zba-ts .glass .anim{flex:1;min-height:0;width:100%;object-fit:contain;background:#fff}',
    '.zba-ts .wel{font-size:12px;text-align:center;color:#3b3331;padding:8px;border-top:1px solid #eee}',
    '.zba-ts .scr .zba-row{justify-content:center}',
    '.zba-ts .scr .zba-pill{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.2)}',
    '.zba-ts .scr .zba-pill[aria-pressed="true"]{background:#1fbf6a;border-color:#1fbf6a;color:#06222F}',
    '.zba-ts .fx{display:flex;flex-direction:column;gap:12px}',
    '.zba-ts .f{padding:16px 18px;border-radius:16px;background:var(--zba-card);border:1px solid var(--zba-hair);transition:border-color 300ms,background 300ms}',
    '.zba-ts .f b{display:block;font:500 11px "JetBrains Mono",monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--zba-muted);margin-bottom:6px}',
    '.zba-ts .f p{margin:0;font-size:15px;line-height:1.45}',
    '.zba-ts .f.hl{border-color:#1fbf6a;background:rgba(31,191,106,.1)}',
    '@media (max-width:760px){.zba-ts{grid-template-columns:1fr}}',
    'html.zb-cloud-cards .layout_band :is(h1,h2,h3,p,.label-mono){text-shadow:none}'
  ].join('\n');

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function onView(node, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { rootMargin: margin || '0px 0px -15% 0px' });
    io.observe(node);
  }
  function vid(src, label) {
    return '<video muted loop playsinline preload="none" aria-label="' + label + '" data-src="' + A + src.replace(/\.mp4$/, '') + '"></video>';
  }
  // videos play only while on screen (and never under reduced motion, where they show their first frame)
  function watchVideos(root) {
    var vs = [].slice.call(root.querySelectorAll('video[data-src]'));
    vs.forEach(function (v) { if (v.__zbaSrc) return; v.__zbaSrc = 1; var b = v.getAttribute('data-src');
      v.innerHTML = '<source src="' + b + '.webm" type="video/webm"><source src="' + b + '.mp4" type="video/mp4">'; v.preload = 'auto'; v.load(); });
    if (reduce) return;
    if (!('IntersectionObserver' in window)) { vs.forEach(function (v) { v.play().catch(function () {}); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.play().catch(function () {}); else e.target.pause(); }); }, { threshold: .25 });
    vs.forEach(function (v) { io.observe(v); });
  }
  function mount(name, build) {
    [].forEach.call(document.querySelectorAll('[data-zb-atm~="' + name + '"]'), function (spot) {
      spot.__zba = spot.__zba || {}; if (spot.__zba[name]) return; spot.__zba[name] = true;
      var fig = build(); if (!fig) return;
      if (spot.classList.contains('zb-ph')) { spot.parentNode.insertBefore(fig, spot); spot.style.display = 'none';
        var card = spot.closest('.media_card, .media_wide'); if (card) { card.style.aspectRatio = 'auto'; card.style.display = 'block'; }
        var sf = spot.closest('.story_fig'); if (sf) { sf.style.aspectRatio = 'auto'; } }
      else { var after = spot.__zbaLast || spot; after.parentNode.insertBefore(fig, after.nextSibling); spot.__zbaLast = fig; }
    });
  }

  // ---------- the problem: a machine that says it's out of service ----------
  function buildProblem() {
    var w = el('div', 'zba');
    w.innerHTML = '<div class="zba-box zba-oos"><img src="' + A + 'out-of-service.webp" alt="A Wells Fargo ATM showing Out of service" loading="lazy" width="898" height="631"><span class="tag">What customers saw</span></div>' +
      '<div class="zba-cap">One failed part, and the whole machine goes dark. From my audit photos</div>';
    return w;
  }

  // ---------- the deposit system: six moves, two styles ----------
  var COLS = [['cash', 'Cash'], ['check', 'Check'], ['mixed', 'Cash + check']], ROWS = [['insert', 'Insert'], ['remove', 'Take back']];
  function buildDeposit() {
    var w = el('div', 'zba'), box = el('div', 'zba-box zba-dep');
    box.innerHTML = '<div class="hd"><b>Every deposit move, as a loop</b></div>';
    var g = el('div', 'zba-dg'); g.appendChild(el('div', ''));
    COLS.forEach(function (c) { g.appendChild(el('div', 'ch', c[1])); });
    ROWS.forEach(function (r) {
      g.appendChild(el('div', 'rh', r[1]));
      COLS.forEach(function (c) { var k = r[0] + '-' + c[0], t = el('div', 'zba-tile'); t.setAttribute('data-k', k); g.appendChild(t); });
    });
    box.appendChild(g); w.appendChild(box);
    w.appendChild(el('div', 'zba-cap', 'Insert and take back, for cash, checks or both. The final 2025 set'));
    onView(w, function () {
      [].forEach.call(g.querySelectorAll('.zba-tile'), function (t) { var k = t.getAttribute('data-k'); t.innerHTML = vid('after-' + k + '.mp4', k.replace('-', ' ')); });
      watchVideos(g);
    }, '200px 0px');
    return w;
  }

  // ---------- storyboard to final: Zolton's pencil frames, wiped to the finished art ----------
  var STEPS = ['Held ready', 'Turned and lined up', 'Fed in as the light flashes green', 'Pulled into the slot', 'The slot settles'];
  function buildSketch() {
    var w = el('div', 'zba'), box = el('div', 'zba-box zba-sk');
    var strip = el('div', 'strip');
    STEPS.forEach(function (s, i) {
      strip.appendChild(el('div', 'st', '<div class="fr"><img class="sk" src="' + A + 'sketch-' + (i + 1) + '.webp" alt="Pencil storyboard, step ' + (i + 1) + '" loading="lazy">' +
        '<img class="fi" src="' + A + 'final-' + (i + 1) + '.webp" alt="Finished illustration, step ' + (i + 1) + '" loading="lazy"></div><div class="n"><b>0' + (i + 1) + '</b>' + s + '</div>'));
    });
    box.appendChild(strip);
    box.appendChild(el('div', 'sl', '<span>Sketch</span><input type="range" min="0" max="100" value="50" aria-label="Wipe from sketch to finished art"><span>Final</span>'));
    w.appendChild(box);
    w.appendChild(el('div', 'zba-cap', 'My pencil storyboard, then the same beats in my final 2025 animation, where the hand was dropped. Drag to compare'));
    var r = box.querySelector('input');
    function set(v) { box.style.setProperty('--cut', (100 - v) + '%'); [].forEach.call(box.querySelectorAll('.fr'), function (f) { f.style.setProperty('--cut', (100 - v) + '%'); }); }
    r.addEventListener('input', function () { set(+r.value); }); set(50);
    onView(w, function () {   // one slow pass from sketch to final, then rest in the middle
      if (reduce) return; var t0 = performance.now();
      var ease = function (x) { return (1 - Math.cos(Math.PI * x)) / 2; };
      (function tick(t) { var k = Math.min(1, (t - t0) / 3000), v = k < .55 ? 100 * ease(k / .55) : 100 - 50 * ease((k - .55) / .45);
        r.value = v; set(v); if (k < 1) requestAnimationFrame(tick); })(t0);
    });
    return w;
  }

  // ---------- the reader audit: four models, four behaviours, one drawing ----------
  var MODELS = [['Model 1', 'Four green lights on the left of the reader'], ['Model 2', 'A small round reader. Light behaviour still to be checked'],
    ['Model 3', 'An oval reader with a lit ring'], ['Model 4', 'Four green lights on the right of the reader']];
  function buildReaders() {
    var w = el('div', 'zba'); w.style.margin = '0';
    var g = el('div', 'zba-rd');
    MODELS.forEach(function (m, i) {
      g.appendChild(el('div', 'm', '<div class="ph"><img src="' + A + 'nfc' + (i + 1) + '.webp" alt="' + m[0] + ' ATM" loading="lazy">' +
        '<div class="in"><img src="' + A + 'nfc' + (i + 1) + '-reader.webp" alt="Close-up of its tap reader" loading="lazy"><img class="ill" src="' + A + 'reader-square.webp" alt="" loading="lazy"></div></div>' +
        '<div class="tx"><b>' + m[0] + '</b><span>' + m[1] + '</span></div>'));
    });
    g.appendChild(el('div', 'm gen', '<div class="ph"><img src="' + A + 'reader-square.webp" alt="Zolton\'s general reader illustration" loading="lazy"></div>' +
      '<div class="tx"><b>One drawing for all of them</b><span>The tap symbol, a row of lights and nothing model-specific, so it reads as the reader on every machine</span></div>'));
    w.appendChild(g);
    var c = el('div', 'zba-rdc', '<div class="zba-cap">From my audit board. Hover a machine, or lay the drawing over every reader</div><button type="button" class="zba-pill" aria-pressed="false">Lay the drawing over each reader</button>');
    w.appendChild(c);
    var b = c.querySelector('button');
    b.addEventListener('click', function () { var on = !g.classList.contains('over'); g.classList.toggle('over', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    return w;
  }

  // ---------- tap to pay: the Lottie with a scrubber, like a motion-draft sheet ----------
  var BEATS = [[0, 'Card', 'approaches'], [80, 'Card', 'taps'], [125, 'Lights', 'fill in'], [270, 'Phone', 'approaches'], [335, 'Phone', 'taps'], [405, 'Check', 'confirmed']];
  function loadLottie(cb) {
    if (window.lottie) return cb();
    var s = document.querySelector('script[data-zba-lottie]');
    if (!s) { s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js'; s.setAttribute('data-zba-lottie', ''); document.head.appendChild(s); }
    s.addEventListener('load', cb);
  }
  function glowFilter() {
    if (document.getElementById('zbaLedGlow')) return;
    var d = el('div', ''); d.innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><filter id="zbaLedGlow" x="-400%" y="-200%" width="900%" height="500%" color-interpolation-filters="sRGB">' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="30" result="wide"/><feComponentTransfer in="wide" result="wide2"><feFuncA type="linear" slope="4.4"/></feComponentTransfer>' +
      '<feGaussianBlur in="SourceGraphic" stdDeviation="8" result="near"/><feMerge><feMergeNode in="wide2"/><feMergeNode in="near"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs></svg>';
    document.body.appendChild(d.firstChild);
  }
  function buildTap() {
    var w = el('div', 'zba'), box = el('div', 'zba-box zba-tap');
    var PLAY = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>', PAUSE = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    box.innerHTML = '<div class="stage" role="img" aria-label="A hand taps a card on a contactless reader, the lights fill in, then a phone does the same and gets a check mark"><div class="lot"></div></div>' +
      '<div class="bar"><button type="button" class="pp" aria-label="Play">' + PLAY + '</button><input type="range" min="0" max="477" value="0" step="1" aria-label="Scrub through the animation"><span class="t zba-mono">0 ms · 0 frames</span></div>' +
      '<div class="steps">' + BEATS.map(function (b) { return '<button type="button" data-f="' + b[0] + '"><i>' + Math.round(b[0] / 60 * 1000) + ' ms</i>' + b[1] + ' ' + b[2] + '</button>'; }).join('') + '</div>';
    w.appendChild(box);
    w.appendChild(el('div', 'zba-cap', 'The final tap-to-pay animation, running live as Lottie. Scrub it, or jump to a beat'));
    var lot = box.querySelector('.lot'), r = box.querySelector('input'), t = box.querySelector('.t'), pp = box.querySelector('.pp'), steps = box.querySelectorAll('.steps button');
    var anim = null, playing = false;
    function paint(f) {
      f = Math.round(f); r.value = f; t.textContent = Math.round(f / 60 * 1000).toLocaleString() + ' ms · ' + f + ' frames';
      var cur = 0; BEATS.forEach(function (b, i) { if (f >= b[0]) cur = i; });
      [].forEach.call(steps, function (s, i) { s.classList.toggle('on', i === cur); });
    }
    function setPlaying(p) { playing = p; pp.innerHTML = p ? PAUSE : PLAY; pp.setAttribute('aria-label', p ? 'Pause' : 'Play'); }
    function start() {
      glowFilter();
      anim = lottie.loadAnimation({ container: lot, renderer: 'svg', loop: true, autoplay: false, path: LOTTIE, rendererSettings: { preserveAspectRatio: 'xMidYMid meet' } });
      anim.addEventListener('DOMLoaded', function () {
        var sv = lot.querySelector('svg'); if (sv) sv.setAttribute('viewBox', '170 70 660 412');
        if (reduce) { anim.goToAndStop(405, true); paint(405); return; }
        anim.play(); setPlaying(true);
      });
      anim.addEventListener('enterFrame', function (e) { paint(e.currentTime); });
    }
    pp.addEventListener('click', function () { if (!anim) return; if (playing) { anim.pause(); setPlaying(false); } else { anim.play(); setPlaying(true); } });
    r.addEventListener('input', function () { if (!anim) return; anim.goToAndStop(+r.value, true); setPlaying(false); paint(+r.value); });
    [].forEach.call(steps, function (s) { s.addEventListener('click', function () { if (!anim) return; var f = +s.getAttribute('data-f'); anim.goToAndStop(f, true); setPlaying(false); paint(f); }); });
    onView(w, function () { loadLottie(start); }, '300px 0px');
    return w;
  }

  // ---------- what testing showed: the animation alone vs. the animation plus one plain line ----------
  function buildTesting() {
    var w = el('div', 'zba'), g = el('div', 'zba-ts');
    g.innerHTML = '<div class="scr"><div class="glass"><div class="ins">Tap your card to continue</div><img class="anim" src="' + BASE + 'atm-tap.webp" alt="Tap-to-pay animation on an ATM screen" loading="lazy"><div class="wel">Welcome to Wells Fargo</div></div>' +
      '<div class="zba-row" role="group" aria-label="Screen version"><button type="button" class="zba-pill" data-v="0" aria-pressed="true">Animation alone</button><button type="button" class="zba-pill" data-v="1" aria-pressed="false">Add one line of text</button></div></div>' +
      '<div class="fx"><div class="f hl" data-v="0"><b>Animation alone</b><p>Read as ready for a tap, and modern. One person found the loop a little distracting on its own, and “card reader unavailable” left them unsure what to try.</p></div>' +
      '<div class="f" data-v="1"><b>Animation + one line</b><p>No guessing. The line confirms the gesture the animation shows, and helps people with low vision or color blindness without getting in anyone’s way.</p></div></div>';
    w.appendChild(g);
    w.appendChild(el('div', 'zba-cap', 'Two short feedback sessions. Toggle the screen to see both versions'));
    var glass = g.querySelector('.glass');
    function set(v) { glass.parentNode.classList.toggle('on', v === 1); glass.classList.toggle('on', v === 1);
      [].forEach.call(g.querySelectorAll('.zba-pill'), function (b) { b.setAttribute('aria-pressed', +b.getAttribute('data-v') === v ? 'true' : 'false'); });
      [].forEach.call(g.querySelectorAll('.f'), function (f) { f.classList.toggle('hl', +f.getAttribute('data-v') === v); }); }
    [].forEach.call(g.querySelectorAll('.zba-pill'), function (b) { b.addEventListener('click', function () { auto = false; set(+b.getAttribute('data-v')); }); });
    var auto = true;
    onView(w, function () { if (!reduce) setTimeout(function () { if (auto) set(1); }, 3200); });
    return w;
  }

  // the site's blue sky (the <zb-sky> element from Site settings) behind the page, as on the other case studies
  function sky() {
    if (document.querySelector('zb-sky') || !(window.customElements && customElements.get('zb-sky'))) return;
    var s = document.createElement('zb-sky'); s.setAttribute('fixed', ''); s.setAttribute('aria-hidden', 'true');
    var de = document.documentElement, dark = function () { return de.getAttribute('data-mode') === 'dark'; };
    if (dark()) s.setAttribute('night', '1');
    document.body.insertBefore(s, document.body.firstChild);
    var root = document.querySelector('.page_root'); if (root && getComputedStyle(root).position === 'static') root.style.position = 'relative';
    if (root && !root.style.zIndex) root.style.zIndex = '1';
    document.body.style.backgroundColor = 'transparent';
    new MutationObserver(function () { s.setAttribute('night', dark() ? '1' : '0'); }).observe(de, { attributes: true, attributeFilter: ['data-mode'] });
  }
  function init() {
    try { sky(); } catch (e) {}
    var st = document.createElement('style'); st.id = 'zba-css'; st.textContent = css; document.head.appendChild(st);
    mount('problem', buildProblem);
    mount('deposit', buildDeposit);
    mount('sketch', buildSketch);
    mount('readers', buildReaders);
    mount('tap', buildTap);
    mount('testing', buildTesting);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
