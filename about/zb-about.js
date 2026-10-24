/* zb-about — About page sky for zoltonbaize.com (placeholder before the full scroll story).
   A field of raymarched cumulus, each with its own random shape, fills the screen behind the content. Scrolling moves the
   view through the sky along a travel direction (real parallax: near clouds pass faster than far ones), and the clouds grow
   from cumulus humilis at the top of the page toward cumulonimbus at the bottom (two keyframes, top and bottom).
   The canvas is named zb-sky for page transitions, so Work -> About plays as the view panning right across the sky.
   Needs WebGL2; without it the page keeps a plain sky gradient. Loads three.js r128 from cdnjs. */
(function () {
  'use strict';
  if (window.__zbAbout) return; window.__zbAbout = true;
  const SETTINGS = Object.assign({
    // sky: the same palette and sun as the Work page's sky, so Work -> About reads as the view panning across one sky
    sky: 'work', sunHeight: 28, sunAzimuth: 208, sunIntensity: 1.15,
    coverage: 0.29, density: 5.5, size: 1.22, billowScale: 0.225, detail: 0.46, detailScale: 0.54,
    absorption: 2.5, multiScatter: 0.5, silver: 0.37, ambient: 1.45, exposure: 1.4,
    zenith: '#1E7FC4', horizon: '#CFEBF9', warmSunset: false,
    speed: 1, autoOrbit: true, fov: 42, quality: 90,
    // the field and the flight
    count: 14,            // clouds in the sky (more = heavier to draw)
    seed: 7,              // shape and placement; any number gives a different sky
    travelX: 0.35, travelY: 0.1, travelZ: -1,   // direction the view moves as you scroll
    travel: 46,           // how far the view moves over the whole page (scroll speed of the parallax)
    depth: 44,            // how deep the field goes: spread of cloud distances, i.e. parallax depth
    near: 10,             // closest a cloud gets to the view
    typeTop: 0.15,        // cloud type at the top of the page: 0 humilis, 0.35 mediocris, 0.65 congestus, 1 cumulonimbus
    typeBottom: 0.5       // ...and at the bottom of the page
  }, window.ZB_ABOUT_CLOUDS || {});
  const NIGHT = { zenith: '#030814', horizon: '#14223d', sunIntensity: 0.35, ambient: 0.55, exposure: 1.1, warmSunset: false };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;

  // Fallback sky (and the colour you see for the split second before WebGL draws)
  const css = document.createElement('style');
  css.textContent = [
    'html.zb-about{background:#7FD0F0}',
    '#zb-about-sky{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%);view-transition-name:zb-sky}',
    '#zb-about-sky canvas{position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity 700ms cubic-bezier(.2,.8,.2,1)}',
    '#zb-about-sky.on canvas{opacity:1}',
    'html.zb-about .page_root{position:relative;z-index:1}'
  ].join('');
  document.head.appendChild(css);
  document.documentElement.classList.add('zb-about');
  // nav icons: load the icon font the Work page uses, if this page doesn't already
  if (!document.querySelector('link[href*="phosphor"], script[src*="phosphor"]')) {
    ['regular', 'fill'].forEach(w => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/' + w + '/style.css'; document.head.appendChild(l); });
  }
  const wrap = document.createElement('div'); wrap.id = 'zb-about-sky'; wrap.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas'); wrap.appendChild(canvas);
  document.body.insertBefore(wrap, document.body.firstChild);

  function isNight() {
    const m = document.documentElement.getAttribute('data-mode');   // set by zb-theme.js, the site-wide light/dark setting
    if (m) return m === 'dark';
    try { const t = localStorage.getItem('zb-home-mode') || localStorage.getItem('zbTheme'); if (t) return t === 'dark'; } catch (e) {}
    return false;   // day sky unless the visitor chose night with the toggle
  }
  const SKIES = { work: { zenith: '#1E7FC4', horizon: '#CFEBF9' }, deep: { zenith: '#0b3a8f', horizon: '#4f86d1' } };

  function boot() {
    const THREE = window.THREE;   // keep the copy we booted with
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return; }
    if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return; }

    // tileable 3D Worley-FBM noise, baked once
    const N = 64;
    function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function worley(cells, seed) {
      const r = rng(seed), pts = new Float32Array(cells * cells * cells * 3);
      for (let i = 0; i < pts.length; i++) pts[i] = r();
      const out = new Float32Array(N * N * N), cs = N / cells;
      for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const px = x / cs, py = y / cs, pz = z / cs, cx = Math.floor(px), cy = Math.floor(py), cz = Math.floor(pz);
        let best = 9;
        for (let k = -1; k <= 1; k++) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const gx = cx + i, gy = cy + j, gz = cz + k;
          const o = (((gx + cells) % cells) + ((gy + cells) % cells) * cells + ((gz + cells) % cells) * cells * cells) * 3;
          const dx = gx + pts[o] - px, dy = gy + pts[o + 1] - py, dz = gz + pts[o + 2] - pz, d = dx * dx + dy * dy + dz * dz;
          if (d < best) best = d;
        }
        out[x + y * N + z * N * N] = Math.min(Math.sqrt(best), 1);
      }
      return out;
    }
    const w1 = worley(4, 11), w2 = worley(8, 23), w3 = worley(16, 37), data = new Uint8Array(N * N * N);
    for (let i = 0; i < data.length; i++) data[i] = Math.max(0, Math.min(255, Math.round(((1 - w1[i]) * 0.625 + (1 - w2[i]) * 0.25 + (1 - w3[i]) * 0.125) * 255)));
    const noiseTex = new (THREE.Data3DTexture || THREE.DataTexture3D)(data, N, N, N);
    noiseTex.format = THREE.RedFormat; noiseTex.type = THREE.UnsignedByteType;
    noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter;
    noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping;
    noiseTex.unpackAlignment = 1; noiseTex.needsUpdate = true;


    // ---------- the field: random cloud shapes along the flight path ----------
    const MAXN = 24;
    function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    let clouds = [], clusters = [], blobs = [], bounds = [];
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const VIEW = V(-0.12, -0.11, -1).normalize();     // the view looks slightly down toward the horizon, like the Work page
    const START = V(0, 2.6, 26);
    function travelDir() { const d = V(SETTINGS.travelX, SETTINGS.travelY, SETTINGS.travelZ); return d.lengthSq() < 1e-6 ? V(0, 0, -1) : d.normalize(); }
    function layout() {
      const S = SETTINGS, n = Math.max(1, Math.min(MAXN, Math.round(S.count))), r = rng(Math.round(S.seed) * 7919 + 13);
      const dir = travelDir(), side = V().crossVectors(VIEW, V(0, 1, 0)).normalize();
      clouds = [];
      for (let k = 0; k < n; k++) {
        const along = -0.1 + 1.2 * (k + r()) / n;                       // spread along the whole flight, a little past each end
        const p = START.clone().addScaledVector(dir, S.travel * along);
        p.addScaledVector(VIEW, S.near + r() * S.depth);                 // somewhere ahead of the view at that point
        p.addScaledVector(side, (r() - 0.5) * (S.depth * 0.9 + 12));    // left or right
        p.y = -1.2 + r() * 1.8;                                          // cloud bases sit below the view, like a real sky
        clouds.push({ pos: p, scale: 0.55 + r() * 0.75, flip: r() < 0.5 ? -1 : 1, dev: (r() - 0.5) * 0.3, j: Array.from({ length: 30 }, () => r() - 0.5), ph: r() * 6.28 });
      }
      clusters = clouds.map(() => new THREE.Vector4());
      blobs = Array.from({ length: n * 9 }, () => new THREE.Vector4());
      bounds = new Array(n).fill(6);
      uniforms.uClusters.value = clusters; uniforms.uBlobs.value = blobs; uniforms.uBounds.value = bounds;
      if (mat && mat.defines.NC !== n) { mat.defines.NC = n; mat.needsUpdate = true; }
    }
    const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    // one cloud's 9 blobs for a development stage: 0 humilis (flat, wide), 0.35 mediocris, 0.65 congestus (towering), 1 cumulonimbus (tower + anvil)
    function shape(c, devIn, t, k) {
      const dev = Math.max(0, Math.min(1, devIn + c.dev)), j = c.j, f = c.flip;
      const H = 0.5 + 8.2 * Math.pow(dev, 1.35), W = 4.4 - 1.3 * dev, A = smooth(0.72, 1, dev);
      const w = i => 0.12 * Math.sin(t * 0.07 + c.ph + i * 1.9);       // slow billowing
      const B = [
        [0, 0.35, 0, 2.0 + 0.4 * dev],
        [-W * 0.55, 0.0, 0.4, 1.55], [W * 0.55, 0.05, -0.2, 1.6],
        [-W * 0.95, -0.3, -0.2, 1.0 + 0.2 * (1 - dev)], [W * 0.95, -0.25, 0.4, 1.05 + 0.2 * (1 - dev)],
        [0, 0.4 + H * 0.36, 0.1, 1.45 + 0.35 * dev], [0, 0.4 + H * 0.66, -0.1, 1.25 + 0.35 * dev],
        [-(0.5 + 4.6 * A), 0.4 + H * 0.93, 0, 1.05 + 0.5 * A], [0.5 + 4.6 * A, 0.4 + H * 0.97, 0.1, 1.0 + 0.5 * A]
      ];
      let bound = 0;
      B.forEach((b, i) => {
        const x = f * (b[0] + j[i * 3] * 1.1 * (1 - 0.5 * A)), y = b[1] + j[i * 3 + 1] * 0.5 * (i > 4 ? 1 : 0.4) + w(i), z = b[2] + j[i * 3 + 2] * 1.2;
        const rr = b[3] * (0.85 + (j[27 + (i % 3)] + 0.5) * 0.3) * (1 + 0.05 * Math.sin(t * 0.09 + i * 1.7 + c.ph));
        blobs[k * 9 + i].set(x, y, z, rr);
        bound = Math.max(bound, Math.hypot(x, y, z) + rr);
      });
      bounds[k] = bound + 0.6;
    }

    const uniforms = {
      uNoise: { value: noiseTex }, uTime: { value: 0 }, uFrame: { value: 0 },
      uCam: { value: new THREE.Vector3() }, uInvVP: { value: new THREE.Matrix4() },
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uBlobs: { value: [] }, uClusters: { value: [] }, uBounds: { value: [] },
      uCoverage: { value: 0.55 }, uDensity: { value: 3 }, uScale: { value: 1 },
      uNoiseScale: { value: 0.11 }, uDetail: { value: 0.3 }, uDetailScale: { value: 0.38 },
      uSunI: { value: 1 }, uAbsorb: { value: 1.6 }, uMulti: { value: 0.28 }, uSilver: { value: 0.7 },
      uAmbient: { value: 1 }, uExposure: { value: 1.05 }, uSteps: { value: 90 },
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uWarm: { value: 1 },
      uG0: { value: new THREE.Vector3() }, uG1: { value: new THREE.Vector3() }, uG2: { value: new THREE.Vector3() }, uG3: { value: new THREE.Vector3() }, uGrad: { value: 1 }
    };
    const frag = /* glsl */`
    precision highp float;
    precision highp sampler3D;
    uniform sampler3D uNoise;
    uniform float uTime, uFrame, uCoverage, uDensity, uScale, uNoiseScale, uDetail, uDetailScale;
    uniform float uSunI, uAbsorb, uMulti, uSilver, uAmbient, uExposure, uSteps, uWarm;
    uniform vec3 uCam, uSun, uZenith, uHorizon;
    uniform vec3 uG0, uG1, uG2, uG3; uniform float uGrad;   // the Work page's sky gradient, top to bottom, in screen space
    uniform mat4 uInvVP;
    uniform vec4 uBlobs[NC * 9];    // 9 blobs per cloud, each cloud its own random shape
    uniform vec4 uClusters[NC];     // xyz centre, w scale
    uniform float uBounds[NC];      // each cloud's bounding radius in its local units
    varying vec2 vUv;

    float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
    float sdCloud(int c, vec3 p) { float d = 1e4; for (int i = 0; i < 9; i++) { vec4 b = uBlobs[c * 9 + i]; d = smin(d, length(p - b.xyz) - b.w, 1.0); } return d; }

    float density(vec3 wp, bool detail) {
      vec3 p = wp / uScale;
      float sd = 1e4, ly = 0.;
      for (int c = 0; c < NC; c++) {
        vec4 C = uClusters[c];
        if (length(p - C.xyz) - uBounds[c] * C.w > 0.9) continue;
        float d = sdCloud(c, (p - C.xyz) / C.w) * C.w;
        if (d < sd) { sd = d; ly = (p.y - C.y) / C.w; }
      }
      if (sd > 0.9) return 0.;
      float shape = clamp(0.45 - sd * 0.55, 0., 1.) * smoothstep(-1.3, -0.75, ly);
      vec3 rise = vec3(0.010, -0.028, 0.006) * uTime;
      float n = texture(uNoise, p * uNoiseScale + rise).r;
      if (detail) n = mix(n, texture(uNoise, p * uDetailScale + rise * 2.4 + 0.37).r, uDetail);
      float er = (1. - n) * (1.15 - uCoverage);
      return clamp((shape - er) / (1. - er + 1e-3), 0., 1.) * uDensity;
    }
    float lightOD(vec3 p) { float od = 0., st = 0.25 * uScale; for (int i = 0; i < 6; i++) { p += uSun * st; od += density(p, false) * st; st *= 1.45; } return od; }
    float hg(float c, float g) { float g2 = g * g; return (1. - g2) / (12.566 * pow(1. + g2 - 2. * g * c, 1.5)); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    float lowSun() { return (1. - smoothstep(0.02, 0.4, uSun.y)) * uWarm; }
    vec3 sunColor() { return mix(vec3(1.0, 0.96, 0.9), vec3(1.0, 0.52, 0.28), lowSun()); }
    vec3 sky(vec3 rd) {
      float ls = lowSun();
      vec3 zen = mix(uZenith, uZenith * vec3(0.7, 0.6, 0.7), ls), hor = mix(uHorizon, vec3(0.95, 0.62, 0.45), ls * 0.8);
      float h = max(rd.y, 0.); vec3 c = mix(hor, zen, pow(h, 0.5));
      if (rd.y < 0.) c = mix(hor, hor * 0.55, clamp(-rd.y * 3., 0., 1.));
      float s = max(dot(rd, uSun), 0.); c += sunColor() * uSunI * (pow(s, 900.) * 12. + pow(s, 10.) * 0.25);
      return c;
    }
    vec2 sphere(vec3 ro, vec3 rd, vec3 c, float r) { vec3 o = ro - c; float b = dot(o, rd), q = dot(o, o) - r * r, h = b * b - q; if (h < 0.) return vec2(1e9, -1e9); h = sqrt(h); return vec2(-b - h, -b + h); }
    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0., 1.); }

    void main() {
      vec4 wp = uInvVP * vec4(vUv * 2. - 1., 1., 1.);
      vec3 ro = uCam, rd = normalize(wp.xyz / wp.w - uCam);
      vec3 col = sky(rd);
      // where the ray passes through each cloud's bounding sphere; march only inside those spans
      vec2 sp[NC]; float tmin = 1e9, tmax = -1e9, inside = 0.;
      for (int c = 0; c < NC; c++) {
        vec4 C = uClusters[c]; vec2 s = sphere(ro, rd, C.xyz * uScale, uBounds[c] * C.w * uScale);
        s.x = max(s.x, 0.); sp[c] = s;
        if (s.y > s.x) { tmin = min(tmin, s.x); tmax = max(tmax, s.y); inside += s.y - s.x; }
      }
      float Tlast = 1.; vec3 Llast = vec3(0.);
      if (tmax > tmin) {
        float dt = max(inside / uSteps, 0.06 * uScale);
        float tt = tmin + dt * hash(gl_FragCoord.xy + fract(uFrame * 0.618) * 100.);
        float T = 1.; vec3 L = vec3(0.);
        float mu = dot(rd, uSun), phase = mix(hg(mu, uSilver), hg(mu, -0.2), 0.45);
        vec3 sc = sunColor() * uSunI * mix(0.55, 1.0, smoothstep(0.0, 0.35, uSun.y));
        float ls = lowSun();
        vec3 ambTop = mix(uZenith, uHorizon, 0.5) * 1.15 + 0.15, ambBot = ambTop * vec3(0.42, 0.45, 0.5);
        for (int i = 0; i < 220; i++) {
          if (tt > tmax || T < 0.01 || float(i) > uSteps * 2.2) break;
          // skip the empty sky between clouds
          bool inS = false; float next = 1e9;
          for (int c = 0; c < NC; c++) { vec2 s = sp[c]; if (s.y > s.x) { if (tt >= s.x && tt <= s.y) inS = true; else if (s.x > tt) next = min(next, s.x); } }
          if (!inS) { if (next > 1e8) break; tt = next + dt * 0.5; continue; }
          vec3 p = ro + rd * tt;
          float d = density(p, true);
          if (d > 0.002) {
            float od = lightOD(p);
            float beer = max(exp(-od * uAbsorb), exp(-od * uAbsorb * 0.22) * uMulti);
            float powder = 1. - exp(-d * 2.2);
            vec3 sunL = sc * beer * phase * mix(1., powder, 0.55) * 14.;
            vec3 amb = mix(ambBot, ambTop, clamp((p.y / uScale + 1.4) / 6.5, 0., 1.)) * uAmbient * mix(0.85, 0.5, ls);
            float Tr = exp(-d * dt * 1.25 / uScale);
            L += T * (sunL + amb) * (1. - Tr); T *= Tr;
          }
          tt += dt;
        }
        // farther clouds pick up a little sky haze, which sells the depth
        col = col * T + L; Tlast = T; Llast = L;
      }
      col = pow(aces(col * uExposure), vec3(1. / 2.2));
      if (uGrad > 0.5) {
        // same sky as the Work page: its exact gradient behind, the clouds laid over it (un-premultiplied so edges stay clean)
        float y = 1. - vUv.y;
        vec3 g = y < 0.46 ? mix(uG0, uG1, y / 0.46) : y < 0.74 ? mix(uG1, uG2, (y - 0.46) / 0.28) : mix(uG2, uG3, (y - 0.74) / 0.26);
        float a = 0., sunG = pow(max(dot(rd, uSun), 0.), 12.) * 0.18 * uSunI;
        vec3 cl = vec3(0.);
        if (tmax > tmin) { a = 1. - Tlast; cl = a > 0.002 ? pow(aces(Llast / a * uExposure), vec3(1. / 2.2)) : vec3(0.); }
        col = mix(g + sunG, cl, a);
      }
      vec2 q = vUv - 0.5; if (uGrad < 0.5) col *= 1. - dot(q, q) * 0.3;
      gl_FragColor = vec4(col, 1.);
    }
  `;
    let mat = null;
    layout();
    mat = new THREE.ShaderMaterial({ defines: { NC: clouds.length }, uniforms, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false });
    const scene = new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const cam = new THREE.PerspectiveCamera(SETTINGS.fov, 1, 0.1, 400);

    let night = isNight(), nightF = night ? 1 : 0;
    // colours: mixed in sRGB, then linearised by hand (works the same whatever three.js colour management does)
    const hex = h => { const v = parseInt(String(h).replace('#', ''), 16); return [(v >> 16 & 255) / 255, (v >> 8 & 255) / 255, (v & 255) / 255]; };
    const toLin = c => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const setCol = (u, a, b, t) => { const A = hex(a), B = hex(b); u.setRGB(toLin(A[0] + (B[0] - A[0]) * t), toLin(A[1] + (B[1] - A[1]) * t), toLin(A[2] + (B[2] - A[2]) * t)); };
    function apply() {
      const S = SETTINGS, n = nightF, mix = (a, b) => a + (b - a) * n, sky = SKIES[S.sky] || { zenith: S.zenith, horizon: S.horizon };
      const e = S.sunHeight * Math.PI / 180, a = S.sunAzimuth * Math.PI / 180;
      uniforms.uSun.value.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)).normalize();
      uniforms.uSunI.value = mix(S.sunIntensity, NIGHT.sunIntensity);
      uniforms.uCoverage.value = S.coverage; uniforms.uDensity.value = S.density; uniforms.uScale.value = S.size;
      uniforms.uNoiseScale.value = S.billowScale; uniforms.uDetail.value = S.detail; uniforms.uDetailScale.value = S.detailScale;
      uniforms.uAbsorb.value = S.absorption; uniforms.uMulti.value = S.multiScatter; uniforms.uSilver.value = S.silver;
      uniforms.uAmbient.value = mix(S.ambient, NIGHT.ambient); uniforms.uExposure.value = mix(S.exposure, NIGHT.exposure);
      uniforms.uSteps.value = touch ? Math.min(S.quality, 64) : S.quality;
      // the gradient stays in display (sRGB) space, like the CSS one on the Work page
      const WG = ['#1E7FC4', '#7FD0F0', '#CFEBF9', '#F6E9D2'], NG = ['#030814', '#0a1830', '#14223d', '#1d2a45'];
      ['uG0', 'uG1', 'uG2', 'uG3'].forEach((u, i) => { const A = hex(WG[i]), B = hex(NG[i]); uniforms[u].value.set(A[0] + (B[0] - A[0]) * n, A[1] + (B[1] - A[1]) * n, A[2] + (B[2] - A[2]) * n); });
      uniforms.uGrad.value = S.sky === 'work' ? 1 : 0;
      setCol(uniforms.uZenith.value, sky.zenith, NIGHT.zenith, n);
      setCol(uniforms.uHorizon.value, sky.horizon, NIGHT.horizon, n);
      uniforms.uWarm.value = S.warmSunset && n < 0.5 ? 1 : 0;
      wrap.style.background = n > 0.5 ? 'linear-gradient(180deg,#030814,#14223d)' : '';
    }
    apply();
    const RELAYOUT = ['count', 'seed', 'travelX', 'travelY', 'travelZ', 'travel', 'depth', 'near'];
    window.zbAbout = {
      settings: SETTINGS,
      set(o) { Object.assign(SETTINGS, o); if (o.fov) { cam.fov = o.fov; cam.updateProjectionMatrix(); } if (Object.keys(o).some(k => RELAYOUT.includes(k))) layout(); apply(); },
      randomize() { this.set({ seed: Math.floor(Math.random() * 100000) }); return SETTINGS.seed; }
    };
    addEventListener('storage', () => { night = isNight(); });
    addEventListener('zb-theme', () => { night = isNight(); });   // the site's theme toggle fires this
    setInterval(() => { night = isNight(); }, 1000);

    // adaptive resolution: the raymarch is heavy, so it renders below screen resolution and scales with the frame rate
    const maxScale = Math.min(devicePixelRatio || 1, 2) * (touch ? 0.5 : 0.75);
    let scale = Math.min(maxScale, touch ? 0.4 : 0.6);
    function resize() { renderer.setPixelRatio(scale); renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
    addEventListener('resize', resize); resize();

    // scroll keyframes: 0 at the top of the page, 1 at the bottom
    let sp = 0;
    const progress = () => { const max = document.documentElement.scrollHeight - innerHeight; return max > 4 ? Math.max(0, Math.min(1, scrollY / max)) : 0; };
    let last = performance.now(), acc = 0, frames = 0, simT = 40, sway = 0, shown = false, visible = true;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(frame); } });
    const pos = new THREE.Vector3(), look = new THREE.Vector3();
    function frame(now) {
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      simT += dt * SETTINGS.speed * (reduce ? 0.3 : 1);
      if (SETTINGS.autoOrbit && !reduce) sway += dt;
      nightF += ((night ? 1 : 0) - nightF) * Math.min(1, dt * 3); apply();
      sp += (progress() - sp) * (reduce ? 1 : Math.min(1, dt * 6));   // eases with the scroll, so the sky glides behind the text
      const S = SETTINGS, dev = S.typeTop + (S.typeBottom - S.typeTop) * sp;
      clouds.forEach((c, k) => { clusters[k].set(c.pos.x, c.pos.y, c.pos.z, c.scale); shape(c, dev, simT, k); });
      // the view moves along the travel direction (no rotation): it reads as your view moving through the sky
      pos.copy(START).addScaledVector(travelDir(), S.travel * sp);
      if (!reduce) { pos.x += Math.sin(sway * 0.05) * 0.8; pos.y += Math.sin(sway * 0.08) * 0.25; }
      cam.position.copy(pos).multiplyScalar(S.size);
      look.copy(pos).add(VIEW).multiplyScalar(S.size);
      cam.lookAt(look); cam.updateMatrixWorld();
      uniforms.uCam.value.copy(cam.position);
      uniforms.uInvVP.value.multiplyMatrices(cam.matrixWorld, cam.projectionMatrixInverse);
      uniforms.uTime.value = simT; uniforms.uFrame.value++;
      renderer.render(scene, quadCam);
      if (!shown) { shown = true; wrap.classList.add('on'); }
      acc += dt; frames++;
      if (acc > 1) {
        const fps = frames / acc;
        if (fps < 40 && scale > 0.3) { scale = Math.max(0.3, scale - 0.08); resize(); }
        else if (fps > 58 && scale < maxScale) { scale = Math.min(maxScale, scale + 0.05); resize(); }
        acc = 0; frames = 0;
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  const go = () => (window.requestIdleCallback || setTimeout)(boot, { timeout: 400 });   // after first paint, so page transitions aren't held up
  // one shared three.js (0.152.2) for every script on the page, so the About sky and Zoltbot never load two copies
  if (window.THREE && THREE.CapsuleGeometry) go();
  else {
    const q = window.__zbThreeQ = window.__zbThreeQ || [];
    q.push(go);
    if (q.length === 1) { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js'; s.onload = () => q.splice(0).forEach(f => f()); document.head.appendChild(s); }
  }
})();
