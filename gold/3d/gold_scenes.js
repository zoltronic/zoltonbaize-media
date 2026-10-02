/* Gold hero objects for the Selected work tiles 2 and 3, in the same material family and light as the coin:
   metal gold, the Direction 01 environment (hdr/env_coin_d1_1k.hdr), transparent canvas, no branding.
     <div class="gold_scene" data-scene="icons"></div>  Making One Language Out of Many: nine mismatched gold icons drift in
                                                         at odd sizes and angles, snap into one aligned 3x3 grid, hold, drift apart.
     <div class="gold_scene" data-scene="card"></div>   The Machine That Teaches You How: a gold card glides into a card-reader
                                                         slot while the guide light pulses, then eases back out.
   Paused off screen; reduced motion shows the resolved pose (the grid; the card in the slot).
   Knobs: window.GOLD_SCENES_CONFIG { env, icons, fill, loopIcons, loopCard } */
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BASE = window.GOLD_SCENES_BASE || window.GOLD_COIN_BASE || './';
const CFG = Object.assign({ env: 'hdr/env_coin_d1_1k.hdr', icons: 'icons9.json', fill: 0.78, loopIcons: 9, loopCard: 6.5 }, window.GOLD_SCENES_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const abs = p => /^https?:/.test(p) ? p : BASE + p;
const D2R = Math.PI / 180;
const lin = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.LinearSRGBColorSpace);
const smooth = x => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
const ease = x => { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
// a small deterministic random so the scatter is the same on every load
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

// the coin's gold, as a family: face, brighter edge, darker body
const GOLD = { face: lin(0.86, 0.62, 0.33), bright: lin(0.93, 0.74, 0.44), deep: lin(0.55, 0.37, 0.18) };
const gold = (c, r) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: r });

function makeRenderer(el) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const coarse = matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2)); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; // same as the coin (Blender Standard)
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); el.classList.add('is-static'); });
  return renderer;
}
function envFor(renderer) {
  return new RGBELoader().loadAsync(abs(CFG.env)).then(t => {
    t.mapping = THREE.EquirectangularReflectionMapping; const pm = new THREE.PMREMGenerator(renderer);
    const e = pm.fromEquirectangular(t).texture; t.dispose(); pm.dispose(); return e;
  });
}
// frame a bounding radius into the canvas at `fill` of the shorter side
function fitCamera(camera, el, radius, fill) {
  const w = el.clientWidth || 300, h = el.clientHeight || 200; camera.aspect = w / h; camera.updateProjectionMatrix();
  const t = Math.tan(camera.fov * D2R / 2); return Math.max(radius / (fill * t), radius / (fill * t * camera.aspect));
}

/* ---------- tile 2: icons snapping into one grid ---------- */
async function iconsScene(el, renderer, scene, camera) {
  const data = await (await fetch(abs(CFG.icons))).json();
  const loader = new SVGLoader(), names = Object.keys(data.icons);
  const mats = [gold(GOLD.face, 0.2), gold(GOLD.bright, 0.12)];
  const rand = rng(7), group = new THREE.Group(); scene.add(group);
  const items = names.slice(0, 9).map((n, i) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.icons[n].viewBox}">${data.icons[n].paths.map(d => `<path d="${d}"/>`).join('')}</svg>`;
    const shapes = loader.parse(svg).paths.flatMap(p => SVGLoader.createShapes(p));
    // one geometry for all of an icon's shapes keeps the cap/side material groups
    const geo = new THREE.ExtrudeGeometry(shapes, { depth: 26, bevelEnabled: true, bevelThickness: 5, bevelSize: 4, bevelSegments: 4, curveSegments: 10 });
    // SVG y runs down: turn it over (a rotation, not a negative scale, so the faces keep their winding)
    geo.center(); geo.rotateX(Math.PI); geo.scale(1 / 256, 1 / 256, 1 / 256);
    const mesh = new THREE.Mesh(geo, mats); // [face, sides]: ExtrudeGeometry groups 0 = caps, 1 = sides
    const col = i % 3, row = Math.floor(i / 3);
    const home = new THREE.Vector3((col - 1) * 1.18, (1 - row) * 1.18, 0);
    // the "many": scattered, every one at its own size, depth and angle
    const away = new THREE.Vector3((rand() - 0.5) * 4.2, (rand() - 0.5) * 3.2, (rand() - 0.5) * 2.2);
    const awayRot = new THREE.Euler((rand() - 0.5) * 1.6, (rand() - 0.5) * 2.2, (rand() - 0.5) * 1.2);
    const awayScale = 0.55 + rand() * 0.9, awayDepth = 0.4 + rand() * 1.8;
    group.add(mesh);
    return { mesh, home, away, awayRot, awayScale, awayDepth, seed: rand() * 10 };
  });
  const q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
  return {
    radius: 1.75,
    update(t) {
      // 0-.36 assemble (staggered), .36-.76 hold as one grid, .76-1 drift apart; the scatter breathes so the loop is seamless
      const u = reduce ? 0.5 : (t % CFG.loopIcons) / CFG.loopIcons;
      items.forEach((it, i) => {
        const st = i * 0.022;
        const k = u < 0.5 ? ease((u - st) / 0.3) : 1 - ease((u - 0.76 - st * 0.5) / 0.22);
        const drift = reduce ? 0 : 1;
        const ax = it.away.x + Math.sin(t * 0.5 + it.seed) * 0.18 * drift, ay = it.away.y + Math.cos(t * 0.43 + it.seed) * 0.16 * drift;
        it.mesh.position.set(ax + (it.home.x - ax) * k, ay + (it.home.y - ay) * k, it.away.z * (1 - k));
        q0.setFromEuler(it.awayRot); q1.identity(); it.mesh.quaternion.copy(q0).slerp(q1, k);
        const s = it.awayScale + (1 - it.awayScale) * k; it.mesh.scale.set(s, s, s * (it.awayDepth + (1 - it.awayDepth) * k));
      });
      // the whole set leans slowly so the light runs across the faces
      group.rotation.set(reduce ? -0.12 : -0.12 + Math.sin(t * 0.35) * 0.08, reduce ? 0.28 : Math.sin(t * 0.27) * 0.32, 0);
    },
  };
}

/* ---------- tile 3: a card into the reader ---------- */
async function cardScene(el, renderer, scene, camera) {
  const root = new THREE.Group(); scene.add(root);
  // the reader: a gold bezel on a gold panel, a dark slot, a guide light under it
  const panel = new THREE.Mesh(new RoundedBoxGeometry(3.4, 1.9, 0.5, 4, 0.12), gold(GOLD.deep, 0.34)); panel.position.set(0, 0.35, -0.25); root.add(panel);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(2.9, 0.62, 0.34, 4, 0.14), gold(GOLD.face, 0.16)); bezel.position.set(0, 0.35, 0.12); root.add(bezel);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.11, 0.3), new THREE.MeshBasicMaterial({ color: 0x0b0806 })); slot.position.set(0, 0.35, 0.16); root.add(slot);
  const guideMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.86, 0.55), transparent: true, opacity: 0.4 });
  const guide = new THREE.Mesh(new RoundedBoxGeometry(2.0, 0.07, 0.04, 2, 0.03), guideMat); guide.position.set(0, 0.0, 0.31); root.add(guide);
  const glow = new THREE.PointLight(new THREE.Color(1, 0.84, 0.55), 0, 3, 2); glow.position.set(0, 0.0, 0.7); root.add(glow);
  // the card: plain gold, rounded, with a chip; no marks
  const card = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(2.2, 0.045, 1.39, 4, 0.02), gold(GOLD.bright, 0.18)); card.add(body);
  const chip = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.02, 0.28, 2, 0.008), gold(lin(0.95, 0.85, 0.62), 0.32)); chip.position.set(-0.55, 0.03, -0.18); card.add(chip);
  [-0.06, 0.06].forEach(dz => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.005, 0.006), new THREE.MeshBasicMaterial({ color: 0x8a6a3a })); l.position.set(-0.55, 0.042, -0.18 + dz); card.add(l); });
  root.add(card);
  root.rotation.set(0.32, -0.42, 0);
  const OUT = 2.5, IN = 0.82;  // card centre z: waiting in front / half inside the slot
  return {
    radius: 1.95,
    update(t) {
      const L = CFG.loopCard, u = reduce ? 0.45 : (t % L) / L;
      // .0-.14 wait, .14-.36 glide in, .36-.55 hold (guide light bright), .55-.76 glide out, .76-1 wait
      const k = u < 0.14 ? 0 : u < 0.36 ? ease((u - 0.14) / 0.22) : u < 0.55 ? 1 : u < 0.76 ? 1 - ease((u - 0.55) / 0.21) : 0;
      const hover = reduce ? 0 : Math.sin(t * 2.1) * 0.05 * (1 - k);
      card.position.set(0, 0.35 + hover, OUT + (IN - OUT) * k);
      card.rotation.set(0, 0, (1 - k) * (reduce ? 0 : Math.sin(t * 1.3) * 0.05));
      // the guide light: a slow invitation while waiting, a steady glow once the card is in
      const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
      const lvl = reduce ? 0.8 : Math.max(k, 0.25 + 0.45 * pulse * (1 - k));
      guideMat.opacity = 0.25 + 0.75 * lvl; glow.intensity = 2.2 * lvl;
    },
  };
}

const SCENES = { icons: iconsScene, card: cardScene };
function setup(el) {
  const kind = el.dataset.scene; if (!SCENES[kind]) return;
  const renderer = makeRenderer(el), scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  let api = null, visible = true, running = false; const t0 = performance.now();
  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 200; renderer.setSize(w, h, false); if (api) camera.position.set(0, 0, fitCamera(camera, el, api.radius, CFG.fill)); draw(performance.now()); }
  function draw(now) { if (!api) return; api.update((now - t0) / 1000); renderer.render(scene, camera); }
  function frame(now) { if (!visible) { running = false; return; } draw(now); requestAnimationFrame(frame); }
  function start() { if (running || !api) return; if (reduce) { draw(performance.now()); return; } running = true; requestAnimationFrame(frame); }
  Promise.all([envFor(renderer), SCENES[kind](el, renderer, scene, camera)]).then(([env, a]) => {
    scene.environment = env; api = a; resize(); el.classList.add('is-live'); start();
  }).catch(err => { console.warn('[gold-scene]', err); el.classList.add('is-static'); });
  new ResizeObserver(resize).observe(el);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) start(); }, { rootMargin: '100px' }).observe(el);
  (window.__goldScenes ||= []).push({ el, renderer, scene, camera, render: ms => draw(ms ?? performance.now()) });
}
const probe = document.createElement('canvas');
if (probe.getContext('webgl2') || probe.getContext('webgl')) document.querySelectorAll('.gold_scene').forEach(setup);
else document.querySelectorAll('.gold_scene').forEach(el => el.classList.add('is-static'));
