// About page scroll story — "No limits" hero's journey (rough full-arc pass).
// Loaded only on the staging site (or with ?story). Hooks into the live avatar via window.__z.
// Motion model: ambient motion never stops (clouds turn, holograms orbit, he breathes); scroll sets how far the
// story has got (eased), and the big moments (glasses on, lightning, coin) fire once you scroll past them.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/+esm';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js/+esm';
import {RGBELoader} from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/RGBELoader.js/+esm';
import {PLATES, makePlate} from './holo-plates.js';

const TRACK = 600;                       // extra scroll length, in vh
// the page layout goes in before the 3D has loaded, so the hero doesn't jump (and the page doesn't grow by 600vh)
// the moment the model arrives; the About page's loading still sits in the same sticky stage meanwhile
const HOST0 = document.getElementById('zolton-avatar'), embed = HOST0.parentElement, hero = HOST0.closest('section') || embed.parentElement;
// ---------- page layout: hero becomes a long track, the 3D stage sticks to the screen ----------
hero.classList.add('zstory');
if (!document.getElementById('zs-fonts')) { const l = document.createElement('link'); l.id = 'zs-fonts'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=League+Spartan:wght@500;600;700&display=swap'; document.head.appendChild(l); }
const css = document.createElement('style');
css.textContent = `
.about_hero.zstory{display:block!important;min-height:0!important;height:${100 + TRACK}vh;padding-top:0!important;padding-bottom:0!important;margin-bottom:-30vh!important}
.about_hero.zstory + .about_section{position:relative;z-index:2}
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
#zs-caps .zc{position:absolute;left:50%;bottom:5vh;width:min(780px,88vw);margin-left:calc(min(780px,88vw) / -2);text-align:center;opacity:0;transition:none;color:#fff;font:600 clamp(22px,2.5vw,36px)/1.18 'League Spartan',system-ui,sans-serif;letter-spacing:-.01em;text-shadow:0 2px 22px rgba(0,10,30,.7)}
#zs-caps .zc.side{left:6vw;bottom:auto;top:54vh;width:min(360px,28vw);margin-left:0;text-align:left}
#zs-caps .zc b{display:block;font-weight:700;font-size:.62em;letter-spacing:.18em;text-transform:uppercase;color:#9fe9ff;margin-bottom:.35em}
#zs-caps .zc.light{color:#0b1b33;text-shadow:0 1px 14px rgba(255,255,255,.6)}
#zs-coach{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:0;overflow:visible}
#zs-cta{position:absolute;pointer-events:auto;opacity:0;display:inline-flex;align-items:center;gap:.4em;padding:.55em 1em;font:600 14px/1 'League Spartan',system-ui,sans-serif;white-space:nowrap;border-radius:999px;
  background:linear-gradient(180deg,#ffe08a,#f1b53b);color:#3a2300;font-weight:600;text-decoration:none;box-shadow:0 8px 30px rgba(240,170,40,.45);z-index:4}
@media (max-width:899px){#zs-caps .zc{bottom:4vh;font-size:22px}#zs-caps .zc.side{left:50%;right:auto;top:auto;bottom:4vh;width:88vw;margin-left:-44vw;text-align:center}#zs-brain{bottom:auto;top:76px}}
@media (max-width:699px){.about_hero.zstory > .page_wrap{padding-bottom:4vh!important}.about_hero.zstory .heading-h1{font-size:15vw!important;line-height:.95!important}.about_hero.zstory .text-subhead{font-size:16px!important}}
`;
document.head.appendChild(css);

const Z = await new Promise(res => { const t = setInterval(() => {
  const z = window.__z; if (z && z.onFrame && z.bones && z.bones.mixamorigHead && z.HOST) { clearInterval(t); res(z); } }, 100); });

const HOST = Z.HOST;
const { scene, camera, bones, state } = Z;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const ramp = (p, a, b) => sm((p - a) / (b - a));                     // 0 → 1 between a and b
const band = (p, a, b, c, d) => ramp(p, a, b) * (1 - ramp(p, c, d)); // up a→b, down c→d


const canvas = HOST.querySelector('canvas');
const mk = (id, before) => { const d = document.createElement('div'); d.id = id; before ? HOST.insertBefore(d, canvas) : HOST.appendChild(d); return d; };
const boltCv = document.createElement('canvas'); boltCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; HOST.appendChild(boltCv); const bctx = boltCv.getContext('2d');
const bgCv = document.createElement('canvas'); bgCv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none'; const bgx = bgCv.getContext('2d');
const dimEl = mk('zs-dim', true), raysEl = mk('zs-rays', true), flashEl = mk('zs-flash'), flareEl = mk('zs-flare'), bloomEl = mk('zs-bloom'), capsEl = mk('zs-caps');
// lens flare: soft ghosts along the line from the light through the centre of the screen, plus a horizontal streak
const FLARE = [[0, 90, 'rgba(255,240,210,.55)'], [0.35, 26, 'rgba(255,200,140,.35)'], [0.6, 60, 'rgba(160,210,255,.18)'], [0.85, 16, 'rgba(255,230,180,.45)'], [1.25, 110, 'rgba(255,190,120,.12)'], [1.55, 34, 'rgba(170,230,255,.25)']];
const flareGhosts = FLARE.map(([k, sz, c]) => { const i = document.createElement('i'); i.style.width = i.style.height = sz + 'px'; i.style.background = `radial-gradient(circle, ${c} 0%, rgba(0,0,0,0) 70%)`; flareEl.appendChild(i); return { i, k }; });
const streak = document.createElement('b'); flareEl.appendChild(streak);
canvas.style.position = 'absolute'; HOST.insertBefore(bgCv, canvas);

// captions sit where the hero title sits (left third), in the site's own type styles
const CAPS = [
  [0.07, 0.10, 0.19, 0.22, '', 'I’m Zolton. I’ve been designing for over 20 years, with stops at Apple, Google and Wells Fargo.'],
  [0.24, 0.27, 0.5, 0.54, '', '<b>Divergent stage</b>Explore widely, so the right connections can surface.'],
  [0.715, 0.73, 0.8, 0.83, 'side', '<b>Convergent stage</b>Where it all connects, and ideas spark.'],
];
const capEls = CAPS.map(c => { const d = document.createElement('div'); d.className = 'zc ' + c[4]; d.innerHTML = c[5]; capsEl.appendChild(d); return d; });
const cta = document.createElement('a'); cta.id = 'zs-cta'; cta.href = '/'; cta.textContent = 'See the work →'; capsEl.appendChild(cta);
function placeCaps() {
  const h1 = hero.querySelector('h1'); const r = h1 ? h1.getBoundingClientRect() : { left: 32 };
  const left = Math.max(20, r.left) + 'px';
  cta.style.left = innerWidth < 900 ? '24px' : 'calc(50% - min(380px,44vw))'; cta.style.top = innerWidth < 900 ? '68vh' : '58vh';
}
placeCaps(); addEventListener('resize', placeCaps);
const coach = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); coach.id = 'zs-coach'; capsEl.appendChild(coach);
coach.innerHTML = '<defs><marker id="zs-arw" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#f1b53b"/></marker></defs><path id="zs-coach-p" fill="none" stroke="#f1b53b" stroke-width="2.5" stroke-dasharray="7 7" stroke-linecap="round" marker-end="url(#zs-arw)"/><circle id="zs-coach-c" r="34" fill="none" stroke="#ffd56a" stroke-width="2" opacity=".8"/>';
const coachP = coach.querySelector('#zs-coach-p'), coachC = coach.querySelector('#zs-coach-c');

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
let flick = 0, flickT = -1, flickNext = 1.5, bgBolt = null;
// rain: cheap falling streaks, all in one draw
const RN = 1400, rainPos = new Float32Array(RN * 6), rainD = [];
for (let i = 0; i < RN; i++) rainD.push({ r: 0.7 + Math.pow(rnd(), 0.8) * 6.5, a: rnd() * 6.283, y: -3 + rnd() * 10, l: 0.18 + rnd() * 0.22, v: 7 + rnd() * 5, w: 0.7 + rnd() * 0.6 });
const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.LineBasicMaterial({ color: 0xbfd6ff, transparent: true, opacity: 0, depthWrite: false });
const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 4; scene.add(rain);
// hologram look: scanlines, a slow bright sweep, colour fringing, edge glow, flicker and the odd glitch
function holoCardMat(tex, seed, img) { return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: { map: { value: tex }, uAlpha: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uImg: { value: img ? 1 : 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D map; uniform float uAlpha, uTime, uSeed, uImg; varying vec2 vUv;
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
      if (uImg > 0.5) { vec3 tc = texture2D(map, uv).rgb; col = vec3(tc.r * r + 0.06, tc.g * g + 0.1, tc.b * b + 0.16) * 0.95 + vec3(0.0, 0.05, 0.1); }
      float a = (line * scan * 0.95 + edge * 0.4 + 0.07 + band * 0.18) * flick * uAlpha;
      gl_FragColor = vec4(col * 1.25, a); }` }); }
const holos = []; const LABELS = ['Product', 'Motion', '3D', 'AI agents'];
// animated plates: a couple of gauges, checkmarks, icon grid, research, systems, 3D, UX, UI, terminal, vector, bot, haptics, travel loader
// (stills pulled from Zolton's Wells Fargo Figma live in ./holo/, the rest are drawn live and loop)
const plates = PLATES.map((spec, i) => makePlate(THREE, spec, import.meta.url, i * 0.73));
const NH = 4 + plates.length; for (let i = 0; i < NH; i++) {
  const label = i < 4 ? LABELS[i] : null; const work = label ? null : plates[i - 4]; const tex = label ? holoTex(0, label) : work.tex;
  const mat = holoCardMat(tex, rnd(), !label);
  const w = label ? 0.62 : (work.ar < 0.9 ? 0.44 : work.ar < 1.2 ? 0.54 : 0.64) + Math.random() * 0.1; const geo = new THREE.PlaneGeometry(w, label ? w * 96 / 256 : w / work.ar);
  const h = new THREE.Mesh(geo, mat); h.renderOrder = 5;
  h.userData = { ang: (i / NH) * Math.PI * 2 + rnd() * 0.4, w: 0.6 + rnd() * 0.9, tumX: (rnd() - 0.5) * 1.2, tumY: (rnd() - 0.5) * 2.4, tx: 0, ty: 0, a: 0, r: 0.95 + Math.random() * 0.9, y: -0.55 + Math.random() * 1.35, ph: Math.random() * 6,
    on: label ? 0.40 + i * 0.012 : 0.21 + (i - 4) * 0.0055, label: !!label, plate: work };
  storm.add(h); holos.push(h);
}
// brainstorm option: little cloud-brains drifting in the vortex (staging toggle, off by default)
// The toggle button only shows on the staging address (or with ?tune); visitors never see it, and the brain model only
// downloads once brain clouds are switched on.
const STORY_TUNE = /\.webflow\.io$/.test(location.hostname) || /[?&]tune\b/.test(location.search);
let brainOn = /[?&]brain=1\b/.test(location.search); if (STORY_TUNE) { try { if (localStorage.getItem('zstory.brain') === '1') brainOn = true; } catch (e) {} }
const brainBtn = document.createElement('button'); brainBtn.id = 'zs-brain'; if (STORY_TUNE) document.body.appendChild(brainBtn);
const setBrainLabel = () => { brainBtn.textContent = 'Brain clouds: ' + (brainOn ? 'On' : 'Off'); }; setBrainLabel();
brainBtn.onclick = () => { brainOn = !brainOn; setBrainLabel(); if (brainOn) loadBrains(); try { localStorage.setItem('zstory.brain', brainOn ? '1' : '0'); } catch (e) {} };
const brainMat = new THREE.MeshToonMaterial({ color: 0xf2f5ff, emissive: 0x7d8fb2, emissiveIntensity: 0.45 });
const brains = [];
let brainsAsked = false;
function loadBrains() { if (brainsAsked) return; brainsAsked = true;
new GLTFLoader().load(new URL('./brain.glb', import.meta.url).href, (g) => {
  let geo = null; g.scene.traverse(o => { if (o.isMesh && !geo) { o.updateWorldMatrix(true, false); geo = o.geometry.clone().applyMatrix4(o.matrixWorld); } });
  if (!geo) return; geo.computeVertexNormals(); geo.center();
  let u0 = 0; for (let i = 0; i < 7; i++) { const m = new THREE.Mesh(geo, brainMat); const sz = 0.45 + rnd() * 0.35; m.scale.setScalar(sz); u0 = sz;
    m.userData = { sz: u0, ang: rnd() * 6.283, r: 1.25 + rnd() * 1.3, y: -0.4 + rnd() * 1.7, w: 0.6 + rnd() * 0.7, rx: rnd() * 6, ry: rnd() * 6, sx: (rnd() - 0.5) * 0.6, sy: (rnd() - 0.5) * 0.9, ph: rnd() * 6 };
    m.visible = false; storm.add(m); brains.push(m); }
  console.log('[zolton] brain clouds ready');
});
}
if (brainOn) loadBrains();
// the bulb: dark glass that ignites gold
const bulb = new THREE.Group(); bulb.name = 'StoryBulb'; scene.add(bulb);
const glassMat = new THREE.MeshStandardMaterial({ color: 0xeef6ff, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.12, emissive: 0xffb43a, emissiveIntensity: 0, depthWrite: false });
const glass = new THREE.Mesh(new THREE.SphereGeometry(0.15, 40, 28), glassMat); glass.position.y = 0.07; glass.renderOrder = 6;
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.06, 0.1, 32, 1, true), glassMat); neck.position.y = -0.06;
const baseMat = new THREE.MeshStandardMaterial({ color: 0xeef1f5, roughness: 0.14, metalness: 1, envMapIntensity: 1.6, transparent: true, opacity: 1 });
// glass edges: fresnel rim + a soft window highlight, so the clear bulb still reads as polished glass
const glassRim = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uA: { value: 0 } },
  vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz); gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: 'uniform float uA; varying vec3 vN; varying vec3 vV; void main(){ vec3 n = normalize(vN); float nv = dot(n, vV); if (nv < 0.0) discard; float f = pow(1.0 - nv, 4.0); vec3 L = normalize(vec3(-0.5, 0.7, 0.6)); vec3 H = normalize(L + vV); float spec = pow(max(dot(n, H), 0.0), 90.0); vec3 L2 = normalize(vec3(0.6, 0.3, 0.7)); float spec2 = pow(max(dot(n, normalize(L2 + vV)), 0.0), 40.0); float a = (f * 0.5 + spec * 1.3 + spec2 * 0.12) * uA; gl_FragColor = vec4(vec3(0.92, 0.97, 1.0) * a, a); }' });
// real glass: physically transmissive with clearcoat, so it shows the scene through it and catches reflections
const glassPhys = new THREE.MeshPhysicalMaterial({ color: 0xf4f9ff, metalness: 0, roughness: 0.12, envMapIntensity: 0, specularIntensity: 1, transparent: true, opacity: 1, emissive: 0xffb43a, emissiveIntensity: 0, depthWrite: false });
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
const wireMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, roughness: 0.35, metalness: 0.3, transparent: true, opacity: 1 });
for (const mm of [stemMat, insMat, wireMat]) mm.clippingPlanes = [realClip];
new GLTFLoader().load(new URL('./bulb.glb', import.meta.url).href, (g) => {
  const m = g.scene; const box = new THREE.Box3().setFromObject(m); const h = box.max.y - box.min.y; const k = 0.24 / h;
  m.scale.setScalar(k); m.position.set(-(box.min.x + box.max.x) / 2 * k, -0.12 - box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
  const glassMeshes = [];
  const MAT = { Glass: glassPhys, Stem: stemMat, Screw: baseMat, Insulator: insMat, Wire: wireMat, Filament: filMat };
  m.traverse(o => { if (!o.isMesh) return; const key = Object.keys(MAT).find(n => (o.name + ' ' + (o.parent && o.parent.name)).includes(n)); o.material = MAT[key] || baseMat;
    o.geometry.computeVertexNormals(); if (key === 'Glass' || key === 'Stem') o.renderOrder = 6;
    if (key === 'Glass') glassMeshes.push(o);
    if (key === 'Filament') { o.geometry.computeBoundingBox(); const c = o.geometry.boundingBox.getCenter(V()); o.geometry.translate(-c.x, -c.y, -c.z); o.geometry.scale(0.45, 0.45, 0.45); o.geometry.translate(c.x, c.y, c.z); } });
  // the glass rim/highlight shell is added after the traversal, so it never gets a part material by mistake (that was the metal look)
  for (const o of glassMeshes) { const rim = new THREE.Mesh(o.geometry, glassRim); rim.name = 'GlassRim'; rim.renderOrder = 7; o.add(rim); }
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
function makeBolt2d(bx, by) { const W = HOST.clientWidth, H = HOST.clientHeight, from = [bx - W * (0.12 + Math.random() * 0.08), -H * 0.08];
  const main = frac2(from, [bx, by], 7, 0.36), br = [];
  for (let k = 0; k < 8; k++) { const i = 10 + Math.floor(Math.random() * main.length * 0.65), a = main[i], dir = Math.random() < 0.5 ? -1 : 1, L = H * (0.06 + Math.random() * 0.14);
    br.push({ pts: frac2(a, [a[0] + dir * L * (0.5 + Math.random()), a[1] + L], 5, 0.6), at: i / main.length, w: 0.55 }); }
  bolt2d = { main, br }; }
// the two full-screen 2D bolt layers are only touched while a bolt shows (and once more to wipe it): clearing them every
// frame made the browser re-upload two screen-sized layers each frame, which older laptops felt
let boltDirty = true, bgDirty = true;
function drawBolt2d(t) { const dpr = Math.min(2, devicePixelRatio || 1), W = HOST.clientWidth, H = HOST.clientHeight;
  const show = !!bolt2d && t >= 0 && t < 1.0;
  if (!show && !boltDirty) return;
  if (boltCv.width !== Math.round(W * dpr)) { boltCv.width = Math.round(W * dpr); boltCv.height = Math.round(H * dpr); }
  bctx.setTransform(dpr, 0, 0, dpr, 0, 0); bctx.clearRect(0, 0, W, H); boltDirty = show;
  if (!show) return;
  const grow = clamp(t / 0.14), fade = 1 - ramp(t, 0.7, 1.0);
  const path = (pts, k) => { const n = Math.max(2, Math.floor(pts.length * k)); bctx.beginPath(); bctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) bctx.lineTo(pts[i][0], pts[i][1]); };
  const strokeAll = (lw, col, blur, alpha) => { bctx.globalAlpha = alpha * fade; bctx.lineWidth = lw; bctx.strokeStyle = col; bctx.shadowColor = 'rgba(120,170,255,.9)'; bctx.shadowBlur = blur;
    path(bolt2d.main, grow); bctx.stroke();
    for (const b of bolt2d.br) { const k = clamp((grow - b.at) / Math.max(0.05, 1 - b.at)); if (k > 0) { bctx.lineWidth = lw * b.w; path(b.pts, k); bctx.stroke(); } } };
  bctx.lineCap = 'round'; bctx.lineJoin = 'miter';
  strokeAll(22, 'rgba(120,165,255,.35)', 40, 1); strokeAll(8, '#8fb8ff', 18, 0.95); strokeAll(3.2, '#ffffff', 8, 1); bctx.globalAlpha = 1; bctx.shadowBlur = 0; }
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
let realCoin = null, sharedEnv = null;
// Zolton's Z mark (Z_logo_2.0.svg, 333×284): two rounded wedges, converted to shapes centred on 0 and `w` wide
function zShapes(w) { const s = w / 333, P = (x, y) => [(x - 166.5) * s, (142 - y) * s];
  const a = new THREE.Shape(); a.moveTo(...P(11.5208, 284)); a.lineTo(...P(302.675, 284)); a.bezierCurveTo(...P(314.298, 284), ...P(318.947, 267.856), ...P(309.068, 261.025));
  a.lineTo(...P(113.803, 122.556)); a.lineTo(...P(2.80362, 263.509)); a.bezierCurveTo(...P(-3.58899, 271.581), ...P(1.64133, 284), ...P(11.5208, 284));
  const b = new THREE.Shape(); b.moveTo(...P(321.479, 0)); b.lineTo(...P(30.3246, 0)); b.bezierCurveTo(...P(18.7017, 0), ...P(14.0525, 16.1444), ...P(23.932, 22.9747));
  b.lineTo(...P(219.197, 161.444)); b.lineTo(...P(330.196, 20.4909)); b.bezierCurveTo(...P(336.589, 12.4187), ...P(331.359, 0), ...P(321.479, 0));
  return [a, b]; }
new RGBELoader().load(new URL('../gold/3d/hdr/env_coin_d1_256.hdr', import.meta.url).href, (hdr) => {
  hdr.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(Z.renderer); const env = pm.fromEquirectangular(hdr).texture; hdr.dispose(); pm.dispose();
  new GLTFLoader().load(new URL('../gold/3d/coin/coin_d1.glb', import.meta.url).href, (g) => {
    const m = g.scene; m.traverse(o => { if (o.isMesh) o.material = goldMat(o.material && o.material.name, env); });
    sharedEnv = env; for (const mm of [baseMat]) { mm.envMap = env; mm.needsUpdate = true; }
    // the Wells Fargo C comes off; Zolton's Z logo is embossed on both faces instead (polished top, gold walls)
    m.traverse(o => { if (o.isMesh && /Curve/.test(o.name + (o.parent ? o.parent.name : ''))) o.visible = false; });
    const zTop = new THREE.MeshPhysicalMaterial({ color: lin(1.0, 0.74, 0.36), metalness: 1, roughness: 0.1, envMap: env, envMapIntensity: 2.0, clearcoat: 0.6, clearcoatRoughness: 0.08 });
    const zGeo = new THREE.ExtrudeGeometry(zShapes(1.08), { depth: 0.02, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.009, bevelSegments: 2, curveSegments: 14 });
    for (const side of [1, -1]) { const zm = new THREE.Mesh(zGeo, [zTop, goldMat('coin_C_side', env)]); zm.position.z = side * 0.1; if (side < 0) zm.rotation.y = Math.PI; m.add(zm); }
    for (const o of [m]) o.traverse(q => { if (q.isMesh && q.material && q.material.envMapIntensity != null) q.material.envMapIntensity *= 1.5; });
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(V()), k = 0.2 / Math.max(size.x, size.y);
    const c = box.getCenter(V()); m.position.sub(c); const wrap = new THREE.Group(); wrap.add(m); wrap.scale.setScalar(k);
    realCoin = new THREE.Group(); realCoin.add(wrap); realCoin.visible = false; scene.add(realCoin); console.log('[zolton] gold coin loaded');
  }, undefined, e => console.warn('[zolton] coin model failed, keeping stand-in', e));
}, undefined, e => console.warn('[zolton] coin env failed', e));
const sparkMat = new THREE.SpriteMaterial({ map: canvasTex(64, 64, (g) => { g.translate(32, 32); g.fillStyle = '#fff6cf'; for (let k = 0; k < 4; k++) { g.rotate(Math.PI / 4); g.beginPath(); g.moveTo(0, -30); g.lineTo(3, 0); g.lineTo(0, 30); g.lineTo(-3, 0); g.fill(); } }),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const glintMat = new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const c = 64;
    const gr = g.createRadialGradient(c, c, 0, c, c, 22); gr.addColorStop(0, 'rgba(255,255,245,1)'); gr.addColorStop(0.4, 'rgba(255,236,180,.55)'); gr.addColorStop(1, 'rgba(255,220,140,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    for (const [a, l, w] of [[0, 62, 2.2], [Math.PI / 2, 62, 2.2], [Math.PI / 4, 30, 1.4], [-Math.PI / 4, 30, 1.4]]) { g.save(); g.translate(c, c); g.rotate(a); const lg = g.createLinearGradient(-l, 0, l, 0); lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(0.5, 'rgba(255,255,250,1)'); lg.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = lg; g.beginPath(); g.moveTo(-l, 0); g.lineTo(0, -w); g.lineTo(l, 0); g.lineTo(0, w); g.fill(); g.restore(); } }),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false });
const coinGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,214,120,.75)'); gr.addColorStop(0.45, 'rgba(255,196,90,.25)'); gr.addColorStop(1, 'rgba(255,190,80,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }),
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); coinGlow.visible = false; coinGlow.renderOrder = 4; scene.add(coinGlow);
const glints = [0, 1, 2].map(() => { const s = new THREE.Sprite(glintMat.clone()); s.renderOrder = 30; s.visible = false; scene.add(s); return s; });
const sparks = []; for (let i = 0; i < 0; i++) { const s = new THREE.Sprite(sparkMat.clone()); s.userData = { a: Math.random() * 6.28, r: 0.18 + Math.random() * 0.25, y: (Math.random() - 0.5) * 0.4, ph: Math.random() * 6, sp: 0.6 + Math.random() }; s.visible = false; scene.add(s); sparks.push(s); }

// ---------- lights: dim and cool in the storm, warm in the sun ----------
const lights = []; scene.traverse(o => { if (o.isLight && o !== bulbLight) lights.push({ l: o, i: o.intensity, c: o.color.clone() }); });
const COOL = new THREE.Color(0x8fb2ff), WARM = new THREE.Color(0xffd08a);

// ---------- run ----------
let gestT = -1, gestTo = false; const gogClip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6);
let storyReady = false, ringA = 0, frameN = 0, Ps = 0, spinA = 0, struck = false, strikeT = -1, glow = 0, gogglesWas = null, exprNow = '', last = 0;
const headW = V(), handL = V(), handR = V(), tmp = V(), bulbPos = V();
let camBase = null, coinHome = null;
// the coin is interactive like the one on the Gold case study: drag sideways to spin it, let go to fling, tap to see the work
const coinSpin = { phase: 0, extra: 0, id: null, x: 0, lx: 0, lt: 0, v: 0, base: 0, moved: 0 };
const coinHit = document.createElement('a'); coinHit.href = '/'; coinHit.setAttribute('aria-label', 'See the work'); coinHit.draggable = false;
coinHit.style.cssText = 'position:absolute;border-radius:50%;pointer-events:none;touch-action:pan-y;cursor:grab;transform:translate(-50%,-50%);z-index:5';
const D2R = Math.PI / 180;
coinHit.addEventListener('pointerdown', e => { if (e.pointerType === 'touch' && !e.isPrimary) return; coinSpin.id = e.pointerId; coinSpin.x = coinSpin.lx = e.clientX; coinSpin.base = coinSpin.phase; coinSpin.lt = performance.now(); coinSpin.v = 0; coinSpin.moved = 0; coinSpin.extra = 0; coinHit.setPointerCapture?.(e.pointerId); coinHit.style.cursor = 'grabbing'; });
coinHit.addEventListener('pointermove', e => { if (e.pointerId !== coinSpin.id) return; const k = 0.6 * D2R, t = performance.now(), dt = Math.max(8, t - coinSpin.lt) / 1000;
  coinSpin.phase = coinSpin.base + (e.clientX - coinSpin.x) * k; const v = ((e.clientX - coinSpin.lx) * k) / dt; coinSpin.v = coinSpin.v * 0.4 + v * 0.6; coinSpin.moved = Math.max(coinSpin.moved, Math.abs(e.clientX - coinSpin.x)); coinSpin.lx = e.clientX; coinSpin.lt = t; });
const coinUp = e => { if (e.pointerId !== coinSpin.id) return; const idle = performance.now() - coinSpin.lt > 90; coinSpin.extra = idle ? 0 : Math.max(-30, Math.min(30, coinSpin.v)); coinSpin.id = null; coinHit.style.cursor = 'grab'; if (coinSpin.moved > 6) coinSpin.suppress = performance.now(); };
coinHit.addEventListener('pointerup', coinUp); coinHit.addEventListener('pointercancel', coinUp);
coinHit.addEventListener('click', e => { if (performance.now() - (coinSpin.suppress || 0) < 400) e.preventDefault(); });
coinHit.addEventListener('dragstart', e => e.preventDefault()); capsEl.appendChild(coinHit); const camOff = V();
state.story = true;
const setE = (n) => { if (exprNow !== n) { exprNow = n; Z.setExpr(n, 9999); } };

Z.onFrame((dt, now, realDt) => {
  // scroll progress through the hero track (0..1), eased so it glides
  const r = hero.getBoundingClientRect(); const raw = clamp(-r.top / Math.max(1, r.height - innerHeight));
  // as the story hands over to the About text, the 3D stage fades so the coin never floats over the copy
  embed.style.opacity = clamp((r.bottom - innerHeight * 0.35) / (innerHeight * 0.5)).toFixed(3);
  if (!storyReady) storyReady = state.mode === 'yoga' && state.seated && state.cloudRise < 0 && !(state.cloudDelay > 0) && (!state.intro || state.introStep === 'done');
  const ready = storyReady;
  const target = ready ? raw : 0;
  Ps += (target - Ps) * Math.min(1, realDt * 9);
  const P = Ps;
  if (P < 0.004) { for (const L of lights) { L.i = L.l.intensity; L.c.copy(L.l.color); } }   // track day/night changes while idle

  bones.mixamorigHead.getWorldPosition(headW);
  const center = V(headW.x, headW.y - 0.25, headW.z);
  bulbPos.set(headW.x + 0.02, headW.y + 0.36, headW.z + 0.04);

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
    cloudFlash.position.set(center.x + (Math.random() - 0.5) * 8, center.y + 1 + Math.random() * 3, center.z - 2.5 - Math.random() * 2.5);
    // a visible bolt in the sky behind him, off to one side so it never crosses his body
    const W = HOST.clientWidth, Hh = HOST.clientHeight, side = Math.random() < 0.5 ? 0.06 + Math.random() * 0.24 : 0.7 + Math.random() * 0.24, x0 = side * W;
    const main = frac2([x0, -Hh * 0.05], [x0 + (Math.random() - 0.5) * W * 0.12, Hh * (0.32 + Math.random() * 0.3)], 7, 0.4), br = [];
    for (let k = 0; k < 4; k++) { const i = 8 + Math.floor(Math.random() * main.length * 0.6), a = main[i], L = Hh * (0.04 + Math.random() * 0.1), dir = Math.random() < 0.5 ? -1 : 1; br.push({ pts: frac2(a, [a[0] + dir * L, a[1] + L], 5, 0.6), at: i / main.length, w: 0.5 }); }
    bgBolt = { main, br }; }
  if (flickT >= 0) { flickT += realDt; const t = flickT; flick = (t < 0.06 ? 1 : t < 0.12 ? 0.25 : t < 0.18 ? 0.85 : Math.max(0, 0.7 - (t - 0.18) * 3)) * flickOn; if (t > 0.45) { flickT = -1; flick = 0; } }
  cloudFlash.intensity = flick * 60;
  { const bgShow = !!bgBolt && flickT >= 0 && flick > 0.05;
    if (bgShow || bgDirty) { const dpr = Math.min(2, devicePixelRatio || 1), W = HOST.clientWidth, Hh = HOST.clientHeight; if (bgCv.width !== Math.round(W * dpr)) { bgCv.width = Math.round(W * dpr); bgCv.height = Math.round(Hh * dpr); }
    bgx.setTransform(dpr, 0, 0, dpr, 0, 0); bgx.clearRect(0, 0, W, Hh); bgDirty = bgShow;
    if (bgShow) { const grow = clamp(flickT / 0.07); bgx.lineCap = 'round';
      const path = (pts, k) => { const n = Math.max(2, Math.floor(pts.length * k)); bgx.beginPath(); bgx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) bgx.lineTo(pts[i][0], pts[i][1]); };
      for (const [lw, col, blur, al] of [[9, 'rgba(120,165,255,.3)', 22, 1], [3.5, '#a9c8ff', 10, 0.9], [1.4, '#ffffff', 4, 1]]) { bgx.globalAlpha = al * flick; bgx.lineWidth = lw; bgx.strokeStyle = col; bgx.shadowColor = 'rgba(140,180,255,.9)'; bgx.shadowBlur = blur;
        path(bgBolt.main, grow); bgx.stroke(); for (const b of bgBolt.br) { const k = clamp((grow - b.at) / Math.max(0.05, 1 - b.at)); if (k > 0) { bgx.lineWidth = lw * b.w; path(b.pts, k); bgx.stroke(); } } }
      bgx.globalAlpha = 1; bgx.shadowBlur = 0; } } }

  // rain: starts as the clouds gather, freezes mid-air in the hush, stops when the sun breaks through
  const rainK = ramp(P, 0.16, 0.32) * (1 - ramp(P, 0.72, 0.77)) * (1 - bloom);
  rain.visible = rainK > 0.01; rainMat.opacity = rainK * 0.18; rain.position.set(center.x, center.y, center.z);
  if (rain.visible) { const fall = (1 - hush * 0.985); let k = 0;
    for (const d of rainD) { const om = speed * d.w * 3.2 / d.r;    // rain spirals round him with the storm
      d.a += om * realDt; d.y -= d.v * realDt * fall; if (d.y < -3) { d.y += 10; d.a = rnd() * 6.283; }
      const ca = Math.cos(d.a), sa = Math.sin(d.a), x = ca * d.r, z = sa * d.r * 0.6 - 1.2;
      const tx = -sa * d.r * om, tz = ca * d.r * om * 0.6, vy = -d.v * fall, n = Math.hypot(tx, vy, tz) || 1; // streak along its velocity
      rainPos[k++] = x; rainPos[k++] = d.y; rainPos[k++] = z; rainPos[k++] = x - tx / n * d.l; rainPos[k++] = d.y - vy / n * d.l; rainPos[k++] = z - tz / n * d.l; }
    rainGeo.attributes.position.needsUpdate = true; }

  // holograms: appear once the glasses are on, orbit with the storm, then get pulled into the bulb
  const uni = ramp(P, 0.44, 0.56); ringA += speed * 1.9 * realDt;
  for (const h of holos) { const u = h.userData; const on = ramp(P, u.on, u.on + 0.03) * (1 - pull);
    u.ang += speed * u.w * 1.9 * (1.3 / u.r) * realDt; u.tx += u.tumX * speed * realDt; u.ty += u.tumY * speed * realDt;
    const slot = ringA + holos.indexOf(h) / holos.length * Math.PI * 2; let da = ((slot - u.ang) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
    const a = u.ang + da * uni, rr = (u.r + (1.35 - u.r) * uni) * (1 + stormK * 0.25), yy = u.y + (0.25 - u.y) * uni;
    if (uni > 0.98) u.ang = a;
    const orbit = V(center.x + Math.cos(a) * rr * 1.25, center.y + yy + Math.sin(now * 1.3 + u.ph) * 0.05 * (1 - uni), center.z + Math.sin(a) * rr * 0.55 - 0.2);
    const pk = Math.pow(pull, 1.6); h.position.lerpVectors(orbit, tmp.set(headW.x, headW.y + 0.06, headW.z), pk);
    h.quaternion.copy(camera.quaternion); h.rotateY(Math.sin(a) * 0.35 + Math.sin(u.ty) * 0.5 * (1 - uni)); h.rotateX(Math.sin(u.tx) * 0.35 * (1 - uni));
    h.scale.setScalar(Math.max(0.001, (1 - pk * 0.9) * (0.8 + 0.2 * on)));
    const ho = (on + pull * (1 - pk) * 0.8) * (1 - hush * 0.6); h.material.uniforms.uAlpha.value = ho; h.material.uniforms.uTime.value = now;
    h.visible = ho > 0.01 && P < 0.66;
    if (h.visible && u.plate && ((frameN + holos.indexOf(h)) & 1) === 0) u.plate.update(now); }
  frameN++;

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
  bulb.visible = form > 0.01 && P < 0.905; const rise = sm(ramp(P, 0.6, 0.68)); bulb.position.set(headW.x, headW.y + 0.08, headW.z).lerp(bulbPos, rise); bulb.position.y += Math.sin(now * 1.4) * 0.015 * rise;
  bulb.scale.setScalar(Math.max(0.001, form) * (1 + glow * 0.012 * Math.sin(now * 5)));
  // the AR bulb forms from the holograms, then simply fades into reality: a clear, barely-there glass bulb
  const real = arBulb ? ramp(P, 0.645, 0.695) : 1;
  realClip.constant = 1e6; sweep.visible = false;
  holoBulbMat.uniforms.uClipY.value = -1e6; holoBulbMat.uniforms.uTime.value = now;
  holoBulbMat.uniforms.uAlpha.value = form * (1 - real) * (0.9 + 0.1 * Math.sin(now * 23));
  if (arBulb) arBulb.visible = holoBulbMat.uniforms.uAlpha.value > 0.01;
  for (const mm of [baseMat, insMat, wireMat, filMat]) mm.opacity = real;
  // the strike is the convergence 'eureka': scrubbed by scroll, so you can stop on the frozen bolt
  if (!struck && P >= 0.715) { struck = true; const sp = bulbPos.clone().add(V(0, 0.12, 0)).project(camera); makeBolt2d((sp.x + 1) / 2 * HOST.clientWidth, (1 - sp.y) / 2 * HOST.clientHeight); }
  if (struck && P < 0.69) struck = false;
  strikeT = P >= 0.715 ? clamp((P - 0.715) / 0.075) * 1.1 : -1; if (window.__strikeHold != null && strikeT >= 0) strikeT = window.__strikeHold;
  glow = strikeT >= 0 ? ramp(strikeT, 0.14, 0.45) : glow * Math.max(0, 1 - realDt * 6);
  glassMat.emissiveIntensity = glow * 1.6; glassMat.opacity = (0.12 + glow * 0.22) * real; glassPhys.opacity = real * (0.1 + glow * 0.18); glassRim.uniforms.uA.value = real; glassPhys.emissiveIntensity = glow * 0.9; stemMat.opacity = 0.08 * real; glassMat.color.setRGB(0.93 + glow * 0.07, 0.96, 1.0 - glow * 0.25);
  filMat.color.setRGB(0.54 + glow * 0.8, 0.56 + glow * 0.6, 0.6 + glow * 0.2);
  haloMat.opacity = Math.min(1, glow) * 0.6 * (0.96 + 0.04 * Math.sin(now * 6)); halo.scale.setScalar(0.3 + Math.min(1.2, glow) * 0.9 + bloom * 3);
  bulbLight.intensity = glow * 1.2 + (strikeT >= 0.14 && strikeT < 0.6 ? (1 - (strikeT - 0.14) / 0.46) * 6 : 0);
  // bolt flickers for ~0.45s
  // the bolt races down from the sky in ~80 ms, holds, flickers twice and fades
  drawBolt2d(strikeT);
  bolt.visible = false && strikeT >= 0 && strikeT < 0.8 && !(strikeT > 0.22 && strikeT < 0.25) && !(strikeT > 0.4 && strikeT < 0.43);
  if (bolt.visible) { const grow = clamp(strikeT / 0.14); for (const b of boltParts) b.g.setDrawRange(0, Math.floor(b.total * clamp((grow - b.delay * 0.8) / 0.4))); 
    const fade = 1 - ramp(strikeT, 0.5, 0.8); boltMatCore.opacity = fade; boltMatGlow.opacity = 0.6 * fade; boltMatHaze.opacity = 0.22 * fade; }
  // the strike: a white-out centred on the bulb (with a second pulse), fading as the bulb settles to gold
  // the bolt is seen first; the flash bursts from the bulb only when it lands (t=0.14), never a full white-out
  if (strikeT >= 0 && strikeT < 1.1) { const t = strikeT, f = t < 0.14 ? 0.08 : t < 0.2 ? 0.62 : t < 0.26 ? 0.35 : t < 0.32 ? 0.55 : Math.max(0, 0.55 - (t - 0.32) * 0.9);
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

  // the coin: forms in the bloom, arcs down past the side of his head (never through it) into his hands;
  // then he unfolds, takes it and jets up and away (the avatar's own exit, driven by the story)
  bones.mixamorigLeftHand.getWorldPosition(handL); bones.mixamorigRightHand.getWorldPosition(handR);
  // once he starts to leave, the coin's spot freezes where it was (it must not follow him off-screen)
  if (!coinHome || P < 0.955) coinHome = { lap: handL.clone().add(handR).multiplyScalar(0.5).add(V(0, 0.1, 0.16)), head: headW.clone(), bulb: bulbPos.clone() };
  const lap = coinHome.lap;
  const exitK = ramp(P, 0.955, 1.0); state.storyExit = exitK;
  coin.visible = P >= 0.9;
  if (coin.visible) { const H0 = coinHome.head, k = sm(ramp(P, 0.9, 0.94)), ctl = V(H0.x + 0.42, H0.y + 0.1, H0.z + 0.38);
    const q0 = V().lerpVectors(coinHome.bulb, ctl, k), q1 = V().lerpVectors(ctl, lap, k); coin.position.lerpVectors(q0, q1, k);
    // he leaves it behind: once he has flown off, the coin rises a little and grows into the focus
    const grow = sm(ramp(exitK, 0.35, 0.9)); coin.position.lerp(tmp.set(H0.x, H0.y - 0.05, H0.z + 0.5), grow * 0.7);
    coin.position.y += Math.sin(now * 1.6) * 0.015;
    coin.scale.setScalar((0.6 + 0.4 * ramp(P, 0.9, 0.93)) * (1 + grow * 1.4));
    if (realCoin) { realCoin.position.copy(coin.position); realCoin.rotation.set(0.12, coinSpin.phase, Math.sin(now * 0.7) * 0.06); realCoin.scale.copy(coin.scale); realCoin.visible = true; coin.visible = false; }
  } else if (realCoin) realCoin.visible = false;
  if (coinSpin.id == null) { coinSpin.phase += (0.9 + coinSpin.extra) * realDt; coinSpin.extra *= Math.exp(-realDt / 1.4); }
  coinGlow.visible = !!(realCoin && realCoin.visible); if (coinGlow.visible) { coinGlow.position.copy(realCoin.position).add(V(0, 0, -0.05)); coinGlow.scale.setScalar(0.5 * realCoin.scale.x * (1 + 0.08 * Math.sin(now * 2.2))); coinGlow.material.opacity = 0.75; }
  // glints: a star flares where the rim or face actually catches the light as it turns
  const cObj = realCoin && realCoin.visible ? realCoin : null;
  for (const g of glints) g.visible = false;
  if (cObj) { cObj.updateMatrixWorld(); const e = cObj.matrixWorld.elements, ex = V(e[0], e[1], e[2]).normalize(), ey = V(e[4], e[5], e[6]).normalize(), ez = V(e[8], e[9], e[10]).normalize();
    const cp = cObj.position, Lp = V(bulbPos.x - 0.6, bulbPos.y + 0.8, bulbPos.z + 1.2), H = Lp.sub(cp).normalize().add(tmp.copy(camera.position).sub(cp).normalize()).normalize();
    const R = 0.1 * cObj.scale.x, hx = H.dot(ex), hy = H.dot(ey), inPlane = Math.hypot(hx, hy), th = Math.atan2(hy, hx);
    const rimI = Math.pow(inPlane, 18), faceI = Math.pow(Math.abs(H.dot(ez)), 40);
    const g0 = glints[0]; g0.visible = rimI > 0.02; g0.position.copy(cp).addScaledVector(ex, Math.cos(th) * R).addScaledVector(ey, Math.sin(th) * R); g0.material.opacity = rimI; g0.scale.setScalar(0.05 + rimI * 0.09); g0.material.rotation = now * 0.6;
    const g1 = glints[1]; g1.visible = faceI > 0.02; g1.position.copy(cp).addScaledVector(ex, -R * 0.35).addScaledVector(ey, R * 0.4).addScaledVector(ez, 0.02); g1.material.opacity = faceI; g1.scale.setScalar(0.06 + faceI * 0.12); g1.material.rotation = -now * 0.4;
    const tw = Math.max(0, Math.sin(now * 2.3 + 1)) ** 12, g2 = glints[2]; g2.visible = tw > 0.02; g2.position.copy(cp).addScaledVector(ex, R * 0.55).addScaledVector(ey, -R * 0.62); g2.material.opacity = tw * 0.9; g2.scale.setScalar(0.04 + tw * 0.05); }
  // lights
  for (const L of lights) { L.l.intensity = L.i * (1 - dark * 0.45) * (1 + sun * (1 - reveal) * 0.25);
    L.l.color.copy(L.c).lerp(COOL, dark * 0.55).lerp(WARM, sun * (1 - reveal * 0.7) * 0.45); }

  // camera: pushes in on him for the hush and strike, pulls back out for the reveal
  if (!camBase || P < 0.004) camBase = { pos: Z.camFull.pos.clone().sub(camOff), target: Z.camFull.target.clone().sub(camOff) };
  const push = ramp(P, 0.6, 0.7) * (1 - ramp(P, 0.88, 0.98));
  // phones: lift him in the frame so the 'No limits' title sits underneath him rather than across him
  camOff.set(0, innerWidth < 700 ? -0.42 * (1 - push) : 0, 0);
  const pTarget = V(headW.x - 0.05, headW.y + 0.12, headW.z), pPos = V(headW.x + 0.25, headW.y + 0.05, headW.z + 3.1);
  Z.camFull.target.lerpVectors(camBase.target, pTarget, push * 0.85).add(camOff); Z.camFull.pos.lerpVectors(camBase.pos, pPos, push * 0.85).add(camOff);

  // expressions per beat
  // he keeps the same calm, concentrating face throughout (no expression changes)

  // overlays (screen space)
  dimEl.style.opacity = (dark * (1 - flick * 0.22)).toFixed(3);
  const sp = bulbPos.clone().project(camera); const cw = HOST.clientWidth, ch = HOST.clientHeight;
  const bx = ((sp.x + 1) / 2 * cw).toFixed(0), by = ((1 - sp.y) / 2 * ch).toFixed(0);
  const rays = band(P, 0.74, 0.8, 0.88, 0.93);
  if (rays > 0.01) raysEl.style.background = `radial-gradient(circle at ${bx}px ${by}px, rgba(255,246,222,.95) 0px, rgba(255,226,170,.7) ${(ch * 0.06).toFixed(0)}px, rgba(255,206,130,.28) ${(ch * 0.22).toFixed(0)}px, rgba(255,200,120,0) ${(ch * 0.55).toFixed(0)}px)`;
  raysEl.style.opacity = (rays * 0.6 * (0.92 + 0.08 * Math.sin(now * 2))).toFixed(3);
  const fl = band(P, 0.73, 0.78, 0.88, 0.92); flareEl.style.opacity = fl.toFixed(3);
  if (fl > 0.01) { const cx = cw / 2, cy = ch / 2; for (const g of flareGhosts) { g.i.style.left = (+bx + (cx - bx) * g.k) + 'px'; g.i.style.top = (+by + (cy - by) * g.k) + 'px'; }
    streak.style.left = bx + 'px'; streak.style.top = by + 'px'; streak.style.width = (cw * 0.7) + 'px'; }
  bloomEl.style.background = `radial-gradient(90% 90% at ${bx}px ${by}px, rgba(255,252,238,1) 0%, rgba(255,240,205,.97) 35%, rgba(255,226,170,.9) 100%)`;
  bloomEl.style.opacity = (bloom * 0.72).toFixed(3);
  CAPS.forEach((c, i) => { const o = band(P, c[0], c[1], c[2], c[3]); capEls[i].style.opacity = o.toFixed(3); capEls[i].style.transform = `translateY(${((1 - o) * 12).toFixed(1)}px)`; });
  const co = ramp(P, 0.93, 0.955); cta.style.opacity = co.toFixed(3); cta.style.pointerEvents = co > 0.5 ? 'auto' : 'none';
  coach.style.opacity = 0;
  if (co > 0.01 && realCoin) { const cs = realCoin.position.clone().project(camera), cx2 = (cs.x + 1) / 2 * cw, cy2 = (1 - cs.y) / 2 * ch, rpx = 0.12 * realCoin.scale.x / Math.max(0.01, realCoin.position.distanceTo(camera.position)) * ch * 1.9;
    cta.style.left = cx2.toFixed(0) + 'px'; cta.style.top = (cy2 + rpx + 14).toFixed(0) + 'px'; cta.style.transform = 'translateX(-50%)';
    coinHit.style.left = cx2.toFixed(0) + 'px'; coinHit.style.top = cy2.toFixed(0) + 'px'; coinHit.style.width = coinHit.style.height = (rpx * 2.2).toFixed(0) + 'px'; }
  coinHit.style.pointerEvents = co > 0.5 && realCoin && realCoin.visible ? 'auto' : 'none';
  if (window.__storyDebug) { window.__storyDebug.P = P; window.__storyDebug.strikeT = strikeT; window.__storyDebug.flick = flick; window.__storyDebug.gestT = gestT; }
});

// ---------- below the story: About text goes full-screen with a photo slot, over a descent to Earth ----------
document.body.classList.add('zs-on');
const css2 = document.createElement('style');
css2.textContent = `
body.zs-on .page_root{position:relative}
body.zs-on .about_section{position:relative;z-index:1;background:transparent!important}
body.zs-on .about_section > .page_wrap{max-width:none!important;width:100%!important;padding-left:6vw!important;padding-right:6vw!important;box-sizing:border-box}
body.zs-on .about_panel{max-width:none!important;width:100%!important;min-height:86vh;display:grid!important;grid-template-columns:minmax(240px,.75fr) 1.5fr;column-gap:5vw;row-gap:2.2em;align-content:center;padding:6vw!important;box-sizing:border-box}
body.zs-on .about_panel > *:not(.zs-photo){grid-column:2}
body.zs-on .about_panel > .text-body:first-of-type{font:500 clamp(22px,2.1vw,32px)/1.32 'League Spartan',system-ui,sans-serif;letter-spacing:-.005em}
body.zs-on .zs-photo{grid-column:1;grid-row:1 / span 3;align-self:center;aspect-ratio:4/5;border-radius:28px;border:2px dashed rgba(120,140,170,.55);background:rgba(255,255,255,.18);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.5em;font:600 13px/1.3 'League Spartan',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(40,60,90,.7);text-align:center;padding:1em}
body.zs-on .zs-photo i{font-size:34px;opacity:.6;font-style:normal}
body.zs-on .zs-photo.has-img{border:0;padding:0;margin:0;overflow:hidden;background:none;box-shadow:0 18px 50px rgba(20,40,70,.18)}
body.zs-on .zs-photo.has-img img{width:100%;height:100%;object-fit:cover;object-position:50% 20%;display:block}
@media (max-width:899px){body.zs-on .about_panel{grid-template-columns:1fr;padding:8vw!important}body.zs-on .about_panel > *{grid-column:1!important}body.zs-on .zs-photo{grid-row:auto;max-width:320px;width:70%;justify-self:center}}
#zs-earth{position:absolute;left:0;right:0;z-index:0;pointer-events:none}
body.zs-on .zs-lift, body.zs-on footer, body.zs-on .footer{position:relative;z-index:1;background:transparent!important}
#zs-earth canvas{position:sticky;top:0;width:100%;height:100vh;display:block}
`;
document.head.appendChild(css2);
const panel = document.querySelector('.about_panel');
if (panel && !panel.querySelector('.zs-photo')) { const ph = document.createElement('figure'); ph.className = 'zs-photo has-img'; const im = document.createElement('img'); im.src = new URL('./about/zolton-ggb.webp', import.meta.url).href; im.alt = 'Zolton at the Golden Gate Bridge'; im.loading = 'lazy'; im.decoding = 'async'; ph.appendChild(im); panel.prepend(ph); }
const earthWrap = document.createElement('div'); earthWrap.id = 'zs-earth'; const earthCv = document.createElement('canvas'); earthWrap.appendChild(earthCv);
const root = document.querySelector('.page_root') || document.body; root.prepend(earthWrap);
// lift the page's own footer above the ground. This used to be ".page_root > :last-child", which also caught Zoltbot's chat
// (it lives in .page_root and is appended last when it opens): the chat turned position:relative, dropped into the page flow,
// grew the page by its height and scrolled past the end of the story, showing the sky under the ground.
{ const lift = root.querySelector(':scope > .page_footer') || [...root.children].reverse().find(el => el !== earthWrap && !/(^|\s)zb-/.test(el.className) && !/^(SCRIPT|STYLE|LINK|NOSCRIPT)$/.test(el.tagName) && getComputedStyle(el).position !== 'fixed');
  if (lift) lift.classList.add('zs-lift'); }
const firstSec = document.querySelector('.about_section'), foot = [...document.querySelectorAll('.about_section')].pop();
function placeEarth() { if (!firstSec) return; const rr = root.getBoundingClientRect(), a = firstSec.getBoundingClientRect();
  earthWrap.style.top = (a.top - rr.top) + 'px'; earthWrap.style.height = (rr.height - (a.top - rr.top)) + 'px'; }
// place it now and whenever the page changes height (the story track, fonts, images), so the ground never sits in the wrong spot
placeEarth(); addEventListener('resize', placeEarth); setTimeout(placeEarth, 300); setInterval(placeEarth, 2000);
if (window.ResizeObserver) new ResizeObserver(placeEarth).observe(root);
const ex = earthCv.getContext('2d');
// golden-hour farmland seen from the air, painted in perspective; the camera sinks as you scroll (coming down to reality)
const PLOTS = (() => { let r = 8675309; const rn = () => (r = (r * 16807) % 2147483647) / 2147483647; const out = [];
  const COLS = ['#5d7a3a', '#6f8c42', '#86a24f', '#9fb25e', '#7a5a3c', '#8e6c45', '#5b4632', '#b89a55', '#a88c4c', '#4f6b33'];
  // rows of fields recede from the viewer; each row is split into fields of random widths, a few get a hedgerow and trees
  let z = 0.15; while (z < 70) { const depth = (0.12 + rn() * 0.3) * (1 + z * 0.12); const span = 1.3 * z + 1.5; let x = -span - rn() * 0.5; const skew = (rn() - 0.5) * 0.25;
    while (x < span) { const w = (0.18 + rn() * 0.6) * (1 + z * 0.1); out.push({ x0: x, x1: x + w, z0: z, z1: z + depth, sk: skew, c: COLS[Math.floor(rn() * COLS.length)], hedge: rn() < 0.55, trees: rn() < 0.35, rows: rn() < 0.4, sd: rn() * 1e5 }); x += w; }
    z += depth; }
  return out.sort((p, q) => q.z0 - p.z0); })();
const hexRGB = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
let earthQ = -1, earthNight = null;
function drawEarth() {
  if (!firstSec) return; const W = earthCv.clientWidth, H = earthCv.clientHeight; if (!W || !H) return;
  const dpr = Math.min(2, devicePixelRatio || 1), resized = earthCv.width !== Math.round(W * dpr); if (resized) { earthCv.width = Math.round(W * dpr); earthCv.height = Math.round(H * dpr); }
  const night = document.documentElement.getAttribute('data-mode') === 'dark' || !!document.querySelector('.page_root.is-dark') || document.documentElement.classList.contains('zb-night');
  const wr = earthWrap.getBoundingClientRect(), q = clamp(-wr.top / Math.max(1, wr.height - innerHeight)); if (!resized && Math.abs(q - earthQ) < 0.0015 && night === earthNight) return; earthQ = q; earthNight = night;
  const g = ex; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // realistic parallax: we glide forward over the fields and sink a little, so near fields slide past faster than far ones
  const hz = H * 0.36, alt = 1.0 - q * 0.35, f = H * 0.9, cx = W / 2, camZ = q * 7, camX = q * 0.8, sunX = W * 0.2, sunY = -H * 0.15;
  // sky: blue overhead, warm toward the low sun, a bright glow on the horizon
  // the sky above the horizon is the page's own sky (left clear), so it matches the rest of the site in day and night
  g.clearRect(0, 0, W, H);
  // ground
  const haze = night ? [30, 42, 62] : [214, 226, 234], P2 = (X, Z) => [cx + f * (X - camX) / Z, hz + f * alt / Z];
  g.fillStyle = night ? 'rgb(22,30,40)' : 'rgb(176,190,170)'; g.fillRect(0, hz, W, H - hz);
  for (const pl of PLOTS) { const Z0 = pl.z0 + 0.2 - camZ, Z1 = pl.z1 + 0.2 - camZ; if (Z1 < 0.05) continue; if (Z0 < 0.05) continue;
    const a = P2(pl.x0 + pl.sk * Z0, Z0), b = P2(pl.x1 + pl.sk * Z0, Z0), c = P2(pl.x1 + pl.sk * Z1, Z1), d = P2(pl.x0 + pl.sk * Z1, Z1);
    if (Math.max(a[0], b[0], c[0], d[0]) < -50 || Math.min(a[0], b[0], c[0], d[0]) > W + 50) continue;
    const zm = (Z0 + Z1) / 2, hk = 1 - Math.exp(-zm / (9 + q * 6)), [r0, g0, b0] = hexRGB(pl.c);
    const warm = 0.06;
    const base = night ? [r0 * 0.26 + 8, g0 * 0.28 + 13, b0 * 0.3 + 26] : [r0 + (255 - r0) * warm * 0.35, g0 + (210 - g0) * warm * 0.2, b0 * (1 - warm * 0.3)];
    const col = base.map((v, i) => Math.round(v + (haze[i] - v) * hk));
    g.fillStyle = `rgb(${col})`; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fill();
    const lw = Math.max(0.4, f * 0.006 / zm);
    if (pl.rows && zm < 12) { g.strokeStyle = `rgba(0,0,0,${0.08 * (1 - hk)})`; g.lineWidth = Math.max(0.3, lw * 0.3); g.beginPath(); for (let k = 1; k < 6; k++) { const t = k / 6, p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], qq = [d[0] + (c[0] - d[0]) * t, d[1] + (c[1] - d[1]) * t]; g.moveTo(...p); g.lineTo(...qq); } g.stroke(); }
    if (pl.hedge) { const hc = (night ? [8, 12, 12] : [46, 62, 32]).map((v, i) => Math.round(v + (haze[i] - v) * hk)); g.strokeStyle = `rgb(${hc})`; g.lineWidth = lw * 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    if (pl.trees && zm < 25) { let r = pl.sd; const rn = () => (r = (r * 16807) % 2147483647) / 2147483647; const n = 3 + Math.floor(rn() * 6);
      for (let k = 0; k < n; k++) { const t = rn(), x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, rad = f * (0.012 + rn() * 0.012) / zm;
        g.fillStyle = `rgba(30,35,20,${0.35 * (1 - hk)})`; g.beginPath(); g.ellipse(x + rad * 0.7, y + rad * 0.2, rad * 1.0, rad * 0.35, 0, 0, 7); g.fill(); // short midday shadow
        const tc = (night ? [12, 18, 18] : [58, 78, 38]).map((v, i) => Math.round(v + (haze[i] - v) * hk)), tl = (night ? [60, 80, 112] : [150, 140, 70]).map((v, i) => Math.round(v + (haze[i] - v) * hk));
        g.fillStyle = `rgb(${tc})`; g.beginPath(); g.arc(x, y - rad * 0.8, rad, 0, 7); g.fill(); g.fillStyle = `rgba(${tl},.8)`; g.beginPath(); g.arc(x - rad * 0.35, y - rad * 1.05, rad * 0.5, 0, 7); g.fill();
        if (night && k === 0 && rn() < 0.6) { const lx = x + rad * 1.4, ly = y - rad * 0.3, lr2 = Math.max(1, rad * 0.35); const gl = g.createRadialGradient(lx, ly, 0, lx, ly, lr2 * 5); gl.addColorStop(0, `rgba(255,214,140,${0.9 * (1 - hk)})`); gl.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = gl; g.fillRect(lx - lr2 * 5, ly - lr2 * 5, lr2 * 10, lr2 * 10); } } } }
  // atmosphere: horizon haze band and warm raking light from the sun
  const hzc = night ? '40,56,84' : '226,236,242', hb = g.createLinearGradient(0, hz - H * 0.05, 0, hz + H * 0.16); hb.addColorStop(0, `rgba(${hzc},0)`); hb.addColorStop(0.25, `rgba(${hzc},.9)`); hb.addColorStop(1, `rgba(${hzc},0)`); g.fillStyle = hb; g.fillRect(0, hz - H * 0.05, W, H * 0.18);
  if (!night) { const lr = g.createRadialGradient(sunX, hz, 0, sunX, hz, W * 0.7); lr.addColorStop(0, 'rgba(255,250,230,.12)'); lr.addColorStop(1, 'rgba(255,250,230,0)'); g.fillStyle = lr; g.fillRect(0, hz, W, H - hz); }
}
(function earthLoop() { const r = earthWrap.getBoundingClientRect(); if (r.bottom > 0 && r.top < innerHeight) drawEarth(); requestAnimationFrame(earthLoop); })();
window.__storyDebug = { P: 0 }; window.__bulbDbg = { glassPhys, glassRim, bulb, stemMat, insMat, baseMat, wireMat, filMat };
console.log('[zolton] scroll story ready');

// Warm-up: every story material that isn't on screen yet (storm, rain, holograms, bulb, coin) is compiled in the background
// once the page has settled, so the storm doesn't freeze for most of a second the first time it scrolls in.
// (three.js only compiles what's visible, so stand-in copies of the hidden objects go in a throwaway scene.)
(function warmStory() {
  const R = Z.renderer; if (!R || !R.compileAsync) return;
  let tries = 0;
  const go = () => {
    const ws = new THREE.Scene();
    Z.scene.traverse(o => {
      if (!o.material || o.isSkinnedMesh) return;
      let shown = true; for (let p = o; p; p = p.parent) if (!p.visible) { shown = false; break; }
      if (shown) return;
      let m = null;
      if (o.isInstancedMesh) m = new THREE.InstancedMesh(o.geometry, o.material, 1);
      else if (o.isPoints) m = new THREE.Points(o.geometry, o.material);
      else if (o.isLineSegments) m = new THREE.LineSegments(o.geometry, o.material);
      else if (o.isLine) m = new THREE.Line(o.geometry, o.material);
      else if (o.isSprite) m = new THREE.Sprite(o.material);
      else if (o.isMesh) m = new THREE.Mesh(o.geometry, o.material);
      if (m) { m.frustumCulled = false; m.renderOrder = o.renderOrder; ws.add(m); }
    });
    if (ws.children.length) R.compileAsync(ws, Z.camera, Z.scene).catch(() => {});
    // the bulb and coin models arrive later: one more pass picks them up
    if (++tries < 2) setTimeout(() => (window.requestIdleCallback || setTimeout)(go, { timeout: 2000 }), 4000);
  };
  const start = () => setTimeout(() => (window.requestIdleCallback || setTimeout)(go, { timeout: 2000 }), 2500);
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
})();
