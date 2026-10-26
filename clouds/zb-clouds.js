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
  var FLOOR = { day: '#f3f4f1', night: '#1b2433' };   // inside the cloud: clean white by day, clean dark grey at night

  var css = document.createElement('style');
  css.textContent = [
    '.zbs{position:absolute;left:0;top:0;right:0;z-index:-2;pointer-events:none;overflow:hidden}',
    '.zbs-c{position:absolute;will-change:transform;z-index:2}','.zbs-c.behind{z-index:0}',
    '.zbs-c img{position:absolute;inset:0;width:100%;height:100%;transition:opacity 900ms cubic-bezier(.65,0,.35,1)}',
    '.zbs-c img.n{opacity:0}',
    '.zbs-c.flip img{transform:scaleX(-1)}',
    'html[data-mode="dark"] .zbs-c img.d{opacity:0}',
    'html[data-mode="dark"] .zbs-c img.n{opacity:1}',
    '.zbs{--zf:' + FLOOR.day + ';--zf0:rgba(243,244,241,0)}',
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
    '.zbs-sea{z-index:1;position:fixed;left:0;top:0;width:100vw;height:100vh;display:block;pointer-events:none}'
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
      scene.appendChild(el); items.push({ el: el, f: c.f, key: c.key, cy: y + h / 2 });
    });
    if (sea.canvas) scene.insertBefore(sea.canvas, scene.firstChild);   // the 3D sea sits under the image clouds
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
  // ---- The sea of clouds: one endless cloud layer in real 3D (three.js, ray-marched volume), drawn live behind everything ----
  // Zolton's EffectCraft example: as you scroll, the camera descends onto the sea until it is level with the cloud tops at
  // "Selected work": near heads stand above the horizon, far ones flatten into it. Below that the page is one solid colour.
  // Lighting is the About page cumulus model: 3D Worley erosion for cauliflower edges, Beer-Lambert + powder, a
  // forward/back scattering phase (silver lining) and a cheap multi-scatter lift. Every number is on the tuning panel.
  var SEA_DEFAULTS = {
    // scroll / camera
    camTop: 2.4, camLand: 0.58, land: 0.42, lineGap: 46, rise: 0.08, fly: 0.004, drift: 1,
    // sun / moon
    sunHeight: 22, sunAzimuth: 70, sunIntensity: 1, moon: 0.5,
    // cloud
    relief: 0.5, puff: 1, swell: 0.35, fluff: 0.22, coverage: 0.6, density: 6, billowScale: 0.55, detail: 0.35, detailScale: 1.6,
    // lighting
    absorption: 2.2, multiScatter: 0.3, silver: 0.65, ambient: 0.55, nightAmbient: 1, exposure: 1.25, haze: 0.025,
    quality: 1,
    // high clouds: when each goes behind the cloud horizon (share of the descent: 0 top of page .. 1 landed), and its parallax
    farBehind: 1.37, titleBehind: 0.5, farParallax: 0.30, titleParallax: 0.16,
    // fade to solid: between these points of the descent (0 top .. 1 landed) the clouds blend toward the page colour, up to this much
    solidFrom: 0.8, solidTo: 1.3, solidAmount: 0.92,
    // Zoltbot: seconds at the footer before he flies up out of the clouds
    botLate: 5
  };
  var SEA = {};
  (function () { for (var k in SEA_DEFAULTS) SEA[k] = SEA_DEFAULTS[k]; try { var s = JSON.parse(localStorage.getItem('zbSeaTune') || 'null'); if (s) for (var j in s) if (j in SEA) SEA[j] = s[j]; } catch (e) {} })();
  window.ZB_BOT_LATE = SEA.botLate * 1000;   // read by Zoltbot (password/zb-password.js, late mode)
  var sea = { canvas: null, ok: false, night: 0, nightTo: 0, t0: performance.now(), raf: 0, scale: 0.6 };

  var SEA_FS = [
    'precision highp float; precision highp sampler3D;',
    'out vec4 fc;',
    'uniform sampler2D uH; uniform sampler3D uNoise;',
    'uniform vec2 uR; uniform float uPR, uHz, uCam, uZ, uT, uN;',
    'uniform vec3 uFD, uFN, uSun;',
    'uniform float uA, uTile, uSwell, uSkin, uCov, uDens, uBill, uDet, uDetS, uSunI, uMoon, uAbs, uMulti, uSilver, uAmb, uNAmb, uExp, uHaze;',
    // the cloud-top height under a point: packed rounded heads (baked, tileable, mipmapped) plus long swells
    'float hgt(vec2 xz){ float h = texture(uH, xz/uTile).r; vec2 s2 = mat2(.8,.6,-.6,.8)*xz/(uTile*4.7); float s = texture(uH, s2).r;',
    '  return uA*(h*1.6 + (s-.45)*uSwell*2.); }',
    // density: solid below the top, a soft skin at the top eaten away by Worley noise (cauliflower puffs)
    'float dens(vec3 p, float hs, bool det){',
    '  float sh = clamp((hs - p.y)/uSkin, 0., 1.); if (sh <= 0.) return 0.;',
    '  vec3 rise = vec3(.006, -.012, .004)*uT;',
    '  float n = texture(uNoise, p*uBill*.25 + rise).r;',
    '  if (det) n = mix(n, texture(uNoise, p*uDetS*.25 + rise*2.4 + .37).r, uDet);',
    '  float er = (1.-n)*(1.15-uCov);',
    '  return clamp((sh - er)/(1.-er+1e-3), 0., 1.)*uDens; }',
    'float hg(float c, float g){ float g2=g*g; return (1.-g2)/(12.566*pow(1.+g2-2.*g*c,1.5)); }',
    'vec3 aces(vec3 x){ return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.); }',
    'float h11(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }',
    'void main(){',
    '  vec2 px = gl_FragCoord.xy/uPR;',
    '  vec3 floorC = mix(uFD, uFN, uN);',
    '  vec3 hazeC = mix(vec3(.88,.92,.97), vec3(.18,.23,.34), uN);',
    '  float glow = exp(min(0.,(uHz-px.y))/26.)*.55;',
    '  if (uHz > uR.y + 220.) { fc = vec4(floorC, 1.); return; }',   // deep in the cloud: one solid colour
    '  float F = uR.y*1.05;',
    '  vec3 rd = normalize(vec3((px.x-uR.x*.5)/F, (px.y-uHz)/F, 1.));',      // eye level sits at uHz on screen
    '  vec3 ro = vec3(0., uCam, 0.);',
    '  vec2 off = vec2(uT*.004, uZ);',
    '  float top = uA*(1.6 + uSwell*1.2) + .02, t = .02;',
    '  if (ro.y > top) { if (rd.y >= 0.) { fc = vec4(hazeC, glow); return; } t = (ro.y-top)/-rd.y; }',
    '  vec3 sunCol = mix(vec3(1.,.97,.92)*uSunI, vec3(.55,.66,.95)*uMoon, uN);',
    '  vec3 ambTop = mix(vec3(.50,.66,.98)*uAmb, vec3(.05,.08,.17)*uNAmb, uN);',
    '  vec3 ambBot = ambTop*vec3(.42,.46,.55);',
    '  float mu = dot(rd, uSun);',
    '  float phase = mix(hg(mu, uSilver), hg(mu, -.2), .45);',
    '  vec3 L = vec3(0.); float T = 1., tHit = -1.;',
    '  float ign = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(.06711056,.00583715))));',
    '  for (int i=0;i<140;i++){',
    '    if (t > 90.) break;',
    '    vec3 p = ro + rd*t;',
    '    if (p.y > top && rd.y > 0.) break;',
    '    float clr = smoothstep(.15, 1.3, length(p.xz));',                 // a clearing round the camera: never inside a head
    '    vec2 xz = p.xz + off; float hs = hgt(xz)*clr;',
    '    float dh = p.y - hs;',
    '    if (dh > .015) { t += max(dh*.55, .006 + t*.004); continue; }',
    '    if (tHit < 0.) { tHit = t; t += ign*max(uSkin*.07, t*.006)/uQ; }',   // offset the first step per pixel: no banding
    '    float dt = max(uSkin*.07, t*.006) / uQ;',
    '    vec3 q = vec3(xz.x, p.y, xz.y);',
    '    float d = dens(q, hs, true);',
    '    if (d > .002) {',
    '      float od = 0., st = .07; vec3 lp = q;',                          // optical depth toward the sun
    '      for (int j=0;j<4;j++){ lp += uSun*st; od += dens(lp, hgt(lp.xz), false)*st; st *= 1.7; }',
    '      float beer = max(exp(-od*uAbs), exp(-od*uAbs*.22)*uMulti);',
    '      float powder = 1.-exp(-d*2.2);',
    '      vec3 sunL = sunCol*beer*phase*mix(1., powder, .55)*14.;',
    '      float dep = clamp((hs - p.y)/(uSkin*2.5), 0., 1.);',
    '      vec3 amb = mix(ambTop, ambBot, dep);',
    '      float Tr = exp(-d*dt*1.6);',
    '      L += T*(sunL + amb)*(1.-Tr); T *= Tr;',
    '      if (T < .02) break; }',
    '    if (hs - p.y > uSkin*3.) { L += T*ambBot; T = 0.; break; }',       // deep inside: opaque
    '    t += dt; }',
    '  vec3 col = aces(L*uExp/max(1.-T, 1e-3));',
    '  col = pow(col, vec3(1./2.2));',
    '  float a = 1.-T;',
    '  if (tHit < 0.) { tHit = 90.; }',
    '  col = mix(col, hazeC, clamp(1.-exp(-tHit*uHaze),0.,1.));',            // aerial haze toward the horizon
    '  col = mix(col, floorC, 1.-smoothstep(.35, 1.3, tHit));',              // the closest cloud melts into the page colour
    '  col = mix(col, floorC, uSolid);',                                   // keyframe: the clouds fade toward one solid colour
    '  if (px.y < uHz) { col = mix(mix(hazeC, floorC, uSolid), col, a); a = 1.; }',              // below eye level, what is left is the far hazy sea
    '  else { col = mix(hazeC, col, a/max(a + (1.-a)*glow, 1e-3)); a = a + (1.-a)*glow; }',
    '  fc = vec4(col, a);',
    '}'].join('\n').replace('uniform float uA,', 'uniform float uSolid, uQ, uA,');

  // ---- baked textures: the cloud-head height map (2D, tileable) and the About page's 3D Worley noise ----
  function bakeHeights(N) {
    var out = new Uint8Array(N * N), layers = [[14, 1, 11], [30, .5, 23], [62, .22, 37]], H = new Float32Array(N * N), mx = 0;
    function rnd(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    layers.forEach(function (L) {
      var C = L[0], w = L[1], r = rnd(L[2]), pts = new Float32Array(C * C * 3);
      for (var i = 0; i < pts.length; i++) pts[i] = r();
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var px = x / N * C, py = y / N * C, cx = Math.floor(px), cy = Math.floor(py), acc = 0;
        for (var j = -1; j <= 1; j++) for (var k = -1; k <= 1; k++) {
          var gx = cx + k, gy = cy + j, wx = (gx % C + C) % C, wy = (gy % C + C) % C, o = (wx + wy * C) * 3;
          var dx = gx + pts[o] - px, dy = gy + pts[o + 1] - py, rad = .62 + .38 * pts[o + 2], v = 1 - (dx * dx + dy * dy) / (rad * rad);
          acc += Math.exp(7 * rad * Math.sqrt(Math.max(v, 0))) - 1;
        }
        H[x + y * N] += w * Math.log(1 + acc) / 7;
      }
    });
    for (var i2 = 0; i2 < H.length; i2++) if (H[i2] > mx) mx = H[i2];
    for (var i3 = 0; i3 < H.length; i3++) out[i3] = Math.round(H[i3] / mx * 255);
    return out;
  }
  function bakeWorley(N) {
    function rnd(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function worley(cells, seed) {
      var r = rnd(seed), pts = new Float32Array(cells * cells * cells * 3), out = new Float32Array(N * N * N), cs = N / cells;
      for (var i = 0; i < pts.length; i++) pts[i] = r();
      for (var z = 0; z < N; z++) for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var px = x / cs, py = y / cs, pz = z / cs, cx = Math.floor(px), cy = Math.floor(py), cz = Math.floor(pz), best = 9;
        for (var k = -1; k <= 1; k++) for (var j = -1; j <= 1; j++) for (var i4 = -1; i4 <= 1; i4++) {
          var gx = cx + i4, gy = cy + j, gz = cz + k, o = (((gx + cells) % cells) + ((gy + cells) % cells) * cells + ((gz + cells) % cells) * cells * cells) * 3;
          var dx = gx + pts[o] - px, dy = gy + pts[o + 1] - py, dz = gz + pts[o + 2] - pz, d = dx * dx + dy * dy + dz * dz;
          if (d < best) best = d;
        }
        out[x + y * N + z * N * N] = Math.min(Math.sqrt(best), 1);
      }
      return out;
    }
    var a = worley(4, 11), b = worley(8, 23), c = worley(16, 37), data = new Uint8Array(N * N * N);
    for (var i = 0; i < data.length; i++) data[i] = Math.max(0, Math.min(255, Math.round(((1 - a[i]) * .625 + (1 - b[i]) * .25 + (1 - c[i]) * .125) * 255)));
    return data;
  }

  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function seaApply() {
    if (!sea.U) return; var U = sea.U, S = SEA;
    var e = S.sunHeight * Math.PI / 180, az = S.sunAzimuth * Math.PI / 180;
    var sx = Math.cos(e) * Math.sin(az), sy = Math.sin(e), sz = Math.cos(e) * Math.cos(az);
    if (sea.nightTo > .5 || sea.night > .5) { sx = -sx; sz = Math.abs(sz); }                  // the moon sits behind the sea, low
    U.uSun.value.set(sx, sy, sz).normalize();
    U.uA.value = S.relief; U.uTile.value = 14 * S.puff; U.uSwell.value = S.swell; U.uSkin.value = S.fluff;
    U.uCov.value = S.coverage; U.uDens.value = S.density; U.uBill.value = S.billowScale / S.puff; U.uDet.value = S.detail; U.uDetS.value = S.detailScale / S.puff;
    U.uSunI.value = S.sunIntensity; U.uMoon.value = S.moon; U.uAbs.value = S.absorption; U.uMulti.value = S.multiScatter; U.uSilver.value = S.silver;
    U.uAmb.value = S.ambient; U.uNAmb.value = S.nightAmbient; U.uExp.value = S.exposure; U.uHaze.value = S.haze; U.uQ.value = S.quality;
    seaKick();
  }
  function seaInit() {
    var c = document.createElement('canvas'); c.className = 'zbs-sea'; sea.canvas = c;
    sea.night = sea.nightTo = html.getAttribute('data-mode') === 'dark' ? 1 : 0;
    new MutationObserver(function () { sea.nightTo = html.getAttribute('data-mode') === 'dark' ? 1 : 0; seaApply(); })
      .observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    import('three').catch(function () { return import('https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js'); }).then(function (THREE) {   // the page's own three (import map, shared with the coin)
      var r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
      if (!r.capabilities.isWebGL2) throw new Error('webgl2');
      r.setClearColor(0x000000, 0);
      var NH = 256, ht = new THREE.DataTexture(bakeHeights(NH), NH, NH, THREE.RedFormat, THREE.UnsignedByteType);
      ht.wrapS = ht.wrapT = THREE.RepeatWrapping; ht.minFilter = THREE.LinearMipmapLinearFilter; ht.magFilter = THREE.LinearFilter; ht.generateMipmaps = true; ht.unpackAlignment = 1; ht.needsUpdate = true;
      var NW = 64, wt = new THREE.Data3DTexture(bakeWorley(NW), NW, NW, NW);
      wt.format = THREE.RedFormat; wt.type = THREE.UnsignedByteType; wt.minFilter = wt.magFilter = THREE.LinearFilter;
      wt.wrapS = wt.wrapT = wt.wrapR = THREE.RepeatWrapping; wt.unpackAlignment = 1; wt.needsUpdate = true;
      var fd = hexRGB(FLOOR.day), fn = hexRGB(FLOOR.night), V3 = function (a) { return new THREE.Vector3(a[0], a[1], a[2]); };
      var U = { uH: { value: ht }, uNoise: { value: wt }, uR: { value: new THREE.Vector2(1, 1) }, uPR: { value: 1 }, uHz: { value: -1 }, uCam: { value: 3 },
        uZ: { value: 0 }, uT: { value: 0 }, uN: { value: sea.night }, uFD: { value: V3(fd) }, uFN: { value: V3(fn) }, uSun: { value: new THREE.Vector3(0, 1, 0) }, uQ: { value: 1 }, uSolid: { value: 0 } };
      'uA uTile uSwell uSkin uCov uDens uBill uDet uDetS uSunI uMoon uAbs uMulti uSilver uAmb uNAmb uExp uHaze'.split(' ').forEach(function (k) { U[k] = { value: 0 }; });
      var m = new THREE.ShaderMaterial({ glslVersion: THREE.GLSL3, uniforms: U, fragmentShader: SEA_FS, vertexShader: 'void main(){ gl_Position = vec4(position.xy,0.,1.); }', blending: THREE.NoBlending, depthTest: false, depthWrite: false });
      var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), scn = new THREE.Scene();
      scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
      sea.r = r; sea.cam = cam; sea.scn = scn; sea.U = U; sea.ok = true;
      seaApply(); seaFrame();
    }).catch(function () { sea.fail = true; seaFrame(); });
    if (/\.webflow\.io$/.test(location.hostname) || /[?&]tune\b/.test(location.search)) seaPanel();   // the panel: preview address, or ?tune on the live site
  }
  function seaState() {
    if (window.__zbSeaForce) return window.__zbSeaForce;                         // test hook: pin camera + horizon
    var card = document.querySelector('.work_card'), work = card && (card.closest('section') || card.parentElement);
    if (!work) return null;
    var vh = innerHeight, s = scrollY, wt = work.getBoundingClientRect().top;    // Selected work, on screen
    var L = Math.max(1, wt + s - SEA.land * vh);                                // scroll at which you land on the cloud tops
    var k = Math.max(0, 1 - s / L);                                             // 1 high above the sea .. 0 level with its top
    return { hz: wt - SEA.lineGap + SEA.rise * Math.max(0, L - s), cam: SEA.camLand + (SEA.camTop - SEA.camLand) * Math.pow(k, 1.4), z: s * SEA.fly, L: L };
  }
  function seaKick() { if (!sea.raf) sea.raf = requestAnimationFrame(function () { sea.raf = 0; seaFrame(); }); }
  var still = /zbstill/.test(location.search), fpsN = 0, fpsT = performance.now();
  function seaFrame() {
    var st = seaState(); if (!st || !sea.canvas) return;
    if (sea.fail) { sea.canvas.style.cssText = 'background:linear-gradient(to bottom,transparent ' + st.hz.toFixed(0) + 'px,var(--zf) ' + st.hz.toFixed(0) + 'px)'; return; }
    if (!sea.ok) return;
    var w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio || 1, 2) * sea.scale;
    if (sea.w !== w || sea.h !== h || sea.pr !== pr) { sea.r.setPixelRatio(pr); sea.r.setSize(w, h, false); sea.w = w; sea.h = h; sea.pr = pr; }
    sea.night += (sea.nightTo - sea.night) * 0.12; if (Math.abs(sea.nightTo - sea.night) < 0.01) sea.night = sea.nightTo;
    var U = sea.U;
    U.uR.value.set(w, h); U.uPR.value = pr; U.uHz.value = h - st.hz; U.uCam.value = st.cam; U.uZ.value = st.z;
    var pr2 = st.L ? scrollY / st.L : 0, sf = SEA.solidTo > SEA.solidFrom ? (pr2 - SEA.solidFrom) / (SEA.solidTo - SEA.solidFrom) : (pr2 >= SEA.solidFrom ? 1 : 0);
    sf = Math.max(0, Math.min(1, sf)); U.uSolid.value = sf * sf * (3 - 2 * sf) * SEA.solidAmount;
    U.uT.value = (reduce || still) ? 0 : (performance.now() - sea.t0) / 1000 * SEA.drift; U.uN.value = sea.night;
    sea.r.render(sea.scn, sea.cam);
    var visible = st.hz < h + 40 && st.hz > -80;
    if (visible && !still) {                                                    // hold the frame rate: drop resolution when slow
      fpsN++; var now = performance.now();
      if (now - fpsT > 1200) { var fps = fpsN * 1000 / (now - fpsT); fpsN = 0; fpsT = now;
        if (sea.fpsEl) sea.fpsEl.textContent = Math.round(fps) + ' fps · ' + Math.round(sea.scale * 100) + '%';
        if (fps < 45 && sea.scale > .3) sea.scale = Math.max(.3, sea.scale - .07); else if (fps > 58 && sea.scale < .75) sea.scale = Math.min(.75, sea.scale + .04); }
    }
    if ((visible && !reduce && !still) || sea.night !== sea.nightTo) seaKick();
  }

  // ---- The tuning panel (same as the About page cloud's): only on the preview address, or with ?tune ----
  var SEA_GROUPS = [
    ['High clouds', true, [
      ['farBehind', 'Far clouds go behind horizon at (0 top · 1 landed)', 0, 1.5, .01], ['farParallax', 'Far clouds parallax (higher = sinks)', -.3, .9, .01],
      ['titleBehind', 'Title cloud goes behind horizon at', 0, 1.5, .01], ['titleParallax', 'Title cloud parallax', -.3, .9, .01]]],
    ['Zoltbot', true, [['botLate', 'Seconds at the footer before he shows up', 0, 20, .5]], 'bot'],
    ['Fade to solid', true, [
      ['solidFrom', 'Fade starts at (0 top · 1 landed)', 0, 2, .01], ['solidTo', 'Fully faded at', 0, 2.5, .01],
      ['solidAmount', 'How solid (1 = one colour)', 0, 1, .01]]],
    ['Scroll', false, [
      ['camTop', 'Camera height at top', .8, 5, .05], ['camLand', 'Camera height landed', .3, 1.6, .01],
      ['land', 'Land when work is this far down', .1, .8, .01], ['lineGap', 'Horizon above Selected work (px)', -100, 200, 1],
      ['rise', 'Horizon rise speed', 0, .6, .01], ['fly', 'Fly forward', 0, .012, .0005], ['drift', 'Drift speed', 0, 4, .1]]],
    ['Sun & moon', true, [
      ['sunHeight', 'Sun height', 4, 80, 1], ['sunAzimuth', 'Sun direction', -180, 180, 1],
      ['sunIntensity', 'Sun intensity', .2, 2.5, .05], ['moon', 'Moonlight (dark mode)', 0, 1.5, .02]]],
    ['Cloud', true, [
      ['relief', 'Head height', .1, 1.2, .01], ['puff', 'Head size', .4, 2.5, .01], ['swell', 'Swells', 0, 1, .01],
      ['fluff', 'Fluff (soft edge depth)', .05, .8, .01], ['coverage', 'Coverage', .2, .95, .01], ['density', 'Density', .5, 10, .1],
      ['billowScale', 'Billow scale', .1, 2, .01], ['detail', 'Edge detail', 0, .8, .01], ['detailScale', 'Detail scale', .4, 5, .05]]],
    ['Lighting', false, [
      ['absorption', 'Absorption', .3, 4, .05], ['multiScatter', 'Multi-scatter', 0, .8, .01], ['silver', 'Silver lining', 0, .9, .01],
      ['ambient', 'Sky light', 0, 2, .05], ['nightAmbient', 'Night sky light', 0, 3, .05], ['exposure', 'Exposure', .4, 2.4, .05],
      ['haze', 'Haze', 0, .15, .002], ['quality', 'Quality', .5, 2, .05]]]
  ];
  function seaPanel() {
    var st = document.createElement('style');
    st.textContent = [
      '.zbt{--ink:#0f1a2b;--soft:#4a5b74;--line:rgba(15,26,43,.14);--acc:#2f6fd6;position:fixed;left:16px;bottom:16px;z-index:2147482000;font:12px/1.3 system-ui,-apple-system,sans-serif;color:var(--ink)}',
      '.zbt-chip,.zbt button{font:600 12px system-ui,-apple-system,sans-serif;color:var(--ink);background:rgba(240,246,252,.85);border:1px solid var(--line);border-radius:999px;padding:7px 12px;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}',
      '.zbt button{border-radius:6px;padding:5px 9px;background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none}',
      '.zbt button:hover,.zbt-chip:hover{border-color:var(--acc);color:var(--acc)}',
      '.zbt-card{width:min(300px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow-y:auto;background:rgba(240,246,252,.86);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;box-shadow:0 8px 30px rgba(15,26,43,.18)}',
      '.zbt-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:4px}',
      '.zbt-head b{font-size:14px}.zbt-fps{font:11px ui-monospace,Menlo,monospace;color:var(--soft)}',
      '.zbt details{border-top:1px solid var(--line)}',
      '.zbt summary{list-style:none;cursor:pointer;padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;display:flex;justify-content:space-between}',
      '.zbt summary::-webkit-details-marker{display:none}.zbt summary::after{content:"+";color:var(--soft)}.zbt details[open] summary::after{content:"–"}',
      '.zbt-body{display:grid;gap:8px;padding-bottom:10px}',
      '.zbt-row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center}',
      '.zbt-row label{color:var(--soft)}.zbt-row output{font:11px ui-monospace,Menlo,monospace}',
      '.zbt-row input{grid-column:1/-1;width:100%;margin:0;accent-color:var(--acc)}',
      '.zbt-foot{display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid var(--line);padding-top:10px}',
      '.zbt textarea{width:100%;box-sizing:border-box;font:11px ui-monospace,Menlo,monospace;min-height:90px;border:1px solid var(--line);border-radius:6px}',
      '.zbt [hidden]{display:none!important}'
    ].join('');
    document.head.appendChild(st);
    var box = document.createElement('div'); box.className = 'zbt';
    var open = /[?&]tune\b/.test(location.search);
    try { open = open || localStorage.getItem('zbSeaPanel') === '1'; } catch (e) {}
    box.innerHTML = '<button class="zbt-chip" type="button">Cloud controls</button><div class="zbt-card" hidden><div class="zbt-head"><b>Cloud sea</b><span class="zbt-fps">—</span><button type="button" data-a="close" aria-label="Close panel">×</button></div><div class="zbt-groups"></div>' +
      '<div class="zbt-foot"><button type="button" data-a="mode">Light / dark</button><button type="button" data-a="reset">Reset</button><button type="button" data-a="copy">Copy settings</button><textarea hidden readonly aria-label="Settings as JSON"></textarea></div></div>';
    var chip = box.querySelector('.zbt-chip'), card = box.querySelector('.zbt-card'), groups = box.querySelector('.zbt-groups'), ta = box.querySelector('textarea'), inputs = {};
    sea.fpsEl = box.querySelector('.zbt-fps');
    function show(v) { card.hidden = !v; chip.hidden = v; try { localStorage.setItem('zbSeaPanel', v ? '1' : '0'); } catch (e) {} }
    function fmt(v, step) { var d = String(step).split('.')[1]; return (+v).toFixed(d ? d.length : 0); }
    function save() { try { localStorage.setItem('zbSeaTune', JSON.stringify(SEA)); } catch (e) {} }
    SEA_GROUPS.forEach(function (g) {
      var d = document.createElement('details'); if (g[1]) d.open = true;
      d.innerHTML = '<summary>' + g[0] + '</summary><div class="zbt-body"></div>';
      var body = d.querySelector('.zbt-body');
      g[2].forEach(function (r) {
        var key = r[0], row = document.createElement('div'); row.className = 'zbt-row';
        row.innerHTML = '<label for="zbt-' + key + '">' + r[1] + '</label><output></output><input id="zbt-' + key + '" type="range" min="' + r[2] + '" max="' + r[3] + '" step="' + r[4] + '">';
        var inp = row.querySelector('input'), out = row.querySelector('output');
        inputs[key] = function () { inp.value = SEA[key]; out.textContent = fmt(SEA[key], r[4]); };
        inp.addEventListener('input', function () { SEA[key] = +inp.value; out.textContent = fmt(SEA[key], r[4]); save(); seaApply(); run(); window.ZB_BOT_LATE = SEA.botLate * 1000; });
        body.appendChild(row);
      });
      if (g[3] === 'bot') { var rb = document.createElement('button'); rb.type = 'button'; rb.textContent = 'Replay his entrance'; rb.style.justifySelf = 'start';
        rb.addEventListener('click', function () { if (window.zbBotReplay) { window.zbBotReplay(); var f = document.querySelector('footer, .page_footer'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'end' }); } else rb.textContent = 'Scroll to the footer first'; });
        body.appendChild(rb); }
      groups.appendChild(d);
    });
    function sync() { for (var k in inputs) inputs[k](); }
    sync();
    chip.addEventListener('click', function () { show(true); });
    box.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'close') show(false);
      if (a === 'reset') { for (var k in SEA_DEFAULTS) SEA[k] = SEA_DEFAULTS[k]; save(); window.ZB_BOT_LATE = SEA.botLate * 1000; sync(); seaApply(); run(); ta.hidden = true; }
      if (a === 'mode') { var t = [].filter.call(document.querySelectorAll('button,a,[role=button]'), function (el) { return !box.contains(el) && /^\s*(light|dark)\s*$/i.test(el.textContent); })[0];
        if (t) t.click(); else html.setAttribute('data-mode', html.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'); }
      if (a === 'copy') { var json = JSON.stringify(SEA, null, 2), b = e.target;
        var fall = function () { ta.value = json; ta.hidden = false; ta.select(); b.textContent = 'Select & copy'; };
        try { navigator.clipboard.writeText(json).then(function () { b.textContent = 'Copied'; ta.hidden = true; setTimeout(function () { b.textContent = 'Copy settings'; }, 1400); }, fall); } catch (er) { fall(); } }
    });
    document.body.appendChild(box);
    show(open);
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
