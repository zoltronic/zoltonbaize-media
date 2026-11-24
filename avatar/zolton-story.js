// About page scroll story — "No limits" hero's journey (rough full-arc pass).
// Loaded only on the staging site (or with ?story). Hooks into the live avatar via window.__z.
// Motion model: ambient motion never stops (clouds turn, holograms orbit, he breathes); scroll sets how far the
// story has got (eased), and the big moments (glasses on, lightning, coin) fire once you scroll past them.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm';

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
#zs-rays{mix-blend-mode:screen}
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
const dimEl = mk('zs-dim', true), raysEl = mk('zs-rays', true), flashEl = mk('zs-flash'), bloomEl = mk('zs-bloom'), capsEl = mk('zs-caps');
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
  const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); const sz = 2.6 + Math.random() * 3.4; s.scale.set(sz * 1.35, sz, 1);
  s.userData = { a: Math.random() * Math.PI * 2, r: 2.0 + Math.random() * 3.4, y: -1.2 + Math.random() * 3.8, sz, ph: Math.random() * 6, rz: Math.random() * 6.28, rs: (Math.random() - 0.5) * 0.12, tone: 0.75 + Math.random() * 0.5 };
  storm.add(s); puffs.push(s);
}
// lightning inside the clouds: a cold light that flickers on random timers during the storm
const cloudFlash = new THREE.PointLight(0xa9d4ff, 0, 40, 1); storm.add(cloudFlash);
let flick = 0, flickT = -1, flickNext = 1.5;
// rain: cheap falling streaks, all in one draw
const RN = 1400, rainPos = new Float32Array(RN * 6), rainD = [];
for (let i = 0; i < RN; i++) rainD.push({ x: (Math.random() - 0.5) * 14, y: -3 + Math.random() * 10, z: -6 + Math.random() * 8.5, l: 0.18 + Math.random() * 0.22, v: 8 + Math.random() * 5 });
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0, depthWrite: false });
const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 4; scene.add(rain);
const holos = []; const LABELS = ['Product', 'Motion', '3D', 'AI agents'];
for (let i = 0; i < 26; i++) {
  const label = i < 4 ? LABELS[i] : null; const tex = holoTex(i % 6, label);
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x5fe3ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const w = label ? 0.62 : 0.42 + Math.random() * 0.18; const geo = new THREE.PlaneGeometry(w, w * (label ? 96 / 256 : 168 / 256));
  const h = new THREE.Mesh(geo, mat); h.renderOrder = 5;
  h.userData = { a: (i / 26) * Math.PI * 2 + Math.random() * 0.4, r: 0.95 + Math.random() * 0.9, y: -0.55 + Math.random() * 1.35, ph: Math.random() * 6,
    on: label ? 0.40 + i * 0.012 : 0.21 + (i - 4) * 0.0055, label: !!label };
  storm.add(h); holos.push(h);
}
// the bulb: dark glass that ignites gold
const bulb = new THREE.Group(); bulb.name = 'StoryBulb'; scene.add(bulb);
const glassMat = new THREE.MeshStandardMaterial({ color: 0x31405e, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.55, emissive: 0xffb43a, emissiveIntensity: 0, depthWrite: false });
const glass = new THREE.Mesh(new THREE.SphereGeometry(0.15, 40, 28), glassMat); glass.position.y = 0.07; glass.renderOrder = 6;
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.1, 32, 1, true), glassMat); neck.position.y = -0.06;
const baseMat = new THREE.MeshStandardMaterial({ color: 0x9aa3b2, roughness: 0.35, metalness: 0.8 });
const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.09, 24), baseMat); screw.position.y = -0.15;
const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 8), baseMat); tip.position.y = -0.2;
const filMat = new THREE.MeshBasicMaterial({ color: 0x2a2f38 });
const fil = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.006, 8, 24, Math.PI), filMat); fil.position.y = 0.06;
const haloMat = new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.3, 'rgba(255,200,90,.55)'); gr.addColorStop(1, 'rgba(255,170,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }),
  transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
const halo = new THREE.Sprite(haloMat); halo.position.y = 0.06;
const bulbLight = new THREE.PointLight(0xffc463, 0, 6, 1.6); bulbLight.position.y = 0.06;
bulb.add(glass, neck, screw, tip, fil, halo, bulbLight); bulb.visible = false;
// Zolton's modelled bulb (lights.blend → bulb.glb) replaces the stand-in once it loads
const stemMat = glassMat.clone(); stemMat.opacity = 0.35;
const insMat = new THREE.MeshStandardMaterial({ color: 0x15171c, roughness: 0.5, metalness: 0.1 });
const wireMat = new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.3, metalness: 0.9 });
new GLTFLoader().load(new URL('./bulb.glb', import.meta.url).href, (g) => {
  const m = g.scene; const box = new THREE.Box3().setFromObject(m); const h = box.max.y - box.min.y; const k = 0.44 / h;
  m.scale.setScalar(k); m.position.set(-(box.min.x + box.max.x) / 2 * k, -0.22 - box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
  const MAT = { Glass: glassMat, Stem: stemMat, Screw: baseMat, Insulator: insMat, Wire: wireMat, Filament: filMat };
  m.traverse(o => { if (!o.isMesh) return; const key = Object.keys(MAT).find(n => (o.name + ' ' + (o.parent && o.parent.name)).includes(n)); o.material = MAT[key] || baseMat;
    o.geometry.computeVertexNormals(); if (key === 'Glass' || key === 'Stem') o.renderOrder = 6; });
  for (const o of [glass, neck, screw, tip, fil]) o.visible = false;
  bulb.add(m); console.log('[zolton] bulb model loaded');
}, undefined, (e) => console.warn('[zolton] bulb model failed, keeping stand-in', e));
// lightning
const boltMatCore = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false });
const boltMatGlow = new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
const bolt = new THREE.Group(); scene.add(bolt); bolt.visible = false;
function makeBolt(to) {
  bolt.clear(); const from = to.clone().add(V(-0.6 + Math.random() * 0.3, 6.5, -1.2));
  const seg = (a, b, n, jit) => { const pts = []; for (let i = 0; i <= n; i++) { const p = a.clone().lerp(b, i / n); if (i > 0 && i < n) p.add(V((Math.random() - 0.5) * jit, (Math.random() - 0.5) * jit * 0.4, (Math.random() - 0.5) * jit * 0.6)); pts.push(p); } return pts; };
  const add = (pts, r) => { const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
    bolt.add(new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 6, r, 6), boltMatCore), new THREE.Mesh(new THREE.TubeGeometry(c, pts.length * 6, r * 4, 6), boltMatGlow)); };
  const main = seg(from, to.clone().add(V(0, 0.22, 0)), 14, 0.7); add(main, 0.022);
  for (let k = 0; k < 2; k++) { const i = 3 + Math.floor(Math.random() * 7), a = main[i]; add(seg(a, a.clone().add(V((Math.random() - 0.5) * 1.6, -0.8 - Math.random() * 0.8, 0)), 6, 0.35), 0.007); }
}
// the coin
const coinSide = new THREE.MeshStandardMaterial({ color: 0xd9a032, roughness: 0.3, metalness: 0.6, emissive: 0x4a2c00, emissiveIntensity: 0.6 });
const coinFace = new THREE.MeshStandardMaterial({ map: coinTex, roughness: 0.32, metalness: 0.45, emissive: 0x3a2200, emissiveIntensity: 0.5 });
coinTex.center.set(0.5, 0.5); coinTex.rotation = -Math.PI / 2;
const coinBackTex = coinTex.clone(); coinBackTex.rotation = -Math.PI / 2; coinBackTex.needsUpdate = true;
const coinBack = coinFace.clone(); coinBack.map = coinBackTex;
const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.035, 56), [coinSide, coinFace, coinBack]);
coin.geometry.rotateX(Math.PI / 2); coin.visible = false; scene.add(coin);
const sparkMat = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g) => { g.translate(32, 32); g.fillStyle = '#fff6cf'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -30); g.lineTo(3, 0); g.lineTo(0, 30); g.lineTo(-3, 0); g.fill(); } }),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const sparks = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(sparkMat.clone()); s.userData = { a: Math.random() * 6.28, r: 0.18 + Math.random() * 0.25, y: (Math.random() - 0.5) * 0.4, ph: Math.random() * 6, sp: 0.6 + Math.random() }; s.visible = false; scene.add(s); sparks.push(s); }

// ---------- lights: dim and cool in the storm, warm in the sun ----------
const lights = []; scene.traverse(o => { if (o.isLight && o !== bulbLight) lights.push({ l: o, i: o.intensity, c: o.color.clone() }); });
const COOL = new THREE.Color(0x8fb2ff), WARM = new THREE.Color(0xffd08a);

// ---------- run ----------
let gestT = -1, gestTo = false;
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
    const a = u.a + spinA * (1.1 - u.r * 0.08);
    s.position.set(center.x + Math.cos(a) * rr, center.y + u.y + Math.sin(now * 0.5 + u.ph) * 0.06, center.z - 2.6 + Math.sin(a) * rr * 0.55);
    const front = clamp((s.position.z - center.z + 1.2) / 1.2); // puffs in front of him stay thin so he reads
    s.material.opacity = gather * Math.pow(1 - sun, 2) * (1 - front * 0.92) * (1 - bloom);
    // own tone per cloud for depth; lightning lights the clouds nearest the flash from inside
    const lit = flick * Math.max(0, 1 - s.position.distanceTo(cloudFlash.position) / 5.5);
    const tn = u.tone * (1 - sun) + sun; s.material.color.setRGB((0.16 + sun * 0.76) * tn + lit * 0.7, (0.2 + sun * 0.7) * tn + lit * 0.78, (0.32 + sun * 0.6) * tn + lit * 0.85);
    u.rz += u.rs * realDt * (1 - hush); s.quaternion.copy(camera.quaternion); s.rotateZ(u.rz); s.visible = s.material.opacity > 0.01; }

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
    for (const d of rainD) { d.y -= d.v * realDt * fall; d.x -= 1.4 * realDt * fall; if (d.y < -3) { d.y += 10; d.x = (Math.random() - 0.5) * 14; } if (d.x < -7) d.x += 14;
      rainPos[k++] = d.x; rainPos[k++] = d.y; rainPos[k++] = d.z; rainPos[k++] = d.x + d.l * 0.14; rainPos[k++] = d.y + d.l; rainPos[k++] = d.z; }
    rainGeo.attributes.position.needsUpdate = true; }

  // holograms: appear once the glasses are on, orbit with the storm, then get pulled into the bulb
  for (const h of holos) { const u = h.userData; const on = ramp(P, u.on, u.on + 0.03) * (1 - pull);
    const a = u.a + spinA * 1.6, rr = u.r * (1 + stormK * 0.25);
    const orbit = V(center.x + Math.cos(a) * rr * 1.25, center.y + u.y + Math.sin(now * 1.3 + u.ph) * 0.05, center.z + Math.sin(a) * rr * 0.55 - 0.2);
    const pk = Math.pow(pull, 1.6); h.position.lerpVectors(orbit, bulbPos, pk);
    h.quaternion.copy(camera.quaternion); h.rotateY(Math.sin(a) * 0.35);
    h.scale.setScalar(Math.max(0.001, (1 - pk * 0.9) * (0.8 + 0.2 * on)));
    h.material.opacity = (on + pull * (1 - pk) * 0.8) * (0.75 + 0.25 * Math.sin(now * 7 + u.ph)) * (1 - hush * 0.6);
    h.visible = h.material.opacity > 0.01 && P < 0.66; }

  // glasses: on as he crosses into the storm, pushed off when the sun breaks through
  // glasses go on (and come off in the sun) with a real gesture: both hands rise to his temples,
  // the glasses slide on at the top of the move, then the hands settle back into his lap
  if (Z.gear && Z.gear.goggles) {
    const night = document.documentElement.classList.contains('zb-night');
    const want = (P > 0.2 && P < 0.77) || (P <= 0.2 && night);
    const isOn = !!Z.gear.goggles.userData.on;
    if (gestT < 0 && want !== isOn) { if (P < 0.02) { Z.gear.goggles.userData.on = want; Z.updateGear(); } else { gestT = 0; gestTo = want; } }
    if (gestT >= 0) { gestT += realDt; if (window.__gestHold != null) gestT = window.__gestHold; const t = gestT;
      const w = sm(t / 0.5) * (1 - sm((t - 0.95) / 0.55));
      if (t >= 0.62 && !!Z.gear.goggles.userData.on !== gestTo) { Z.gear.goggles.userData.on = gestTo; Z.updateGear(); }
      if (w > 0.005) {
        // one hand rises and slides the glasses up onto the bridge of his nose
        const arm = bones.mixamorigRightArm, fore = bones.mixamorigRightForeArm, hand = bones.mixamorigRightHand, idx = bones.mixamorigRightHandIndex1;
        const lift = sm(t / 0.62);  // hand travels from chin height up to the bridge as the glasses go on
        const bridge = tmp.set(headW.x - 0.005, headW.y + 0.02 + 0.07 * lift, headW.z + 0.16);
        if (arm && fore && hand) {
          Z.aimBoneAt(arm, fore, V(headW.x - 0.24, headW.y - 0.32, headW.z + 0.1), w);
          Z.aimBoneAt(fore, hand, bridge.clone().add(V(-0.1, -0.12, 0.04)), w);
          if (idx) Z.aimBoneAt(hand, idx, bridge.clone().add(V(0, -0.01, 0.01)), w);
        }
        Z.addWorldRot(bones.mixamorigHead, 0, 0.06 * w);
      }
      if (t > 1.55) gestT = -1; }
  }

  const sp0 = bulbPos.clone().project(camera); const bx0 = ((sp0.x + 1) / 2 * HOST.clientWidth).toFixed(0), by0 = ((1 - sp0.y) / 2 * HOST.clientHeight).toFixed(0);
  // bulb forms from the holograms, waits dark in the hush, ignites on the strike
  const form = ramp(P, 0.57, 0.65);
  bulb.visible = form > 0.01 && P < 0.905; bulb.position.copy(bulbPos); bulb.position.y += Math.sin(now * 1.4) * 0.015;
  bulb.scale.setScalar(Math.max(0.001, form) * (1 + glow * 0.06 * Math.sin(now * 9)));
  if (!struck && P >= 0.72) { struck = true; strikeT = 0; makeBolt(bulbPos); setE('surprised'); glow = 1.8; }
  if (struck && P < 0.7) { struck = false; strikeT = -1; }
  if (strikeT >= 0) strikeT += realDt;
  const gTarget = struck ? 1 : 0; glow += (gTarget - glow) * Math.min(1, realDt * (struck ? 1.6 : 6));
  glassMat.emissiveIntensity = glow * 2.6; glassMat.opacity = 0.55 + glow * 0.4; glassMat.color.setRGB(0.19 + glow * 0.8, 0.25 + glow * 0.65, 0.37 + glow * 0.3);
  filMat.color.setRGB(0.16 + glow, 0.18 + glow * 0.85, 0.22 + glow * 0.5);
  haloMat.opacity = glow * (0.9 + 0.1 * Math.sin(now * 13)); halo.scale.setScalar(0.5 + glow * 1.6 + bloom * 3);
  bulbLight.intensity = glow * 3.5 + (strikeT >= 0 && strikeT < 0.5 ? (1 - strikeT * 2) * 40 : 0);
  // bolt flickers for ~0.45s
  bolt.visible = strikeT >= 0 && strikeT < 0.45 && Math.sin(strikeT * 70) > -0.3;
  if (strikeT >= 0 && strikeT < 0.45 && Math.random() < realDt * 10) makeBolt(bulbPos);
  // the strike: a white-out centred on the bulb (with a second pulse), fading as the bulb settles to gold
  if (strikeT >= 0 && strikeT < 0.9) { const t = strikeT, f = t < 0.09 ? 1 : t < 0.14 ? 0.55 : t < 0.2 ? 0.95 : Math.max(0, 0.95 - (t - 0.2) * 1.4);
    flashEl.style.background = `radial-gradient(70% 70% at ${bx0}px ${by0}px, #ffffff 0%, #f2f8ff 30%, rgba(214,232,255,.92) 70%, rgba(190,215,255,.85) 100%)`;
    flashEl.style.opacity = f.toFixed(3); } else flashEl.style.opacity = 0;

  // he looks up and reaches for the bulb in the hush; the hand lands on the glass at the strike, then comes back down
  const reach = 0; // he looks up at the bulb; no hand on the glass
  if (reach > 0.01) {
    Z.aimBoneAt(bones.mixamorigRightArm, bones.mixamorigRightForeArm, tmp.copy(bulbPos).add(V(-0.2, -0.42, 0.18)), reach);
    Z.aimBoneAt(bones.mixamorigRightForeArm, bones.mixamorigRightHand, tmp.copy(bulbPos).add(V(-0.04, -0.2, 0.05)), reach);
    if (bones.mixamorigRightHandIndex1) Z.aimBoneAt(bones.mixamorigRightHand, bones.mixamorigRightHandIndex1, tmp.copy(bulbPos).add(V(0, -0.1, 0.03)), reach);
  }
  const lookUp = ramp(P, 0.6, 0.7) * (1 - ramp(P, 0.86, 0.95));
  if (lookUp > 0.01) { Z.addWorldRot(bones.mixamorigNeck, 0, -0.22 * lookUp); Z.addWorldRot(bones.mixamorigHead, 0, -0.32 * lookUp); state.exprLook = [0, 0.7 * lookUp]; }

  // the coin: swapped in under the bloom, spins and floats down into his hands
  bones.mixamorigLeftHand.getWorldPosition(handL); bones.mixamorigRightHand.getWorldPosition(handR);
  const lap = handL.clone().add(handR).multiplyScalar(0.5).add(V(0, 0.1, 0.16));
  coin.visible = P >= 0.9; if (coin.visible) { coin.position.lerpVectors(bulbPos, lap, sm(ramp(P, 0.9, 0.975))); coin.position.y += Math.sin(now * 1.6) * 0.02;
    coin.rotation.set(0.15, Math.sin(now * 1.3) * 0.9 + now * 0.6, 0); if (window.__coinFreeze != null) coin.rotation.set(0, window.__coinFreeze, 0); coin.scale.setScalar(0.6 + 0.4 * ramp(P, 0.9, 0.93)); }
  for (const s of sparks) { const u = s.userData; s.visible = coin.visible; if (!s.visible) continue;
    const a = u.a + now * u.sp; s.position.set(coin.position.x + Math.cos(a) * u.r, coin.position.y + u.y + Math.sin(now * 2 + u.ph) * 0.05, coin.position.z + Math.sin(a) * u.r * 0.5);
    const tw = Math.max(0, Math.sin(now * 5 + u.ph)); s.scale.setScalar(0.05 + tw * 0.08); s.material.opacity = tw; }

  // lights
  for (const L of lights) { L.l.intensity = L.i * (1 - dark * 0.45) * (1 + sun * (1 - reveal) * 0.25);
    L.l.color.copy(L.c).lerp(COOL, dark * 0.55).lerp(WARM, sun * (1 - reveal * 0.7) * 0.45); }

  // camera: pushes in on him for the hush and strike, pulls back out for the reveal
  if (!camBase || P < 0.004) camBase = { pos: Z.camFull.pos.clone(), target: Z.camFull.target.clone() };
  const push = ramp(P, 0.6, 0.7) * (1 - ramp(P, 0.88, 0.98));
  const pTarget = V(headW.x - 0.05, headW.y + 0.12, headW.z), pPos = V(headW.x + 0.25, headW.y + 0.05, headW.z + 3.1);
  Z.camFull.target.lerpVectors(camBase.target, pTarget, push * 0.85); Z.camFull.pos.lerpVectors(camBase.pos, pPos, push * 0.85);

  // expressions per beat
  if (P > 0.02) { if (P < 0.2) setE('zen'); else if (P < 0.6) setE('serious'); else if (P < 0.72) setE('surprised'); else if (strikeT >= 0 && strikeT < 1.1) setE('surprised'); else setE('happyOpen'); }
  else if (exprNow) { exprNow = ''; Z.setExpr('zen', 0); }

  // overlays (screen space)
  dimEl.style.opacity = (dark * (1 - flick * 0.22)).toFixed(3);
  const sp = bulbPos.clone().project(camera); const cw = HOST.clientWidth, ch = HOST.clientHeight;
  const bx = ((sp.x + 1) / 2 * cw).toFixed(0), by = ((1 - sp.y) / 2 * ch).toFixed(0);
  const rays = band(P, 0.74, 0.8, 0.88, 0.93);
  if (rays > 0.01) raysEl.style.background = `repeating-conic-gradient(from ${(now * 6) % 360}deg at ${bx}px ${by}px, rgba(255,214,130,.55) 0deg 4deg, rgba(255,214,130,0) 4deg 13deg), radial-gradient(60% 60% at ${bx}px ${by}px, rgba(255,226,160,.85), rgba(255,226,160,0) 70%)`;
  raysEl.style.opacity = rays.toFixed(3);
  raysEl.style.webkitMaskImage = raysEl.style.maskImage = `radial-gradient(75% 75% at ${bx}px ${by}px, #000 20%, transparent 75%)`;
  bloomEl.style.background = `radial-gradient(90% 90% at ${bx}px ${by}px, rgba(255,252,238,1) 0%, rgba(255,240,205,.97) 35%, rgba(255,226,170,.9) 100%)`;
  bloomEl.style.opacity = (bloom * 0.98).toFixed(3);
  CAPS.forEach((c, i) => { const o = band(P, c[0], c[1], c[2], c[3]); capEls[i].style.opacity = o.toFixed(3); capEls[i].style.transform = `translateY(${((1 - o) * 12).toFixed(1)}px)`; });
  const co = ramp(P, 0.95, 0.985); cta.style.opacity = co.toFixed(3); cta.style.pointerEvents = co > 0.5 ? 'auto' : 'none';
  if (window.__storyDebug) { window.__storyDebug.P = P; window.__storyDebug.strikeT = strikeT; window.__storyDebug.flick = flick; window.__storyDebug.gestT = gestT; }
});
window.__storyDebug = { P: 0 };
console.log('[zolton] scroll story ready');
