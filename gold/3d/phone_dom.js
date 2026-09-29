/* Phone mockup, HTML version: a CSS iPhone 16 Pro frame around a native <video>. No WebGL, no imports,
   so it runs on any phone even when three.js can't. Used on narrow screens (and as the desktop fallback).
   On phones it takes over: as the mockup scrolls in, the phone scales up until its screen fills the viewport,
   the video plays once, a Replay button appears when it finishes, and as you keep scrolling the phone scales
   back down into the mockup and scrolls away.
   Markup (same as the WebGL version): <div class="phone_mock" data-webm data-mp4 data-poster data-label></div> */
(function () {
  var MOBILE = matchMedia('(max-width: 767px)').matches;
  // proportions from the real device: screen 66.9 x 145.4 mm, 2.3 mm bezel, 9.15 mm display corner
  var BEZEL = 2.3 / 145.4, RADIUS = 9.15 / 66.9;
  var css = [
    '.phone_mock.is-dom{height:auto;min-height:0}',
    '.phone_mock.is-dom.is-takeover{height:250svh;height:250vh}',
    '.pm-sticky{position:relative;display:flex;align-items:center;justify-content:center;padding:24px 0}',
    '.is-takeover .pm-sticky{position:sticky;top:0;height:100svh;height:100vh;padding:0;overflow:visible}',
    '.pm-phone{position:relative;background:#050505;will-change:transform;transform-origin:50% 50%;box-shadow:0 0 0 1.5px #8e8983,0 0 0 2.5px #5d5955,0 30px 60px -30px rgba(0,0,0,.45)}',
    '.pm-phone video{position:absolute;display:block;object-fit:cover;background:#fff}',
    '.pm-island{position:absolute;left:50%;transform:translateX(-50%);background:#050505;border-radius:999px;z-index:2}',
    '.pm-replay{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 28px);transform:translateX(-50%);z-index:3;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:999px;border:1px solid rgba(255,255,255,.7);background:rgba(20,17,15,.55);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);color:#fff;font:500 14px/1 "Schibsted Grotesk",-apple-system,sans-serif;cursor:pointer;transition:opacity .25s}',
    '.pm-replay[hidden]{display:none}',
    '.phone_mock.is-dom:not(.is-takeover) .pm-replay{position:relative;left:auto;bottom:auto;transform:none;margin-top:18px;border-color:currentColor;background:transparent;color:inherit;-webkit-backdrop-filter:none;backdrop-filter:none}',
    '.phone_mock.is-dom:not(.is-takeover) .pm-sticky{flex-direction:column}'
  ].join('');
  var styled = false;
  function style() { if (styled) return; styled = true; var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); }
  var ICON = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ease = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  function build(el, opts) {
    opts = opts || {}; style();
    if (el.classList.contains('is-dom')) return;
    el.classList.add('is-dom', 'is-live'); el.innerHTML = '';
    var takeover = !!opts.takeover, once = takeover || 'once' in el.dataset;
    if (takeover) el.classList.add('is-takeover');
    var sticky = document.createElement('div'); sticky.className = 'pm-sticky';
    var phone = document.createElement('div'); phone.className = 'pm-phone';
    var video = document.createElement('video');
    // attributes, not just properties: iOS only autoplays inline when muted/playsinline are present as attributes
    video.setAttribute('muted', ''); video.muted = true; video.setAttribute('playsinline', ''); video.setAttribute('webkit-playsinline', ''); video.playsInline = true;
    video.setAttribute('preload', 'auto'); if (!once) { video.setAttribute('loop', ''); video.setAttribute('autoplay', ''); }
    if (el.dataset.poster) video.setAttribute('poster', el.dataset.poster);
    video.setAttribute('aria-label', el.dataset.label || 'Phone screen recording');
    // mp4 first: every iOS version plays H.264; webm is the fallback
    [['mp4', 'video/mp4'], ['webm', 'video/webm']].forEach(function (p) { if (el.dataset[p[0]]) { var s = document.createElement('source'); s.src = el.dataset[p[0]]; s.type = p[1]; video.appendChild(s); } });
    var island = document.createElement('div'); island.className = 'pm-island';
    phone.appendChild(video); phone.appendChild(island); sticky.appendChild(phone);
    var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pm-replay'; btn.hidden = true; btn.innerHTML = ICON + '<span>Replay</span>';
    sticky.appendChild(btn); el.appendChild(sticky);

    var ratio = 0.4615, Ws = 0, Hs = 0, played = false, full = 1;
    function layout() {
      var vh = innerHeight, vw = document.documentElement.clientWidth || innerWidth;
      Hs = Math.min(vh * (takeover ? 0.74 : 0.8), 720); Ws = Hs * ratio;
      if (Ws > vw * 0.78) { Ws = vw * 0.78; Hs = Ws / ratio; }
      var b = Hs * BEZEL, rs = Ws * RADIUS;
      phone.style.width = (Ws + 2 * b) + 'px'; phone.style.height = (Hs + 2 * b) + 'px'; phone.style.borderRadius = (rs + b) + 'px';
      video.style.left = b + 'px'; video.style.top = b + 'px'; video.style.width = Ws + 'px'; video.style.height = Hs + 'px'; video.style.borderRadius = rs + 'px';
      island.style.width = (Ws * 0.27) + 'px'; island.style.height = (Hs * 0.035) + 'px'; island.style.top = (b + Hs * 0.016) + 'px';
      // scale at which the screen covers the whole viewport (a touch over, so the bezel clears the edges)
      full = Math.max(vw / Ws, vh / Hs) * 1.03;
      tick();
    }
    function start() { btn.hidden = true; try { video.currentTime = 0; } catch (e) {} var p = video.play(); if (p && p.catch) p.catch(function () { btn.hidden = false; }); }
    video.addEventListener('ended', function () { btn.hidden = false; });
    btn.addEventListener('click', start);
    video.addEventListener('loadedmetadata', function () { if (video.videoWidth && video.videoHeight) { ratio = video.videoWidth / video.videoHeight; layout(); } });

    // scroll phases over the tall track: 0-.22 scale up, .22-.72 full screen (plays once), .72-1 scale back down
    var raf = 0;
    function progress() { var r = el.getBoundingClientRect(), vh = innerHeight; return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - vh))); }
    function tick() {
      raf = 0; if (!takeover) return;
      var p = progress(), k;
      if (p < 0.22) k = ease(p / 0.22); else if (p <= 0.72) k = 1; else k = 1 - ease((p - 0.72) / 0.28);
      var s = 1 + (full - 1) * k;
      phone.style.transform = 'scale(' + s.toFixed(4) + ')';
      var inFull = p >= 0.2 && p <= 0.74;
      if (inFull && !played) { played = true; start(); }
      btn.style.opacity = inFull ? '1' : '0'; btn.style.pointerEvents = inFull ? 'auto' : 'none';
    }
    function kick() { if (!raf) raf = requestAnimationFrame(tick); }
    if (takeover) { addEventListener('scroll', kick, { passive: true }); }
    else if (once) {
      new IntersectionObserver(function (es) { if (!played && es[0].intersectionRatio >= 0.6) { played = true; start(); } }, { threshold: [0, 0.6] }).observe(el);
    } else { var pp = video.play(); if (pp && pp.catch) pp.catch(function () {}); }
    addEventListener('resize', layout);
    layout();
  }

  window.__phoneDom = { build: build };
  if (MOBILE) {
    var run = function () { document.querySelectorAll('.phone_mock').forEach(function (el) { build(el, { takeover: true }); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
  }
})();
