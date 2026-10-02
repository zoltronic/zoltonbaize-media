/* Gold type v3: reflective 3D letters matched to the original build (main.js, Aug 2024).
   The letters stay put; the studio HDRI turns around them, so the highlight travels across still faces.
   Flat-shaded caps, ACES, exposure 1, bloom only on the hot edges, a rim light that orbits with the environment.
   Pointer (desktop) and device tilt (mobile, after permission) steer the environment, not the letters.
   On touch screens a swipe turns the letters a little (sideways on the page, both axes full screen) and they ease back.
   Teaser: <div class="gold_type" data-text="GOLD"></div>. Any [data-gold-type-open] opens the full-screen view.
   Knobs: window.GOLD_TYPE_CONFIG { hdr, font, color, roughness, envIntensity, exposure, bloomStrength, bloomRadius,
   bloomThreshold, halo, envSpinSeconds, envElevationDegrees, envBaseDegrees, envBobDegrees, envBobSeconds, pointerYawDegrees, pointerPitchDegrees,
   tiltYawDegrees, tiltPitchDegrees, letterParallaxDegrees, swipeYawDegrees, swipePitchDegrees, swipeDegreesPerPx, swipeSpring, swipeDamping, rim, fitWidth, fitHeight, placeholder, label,
   light: { ...overrides applied while the page is in light mode } } */
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const BASE = window.GOLD_HERO_BASE || './';
const DEFAULTS = {
  font: 'fonts/helvetiker_bold.typeface.json', hdr: 'hdr/studio.hdr',
  color: [1, 0.766, 0.336], roughness: 0.12, metalness: 1, envIntensity: 0.6, exposure: 1,
  bloomStrength: 0.22, bloomRadius: 0.36, bloomThreshold: 0.9, halo: 0.9,
  envSpinSeconds: 35, envElevationDegrees: -12, envBaseDegrees: 150, envBobDegrees: 8, envBobSeconds: 20,
  pointerYawDegrees: 40, pointerPitchDegrees: 10, tiltYawDegrees: 60, tiltPitchDegrees: 18, letterParallaxDegrees: 1.5,
  swipeYawDegrees: 32, swipePitchDegrees: 14, swipeDegreesPerPx: 0.28, swipeSpring: 0.006, swipeDamping: 0.88,
  rim: 1.2, fov: 35, fitWidth: 0.86, fitHeight: 0.62, size: 1, depth: 0.34, bevel: 0.034, bevelSegments: 14, curveSegments: 16,
  maxChars: 24, placeholder: 'type something here', label: 'Type your text here',
  light: { bloomStrength: 0, halo: 0 },
};
const USER = window.GOLD_TYPE_CONFIG || {};
const CFG = Object.assign({}, DEFAULTS, USER, { light: Object.assign({}, DEFAULTS.light, USER.light || {}) });
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const abs = p => /^https?:/.test(p) ? p : BASE + p;
const D2R = Math.PI / 180;
const isLight = () => document.documentElement.getAttribute('data-mode') === 'light';
const knob = k => (isLight() && k in CFG.light) ? CFG.light[k] : CFG[k];

let shared = null;
function assets() {
  return shared || (shared = Promise.all([new RGBELoader().loadAsync(abs(CFG.hdr)), new FontLoader().loadAsync(abs(CFG.font))])
    .then(([hdr, font]) => { hdr.mapping = THREE.EquirectangularReflectionMapping; return { hdr, font }; }));
}

// one input stream shared by every scene: pointer on desktop, device tilt on phones (once permitted)
const steer = { x: 0, y: 0, tx: 0, ty: 0, tilt: false };
addEventListener('pointermove', e => { if (e.pointerType === 'touch' || steer.tilt) return; steer.tx = (e.clientX / innerWidth) * 2 - 1; steer.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
function onOrient(e) {
  if (e.gamma == null) return; steer.tilt = true;
  steer.tx = Math.max(-1, Math.min(1, e.gamma / 35));
  steer.ty = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 35));
}
let orientOn = false;
function enableTilt() {
  if (orientOn || !('DeviceOrientationEvent' in window)) return;
  const on = () => { orientOn = true; addEventListener('deviceorientation', onOrient, { passive: true }); };
  const ask = DeviceOrientationEvent.requestPermission;
  if (typeof ask === 'function') ask.call(DeviceOrientationEvent).then(r => { if (r === 'granted') on(); }).catch(() => {});
  else if (matchMedia('(pointer:coarse)').matches) on();
}

const OUT_FRAG = `uniform sampler2D tDiffuse; uniform sampler2D tBase; uniform float halo; varying vec2 vUv;
void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a;
  float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
  float a = clamp(a0 + (1.0 - a0) * lum * halo, 0.0, 1.0);
  // outside the letters, keep only as much glow as the halo allows, so light pages never get a haze
  c.rgb = mix(c.rgb * min(1.0, halo), c.rgb, a0);
  gl_FragColor = vec4(c.rgb, a);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

function makeScene(el, opts = {}) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  const pr = Math.min(Math.max(devicePixelRatio || 1, 1), 2);
  renderer.setPixelRatio(pr); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.1, 100); camera.position.set(0, 0, 9);
  const group = new THREE.Group(); scene.add(group);
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(CFG.color[0], CFG.color[1], CFG.color[2], THREE.LinearSRGBColorSpace), metalness: CFG.metalness, roughness: CFG.roughness, flatShading: true });
  const rim = new THREE.DirectionalLight(0xffffff, CFG.rim); rim.position.set(-4, 3, -5); scene.add(rim);
  const RIM_R = Math.hypot(-4, -5), RIM_PH = Math.atan2(-5, -4);
  const baseRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength, CFG.bloomRadius, CFG.bloomThreshold); composer.addPass(bloom);
  const out = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tBase: { value: baseRT.texture }, halo: { value: CFG.halo } }, vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }', fragmentShader: OUT_FRAG });
  // ShaderPass clones its uniforms and drops render-target textures on the way, so the coverage texture is set after
  out.uniforms.tBase.value = baseRT.texture;
  out.material.toneMapped = true; composer.addPass(out);
  function theme() { renderer.toneMappingExposure = knob('exposure'); scene.environmentIntensity = knob('envIntensity'); bloom.strength = knob('bloomStrength'); bloom.threshold = knob('bloomThreshold'); out.uniforms.halo.value = knob('halo'); }
  theme(); const mo = new MutationObserver(theme); mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

  let mesh = null, font = null, current = opts.text || 'GOLD';
  function setText(text) {
    if (!font) return;
    const t = String(text || '').trim().slice(0, CFG.maxChars) || (opts.empty ?? 'GOLD');
    let geo;
    try { geo = new TextGeometry(t, { font, size: CFG.size, depth: CFG.depth, height: CFG.depth, curveSegments: CFG.curveSegments, bevelEnabled: true, bevelThickness: CFG.bevel, bevelSize: CFG.bevel, bevelOffset: 0, bevelSegments: CFG.bevelSegments }); }
    catch (err) { return; } // a glyph outside the font: keep the last good word
    geo.center(); geo.deleteAttribute('normal'); geo.deleteAttribute('uv'); geo = mergeVertices(geo, 1e-4); geo.computeVertexNormals(); geo.computeBoundingBox();
    if (mesh) { group.remove(mesh); mesh.geometry.dispose(); }
    mesh = new THREE.Mesh(geo, mat); group.add(mesh); fit();
  }
  function fit() {
    if (!mesh) return; const bb = mesh.geometry.boundingBox; const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
    const viewH = 2 * Math.tan(camera.fov * D2R / 2) * camera.position.z, viewW = viewH * camera.aspect;
    group.scale.setScalar(Math.min((viewW * CFG.fitWidth) / Math.max(w, 0.01), (viewH * (opts.fitHeight ?? CFG.fitHeight)) / Math.max(h, 0.01)));
  }
  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 200; renderer.setSize(w, h, false); composer.setPixelRatio(pr); composer.setSize(w, h); baseRT.setSize(w * pr, h * pr); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); fit(); }
  const ro = new ResizeObserver(resize); ro.observe(el); resize();

  // touch screens: a swipe turns the letters a little, they carry a touch of momentum, then ease back to face front.
  // On the page only sideways swipes are taken (vertical still scrolls); in the full-screen view both axes tilt.
  const spin = { yaw: 0, pitch: 0, vy: 0, vp: 0, drag: null };
  const both = opts.swipe === 'xy';
  canvas.style.touchAction = both ? 'none' : 'pan-y';
  // past the limit the letters stretch a little further and stop at about 1.4x, however hard the swipe
  const rubber = (v, lim) => { const a = Math.abs(v), s = lim * 0.4; return a <= lim ? v : Math.sign(v) * (lim + s * (1 - Math.exp(-(a - lim) / s))); };
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || reduce) return;
    spin.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: spin.yaw, pitch: spin.pitch, t: performance.now(), lx: e.clientX, ly: e.clientY };
    spin.vy = spin.vp = 0; canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    const d = spin.drag; if (!d || e.pointerId !== d.id) return;
    const k = CFG.swipeDegreesPerPx * D2R, now = performance.now(), dt = Math.max(1, now - d.t);
    spin.yaw = rubber(d.yaw + (e.clientX - d.x) * k, CFG.swipeYawDegrees * D2R);
    if (both) spin.pitch = rubber(d.pitch + (e.clientY - d.y) * k, CFG.swipePitchDegrees * D2R);
    spin.vy = ((e.clientX - d.lx) * k) / dt * 16.7; spin.vp = both ? ((e.clientY - d.ly) * k) / dt * 16.7 : 0;
    d.lx = e.clientX; d.ly = e.clientY; d.t = now;
  });
  const release = e => { if (spin.drag && e.pointerId === spin.drag.id) spin.drag = null; };
  canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);
  function settleSpin() {
    if (spin.drag) return;
    // momentum, a spring back to rest, and damping: a short glide, then the letters face front again
    spin.vy += -spin.yaw * CFG.swipeSpring; spin.vp += -spin.pitch * CFG.swipeSpring;
    spin.vy *= CFG.swipeDamping; spin.vp *= CFG.swipeDamping;
    spin.yaw = rubber(spin.yaw + spin.vy, CFG.swipeYawDegrees * D2R); spin.pitch = rubber(spin.pitch + spin.vp, CFG.swipePitchDegrees * D2R);
  }

  let running = true, visible = true; const t0 = performance.now();
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }); io.observe(el);
  function loop(now) {
    if (!running) return; requestAnimationFrame(loop); if (!visible) return;
    const t = (now - t0) / 1000;
    steer.x += (steer.tx - steer.x) * 0.06; steer.y += (steer.ty - steer.y) * 0.06;
    const yawK = steer.tilt ? CFG.tiltYawDegrees : CFG.pointerYawDegrees, pitchK = steer.tilt ? CFG.tiltPitchDegrees : CFG.pointerPitchDegrees;
    // the environment is what moves: a slow turn, plus whatever the pointer or the tilt adds
    const yaw = (CFG.envBaseDegrees + steer.x * yawK) * D2R + (reduce ? 0 : (t / CFG.envSpinSeconds) * Math.PI * 2);
    // -12 deg puts the horizon across the faces (pale sky above, deep-gold sand below); the bob sweeps that line through them
    const bob = reduce ? 0 : Math.sin((t / CFG.envBobSeconds) * Math.PI * 2) * CFG.envBobDegrees;
    scene.environmentRotation.set((CFG.envElevationDegrees + bob + steer.y * pitchK) * D2R, yaw, 0);
    rim.position.set(Math.cos(RIM_PH + yaw) * RIM_R, 3, Math.sin(RIM_PH + yaw) * RIM_R);
    // the letters hold still; at most a degree or two of parallax so they read as an object, plus whatever a swipe adds
    settleSpin();
    group.rotation.set(steer.y * CFG.letterParallaxDegrees * D2R + spin.pitch, steer.x * CFG.letterParallaxDegrees * D2R + spin.yaw, 0);
    renderer.setRenderTarget(baseRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    composer.render();
  }
  (window.__goldTypeScenes ||= []).push({ el, group, spin, frame: () => loop(performance.now()) });
  return {
    async start() { const a = await assets(); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromEquirectangular(a.hdr).texture; pm.dispose(); font = a.font; setText(current); requestAnimationFrame(loop); el.classList.add('is-live'); },
    setText(t) { current = t; setText(t); },
    dispose() { running = false; mo.disconnect(); ro.disconnect(); io.disconnect(); composer.dispose(); baseRT.dispose(); renderer.dispose(); canvas.remove(); },
  };
}

const probe = document.createElement('canvas'); const hasGL = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
for (const el of document.querySelectorAll('.gold_type')) {
  if (!hasGL) { el.classList.add('is-static'); continue; }
  el.style.position = el.style.position || 'relative';
  makeScene(el, { text: el.dataset.text || 'GOLD' }).start().catch(err => { console.warn('[gold-type]', err); el.classList.add('is-static'); });
}

// Full-screen view: no panel. The page blurs behind, the letters float over it, the field sits at the bottom.
let modal = null;
function lock() { const y = scrollY; const b = document.body; b.dataset.gtY = y; Object.assign(b.style, { position: 'fixed', top: -y + 'px', left: '0', right: '0', width: '100%' }); }
function unlock() { const b = document.body, y = +b.dataset.gtY || 0; Object.assign(b.style, { position: '', top: '', left: '', right: '', width: '' }); scrollTo(0, y); }
function openModal() {
  if (modal) return;
  const wrap = document.createElement('div'); wrap.className = 'gold_modal'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Type your own gold letters');
  wrap.innerHTML = `<div class="gold_modal-backdrop"></div><div class="gold_modal-stage"></div>
    <button type="button" class="gold_modal-close" aria-label="Close"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
    <div class="gold_modal-field"><input class="gold_modal-input" type="text" maxlength="${CFG.maxChars}" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="done" placeholder="${CFG.placeholder}" aria-label="${CFG.label}"><span class="gold_modal-label">${CFG.label}</span></div>`;
  lock(); document.body.appendChild(wrap); document.documentElement.classList.add('gold_modal-open');
  const stage = wrap.querySelector('.gold_modal-stage'), input = wrap.querySelector('.gold_modal-input');
  const s = makeScene(stage, { text: 'GOLD', empty: 'GOLD', fitHeight: 0.42, swipe: 'xy' }); s.start().catch(() => {});
  let timer = 0; input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => s.setText(input.value), 160); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  const close = () => { s.dispose(); wrap.remove(); document.documentElement.classList.remove('gold_modal-open'); unlock(); modal = null; removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  // only the X and Escape close it: the whole screen is the stage, so a stray tap shouldn't throw the visitor out
  wrap.querySelector('.gold_modal-close').addEventListener('click', close); addEventListener('keydown', onKey);
  modal = { close }; requestAnimationFrame(() => { wrap.classList.add('is-open'); if (!matchMedia('(pointer:coarse)').matches) input.focus({ preventScroll: true }); });
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-gold-type-open]'); if (!b) return; e.preventDefault();
  enableTilt(); // same tap: iOS only grants motion access inside a user gesture
  if (hasGL) openModal(); else window.open('https://cheery-zuccutto-125e43.netlify.app/', '_blank');
});
window.__goldType = { openModal, close: () => modal && modal.close(), steer, CFG };
