/* Gold coin: the Direction 01 crypto coin, live, for the Selected work tile.
   Geometry is the real coin from the Blender file (lathe profile + raised ₵ front and back); each surface's gold
   gradient is evaluated per pixel from the source material's values. The lighting is the Direction 01 scene itself: its sky dome,
   warm tint and six area lights rendered from the coin's position into one 360° map (hdr/env_coin_d1_1k.hdr, in three's
   equirect axes, peaks capped at 2 the way EEVEE clamps the sun), so every reflection is the one the approved render had.
   Motion: one very slow full turn about the vertical axis plus a gentle float and wobble, paused off screen.
   Shine (as on the letters): bloom on the hot highlights, a soft light bar that sweeps across the face now and then,
   and four-point star sparkles that twinkle on the rim (as in the Direction 01 render). Reduced motion shows a still.
   Markup: <div class="gold_coin"></div>
   Knobs: window.GOLD_COIN_CONFIG { model, env, period, fill, exposure, tilt, angle, capture,
   floatAmount, floatSeconds, wobbleDegrees, wobbleSeconds, bloomStrength, bloomRadius, bloomThreshold, halo,
   sweepIntensity, sweepWidth, sweepEvery, sweepSeconds, sparkleEvery, sparkleSize, light: {...overrides in light mode} } — angle (deg) freezes the turn. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const BASE = window.GOLD_COIN_BASE || window.GOLD_HERO_BASE || './';
const CFG = Object.assign({
  model: 'coin/coin_d1.glb', env: 'hdr/env_coin_d1_1k.hdr',
  period: 28,          // seconds per full turn
  fill: 0.62,          // coin diameter as a fraction of the stage's shorter side
  exposure: 1.0,       // the source render used Blender's Standard view, so no tone mapping
  tilt: 0,             // degrees the coin leans back toward the camera
  rest: 24,            // still angle (deg) for reduced motion
  floatAmount: 0.06,   // float: up/down travel in coin radii, over floatSeconds
  floatSeconds: 4.2,
  wobbleDegrees: 5,    // a slow lean back and forth while it floats
  wobbleSeconds: 6.4,
  bloomStrength: 0.32, bloomRadius: 0.35, bloomThreshold: 1.5, halo: 0.5,   // only true hot spots bloom
  sweepIntensity: 3.5, sweepWidth: 0.25, sweepEvery: 6.5, sweepSeconds: 1.8,   // the light bar that passes over the face
  sparkleEvery: 1.3, sparkleSize: 0.5,                        // star glints on the rim
  light: { halo: 0, bloomStrength: 0.26 },                  // light pages: glow stays on the coin, no haze around it
  angle: null, capture: false,
}, Object.fromEntries(Object.entries(window.GOLD_COIN_CONFIG || {}).filter(([, v]) => v !== undefined)));
const D2R = Math.PI / 180;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const abs = p => /^https?:/.test(p) ? p : BASE + p;
const isLight = () => document.documentElement.getAttribute('data-mode') === 'light';
const knob = k => (isLight() && CFG.light && k in CFG.light) ? CFG.light[k] : CFG[k];
// same final pass as the letters: bloom where it is bright, coverage alpha kept so the page shows through around the coin
const OUT_FRAG = `uniform sampler2D tDiffuse; uniform sampler2D tBase; uniform float halo; varying vec2 vUv;
void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a;
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float a = clamp(a0 + (1.0 - a0) * lum * halo, 0.0, 1.0);
  c.rgb = mix(c.rgb * min(1.0, halo), c.rgb, a0);
  gl_FragColor = vec4(c.rgb, a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
// a four-point star: bright core, two long rays, two short diagonal ones
function starTexture() {
  const n = 128, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), m = n / 2;
  const core = g.createRadialGradient(m, m, 0, m, m, m * 0.42); core.addColorStop(0, 'rgba(255,255,255,1)'); core.addColorStop(0.25, 'rgba(255,244,220,.55)'); core.addColorStop(1, 'rgba(255,230,190,0)');
  g.fillStyle = core; g.fillRect(0, 0, n, n);
  function ray(angle, len, w, a) {
    g.save(); g.translate(m, m); g.rotate(angle);
    const gr = g.createLinearGradient(0, 0, len, 0); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, -w); g.lineTo(len, 0); g.lineTo(0, w); g.closePath(); g.fill(); g.restore();
  }
  for (let i = 0; i < 4; i++) { ray(i * Math.PI / 2, m * 0.98, 2.6, 1); ray(Math.PI / 4 + i * Math.PI / 2, m * 0.42, 1.6, 0.55); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);

// Each gold surface's base colour is the source material's gradient: Blender's Object/Generated coords -> Mapping ->
// linear Gradient -> ColorRamp collapses to t = k . localPosition + c, evaluated per pixel here (k already in three's axes).
// stops: [position, r, g, b] in linear RGB. Metallic 1 throughout; r is roughness.
const GOLD = {
  coin_field: { r: 0.24, k: [0.49881, -0.11516, 0.0], c: 0.5, stops: [[0.0, 0.9734, 0.7454, 0.4678], [0.55, 0.552, 0.3712, 0.1878], [1.0, 0.1812, 0.107, 0.0423]] },
  coin_bevel: { r: 0.025, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.9047, 0.7454, 0.4678], [1.0, 0.2307, 0.15, 0.0723]] },
  coin_rim: { r: 0.11, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.807, 0.6172, 0.3419], [1.0, 0.162, 0.1022, 0.0482]] },
  coin_edge: { r: 0.09, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.8714, 0.6867, 0.3916], [1.0, 0.2016, 0.1274, 0.0612]] },
  coin_C_side: { r: 0.05, k: [0.45862, -0.82231, 0.0], c: 0.5, stops: [[0.0, 0.9047, 0.7305, 0.4342], [1.0, 0.2159, 0.1384, 0.0648]] },
};
function material(name) {
  name = name.replace(/^gc_/, '').replace(/_D1$/, '');
  const g = GOLD[name];
  if (!g) // the ₵'s top face: matte cream with a little self-light, as in the source
    return new THREE.MeshStandardMaterial({ color: lin(1, 0.982, 0.939), roughness: 0.86, metalness: 0, emissive: lin(1, 1, 0.973), emissiveIntensity: 0.42 });
  const m = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: g.r });
  const st = [0, 1, 2].map(i => new THREE.Vector4(...(g.stops[Math.min(i, g.stops.length - 1)])));
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uK: { value: new THREE.Vector3(...g.k) }, uC: { value: g.c }, uS0: { value: st[0] }, uS1: { value: st[1] }, uS2: { value: st[2] } });
    sh.vertexShader = 'varying vec3 vCoinP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vCoinP = position;');
    sh.fragmentShader = 'varying vec3 vCoinP; uniform vec3 uK; uniform float uC; uniform vec4 uS0, uS1, uS2;\n' + sh.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
      float t = clamp(dot(uK, vCoinP) + uC, 0.0, 1.0);
      vec3 ramp = t <= uS1.x ? mix(uS0.yzw, uS1.yzw, clamp((t - uS0.x) / max(uS1.x - uS0.x, 1e-5), 0.0, 1.0))
                             : mix(uS1.yzw, uS2.yzw, clamp((t - uS1.x) / max(uS2.x - uS1.x, 1e-5), 0.0, 1.0));
      diffuseColor.rgb = ramp;`);
  };
  m.customProgramCacheKey = () => 'goldcoin';
  return m;
}

let shared = null;
function assets(renderer) {
  if (shared) return shared;
  const pmrem = new THREE.PMREMGenerator(renderer);
  shared = Promise.all([
    new GLTFLoader().loadAsync(abs(CFG.model)),
    new RGBELoader().loadAsync(abs(CFG.env)).then(t => { t.mapping = THREE.EquirectangularReflectionMapping; const e = pmrem.fromEquirectangular(t).texture; t.dispose(); pmrem.dispose(); return e; }),
  ]);
  return shared;
}

function setup(el) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!CFG.capture });
  const coarse = matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2)); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = CFG.exposure;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  const tilt = new THREE.Group(); tilt.rotation.x = CFG.tilt * D2R; scene.add(tilt);
  const bob = new THREE.Group(); tilt.add(bob);
  const spin = new THREE.Group(); bob.add(spin);
  const still = reduce || CFG.angle != null;

  // the light bar: a tall soft area light between the camera and the coin that slides across now and then
  RectAreaLightUniformsLib.init();
  const bar = new THREE.RectAreaLight(new THREE.Color(1, 0.95, 0.86), 0, CFG.sweepWidth, 6); scene.add(bar);
  function sweep(t) {
    const p = (t % CFG.sweepEvery) / CFG.sweepSeconds;
    if (still || p >= 1) { bar.intensity = 0; return; }
    const e = p * p * (3 - 2 * p);
    bar.position.set(-3 + 6 * e, 0.6, 3); bar.lookAt(0, 0, 0); bar.rotation.z = -0.35;
    bar.intensity = CFG.sweepIntensity * Math.sin(Math.PI * p);
  }

  // sparkles: a few star sprites that twinkle on the rim of whichever face is toward the camera
  // they live in their own scene drawn straight onto the canvas after the bloom chain, so additive light adds cleanly
  const fx = new THREE.Scene(), starTex = starTexture(), stars = [];
  for (let i = 0; i < 3; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: new THREE.Color(1, 0.93, 0.8), blending: THREE.AdditiveBlending, transparent: true, depthTest: false, depthWrite: false }));
    sp.visible = false; sp.userData = { born: -1, theta: 0, life: 0.75 }; fx.add(sp); stars.push(sp);
  }
  let nextStar = 1.2;
  const rimP = new THREE.Vector3(), faceN = new THREE.Vector3(), toCam = new THREE.Vector3();
  function rimPoint(theta, out) {
    // front face of the export is -Z (z = -0.125), back face +Z; pick the one facing the camera
    faceN.set(0, 0, -1).transformDirection(spin.matrixWorld);
    out.set(Math.cos(theta) * 0.93, Math.sin(theta) * 0.93, -0.125); spin.localToWorld(out);
    toCam.copy(camera.position).sub(out).normalize();
    let facing = faceN.dot(toCam);
    if (facing < 0) { out.set(Math.cos(theta) * 0.93, Math.sin(theta) * 0.93, 0.125); spin.localToWorld(out); facing = -facing; }
    return facing;
  }
  function sparkle(t) {
    if (still) { stars.forEach(s => (s.visible = false)); return; }
    if (t > nextStar) {
      const s = stars.find(x => !x.visible);
      if (s) { s.userData.born = t; s.userData.theta = (0.15 + Math.random() * 0.7) * Math.PI + (Math.random() < 0.25 ? Math.PI : 0); s.userData.rot = Math.random() * 0.6; s.visible = true; }
      nextStar = t + CFG.sparkleEvery * (0.6 + Math.random() * 0.8);
    }
    for (const s of stars) {
      if (!s.visible) continue;
      const u = s.userData, p = (t - u.born) / u.life;
      if (p >= 1) { s.visible = false; continue; }
      const facing = rimPoint(u.theta, rimP);
      const k = Math.pow(Math.sin(Math.PI * p), 1.6) * Math.min(1, Math.max(0, (facing - 0.15) / 0.35));
      s.position.copy(rimP); s.scale.setScalar(CFG.sparkleSize * (0.35 + 0.65 * k));
      s.material.opacity = k; s.material.rotation = u.rot + p * 0.5;
    }
  }

  // bloom chain, as on the letters
  const pr = renderer.getPixelRatio();
  const baseRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength, CFG.bloomRadius, CFG.bloomThreshold); composer.addPass(bloom);
  const out = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tBase: { value: null }, halo: { value: CFG.halo } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: OUT_FRAG });
  out.uniforms.tBase.value = baseRT.texture; // ShaderPass drops render-target textures when it clones uniforms
  out.material.toneMapped = true; composer.addPass(out);
  function theme() { bloom.strength = knob('bloomStrength'); bloom.threshold = knob('bloomThreshold'); out.uniforms.halo.value = knob('halo'); }
  theme(); new MutationObserver(theme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    composer.setPixelRatio(pr); composer.setSize(w, h); baseRT.setSize(w * pr, h * pr); bloom.setSize(w, h);
    // the coin's radius is 1: fit its diameter to `fill` of the shorter side
    // (the float needs a little headroom, so the fit counts the bob travel too)
    const t = Math.tan(camera.fov * D2R / 2), r = 1 + (still ? 0 : CFG.floatAmount); camera.position.set(0, 0, Math.max(r / (CFG.fill * t), r / (CFG.fill * t * camera.aspect)));
    if (!running) draw(performance.now());
  }
  let running = false, visible = true, ready = false;
  const t0 = performance.now();
  function angle(now) {
    if (CFG.angle != null) return CFG.angle * D2R;
    if (reduce) return CFG.rest * D2R;
    return ((now - t0) / 1000 / CFG.period) * Math.PI * 2;
  }
  // the export faces the ₵ toward -Z; the extra half turn brings it to the camera
  function draw(now) {
    if (!ready) return;
    const t = (now - t0) / 1000;
    spin.rotation.y = Math.PI + angle(now);
    if (!still) {
      bob.position.y = Math.sin((t / CFG.floatSeconds) * Math.PI * 2) * CFG.floatAmount;
      bob.rotation.x = Math.sin((t / CFG.wobbleSeconds) * Math.PI * 2) * CFG.wobbleDegrees * D2R;
      bob.rotation.z = Math.sin((t / (CFG.wobbleSeconds * 1.37)) * Math.PI * 2 + 1) * CFG.wobbleDegrees * 0.5 * D2R;
    }
    scene.updateMatrixWorld(); sweep(t); sparkle(t);
    renderer.setRenderTarget(baseRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    composer.render();
    if (stars.some(x => x.visible)) { renderer.autoClear = false; renderer.render(fx, camera); renderer.autoClear = true; }
  }
  function frame(now) { if (!visible) { running = false; return; } draw(now); requestAnimationFrame(frame); }
  function start() { if (running || !ready) return; if (reduce || CFG.angle != null) { draw(performance.now()); return; } running = true; requestAnimationFrame(frame); }

  assets(renderer).then(([gltf, env]) => {
    const coin = gltf.scene.clone(true);
    coin.traverse(o => { if (o.isMesh) o.material = material(o.material.name); });
    spin.add(coin); scene.environment = env;
    ready = true; el.classList.add('is-live'); draw(performance.now()); start();
  }).catch(err => { console.warn('[gold-coin]', err); el.classList.add('is-static'); });

  new ResizeObserver(resize).observe(el); resize();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }, { rootMargin: '100px' }).observe(el);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); el.classList.add('is-static'); });
  (window.__goldCoins ||= []).push({ el, renderer, scene, camera, spin, bob, bar, stars, CFG, render: (ms) => draw(ms ?? performance.now()) });
}

const probe = document.createElement('canvas');
if (probe.getContext('webgl2') || probe.getContext('webgl')) document.querySelectorAll('.gold_coin').forEach(setup);
else document.querySelectorAll('.gold_coin').forEach(el => el.classList.add('is-static'));
