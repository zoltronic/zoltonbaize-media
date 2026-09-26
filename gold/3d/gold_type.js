/* Gold type — reflective 3D letters in three.js.
   Teaser: <div class="gold_type" data-text="GOLD"></div> renders extruded letters that turn toward the pointer.
   Modal:  any element with data-gold-type-open opens a full-screen modal (page glass language) with a text field; the letters re-render as you type.
   Uses the hero's environment map (window.GOLD_HERO_BASE + env_roof_1k.png) and the same base gold. */
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const BASE = window.GOLD_HERO_BASE || './';
const CFG = Object.assign({ font: 'fonts/helvetiker_bold.typeface.json', color: '#f4d094', roughness: 0.14, envIntensity: 1.25, envBaseX: 0.55, envBaseY: -2.7, tilt: 0.5, envSpin: 0.12, bevel: 0.035, depth: 0.32, placeholder: 'type something here' }, window.GOLD_TYPE_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
let shared = null; // { envTex, font } — the PMREM is built per renderer, a GPU texture cannot be shared across WebGL contexts
async function assets() {
  if (shared) return shared;
  const [envTex, font] = await Promise.all([
    new THREE.TextureLoader().loadAsync(BASE + 'env_roof_1k.png'),
    new FontLoader().loadAsync(/^https?:/.test(CFG.font) ? CFG.font : BASE + CFG.font),
  ]);
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  return (shared = { envTex, font });
}

function makeScene(el, opts = {}) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene(); scene.environmentIntensity = CFG.envIntensity; const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100); camera.position.set(0, 0, 9);
  const group = new THREE.Group(); scene.add(group);
  const key = new THREE.DirectionalLight(0xfff1dc, 1.2); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9a0, 0.6); rim.position.set(4, -2, -3); scene.add(rim);
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(CFG.color), metalness: 1, roughness: CFG.roughness, clearcoat: 0.3, clearcoatRoughness: 0.1, envMapIntensity: CFG.envIntensity });
  let mesh = null, font = null;
  function setText(text) {
    if (!font) return;
    if (mesh) { group.remove(mesh); mesh.geometry.dispose(); }
    const t = (text || '').trim() || (opts.empty ?? ' ');
    const geo = new TextGeometry(t, { font, size: 1, depth: CFG.depth, curveSegments: 10, bevelEnabled: true, bevelThickness: CFG.bevel, bevelSize: CFG.bevel * 0.7, bevelSegments: 4 });
    geo.computeBoundingBox(); const bb = geo.boundingBox; const w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y; geo.translate(-(bb.min.x + w / 2), -(bb.min.y + h / 2), -CFG.depth / 2);
    mesh = new THREE.Mesh(geo, mat); group.add(mesh);
    // fit: scale so the text spans ~78% of the view width
    const aspect = camera.aspect; const viewH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z; const viewW = viewH * aspect;
    const s = Math.min((viewW * 0.78) / Math.max(w, 0.01), (viewH * 0.5) / Math.max(h, 0.01)); group.scale.setScalar(s);
  }
  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 200; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (mesh) setText(current); }
  let current = opts.text || 'GOLD';
  new ResizeObserver(resize).observe(el); resize();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 }; let running = true, t0 = performance.now();
  const onMove = e => { if (e.pointerType === 'touch') return; const r = (opts.pointerRoot || window) === window ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : el.getBoundingClientRect(); pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1; };
  (opts.pointerRoot || window).addEventListener('pointermove', onMove, { passive: true });
  function loop(now) { if (!running) return; requestAnimationFrame(loop); const t = (now - t0) / 1000; pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06; group.rotation.y = pointer.x * CFG.tilt + (reduce ? 0 : Math.sin(t * 0.4) * 0.06); group.rotation.x = -pointer.y * CFG.tilt * 0.6; scene.environmentRotation.set(CFG.envBaseX, CFG.envBaseY + (reduce ? 0 : t * CFG.envSpin), 0); renderer.render(scene, camera); }
  return {
    async start() { const a = await assets(); const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromEquirectangular(a.envTex).texture; pmrem.dispose(); font = a.font; setText(current); requestAnimationFrame(loop); },
    setText(t) { current = t; setText(t); },
    dispose() { running = false; renderer.dispose(); (opts.pointerRoot || window).removeEventListener('pointermove', onMove); canvas.remove(); },
  };
}

// ---------- teaser(s) ----------
const probe = document.createElement('canvas'); const hasGL = !!(probe.getContext('webgl2') || probe.getContext('webgl'));
for (const el of document.querySelectorAll('.gold_type')) {
  if (!hasGL) { el.classList.add('is-static'); continue; }
  el.style.position = el.style.position || 'relative';
  const s = makeScene(el, { text: el.dataset.text || 'GOLD' }); s.start().catch(err => { console.warn('[gold-type]', err); el.classList.add('is-static'); });
}

// ---------- modal ----------
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
  document.body.appendChild(wrap); document.documentElement.classList.add('gold_modal-open');
  const stage = wrap.querySelector('.gold_modal-stage'), input = wrap.querySelector('.gold_modal-input');
  const s = makeScene(stage, { text: 'GOLD', pointerRoot: window, empty: 'GOLD' }); s.start().catch(() => {});
  let timer = 0; input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => s.setText(input.value), 120); });
  const close = () => { s.dispose(); wrap.remove(); document.documentElement.classList.remove('gold_modal-open'); modal = null; removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  wrap.querySelector('.gold_modal-close').addEventListener('click', close); wrap.querySelector('.gold_modal-backdrop').addEventListener('click', close); addEventListener('keydown', onKey);
  modal = { close }; requestAnimationFrame(() => { wrap.classList.add('is-open'); input.focus(); });
}
for (const b of document.querySelectorAll('[data-gold-type-open]')) b.addEventListener('click', e => { e.preventDefault(); if (hasGL) openModal(); else window.open(b.getAttribute('href') || 'https://cheery-zuccutto-125e43.netlify.app/', '_blank'); });
window.__goldType = { openModal, close: () => modal && modal.close() };
