/* Glass phone mockup — a three.js phone shell with a looping video on its screen.
   Tilts toward the pointer (same feel as the hero cube) and catches the HDRI sheen as it moves.
   Markup: <div class="phone_mock" data-webm="…" data-mp4="…" data-poster="…" data-ratio="0.4618"></div>
   Loads once per page, drives every .phone_mock on it. Base for the HDRI: window.GOLD_HERO_BASE (same folder as the hero). */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BASE = window.GOLD_HERO_BASE || './';
const CFG = Object.assign({ tiltX: 0.22, tiltY: 0.34, envIntensity: 1.1, sway: 0.035 }, window.PHONE_MOCK_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const mocks = [...document.querySelectorAll('.phone_mock')];
if (mocks.length) init().catch(err => { console.warn('[phone-mock]', err); mocks.forEach(fallback); });

function fallback(el) { el.classList.add('is-static'); const v = el.querySelector('video'); if (v) v.style.opacity = '1'; }

async function init() {
  const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { mocks.forEach(fallback); return; }
  const envTex = await new THREE.TextureLoader().loadAsync(BASE + 'env_roof_1k.png');
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; pointer.tx = (e.clientX / innerWidth) * 2 - 1; pointer.ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });
  for (const el of mocks) build(el, envTex, pointer);
}

function roundedRect(w, h, r) { const s = new THREE.Shape(); const x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }

function build(el, envTex, pointer) {
  const ratio = parseFloat(el.dataset.ratio) || 0.4618; // screen width / height (iPhone Pro: 1179/2556)
  // video element (also the no-WebGL fallback)
  let video = el.querySelector('video');
  if (!video) {
    video = document.createElement('video'); video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.preload = 'auto'; video.crossOrigin = 'anonymous';
    if (el.dataset.poster) video.poster = el.dataset.poster;
    if (el.dataset.webm) { const s = document.createElement('source'); s.src = el.dataset.webm; s.type = 'video/webm'; video.appendChild(s); }
    if (el.dataset.mp4) { const s = document.createElement('source'); s.src = el.dataset.mp4; s.type = 'video/mp4'; video.appendChild(s); }
    video.setAttribute('aria-label', el.dataset.label || 'Phone screen recording');
    el.appendChild(video);
  }
  video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none';
  const canvas = document.createElement('canvas'); canvas.className = 'phone_mock-gl'; canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromEquirectangular(envTex).texture; pmrem.dispose();
  scene.environmentIntensity = CFG.envIntensity;

  // phone proportions (screen height = 2 units)
  const H = 2, W = H * ratio, bezel = 0.055, depth = 0.11, R = 0.19;
  const body = new THREE.Mesh(new RoundedBoxGeometry(W + bezel * 2, H + bezel * 2, depth, 6, R), new THREE.MeshPhysicalMaterial({ color: 0x1b1917, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.0 }));
  const group = new THREE.Group(); group.add(body);
  // titanium-ish rim highlight: a slightly larger, thinner ring behind the front face
  const rim = new THREE.Mesh(new RoundedBoxGeometry(W + bezel * 2 + 0.01, H + bezel * 2 + 0.01, depth * 0.55, 6, R), new THREE.MeshPhysicalMaterial({ color: 0x8b8580, metalness: 1, roughness: 0.22, envMapIntensity: 1.3 }));
  rim.position.z = -0.005; group.add(rim);
  // screen with rounded corners showing the video
  const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace; vt.minFilter = THREE.LinearFilter; vt.generateMipmaps = false;
  const screenGeo = new THREE.ShapeGeometry(roundedRect(W, H, R - bezel * 0.6), 12);
  // map uvs from the shape's bounding box to 0..1
  const uv = screenGeo.attributes.uv; const pos = screenGeo.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / W + 0.5, pos.getY(i) / H + 0.5);
  const screen = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial({ map: vt, toneMapped: false })); screen.position.z = depth / 2 + 0.001; group.add(screen);
  // cover glass: a thin reflective plane over the screen that carries the sheen as the phone tilts
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(W + bezel * 1.2, H + bezel * 1.2, R), 12), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 2.2, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.03 }));
  glass.position.z = depth / 2 + 0.004; group.add(glass);
  // dynamic island
  const island = new THREE.Mesh(new THREE.ShapeGeometry(roundedRect(W * 0.32, 0.075, 0.037), 8), new THREE.MeshBasicMaterial({ color: 0x050505 })); island.position.set(0, H / 2 - 0.09, depth / 2 + 0.002); group.add(island);
  // side buttons
  const btnMat = new THREE.MeshPhysicalMaterial({ color: 0x8b8580, metalness: 1, roughness: 0.3 });
  for (const [y, h, side] of [[0.45, 0.18, -1], [0.15, 0.32, -1], [-0.26, 0.32, -1], [0.2, 0.42, 1]]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.03, h, depth * 0.5), btnMat); b.position.set(side * (W / 2 + bezel + 0.012), y, 0); group.add(b); }
  scene.add(group);
  const key = new THREE.DirectionalLight(0xfff2e0, 0.9); key.position.set(-2, 3, 4); scene.add(key);

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50); camera.position.set(0, 0, 7.4);
  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const fit = (H + bezel * 2 + 0.25) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); camera.position.z = Math.max(fit, (W + bezel * 2 + 0.6) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.aspect); }
  new ResizeObserver(resize).observe(el); resize();

  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) video.play().catch(() => {}); }, { rootMargin: '200px' }).observe(el);
  video.play().catch(() => {});
  let t0 = performance.now();
  function loop(now) {
    requestAnimationFrame(loop); if (!visible) return;
    const t = (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    const swayX = reduce ? 0 : Math.sin(t * 0.7) * CFG.sway, swayY = reduce ? 0 : Math.cos(t * 0.5) * CFG.sway;
    group.rotation.y = pointer.x * CFG.tiltY + swayY; group.rotation.x = -pointer.y * CFG.tiltX + swayX;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
  el.classList.add('is-live');
}
