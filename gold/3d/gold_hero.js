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
const SETTLE_MS = CFG.settleMs || 700, FPS = 60, END_T = 206 / FPS, LAND_T = 138 / FPS;
const SETTLE_AT = (CFG.settleAtFrame ?? 96) / FPS; // the camera dolly ends at frame 138 (2.3s) and the glow runs 145-200: the settle runs inside the dolly's ease-out and ends with it, so the cube arrives in the slot in one motion and then lights up in place
const EASE = t => 1 - Math.pow(1 - t, 3);           // ease-out cubic, close to the site's (.2,0,0,1)
const EASE_IO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, EASE_IN = t => t * t * t;
const SETTLE_EASE = { out: EASE, inout: EASE_IO, 'in': EASE_IN }[CFG.settleEase || 'in']; // ease-in by default: the settle's pull grows as the dolly's push ends, so the two cancel into a soft landing instead of a hard stop
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
    new THREE.TextureLoader().loadAsync(BASE + (CFG.normalMap || 'wf_normal_2k.png')),
    new THREE.TextureLoader().loadAsync(BASE + 'wf_letters_2k.png'),
  ]);
  // warmth dial (0..1): tints the environment toward orange before it becomes the reflection map, and shifts the base gold the same way
  const WARM = Math.max(0, Math.min(1, CFG.warmth ?? 0.3));
  let envSrc = envTex;
  if (WARM > 0 && envTex.image && envTex.image.width) {
    const cv = document.createElement('canvas'); cv.width = envTex.image.width; cv.height = envTex.image.height;
    const cx = cv.getContext('2d'); cx.drawImage(envTex.image, 0, 0);
    const id = cx.getImageData(0, 0, cv.width, cv.height), d = id.data, gm = 1 - 0.10 * WARM, bm = 1 - 0.30 * WARM;
    for (let i = 0; i < d.length; i += 4) { d[i + 1] = d[i + 1] * gm; d[i + 2] = d[i + 2] * bm; }
    cx.putImageData(id, 0, 0);
    envSrc = new THREE.CanvasTexture(cv);
  }
  envSrc.mapping = THREE.EquirectangularReflectionMapping; envSrc.colorSpace = THREE.SRGBColorSpace;
  normalTex.colorSpace = THREE.NoColorSpace; lettersTex.colorSpace = THREE.NoColorSpace;
  normalTex.flipY = false; lettersTex.flipY = false; // glTF UVs have V pointing down; the maps were authored in Blender's V-up space
  for (const t of [normalTex, lettersTex]) { t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; }

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(envSrc).texture; envTex.dispose(); if (envSrc !== envTex) envSrc.dispose(); pmrem.dispose();
  scene.environmentIntensity = CFG.envIntensity || 0.85; // Blender's world strength

  // scene graph from glTF: pivot > cube, camera
  const root = gltf.scene; scene.add(root);
  const cube = root.getObjectByName('WF_BumpCube'), pivot = root.getObjectByName('WF_Pivot');
  const camNode = root.getObjectByName('Camera');
  const camera = gltf.cameras[0]; // PerspectiveCamera parented to camNode
  camera.near = 0.1; camera.far = 100;

  // ---------- material ----------
  const base = matJ.base;
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(base.color[0], base.color[1], base.color[2]).lerp(new THREE.Color(0.93, 0.52, 0.19), WARM * 0.45), metalness: 1, roughness: base.roughness,
    clearcoat: base.coat, clearcoatRoughness: base.coatRoughness, anisotropy: base.anisotropy,
    normalMap: normalTex, normalScale: new THREE.Vector2(CFG.normalScale || 1, -(CFG.normalScale || 1)), // negative Y: the green channel was derived in V-up space
    envMapIntensity: scene.environmentIntensity,
  });
  const glow = { gain: { value: 0 }, strength: { value: 1 }, mask: { value: lettersTex }, flat: { value: 0 } };
  const FLAT_BROWN = new THREE.Color(CFG.flatColor || '#a87e44'); // lockup ground; the brand swatch #946E3A read too dark unlit, so it sits a step lighter by default (sRGB hex, converted to linear)
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
    const light = new THREE.RectAreaLight(new THREE.Color(L.color[0], L.color[1], L.color[2]), 1, w, h);
    const m = new THREE.Matrix4().set(...L.matrix_world.flat());
    // columns of C·M are the lamp's local axes expressed in three's Y-up world: X = width, Y = height, -Z = emission, same as Blender's area lamp
    light.matrixAutoUpdate = false; light.matrix.copy(zup).multiply(m); light.matrixWorldNeedsUpdate = true;
    // per-lamp trims against the render: the rake reads too hot in three, and the big front softbox is what lifts the resting face to a lighter gold
    const trim = L.name === 'Emboss_Rake' ? (CFG.rake ?? 0.5) : (L.name === 'Front_Fill' ? (CFG.frontFill ?? 1) : (L.name === 'Spec_Bokeh' ? (CFG.bokeh ?? 0.5) : (L.name === 'Key_Main' ? (CFG.key ?? 1) : 1)));
    if (L.name === 'Front_Fill' && CFG.frontWarm !== false) light.color.setRGB(1.0, 0.9, 0.8); // slightly warmer softbox
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
  const STEADY = CFG.steadyWhite || 1.0, PEAK = CFG.glowPeak ?? 0.5; // glowPeak scales how far the light-up overshoots the steady white (1 = as rendered)
  function glowAt(t) { const f = Math.max(0, Math.min(206, t * FPS)); const i = Math.floor(f), k = f - i; const a = curves[Math.min(i, 206)], b = curves[Math.min(i + 1, 206)]; const g = a[1] + (b[1] - a[1]) * k; let s = a[2] + (b[2] - a[2]) * k; s = Math.max(STEADY, s - (1.15 - STEADY)); s = STEADY + (s - STEADY) * PEAK; return [g, s]; } // the render settled at 1.15; remap so it settles at STEADY

  // ---------- post: bloom that keeps the alpha channel ----------
  // bloom is off by default: it spilled a halo of light around the cube; the letters still flash to a clipped white without it
  const useBloom = (CFG.bloomStrength ?? 0) > 0;
  const composer = useBloom ? new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })) : null;
  const bloom = useBloom ? new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength, 0.6, CFG.bloomThreshold || 1.0) : null; // only the glow peak (strength up to 5) crosses the threshold; the settled white sits at 1.0 and stays flat
  const alphaPass = useBloom ? new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tBase: { value: null } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    // the composer works in linear light; this last pass writes to the canvas, so it must encode to the output colour space itself (a plain ShaderPass gets no automatic sRGB conversion)
    fragmentShader: 'uniform sampler2D tDiffuse; uniform sampler2D tBase; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a; float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); float a = max(a0, clamp(lum * 1.6, 0.0, 1.0)); gl_FragColor = vec4(c.rgb, a);\n#include <colorspace_fragment>\n}'
  }) : null;
  const baseRT = useBloom ? new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }) : null;
  if (useBloom) { composer.addPass(new RenderPass(scene, camera)); composer.addPass(bloom); composer.addPass(alphaPass); alphaPass.uniforms.tBase.value = baseRT.texture; }

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
    const pr = renderer.getPixelRatio(); if (useBloom) { composer.setSize(vw, vh); baseRT.setSize(vw * pr, vh * pr); bloom.setSize(vw, vh); } applyCamera();
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
  let state = 'idle', t = 0, settleStart = 0, settleFrom = null, settleTo = null, last = performance.now(), liveStart = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; let scrollRot = 0;
  const ENV_BASE = { x: CFG.envBaseX ?? 0.55, y: CFG.envBaseY ?? -2.7 }; // turn the bright sky of the HDRI into the face so the resting gold reads lighter
  function takeover() { hero.classList.remove('is-static'); if (img) img.hidden = true; replay.hidden = true; if (sec) sec.classList.add('is-waiting'); document.documentElement.classList.add('zb-intro'); hero.classList.add('is-live'); skip.style.opacity = ''; }
  function landed() { if (sec) sec.classList.remove('is-waiting'); document.documentElement.classList.remove('zb-intro'); replay.hidden = false; skip.style.opacity = '0'; }
  function startIntro() { last = performance.now(); takeover(); state = 'intro'; t = 0; view.zoom = 1; view.dx = 0; view.dy = 0; lastChange = performance.now(); }
  function beginSettle(now) { state = 'settle'; settleStart = now; settleFrom = { ...view }; settleTo = slotTarget(); skip.style.opacity = '0'; try { sessionStorage.setItem('zb-gold-intro', '1'); } catch (e) {} }
  function goLive() { state = 'live'; liveStart = performance.now(); landed(); Object.assign(view, slotTarget()); lastChange = liveStart; }

  skip.addEventListener('click', () => { if (state === 'intro') { t = Math.max(t, SETTLE_AT); beginSettle(performance.now()); } }); // skip jumps to the landing run-in rather than snapping
  let lastChange = 0, lastTap = 0, drag = null;
  function tryReplay() { if (state !== 'live' || performance.now() - lastChange < 800) return; startIntro(); }
  replay.addEventListener('click', e => { if (!e.isTrusted) return; if (e.pointerType === 'touch' || (drag && drag.touch)) return; tryReplay(); }); // mouse: a click on the logo replays
  replay.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; drag = { touch: true, x: e.clientX, y: e.clientY, moved: false }; }, { passive: true });
  replay.addEventListener('pointermove', e => { if (!drag || e.pointerType !== 'touch') return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true; pointer.tx = THREE.MathUtils.clamp(dx / 140, -1, 1); pointer.ty = THREE.MathUtils.clamp(dy / 140, -1, 1); }, { passive: true }); // touch: swipe over the logo tilts it
  const endTouch = e => { if (!drag) return; const moved = drag.moved; drag = null; pointer.tx = 0; pointer.ty = 0; if (moved) return; const now = performance.now(); if (now - lastTap < 320) { lastTap = 0; tryReplay(); } else lastTap = now; }; // touch: quick double-tap replays
  replay.addEventListener('pointerup', endTouch, { passive: true }); replay.addEventListener('pointercancel', endTouch, { passive: true });
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pointer.tx = (e.clientX / vw) * 2 - 1; pointer.ty = (e.clientY / vh) * 2 - 1; }, { passive: true });
  addEventListener('scroll', () => { scrollRot = scrollY; }, { passive: true });
  const sweep = rectLights.find(l => l.name === 'Spec_Bokeh'); const sweepBase = sweep ? sweep.matrix.clone() : null;
  // the pointer tilt rotates the cube about the centre of its front face, not its volume centre, so the lockup stays anchored while the body swings behind it
  const faceLocal = (() => { setAnimTime(END_T); cube.rotation.set(0, 0, 0); root.updateMatrixWorld(true); const geo = cube.geometry; if (!geo.boundingBox) geo.computeBoundingBox(); const c = geo.boundingBox.getCenter(new THREE.Vector3()), h = geo.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(0.5); const camW = camera.getWorldPosition(new THREE.Vector3()); let best = null, bd = -2; for (const ax of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]) { const n = new THREE.Vector3(...ax); const p = c.clone().add(n.clone().multiply(h)); const pw = cube.localToWorld(p.clone()); const nw = n.clone().transformDirection(cube.matrixWorld); const d = nw.dot(camW.clone().sub(pw).normalize()); if (d > bd) { bd = d; best = p; } } return best; })();
  const _sf = new THREE.Vector3(), _rf = new THREE.Vector3();
  const cubeHasPosTrack = samplers.some(s => s.node === cube && s.prop === 'position'); setAnimTime(END_T); const cubeBasePos = cube.position.clone();
  addEventListener('resize', () => { resize(); if (state === 'live') Object.assign(view, slotTarget()); });

  // ---------- frame ----------
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (state === 'intro') { t = Math.min(END_T, t + dt); if (t >= SETTLE_AT) beginSettle(now); }
    else if (state === 'settle') { t = Math.min(END_T, t + dt); const k = SETTLE_EASE(THREE.MathUtils.clamp((t - SETTLE_AT) / (LAND_T - SETTLE_AT), 0, 1)); /* on the animation clock, so it ends exactly on the dolly's last frame */ view.zoom = settleFrom.zoom + (settleTo.zoom - settleFrom.zoom) * k; view.dx = settleFrom.dx + (settleTo.dx - settleFrom.dx) * k; view.dy = settleFrom.dy + (settleTo.dy - settleFrom.dy) * k; if (k >= 1) goLive(); }
    else if (state === 'live') { t = Math.min(END_T, t + dt); Object.assign(view, slotTarget()); }
    render(t);
  }
  function render(time) {
    setAnimTime(time);
    const [g, s] = glowAt(time); glow.gain.value = g; glow.strength.value = s;
    // pointer tilt + scroll-driven environment, only once landed
    const liveAmt = state === 'live' ? EASE(Math.min(1, (performance.now() - liveStart) / (CFG.liveRampMs || 1200))) : 0; // nothing nudges the cube until it has landed; then the tilt and scroll influence ease in so it does not move again after settling
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    pivot.rotation.x += 0; // keep Blender animation; add tilt on the cube itself
    cube.rotation.set(-pointer.y * 0.088 * liveAmt, pointer.x * 0.132 * liveAmt, 0);
    if (cubeHasPosTrack) cubeBasePos.copy(cube.position); _sf.copy(faceLocal).multiply(cube.scale); _rf.copy(_sf).applyQuaternion(cube.quaternion); cube.position.copy(cubeBasePos).add(_sf).sub(_rf); // keep the front-face centre where the animation put it
    // scroll: the environment tilts vertically and drifts sideways, and the small specular light orbits the face so highlights catch the carve edges
    const sy = scrollRot * (CFG.scrollRate || 0.0016) * liveAmt;
    scene.environmentRotation.set(ENV_BASE.x + sy * 0.9, ENV_BASE.y + sy * 0.35, 0);
    // flat lockup: blend in as the slot approaches the top of the viewport, fully flat just before it leaves
    if (state === 'live') { const r = slot.getBoundingClientRect(); const nav = document.querySelector('.nav_top'); const navBottom = nav ? nav.getBoundingClientRect().bottom : 90; const cubeTop = r.top + r.height / 2 - (view.zoom * cubeFrac() * vh) / 2; const gapRest = cubeTop + scrollY - navBottom; const ramp = Math.min(vh * (CFG.flatRamp || 0.12), Math.max(1, gapRest)); const p = THREE.MathUtils.clamp(1 - (cubeTop - navBottom) / ramp, 0, 1); /* the ramp never exceeds the resting gap, so the cube is fully lit at rest on short viewports too */ glow.flat.value = p * p * (3 - 2 * p); } else glow.flat.value = 0; // short ramp: the cube rests well above the nav, so it stays fully lit until it starts to slide under
    if (sweep) { sweep.matrix.copy(sweepBase).premultiply(new THREE.Matrix4().makeRotationZ(sy * 1.6)); sweep.matrixWorldNeedsUpdate = true; }
    applyCamera();
    if (useBloom) { renderer.setRenderTarget(baseRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null); composer.render(); }
    else renderer.render(scene, camera);
  }
  function loop(now) { frame(now); requestAnimationFrame(loop); }

  // ---------- go ----------
  resize();
  if (seen) { t = END_T; goLive(); hero.classList.add('is-live'); if (img) img.hidden = true; }
  else { startIntro(); }
  // warm-up: compile the shaders and upload the textures before the first visible frame, so the intro does not hitch on its opening frames
  setAnimTime(t); applyCamera();
  try { await renderer.compileAsync(scene, camera); } catch (e) {}
  render(t); last = performance.now(); if (state === 'live') liveStart = last;
  requestAnimationFrame(loop);
  window.__goldHero = { THREE, ENV_BASE, glow, setLightScale(k) { for (const l of rectLights) l.intensity = l.userData.base * k; }, setExposure(x) { renderer.toneMappingExposure = x; }, setEnv(x) { scene.environmentIntensity = x; mat.envMapIntensity = x; }, rectLights, seek(x) { t = x; render(t); }, get state() { return state; }, set state(s) { state = s; }, view, slotTarget, settle(n) { beginSettle(n || performance.now()); }, live() { goLive(); }, start() { startIntro(); }, frame: n => frame(n), setScroll(y) { scrollRot = y; }, setPointer(x, y) { pointer.tx = x; pointer.ty = y; }, renderer, scene, camera, mat, bloom, composer, baseRT, alphaPass, cube, pivot, mixer, glow, get t() { return t; } };
}
