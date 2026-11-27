/* zb-sky (video) — the site's sky as a pre-rendered loop instead of a live WebGL shader.
   Same <zb-sky> element and attributes as the shader version in Site settings (fixed, night, height), so every page,
   the password page and Zoltbot keep working; this file only has to load first (Site settings > Head), and the old
   definition in the footer then steps aside (it only defines zb-sky when nothing has yet).
   - Paints a gradient at once, then a still of the sky (poster), then fades the looping video in once it can play.
   - Day and night are separate loops; the other one only downloads when the visitor switches mode.
   - Portrait screens (phones) get a portrait render of the same sky.
   - Low-power visitors (data saver, slow connection, 2 GB memory or 2 cores) and reduced motion get the still only.
   - Glass panels ([data-zb-glass]) get CSS frosted glass, which blurs the video behind them.
   - Only one background loop plays at a time (see hold() below).
   The loops are rendered offline from the original shader (same colours, sun, stars and drifting cloud rows).
   Sets window.zbLite and <html class="zb-lite"> for the other scripts (cloud sea, splash, coin, Zoltbot). */
(function () {
  'use strict';
  var de = document.documentElement;
  var MEDIA = window.ZB_MEDIA || 'https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@0e10c429f89287c3916d1716c121235eda8ebc2e/';
  window.ZB_MEDIA = MEDIA;
  function mq(q) { try { return matchMedia(q).matches; } catch (e) { return false; } }

  // ---- device tier: who gets moving video at all ----
  var lite = window.zbLite;
  if (lite == null) {
    lite = false;
    try {
      var n = navigator, c = n.connection || {};
      if (/[?&]lite\b/.test(location.search)) lite = true;
      else if (c.saveData || /(^|-)(2g|3g)$/.test(c.effectiveType || '')) lite = true;
      else if (n.deviceMemory && n.deviceMemory <= 2) lite = true;
      else if (n.hardwareConcurrency && n.hardwareConcurrency <= 2) lite = true;
    } catch (e) {}
    window.zbLite = lite;
  }
  if (lite) de.classList.add('zb-lite');
  var still = lite || mq('(prefers-reduced-motion: reduce)');

  if (!window.customElements || customElements.get('zb-sky')) return;

  // video sources for one loop: HEVC (Safari, Chrome on Mac), VP9 (Chrome, Firefox, Edge), H.264 (anything else)
  function sources(base) {
    return '<source src="' + base + '-hevc.mp4" type=\'video/mp4; codecs="hvc1"\'>' +
      '<source src="' + base + '.webm" type=\'video/webm; codecs="vp9"\'>' +
      '<source src="' + base + '.mp4" type="video/mp4">';
  }
  var GRAD = {
    day: 'linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%)',
    night: 'linear-gradient(178deg,#040D1C 0%,#0B2340 44%,#13375C 76%,#1E4E72 100%)'
  };
  var css = document.createElement('style');
  css.textContent = [
    'zb-sky{display:block}',
    'zb-sky>.zbsv{position:absolute;inset:0;overflow:hidden;z-index:0;pointer-events:none}',
    'zb-sky>.zbsv>*{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border:0;opacity:0;transition:opacity 420ms cubic-bezier(.65,0,.35,1)}',
    'zb-sky>.zbsv>.g{opacity:1}',
    'zb-sky>.zbsv>.on{opacity:1}',
    /* glass panels: CSS frosted glass over the sky (phones keep zb-mobile's own glass, which wins on specificity) */
    ':where(.zb-has-sky) [data-zb-glass]{background:rgba(255,255,255,.5)!important;border:1px solid rgba(255,255,255,.88)!important;' +
      '-webkit-backdrop-filter:blur(18px) saturate(160%)!important;backdrop-filter:blur(18px) saturate(160%)!important;' +
      'box-shadow:0 18px 44px -20px rgba(4,34,58,.45),inset 0 1.5px 0 rgba(255,255,255,.95)!important}',
    ':where(.zb-has-sky[data-mode="dark"],.zb-has-sky.zb-night) [data-zb-glass]{background:rgba(148,196,232,.16)!important;border:1px solid rgba(180,220,248,.3)!important;' +
      'box-shadow:0 18px 44px -20px rgba(0,0,0,.7),inset 0 1.5px 0 rgba(215,238,255,.32)!important}',
    /* weak devices: a translucent panel without the live blur (a blur over a moving video costs a redraw every frame) */
    ':where(.zb-has-sky.zb-lite) [data-zb-glass]{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:rgba(255,255,255,.78)!important}',
    ':where(.zb-has-sky.zb-lite[data-mode="dark"]) [data-zb-glass]{background:rgba(16,40,64,.86)!important}'
  ].join('');
  (document.head || de).appendChild(css);

  function radii(root) {
    var els = root.querySelectorAll('[data-zb-glass][data-zb-radius]');
    for (var i = 0; i < els.length; i++) els[i].style.borderRadius = els[i].getAttribute('data-zb-radius') + 'px';
  }

  class Sky extends HTMLElement { static get observedAttributes() { return ['night', 'height']; } }

  Sky.prototype.connectedCallback = function () {
    if (this._on) return; this._on = true;
    de.classList.add('zb-has-sky');
    var fixed = this.hasAttribute('fixed');
    if (fixed) this.style.cssText += ';position:fixed;left:0;top:0;width:100%;height:100vh;height:100lvh;z-index:0;pointer-events:none;display:block;overflow:hidden;';
    else {
      if (getComputedStyle(this).position === 'static') this.style.position = 'relative';
      this.style.display = 'block'; this.style.overflow = this.style.overflow || 'hidden';
      if (this.hasAttribute('height')) this.style.height = this.getAttribute('height');
      for (var i = 0; i < this.children.length; i++) {
        var ch = this.children[i];
        if (getComputedStyle(ch).position === 'static') ch.style.position = 'relative';
        ch.style.zIndex = ch.style.zIndex || '1';
      }
    }
    var box = this._box = document.createElement('div');
    box.className = 'zbsv'; box.setAttribute('aria-hidden', 'true');
    this.insertBefore(box, this.firstChild);
    this._g = document.createElement('div'); this._g.className = 'g'; box.appendChild(this._g);
    this._layers = {};
    var r = this.getBoundingClientRect(), w = r.width || innerWidth, h = r.height || innerHeight;
    this._shape = (w / Math.max(h, 1)) < 0.8 ? 'skyp' : 'sky';     // portrait render for phones
    this._night = this._isNight();
    this._show();
    radii(fixed ? document : this);
    var self = this;
    if (!Sky._mo) {   // glass panels added later (Zoltbot's chat, password card) still get their corner radius
      var q = 0;
      Sky._mo = new MutationObserver(function () { if (!q) q = requestAnimationFrame(function () { q = 0; radii(document); }); });
      var watch = function () { Sky._mo.observe(document.body, { childList: true, subtree: true }); };
      document.body ? watch() : document.addEventListener('DOMContentLoaded', watch);
    }
    document.addEventListener('visibilitychange', this._vis = function () { self._play(); });
  };
  Sky.prototype.disconnectedCallback = function () {
    this._on = false;
    if (this._vis) document.removeEventListener('visibilitychange', this._vis);
    for (var k in this._layers) { var v = this._layers[k].video; if (v) v.pause(); }
  };
  Sky.prototype.attributeChangedCallback = function (name, a, b) {
    if (name === 'height' && this._on && b) this.style.height = b;
    if (name === 'night' && this._on) { var nn = this._isNight(); if (nn !== this._night) { this._night = nn; this._show(); } }
  };
  Object.defineProperty(Sky.prototype, 'night', {
    get: function () { return !!this._night; },
    set: function (v) { this.setAttribute('night', v ? '1' : '0'); }
  });
  Sky.prototype._isNight = function () {
    if (this.hasAttribute('night')) { var v = this.getAttribute('night'); return v !== '0' && v !== 'false'; }
    return de.getAttribute('data-mode') === 'dark';
  };
  // one mode's still + video, created the first time that mode is shown
  Sky.prototype._layer = function (mode) {
    if (this._layers[mode]) return this._layers[mode];
    var self = this, base = MEDIA + 'sky/' + this._shape + '-' + mode, L = { mode: mode };
    var img = L.img = new Image(); img.alt = ''; img.decoding = 'async';
    img.onload = function () { L.imgReady = true; self._paint(); };
    img.src = base + '.webp';
    this._box.appendChild(img);
    if (!still) {
      var start = function () {
        if (L.video || !self._on) return;
        var v = L.video = document.createElement('video');
        v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
        v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('disablepictureinpicture', ''); v.setAttribute('tabindex', '-1');
        v.innerHTML = sources(base);
        v.addEventListener('playing', function () { L.playing = true; self._paint(); });
        self._box.appendChild(v);
        self._play();
      };
      // the video waits until the page itself has loaded, so it never competes with the content for bandwidth
      if (document.readyState === 'complete') setTimeout(start, 300);
      else addEventListener('load', function () { setTimeout(start, 300); });
      L.start = start;
    }
    return (this._layers[mode] = L);
  };
  Sky.prototype._show = function () {
    var mode = this._night ? 'night' : 'day';
    this._g.style.background = GRAD[mode];
    var L = this._layer(mode);
    if (L.start && document.readyState === 'complete') L.start();
    this._paint(); this._play();
  };
  Sky.prototype._paint = function () {
    var mode = this._night ? 'night' : 'day';
    for (var k in this._layers) {
      var L = this._layers[k], cur = k === mode;
      L.img.classList.toggle('on', cur && !!L.imgReady);
      if (L.video) L.video.classList.toggle('on', cur && !!L.playing);
    }
  };
  Sky.prototype._play = function () {
    var mode = this._night ? 'night' : 'day';
    for (var k in this._layers) {
      var v = this._layers[k].video; if (!v) continue;
      if (k === mode && !document.hidden && this._on && !this._held) { if (v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
      else if (!v.paused) v.pause();
    }
  };
  // hold(true) pauses the loop on its current frame (the still stays). Chrome on a Mac drops the whole page to ~25 fps
  // while two videos play at once, so the Work page's cloud sea holds the sky while the sea is the one on screen.
  Sky.prototype.hold = function (on) { on = !!on; if (on !== !!this._held) { this._held = on; this._play(); } };
  customElements.define('zb-sky', Sky);
})();
