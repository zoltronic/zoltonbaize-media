/* Phone mockup v3: a three.js iPhone 16 Pro-proportioned shell with the video full-bleed on its screen.
   Proportions from the real device (screen 66.9 x 145.4 mm, 2.3 mm bezel, 9.15 mm display corner, 8.25 mm deep):
   the body outline and the screen outline share one centre of curvature, so the two corners run parallel.
   Corners are continuous-curvature (superellipse), not circular arcs, which is what reads as an Apple corner.
   No hover tilt. A light slowly passes across the glass: the environment turns, a soft key light sweeps.
   Markup: <div class="phone_mock" data-webm="…" data-mp4="…" data-poster="…" data-label="…"></div>
   The screen takes the video's real aspect ratio once its metadata is known (fallback 0.4615, iPhone Pro).
   Knobs: window.PHONE_MOCK_CONFIG { envIntensity, sweepSeconds, sweepStrength, shadow, bezel, radius, depth, edge, squircle, fit } */
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

const BASE = window.GOLD_HERO_BASE || './';
// units: screen height = 2 (145.4 mm), so 1 mm = 0.01376
const MM = 2 / 145.4;
const CFG = Object.assign({ envIntensity: 1.1, sweepSeconds: 9, sweepStrength: 1.0, shadow: 0.3, bezel: 2.3 * MM, radius: 9.15 * MM, depth: 8.25 * MM, edge: 0.9 * MM, squircle: 4.2, fit: 0.9 }, window.PHONE_MOCK_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
RectAreaLightUniformsLib.init();
// phones get the HTML takeover version (phone_dom.js); this WebGL version is for wider screens
const MOBILE = matchMedia('(max-width: 767px)').matches;
const mocks = MOBILE ? [] : [...document.querySelectorAll('.phone_mock')];
if (mocks.length) init().catch(err => { console.warn('[phone-mock]', err); mocks.forEach(fallback); });

let replayStyled = false;
function injectReplayStyle() {
  if (replayStyled) return; replayStyled = true;
  const st = document.createElement('style');
  st.textContent = '.phone_mock-replay{position:absolute;left:50%;bottom:0;transform:translate(-50%,calc(100% + 14px));z-index:2;display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;font:500 14px/1 "Schibsted Grotesk",-apple-system,sans-serif;cursor:pointer;opacity:.8;transition:opacity .2s}.phone_mock-replay:hover{opacity:1}.phone_mock-replay[hidden]{display:none}';
  document.head.appendChild(st);
}
// no WebGL: hand the mockup to the HTML version rather than leaving an empty box
function fallback(el) { if (window.__phoneDom) { el.querySelectorAll('canvas').forEach(c => c.remove()); window.__phoneDom.build(el, {}); return; } el.classList.add('is-static'); const v = el.querySelector('video'); if (v) v.style.opacity = '1'; }

async function init() {
  const probe = document.createElement('canvas'); if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { mocks.forEach(fallback); return; }
  const envTex = await new THREE.TextureLoader().loadAsync(BASE + 'env_roof_1k.png');
  envTex.mapping = THREE.EquirectangularReflectionMapping; envTex.colorSpace = THREE.SRGBColorSpace;
  for (const el of mocks) build(el, envTex);
}

// continuous-curvature corner: a superellipse quadrant spread over 1.3x the nominal radius
function cornerPts(cx, cy, r, a0, n, seg) { const out = []; for (let i = 0; i <= seg; i++) { const t = a0 + (i / seg) * Math.PI / 2; const c = Math.cos(t), s = Math.sin(t); out.push(new THREE.Vector2(cx + r * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), cy + r * Math.sign(s) * Math.pow(Math.abs(s), 2 / n))); } return out; }
function roundedRect(w, h, r, n = CFG.squircle, seg = 24) {
  const R = Math.min(r * 1.3, w / 2, h / 2), x = w / 2 - R, y = h / 2 - R;
  const pts = [...cornerPts(x, y, R, 0, n, seg), ...cornerPts(-x, y, R, Math.PI / 2, n, seg), ...cornerPts(-x, -y, R, Math.PI, n, seg), ...cornerPts(x, -y, R, Math.PI * 1.5, n, seg)];
  return new THREE.Shape(pts);
}
function shapeGeo(w, h, r) { const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 1); const uv = g.attributes.uv, pos = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5); return g; }
function shadowTexture() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 20, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.55, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

function build(el, envTex) {
  // data-once: a confirmation, not a loader. It plays through once when the phone is in view, holds its last frame, and offers Replay.
  const once = 'once' in el.dataset;
  let video = el.querySelector('video');
  if (!video) {
    video = document.createElement('video'); video.muted = true; video.loop = !once; video.playsInline = true; video.autoplay = !once; video.preload = 'auto'; video.crossOrigin = 'anonymous';
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
  const H = 2, bezel = CFG.bezel, R = CFG.radius;
  let ratio = parseFloat(el.dataset.ratio) || 0.4615;
  const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace; vt.minFilter = THREE.LinearFilter; vt.generateMipmaps = false;
  const frameMat = new THREE.MeshPhysicalMaterial({ color: 0x8e8983, metalness: 1, roughness: 0.32, envMapIntensity: 1.2 }); // brushed titanium band
  const frontMat = new THREE.MeshPhysicalMaterial({ color: 0x050505, metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03 }); // black glass around the screen
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.035, transparent: true, opacity: 0.12, envMapIntensity: 2.4, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.02 });
  const screenMat = new THREE.MeshBasicMaterial({ map: vt, toneMapped: false });
  const islandMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  let parts = [];
  function buildPhone() {
    for (const p of parts) { group.remove(p); p.geometry.dispose(); } parts = [];
    const W = H * ratio, bw = W + bezel * 2, bh = H + bezel * 2, e = CFG.edge, depth = CFG.depth;
    // roundedRect spreads its corner over 1.3x the radius; this keeps the body corner exactly one bezel outside the screen corner
    const rb = R + (bezel - e) / 1.3;
    // one extrusion: caps are black glass, the sides are the metal band with a small rolled edge
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(roundedRect(bw - 2 * e, bh - 2 * e, rb), { depth: depth - 2 * e, bevelEnabled: true, bevelThickness: e, bevelSize: e, bevelSegments: 5, curveSegments: 24 }), [frontMat, frameMat]);
    body.position.z = -depth / 2 + e;
    // screen: same centre of curvature as the body, radius = body radius - bezel
    const screen = new THREE.Mesh(shapeGeo(W, H, R), screenMat); screen.position.z = depth / 2 + 0.0015;
    const glass = new THREE.Mesh(shapeGeo(bw - 2 * e, bh - 2 * e, rb), glassMat); glass.position.z = depth / 2 + 0.004;
    const island = new THREE.Mesh(shapeGeo(W * 0.27, 0.07, 0.035), islandMat); island.position.set(0, H / 2 - 0.058, depth / 2 + 0.0025);
    parts = [body, screen, glass, island]; parts.forEach(p => group.add(p));
    fit();
  }
  // ground shadow that moves with the light
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.6), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, opacity: CFG.shadow, depthWrite: false }));
  shadow.position.set(0, -0.15, -0.35); scene.add(shadow);
  // sweeping key light: a tall softbox that travels left → right in front of the phone
  const sweep = new THREE.RectAreaLight(0xfff3e0, 3.2 * CFG.sweepStrength, 1.6, 5); sweep.position.set(-3, 0.6, 3.2); sweep.lookAt(0, 0, 0); scene.add(sweep);
  const fill = new THREE.RectAreaLight(0xffe9cc, 0.9, 6, 6); fill.position.set(0, 1, 5); fill.lookAt(0, 0, 0); scene.add(fill);

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 50); camera.position.set(0, 0, 8);
  function fit() { const w = el.clientWidth || 300, h = el.clientHeight || 600; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const bh = H + bezel * 2, bw = H * ratio + bezel * 2; const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); camera.position.z = Math.max((bh / CFG.fit) / 2 / t, (bw / CFG.fit) / 2 / t / camera.aspect); }
  new ResizeObserver(fit).observe(el);
  video.addEventListener('loadedmetadata', () => { if (video.videoWidth && video.videoHeight) { const r = video.videoWidth / video.videoHeight; if (Math.abs(r - ratio) > 0.002) { ratio = r; buildPhone(); } } });
  buildPhone();

  let visible = true;
  if (once) {
    let played = false;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'phone_mock-replay'; btn.hidden = true;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Replay</span>';
    el.appendChild(btn); injectReplayStyle();
    const start = () => { btn.hidden = true; video.currentTime = 0; video.play().catch(() => {}); };
    btn.addEventListener('click', start);
    video.addEventListener('ended', () => { btn.hidden = false; });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (!played && es[0].intersectionRatio >= 0.6) { played = true; start(); } }, { threshold: [0, 0.6] }).observe(el);
  } else {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) video.play().catch(() => {}); }, { rootMargin: '200px' }).observe(el);
    video.play().catch(() => {});
  }
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
