/* Gold coin: the Direction 01 crypto coin, live, for the Selected work tile.
   Geometry is the real coin from the Blender file (lathe profile + raised ₵ front and back); each surface's gold
   gradient is evaluated per pixel from the source material's values. The lighting is the Direction 01 scene itself: its sky dome,
   warm tint and six area lights rendered from the coin's position into one 360° map (hdr/env_coin_d1_1k.hdr, in three's
   equirect axes, peaks capped at 2 the way EEVEE clamps the sun), so every reflection is the one the approved render had.
   Motion: one very slow full turn about the vertical axis, seamless, paused off screen; reduced motion shows a still.
   Markup: <div class="gold_coin"></div>
   Knobs: window.GOLD_COIN_CONFIG { model, env, period, fill, exposure, tilt, angle, capture } — angle (deg) freezes the turn. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const BASE = window.GOLD_COIN_BASE || window.GOLD_HERO_BASE || './';
const CFG = Object.assign({
  model: 'coin/coin_d1.glb', env: 'hdr/env_coin_d1_1k.hdr',
  period: 28,          // seconds per full turn
  fill: 0.62,          // coin diameter as a fraction of the stage's shorter side
  exposure: 1.0,       // the source render used Blender's Standard view, so no tone mapping
  tilt: 0,             // degrees the coin leans back toward the camera
  rest: 24,            // still angle (deg) for reduced motion
  angle: null, capture: false,
}, Object.fromEntries(Object.entries(window.GOLD_COIN_CONFIG || {}).filter(([, v]) => v !== undefined)));
const D2R = Math.PI / 180;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const abs = p => /^https?:/.test(p) ? p : BASE + p;
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
  const spin = new THREE.Group(); tilt.add(spin);

  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    // the coin's radius is 1: fit its diameter to `fill` of the shorter side
    const t = Math.tan(camera.fov * D2R / 2); camera.position.set(0, 0, Math.max(1 / (CFG.fill * t), 1 / (CFG.fill * t * camera.aspect)));
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
  function draw(now) { if (!ready) return; spin.rotation.y = Math.PI + angle(now); renderer.render(scene, camera); }
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
  (window.__goldCoins ||= []).push({ el, renderer, scene, camera, spin, CFG, render: () => draw(performance.now()) });
}

const probe = document.createElement('canvas');
if (probe.getContext('webgl2') || probe.getContext('webgl')) document.querySelectorAll('.gold_coin').forEach(setup);
else document.querySelectorAll('.gold_coin').forEach(el => el.classList.add('is-static'));
