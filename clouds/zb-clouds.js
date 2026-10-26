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
    { src: 'lib/12-scatter', nsrc: 'soft/12-scatter', x: -486,  y: 120,  w: 2785, h: 532,  f: 0.30 },
    // (the sea of clouds itself is the live 3D plane below, not an image)
    // the H1's own cloud, in front of the sea
    { src: 'lib/03-humilis', nsrc: 'soft/03-humilis', x: -425,  y: 174,  w: 1593, h: 694,  f: 0.16 }
  ];
  // Zolton's fade ("going into the clouds"): from clear at FADE.from to solid at FADE.to (design y), then solid to the bottom
  var FADE = { from: 1040, to: 1500 };
  // section tops in the design, matched to the live page's sections
  var ANCHORS = [['hero', 0], ['work', 1008], ['experience', 1536], ['contact', 1867], ['footer', 2263], ['end', 2341]];
  var FLOOR = { day: '#f3f4f1', night: '#1b2433' };   // inside the cloud: clean white by day, clean dark grey at night

  var css = document.createElement('style');
  css.textContent = [
    '.zbs{position:absolute;left:0;top:0;right:0;z-index:-2;pointer-events:none;overflow:hidden}',
    '.zbs-c{position:absolute;will-change:transform}',
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
    '.zbs-sea{position:fixed;left:0;top:0;width:100vw;height:100vh;display:block;pointer-events:none}'
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
  // ---- The sea of clouds: one endless cloud plane in real 3D (three.js), drawn live behind everything ----
  // Zolton's EffectCraft example: the cloud layer tips toward edge-on as you scroll until its top is a flat line on the
  // horizon, and below that line the page is one solid colour. Here a camera descends onto an infinite flat cloud deck:
  // the band of cloud tops between the horizon and the deck's near edge shrinks as the camera drops, and at
  // "Selected work" the camera sits level with the cloud top, so the whole sea is a single flat line. Below it: solid.
  var SEA = {
    M: 46,          // the flat line sits this far above the Selected work section
    RISE: 0.08,     // the horizon rises this much faster than the page while you descend (EC rig: 1.32x)
    CAM_TOP: 2.4,   // camera height over the cloud tops at the top of the page (a cloud head is ~2 across)
    CAM_LAND: 0.78, // level with the nearest heads once you land: near clouds stand above the line, far ones flatten into it
    LAND: 0.42      // you "land" (line flat) when Selected work is this far down the screen
  };
  var sea = { canvas: null, ok: false, night: 0, nightTo: 0, t0: performance.now(), raf: 0 };
  var SEA_FS = [
    'precision highp float;',
    'uniform vec2 uR; uniform float uPR, uHz, uCam, uZ, uT, uN; uniform vec3 uFD, uFN;',
    'float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
    'vec2 h22(vec2 p){ float a=h21(p); return vec2(a, h21(p+a+17.17)); }',
    'float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);',
    '  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y); }',
    // cloud heads: packed rounded domes (one per cell, random size), merged with a smooth max so they bulge into each other
    'float domes(vec2 p){ vec2 i=floor(p), f=fract(p); float acc=0.;',
    '  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=h22(i+g); vec2 r=g+o-f;',
    '    float rad=.62+.38*h21(i+g+5.3); float v=1.-dot(r,r)/(rad*rad); acc+=exp(7.*rad*sqrt(max(v,0.)))-1.; }',
    '  return log(1.+acc)/7.; }',
    // cloud-top height in world units: heads on heads (cauliflower), the finest only where a pixel can show it
    'float Hc(vec2 p){ return domes(p) + .5*domes(p*2.1+3.7) + .15*n2(p*.12+3.1); }',
    'float H(vec2 p, float fp){ float w = 1.-smoothstep(.12,.3,fp*4.4); return Hc(p) + (w>0. ? .22*w*(domes(p*4.4+7.1)-.4) : 0.); }',
    'const float A = .5;',
    'void main(){',
    '  vec2 px = gl_FragCoord.xy/uPR;',                    // CSS px, origin bottom-left
    '  vec3 floorC = mix(uFD, uFN, uN);',
    '  vec3 hazeC = mix(vec3(.88,.92,.97), vec3(.18,.23,.34), uN);',
    '  vec3 lit = mix(vec3(1.,1.,.985), vec3(.45,.52,.65), uN);',
    '  vec3 shd = mix(vec3(.60,.68,.82), vec3(.11,.15,.24), uN);',
    '  if (uHz > uR.y + 220.) { gl_FragColor = vec4(floorC, 1.); return; }',   // deep in the cloud: one solid colour
    '  float F = uR.y*1.05;',
    '  vec3 rd = normalize(vec3((px.x-uR.x*.5)/F, (px.y-uHz)/F, 1.));',   // the horizon (eye level) sits at uHz on screen
    '  vec3 ro = vec3(0., uCam, 0.);',
    '  vec2 off = vec2(uT*.004, uZ);',
    '  vec3 L = normalize(mix(vec3(.5,.75,-.15), vec3(-.35,.75,.25), uN));',
    '  float top = A*1.8, t = .03;',
    '  float glow = exp(min(0.,(uHz-px.y))/26.)*.55;',
    '  if (ro.y > top) { if (rd.y >= 0.) { gl_FragColor = vec4(hazeC, glow); return; } t = (ro.y-top)/-rd.y; }',
    '  vec3 col = vec3(0.), cc = vec3(1.); float T = 1., pt = t, pd = 1.; bool shaded = false;',
    // soft march: density rises over a soft skin under the surface, so heads have fluffy edges, not a hard shell
    '  for (int i=0;i<96;i++){',
    '    vec3 q = ro + rd*t;',
    '    if (t > 80. || (q.y > top && rd.y > 0.)) break;',
    '    vec2 p = q.xz + off; float fp = t/F*1.25;',
    '    float clr = smoothstep(.15, 1.3, length(q.xz));',        // a clearing around the camera, so you are never inside a head
    '    float sy = A*H(p, fp)*clr;',
    '    float skin = .05 + t*.012;',
    '    float dh = q.y - sy;',
    '    if (dh > skin) { pt = t; pd = dh - skin; t += max(dh*.5, .004 + t*.005); continue; }',
    '    float den = smoothstep(skin, -skin, dh);',
    '    if (!shaded) { shaded = true;',
    '      float th = pt + (t-pt) * pd / max(pd - (dh - skin), 1e-4);',   // secant back to where the ray meets the surface
    '      vec3 qh = ro + rd*th; p = qh.xz + off; sy = A*H(p, fp)*smoothstep(.15, 1.3, length(qh.xz));',                      // light the head once, where the ray first meets it
    '      float e = max(.03, fp*.9);',
    '      float hx = A*H(p+vec2(e,0.), fp) - sy, hz = A*H(p+vec2(0.,e), fp) - sy;',
    '      vec3 n = normalize(vec3(-hx/e, 1., -hz/e));',
    '      float dif = clamp(dot(n,L), 0., 1.);',
    '      float sh = clamp(1.-(A*H(p+normalize(L.xz)*.35, fp)-sy)*4., 0., 1.);',  // a taller head toward the sun shades this one
    '      float up = clamp(sy/A*.6, 0., 1.);',              // valleys between heads go blue-grey
    '      float rim = pow(1.-clamp(dot(n,-rd),0.,1.), 4.);',
    '      cc = mix(shd, lit, clamp(dif*mix(.45,1.,sh)*.8 + up*.25 + rim*.15, 0., 1.));',
    '      cc = mix(cc, hazeC, clamp(1.-exp(-th*.04),0.,1.));',
    '      cc = mix(cc, floorC, 1.-smoothstep(.7, 2.8, th)); }',   // the closest cloud melts into the page colour
    '    vec3 c = cc;',
    '    float st = max(.012, t*.01);',
    '    float a = 1.-exp(-den*st*38.);',
    '    col += T*a*c; T *= 1.-a; if (T < .02) break;',
    '    t += st; }',
    '  float alpha = 1.-T;',
    '  if (px.y < uHz) { col += T*hazeC; alpha = 1.; }',     // rays that ran out below eye level: the hazy far sea
    '  else { col += T*hazeC*glow; alpha = alpha + T*glow; }',
    '  vec3 outc = alpha > 0. ? col/alpha : hazeC;',
    '  gl_FragColor = vec4(outc, alpha);',
    '}'].join('\n');

  function hexRGB(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function seaInit() {
    var c = document.createElement('canvas'); c.className = 'zbs-sea'; sea.canvas = c;
    sea.night = sea.nightTo = html.getAttribute('data-mode') === 'dark' ? 1 : 0;
    new MutationObserver(function () { sea.nightTo = html.getAttribute('data-mode') === 'dark' ? 1 : 0; seaKick(); })
      .observe(html, { attributes: true, attributeFilter: ['data-mode'] });
    import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js').then(function (THREE) {
      var r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
      r.setClearColor(0x000000, 0);
      var cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), scn = new THREE.Scene();
      var fd = hexRGB(FLOOR.day), fn = hexRGB(FLOOR.night);
      var U = { uR: { value: new THREE.Vector2(1, 1) }, uPR: { value: 1 }, uHz: { value: -1 }, uCam: { value: 3 }, uZ: { value: 0 },
        uT: { value: 0 }, uN: { value: sea.night }, uFD: { value: new THREE.Vector3(fd[0], fd[1], fd[2]) }, uFN: { value: new THREE.Vector3(fn[0], fn[1], fn[2]) } };
      var m = new THREE.ShaderMaterial({ uniforms: U, fragmentShader: SEA_FS, vertexShader: 'void main(){ gl_Position = vec4(position.xy,0.,1.); }', blending: THREE.NoBlending, depthTest: false });
      scn.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m));
      sea.r = r; sea.cam = cam; sea.scn = scn; sea.U = U; sea.ok = true;
      seaFrame();
    }).catch(function () { sea.fail = true; seaFrame(); });
  }
  function seaState() {
    var card = document.querySelector('.work_card'), work = card && (card.closest('section') || card.parentElement);
    if (!work) return null;
    var vh = innerHeight, s = scrollY, wt = work.getBoundingClientRect().top;   // Selected work, on screen
    var L = Math.max(1, wt + s - SEA.LAND * vh);                               // scroll at which you land on the cloud top
    var k = Math.max(0, 1 - s / L);                                            // 1 high above the sea .. 0 level with its top
    return { hz: wt - SEA.M + SEA.RISE * Math.max(0, L - s), cam: SEA.CAM_LAND + (SEA.CAM_TOP - SEA.CAM_LAND) * Math.pow(k, 1.4), band: k, z: s * 0.004, k: k };
  }
  function seaKick() { if (!sea.raf) sea.raf = requestAnimationFrame(function () { sea.raf = 0; seaFrame(); }); }
  function seaFrame() {
    var st = seaState(); if (!st || !sea.canvas) return;
    if (sea.fail) { sea.canvas.style.cssText = 'background:linear-gradient(to bottom,transparent ' + st.hz.toFixed(0) + 'px,var(--zf) ' + st.hz.toFixed(0) + 'px)'; return; }
    if (!sea.ok) return;
    var w = innerWidth, h = innerHeight, pr = Math.min(devicePixelRatio || 1, 1.5);
    if (sea.w !== w || sea.h !== h || sea.pr !== pr) { sea.r.setPixelRatio(pr * 0.6); sea.r.setSize(w, h, false); sea.w = w; sea.h = h; sea.pr = pr; }
    sea.night += (sea.nightTo - sea.night) * 0.12; if (Math.abs(sea.nightTo - sea.night) < 0.01) sea.night = sea.nightTo;
    var U = sea.U;
    U.uR.value.set(w, h); U.uPR.value = pr * 0.6; U.uHz.value = h - st.hz; U.uCam.value = st.cam; U.uZ.value = st.z;
    U.uT.value = reduce ? 0 : (performance.now() - sea.t0) / 1000; U.uN.value = sea.night;
    sea.r.render(sea.scn, sea.cam);
    // keep drifting slowly while cloud tops are on screen; settle when the sea is only a line, or off screen
    var visible = st.hz < h + 40 && st.hz > -80;
    if ((visible && !reduce && !/zbstill/.test(location.search)) || sea.night !== sea.nightTo) seaKick();
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
