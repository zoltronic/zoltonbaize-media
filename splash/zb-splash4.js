/* zb-splash4 — the Work page splash, part 2 (Nov 2026). Part 1 is inline in the page head (splash/zb-splash-head.html):
   it decides whether to show the splash, paints the out-of-focus sky and the loading bar with the first byte, tracks the
   load, and clears the haze into the page (window.zbSp). This file adds the moment itself, all in 2D/CSS so it stays smooth:
     1. clouds gather: real cloud sprites (cut from the About sky renders, day and night) swirl in from the edges and pile
        up into the Z;
     2. they condense into the Z's shape;
     3. the Z turns to glass: a lens that refracts what's behind it, built like the nav bar's liquid glass (an SVG
        displacement map drawn from the Z's own shape, one pass per colour channel for a little dispersion);
     4. once the page is ready, the camera pushes through the Z and the haze clears.
   Chrome gets the refraction; Safari and Firefox get frosted glass (they can't use an SVG filter as a backdrop filter). */
(function () {
  'use strict';
  var sp = window.zbSp; if (!sp || sp.started || sp.out) return; sp.started = 1; sp.hold = 1;
  var d = document, html = d.documentElement, el = sp.el;
  var dark = html.getAttribute('data-mode') === 'dark' || html.classList.contains('zb-night');
  var BASE = (d.currentScript && d.currentScript.src.replace(/[^/]*$/, '')) || '';
  // sprite rects in the cloud sheets (x, y, w, h); both sheets share the layout
  var SPR = [[174,194,300,101],[0,0,300,192],[141,300,300,72],[443,300,128,66],[302,0,300,142],[476,194,300,80],[778,194,145,76],[604,0,300,134],[0,300,139,75],[0,194,172,104]];
  var W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 1.5), S = 0, CX = 0, CY = 0;
  var A = [[9, 11], [98, 11], [65, 55]], B = [[2, 89], [91, 89], [35, 46]];
  var PATH = 'M53.5 11H93.5Q98 11 95.3 14.6L67.7 51.4Q65 55 61.46 52.22L12.54 13.78Q9 11 13.5 11ZM46.5 89H86.5Q91 89 87.43 86.26L38.57 48.74Q35 46 32.26 49.57L4.74 85.43Q2 89 6.5 89Z';
  var rnd = (function (s) { return function () { s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(20261126);
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  var sm = function (x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  var eo = function (x) { x = clamp(x, 0, 1); return 1 - Math.pow(1 - x, 3); };
  var ei = function (x) { x = clamp(x, 0, 1); return x * x * x; };

  // ---------- layers ----------
  var cv = d.createElement('canvas'); cv.className = 'zb-sp-cv'; el.insertBefore(cv, el.firstChild.nextSibling);
  var ctx = cv.getContext('2d');
  var zc = d.createElement('canvas'), zx = zc.getContext('2d');      // the cloud Z: puffs masked by the Z
  var css = d.createElement('style');
  css.textContent = [
    '#zb-sp .zb-sp-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}',
    '#zb-sp .zg{position:absolute;left:50%;top:44%;pointer-events:none;will-change:transform,opacity;opacity:0}',
    '#zb-sp .zg .lens{position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.16),rgba(255,255,255,.03) 55%,rgba(255,255,255,.1))}',
    'html[data-mode=dark] #zb-sp .zg .lens{background:linear-gradient(160deg,rgba(190,215,255,.12),rgba(150,190,240,.02) 55%,rgba(170,200,255,.08))}',
    '#zb-sp .zg svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '#zb-sp .zg .e{fill:none;stroke:rgba(255,255,255,.95);stroke-width:1.4;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-dasharray:1 1;stroke-dashoffset:1}',
    '#zb-sp .zg .rim{fill:none;stroke:rgba(255,255,255,.34);stroke-width:5;stroke-linejoin:round}',
    '#zb-sp .zg .dp{fill:none;stroke:rgba(10,56,120,.22);stroke-width:1.4;stroke-linejoin:round;vector-effect:non-scaling-stroke;transform:translateY(1.2px)}',
    'html[data-mode=dark] #zb-sp .zg .dp{stroke:rgba(0,0,0,.45)}',
    'html[data-mode=dark] #zb-sp .zg .rim{stroke:rgba(200,225,255,.22)}',
    '#zb-sp .zg.on .e{animation:zbSpT .55s cubic-bezier(.65,0,.35,1) forwards}',
    '#zb-sp .zg.on .e+.e{animation-delay:.07s}',
    '#zb-sp .zg .s{opacity:0}',
    '#zb-sp .zg.on .s{animation:zbSpS4 1.1s cubic-bezier(.45,0,.25,1) .25s both}',
    '@keyframes zbSpS4{0%{opacity:0;transform:translateX(-60px) skewX(-18deg)}15%{opacity:1}100%{opacity:1;transform:translateX(140px) skewX(-18deg)}}'
  ].join('\n');
  d.head.appendChild(css);

  var zg = d.createElement('div'); zg.className = 'zg';
  zg.innerHTML = '<div class="lens"></div><svg viewBox="0 0 100 100"><defs><clipPath id="zbsp4-c"><path d="' + PATH + '"/></clipPath>' +
    '<linearGradient id="zbsp4-s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g clip-path="url(#zbsp4-c)"><path class="rim" d="' + PATH + '"/><rect class="s" x="-6" y="-12" width="16" height="124" fill="url(#zbsp4-s)"/></g>' +
    '<path class="dp" d="' + PATH + '"/><path class="e" pathLength="1" d="M53.5 11H93.5Q98 11 95.3 14.6L67.7 51.4Q65 55 61.46 52.22L12.54 13.78Q9 11 13.5 11Z"/>' +
    '<path class="e" pathLength="1" d="M46.5 89H86.5Q91 89 87.43 86.26L38.57 48.74Q35 46 32.26 49.57L4.74 85.43Q2 89 6.5 89Z"/></svg>';
  el.insertBefore(zg, cv.nextSibling);
  var lens = zg.firstChild;

  // ---------- the lens: refraction like the nav bar's liquid glass ----------
  var canRefract = window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'url(#zb) blur(1px)') && /Chrome\//.test(navigator.userAgent);
  function sdTri(px, py, t) {   // signed distance to a triangle (Inigo Quilez), in Z units
    var p0 = t[0], p1 = t[1], p2 = t[2];
    var e0x = p1[0] - p0[0], e0y = p1[1] - p0[1], e1x = p2[0] - p1[0], e1y = p2[1] - p1[1], e2x = p0[0] - p2[0], e2y = p0[1] - p2[1];
    var v0x = px - p0[0], v0y = py - p0[1], v1x = px - p1[0], v1y = py - p1[1], v2x = px - p2[0], v2y = py - p2[1];
    var k0 = clamp((v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y), 0, 1), k1 = clamp((v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y), 0, 1), k2 = clamp((v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y), 0, 1);
    var q0x = v0x - e0x * k0, q0y = v0y - e0y * k0, q1x = v1x - e1x * k1, q1y = v1y - e1y * k1, q2x = v2x - e2x * k2, q2y = v2y - e2y * k2;
    var s = Math.sign(e0x * e2y - e0y * e2x);
    var dx = Math.min(q0x * q0x + q0y * q0y, q1x * q1x + q1y * q1y, q2x * q2x + q2y * q2y);
    var sy = Math.min(s * (v0x * e0y - v0y * e0x), s * (v1x * e1y - v1y * e1x), s * (v2x * e2y - v2y * e2x));
    return -Math.sqrt(dx) * Math.sign(sy);
  }
  var sdZ = function (x, y) { return Math.min(sdTri(x, y, A), sdTri(x, y, B)) + 1.2; };
  function buildLens() {
    var clip = 'path("' + PATH.replace(/-?\d+(\.\d+)?/g, function (n) { return (parseFloat(n) * S / 100).toFixed(2); }) + '")';
    lens.style.clipPath = clip; lens.style.webkitClipPath = clip;
    if (!canRefract) { lens.style.backdropFilter = lens.style.webkitBackdropFilter = 'blur(9px) saturate(160%) brightness(1.06)'; return; }
    var m = Math.max(16, Math.round(S * 0.5)), c = d.createElement('canvas'); c.width = c.height = m;
    var g = c.getContext('2d'), im = g.createImageData(m, m), px = im.data, bw = 10, u = 100 / m;
    for (var j = 0; j < m; j++) for (var i = 0; i < m; i++) {
      var x = (i + 0.5) * u, y = (j + 0.5) * u, dd = sdZ(x, y), k = (j * m + i) * 4, r = 128, gg = 128;
      if (dd < 0) {
        var nx = sdZ(x + 0.6, y) - sdZ(x - 0.6, y), ny = sdZ(x, y + 0.6) - sdZ(x, y - 0.6), nl = Math.hypot(nx, ny) || 1;
        var bev = Math.pow(1 - clamp(-dd / bw, 0, 1), 2.2);
        r = 128 + nx / nl * bev * 127; gg = 128 + ny / nl * bev * 127;
      }
      px[k] = r; px[k + 1] = gg; px[k + 2] = 128; px[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    var sc = Math.round(S * 0.2), f = '<filter xmlns="http://www.w3.org/2000/svg" id="zbSpLq" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" href="' + c.toDataURL() + '"/>';
    [['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', -sc], ['0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', -Math.round(sc * 1.15)], ['0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', -Math.round(sc * 1.3)]].forEach(function (t, n) {
      f += '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + t[1] + '" xChannelSelector="R" yChannelSelector="G" result="d' + n + '"/><feColorMatrix in="d' + n + '" type="matrix" values="' + t[0] + '" result="c' + n + '"/>';
    });
    f += '<feBlend in="c0" in2="c1" mode="screen" result="rg"/><feBlend in="rg" in2="c2" mode="screen"/></filter>';
    var svg = d.getElementById('zbsp4-defs');
    if (!svg) { svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'zbsp4-defs'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.cssText = 'position:absolute;width:0;height:0'; el.appendChild(svg); }
    svg.innerHTML = f;
    lens.style.backdropFilter = 'url(#zbSpLq) blur(.8px) saturate(165%) brightness(1.06)';
    lens.style.webkitBackdropFilter = 'blur(9px) saturate(160%) brightness(1.06)';
  }

  // ---------- puffs ----------
  var img = new Image(), sheet = null, puffs = [], amb = [], cloudZ = null;
  img.decoding = 'async'; img.src = sp.sheet;
  function inZ(x, y) { return sdTri(x, y, A) < -2.5 || sdTri(x, y, B) < -2.5; }
  function build() {
    puffs = []; amb = [];
    var N = 44, tries = 0, pts = [];
    while (pts.length < N && tries++ < 4000) {   // targets spread over the Z, kept apart a little
      var x = 2 + rnd() * 96, y = 9 + rnd() * 82; if (!inZ(x, y)) continue;
      var ok = true; for (var q = 0; q < pts.length; q++) { var dx = pts[q][0] - x, dy = pts[q][1] - y; if (dx * dx + dy * dy < 46) { ok = false; break; } }
      if (ok) pts.push([x, y]);
    }
    pts.forEach(function (p, i) {
      var s = SPR[Math.floor(rnd() * SPR.length)] || [0, 0, 1, 1];
      var ang = rnd() * Math.PI * 2, far = 0.55 + rnd() * 0.45;
      puffs.push({ tx: p[0], ty: p[1], s: s, ang: ang, far: far, s0: 2.0 + rnd() * 1.4, w: 42 + rnd() * 18, rot: (rnd() - 0.5) * 0.35, flip: rnd() < 0.5 ? -1 : 1,
        swirl: (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.6), delay: rnd() * 0.25, dur: 0.85 + rnd() * 0.25, ph: rnd() * 6.28, a: 0.88 + rnd() * 0.12 });
    });
    puffs.sort(function (a, b) { return a.s0 - b.s0; });
    for (var k = 0; k < 7; k++) {   // big soft clouds drifting slowly behind everything (they show through the glass)
      var s2 = SPR[Math.floor(rnd() * SPR.length)] || [0, 0, 1, 1];
      var side = k % 2 ? 0.72 + rnd() * 0.3 : -0.02 - rnd() * 0.0 + rnd() * 0.3;   // left or right third, never across the Z
      amb.push({ s: s2, x: side, y: 0.48 + rnd() * 0.46, w: 0.13 + rnd() * 0.11, v: (k % 2 ? 1 : -1) * (0.006 + rnd() * 0.01), a: (dark ? 0.55 : 0.45) + rnd() * 0.2, flip: rnd() < 0.5 ? -1 : 1 });
    }
  }
  function sizeAll() {
    W = el.clientWidth; H = el.clientHeight;
    S = Math.round(Math.min(Math.max(180, Math.min(W * 0.22, H * 0.34)), 320));
    CX = W / 2; CY = H * 0.44;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    zc.width = cv.width; zc.height = cv.height;
    zg.style.width = zg.style.height = S + 'px'; zg.style.margin = (-S / 2) + 'px 0 0 ' + (-S / 2) + 'px';
    buildLens();
  }
  // where a puff is at time t (s since start), in css px
  function puffAt(p, t) {
    var k = eo((t - p.delay) / p.dur);
    var tx = CX + (p.tx - 50) / 100 * S, ty = CY + (p.ty - 50) / 100 * S;
    var R = Math.max(W, H) * p.far * (1 - k);
    var a = p.ang + p.swirl * (1 - k) * 1.6;
    var x = tx + Math.cos(a) * R, y = ty + Math.sin(a) * R * 0.75;
    x += Math.sin(t * 0.9 + p.ph) * S * 0.006; y += Math.cos(t * 0.7 + p.ph) * S * 0.006;
    return { x: x, y: y, sc: p.s0 + (1 - p.s0) * k, al: clamp((t - p.delay) / 0.25, 0, 1) * p.a };
  }
  function drawPuff(c, s, x, y, wpx, al, flip, rot) {
    if (!sheet || al <= 0.002) return;
    var sw = s[2], sh = s[3], h = wpx * sh / sw;
    c.globalAlpha = al; c.save(); c.translate(x * DPR, y * DPR); if (rot) c.rotate(rot); c.scale(flip, 1);
    c.drawImage(sheet, s[0], s[1], sw, sh, -wpx * DPR / 2, -h * DPR / 2, wpx * DPR, h * DPR); c.restore();
  }
  function zPath(c, blur) {
    c.save(); c.translate((CX - S / 2) * DPR, (CY - S / 2) * DPR); c.scale(S / 100 * DPR, S / 100 * DPR);
    if (blur > 0.3 && 'filter' in c) c.filter = 'blur(' + (blur * 100 / S).toFixed(2) + 'px)';
    c.fill(new Path2D(PATH)); c.restore(); c.filter = 'none';
  }

  // ---------- timeline ----------
  var T0 = 0, raf = 0, phase = 0, push = 0, done = 0, glassAt = 1.1, holdUntil = 1.75;
  function frame(now) {
    if (done) return;
    var t = (now - T0) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
    // background clouds drift
    for (var i = 0; i < amb.length; i++) {
      var b = amb[i], bx = b.x + b.v * t;
      var bo = push ? 1 - ei((now - push) / 600) : 1;
      drawPuff(ctx, b.s, bx * W, b.y * H, b.w * W * (push ? 1 + ei((now - push) / 700) * 1.5 : 1), b.a * clamp(t / 0.6, 0, 1) * bo, b.flip, 0);
    }
    var cond = sm((t - 0.75) / 0.45);              // 0 free puffs ... 1 a Z of cloud
    var glass = sm((t - glassAt) / 0.4);         // the cloud Z gives way to glass
    if (!push) {
      if (cond < 1 || !cloudZ) {
        if (cond < 1) for (var j = 0; j < puffs.length; j++) { var p = puffs[j], q = puffAt(p, t); if (q.al > 0) drawPuff(ctx, p.s, q.x, q.y, p.w / 100 * S * q.sc, q.al * (1 - cond), p.flip, p.rot * (1 - eo((t - p.delay) / p.dur))); }
        if (cond > 0) {
          zx.setTransform(1, 0, 0, 1, 0, 0); zx.clearRect(0, 0, zc.width, zc.height); zx.globalCompositeOperation = 'source-over';
          for (var n = 0; n < puffs.length; n++) { var pp = puffs[n], qq = puffAt(pp, t); drawPuff(zx, pp.s, qq.x, qq.y, pp.w / 100 * S * qq.sc, qq.al, pp.flip, 0); }
          zx.globalAlpha = 1; zx.globalCompositeOperation = 'destination-in'; zPath(zx, (1 - cond) * S * 0.09 + 1.2); zx.globalCompositeOperation = 'source-over';
          if (cond >= 1) cloudZ = true;
        }
      }
      if (cond > 0) { ctx.globalAlpha = cond * (1 - glass * 0.8); ctx.drawImage(zc, 0, 0); }
      if (glass > 0 && phase < 2) { phase = 2; zg.classList.add('on'); }
      zg.style.opacity = glass.toFixed(3);
      if (t >= holdUntil && sp.ready()) { push = now; sp.go(); }
      else if (t > 3.4) { push = now; sp.go(); }
    } else {
      var k = (now - push) / 700, e = ei(k);
      ctx.globalAlpha = (1 - glass * 0.8) * (1 - sm(k * 1.6));
      if (ctx.globalAlpha > 0.01) { ctx.save(); ctx.translate(CX * DPR, CY * DPR); ctx.scale(1 + e * 2.5, 1 + e * 2.5); ctx.translate(-CX * DPR, -CY * DPR); ctx.drawImage(zc, 0, 0); ctx.restore(); }
      zg.style.transform = 'scale(' + (1 + e * 7).toFixed(3) + ')';
      zg.style.opacity = (1 - sm((k - 0.35) / 0.55)).toFixed(3);
      if (k >= 1) { finish(); return; }
    }
    raf = requestAnimationFrame(frame);
  }
  function finish() { done = 1; cancelAnimationFrame(raf); cv.remove(); zg.remove(); css.remove(); }
  sp.skip = function () { if (!push && !done) { push = performance.now(); sp.go(1); } };
  sp.onEnd = finish;

  function start() {
    if (T0) return;
    sheet = img.complete && img.naturalWidth ? img : null;
    if (!sheet) { SPR = []; }
    sizeAll(); build();
    T0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  addEventListener('resize', function () { if (!done && T0) sizeAll(); });
  if (img.complete && img.naturalWidth) start();
  else { img.onload = start; img.onerror = start; setTimeout(start, 650); }
})();
