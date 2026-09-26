/* Glass phone mockup v2 — a three.js iPhone-style shell with the video full-bleed on its screen.
   No hover tilt. A light slowly passes across the phone: the environment turns, a soft key light sweeps
   over the cover glass, and a ground shadow shifts with it.
   Markup: <div class="phone_mock" data-webm="…" data-mp4="…" data-poster="…" data-label="…"></div>
   The screen takes the video's real aspect ratio once its metadata is known (fallback 0.4615, iPhone Pro).
   Knobs: window.PHONE_MOCK_CONFIG { envIntensity, sweepSeconds, sweepStrength, shadow, bezel, radius } */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const BASE = window.GOLD_HERO_BASE || './';
const CFG = Object.assign({ envIntensity: 1.1, sweepSeconds: 9, sweepStrength: 1.0, shadow: 0.55, bezel: 0.052, radius: 0.19, fit: 0.9 }, window.PHONE_MOCK_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
RectAreaLightUniformsLib.init();
const mocks = [...document.querySelectorAll('.phone_mock')];
if (mocks.length) init().catch(err => { console.warn('[phone-mock]', err); mocks.forEach(fallback); });

function fallback(el) { el.classList.add('is-static'); const v = el.querySelector('video'); if (v) v.style.opacity = '1'; }

async function init() {
  const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { mocks.forEach(fallback); return; }
  const envTex = await new THREE.TextureLoader().loadAsync(BASE + 'env_roof_1k.png');
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  for (const el of mocks) build(el, envTex);
}

function roundedRect(w, h, r) { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
function shapeGeo(w, h, r) { const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 14); const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5); return g; }
function shadowTexture() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function build(el, envTex) {
  let video = el.querySelector('video');
  if (!video) {
    video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.preload = 'auto'; video.crossOrigin = 'anonymous';
    if (el.dataset.poster) video.poster = el.dataset.poster;
    for (const [k, t] of [['webm', 'video/webm'], ['mp4', 'video/mp4']]) if (el.dataset[k]) { const s = document.createElement('source'); s.src = el.dataset[k]; s.type = t; video.appendChild(s); }
    video.setAttribute('aria-label', el.dataset.label || 'Phone screen recording'); el.appendChild(video);
  }
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none';
  const canvas = document.createElement('canvas'); canvas.className = 'phone_mock-gl'; canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromEquirectangular(envTex).texture; pmrem.dispose();
  scene.environmentIntensity = CFG.envIntensity;

  const group = new THREE.Group(); scene.add(group);
  const H = 2, bezel = CFG.bezel, depth = 0.1, R = CFG.radius;
  let ratio = parseFloat(el.dataset.ratio) || 0.4615;
  const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace; vt.minFilter = THREE.LinearFilter; vt.generateMipmaps = false;
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1917, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.0 });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0x8b8580, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.035, transparent: true, opacity: 0.14, envMapIntensity: 2.4, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.02 });
  const screenMat = new THREE.MeshBasicMaterial({ map: vt, toneMapped: false });
  const islandMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  let parts = [];
  function buildPhone() {
    for (const p of parts) { group.remove(p); p.geometry.dispose(); } parts = [];
    const W = H * ratio, bw = W + bezel * 2, bh = H + bezel * 2;
    const body = new THREE.Mesh(new RoundedBoxGeometry(bw, bh, depth, 6, R), bodyMat);
    const rim = new THREE.Mesh(new RoundedBoxGeometry(bw + 0.012, bh + 0.012, depth * 0.55, 6, R + 0.006), rimMat); rim.position.z = -0.004;
    // the screen's corner radius is the body radius minus the bezel, so the two curves are concentric
    const screen = new THREE.Mesh(shapeGeo(W, H, Math.max(0.02, R - bezel)), screenMat); screen.position.z = depth / 2 + 0.001;
    const glass = new THREE.Mesh(shapeGeo(bw - 0.004, bh - 0.004, R - 0.002), glassMat); glass.position.z = depth / 2 + 0.004;
    const island = new THREE.Mesh(shapeGeo(W * 0.26, 0.062, 0.031), islandMat); island.position.set(0, H / 2 - 0.075, depth / 2 + 0.002);
    parts = [rim, body, screen, glass, island]; parts.forEach(p => group.add(p));
    fit();
  }
  // ground shadow that moves with the light
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 4.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: CFG.shadow, depthWrite: false }));
  shadow.position.set(0, -0.15, -0.35); scene.add(shadow);
  // sweeping key light: a tall softbox that travels left → right in front of the phone
  const sweep = new THREE.RectAreaLight(0xfff3e0, 3.2 * CFG.sweepStrength, 1.6, 5); sweep.position.set(-3, 0.6, 3.2); sweep.lookAt(0, 0, 0); scene.add(sweep);
  const fill = new THREE.RectAreaLight(0xffe9cc, 0.9, 6, 6); fill.position.set(0, 1, 5); fill.lookAt(0, 0, 0); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 50); camera.position.set(0, 0, 8);
  function fit() { const w = el.clientWidth || 300, h = el.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const bh = H + bezel * 2, bw = H * ratio + bezel * 2; const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); camera.position.z = Math.max((bh / CFG.fit) / 2 / t, (bw / CFG.fit) / 2 / t / camera.aspect); }
  new ResizeObserver(fit).observe(el);
  video.addEventListener('loadedmetadata', () => { if (video.videoWidth && video.videoHeight) { const r = video.videoWidth / video.videoHeight; if (Math.abs(r - ratio) > 0.002) { ratio = r; buildPhone(); } } });
  buildPhone();

  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) video.play().catch(() => {}); }, { rootMargin: '200px' }).observe(el);
  video.play().catch(() => {});
  const t0 = performance.now();
  function loop(now) {
    requestAnimationFrame(loop); if (!visible) return;
    const t = reduce ? 0 : (now - t0) / 1000;
    const ph = (t % CFG.sweepSeconds) / CFG.sweepSeconds; // 0..1 across one pass
    const x = -3.4 + ph * 6.8; // light travels across
    sweep.position.set(x, 0.6 + Math.sin(ph * Math.PI) * 0.3, 3.2); sweep.lookAt(0, 0, 0);
    sweep.intensity = 3.2 * CFG.sweepStrength * Math.sin(ph * Math.PI); // fades in and out at the ends of the pass
    scene.environmentRotation.set(0, 0.55 + Math.sin(t * 0.25) * 0.35, 0); // the reflection map drifts across the glass
    shadow.position.x = -x * 0.09; shadow.position.y = -0.15 - Math.sin(ph * Math.PI) * 0.05; shadow.material.opacity = CFG.shadow * (0.7 + 0.3 * Math.sin(ph * Math.PI));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
  el.classList.add('is-live');
}
