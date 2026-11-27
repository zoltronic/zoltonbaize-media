/* zb-splash (video) — first-visit splash for zoltonbaize.com's Work page, as a pre-rendered video.
   The splash is the same 2 seconds every time (fly over the cloud sea, the Z condenses out of vapor into glass, zoom
   through it), so it's recorded once from the original 3D version (splash/zb-splash.js, kept for reference) at
   1280x720, day and night, and played as a muted video: it looks the same in every browser and needs no three.js.
   - Plays once per browser session; skipped for reduced motion, low-power devices and slow connections (?splash forces it).
   - If the video can't start within 1.5 s of this script running, the visitor gets the page straight away.
   - Click, scroll or any key skips it.
   Also owns the cloud floor at the bottom of the page (#zb-deck): two strips baked from the same cloud engine, now plain
   images that drift with a CSS animation and rise into view over the last stretch of scrolling. */
(function () {
  'use strict';
  if (window.__zbSplash) return; window.__zbSplash = true;
  const html = document.documentElement;
  const MEDIA = window.ZB_MEDIA || 'https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@0e10c429f89287c3916d1716c121235eda8ebc2e/';
  const SEEN_KEY = 'zbSplashSeen';
  const force = /[?&]splash\b/.test(location.search);
  let seen = /(?:^|;\s*)zbSplashSeen=1/.test(document.cookie);
  try { seen = seen || sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  const markSeen = () => { try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {} document.cookie = 'zbSplashSeen=1; path=/; SameSite=Lax'; };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T0 = performance.now(), BUDGET = 1500;   // ms from this script starting to the video playing
  const lowPower = (() => {
    if (window.zbLite) return true;
    try {
      const c = navigator.connection || {};
      if (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '')) return true;
      if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
      if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return true;
    } catch (e) { return true; }
    return false;
  })();
  window.__zbSplashLowPower = lowPower;
  const wantSplash = force || (!seen && !reduce && !lowPower);
  const clearCover = () => html.classList.remove('zb-splash-pending');
  const isDark = () => {
    const m = html.getAttribute('data-mode'); if (m) return m === 'dark';
    const sky = document.querySelector('zb-sky');
    if (sky && sky.hasAttribute('night')) { const v = sky.getAttribute('night'); return v !== '0' && v !== 'false'; }
    return false;
  };
  const vsrc = base => '<source src="' + base + '-hevc.mp4" type=\'video/mp4; codecs="hvc1"\'>' +
    '<source src="' + base + '.webm" type=\'video/webm; codecs="vp9"\'>' + '<source src="' + base + '.mp4" type="video/mp4">';

  const css = document.createElement('style');
  css.textContent = [
    '#zb-splash{position:fixed;inset:0;z-index:2147483000;background:linear-gradient(180deg,#0b5cc6,#6ccaf0 55%,#e9f6fd);cursor:pointer;transition:opacity 280ms cubic-bezier(.2,.8,.2,1)}',
    '#zb-splash.night{background:linear-gradient(180deg,#030914,#16294d)}',
    '#zb-splash video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}',
    '#zb-splash-hint{position:absolute;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font:12px ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.88);text-shadow:0 1px 8px rgba(7,40,61,.5);opacity:0;transition:opacity 300ms ease-out;pointer-events:none;white-space:nowrap}',
    '#zb-splash-hint.on{opacity:1}',
    '#zb-deck{position:fixed;left:0;right:0;bottom:0;height:clamp(150px,34vh,380px);z-index:0;pointer-events:none;overflow:hidden;visibility:hidden;will-change:transform,opacity;-webkit-mask-image:linear-gradient(to top,#000 0,#000 52%,rgba(0,0,0,.6) 72%,transparent 100%);mask-image:linear-gradient(to top,#000 0,#000 52%,rgba(0,0,0,.6) 72%,transparent 100%)}',
    '#zb-deck.on{visibility:visible}',
    /* each strip is one tile wider than the screen and slides left by exactly one tile, forever (compositor only) */
    '#zb-deck i{position:absolute;left:0;bottom:0;width:calc(100% + var(--tw,1600px));background-repeat:repeat-x;background-position:0 100%;-webkit-mask-image:linear-gradient(to top,#000 55%,transparent 100%);mask-image:linear-gradient(to top,#000 55%,transparent 100%);animation:zbDeck var(--dur,200s) linear infinite;will-change:transform}',
    '@keyframes zbDeck{from{transform:translate3d(0,0,0)}to{transform:translate3d(calc(-1 * var(--tw,1600px)),0,0)}}',
    '@media (prefers-reduced-motion:reduce){#zb-deck i{animation:none}}',
    '#zb-deck:not(.on) i{animation-play-state:paused}',
    '#zb-deck .back{height:78%;bottom:16%;opacity:.8;filter:blur(.6px)}',
    '#zb-deck .front{height:72%;bottom:-6%}',
    '#zb-deck.night i{filter:brightness(.42) sepia(.55) hue-rotate(170deg) saturate(2.2);opacity:.9}',
    '#zb-deck.night .back{filter:brightness(.36) sepia(.55) hue-rotate(170deg) saturate(2) blur(.6px);opacity:.7}'
  ].join('');
  document.head.appendChild(css);

  // ---------- Cloud floor (bottom of the page) ----------
  const deck = document.createElement('div');
  deck.id = 'zb-deck'; deck.setAttribute('aria-hidden', 'true');
  deck.innerHTML = '<i class="back"></i><i class="front"></i>';
  { const sky = document.querySelector('zb-sky');           // just above the sky, below the page content
    if (sky && sky.parentNode) sky.parentNode.insertBefore(deck, sky.nextSibling); else document.body.insertBefore(deck, document.body.firstChild); }
  const strips = [{ el: deck.querySelector('.front'), src: 'deck-front', speed: 7 }, { el: deck.querySelector('.back'), src: 'deck-back', speed: 3.5 }];
  let deckLoaded = false, shown = -1, target = 0, raf = 0;
  function sizeDeck() {
    strips.forEach(s => {
      const th = s.el.clientHeight || deck.clientHeight, tw = Math.round(th * 4);   // the strips are 4:1 and tile across
      s.el.style.setProperty('--tw', tw + 'px');
      s.el.style.backgroundSize = tw + 'px ' + th + 'px';
      s.el.style.setProperty('--dur', (tw / s.speed).toFixed(1) + 's');            // px per second: the back drifts slower (depth)
    });
  }
  // The floor only appears as you reach the bottom of the page: it rises into view over the last ~70% of a screen.
  function deckTarget() {
    const vh = innerHeight, max = Math.max(0, document.documentElement.scrollHeight - vh), zone = vh * 0.7;
    const p = max < 4 ? 1 : Math.max(0, Math.min(1, (scrollY - (max - zone)) / zone));
    return 1 - Math.pow(1 - p, 3);
  }
  function deckFrame() {
    raf = 0;
    target = deckTarget();
    shown = shown < 0 ? target : shown + (target - shown) * (reduce ? 1 : 0.18);   // smooth out jumpy wheel scrolling
    if (Math.abs(target - shown) < 0.002) shown = target;
    if (shown > 0.001 && !deckLoaded) {
      deckLoaded = true;
      strips.forEach(s => { s.el.style.backgroundImage = 'url(' + MEDIA + 'splash/' + s.src + '.webp)'; });
      sizeDeck();
    }
    deck.classList.toggle('on', shown > 0.005);
    deck.classList.toggle('night', isDark());
    deck.style.opacity = shown.toFixed(3);
    deck.style.transform = 'translate3d(0,' + ((1 - shown) * 60).toFixed(1) + '%,0)';
    if (shown !== target) raf = requestAnimationFrame(deckFrame);
  }
  const deckAsk = () => { if (!raf) raf = requestAnimationFrame(deckFrame); };
  addEventListener('scroll', deckAsk, { passive: true });
  addEventListener('resize', () => { if (deckLoaded) sizeDeck(); deckAsk(); });
  addEventListener('zb-theme', deckAsk);
  deckAsk();

  // ---------- Splash ----------
  // since Nov 2026 the splash itself is code in the Work page head (window.__zbSp3); this file still owns the cloud floor
  if (!wantSplash || window.__zbSp3) { clearCover(); return; }
  const night = isDark();
  const splash = document.createElement('div');
  splash.id = 'zb-splash'; splash.setAttribute('role', 'presentation');
  if (night) splash.classList.add('night');
  const base = MEDIA + 'splash/splash-' + (night ? 'night' : 'day');
  splash.innerHTML = '<video muted playsinline preload="auto" disablepictureinpicture tabindex="-1" poster="' + base + '.webp">' + vsrc(base) + '</video>' +
    '<div id="zb-splash-hint">Click or press any key to skip</div>';
  document.body.appendChild(splash);
  const video = splash.querySelector('video'), hint = splash.querySelector('#zb-splash-hint');
  video.muted = true;
  let started = false, done = false;
  function finish() {
    if (done) return; done = true;
    markSeen(); clearCover();
    splash.remove();
    removeEventListener('keydown', skip);
  }
  function fadeOut(ms) {
    if (done || splash.style.opacity === '0') return;
    splash.style.transitionDuration = ms + 'ms';
    splash.style.opacity = '0';
    setTimeout(finish, ms + 20);
  }
  function skip() { if (!started) { finish(); return; } fadeOut(300); }
  function start() {
    if (started || done) return;
    if (!force && performance.now() - T0 > BUDGET) { finish(); return; }   // too slow to arrive: show the page instead
    started = true;
    scrollTo(0, 0);
    markSeen();   // mark it as soon as it starts, so leaving or tapping the logo mid-splash never replays it
    const p = video.play();
    if (p && p.catch) p.catch(finish);
  }
  video.addEventListener('playing', () => {
    clearCover();
    if (force) { try { history.replaceState(null, '', location.pathname + location.search.replace(/([?&])splash\b=?[^&]*&?/, '$1').replace(/[?&]$/, '') + location.hash); } catch (e) {} }
  });
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    hint.classList.toggle('on', t > 0.35 && t < 1.8);
    if (video.duration && t > video.duration - 0.05) fadeOut(220);
  });
  video.addEventListener('ended', () => fadeOut(220));
  video.addEventListener('error', finish);
  video.querySelector('source:last-of-type').addEventListener('error', finish);   // every source failed
  // a stall mid-play (connection dropped) shouldn't leave the visitor staring at a frozen frame
  let stall = 0;
  video.addEventListener('waiting', () => { if (started) stall = setTimeout(() => fadeOut(300), 900); });
  video.addEventListener('playing', () => clearTimeout(stall));
  if (video.readyState >= 3) start(); else video.addEventListener('canplaythrough', start, { once: true });
  setTimeout(() => { if (!started && !force) finish(); }, BUDGET);   // never hold the page longer than the budget
  setTimeout(() => { if (!done) fadeOut(300); }, 8000);               // belt and braces
  splash.addEventListener('pointerdown', skip);
  splash.addEventListener('wheel', skip, { passive: true });
  splash.addEventListener('touchstart', skip, { passive: true });
  addEventListener('keydown', skip);
})();
