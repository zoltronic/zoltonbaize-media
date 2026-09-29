/* Gold cube: a plain, unbranded gold cube for the Selected work tile.
   The cube holds still at a fixed three-quarter angle; the HDRI is what moves, very slowly, so light
   travels across still faces (the same idea as chapter three: move the light, not the letters).
   Material follows the site's gold (material.json): base (0.905, 0.628, 0.297) linear, metallic 1,
   roughness 0.12, clear coat 0.3 / 0.02, specular 0.95.
   Two high-contrast HDRIs, swapped with the page theme: a midday partly cloudy sky for light mode, a lamp-lit night courtyard for dark.
   The key (the brightest point of each HDRI) is placed behind the viewer, slightly off-axis, so the faces
   toward camera catch it and the adjacent faces fall off to a different value.
   Markup: <div class="gold_cube"></div>
   Knobs: window.GOLD_CUBE_CONFIG { day, night, keyAzimuth, keyElevation, drift, period, exposureDay, exposureNight,
   envDay, envNight, tiltX, tiltY, fill } — keyAzimuth/keyElevation in degrees relative to the camera axis. */
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BASE = window.GOLD_CUBE_BASE || window.GOLD_HERO_BASE || './';
const CFG = Object.assign({
  day: 'hdr/sunflowers_puresky_1k.hdr', night: 'hdr/courtyard_night_1k.hdr',   // Poly Haven, CC0: midday partly cloudy / night courtyard lamps
  // exact map orientation [pitch, yaw, roll] in degrees (Euler XYZ, world = R * map direction); found by searching for
  // the rotation that puts the key on the front face and keeps all three faces at clearly different values
  orientDay: [0, 224, -60], orientNight: [-80, 288, 60],
  keyAzimuth: 24, keyElevation: 28,     // key light: behind the viewer, 24 deg to the right and 28 deg up
  drift: 14, period: 120,               // the map swings +-14 deg over 120 s: ambient, seamless (a sine returns to its start)
  exposureDay: 0.6, exposureNight: 1.1, envDay: 1.0, envNight: 1.0,
  tiltX: 18, tiltY: -30,                // fixed cube angle so three faces read; the front face reflects back toward the viewer's left
  fill: 0.62,                           // cube size as a fraction of the stage's shorter side
  capture: false,
}, window.GOLD_CUBE_CONFIG || {});
const D2R = Math.PI / 180;
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
const isLight = () => document.documentElement.getAttribute('data-mode') === 'light';
const abs = p => /^https?:/.test(p) ? p : BASE + p;

// brightest region of an equirect HDR (luminance-weighted centroid of the top 0.05%), as a unit direction
// in three's equirect convention: u = atan2(z, x)/2pi + .5, v = asin(y)/pi + .5 (v up)
function keyDirection(tex) {
  const { data, width: w, height: h } = tex.image; const ch = data.length / (w * h);
  const toF = tex.type === THREE.HalfFloatType ? THREE.DataUtils.fromHalfFloat : (x => x);
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) lum[i] = 0.2126 * toF(data[i * ch]) + 0.7152 * toF(data[i * ch + 1]) + 0.0722 * toF(data[i * ch + 2]);
  const sorted = Float32Array.from(lum).sort(); const thr = sorted[Math.floor(sorted.length * 0.9995)];
  const v = new THREE.Vector3(); let wsum = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const L = lum[y * w + x]; if (L < thr) continue;
    const u = (x + 0.5) / w, vv = tex.flipY ? 1 - (y + 0.5) / h : (y + 0.5) / h;
    const phi = (u - 0.5) * 2 * Math.PI, el = (vv - 0.5) * Math.PI;
    v.x += Math.cos(phi) * Math.cos(el) * L; v.z += Math.sin(phi) * Math.cos(el) * L; v.y += Math.sin(el) * L; wsum += L;
  }
  return v.normalize();
}

function setup(el) {
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%'; el.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!CFG.capture });
  const coarse = matchMedia('(pointer:coarse)').matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2)); renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100); camera.position.set(0, 0, 8);
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color().setRGB(0.905, 0.628, 0.297, THREE.LinearSRGBColorSpace), metalness: 1, roughness: 0.12, clearcoat: 0.3, clearcoatRoughness: 0.02, specularIntensity: 0.95 });
  // a small rounded edge gives the silhouette a line of specular shine
  // probe mode: a mirror sphere shows exactly where the key sits (debug only)
  const cube = CFG.probe ? new THREE.Mesh(new THREE.SphereGeometry(1.4, 96, 64), new THREE.MeshStandardMaterial({ metalness: 1, roughness: 0 })) : new THREE.Mesh(new RoundedBoxGeometry(2, 2, 2, 6, 0.07), mat);
  cube.rotation.set(CFG.tiltX * D2R, CFG.tiltY * D2R, 0, 'XYZ'); scene.add(cube);

  const envs = {}; const pmrem = new THREE.PMREMGenerator(renderer);
  let mode = null, qBase = new THREE.Quaternion();
  const qDrift = new THREE.Quaternion(), qAll = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), eul = new THREE.Euler();
  // target direction of the key: behind the viewer (toward the camera) turned keyAzimuth right and keyElevation up
  function target() { const az = CFG.keyAzimuth * D2R, el2 = CFG.keyElevation * D2R; return new THREE.Vector3(Math.sin(az) * Math.cos(el2), Math.sin(el2), Math.cos(az) * Math.cos(el2)).normalize(); }
  async function load(which) {
    const path = CFG[which]; if (envs[path]) return envs[path];
    const tex = await new RGBELoader().loadAsync(abs(path));
    tex.mapping = THREE.EquirectangularReflectionMapping;
    const key = keyDirection(tex);
    const env = { tex: pmrem.fromEquirectangular(tex).texture, key };
    tex.dispose(); return (envs[path] = env);
  }
  function orient(which, env) {
    const o = CFG[which === 'day' ? 'orientDay' : 'orientNight'];
    if (o) qBase.setFromEuler(new THREE.Euler(o[0] * D2R, o[1] * D2R, o[2] * D2R, 'XYZ'));
    else qBase.setFromUnitVectors(env.key, target());
  }
  function applyTheme(force) {
    const want = isLight() ? 'day' : 'night'; if (want === mode && !force) return; mode = want;
    load(want).then(env => {
      if (mode !== want) return;
      scene.environment = env.tex;
      // three samples the map along R(-rotation) * dir, so a key at env direction k shows up at world direction R * k
      orient(want, env);
      renderer.toneMappingExposure = want === 'day' ? CFG.exposureDay : CFG.exposureNight;
      scene.environmentIntensity = want === 'day' ? CFG.envDay : CFG.envNight;
      el.classList.add('is-live');
    }).catch(err => { console.warn('[gold-cube]', err); el.classList.add('is-static'); });
  }
  applyTheme(); new MutationObserver(() => applyTheme()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mode'] });

  function resize() { const w = el.clientWidth || 300, h = el.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    // fit: the cube's bounding sphere (radius sqrt(3)) covers `fill` of the shorter side
    const t = Math.tan(camera.fov * D2R / 2), r = Math.sqrt(3); const zH = r / (CFG.fill * t), zW = r / (CFG.fill * t * camera.aspect); camera.position.z = Math.max(zH, zW); }
  new ResizeObserver(resize).observe(el); resize();
  let visible = true; new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(el);
  const t0 = performance.now();
  function frame(now) {
    requestAnimationFrame(frame); if (!visible || !scene.environment) return;
    const t = CFG.freezeAt != null ? CFG.freezeAt : (now - t0) / 1000;
    const a = reduce ? 0 : Math.sin((t / CFG.period) * Math.PI * 2) * CFG.drift * D2R;
    qDrift.setFromAxisAngle(yAxis, a); qAll.multiplyQuaternions(qDrift, qBase); eul.setFromQuaternion(qAll, 'XYZ');
    scene.environmentRotation.copy(eul);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  (window.__goldCubes ||= []).push({ el, renderer, scene, cube, CFG, envs, reload: () => applyTheme(true) });
}

const probe = document.createElement('canvas');
if (probe.getContext('webgl2') || probe.getContext('webgl')) document.querySelectorAll('.gold_cube').forEach(setup);
else document.querySelectorAll('.gold_cube').forEach(el => el.classList.add('is-static'));
