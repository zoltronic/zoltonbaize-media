/* Gold hero — live three.js recreation of the Wells Fargo cube intro.
   States: takeover (full-screen intro) → settle (camera zoom/offset onto the hero slot) → live (scroll turns the HDRI, pointer tilts the cube).
   Assets: wf_cube.glb (cube + pivot + camera path, 0–3.43s), wf_normal_2k.png (carve), wf_letters_2k.png (glow mask), env_roof_1k.png (HDRI), scene.json, material.json. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const BASE = (document.currentScript && document.currentScript.dataset.base) || (window.GOLD_HERO_BASE || './');
const CFG = window.GOLD_HERO_CONFIG || {};
const SETTLE_MS = CFG.settleMs || 900, FPS = 60, END_T = 206 / FPS, LAND_T = 138 / FPS;
const EASE = t => 1 - Math.pow(1 - t, 3);           // ease-out cubic, close to the site's (.2,0,0,1)
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

const hero = document.getElementById('gold-hero');
if (hero) init().catch(err => { console.warn('[gold-hero]', err); fallback(); });

function fallback() { hero.classList.add('is-static'); const img = document.getElementById('gold-hero-poster'); if (img) img.hidden = false; document.documentElement.classList.remove('zb-intro'); const sec = hero.closest('.layout_hero'); if (sec) sec.classList.remove('is-waiting'); }

async function init() {
  const slot = document.getElementById('gold-hero-slot'), skip = document.getElementById('gold-hero-skip'), replay = document.getElementById('gold-hero-replay'), img = document.getElementById('gold-hero-poster');
  const sec = hero.closest('.layout_hero');
  let seen = false; try { seen = sessionStorage.getItem('zb-gold-intro') === '1'; } catch (e) {}
  // WebGL check
  const probe = document.createElement('canvas'); const gl = probe.getContext('webgl2') || probe.getContext('webgl');
  if (!gl || reduce) { fallback(); return; }

  // ---------- renderer / canvas ----------
  const canvas = document.createElement('canvas'); canvas.className = 'gold_hero-gl'; canvas.setAttribute('aria-hidden', 'true');
  hero.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!CFG.debug });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NoToneMapping; renderer.toneMappingExposure = CFG.exposure || 1.0; // Blender's view transform was Standard: plain sRGB, highlights clip
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // ---------- assets ----------
  const [sceneJ, matJ, gltf, envTex, normalTex, lettersTex] = await Promise.all([
    fetch(BASE + 'scene.json').then(r => r.json()), fetch(BASE + 'material.json').then(r => r.json()),
    new GLTFLoader().loadAsync(BASE + 'wf_cube.glb'),
    new THREE.TextureLoader().loadAsync(BASE + 'env_roof_1k.png'),
    new THREE.TextureLoader().loadAsync(BASE + 'wf_normal_2k.png'),
    new THREE.TextureLoader().loadAsync(BASE + 'wf_letters_2k.png'),
  ]);
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  normalTex.colorSpace = THREE.NoColorSpace; lettersTex.colorSpace = THREE.NoColorSpace;
  normalTex.flipY = false; lettersTex.flipY = false; // glTF UVs have V pointing down; the maps were authored in Blender's V-up space
  for (const t of [normalTex, lettersTex]) { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(envTex).texture; envTex.dispose(); pmrem.dispose();
  scene.environmentIntensity = CFG.envIntensity || 1.1; // Blender used 0.85; three's LDR PMREM reads a touch darker

  // scene graph from glTF: pivot > cube, camera
  const root = gltf.scene; scene.add(root);
  const cube = root.getObjectByName('WF_BumpCube'), pivot = root.getObjectByName('WF_Pivot');
  const camNode = root.getObjectByName('Camera');
  const camera = gltf.cameras[0]; // PerspectiveCamera parented to camNode
  camera.near = 0.1; camera.far = 100;

  // ---------- material ----------
  const base = matJ.base;
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(base.color[0], base.color[1], base.color[2]), metalness: 1, roughness: base.roughness,
    clearcoat: base.coat, clearcoatRoughness: base.coatRoughness, anisotropy: base.anisotropy,
    normalMap: normalTex, normalScale: new THREE.Vector2(CFG.normalScale || 1, -(CFG.normalScale || 1)), // negative Y: the green channel was derived in V-up space
    envMapIntensity: scene.environmentIntensity,
  });
  const glow = { gain: { value: 0 }, strength: { value: 1 }, mask: { value: lettersTex }, flat: { value: 0 } };
  const FLAT_BROWN = new THREE.Color(0.2747, 0.1499, 0.0423); // the two-colour lockup ground from the Blender material (linear)
  mat.onBeforeCompile = sh => {
    sh.uniforms.uGlowGain = glow.gain; sh.uniforms.uGlowStrength = glow.strength; sh.uniforms.uLetters = glow.mask; sh.uniforms.uFlat = glow.flat; sh.uniforms.uFlatColor = { value: FLAT_BROWN };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uGlowGain; uniform float uGlowStrength; uniform sampler2D uLetters; uniform float uFlat; uniform vec3 uFlatColor;')
      .replace('#include <opaque_fragment>', 'float zbLetters = texture2D(uLetters, vNormalMapUv).r; float zbMask = zbLetters * uGlowGain;\noutgoingLight = mix(outgoingLight, vec3(uGlowStrength), zbMask);\noutgoingLight = mix(outgoingLight, mix(uFlatColor, vec3(1.0), zbLetters), uFlat); /* flat two-colour lockup as the hero scrolls out */\n#include <opaque_fragment>');
  };
  cube.material = mat;

  // ---------- lights (Blender area lights → RectAreaLight) ----------
  RectAreaLightUniformsLib.init();
  const K = CFG.lightScale || 1.2; // Blender watts → three nits (radiance = P / (A·π)), tuned against the render
  const rectLights = [];
  const zup = new THREE.Matrix4().set(1,0,0,0, 0,0,1,0, 0,-1,0,0, 0,0,0,1); // Blender Z-up → three Y-up
  for (const L of sceneJ.lights) {
    const w = L.size, h = L.size_y || L.size;
    const light = new THREE.RectAreaLight(new THREE.Color(L.color[0], L.color[1], L.color[2]), L.energy / (w * h * Math.PI) * K, w, h);
    const m = new THREE.Matrix4().set(...L.matrix_world.flat());
    // columns of C·M are the lamp's local axes expressed in three's Y-up world: X = width, Y = height, -Z = emission, same as Blender's area lamp
    light.matrixAutoUpdate = false; light.matrix.copy(zup).multiply(m); light.matrixWorldNeedsUpdate = true;
    // per-lamp trims against the render: the rake reads too hot in three, and the big front softbox is what lifts the resting face to a lighter gold
    const trim = L.name === 'Emboss_Rake' ? 0.6 : (L.name === 'Front_Fill' ? (CFG.frontFill || 5) : 1);
    light.userData.base = L.energy / (w * h * Math.PI) * trim; light.name = L.name; light.intensity = light.userData.base * K;
    scene.add(light); rectLights.push(light);
  }

  // ---------- animation ----------
  // deterministic clip sampling: evaluate every track's interpolant at time x and write it to the node
  const samplers = [];
  for (const clip of gltf.animations) for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.'); const nodeName = track.name.slice(0, dot), prop = track.name.slice(dot + 1);
    const node = root.getObjectByName(nodeName); if (!node) continue;
    samplers.push({ node, prop, ip: track.createInterpolant(), dur: clip.duration });
  }
  function setAnimTime(x) {
    for (const s of samplers) { const v = s.ip.evaluate(Math.min(x, s.dur)); if (s.prop === 'position') s.node.position.fromArray(v); else if (s.prop === 'quaternion') s.node.quaternion.fromArray(v); else if (s.prop === 'scale') s.node.scale.fromArray(v); }
  }
  const mixer = null;
  const curves = matJ.frames; // [frame, gainWhite, whiteStrength]
  const STEADY = CFG.steadyWhite || 1.0;
  function glowAt(t) { const f = Math.max(0, Math.min(206, t * FPS)); const i = Math.floor(f), k = f - i; const a = curves[Math.min(i, 206)], b = curves[Math.min(i + 1, 206)]; const g = a[1] + (b[1] - a[1]) * k; let s = a[2] + (b[2] - a[2]) * k; s = Math.max(STEADY, s - (1.15 - STEADY)); return [g, s]; } // the render settled at 1.15; remap so it settles at STEADY

  // ---------- post: bloom that keeps the alpha channel ----------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength || 0.3, 0.6, CFG.bloomThreshold || 1.0); // only the glow peak (strength up to 5) crosses the threshold; the settled white sits at 1.0 and stays flat
  composer.addPass(bloom);
  const alphaPass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tBase: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform sampler2D tBase; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a; float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); float a = max(a0, clamp(lum * 1.6, 0.0, 1.0)); gl_FragColor = vec4(c.rgb, a); }'
  });
  composer.addPass(alphaPass);
  const baseRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  alphaPass.uniforms.tBase.value = baseRT.texture;

  // ---------- framing ----------
  const view = { zoom: 1, dx: 0, dy: 0 };    // NDC offset + zoom applied on top of the Blender camera
  let vw = 1, vh = 1;
  function lens() { return (vw / vh) < 1 ? sceneJ.camera.lens_portrait : sceneJ.camera.lens; }
  function applyCamera() {
    const aspect = vw / vh, hfov = 2 * Math.atan(18 / lens());
    camera.aspect = aspect; camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hfov / 2) / aspect)); camera.zoom = view.zoom;
    camera.updateProjectionMatrix();
    camera.projectionMatrix.elements[8] = -view.dx; camera.projectionMatrix.elements[9] = -view.dy;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  function resize() {
    vw = innerWidth; vh = innerHeight; renderer.setSize(vw, vh, false); canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';
    const pr = renderer.getPixelRatio(); composer.setSize(vw, vh); baseRT.setSize(vw * pr, vh * pr); bloom.setSize(vw, vh); applyCamera();
  }
  // cube on-screen height as a fraction of viewport height for the landed camera at zoom 1
  function cubeFrac() { const hfov = 2 * Math.atan(18 / lens()), vfov = 2 * Math.atan(Math.tan(hfov / 2) / (vw / vh)); return 1.09 * (1 / 10.1) / Math.tan(vfov / 2); }
  // target framing so the cube sits in the slot at the same size the still would have (cover-fit 16:9 / 9:16 render, cube = 54% of frame height)
  function slotTarget() {
    const r = slot.getBoundingClientRect(); const portrait = (vw / vh) < 1;
    const cover = portrait ? Math.max(r.width / 1080, r.height / 1920) : Math.max(r.width / 1920, r.height / 1080);
    const cubePx = (portrait ? 538 : 583) * cover; // cube height measured in the renders: 583px of 1080 (16:9), 538px of 1920 (9:16)
    const zoom = (cubePx / vh) / cubeFrac();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    return { zoom, dx: (cx / vw) * 2 - 1, dy: 1 - (cy / vh) * 2 };
  }

  // ---------- state machine ----------
  let state = 'idle', t = 0, settleStart = 0, settleFrom = null, settleTo = null, last = performance.now();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; let scrollRot = 0;
  const ENV_BASE = { x: CFG.envBaseX ?? 0.55, y: CFG.envBaseY ?? -2.7 }; // turn the bright sky of the HDRI into the face so the resting gold reads lighter
  function takeover() { hero.classList.remove('is-static'); if (img) img.hidden = true; replay.hidden = true; if (sec) sec.classList.add('is-waiting'); document.documentElement.classList.add('zb-intro'); hero.classList.add('is-live'); skip.style.opacity = ''; }
  function landed() { if (sec) sec.classList.remove('is-waiting'); document.documentElement.classList.remove('zb-intro'); replay.hidden = false; skip.style.opacity = '0'; }
  function startIntro() { window.__lastStart = new Error('startIntro').stack; takeover(); state = 'intro'; t = 0; view.zoom = 1; view.dx = 0; view.dy = 0; lastChange = performance.now(); }
  function beginSettle(now) { state = 'settle'; settleStart = now; settleFrom = { ...view }; settleTo = slotTarget(); skip.style.opacity = '0'; try { sessionStorage.setItem('zb-gold-intro', '1'); } catch (e) {} }
  function goLive() { state = 'live'; landed(); Object.assign(view, slotTarget()); lastChange = performance.now(); }

  skip.addEventListener('click', () => { if (state === 'intro') { t = END_T; beginSettle(performance.now()); } });
  let lastChange = 0;
  replay.addEventListener('click', e => { if (state !== 'live' || !e.isTrusted || performance.now() - lastChange < 800) return; startIntro(); });
  addEventListener('pointermove', e => { pointer.tx = (e.clientX / vw) * 2 - 1; pointer.ty = (e.clientY / vh) * 2 - 1; }, { passive: true });
  addEventListener('scroll', () => { scrollRot = scrollY; }, { passive: true });
  const sweep = rectLights.find(l => l.name === 'Spec_Bokeh'); const sweepBase = sweep ? sweep.matrix.clone() : null;
  addEventListener('resize', () => { resize(); if (state === 'live') Object.assign(view, slotTarget()); });

  // ---------- frame ----------
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (state === 'intro') { t = Math.min(END_T, t + dt); if (t >= END_T) beginSettle(now); }
    else if (state === 'settle') { const k = EASE(Math.min(1, (now - settleStart) / SETTLE_MS)); view.zoom = settleFrom.zoom + (settleTo.zoom - settleFrom.zoom) * k; view.dx = settleFrom.dx + (settleTo.dx - settleFrom.dx) * k; view.dy = settleFrom.dy + (settleTo.dy - settleFrom.dy) * k; if (k >= 1) goLive(); }
    else if (state === 'live') { Object.assign(view, slotTarget()); }
    render(t);
  }
  function render(time) {
    setAnimTime(time);
    const [g, s] = glowAt(time); glow.gain.value = g; glow.strength.value = s;
    // pointer tilt + scroll-driven environment, only once landed
    const liveAmt = state === 'live' ? 1 : (state === 'settle' ? 0.5 : 0);
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    pivot.rotation.x += 0; // keep Blender animation; add tilt on the cube itself
    cube.rotation.set(-pointer.y * 0.088 * liveAmt, pointer.x * 0.132 * liveAmt, 0);
    // scroll: the environment tilts vertically and drifts sideways, and the small specular light orbits the face so highlights catch the carve edges
    const sy = scrollRot * (CFG.scrollRate || 0.0016) * liveAmt;
    scene.environmentRotation.set(ENV_BASE.x + sy * 0.9, ENV_BASE.y + sy * 0.35, 0);
    // flat lockup: blend in as the slot approaches the top of the viewport, fully flat just before it leaves
    if (state === 'live') { const r = slot.getBoundingClientRect(); const p = THREE.MathUtils.clamp(1 - (r.bottom - vh * 0.10) / (vh * 0.45), 0, 1); glow.flat.value = p * p * (3 - 2 * p); } else glow.flat.value = 0;
    if (sweep) { sweep.matrix.copy(sweepBase).premultiply(new THREE.Matrix4().makeRotationZ(sy * 1.6)); sweep.matrixWorldNeedsUpdate = true; }
    applyCamera();
    renderer.setRenderTarget(baseRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    composer.render();
  }
  function loop(now) { frame(now); requestAnimationFrame(loop); }

  // ---------- go ----------
  resize();
  if (seen) { t = END_T; goLive(); hero.classList.add('is-live'); if (img) img.hidden = true; }
  else { startIntro(); }
  requestAnimationFrame(loop);
  window.__goldHero = { THREE, ENV_BASE, glow, setLightScale(k) { for (const l of rectLights) l.intensity = l.userData.base * k; }, setExposure(x) { renderer.toneMappingExposure = x; }, setEnv(x) { scene.environmentIntensity = x; mat.envMapIntensity = x; }, rectLights, seek(x) { t = x; render(t); }, get state() { return state; }, set state(s) { state = s; }, view, slotTarget, settle(n) { beginSettle(n || performance.now()); }, live() { goLive(); }, start() { startIntro(); }, frame: n => frame(n), setScroll(y) { scrollRot = y; }, setPointer(x, y) { pointer.tx = x; pointer.ty = y; }, renderer, scene, camera, mat, bloom, composer, baseRT, alphaPass, cube, pivot, mixer, glow, get t() { return t; } };
}
