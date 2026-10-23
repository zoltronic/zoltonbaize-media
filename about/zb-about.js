/* zb-about — About page sky for zoltonbaize.com (placeholder before the full scroll story).
   One raymarched cumulus (the "Cumulus Raymarch" prototype, tuned settings below) fills the screen behind the content
   and parallaxes with scroll: as you read down, the camera climbs and swings slowly around the cloud.
   The canvas is named zb-sky for page transitions, so Work -> About plays as the view panning right across the sky.
   Needs WebGL2; without it the page keeps a plain sky gradient. Loads three.js r128 from cdnjs. */
(function () {
  'use strict';
  if (window.__zbAbout) return; window.__zbAbout = true;
  const SETTINGS = Object.assign({
    sunHeight: 37, sunAzimuth: 68, sunIntensity: 1.15,
    coverage: 0.29, density: 5.5, size: 1.22, billowScale: 0.225, detail: 0.46, detailScale: 0.54,
    absorption: 2.5, multiScatter: 0.5, silver: 0.37, ambient: 1.45, exposure: 1.4,
    zenith: '#0b3a8f', horizon: '#4f86d1', warmSunset: true,
    speed: 1, autoOrbit: true, fov: 42, quality: 90
  }, window.ZB_ABOUT_CLOUDS || {});
  const NIGHT = { zenith: '#030814', horizon: '#14223d', sunIntensity: 0.35, ambient: 0.55, exposure: 1.1, warmSunset: false };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(pointer: coarse)').matches;

  // Fallback sky (and the colour you see for the split second before WebGL draws)
  const css = document.createElement('style');
  css.textContent = [
    'html.zb-about{background:#4f86d1}',
    '#zb-about-sky{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(180deg,#0b3a8f,#4f86d1);view-transition-name:zb-sky}',
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
    try { const t = localStorage.getItem('zbTheme'); if (t) return t === 'dark'; } catch (e) {}
    return false;   // day sky unless the visitor chose night with the toggle
  }

  function boot() {
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
    const noiseTex = new THREE.DataTexture3D(data, N, N, N);
    noiseTex.format = THREE.RedFormat; noiseTex.type = THREE.UnsignedByteType;
    noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter;
    noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping;
    noiseTex.unpackAlignment = 1; noiseTex.needsUpdate = true;

    const BASE = [[0.0, 0.4, 0.0, 2.2], [-2.2, 0.0, 0.4, 1.7], [2.3, 0.1, -0.2, 1.8], [-0.8, 1.9, 0.2, 1.6], [1.0, 2.3, -0.3, 1.5], [0.1, 3.4, 0.1, 1.2], [-3.8, -0.3, -0.2, 1.1], [3.9, -0.2, 0.5, 1.1], [0.5, 0.2, 1.8, 1.4]];
    const blobs = BASE.map(() => new THREE.Vector4());
    const uniforms = {
      uNoise: { value: noiseTex }, uTime: { value: 0 }, uFrame: { value: 0 },
      uCam: { value: new THREE.Vector3() }, uInvVP: { value: new THREE.Matrix4() },
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uBlobs: { value: blobs },
      uCoverage: { value: 0.55 }, uDensity: { value: 3 }, uScale: { value: 1 },
      uNoiseScale: { value: 0.11 }, uDetail: { value: 0.3 }, uDetailScale: { value: 0.38 },
      uSunI: { value: 1 }, uAbsorb: { value: 1.6 }, uMulti: { value: 0.28 }, uSilver: { value: 0.7 },
      uAmbient: { value: 1 }, uExposure: { value: 1.05 }, uSteps: { value: 90 },
      uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uWarm: { value: 1 }
    };
    const frag = /* glsl */`
    precision highp float;
    precision highp sampler3D;
    uniform sampler3D uNoise;
    uniform float uTime, uFrame, uCoverage, uDensity, uScale, uNoiseScale, uDetail, uDetailScale;
    uniform float uSunI, uAbsorb, uMulti, uSilver, uAmbient, uExposure, uSteps, uWarm;
    uniform vec3 uCam, uSun, uZenith, uHorizon;
    uniform mat4 uInvVP;
    uniform vec4 uBlobs[9];
    varying vec2 vUv;

    const vec3 BMIN = vec3(-6.2, -1.4, -4.4);
    const vec3 BMAX = vec3( 6.2,  5.4,  4.4);

    float smin(float a, float b, float k) { float h = clamp(.5 + .5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
    float sdCloud(vec3 p) { float d = 1e4; for (int i = 0; i < 9; i++) { vec4 b = uBlobs[i]; d = smin(d, length(p - b.xyz) - b.w, 1.0); } return d; }

    float density(vec3 wp, bool detail) {
      vec3 p = wp / uScale;
      float sd = sdCloud(p);
      if (sd > 0.9) return 0.;
      float shape = clamp(0.45 - sd * 0.55, 0., 1.);
      shape *= smoothstep(-1.3, -0.75, p.y);
      vec3 rise = vec3(0.010, -0.028, 0.006) * uTime;
      float n = texture(uNoise, p * uNoiseScale + rise).r;
      if (detail) n = mix(n, texture(uNoise, p * uDetailScale + rise * 2.4 + 0.37).r, uDetail);
      float er = (1. - n) * (1.15 - uCoverage);
      return clamp((shape - er) / (1. - er + 1e-3), 0., 1.) * uDensity;
    }

    float lightOD(vec3 p) {
      float od = 0., st = 0.25 * uScale;
      for (int i = 0; i < 6; i++) { p += uSun * st; od += density(p, false) * st; st *= 1.45; }
      return od;
    }

    float hg(float c, float g) { float g2 = g * g; return (1. - g2) / (12.566 * pow(1. + g2 - 2. * g * c, 1.5)); }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

    float lowSun() { return (1. - smoothstep(0.02, 0.4, uSun.y)) * uWarm; }
    vec3 sunColor() { return mix(vec3(1.0, 0.96, 0.9), vec3(1.0, 0.52, 0.28), lowSun()); }

    vec3 sky(vec3 rd) {
      float ls = lowSun();
      vec3 zen = mix(uZenith, uZenith * vec3(0.7, 0.6, 0.7), ls);
      vec3 hor = mix(uHorizon, vec3(0.95, 0.62, 0.45), ls * 0.8);
      float h = max(rd.y, 0.);
      vec3 c = mix(hor, zen, pow(h, 0.5));
      if (rd.y < 0.) c = mix(hor, hor * 0.55, clamp(-rd.y * 3., 0., 1.));
      float s = max(dot(rd, uSun), 0.);
      c += sunColor() * uSunI * (pow(s, 900.) * 12. + pow(s, 10.) * 0.25);
      return c;
    }

    vec2 box(vec3 ro, vec3 rd) {
      vec3 inv = 1. / rd, t0 = (BMIN * uScale - ro) * inv, t1 = (BMAX * uScale - ro) * inv;
      vec3 mn = min(t0, t1), mx = max(t0, t1);
      return vec2(max(max(mn.x, mn.y), mn.z), min(min(mx.x, mx.y), mx.z));
    }

    vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0., 1.); }
    vec3 toLinear(vec3 c) { return pow(c, vec3(2.2)); }

    void main() {
      vec4 wp = uInvVP * vec4(vUv * 2. - 1., 1., 1.);
      vec3 ro = uCam, rd = normalize(wp.xyz / wp.w - uCam);
      vec3 col = sky(rd);

      vec2 t = box(ro, rd);
      if (t.y > max(t.x, 0.)) {
        float t0 = max(t.x, 0.);
        float dt = max((t.y - t0) / uSteps, 0.05 * uScale);
        float tt = t0 + dt * hash(gl_FragCoord.xy + fract(uFrame * 0.618) * 100.);
        float T = 1.;
        vec3 L = vec3(0.);
        float mu = dot(rd, uSun);
        float phase = mix(hg(mu, uSilver), hg(mu, -0.2), 0.45);
        vec3 sc = sunColor() * uSunI * mix(0.55, 1.0, smoothstep(0.0, 0.35, uSun.y));
        float ls = lowSun();
        vec3 ambTop = mix(uZenith, uHorizon, 0.5) * 1.15 + 0.15;
        vec3 ambBot = ambTop * vec3(0.42, 0.45, 0.5);
        for (int i = 0; i < 160; i++) {
          if (tt > t.y || T < 0.01 || float(i) > uSteps * 1.5) break;
          vec3 p = ro + rd * tt;
          float d = density(p, true);
          if (d > 0.002) {
            float od = lightOD(p);
            float beer = max(exp(-od * uAbsorb), exp(-od * uAbsorb * 0.22) * uMulti);
            float powder = 1. - exp(-d * 2.2);
            vec3 sunL = sc * beer * phase * mix(1., powder, 0.55) * 14.;
            float hgt = clamp((p.y / uScale + 1.4) / 6.5, 0., 1.);
            vec3 amb = mix(ambBot, ambTop, hgt) * uAmbient * mix(0.85, 0.5, ls);
            float Tr = exp(-d * dt * 1.25 / uScale);
            L += T * (sunL + amb) * (1. - Tr);
            T *= Tr;
          }
          tt += dt;
        }
        col = col * T + L;
      }
      col = aces(col * uExposure);
      col = pow(col, vec3(1. / 2.2));
      vec2 q = vUv - 0.5;
      col *= 1. - dot(q, q) * 0.35;
      gl_FragColor = vec4(col, 1.);
    }
  `;
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }', fragmentShader: frag, depthTest: false, depthWrite: false });
    const scene = new THREE.Scene(); scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const cam = new THREE.PerspectiveCamera(SETTINGS.fov, 1, 0.1, 300);

    let night = isNight(), nightF = night ? 1 : 0;
    const cDay = { z: new THREE.Color(SETTINGS.zenith), h: new THREE.Color(SETTINGS.horizon) }, cNight = { z: new THREE.Color(NIGHT.zenith), h: new THREE.Color(NIGHT.horizon) };
    function apply() {
      const S = SETTINGS, n = nightF, mix = (a, b) => a + (b - a) * n;
      const e = S.sunHeight * Math.PI / 180, a = S.sunAzimuth * Math.PI / 180;
      uniforms.uSun.value.set(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)).normalize();
      uniforms.uSunI.value = mix(S.sunIntensity, NIGHT.sunIntensity);
      uniforms.uCoverage.value = S.coverage; uniforms.uDensity.value = S.density; uniforms.uScale.value = S.size;
      uniforms.uNoiseScale.value = S.billowScale; uniforms.uDetail.value = S.detail; uniforms.uDetailScale.value = S.detailScale;
      uniforms.uAbsorb.value = S.absorption; uniforms.uMulti.value = S.multiScatter; uniforms.uSilver.value = S.silver;
      uniforms.uAmbient.value = mix(S.ambient, NIGHT.ambient); uniforms.uExposure.value = mix(S.exposure, NIGHT.exposure);
      uniforms.uSteps.value = touch ? Math.min(S.quality, 64) : S.quality;
      uniforms.uZenith.value.copy(cDay.z).lerp(cNight.z, n).convertSRGBToLinear();
      uniforms.uHorizon.value.copy(cDay.h).lerp(cNight.h, n).convertSRGBToLinear();
      uniforms.uWarm.value = S.warmSunset && n < 0.5 ? 1 : 0;
      wrap.style.background = n > 0.5 ? 'linear-gradient(180deg,#030814,#14223d)' : '';
    }
    apply();
    // follow the site's light/dark toggle (it saves zbTheme) and the system setting
    addEventListener('storage', e => { if (e.key === 'zbTheme') night = isNight(); });
    setInterval(() => { night = isNight(); }, 1000);

    // adaptive resolution: the raymarch is heavy, so it renders below screen resolution and scales with the frame rate
    const maxScale = Math.min(devicePixelRatio || 1, 2) * (touch ? 0.5 : 0.75);
    let scale = Math.min(maxScale, touch ? 0.4 : 0.6);
    function resize() { renderer.setPixelRatio(scale); renderer.setSize(innerWidth, innerHeight, false); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); }
    addEventListener('resize', resize); resize();

    // scroll parallax: 0 at the top of the page, 1 at the bottom
    let sp = 0;
    const progress = () => { const max = document.documentElement.scrollHeight - innerHeight; return max > 4 ? Math.max(0, Math.min(1, scrollY / max)) : 0; };
    let last = performance.now(), acc = 0, frames = 0, simT = 40, yaw = 0.35, shown = false, visible = true;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) { last = performance.now(); requestAnimationFrame(frame); } });
    function frame(now) {
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.1); last = now;
      simT += dt * SETTINGS.speed * (reduce ? 0.3 : 1);
      if (SETTINGS.autoOrbit && !reduce) yaw += dt * 0.025;
      nightF += ((night ? 1 : 0) - nightF) * Math.min(1, dt * 3); apply();
      sp += (progress() - sp) * (reduce ? 1 : Math.min(1, dt * 6));   // background eases with the scroll: slower than the text = depth
      BASE.forEach((b, i) => {
        const s = 1 + 0.07 * Math.sin(simT * 0.09 + i * 1.7);
        const lift = i >= 3 && i <= 5 ? 0.25 * Math.sin(simT * 0.05 + i) : 0.1 * Math.sin(simT * 0.07 + i);
        blobs[i].set(b[0] + 0.15 * Math.sin(simT * 0.04 + i * 2.3), b[1] + lift, b[2], b[3] * s);
      });
      // scroll moves the camera: it climbs over the cloud, pitches down to look at its top and swings a quarter turn around it
      const S = SETTINGS.size, r = (15 + 5 * sp) * S, pitch = 0.08 + 0.42 * sp, y0 = yaw + 1.1 * sp;
      cam.position.set(Math.sin(y0) * Math.cos(pitch) * r, 1.2 * S + Math.sin(pitch) * r, Math.cos(y0) * Math.cos(pitch) * r);
      cam.lookAt(1.6 * S * (1 - sp), (1.3 + 1.6 * (1 - sp)) * S, 0);   // at the top the cloud sits low and to the side, leaving room for the headline
      cam.updateMatrixWorld();
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

  if (window.THREE && THREE.DataTexture3D) boot();
  else { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'; s.onload = boot; document.head.appendChild(s); }
})();
