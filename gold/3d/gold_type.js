/* Gold type — reflective 3D letters in three.js, matched to the hosted demo's look:
   studio HDRI (sunset key) turning slowly around the letters, ACES tone mapping, a touch of bloom for the glimmer.
   Teaser: <div class="gold_type" data-text="GOLD"></div>. Modal: any [data-gold-type-open] opens a glass modal with a text field.
   Knobs: window.GOLD_TYPE_CONFIG { hdr, font, color, roughness, envIntensity, exposure, bloomStrength, bloomRadius, bloomThreshold,
   envSpinSeconds, envElevationDegrees, yawAmount, pitchAmount, spin, fitWidth, depth, bevel, placeholder } */
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const BASE = window.GOLD_HERO_BASE || './';
const CFG = Object.assign({
  font: 'fonts/helvetiker_bold.typeface.json', hdr: 'hdr/studio.hdr',
  color: [1, 0.766, 0.336], roughness: 0.12, metalness: 1, envIntensity: 0.6, exposure: 1,
  bloomStrength: 0.26, bloomRadius: 0.36, bloomThreshold: 0.86,
  envSpinSeconds: 35, envElevationDegrees: 14, spin: 0.22, yawAmount: 0.16, pitchAmount: 0.05,
  fitWidth: 0.8, fitHeight: 0.55, size: 1, depth: 0.34, bevel: 0.034, bevelSegments: 14, curveSegments: 16,
  placeholder: 'type something here',
}, window.GOLD_TYPE_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const abs = p => /^https?:/.test(p) ? p : BASE + p;
let shared = null;
async function assets() {
  if (shared) return shared;
  const [hdr, font] = await Promise.all([new RGBELoader().loadAsync(abs(CFG.hdr)), new FontLoader().loadAsync(abs(CFG.font))]);
  hdr.mapping = THREE.EquirectangularReflectionMapping;
  return (shared = { hdr, font });
}

function makeScene(el, opts = {}) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = CFG.exposure;
  const scene = new THREE.Scene(); scene.environmentIntensity = CFG.envIntensity;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100); camera.position.set(0, 0, 9);
  const group = new THREE.Group(); scene.add(group);
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(CFG.color[0], CFG.color[1], CFG.color[2], THREE.LinearSRGBColorSpace), metalness: CFG.metalness, roughness: CFG.roughness, envMapIntensity: 1 });
  // post: bloom for the glimmer, then a final pass that tone-maps, encodes and keeps the alpha of the transparent canvas
  const baseRT = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType }));
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), CFG.bloomStrength, CFG.bloomRadius, CFG.bloomThreshold); composer.addPass(bloom);
  const out = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, tBase: { value: baseRT.texture } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform sampler2D tBase; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float a0 = texture2D(tBase, vUv).a; float lum = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); float a = max(a0, clamp(lum * 1.4, 0.0, 1.0)); gl_FragColor = vec4(c.rgb, a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
  });
  out.material.toneMapped = true; composer.addPass(out);
  let mesh = null, font = null, current = opts.text || 'GOLD';
  function setText(text) {
    if (!font) return;
    if (mesh) { group.remove(mesh); mesh.geometry.dispose(); }
    const t = (text || '').trim() || (opts.empty ?? 'GOLD');
    const geo = new TextGeometry(t, { font, size: CFG.size, depth: CFG.depth, curveSegments: CFG.curveSegments, bevelEnabled: true, bevelThickness: CFG.bevel, bevelSize: CFG.bevel * 0.85, bevelSegments: CFG.bevelSegments });
    geo.computeBoundingBox(); const bb = geo.boundingBox; const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y; geo.translate(-(bb.min.x + w / 2), -(bb.min.y + h / 2), -CFG.depth / 2);
    mesh = new THREE.Mesh(geo, mat); group.add(mesh);
    const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z, viewW = viewH * camera.aspect;
    group.scale.setScalar(Math.min((viewW * CFG.fitWidth) / Math.max(w, 0.01), (viewH * CFG.fitHeight) / Math.max(h, 0.01)));
  }
  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 200, pr = renderer.getPixelRatio(); renderer.setSize(w, h, false); composer.setSize(w, h); baseRT.setSize(w * pr, h * pr); bloom.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (mesh) setText(current); }
  new ResizeObserver(resize).observe(el); resize();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; let running = true; const t0 = performance.now();
  const onMove = e => { if (e.pointerType === 'touch') return; pointer.tx = (e.clientX / innerWidth) * 2 - 1; pointer.ty = (e.clientY / innerHeight) * 2 - 1; };
  addEventListener('pointermove', onMove, { passive: true });
  function loop(now) {
    if (!running) return; requestAnimationFrame(loop);
    const t = (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.05; pointer.y += (pointer.ty - pointer.y) * 0.05;
    group.rotation.y = pointer.x * CFG.yawAmount + (reduce ? 0 : Math.sin(t * 0.35) * CFG.spin * 0.4);
    group.rotation.x = -pointer.y * CFG.pitchAmount + (reduce ? 0 : Math.sin(t * 0.23) * 0.03);
    // the HDRI turns slowly around the letters, so the highlight travels across their faces
    scene.environmentRotation.set(THREE.MathUtils.degToRad(CFG.envElevationDegrees), reduce ? 0 : (t * Math.PI * 2) / CFG.envSpinSeconds, 0);
    renderer.setRenderTarget(baseRT); renderer.clear(); renderer.render(scene, camera); renderer.setRenderTarget(null);
    composer.render();
  }
  return {
    async start() { const a = await assets(); const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromEquirectangular(a.hdr).texture; pmrem.dispose(); font = a.font; setText(current); requestAnimationFrame(loop); },
    setText(t) { current = t; setText(t); },
    dispose() { running = false; removeEventListener('pointermove', onMove); composer.dispose(); baseRT.dispose(); renderer.dispose(); canvas.remove(); },
  };
}

const probe = document.createElement('canvas'); const hasGL = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
for (const el of document.querySelectorAll('.gold_type')) {
  if (!hasGL) { el.classList.add('is-static'); continue; }
  el.style.position = el.style.position || 'relative';
  const s = makeScene(el, { text: el.dataset.text || 'GOLD' }); s.start().catch(err => { console.warn('[gold-type]', err); el.classList.add('is-static'); });
}

let modal = null;
function openModal() {
  if (modal) return;
  const wrap = document.createElement('div'); wrap.className = 'gold_modal'; wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true'); wrap.setAttribute('aria-label', 'Type your own gold text');
  wrap.innerHTML = `
    <div class="gold_modal-backdrop"></div>
    <div class="gold_modal-panel">
      <button type="button" class="gold_modal-close" aria-label="Close"><span aria-hidden="true">×</span></button>
      <div class="gold_modal-stage"></div>
      <label class="gold_modal-field"><span class="gold_modal-label">Your text</span><input class="gold_modal-input" type="text" maxlength="24" autocomplete="off" spellcheck="false" placeholder="${CFG.placeholder}"></label>
    </div>`;
  const y = scrollY; document.body.appendChild(wrap); document.documentElement.classList.add('gold_modal-open');
  const stage = wrap.querySelector('.gold_modal-stage'), input = wrap.querySelector('.gold_modal-input');
  const s = makeScene(stage, { text: 'GOLD', empty: 'GOLD' }); s.start().catch(() => {});
  let timer = 0; input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => s.setText(input.value), 120); });
  const close = () => { s.dispose(); wrap.remove(); document.documentElement.classList.remove('gold_modal-open'); scrollTo(0, y); modal = null; removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  wrap.querySelector('.gold_modal-close').addEventListener('click', close); wrap.querySelector('.gold_modal-backdrop').addEventListener('click', close); addEventListener('keydown', onKey);
  modal = { close }; requestAnimationFrame(() => { wrap.classList.add('is-open'); input.focus(); });
}
document.addEventListener('click', e => { const b = e.target.closest('[data-gold-type-open]'); if (!b) return; e.preventDefault(); if (hasGL) openModal(); else window.open(b.getAttribute('href') || 'https://cheery-zuccutto-125e43.netlify.app/', '_blank'); });
window.__goldType = { openModal, close: () => modal && modal.close() };
