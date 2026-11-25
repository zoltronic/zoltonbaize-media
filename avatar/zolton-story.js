// About page scroll story — "No limits" hero's journey (rough full-arc pass).
// Loaded only on the staging site (or with ?story). Hooks into the live avatar via window.__z.
// Motion model: ambient motion never stops (clouds turn, holograms orbit, he breathes); scroll sets how far the
// story has got (eased), and the big moments (glasses on, lightning, coin) fire once you scroll past them.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import {RGBELoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js/+esm';

const Z = await new Promise(res => { const t = setInterval(() => {
  const z = window.__z; if (z && z.onFrame && z.bones && z.bones.mixamorigHead && z.HOST) { clearInterval(t); res(z); } }, 100); });

const TRACK = 600;                       // extra scroll length, in vh
const HOST = Z.HOST, embed = HOST.parentElement, hero = HOST.closest('section') || embed.parentElement;
const { scene, camera, bones, state } = Z;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (p, a, b) => sm((p - a) / (b - a));                     // 0 → 1 between a and b
const band = (p, a, b, c, d) => ramp(p, a, b) * (1 - ramp(p, c, d)); // up a→b, down c→d

// ---------- page layout: hero becomes a long track, the 3D stage sticks to the screen ----------
hero.classList.add('zstory');
const css = document.createElement('style');
css.textContent = `
.about_hero.zstory{display:block!important;min-height:0!important;height:${100 + TRACK}vh;padding-top:0!important;padding-bottom:0!important}
.about_hero.zstory > .w-embed{position:sticky!important;top:0!important;right:auto!important;bottom:auto!important;left:auto!important;width:100vw;margin-left:calc((100% - 100vw) / 2);height:100vh;margin-bottom:-100vh}
.about_hero.zstory > .page_wrap{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:111px;box-sizing:border-box}
#zs-dim,#zs-rays,#zs-flash,#zs-bloom{position:absolute;inset:0;pointer-events:none;opacity:0}
#zs-dim{background:radial-gradient(120% 90% at 62% 40%,#1b2a44 0%,#0b1424 70%,#070d18 100%)}
#zs-rays{mix-blend-mode:screen;filter:blur(10px)}
#zs-flare{position:absolute;inset:0;pointer-events:none;opacity:0;mix-blend-mode:screen}
#zs-flare i{position:absolute;border-radius:50%;transform:translate(-50%,-50%);filter:blur(2px)}
#zs-flare b{position:absolute;height:3px;transform:translate(-50%,-50%);background:linear-gradient(90deg,rgba(255,220,170,0),rgba(255,236,200,.85),rgba(255,220,170,0));filter:blur(1.5px)}
#zs-brain{position:fixed;left:16px;bottom:56px;z-index:9999;font:600 12px/1 system-ui;padding:8px 12px;border-radius:999px;border:0;background:rgba(10,20,40,.78);color:#bfefff;cursor:pointer}
#zs-flash{background:#f4fbff}
#zs-caps{position:absolute;inset:0;pointer-events:none;z-index:3}
#zs-caps .zc{position:absolute;max-width:min(34vw,440px);opacity:0;transform:translateY(12px);transition:none;color:#fff;text-shadow:0 2px 18px rgba(0,10,30,.55)}
#zs-caps .zc.light{color:#0b1b33;text-shadow:0 1px 14px rgba(255,255,255,.6)}
#zs-cta{position:absolute;pointer-events:auto;opacity:0;display:inline-flex;align-items:center;gap:.5em;padding:.85em 1.4em;border-radius:999px;
  background:linear-gradient(180deg,#ffe08a,#f1b53b);color:#3a2300;font-weight:600;text-decoration:none;box-shadow:0 8px 30px rgba(240,170,40,.45);z-index:4}
@media (max-width:899px){#zs-caps .zc{max-width:80vw}}
`;
document.head.appendChild(css);

const canvas = HOST.querySelector('canvas');
const mk = (id, before) => { const d = document.createElement('div'); d.id = id; before ? HOST.insertBefore(d, canvas) : HOST.appendChild(d); return d; };
const boltCv = document.createElement('canvas'); boltCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; HOST.appendChild(boltCv); const bctx = boltCv.getContext('2d');
const dimEl = mk('zs-dim', true), raysEl = mk('zs-rays', true), flashEl = mk('zs-flash'), flareEl = mk('zs-flare'), bloomEl = mk('zs-bloom'), capsEl = mk('zs-caps');
// lens flare: soft ghosts along the line from the light through the centre of the screen, plus a horizontal streak
const FLARE = [[0, 90, 'rgba(255,240,210,.55)'], [0.35, 26, 'rgba(255,200,140,.35)'], [0.6, 60, 'rgba(160,210,255,.18)'], [0.85, 16, 'rgba(255,230,180,.45)'], [1.25, 110, 'rgba(255,190,120,.12)'], [1.55, 34, 'rgba(170,230,255,.25)']];
const flareGhosts = FLARE.map(([k, sz, c]) => { const i = document.createElement('i'); i.style.width = i.style.height = sz + 'px'; i.style.background = `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 70%)`; flareEl.appendChild(i); return { i, k }; });
const streak = document.createElement('b'); flareEl.appendChild(streak);
canvas.style.position = 'absolute';

// captions sit where the hero title sits (left third), in the site's own type styles
const CAPS = [
  [0.07, 0.10, 0.19, 0.22, 'text-subhead', 'I’m Zolton. I’ve been designing since 2004, at Apple, Google and Wells Fargo.'],
  [0.22, 0.25, 0.33, 0.36, 'text-subhead', 'I go deep in several disciplines and connect them.'],
  [0.37, 0.40, 0.52, 0.55, 'text-subhead', 'What I do: product design, motion and 3D, prototyping in code, and AI agents.'],
  [0.78, 0.80, 0.86, 0.88, 'heading-h2 light', 'That’s the process.'],
];
const capEls = CAPS.map(c => { const d = document.createElement('div'); d.className = 'zc ' + c[4]; d.textContent = c[5]; capsEl.appendChild(d); return d; });
const cta = document.createElement('a'); cta.id = 'zs-cta'; cta.href = '/'; cta.textContent = 'See the work →'; capsEl.appendChild(cta);
function placeCaps() {
  const h1 = hero.querySelector('h1'); const r = h1 ? h1.getBoundingClientRect() : { left: 32 };
  const left = Math.max(20, r.left) + 'px';
  for (const d of capEls) { d.style.left = left; d.style.top = innerWidth < 900 ? '14vh' : '42vh'; }
  cta.style.left = left; cta.style.top = innerWidth < 900 ? '22vh' : '50vh';
}
placeCaps(); addEventListener('resize', placeCaps);

// seeded randomness: every cloud, hologram and raindrop gets its own speed, tilt and phase, the same on every visit
let _seed = 20261124; const rnd = () => ((_seed = (_seed * 16807) % 2147483647) / 2147483647);
// ---------- textures ----------
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const puffTex = canvasTex(128, 128, (g, w) => {
  for (let i = 0; i < 9; i++) { const x = 34 + Math.random() * 60, y = 40 + Math.random() * 48, r = 18 + Math.random() * 26;
    const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
});
const CY = '#7fe9ff';
function holoTex(kind, label) {
  const W = 256, H = label ? 96 : 168;
  return canvasTex(W, H, (g) => {
    g.strokeStyle = CY; g.fillStyle = 'rgba(80,220,255,.10)'; g.lineWidth = 4; g.lineJoin = 'round';
    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    rr(6, 6, W - 12, H - 12, 16); g.fill(); g.stroke(); g.lineWidth = 3; g.fillStyle = CY;
    if (label) { g.font = '700 46px system-ui,Segoe UI,Helvetica,Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, W / 2, H / 2 + 2); return; }
    if (kind === 0) { rr(22, 24, 80, 60, 8); g.stroke(); g.beginPath(); g.moveTo(26, 80); g.lineTo(52, 50); g.lineTo(70, 66); g.lineTo(98, 40); g.stroke();
      for (let i = 0; i < 4; i++) { g.fillRect(118, 30 + i * 22, 110 - i * 18, 8); } }
    else if (kind === 1) { const B = [[24, 30], [140, 30], [24, 108], [140, 108]]; for (const [x, y] of B) { rr(x, y, 90, 34, 8); g.stroke(); }
      g.beginPath(); g.moveTo(114, 47); g.lineTo(140, 47); g.moveTo(69, 64); g.lineTo(69, 108); g.moveTo(114, 125); g.lineTo(140, 125); g.stroke(); }
    else if (kind === 2) { for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { rr(22 + c * 44, 22 + r * 44, 32, 32, 7); g.stroke(); } }
    else if (kind === 3) { for (let i = 0; i < 7; i++) { const h = 20 + Math.random() * 100; g.fillRect(26 + i * 30, 146 - h, 18, h); } }
    else if (kind === 4) { g.beginPath(); const c = [128, 84]; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(c[0] + Math.cos(a) * 52, c[1] + Math.sin(a) * 52); } g.closePath(); g.stroke();
      g.beginPath(); for (let i = 0; i < 6; i += 2) { const a = i * Math.PI / 3; g.moveTo(c[0], c[1]); g.lineTo(c[0] + Math.cos(a) * 52, c[1] + Math.sin(a) * 52); } g.stroke(); }
    else { for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(20, 30 + i * 22); for (let x = 20; x < 236; x += 8) g.lineTo(x, 30 + i * 22 + Math.sin(x * 0.05 + i) * 9); g.stroke(); } }
  });
}
const coinTex = canvasTex(256, 256, (g) => {
  const gr = g.createRadialGradient(100, 90, 10, 128, 128, 128); gr.addColorStop(0, '#fff2b8'); gr.addColorStop(0.45, '#f5c242'); gr.addColorStop(1, '#a8701a');
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill();
  g.lineWidth = 10; g.strokeStyle = '#c88c22'; g.beginPath(); g.arc(128, 128, 104, 0, 7); g.stroke();
  g.font = '900 150px Arial Black,Impact,system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#8a5a10'; g.fillText('Z', 134, 140); g.fillStyle = '#ffe7a0'; g.fillText('Z', 124, 130); g.fillStyle = '#f0b632'; g.fillText('Z', 128, 135);
});

// ---------- 3D props ----------
const storm = new THREE.Group(); storm.name = 'StoryStorm'; scene.add(storm);
// storm deck: big billboards of billowy smoke, lit by the scene (so in-cloud lightning lights them from inside)
function smokeTex(seed) { return canvasTex(256, 256, (g) => {
  let r = seed; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 170; i++) { const a = rnd() * 6.283, d = Math.pow(rnd(), 0.7) * 88, x = 128 + Math.cos(a) * d, y = 128 + Math.sin(a) * d * 0.8, rad = 16 + rnd() * 38;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); const al = 0.05 + rnd() * 0.09; gr.addColorStop(0, `rgba(255,255,255,${al})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 7); g.fill(); }
  const m = g.createRadialGradient(128, 128, 60, 128, 128, 128); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-in'; g.fillStyle = m; g.fillRect(0, 0, 256, 256); }); }
const smokeTexs = [smokeTex(11), smokeTex(4242), smokeTex(90001)];
const puffs = [];
for (let i = 0; i < 44; i++) {
  const m = new THREE.MeshBasicMaterial({ map: smokeTexs[i % 3], color: 0x6a7a98, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); const sz = 3.2 + rnd() * 3.8; s.scale.set(sz * 1.4, sz, 1);
  s.userData = { a: Math.random() * Math.PI * 2, r: 2.0 + Math.random() * 3.4, y: -1.2 + Math.random() * 3.8, sz, ph: Math.random() * 6, rz: rnd() * 6.28, rs: (rnd() - 0.5) * 0.12, tone: rnd() < 0.5 ? 0.35 + rnd() * 0.35 : 1.3 + rnd() * 0.9, ang: rnd() * 6.283, w: 0.55 + rnd() * 0.9, dir: rnd() < 0.12 ? -0.35 : 1, tilt: (rnd() - 0.5) * 0.5 };
  storm.add(s); puffs.push(s);
}
// lightning inside the clouds: a cold light that flickers on random timers during the storm
const cloudFlash = new THREE.PointLight(0xa9d4ff, 0, 40, 1); storm.add(cloudFlash);
let flick = 0, flickT = -1, flickNext = 1.5;
// rain: cheap falling streaks, all in one draw
const RN = 1400, rainPos = new Float32Array(RN * 6), rainD = [];
for (let i = 0; i < RN; i++) rainD.push({ r: 0.7 + Math.pow(rnd(), 0.8) * 6.5, a: rnd() * 6.283, y: -3 + rnd() * 10, l: 0.18 + rnd() * 0.22, v: 7 + rnd() * 5, w: 0.7 + rnd() * 0.6 });
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0, depthWrite: false });
const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 4; scene.add(rain);
// hologram look: scanlines, a slow bright sweep, colour fringing, edge glow, flicker and the odd glitch
function holoCardMat(tex, seed) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { map: { value: tex }, uAlpha: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D map; uniform float uAlpha, uTime, uSeed; varying vec2 vUv;
    float h(float n){ return fract(sin(n) * 43758.5453); }
    void main(){ float t = uTime; float gl = step(0.975, h(floor(t * 10.0) + uSeed * 91.0));
      vec2 uv = vUv; uv.x += gl * (h(floor(uv.y * 18.0) + floor(t * 30.0)) - 0.5) * 0.05;
      float r = texture2D(map, uv + vec2(0.006, 0.0)).a, g = texture2D(map, uv).a, b = texture2D(map, uv - vec2(0.006, 0.0)).a;
      float line = max(max(r, g), b);
      float scan = 0.62 + 0.38 * sin(vUv.y * 150.0 - t * 9.0);
      float band = smoothstep(0.08, 0.0, abs(fract(vUv.y - t * 0.3 + uSeed) - 0.5) - 0.0) ;
      vec2 e = min(vUv, 1.0 - vUv); float edge = 1.0 - smoothstep(0.0, 0.05, min(e.x, e.y));
      float flick = 0.82 + 0.18 * sin(t * 41.0 + uSeed * 17.0) * sin(t * 13.0 + uSeed * 5.0);
      vec3 col = vec3(0.35 * r + 0.1, 0.86 * g + 0.12, 1.0 * b + 0.18);
      float a = (line * scan * 0.95 + edge * 0.4 + 0.07 + band * 0.18) * flick * uAlpha;
      gl_FragColor = vec4(col * 1.25, a); }` }); }
const holos = []; const LABELS = ['Product', 'Motion', '3D', 'AI agents'];
for (let i = 0; i < 26; i++) {
  const label = i < 4 ? LABELS[i] : null; const tex = holoTex(i % 6, label);
  const mat = holoCardMat(tex, rnd());
  const w = label ? 0.62 : 0.42 + Math.random() * 0.18; const geo = new THREE.PlaneGeometry(w, w * (label ? 96 / 256 : 168 / 256));
  const h = new THREE.Mesh(geo, mat); h.renderOrder = 5;
  h.userData = { ang: (i / 26) * Math.PI * 2 + rnd() * 0.4, w: 0.6 + rnd() * 0.9, tumX: (rnd() - 0.5) * 1.2, tumY: (rnd() - 0.5) * 2.4, tx: 0, ty: 0, a: 0, r: 0.95 + Math.random() * 0.9, y: -0.55 + Math.random() * 1.35, ph: Math.random() * 6,
    on: label ? 0.40 + i * 0.012 : 0.21 + (i - 4) * 0.0055, label: !!label };
  storm.add(h); holos.push(h);
}
// brainstorm option: little cloud-brains drifting in the vortex (staging toggle, off by default)
let brainOn = /[?&]brain=1\b/.test(location.search); try { if (localStorage.getItem('zstory.brain') === '1') brainOn = true; } catch (e) {}
const brainBtn = document.createElement('button'); brainBtn.id = 'zs-brain'; document.body.appendChild(brainBtn);
const setBrainLabel = () => { brainBtn.textContent = 'Brain clouds: ' + (brainOn ? 'On' : 'Off'); }; setBrainLabel();
brainBtn.onclick = () => { brainOn = !brainOn; setBrainLabel(); try { localStorage.setItem('zstory.brain', brainOn ? '1' : '0'); } catch (e) {} };
const brainMat = new THREE.MeshToonMaterial({ color: 0xf2f5ff, emissive: 0x7d8fb2, emissiveIntensity: 0.45 });
const brains = [];
new GLTFLoader().load(new URL('./brain.glb', import.meta.url).href, (g) => {
  let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) { o.updateWorldMatrix(true, false); geo = o.geometry.clone().applyMatrix4(o.matrixWorld); } });
  if (!geo) return; geo.computeVertexNormals(); geo.center();
  let u0 = 0; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(geo, brainMat); const sz = 0.45 + rnd() * 0.35; m.scale.setScalar(sz); u0 = sz;
    m.userData = { sz: u0, ang: rnd() * 6.283, r: 1.25 + rnd() * 1.3, y: -0.4 + rnd() * 1.7, w: 0.6 + rnd() * 0.7, rx: rnd() * 6, ry: rnd() * 6, sx: (rnd() - 0.5) * 0.6, sy: (rnd() - 0.5) * 0.9, ph: rnd() * 6 };
    m.visible = false; storm.add(m); brains.push(m); }
  console.log('[zolton] brain clouds ready');
});
// the bulb: dark glass that ignites gold
const bulb = new THREE.Group(); bulb.name = 'StoryBulb'; scene.add(bulb);
const glassMat = new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.12, emissive: 0xffb43a, emissiveIntensity: 0, depthWrite: false });
const glass = new THREE.Mesh(new THREE.SphereGeometry(0.15, 40, 28), glassMat); glass.position.y = 0.07; glass.renderOrder = 6;
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.1, 32, 1, true), glassMat); neck.position.y = -0.06;
const baseMat = new THREE.MeshStandardMaterial({ color: 0xd8dde6, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 1 });
const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.09, 24), baseMat); screw.position.y = -0.15;
const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 8), baseMat); tip.position.y = -0.2;
const filMat = new THREE.MeshBasicMaterial({ color: 0x8a909a, transparent: true, opacity: 1 });
const fil = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 24, Math.PI), filMat); fil.position.y = 0.06;
const haloMat = new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(255,200,90,.55)'); gr.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }),
  transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const halo = new THREE.Sprite(haloMat); halo.position.y = 0.06;
const bulbLight = new THREE.PointLight(0xfff1d6, 0, 6, 1.6); bulbLight.position.y = 0.06;
bulb.add(glass, neck, screw, tip, fil, halo, bulbLight); bulb.visible = false;
// materialize: the real bulb is revealed below a rising line, the hologram stays above it
const realClip = new THREE.Plane(new THREE.Vector3(0, -1, 0), -1e6);
const holoBulbMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { uTime: { value: 0 }, uAlpha: { value: 0 }, uClipY: { value: -1e6 }, uColor: { value: new THREE.Color(0x66e6ff) } },
  vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: 'uniform float uTime; uniform float uAlpha; uniform float uClipY; uniform vec3 uColor; varying vec3 vN; varying vec3 vW;' +
    'void main(){ if (vW.y < uClipY) discard; vec3 V = normalize(cameraPosition - vW); float f = pow(1.0 - abs(dot(normalize(vN), V)), 2.0);' +
    ' float scan = 0.55 + 0.45 * sin(vW.y * 260.0 - uTime * 7.0); float a = (f * 0.95 + 0.1) * scan * uAlpha; gl_FragColor = vec4(uColor * a * 1.7, a); }' });
let arBulb = null;
const sweep = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.006, 8, 64), new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
sweep.rotation.x = Math.PI / 2; scene.add(sweep);
if (Z.renderer) Z.renderer.localClippingEnabled = true;
// Zolton's modelled bulb (lights.blend → bulb.glb) replaces the stand-in once it loads
const stemMat = glassMat.clone(); stemMat.opacity = 0.08;
const insMat = new THREE.MeshStandardMaterial({ color: 0x9aa2ae, roughness: 0.5, metalness: 0.1, transparent: true, opacity: 1 });
for (const mm of [glassMat, baseMat, filMat]) mm.clippingPlanes = [realClip];
const wireMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.3, metalness: 0.7, transparent: true, opacity: 1 });
for (const mm of [stemMat, insMat, wireMat]) mm.clippingPlanes = [realClip];
new GLTFLoader().load(new URL('./bulb.glb', import.meta.url).href, (g) => {
  const m = g.scene; const box = new THREE.Box3().setFromObject(m); const h = box.max.y - box.min.y; const k = 0.44 / h;
  m.scale.setScalar(k); m.position.set(-(box.min.x + box.max.x) / 2 * k, -0.22 - box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
  const MAT = { Glass: glassMat, Stem: stemMat, Screw: baseMat, Insulator: insMat, Wire: wireMat, Filament: filMat };
  m.traverse(o => { if (!o.isMesh) return; const key = Object.keys(MAT).find(n => (o.name + ' ' + (o.parent && o.parent.name)).includes(n)); o.material = MAT[key] || baseMat;
    o.geometry.computeVertexNormals(); if (key === 'Glass' || key === 'Stem') o.renderOrder = 6; });
  for (const o of [glass, neck, screw, tip, fil]) o.visible = false;
  bulb.add(m);
  // the AR version: same shape as a cyan hologram (rim glow + scanlines), shown first, then 'printed' into the real bulb
  const ar = m.clone(true); ar.traverse(o => { if (o.isMesh) { o.material = holoBulbMat; o.renderOrder = 7; } }); bulb.add(ar); arBulb = ar;
  console.log('[zolton] bulb model loaded');
}, undefined, (e) => console.warn('[zolton] bulb model failed, keeping stand-in', e));
// lightning
const boltMatCore = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false });
const boltMatGlow = new THREE.MeshBasicMaterial({ color: 0x4f7dff, transparent: true, opacity: 0.5, depthWrite: false });
const bolt = new THREE.Group(); scene.add(bolt); bolt.visible = false;
const boltMatHaze = new THREE.MeshBasicMaterial({ color: 0x6fb8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
function fractal(a, b, depth, rough) { // midpoint displacement: the jagged, self-similar path real lightning has
  let pts = [a, b];
  for (let d = 0; d < depth; d++) { const nx = [pts[0]]; for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], m = p.clone().lerp(q, 0.5), L = p.distanceTo(q);
      m.add(V((Math.random() - 0.5) * L * rough, (Math.random() - 0.5) * L * rough * 0.35, (Math.random() - 0.5) * L * rough * 0.6)); nx.push(m, q); } pts = nx; }
  return pts; }
const boltParts = [];
// screen-space comic bolt: always composed in frame, from the upper-left sky down onto the bulb
let bolt2d = null;
function frac2(a, b, depth, rough) { let pts = [a, b];
  for (let d = 0; d < depth; d++) { const nx = [pts[0]]; for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), o = (Math.random() - 0.5) * L * rough;
      nx.push([(p[0] + q[0]) / 2 - dy / L * o, (p[1] + q[1]) / 2 + dx / L * o], q); } pts = nx; } return pts; }
function makeBolt2d(bx, by) { const W = HOST.clientWidth, H = HOST.clientHeight, from = [bx - W * (0.07 + Math.random() * 0.06), -H * 0.06];
  const main = frac2(from, [bx, by], 7, 0.34), br = [];
  for (let k = 0; k < 5; k++) { const i = 10 + Math.floor(Math.random() * main.length * 0.65), a = main[i], dir = Math.random() < 0.5 ? -1 : 1, L = H * (0.06 + Math.random() * 0.14);
    br.push({ pts: frac2(a, [a[0] + dir * L * (0.5 + Math.random()), a[1] + L], 5, 0.6), at: i / main.length, w: 0.55 }); }
  bolt2d = { main, br }; }
function drawBolt2d(t) { const dpr = Math.min(2, devicePixelRatio || 1), W = HOST.clientWidth, H = HOST.clientHeight;
  if (boltCv.width !== Math.round(W * dpr)) { boltCv.width = Math.round(W * dpr); boltCv.height = Math.round(H * dpr); }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H);
  if (!bolt2d || t < 0 || t >= 0.8 || (t > 0.22 && t < 0.25) || (t > 0.4 && t < 0.43)) return;
  const grow = clamp(t / 0.14), fade = 1 - ramp(t, 0.5, 0.8);
  const path = (pts, k) => { const n = Math.max(2, Math.floor(pts.length * k)); bctx.beginPath(); bctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) bctx.lineTo(pts[i][0], pts[i][1]); };
  const strokeAll = (lw, col, blur, alpha) => { bctx.globalAlpha = alpha * fade; bctx.lineWidth = lw; bctx.strokeStyle = col; bctx.shadowColor = 'rgba(120,170,255,.9)'; bctx.shadowBlur = blur;
    path(bolt2d.main, grow); bctx.stroke();
    for (const b of bolt2d.br) { const k = clamp((grow - b.at) / Math.max(0.05, 1 - b.at)); if (k > 0) { bctx.lineWidth = lw * b.w; path(b.pts, k); bctx.stroke(); } } };
  bctx.lineCap = 'round'; bctx.lineJoin = 'miter';
  strokeAll(12, 'rgba(120,165,255,.35)', 28, 1); strokeAll(5, '#8fb8ff', 12, 0.9); strokeAll(2, '#ffffff', 6, 1); bctx.globalAlpha = 1; bctx.shadowBlur = 0; }
function makeBolt(to) {
  bolt.clear(); boltParts.length = 0; const from = to.clone().add(V(-2.7 + Math.random() * 0.4, 2.3, -0.4));
  const add = (pts, r, delay) => { const c = new THREE.CurvePath(); for (let i = 1; i < pts.length; i++) c.add(new THREE.LineCurve3(pts[i - 1], pts[i])); const n = pts.length * 2; // straight segments = sharp, jagged kinks
    for (const [rr, mat, ro] of [[r, boltMatCore, 3], [r * 2.4, boltMatGlow, 2], [r * 5, boltMatHaze, 1]]) { const g = new THREE.TubeGeometry(c, n, rr, 6); const m = new THREE.Mesh(g, mat); m.renderOrder = 20 + ro; m.frustumCulled = false; bolt.add(m); boltParts.push({ g, total: g.index.count, delay }); } };
  const main = fractal(from, to.clone().add(V(0, 0.24, 0)), 7, 0.5); add(main, 0.022, 0);
  for (let k = 0; k < 5; k++) { const i = 6 + Math.floor(Math.random() * (main.length * 0.6)), a = main[i], dir = Math.random() < 0.5 ? -1 : 1;
    const end = a.clone().add(V(dir * (0.25 + Math.random() * 0.6), -(0.3 + Math.random() * 0.7), (Math.random() - 0.5) * 0.3));
    add(fractal(a, end, 5, 0.7), 0.006 + Math.random() * 0.004, i / main.length); }
}
// the coin
const coinSide = new THREE.MeshStandardMaterial({ color: 0xd9a032, roughness: 0.3, metalness: 0.6, emissive: 0x4a2c00, emissiveIntensity: 0.6 });
const coinFace = new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.32, metalness: 0.45, emissive: 0x3a2200, emissiveIntensity: 0.5 });
coinTex.center.set(0.5, 0.5); coinTex.rotation = -Math.PI / 2;
const coinBackTex = coinTex.clone(); coinBackTex.rotation = -Math.PI / 2; coinBackTex.needsUpdate = true;
const coinBack = coinFace.clone(); coinBack.map = coinBackTex;
const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 56), [coinSide, coinFace, coinBack]);
coin.geometry.rotateX(Math.PI / 2); coin.visible = false; scene.add(coin);
// the real coin: the Direction 01 gold coin from the Gold case study (same gradients and its own lighting for reflections)
const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
const GOLD = {
  coin_field: { r: 0.24, k: [0.49881, -0.11516, 0.0], c: 0.5, stops: [[0.0, 0.9734, 0.7454, 0.4678], [0.55, 0.552, 0.3712, 0.1878], [1.0, 0.1812, 0.107, 0.0423]] },
  coin_bevel: { r: 0.025, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.9047, 0.7454, 0.4678], [1.0, 0.2307, 0.15, 0.0723]] },
  coin_rim: { r: 0.11, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.807, 0.6172, 0.3419], [1.0, 0.162, 0.1022, 0.0482]] },
  coin_edge: { r: 0.09, k: [0.18346, -0.47793, 0.0], c: 0.5, stops: [[0.0, 0.8714, 0.6867, 0.3916], [1.0, 0.2016, 0.1274, 0.0612]] },
  coin_C_side: { r: 0.05, k: [0.45862, -0.82231, 0.0], c: 0.5, stops: [[0.0, 0.9047, 0.7305, 0.4342], [1.0, 0.2159, 0.1384, 0.0648]] },
};
function goldMat(name, env) { name = (name || '').replace(/^gc_/, '').replace(/_D1$/, ''); const g = GOLD[name];
  if (!g) return new THREE.MeshStandardMaterial({ color: lin(1, 0.982, 0.939), roughness: 0.86, metalness: 0, emissive: lin(1, 1, 0.973), emissiveIntensity: 0.42, envMap: env });
  const m = new THREE.MeshPhysicalMaterial({ metalness: 1, roughness: g.r, envMap: env, envMapIntensity: 1.2 }); const st = [0, 1, 2].map(i => new THREE.Vector4(...(g.stops[Math.min(i, g.stops.length - 1)])));
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, { uK: { value: new THREE.Vector3(...g.k) }, uC: { value: g.c }, uS0: { value: st[0] }, uS1: { value: st[1] }, uS2: { value: st[2] } });
    sh.vertexShader = 'varying vec3 vCoinP;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vCoinP = position;');
    sh.fragmentShader = 'varying vec3 vCoinP; uniform vec3 uK; uniform float uC; uniform vec4 uS0, uS1, uS2;\n' + sh.fragmentShader.replace('#include <color_fragment>',
      `#include <color_fragment>
      float t = clamp(dot(uK, vCoinP) + uC, 0.0, 1.0);
      vec3 ramp = t <= uS1.x ? mix(uS0.yzw, uS1.yzw, clamp((t - uS0.x) / max(uS1.x - uS0.x, 1e-5), 0.0, 1.0)) : mix(uS1.yzw, uS2.yzw, clamp((t - uS1.x) / max(uS2.x - uS1.x, 1e-5), 0.0, 1.0));
      diffuseColor.rgb = ramp;`); };
  m.customProgramCacheKey = () => 'goldcoin'; return m; }
let realCoin = null;
new RGBELoader().load(new URL('../gold/3d/hdr/env_coin_d1_256.hdr', import.meta.url).href, (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(Z.renderer); const env = pm.fromEquirectangular(hdr).texture; hdr.dispose(); pm.dispose();
  new GLTFLoader().load(new URL('../gold/3d/coin/coin_d1.glb', import.meta.url).href, (g) => {
    const m = g.scene; m.traverse(o => { if (o.isMesh) o.material = goldMat(o.material && o.material.name, env); });
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(V()), k = 0.34 / Math.max(size.x, size.y);
    const c = box.getCenter(V()); m.position.sub(c); const wrap = new THREE.Group(); wrap.add(m); wrap.scale.setScalar(k);
    realCoin = new THREE.Group(); realCoin.add(wrap); realCoin.visible = false; scene.add(realCoin); console.log('[zolton] gold coin loaded');
  }, undefined, e => console.warn('[zolton] coin model failed, keeping stand-in', e));
}, undefined, e => console.warn('[zolton] coin env failed', e));
const sparkMat = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g) => { g.translate(32, 32); g.fillStyle = '#fff6cf'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -30); g.lineTo(3, 0); g.lineTo(0, 30); g.lineTo(-3, 0); g.fill(); } }),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const sparks = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(sparkMat.clone()); s.userData = { a: Math.random() * 6.28, r: 0.18 + Math.random() * 0.25, y: (Math.random() - 0.5) * 0.4, ph: Math.random() * 6, sp: 0.6 + Math.random() }; s.visible = false; scene.add(s); sparks.push(s); }

// ---------- lights: dim and cool in the storm, warm in the sun ----------
const lights = []; scene.traverse(o => { if (o.isLight && o !== bulbLight) lights.push({ l: o, i: o.intensity, c: o.color.clone() }); });
const COOL = new THREE.Color(0x8fb2ff), WARM = new THREE.Color(0xffd08a);

// ---------- run ----------
let gestT = -1, gestTo = false; const gogClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6);
let Ps = 0, spinA = 0, struck = false, strikeT = -1, glow = 0, gogglesWas = null, exprNow = '', last = 0;
const headW = V(), handL = V(), handR = V(), tmp = V(), bulbPos = V();
let camBase = null;
state.story = true;
const setE = (n) => { if (exprNow !== n) { exprNow = n; Z.setExpr(n, 9999); } };

Z.onFrame((dt, now, realDt) => {
  // scroll progress through the hero track (0..1), eased so it glides
  const r = hero.getBoundingClientRect(); const raw = clamp(-r.top / Math.max(1, r.height - innerHeight));
  const ready = state.mode === 'yoga' && state.seated && state.cloudRise < 0 && !(state.cloudDelay > 0) && (!state.intro || state.introStep === 'done');
  const target = ready ? raw : 0;
  Ps += (target - Ps) * Math.min(1, realDt * 3.2);
  const P = Ps;
  if (P < 0.004) { for (const L of lights) { L.i = L.l.intensity; L.c.copy(L.l.color); } }   // track day/night changes while idle

  bones.mixamorigHead.getWorldPosition(headW);
  const center = V(headW.x, headW.y - 0.25, headW.z);
  bulbPos.set(headW.x + 0.02, headW.y + 0.52, headW.z + 0.04);

  // phases
  const gather = ramp(P, 0.05, 0.3), stormK = ramp(P, 0.24, 0.5), pull = ramp(P, 0.55, 0.64), hush = ramp(P, 0.63, 0.7);
  const sun = ramp(P, 0.74, 0.86), bloom = band(P, 0.83, 0.9, 0.905, 0.96), reveal = ramp(P, 0.9, 0.99);
  const dark = Math.min(0.94, gather * 0.8 + stormK * 0.1 + hush * 0.06) * (1 - sun);

  // ambient spin never stops; storm speeds it up, the hush freezes it
  const speed = (0.06 + gather * 0.25 + stormK * 1.25) * (1 - hush * 0.97) * (1 - sun);
  spinA += speed * realDt;

  // storm clouds: gather in from far away, wrap around him, part outward in the sun
  for (const s of puffs) { const u = s.userData; const rr = u.r * (1 + (1 - gather) * 1.8 + sun * 2.4) * (1 - stormK * 0.12);
    u.ang += speed * u.w * u.dir * (2.6 / u.r) * realDt;           // inner clouds whip round faster: a vortex, not a turning disc
    const a = u.ang, yy = u.y + Math.sin(a * 2 + u.ph) * 0.25 * stormK; // a little rise and fall as they go round
    s.position.set(center.x + Math.cos(a) * rr, center.y + yy + Math.sin(now * 0.5 + u.ph) * 0.06, center.z - 2.6 + Math.sin(a) * rr * 0.55 + Math.cos(a) * u.tilt);
    const front = clamp((s.position.z - center.z + 1.2) / 1.2); // puffs in front of him stay thin so he reads
    s.material.opacity = gather * Math.pow(1 - sun, 2) * (1 - front * 0.92) * (1 - bloom);
    // own tone per cloud for depth; lightning lights the clouds nearest the flash from inside
    const lit = flick * Math.max(0, 1 - s.position.distanceTo(cloudFlash.position) / 5.5);
    const tn = u.tone * (1 - sun) + sun; s.material.color.setRGB((0.17 + sun * 0.75) * tn + lit * 0.7, (0.21 + sun * 0.69) * tn + lit * 0.78, (0.33 + sun * 0.59) * tn + lit * 0.85);
    u.rz += (u.rs + speed * u.w * 0.35) * realDt; s.quaternion.copy(camera.quaternion); s.rotateZ(u.rz); s.visible = s.material.opacity > 0.01; }

  // in-cloud lightning: random flickers through the storm (stops for the hush and the sun)
  const flickOn = ramp(P, 0.22, 0.34) * (1 - ramp(P, 0.6, 0.64)) * (1 - sun);
  flickNext -= realDt; if (flickOn > 0.05 && flickNext <= 0 && flickT < 0) { flickT = 0; flickNext = 1.2 + Math.random() * 3.2;
    cloudFlash.position.set(center.x + (Math.random() - 0.5) * 8, center.y + 1 + Math.random() * 3, center.z - 2.5 - Math.random() * 2.5); }
  if (flickT >= 0) { flickT += realDt; const t = flickT; flick = (t < 0.06 ? 1 : t < 0.12 ? 0.25 : t < 0.18 ? 0.85 : Math.max(0, 0.7 - (t - 0.18) * 3)) * flickOn; if (t > 0.45) { flickT = -1; flick = 0; } }
  cloudFlash.intensity = flick * 60;

  // rain: starts as the clouds gather, freezes mid-air in the hush, stops when the sun breaks through
  const rainK = ramp(P, 0.16, 0.32) * (1 - ramp(P, 0.72, 0.77)) * (1 - bloom);
  rain.visible = rainK > 0.01; rainMat.opacity = rainK * 0.42; rain.position.set(center.x, center.y, center.z);
  if (rain.visible) { const fall = (1 - hush * 0.985); let k = 0;
    for (const d of rainD) { const om = speed * d.w * 3.2 / d.r;    // rain spirals round him with the storm
      d.a += om * realDt; d.y -= d.v * realDt * fall; if (d.y < -3) { d.y += 10; d.a = rnd() * 6.283; }
      const ca = Math.cos(d.a), sa = Math.sin(d.a), x = ca * d.r, z = sa * d.r * 0.6 - 1.2;
      const tx = -sa * d.r * om, tz = ca * d.r * om * 0.6, vy = -d.v * fall, n = Math.hypot(tx, vy, tz) || 1; // streak along its velocity
      rainPos[k++] = x; rainPos[k++] = d.y; rainPos[k++] = z; rainPos[k++] = x - tx / n * d.l; rainPos[k++] = d.y - vy / n * d.l; rainPos[k++] = z - tz / n * d.l; }
    rainGeo.attributes.position.needsUpdate = true; }

  // holograms: appear once the glasses are on, orbit with the storm, then get pulled into the bulb
  for (const h of holos) { const u = h.userData; const on = ramp(P, u.on, u.on + 0.03) * (1 - pull);
    u.ang += speed * u.w * 1.9 * (1.3 / u.r) * realDt; u.tx += u.tumX * speed * realDt; u.ty += u.tumY * speed * realDt;
    const a = u.ang, rr = u.r * (1 + stormK * 0.25);
    const orbit = V(center.x + Math.cos(a) * rr * 1.25, center.y + u.y + Math.sin(now * 1.3 + u.ph) * 0.05, center.z + Math.sin(a) * rr * 0.55 - 0.2);
    const pk = Math.pow(pull, 1.6); h.position.lerpVectors(orbit, bulbPos, pk);
    h.quaternion.copy(camera.quaternion); h.rotateY(Math.sin(a) * 0.35 + Math.sin(u.ty) * 0.5); h.rotateX(Math.sin(u.tx) * 0.35);
    h.scale.setScalar(Math.max(0.001, (1 - pk * 0.9) * (0.8 + 0.2 * on)));
    const ho = (on + pull * (1 - pk) * 0.8) * (1 - hush * 0.6); h.material.uniforms.uAlpha.value = ho; h.material.uniforms.uTime.value = now;
    h.visible = ho > 0.01 && P < 0.66; }

  // glasses: on as he crosses into the storm, pushed off when the sun breaks through
  // brain clouds (toggle): drift round with the vortex, tumbling slowly
  const brainK = brainOn ? ramp(P, 0.12, 0.28) * (1 - ramp(P, 0.6, 0.66)) : 0;
  brainMat.emissiveIntensity = 0.45 + flick * 0.7;
  for (const b of brains) { const u = b.userData; b.visible = brainK > 0.01; if (!b.visible) continue;
    u.ang += speed * u.w * (1.4 / u.r) * realDt; u.rx += u.sx * (0.2 + speed) * realDt; u.ry += u.sy * (0.2 + speed) * realDt;
    b.position.set(center.x + Math.cos(u.ang) * u.r * 1.2, center.y + u.y + Math.sin(now * 0.9 + u.ph) * 0.06, center.z + Math.sin(u.ang) * u.r * 0.6 - 0.3);
    b.rotation.set(u.rx, u.ry, 0); b.scale.setScalar(u.sz * sm(brainK)); }

  // glasses build onto his face: he touches his temple, the band sweeps across from that side, then the lenses drop
  // down over his eyes. Coming off (in the sun) plays it backwards.
  if (Z.gear && Z.gear.goggles) {
    const G = Z.gear.goggles;
    if (!G.userData.storyInit) { G.userData.storyInit = true; G.userData.basePos = G.position.clone();
      G.traverse(o => { if (o.material) for (const m of [].concat(o.material)) { m.clippingPlanes = [gogClip]; m.needsUpdate = true; } }); }
    const night = document.documentElement.classList.contains('zb-night');
    const want = (P > 0.2 && P < 0.77) || (P <= 0.2 && night);
    const isOn = !!G.userData.on;
    if (gestT < 0 && want !== isOn) { if (P < 0.02) { G.userData.on = want; Z.updateGear(); } else { gestT = 0; gestTo = want; } }
    let band = 1, drop = 0;
    if (gestT >= 0) { gestT += realDt; if (window.__gestHold != null) gestT = window.__gestHold; const t = gestT;
      const w = sm(t / 0.45) * (1 - sm((t - 1.15) / 0.45));
      if (gestTo) { if (t >= 0.42 && !G.userData.on) { G.userData.on = true; Z.updateGear(); } band = ramp(t, 0.42, 0.85); drop = 1 - ramp(t, 0.8, 1.1); }
      else { drop = ramp(t, 0.42, 0.68); band = 1 - ramp(t, 0.66, 1.05); if (t >= 1.05 && G.userData.on) { G.userData.on = false; Z.updateGear(); } }
      if (w > 0.005) {
        // his right hand rises to his right temple and rests there while the band builds
        const arm = bones.mixamorigRightArm, fore = bones.mixamorigRightForeArm, hand = bones.mixamorigRightHand, idx = bones.mixamorigRightHandIndex1;
        const temple = V(headW.x - 0.095, headW.y + 0.085, headW.z + 0.03);
        if (arm && fore && hand) {
          Z.aimBoneAt(arm, fore, V(headW.x - 0.27, headW.y - 0.26, headW.z + 0.02), w);
          Z.aimBoneAt(fore, hand, temple.clone().add(V(-0.03, -0.07, 0.0)), w);
          if (idx) Z.aimBoneAt(hand, idx, temple.clone().add(V(0.01, 0.02, 0.06)), w);
        }
        Z.addWorldRot(bones.mixamorigHead, -0.05 * w, 0);
      }
      if (t > 1.65) gestT = -1; }
    // band sweep: everything of the glasses to his left of the line is hidden (his right temple is -x)
    gogClip.constant = band >= 0.999 ? 1e6 : (headW.x - 0.13 + 0.26 * band);
    // lenses drop down from his brow
    if (G.parent) { const base = G.parent.localToWorld(G.userData.basePos.clone()); base.y += 0.045 * drop; G.position.copy(G.parent.worldToLocal(base)); }
  }

  const sp0 = bulbPos.clone().project(camera); const bx0 = ((sp0.x + 1) / 2 * HOST.clientWidth).toFixed(0), by0 = ((1 - sp0.y) / 2 * HOST.clientHeight).toFixed(0);
  // bulb forms from the holograms, waits dark in the hush, ignites on the strike
  const form = ramp(P, 0.57, 0.65);
  bulb.visible = form > 0.01 && P < 0.905; bulb.position.copy(bulbPos); bulb.position.y += Math.sin(now * 1.4) * 0.015;
  bulb.scale.setScalar(Math.max(0.001, form) * (1 + glow * 0.012 * Math.sin(now * 5)));
  // the AR bulb forms from the holograms, then simply fades into reality: a clear, barely-there glass bulb
  const real = arBulb ? ramp(P, 0.645, 0.695) : 1;
  realClip.constant = 1e6; sweep.visible = false;
  holoBulbMat.uniforms.uClipY.value = -1e6; holoBulbMat.uniforms.uTime.value = now;
  holoBulbMat.uniforms.uAlpha.value = form * (1 - real) * (0.9 + 0.1 * Math.sin(now * 23));
  if (arBulb) arBulb.visible = holoBulbMat.uniforms.uAlpha.value > 0.01;
  for (const mm of [baseMat, insMat, wireMat, filMat]) mm.opacity = real;
  if (!struck && P >= 0.72) { struck = true; strikeT = 0; const sp = bulbPos.clone().add(V(0, 0.2, 0)).project(camera); makeBolt2d((sp.x + 1) / 2 * HOST.clientWidth, (1 - sp.y) / 2 * HOST.clientHeight); }
  if (struck && P < 0.7) { struck = false; strikeT = -1; }
  if (strikeT >= 0) strikeT += realDt; if (window.__strikeHold != null && strikeT >= 0) strikeT = window.__strikeHold;
  const gTarget = struck && strikeT > 0.14 ? 1 : 0; glow += (gTarget - glow) * Math.min(1, realDt * (struck ? 1.6 : 6));
  glassMat.emissiveIntensity = glow * 1.6; glassMat.opacity = (0.12 + glow * 0.22) * real; stemMat.opacity = 0.08 * real; glassMat.color.setRGB(0.93 + glow * 0.07, 0.96, 1.0 - glow * 0.25);
  filMat.color.setRGB(0.54 + glow * 0.8, 0.56 + glow * 0.6, 0.6 + glow * 0.2);
  haloMat.opacity = Math.min(1, glow) * (0.96 + 0.04 * Math.sin(now * 6)); halo.scale.setScalar(0.5 + Math.min(1.2, glow) * 1.5 + bloom * 3);
  bulbLight.intensity = glow * 1.6 + (strikeT >= 0.14 && strikeT < 0.6 ? (1 - (strikeT - 0.14) / 0.46) * 10 : 0);
  // bolt flickers for ~0.45s
  // the bolt races down from the sky in ~80 ms, holds, flickers twice and fades
  drawBolt2d(strikeT);
  bolt.visible = false && strikeT >= 0 && strikeT < 0.8 && !(strikeT > 0.22 && strikeT < 0.25) && !(strikeT > 0.4 && strikeT < 0.43);
  if (bolt.visible) { const grow = clamp(strikeT / 0.14); for (const b of boltParts) b.g.setDrawRange(0, Math.floor(b.total * clamp((grow - b.delay * 0.8) / 0.4))); 
    const fade = 1 - ramp(strikeT, 0.5, 0.8); boltMatCore.opacity = fade; boltMatGlow.opacity = 0.6 * fade; boltMatHaze.opacity = 0.22 * fade; }
  // the strike: a white-out centred on the bulb (with a second pulse), fading as the bulb settles to gold
  // the bolt is seen first; the flash bursts from the bulb only when it lands (t=0.14), never a full white-out
  if (strikeT >= 0 && strikeT < 1.1) { const t = strikeT, f = t < 0.14 ? 0.12 * Math.sin(t * 60) ** 2 : t < 0.2 ? 0.92 : t < 0.26 ? 0.5 : t < 0.32 ? 0.85 : Math.max(0, 0.85 - (t - 0.32) * 1.1);
    flashEl.style.background = `radial-gradient(60% 65% at ${bx0}px ${by0}px, #ffffff 0%, rgba(246,250,255,.95) 22%, rgba(220,236,255,.55) 55%, rgba(200,222,255,0) 100%)`;
    flashEl.style.opacity = f.toFixed(3); } else flashEl.style.opacity = 0;

  // he looks up and reaches for the bulb in the hush; the hand lands on the glass at the strike, then comes back down
  const reach = 0; // he looks up at the bulb; no hand on the glass
  if (reach > 0.01) {
    Z.aimBoneAt(bones.mixamorigRightArm, bones.mixamorigRightForeArm, tmp.copy(bulbPos).add(V(-0.2, -0.42, 0.18)), reach);
    Z.aimBoneAt(bones.mixamorigRightForeArm, bones.mixamorigRightHand, tmp.copy(bulbPos).add(V(-0.04, -0.2, 0.05)), reach);
    if (bones.mixamorigRightHandIndex1) Z.aimBoneAt(bones.mixamorigRightHand, bones.mixamorigRightHandIndex1, tmp.copy(bulbPos).add(V(0, -0.1, 0.03)), reach);
  }
  const lookUp = ramp(P, 0.6, 0.7) * (1 - ramp(P, 0.86, 0.95));
  if (lookUp > 0.01) { Z.addWorldRot(bones.mixamorigNeck, 0, -0.06 * lookUp); Z.addWorldRot(bones.mixamorigHead, 0, -0.1 * lookUp); state.exprLook = [0, 0.4 * lookUp]; }

  // the coin: swapped in under the bloom, spins and floats down into his hands
  bones.mixamorigLeftHand.getWorldPosition(handL); bones.mixamorigRightHand.getWorldPosition(handR);
  const lap = handL.clone().add(handR).multiplyScalar(0.5).add(V(0, 0.1, 0.16));
  coin.visible = P >= 0.9; if (realCoin) { realCoin.visible = coin.visible; } if (coin.visible) { coin.position.lerpVectors(bulbPos, lap, sm(ramp(P, 0.9, 0.975))); coin.position.y += Math.sin(now * 1.6) * 0.02;
    coin.rotation.set(0.15, Math.sin(now * 1.3) * 0.9 + now * 0.6, 0); if (window.__coinFreeze != null) coin.rotation.set(0, window.__coinFreeze, 0); coin.scale.setScalar(0.6 + 0.4 * ramp(P, 0.9, 0.93)); if (realCoin) { realCoin.position.copy(coin.position); realCoin.rotation.set(0.12, now * 0.9, Math.sin(now * 0.7) * 0.06); realCoin.scale.copy(coin.scale); coin.visible = false; } }
  for (const s of sparks) s.visible = false;

  // lights
  for (const L of lights) { L.l.intensity = L.i * (1 - dark * 0.45) * (1 + sun * (1 - reveal) * 0.25);
    L.l.color.copy(L.c).lerp(COOL, dark * 0.55).lerp(WARM, sun * (1 - reveal * 0.7) * 0.45); }

  // camera: pushes in on him for the hush and strike, pulls back out for the reveal
  if (!camBase || P < 0.004) camBase = { pos: Z.camFull.pos.clone(), target: Z.camFull.target.clone() };
  const push = ramp(P, 0.6, 0.7) * (1 - ramp(P, 0.88, 0.98));
  const pTarget = V(headW.x - 0.05, headW.y + 0.12, headW.z), pPos = V(headW.x + 0.25, headW.y + 0.05, headW.z + 3.1);
  Z.camFull.target.lerpVectors(camBase.target, pTarget, push * 0.85); Z.camFull.pos.lerpVectors(camBase.pos, pPos, push * 0.85);

  // expressions per beat
  // he keeps the same calm, concentrating face throughout (no expression changes)

  // overlays (screen space)
  dimEl.style.opacity = (dark * (1 - flick * 0.22)).toFixed(3);
  const sp = bulbPos.clone().project(camera); const cw = HOST.clientWidth, ch = HOST.clientHeight;
  const bx = ((sp.x + 1) / 2 * cw).toFixed(0), by = ((1 - sp.y) / 2 * ch).toFixed(0);
  const rays = band(P, 0.74, 0.8, 0.88, 0.93);
  if (rays > 0.01) raysEl.style.background = `radial-gradient(circle at ${bx}px ${by}px, rgba(255,246,222,.95) 0px, rgba(255,226,170,.7) ${(ch * 0.06).toFixed(0)}px, rgba(255,206,130,.28) ${(ch * 0.22).toFixed(0)}px, rgba(255,200,120,0) ${(ch * 0.55).toFixed(0)}px)`;
  raysEl.style.opacity = (rays * (0.92 + 0.08 * Math.sin(now * 2))).toFixed(3);
  const fl = band(P, 0.73, 0.78, 0.88, 0.92); flareEl.style.opacity = fl.toFixed(3);
  if (fl > 0.01) { const cx = cw / 2, cy = ch / 2; for (const g of flareGhosts) { g.i.style.left = (+bx + (cx - bx) * g.k) + 'px'; g.i.style.top = (+by + (cy - by) * g.k) + 'px'; }
    streak.style.left = bx + 'px'; streak.style.top = by + 'px'; streak.style.width = (cw * 0.7) + 'px'; }
  bloomEl.style.background = `radial-gradient(90% 90% at ${bx}px ${by}px, rgba(255,252,238,1) 0%, rgba(255,240,205,.97) 35%, rgba(255,226,170,.9) 100%)`;
  bloomEl.style.opacity = (bloom * 0.98).toFixed(3);
  CAPS.forEach((c, i) => { const o = band(P, c[0], c[1], c[2], c[3]); capEls[i].style.opacity = o.toFixed(3); capEls[i].style.transform = `translateY(${((1 - o) * 12).toFixed(1)}px)`; });
  const co = ramp(P, 0.95, 0.985); cta.style.opacity = co.toFixed(3); cta.style.pointerEvents = co > 0.5 ? 'auto' : 'none';
  if (window.__storyDebug) { window.__storyDebug.P = P; window.__storyDebug.strikeT = strikeT; window.__storyDebug.flick = flick; window.__storyDebug.gestT = gestT; }
});
window.__storyDebug = { P: 0 };
console.log('[zolton] scroll story ready');
