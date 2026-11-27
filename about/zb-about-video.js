/* zb-about (video) — the About page sky as pre-rendered loops instead of a live raymarch.
   Two loops per mode, rendered offline from about/zb-about.js (kept for reference): the top of the page (small cumulus
   humilis) and the bottom (taller clouds, further along the flight). Scrolling crossfades from one to the other with a
   gentle push-in, so the sky still grows as you read down. Day and night; the night pair only downloads if needed.
   Weak devices (window.zbLite, from sky/zb-sky-video.js) and reduced motion get the stills.
   Same #zb-about-sky element (view-transition-name zb-sky), so Work -> About still pans across one sky. */
(function () {
  'use strict';
  if (window.__zbAbout) return; window.__zbAbout = true;
  const html = document.documentElement;
  const MEDIA = window.ZB_MEDIA || 'https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@bcece79874d7c27ac7f221dccf7a2aab0e35316b/';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const still = reduce || !!window.zbLite;
  const css = document.createElement('style');
  css.textContent = [
    'html.zb-about{background:#7FD0F0}',
    '#zb-about-sky{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%);view-transition-name:zb-sky}',
    'html[data-mode="dark"] #zb-about-sky{background:linear-gradient(180deg,#030814,#14223d)}',
    '#zb-about-sky .k{position:absolute;inset:0;will-change:transform,opacity}',
    '#zb-about-sky .k>*{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity 700ms cubic-bezier(.2,.8,.2,1)}',
    '#zb-about-sky .k>.on{opacity:1}',
    'html.zb-about .page_root{position:relative;z-index:1}'
  ].join('');
  document.head.appendChild(css);
  html.classList.add('zb-about');
  // nav icons: load the icon font the Work page uses, if this page doesn't already
  if (!document.querySelector('link[href*="phosphor"], script[src*="phosphor"]')) {
    ['regular', 'fill'].forEach(w => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/' + w + '/style.css'; document.head.appendChild(l); });
  }
  const wrap = document.createElement('div'); wrap.id = 'zb-about-sky'; wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<div class="k top"></div><div class="k bottom"></div>';
  document.body.insertBefore(wrap, document.body.firstChild);
  const keys = { top: wrap.querySelector('.top'), bottom: wrap.querySelector('.bottom') };
  const isNight = () => html.getAttribute('data-mode') === 'dark';
  const vsrc = base => '<source src="' + base + '-hevc.mp4" type=\'video/mp4; codecs="hvc1"\'>' +
    '<source src="' + base + '.webm" type=\'video/webm; codecs="vp9"\'>' + '<source src="' + base + '.mp4" type="video/mp4">';
  const layers = {};
  let loaded = document.readyState === 'complete', mode = '';
  function layer(key, m) {
    const id = key + '-' + m; if (layers[id]) return layers[id];
    const L = layers[id] = { key, m }, base = MEDIA + 'about/about-' + key + '-' + m;
    const img = L.img = new Image(); img.alt = ''; img.decoding = 'async';
    img.onload = () => { L.imgReady = true; paint(); };
    img.src = base + '.webp';
    keys[key].appendChild(img);
    L.start = () => {
      if (still || L.video) return;
      const v = L.video = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.setAttribute('tabindex', '-1');
      v.innerHTML = vsrc(base);
      v.addEventListener('playing', () => { L.playing = true; paint(); });
      keys[key].appendChild(v);
      frame();
    };
    if (loaded) setTimeout(L.start, 300);
    return L;
  }
  function paint() {
    for (const id in layers) {
      const L = layers[id], cur = L.m === mode;
      L.img.classList.toggle('on', cur && !!L.imgReady);
      if (L.video) L.video.classList.toggle('on', cur && !!L.playing);
    }
  }
  function setMode() {
    const m = isNight() ? 'night' : 'day'; if (m === mode) return;
    mode = m; layer('top', m); layer('bottom', m); paint(); frame();
  }
  // scroll: 0 at the top of the page, 1 at the bottom; eased so the sky glides behind the text
  const progress = () => { const max = html.scrollHeight - innerHeight; return max > 4 ? Math.max(0, Math.min(1, scrollY / max)) : 0; };
  let sp = progress(), raf = 0;
  function frame() {
    raf = 0;
    const p = progress();
    sp += (p - sp) * (reduce ? 1 : 0.12);
    if (Math.abs(p - sp) < 0.001) sp = p;
    const x = sp * sp * (3 - 2 * sp);
    keys.top.style.opacity = '1';
    keys.top.style.transform = 'translate3d(0,' + (-x * 4).toFixed(2) + 'vh,0) scale(' + (1 + x * 0.08).toFixed(4) + ')';
    keys.bottom.style.opacity = x.toFixed(3);
    keys.bottom.style.transform = 'translate3d(0,' + ((1 - x) * 3).toFixed(2) + 'vh,0) scale(' + (1.06 - x * 0.06).toFixed(4) + ')';
    // one loop at a time (Chrome drops the page to ~25 fps while two videos play): the one that dominates plays, the other holds a frame
    for (const id in layers) {
      const L = layers[id], v = L.video; if (!v) continue;
      const vis = L.m === mode && !document.hidden && (L.key === 'top' ? x < 0.5 : x >= 0.5);
      if (vis) { if (v.paused) { const pr = v.play(); if (pr && pr.catch) pr.catch(() => {}); } }
      else if (!v.paused) v.pause();
    }
    if (sp !== p) raf = requestAnimationFrame(frame);
  }
  const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  addEventListener('zb-theme', setMode);
  new MutationObserver(setMode).observe(html, { attributes: true, attributeFilter: ['data-mode'] });
  document.addEventListener('visibilitychange', ask);
  addEventListener('load', () => { loaded = true; for (const id in layers) setTimeout(layers[id].start, 300); });
  setMode();
})();
