/* zb-splash — first-visit splash for zoltonbaize.com
   Flies over a raymarched cloud sea, condenses the Z mark out of vapor into liquid glass,
   then zooms through it to reveal the page. Leaves a cloud sea along the bottom of the screen, like the splash's,
   baked once from the same cloud engine into two seamless strips that drift slowly behind the content.
   Plays once per browser session; skipped for prefers-reduced-motion. Force a replay with ?splash
   Needs WebGL2. Loads three.js r128 from cdnjs. */
(function () {
  'use strict';
  if (window.__zbSplash) return; window.__zbSplash = true;
  const html = document.documentElement;
  const SEEN_KEY = 'zbSplashSeen';
  const force = /[?&]splash\b/.test(location.search);
  let seen = false; try { seen = sessionStorage.getItem(SEEN_KEY) === '1'; } catch (e) {}
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wantSplash = force || (!seen && !reduce);
  const clearCover = () => html.classList.remove('zb-splash-pending');
  let hiRes = Math.min(innerWidth, innerHeight) >= 700;
  const isDark = () => {
    const sky = document.querySelector('zb-sky');
    if (sky && sky.hasAttribute('night')) { const v = sky.getAttribute('night'); return v !== '0' && v !== 'false'; }
    return matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // ---------- DOM ----------
  const css = document.createElement('style');
  css.textContent = [
    '#zb-splash{position:fixed;inset:0;z-index:2147483000;background:linear-gradient(180deg,#0b5cc6,#6ccaf0 55%,#e9f6fd);cursor:pointer}',
    '#zb-splash.live{background:transparent}',
    '#zb-splash canvas{position:absolute;inset:0;width:100%;height:100%;display:block}',
    '#zb-splash-hint{position:absolute;left:50%;bottom:calc(28px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);font:12px ui-monospace,"SF Mono",Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.88);text-shadow:0 1px 8px rgba(7,40,61,.5);opacity:0;transition:opacity 300ms ease-out;white-space:nowrap;pointer-events:none}',
    '#zb-splash-hint.on{opacity:1}',
    '#zb-deck{position:fixed;left:0;right:0;bottom:0;height:clamp(150px,34vh,380px);z-index:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity 900ms cubic-bezier(.2,.8,.2,1)}',
    '#zb-deck.on{opacity:1}',
    '#zb-deck i{position:absolute;left:0;right:0;bottom:0;background-repeat:repeat-x;background-position:0 100%;will-change:background-position}',
    '#zb-deck .back{height:78%;bottom:16%;opacity:.8;filter:blur(.6px)}',
    '#zb-deck .front{height:72%;bottom:-6%}',
    '#zb-deck.night i{filter:brightness(.42) sepia(.55) hue-rotate(170deg) saturate(2.2);opacity:.9}',
    '#zb-deck.night .back{filter:brightness(.36) sepia(.55) hue-rotate(170deg) saturate(2) blur(.6px);opacity:.7}'
  ].join('');
  document.head.appendChild(css);
  let splash = null, canvas, hint;
  if (wantSplash) {
    splash = document.createElement('div');
    splash.id = 'zb-splash';
    splash.setAttribute('role', 'presentation');
    splash.innerHTML = '<canvas></canvas><div id="zb-splash-hint">Click or press any key to skip</div>';
    document.body.appendChild(splash);
    canvas = splash.querySelector('canvas');
    hint = splash.querySelector('#zb-splash-hint');
  } else {
    canvas = document.createElement('canvas');
    hint = document.createElement('div');
  }
  const deck = document.createElement('div');
  deck.id = 'zb-deck'; deck.setAttribute('aria-hidden', 'true');
  deck.innerHTML = '<i class="back"></i><i class="front"></i>';
  { const sky = document.querySelector('zb-sky');           // just above the sky, below the page content
    if (sky && sky.parentNode) sky.parentNode.insertBefore(deck, sky.nextSibling); else document.body.insertBefore(deck, document.body.firstChild); }

  function bail() { clearCover(); if (splash) splash.remove(); }
  function loadThree(cb) {
    if (window.THREE && THREE.DataTexture3D) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb; s.onerror = bail;
    document.head.appendChild(s);
  }

  loadThree(function () {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { bail(); return; }
  renderer.setClearColor(0x000000, 0);
  if (!renderer.capabilities.isWebGL2) { bail(); renderer.dispose(); return; }
  // ---------- Tileable 3D Worley-FBM noise ----------
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
        const dx = gx + pts[o] - px, dy = gy + pts[o + 1] - py, dz = gz + pts[o + 2] - pz;
        const d = dx * dx + dy * dy + dz * dz; if (d < best) best = d;
      }
      out[x + y * N + z * N * N] = Math.min(Math.sqrt(best), 1);
    }
    return out;
  }
  const w1 = worley(4, 11), w2 = worley(8, 23), w3 = worley(16, 37);
  const nd = new Uint8Array(N * N * N);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.max(0, Math.min(255, Math.round(((1 - w1[i]) * 0.625 + (1 - w2[i]) * 0.25 + (1 - w3[i]) * 0.125) * 255)));
  const noiseTex = new THREE.DataTexture3D(nd, N, N, N);
  noiseTex.format = THREE.RedFormat; noiseTex.type = THREE.UnsignedByteType;
  noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter;
  noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping;
  noiseTex.unpackAlignment = 1; noiseTex.needsUpdate = true;

  const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
  const COMMON = /* glsl */`
    float hg(float c, float g){ float g2 = g*g; return (1.-g2) / (12.566 * pow(1. + g2 - 2.*g*c, 1.5)); }
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0., 1.); }
  `;

  // ---------- Pass 1: fly-through sky + cloud field + cloud-formed Z (raymarched to a half-res target) ----------
  const skyU = {
    uNoise: { value: noiseTex }, uTime: { value: 0 }, uFrame: { value: 0 },
    uCam: { value: new THREE.Vector3() }, uInvVP: { value: new THREE.Matrix4() }, uZInv: { value: new THREE.Matrix4() },
    uSun: { value: new THREE.Vector3(0.62, 0.38, -0.68).normalize() }, uSunCol: { value: new THREE.Color() },
    uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uAmb: { value: 1 },
    uGather: { value: 0 }, uZCloud: { value: 0 }, uCov: { value: 0.6 }, uStep: { value: 0.7 }, uMaxSteps: { value: 160 }
  };
  const SKY_FS = /* glsl */`
    precision highp float; precision highp sampler3D;
    uniform sampler3D uNoise;
    uniform float uTime, uFrame, uGather, uZCloud, uCov, uAmb, uStep, uMaxSteps;
    uniform vec3 uCam, uSun, uSunCol, uZenith, uHorizon;
    uniform mat4 uInvVP, uZInv;
    varying vec2 vUv;
    ${COMMON}
    float sdTri(vec2 p, vec2 p0, vec2 p1, vec2 p2){
      vec2 e0=p1-p0, e1=p2-p1, e2=p0-p2, v0=p-p0, v1=p-p1, v2=p-p2;
      vec2 q0=v0-e0*clamp(dot(v0,e0)/dot(e0,e0),0.,1.);
      vec2 q1=v1-e1*clamp(dot(v1,e1)/dot(e1,e1),0.,1.);
      vec2 q2=v2-e2*clamp(dot(v2,e2)/dot(e2,e2),0.,1.);
      float s = sign(e0.x*e2.y - e0.y*e2.x);
      vec2 d = min(min(vec2(dot(q0,q0), s*(v0.x*e0.y-v0.y*e0.x)), vec2(dot(q1,q1), s*(v1.x*e1.y-v1.y*e1.x))), vec2(dot(q2,q2), s*(v2.x*e2.y-v2.y*e2.x)));
      return -sqrt(d.x)*sign(d.y);
    }
    // The mark, from the stylesheet: top 9,11 98,11 65,55 / bottom 2,89 91,89 35,46, centred and y-up. Round join (stroke 6) = offset 3.
    float sdMark(vec2 p){
      return min(sdTri(p, vec2(-41.,39.), vec2(48.,39.), vec2(15.,-5.)), sdTri(p, vec2(-48.,-39.), vec2(41.,-39.), vec2(-15.,4.))) - 3.;
    }
    // Cloud sea: a deck of billowing tops below the camera, like the About page footage.
    float fieldD(vec3 p){
      if (p.y > 4.2) return 0.;
      vec3 drift = vec3(0.012, 0., 0.)*uTime;
      float n1 = texture(uNoise, p*vec3(0.028, 0.05, 0.028) + drift).r;
      float n2 = texture(uNoise, p*0.1 + drift*2.).r;
      float top = -2.7 + n1*4.4 + (n2 - 0.5)*1.5;
      float d = clamp((top - p.y)*2.2, 0., 1.);
      float er = texture(uNoise, p*0.32 + vec3(0., -0.05, 0.)*uTime).r;
      d = clamp(d - (1. - er)*0.4*(1. - d), 0., 1.);
      float r = length(vec2(p.x, p.y - 2.4));
      float lane = smoothstep(22., 10., p.z) * smoothstep(-30., -14., p.z);
      return d * mix(1., smoothstep(2.0, 4.8, r), lane*0.85);
    }
    float zD(vec3 p){
      if (uZCloud <= 0.001) return 0.;
      vec3 l = (uZInv * vec4(p, 1.)).xyz;
      if (abs(l.z) > 45. || abs(l.x) > 95. || abs(l.y) > 85.) return 0.;
      float n = texture(uNoise, l*0.011 + vec3(0.01, 0.02, 0.06)*uTime).r;
      float sd = max(sdMark(l.xy), abs(l.z) - 6.);
      sd += (n - 0.55) * mix(46., 5., uGather);
      return smoothstep(7., -5., sd) * uZCloud * 4.;
    }
    // Scattered cumulus floating above the sea, spread wide with flat bases.
    float upperD(vec3 p){
      if (p.y < 4.6 || p.y > 13.) return 0.;
      float band = smoothstep(4.6, 5.3, p.y) * (1. - smoothstep(8.5, 13., p.y));
      vec3 drift = vec3(0.02, 0., 0.)*uTime;
      float n = texture(uNoise, p*vec3(0.022, 0.04, 0.022) + vec3(0.37, 0.11, 0.53) + drift).r * 0.7
              + texture(uNoise, p*0.11 + drift*2.).r * 0.3;
      float d = smoothstep(0.6, 0.74, n) * band;
      float r = length(vec2(p.x, p.y - 2.4));
      float lane = smoothstep(26., 10., p.z) * smoothstep(-30., -14., p.z);
      return d * mix(1., smoothstep(4., 7.5, r), lane);
    }
    // Loose clouds at camera height that rush past early in the flight (the first version's fly-through feel).
    float midD(vec3 p){
      if (p.z < 14. || p.y < 0.6 || p.y > 5.5) return 0.;
      float band = smoothstep(0.6, 1.4, p.y) * (1. - smoothstep(4., 5.5, p.y)) * smoothstep(14., 20., p.z);
      float n = texture(uNoise, p*0.05 + vec3(0.71, 0.29, 0.13) + vec3(0.02, 0., 0.)*uTime).r * 0.72
              + texture(uNoise, p*0.15).r * 0.28;
      float d = smoothstep(0.58, 0.72, n) * band;
      float r = length(vec2(p.x, p.y - 2.0));
      return d * smoothstep(0.6, 1.8, r);
    }
    float density(vec3 p){ return fieldD(p) * 2.2 + upperD(p) * 2. + midD(p) * 1.8 + zD(p); }
    float lightOD(vec3 p){
      float od = 0., st = 0.5;
      for (int i = 0; i < 3; i++){ p += uSun*st; od += density(p)*st; st *= 1.9; }
      return od;
    }
    vec3 sky(vec3 rd){
      float h = max(rd.y, 0.);
      vec3 c = mix(uHorizon, uZenith, pow(h, 0.38));
      if (rd.y < 0.) c = mix(uHorizon, uHorizon*0.85, clamp(-rd.y*2.5, 0., 1.));
      float s = max(dot(rd, uSun), 0.);
      return c + uSunCol * (pow(s, 600.)*6. + pow(s, 5.)*0.32);
    }
    void main(){
      vec4 wp = uInvVP * vec4(vUv*2.-1., 1., 1.);
      vec3 ro = uCam, rd = normalize(wp.xyz/wp.w - uCam);
      vec3 col = sky(rd);
      float mu = dot(rd, uSun);
      float phase = mix(hg(mu, 0.65), hg(mu, -0.2), 0.45);
      vec3 ambTop = mix(vec3(1.), uHorizon, 0.2) * 1.05;
      vec3 ambBot = ambTop * vec3(0.4, 0.56, 0.84);
      float T = 1.; vec3 L = vec3(0.);
      float t = 0.05 + 0.2*hash(gl_FragCoord.xy + fract(uFrame*0.618)*100.);
      for (int i = 0; i < 160; i++){
        if (t > 115. || T < 0.015 || float(i) >= uMaxSteps) break;
        float dt = (0.12 + t*0.03) * uStep;
        vec3 p = ro + rd*t;
        float d = density(p);
        if (d > 0.003){
          float od = lightOD(p);
          float beer = max(exp(-od*1.4), exp(-od*0.3)*0.34);
          float powder = 1. - exp(-d*2.2);
          vec3 sunL = uSunCol * beer * phase * mix(1., powder, 0.45) * 12.;
          vec3 amb = mix(ambBot, ambTop, clamp((p.y + 2.8)/5., 0., 1.)) * uAmb;
          float Tr = exp(-d*dt*1.4);
          float fog = 1. - exp(-t*0.011);
          L += T * mix(sunL + amb, uHorizon*1.15, fog) * (1. - Tr);
          T *= Tr;
        }
        t += dt;
      }
      col = col*T + L;
      col = pow(aces(col*1.05), vec3(1./2.2));
      gl_FragColor = vec4(col, 1.);
    }
  `;
  const skyMat = new THREE.ShaderMaterial({ uniforms: skyU, vertexShader: QUAD_VS, fragmentShader: SKY_FS, depthTest: false, depthWrite: false });
  const skyScene = new THREE.Scene();
  const skyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), skyMat); skyQuad.frustumCulled = false; skyScene.add(skyQuad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let skyRT = new THREE.WebGLRenderTarget(4, 4, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });

  // ---------- Pass 2: composite + liquid glass Z ----------
  const mainScene = new THREE.Scene();
  const copyMat = new THREE.ShaderMaterial({
    uniforms: { uSky: { value: skyRT.texture } }, vertexShader: QUAD_VS,
    fragmentShader: 'uniform sampler2D uSky; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(uSky, vUv).rgb, 1.); }',
    depthTest: false, depthWrite: false
  });
  const copyQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat);
  copyQuad.frustumCulled = false; copyQuad.renderOrder = 0; mainScene.add(copyQuad);

  // Mark geometry: each triangle offset by 3 units with round corners (the stroke-6 round join), extruded with a soft bevel.
  const TRI = [[[9, 11], [98, 11], [65, 55]], [[2, 89], [91, 89], [35, 46]]].map(t => t.map(([x, y]) => [x - 50, 50 - y]));
  function roundedTri(pts, r) {
    const P = pts.slice();
    const area = (P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]);
    if (area < 0) P.reverse();
    const shape = new THREE.Shape();
    let first = true;
    for (let i = 0; i < 3; i++) {
      const prev = P[(i + 2) % 3], v = P[i], next = P[(i + 1) % 3];
      const d0x = v[0] - prev[0], d0y = v[1] - prev[1], d1x = next[0] - v[0], d1y = next[1] - v[1];
      const a0 = Math.atan2(-d0x, d0y);          // outward normal of incoming edge (CCW)
      let a1 = Math.atan2(-d1x, d1y);            // outward normal of outgoing edge
      while (a1 < a0) a1 += Math.PI * 2;
      for (let k = 0; k <= 8; k++) {
        const a = a0 + (a1 - a0) * k / 8, x = v[0] + r * Math.cos(a), y = v[1] + r * Math.sin(a);
        if (first) { shape.moveTo(x, y); first = false; } else shape.lineTo(x, y);
      }
    }
    return shape;
  }
  const markGeo = new THREE.ExtrudeGeometry(TRI.map(t => roundedTri(t, 3)), {
    depth: 6, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.2, bevelSegments: 6, curveSegments: 4
  });
  markGeo.translate(0, 0, -3);

  const glassU = {
    uSky: { value: skyRT.texture }, uRes: { value: new THREE.Vector2(1, 1) },
    uGlass: { value: 0 }, uReveal: { value: 0 }, uSunV: { value: new THREE.Vector3(0, 1, 0) },
    uA: { value: new THREE.Color('#00BEFF') }, uB: { value: new THREE.Color('#00E0B8') }, uNight: { value: 0 }
  };
  const glassMat = new THREE.ShaderMaterial({
    uniforms: glassU, blending: THREE.NoBlending, depthTest: true, depthWrite: true,
    vertexShader: /* glsl */`
      varying vec3 vNv; varying vec3 vPv; varying vec2 vL;
      void main(){
        vL = position.xy;
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vPv = mv.xyz; vNv = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uSky; uniform vec2 uRes; uniform float uGlass, uReveal, uNight;
      uniform vec3 uSunV, uA, uB;
      varying vec3 vNv; varying vec3 vPv; varying vec2 vL;
      void main(){
        vec3 n = normalize(vNv), v = normalize(-vPv);
        float ndv = clamp(dot(n, v), 0., 1.);
        float fres = pow(1. - ndv, 2.4);
        vec2 uv = gl_FragCoord.xy / uRes;
        vec2 off = n.xy * (0.035 + 0.06*fres);
        vec3 refr = vec3(texture2D(uSky, uv - off*1.12).r, texture2D(uSky, uv - off).g, texture2D(uSky, uv - off*0.88).b);
        vec3 base = texture2D(uSky, uv).rgb;
        float g = clamp(((vL.x + 50.) + (50. - vL.y)) / 200., 0., 1.);   // 135deg, top-left to bottom-right
        vec3 tint = mix(uA, uB, g);
        vec3 r = reflect(-v, n);
        float sd = max(dot(r, uSunV), 0.);
        float spec = pow(sd, 90.) * mix(1.6, 0.8, uNight) + pow(sd, 10.) * 0.1;
        vec3 col = refr * mix(vec3(1.), tint, 0.18) * 1.04;
        col += tint * fres * 0.45;
        col += vec3(1.) * (spec + pow(fres, 5.) * 0.4);
        col = mix(base, col, uGlass);
        float a = mix(1., clamp(fres*0.95 + spec, 0., 1.) * 0.9, uReveal);
        gl_FragColor = vec4(col * a, a);
      }`
  });
  const markMesh = new THREE.Mesh(markGeo, glassMat);
  markMesh.renderOrder = 1;
  const zGroup = new THREE.Group();
  zGroup.add(markMesh);
  zGroup.scale.setScalar(0.0625);           // 100 logo units = 6.25 world units
  zGroup.position.set(0, 2.4, 0);
  mainScene.add(zGroup);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);

  // Zoom target: incenter of the top stroke, the deepest point inside the mark.
  const [TA, TB, TC] = TRI[0];
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const la = dist(TB, TC), lb = dist(TC, TA), lc = dist(TA, TB), ls = la + lb + lc;
  const INC = new THREE.Vector3((la * TA[0] + lb * TB[0] + lc * TC[0]) / ls, (la * TA[1] + lb * TB[1] + lc * TC[1]) / ls, 0);
  zGroup.rotation.set(0, 0, 0); zGroup.updateMatrixWorld(true);
  const W = zGroup.localToWorld(INC.clone());
  const ZC = zGroup.position.clone();

  // ---------- Bottom cloud sea: baked once from the same cloud engine ----------
  // Orthographic across x (so each strip tiles seamlessly), perspective in y: a cloud deck seen from just above.
  const DECK_FS = /* glsl */`
    precision highp float; precision highp sampler3D;
    uniform sampler3D uNoise; uniform vec3 uSeed; uniform float uTop, uPitch;
    varying vec2 vUv;
    ${COMMON}
    const float WID = 24.;
    float density(vec3 p, bool det){
      float big = texture(uNoise, vec3(p.x / WID, 0.31, p.z / WID) + uSeed).r;            // slow swells, one per strip
      float mid = texture(uNoise, vec3(p.x / 8., 0.57, p.z / 8.) + uSeed * 1.7).r;          // billows, 3 per strip
      float n = texture(uNoise, p / 8. + uSeed).r;
      float top = uTop + (big - 0.55) * 3.2 + (mid - 0.55) * 2.6 + (n - 0.55) * 1.2;       // rolling, billowing cloud tops
      float shape = clamp((top - p.y) * 0.7, 0., 1.) * smoothstep(-2.6, -1.4, p.y);
      if (det) n = mix(n, texture(uNoise, p / 2.6666667 + uSeed * 2.3).r, 0.4);
      float er = (1. - n) * 0.85;
      return clamp((shape - er) / (1. - er + 1e-3), 0., 1.) * 2.2;
    }
    void main(){
      const vec3 SUN = normalize(vec3(-0.35, 0.8, 0.45));
      vec3 ro = vec3((vUv.x - 0.5) * WID, 3.4, 9.);
      vec3 rd = normalize(vec3(0., (vUv.y * 2. - 1.) * 0.3 - uPitch, -1.));
      float T = 1.; vec3 L = vec3(0.); float hit = 1e4;
      // march only through the slab y in [-2.6, 2.8]
      float ty0 = (3.3 - ro.y) / rd.y, ty1 = (-2.6 - ro.y) / rd.y;
      float ta = max(0., min(ty0, ty1)), tb = min(60., max(ty0, ty1));
      if (rd.y > 0.) { ta = 0.; tb = min(60., ty0); }
      if (tb > ta){
        float dt = (tb - ta) / 120., t = ta + dt * hash(gl_FragCoord.xy);
        float mu = dot(rd, SUN), phase = mix(hg(mu, 0.6), hg(mu, -0.2), 0.45);
        for (int i = 0; i < 120; i++){
          vec3 p = ro + rd * t;
          float d = density(p, true);
          if (d > 0.002){
            hit = min(hit, t);
            float od = 0., st = 0.22; vec3 q = p;
            for (int j = 0; j < 5; j++){ q += SUN * st; od += density(q, false) * st; st *= 1.5; }
            float beer = max(exp(-od * 1.6), exp(-od * 0.35) * 0.3);
            float powder = 1. - exp(-d * 2.2);
            vec3 sunL = vec3(1., 0.97, 0.92) * beer * phase * mix(1., powder, 0.7) * 20.;
            vec3 amb = mix(vec3(0.36, 0.5, 0.74), vec3(0.9, 0.95, 1.), clamp((p.y + 0.6) / 4., 0., 1.)) * 0.6;
            float Tr = exp(-d * dt * 1.25);
            L += T * (sunL + amb) * (1. - Tr); T *= Tr;
          }
          t += dt;
          if (T < 0.01) break;
        }
      }
      float a = 1. - T;
      // distant tops melt into the sky haze; the top of the strip fades out
      a *= smoothstep(58., 18., hit) * smoothstep(1.0, 0.8, vUv.y);
      vec3 col = pow(aces(L / max(a, 1e-3) * 1.05), vec3(1./2.2));
      gl_FragColor = vec4(col, smoothstep(0.02, 1., a));
    }
  `;
  function bakeDeck() {
    const PW = 1536, PH = 384, urls = [];
    const rt = new THREE.WebGLRenderTarget(PW, PH, { depthBuffer: false });
    const mat = new THREE.ShaderMaterial({ uniforms: { uNoise: { value: noiseTex }, uSeed: { value: new THREE.Vector3() }, uTop: { value: 0.4 }, uPitch: { value: 0.18 } }, vertexShader: QUAD_VS, fragmentShader: DECK_FS, depthTest: false, depthWrite: false });
    const sc = new THREE.Scene(); const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat); q.frustumCulled = false; sc.add(q);
    const buf = new Uint8Array(PW * PH * 4), c2 = document.createElement('canvas'); c2.width = PW; c2.height = PH;
    const ctx = c2.getContext('2d'), img = ctx.createImageData(PW, PH);
    [[0.11, 0.07, 0.29, 0.9, 0.22], [0.43, 0.19, 0.61, 0.55, 0.12]].forEach(([sx, sy, sz, top, pitch]) => {   // front, back
      mat.uniforms.uSeed.value.set(sx, sy, sz); mat.uniforms.uTop.value = top; mat.uniforms.uPitch.value = pitch;
      renderer.setRenderTarget(rt); renderer.render(sc, quadCam); renderer.setRenderTarget(null);
      renderer.readRenderTargetPixels(rt, 0, 0, PW, PH, buf);
      for (let y = 0; y < PH; y++) img.data.set(buf.subarray((PH - 1 - y) * PW * 4, (PH - y) * PW * 4), y * PW * 4);
      ctx.putImageData(img, 0, 0);
      urls.push(c2.toDataURL('image/png'));
    });
    rt.dispose(); mat.dispose();
    return urls;
  }
  let layers = [];
  function buildDeck(urls) {
    const [front, back] = [deck.querySelector('.front'), deck.querySelector('.back')];
    front.style.backgroundImage = 'url(' + urls[0] + ')'; back.style.backgroundImage = 'url(' + urls[1] + ')';
    layers = [{ el: front, speed: 7 }, { el: back, speed: 3.5 }];   // px per second: the back layer drifts slower (depth)
    requestAnimationFrame(() => deck.classList.add('on'));
  }
  function updateDeck(time) {
    deck.classList.toggle('night', isDark());
    const h = deck.clientHeight;
    layers.forEach(({ el, speed }) => {
      const th = el.clientHeight || h, tw = th * (1536 / 384);        // keep the strip's aspect so it tiles
      el.style.backgroundSize = tw + 'px ' + th + 'px';
      el.style.backgroundPosition = (reduce ? 0 : -(time * speed) % tw) + 'px 100%';
    });
  }

  // ---------- Theme ----------
  const sunDir = skyU.uSun.value;
  function applyTheme() {
    const night = isDark();
    const L = h => new THREE.Color(h).convertSRGBToLinear();
    skyU.uZenith.value.copy(L(night ? '#030914' : '#0b5cc6'));
    skyU.uHorizon.value.copy(L(night ? '#16294d' : '#6ccaf0'));
    skyU.uSunCol.value.setRGB(...(night ? [0.24, 0.29, 0.4] : [1.0, 0.96, 0.9]));
    skyU.uAmb.value = night ? 0.32 : 1;
    glassU.uNight.value = night ? 1 : 0;
  }

  // ---------- Sizing ----------
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, hiRes ? 2 : 1.5);
    skyU.uStep.value = hiRes ? 0.7 : 1; skyU.uMaxSteps.value = hiRes ? 160 : 110;
    renderer.setPixelRatio(dpr);
    renderer.setSize(innerWidth, innerHeight, false);
    const v = new THREE.Vector2(); renderer.getDrawingBufferSize(v);
    glassU.uRes.value.copy(v);
    const rs = hiRes ? 1 : 0.5;
    skyRT.setSize(Math.ceil(v.x * rs), Math.ceil(v.y * rs));
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', () => { if (playing) resize(); });

  // ---------- Timeline (seconds) ----------
  const END = 2.2;
  const clamp01 = x => Math.max(0, Math.min(1, x));
  const seg = (t, a, b) => clamp01((t - a) / (b - a));
  const eOut = x => 1 - Math.pow(1 - x, 3);
  const eIn = x => Math.pow(x, 2.6);
  const eInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), look = new THREE.Vector3(), zEnd = W.clone().add(new THREE.Vector3(0, 0, 0.9));

  function pose(t) {
    // Fly forward through the cloud layer, easing out as the Z gathers ahead.
    const fly = eOut(seg(t, 0, 1.4)), sway = 1 - fly;
    // Skim low over the cloud sea, rising to meet the mark.
    tmpA.set(0.6 * Math.sin(t * 2.1) * sway, 1.5 + 1.0 * fly + 0.12 * Math.sin(t * 1.3) * sway, 36 + (13 - 36) * fly);
    // Zoom through the top stroke of the mark.
    const zoom = eIn(seg(t, 1.45, 2.1));
    camera.position.lerpVectors(tmpA, zEnd, zoom);
    tmpB.set(tmpA.x * 0.3, tmpA.y - 3.4, 0);                 // pitched down: horizon in the upper third
    look.lerpVectors(tmpB, ZC, eInOut(seg(t, 0.55, 1.35)));
    look.lerp(W, eInOut(seg(t, 1.45, 1.9)));
    camera.up.set(0, 1, 0);
    camera.lookAt(look);
    camera.rotateZ(0.07 * Math.sin(t * 1.6) * sway);
    camera.fov = 45 + 12 * zoom; camera.updateProjectionMatrix();
    camera.updateMatrixWorld();

    // Vapor gathers into the mark, the glass condenses out of it, then the cloud burns off.
    const settle = eInOut(seg(t, 0.4, 1.45));
    zGroup.rotation.set(-0.12 * (1 - settle), 0.55 * (1 - settle), 0);
    zGroup.updateMatrixWorld(true);
    skyU.uGather.value = eInOut(seg(t, 0.3, 1.05));
    skyU.uZCloud.value = eOut(seg(t, 0.2, 0.6)) * (1 - eInOut(seg(t, 1.0, 1.4)));
    glassU.uGlass.value = eInOut(seg(t, 0.95, 1.3));
    glassU.uReveal.value = eInOut(seg(t, 1.6, 1.9));
    markMesh.visible = glassU.uGlass.value > 0.001;

    skyU.uCam.value.copy(camera.position);
    skyU.uInvVP.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    skyU.uZInv.value.copy(zGroup.matrixWorld).invert();
    skyU.uTime.value = t + 10;
    skyU.uFrame.value++;
    glassU.uSunV.value.copy(sunDir).transformDirection(camera.matrixWorldInverse);
    canvas.style.opacity = String(1 - seg(t, 2.0, END));
    hint.classList.toggle('on', t > 0.35 && t < 1.8);
  }
  function draw(t) {
    pose(t);
    renderer.setRenderTarget(skyRT); renderer.render(skyScene, quadCam);
    renderer.setRenderTarget(null); renderer.clear(); renderer.render(mainScene, camera);
  }

  // ---------- Playback ----------
  let playing = false, skipping = false, t = 0, last = 0;
  function release() {
    // Free the GPU for the page's own sky once the splash is done.
    try { renderer.dispose(); renderer.forceContextLoss(); } catch (e) {}
  }
  function finish() {
    playing = false; skipping = false;
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch (e) {}
    if (splash) splash.remove();
    clearCover();
    removeEventListener('keydown', onKey);
    release();
  }
  function skip() {
    if (!playing || skipping) return;
    skipping = true;
    splash.style.transition = 'opacity 300ms cubic-bezier(.2,.8,.2,1)';
    splash.style.opacity = '0';
    setTimeout(finish, 320);
  }
  function onKey() { skip(); }
  function tick(now) {
    if (!playing) return;
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!skipping) t += dt;
    draw(Math.min(t, END));
    if (t >= END && !skipping) { finish(); return; }
    requestAnimationFrame(tick);
  }

  // ---------- Boot ----------
  try { buildDeck(bakeDeck()); } catch (e) { console.warn('[zb-splash] cloud deck', e); }
  const loop = now => { updateDeck(now / 1000); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  if (!splash) { release(); return; }
  applyTheme(); resize();
  scrollTo(0, 0);
  splash.addEventListener('pointerdown', skip);
  splash.addEventListener('wheel', skip, { passive: true });
  splash.addEventListener('touchstart', skip, { passive: true });
  addEventListener('keydown', onKey);
  draw(0);
  splash.classList.add('live');
  clearCover();
  playing = true; last = performance.now();
  requestAnimationFrame(tick);
  });
})();
