/* zb-password — Zoltbot and a cloud sky for the zoltonbaize.com password page.
   Replaces the page's avatar image with a live 3D Zoltbot that follows the cursor,
   glances at the password field on focus, covers his eyes while you type, hops on submit
   and shakes his head after a wrong password. Uses the site's <zb-sky> when present,
   otherwise paints its own sky with drifting clouds. Loads three.js 0.152.2 from jsDelivr. */
(function () {
  'use strict';
  if (window.__zbPassword) return; window.__zbPassword = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const form = document.querySelector('form[action*="wf_auth"]') || document.querySelector('.utility-page-form') || document.querySelector('form');
  if (!form) return;
  const wrap = form.closest('.utility-page-wrap') || document.body;
  const card = form.closest('.utility-page-content') || form;
  const input = form.querySelector('input[type="password"]');
  const failEl = document.querySelector('.w-form-fail, .w-password-page.w-form-fail');

  // ---------- Styles ----------
  const css = document.createElement('style');
  css.textContent = [
    '.zb-pw-bot{width:200px;height:200px;margin:0 auto 4px;display:block;max-width:100%}',
    '.zb-pw-bot canvas{width:100%;height:100%;display:block}',
    '.zb-pw-card{position:relative;z-index:2;border-radius:28px;padding:32px 28px;background:rgba(255,255,255,.5);border:1px solid rgba(255,255,255,.88);',
    'box-shadow:0 18px 44px -20px rgba(4,34,58,.45),inset 0 1.5px 0 rgba(255,255,255,.95);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%)}',
    '.zb-pw-sky{position:fixed;inset:0;z-index:0;pointer-events:none;background:linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%)}',
    '.zb-pw-sky canvas{position:absolute;inset:0;width:100%;height:100%}',
    '.zb-pw-raise{position:relative;z-index:1}'
  ].join('');
  document.head.appendChild(css);

  // ---------- Sky + clouds ----------
  wrap.classList.add('zb-pw-raise');
  card.classList.add('zb-pw-card');
  if (window.customElements && customElements.get('zb-sky')) {
    const sky = document.createElement('zb-sky');
    sky.setAttribute('fixed', '');
    document.body.insertBefore(sky, document.body.firstChild);
  } else {
    const sky = document.createElement('div');
    sky.className = 'zb-pw-sky';
    const c = document.createElement('canvas'); sky.appendChild(c);
    document.body.insertBefore(sky, document.body.firstChild);
    const g = c.getContext('2d');
    // pre-render three cloud puffs
    const puff = (seed) => {
      const pc = document.createElement('canvas'); pc.width = 520; pc.height = 300;
      const q = pc.getContext('2d');
      let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9; i++) {
        const x = 90 + r() * 340, y = 150 + r() * 70 - (i < 4 ? 40 : 0), rad = 55 + r() * 70;
        const gr = q.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        q.fillStyle = gr; q.beginPath(); q.arc(x, y, rad, 0, Math.PI * 2); q.fill();
      }
      q.globalCompositeOperation = 'source-atop';
      const sh = q.createLinearGradient(0, 160, 0, 300); sh.addColorStop(0, 'rgba(170,200,225,0)'); sh.addColorStop(1, 'rgba(150,185,215,.55)');
      q.fillStyle = sh; q.fillRect(0, 0, 520, 300);
      return pc;
    };
    const puffs = [puff(7), puff(91), puff(303)];
    const items = Array.from({ length: 9 }, (_, i) => ({ p: puffs[i % 3], x: Math.random(), y: 0.08 + (i / 9) * 0.85, s: 0.45 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.008 }));
    const draw = (t) => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      items.forEach(it => {
        if (!reduce) it.x += it.v / 60;
        if (it.x > 1.25) it.x = -0.35;
        const cw = 520 * it.s * Math.max(0.7, w / 1400), ch = cw * 300 / 520;
        g.globalAlpha = 0.92; g.drawImage(it.p, it.x * w - cw / 2, it.y * h - ch / 2, cw, ch);
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ---------- Zoltbot ----------
  const img = form.querySelector('img');
  const holder = document.createElement('div');
  holder.className = 'zb-pw-bot';
  holder.setAttribute('role', 'img');
  holder.setAttribute('aria-label', 'Zoltbot, a small flying drone, keeping watch over the password');
  if (img) { img.style.display = 'none'; img.parentNode.insertBefore(holder, img); } else form.insertBefore(holder, form.firstChild);

  function boot() {
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    holder.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.12, 2.05); camera.lookAt(0, 0.06, 0);
    {
      const envScene = new THREE.Scene();
      envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
        fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0. ? mix(vec3(.8,.92,.98), vec3(.1,.42,.8), pow(h,.6)) : vec3(.95,.9,.82); gl_FragColor = vec4(c,1.); }' })));
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;
    }
    scene.add(new THREE.HemisphereLight(0xcfe9ff, 0xe8d2b8, 0.7));
    const key = new THREE.DirectionalLight(0xfff0e0, 1.5); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fe6ff, 1.4); rim.position.set(3, 2, -4); scene.add(rim);

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    function limb(a, b, r, mat) {
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
      return m;
    }
    const metalDark = new THREE.MeshStandardMaterial({ color: '#56616B', metalness: 1, roughness: 0.35 });
    const bot = new THREE.Group(); scene.add(bot);
    const botBody = new THREE.Group(); bot.add(botBody);
    const shell = new THREE.MeshPhysicalMaterial({ color: '#F4F8FB', roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 32), shell); body.scale.set(1, 0.9, 0.95); botBody.add(body);
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.3, 48, 24), new THREE.MeshPhysicalMaterial({ color: '#0B1E2C', roughness: 0.1, clearcoat: 1, metalness: 0.2 }));
    visor.scale.set(0.72, 0.46, 0.4); visor.position.set(0, 0.02, 0.17); botBody.add(visor);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#5FF4FF' });
    const eyes = new THREE.Group(); botBody.add(eyes);
    const eyeL = new THREE.Mesh(new THREE.CapsuleGeometry(0.03, 0.035, 4, 10), eyeMat); eyeL.position.set(-0.075, 0.025, 0.29); eyes.add(eyeL);
    const eyeR = eyeL.clone(); eyeR.position.x = 0.075; eyes.add(eyeR);
    [-1, 1].forEach(s => { const ch = new THREE.Mesh(new THREE.CircleGeometry(0.025, 16), new THREE.MeshBasicMaterial({ color: '#7FF0D8', transparent: true, opacity: 0.8 })); ch.position.set(s * 0.15, -0.06, 0.262); ch.lookAt(ch.position.clone().multiplyScalar(2)); botBody.add(ch); });
    botBody.add(limb(V(0, 0.26, 0), V(0.03, 0.42, 0), 0.012, metalDark));
    const antBall = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshStandardMaterial({ color: '#00E0B8', emissive: '#00BEFF', emissiveIntensity: 0.9 }));
    antBall.position.set(0.03, 0.44, 0); botBody.add(antBall);
    const rotors = [], arms = [];
    [-1, 1].forEach(s => {
      const arm = new THREE.Group(); arm.position.set(s * 0.24, 0.05, 0); botBody.add(arm); arms.push(arm);
      arm.add(limb(V(0, 0, 0), V(s * 0.18, 0.09, 0), 0.025, metalDark));
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), metalDark); hub.position.set(s * 0.18, 0.11, 0); arm.add(hub);
      const rotor = new THREE.Group(); rotor.position.set(s * 0.18, 0.14, 0); arm.add(rotor);
      const bladeMat = new THREE.MeshStandardMaterial({ color: '#BFF6FF', transparent: true, opacity: 0.55, roughness: 0.3 });
      [0, Math.PI].forEach(a => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.008, 0.045), bladeMat); b.position.x = Math.cos(a) * 0.1; b.position.z = Math.sin(a) * 0.1; rotor.add(b); });
      rotors.push(rotor);
    });
    // Little hands that come up over the visor while you type
    const handMat = new THREE.MeshPhysicalMaterial({ color: '#E8EEF2', roughness: 0.3, clearcoat: 1 });
    const hands = [-1, 1].map(s => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), handMat); h.scale.set(1.1, 0.85, 0.6); botBody.add(h); return { h, s }; });

    // ---------- Behaviour ----------
    const look = new THREE.Vector2(), lookT = new THREE.Vector2();
    let focused = false, typing = 0, hop = -1, shake = failEl && getComputedStyle(failEl).display !== 'none' ? 0 : -1;
    addEventListener('pointermove', e => {
      const r = holder.getBoundingClientRect();
      lookT.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2))), Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height / 2)) / (innerHeight / 2))));
    });
    if (input) {
      input.addEventListener('focus', () => { focused = true; });
      input.addEventListener('blur', () => { focused = false; typing = 0; });
      input.addEventListener('input', () => { typing = 1.6; });
    }
    form.addEventListener('submit', () => { hop = 0; typing = 0; });

    function resize() { const s = holder.clientWidth || 200; renderer.setSize(s, s, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    resize(); addEventListener('resize', resize);

    const clock = new THREE.Clock();
    const ease = x => x * x * (3 - 2 * x);
    let cover = 0;
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, m = reduce ? 0.3 : 1;
      typing = Math.max(0, typing - dt);
      const tgt = focused ? new THREE.Vector2(lookT.x * 0.3, -0.55) : lookT;
      look.lerp(tgt, 1 - Math.pow(0.004, dt));
      cover += ((typing > 0 ? 1 : 0) - cover) * (1 - Math.pow(0.0008, dt));
      const c = ease(Math.min(1, cover));

      bot.position.y = Math.sin(t * 2.2) * 0.05 * m;
      botBody.rotation.y = look.x * 0.6 * (1 - c * 0.6);
      botBody.rotation.x = -look.y * 0.35 + c * 0.25;
      botBody.rotation.z = Math.sin(t * 1.7) * 0.05 * m;
      if (shake >= 0) { shake += dt; botBody.rotation.y += Math.sin(shake * 28) * 0.35 * Math.max(0, 1 - shake / 0.9); if (shake > 0.9) shake = -1; }
      if (hop >= 0) { hop += dt; bot.position.y += Math.sin(Math.min(1, hop / 0.5) * Math.PI) * 0.25; botBody.rotation.y += Math.min(1, hop / 0.5) * Math.PI * 2; if (hop > 0.5) hop = -1; }

      // hands rise from the sides to cover the visor
      hands.forEach(({ h, s }) => {
        h.position.set(s * (0.34 - 0.24 * c), -0.12 + 0.15 * c, 0.12 + 0.2 * c);
        h.visible = c > 0.02;
      });
      arms.forEach((a, i) => { a.rotation.z = (i ? -1 : 1) * c * 0.25; });
      // eyes: blink, and squeeze shut while covered
      const blink = (t % 4.2) < 0.12 ? 0.15 : 1;
      eyes.scale.y = Math.min(blink, 1 - c * 0.85);
      eyeMat.color.set(shake >= 0 ? '#FFB08B' : '#5FF4FF');
      rotors.forEach((r, i) => r.rotation.y += dt * (i ? -38 : 38));
      antBall.material.emissiveIntensity = 0.6 + 0.4 * Math.sin(t * 4);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if (window.THREE && THREE.CapsuleGeometry) boot();
  else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
    s.onload = boot;
    s.onerror = () => { holder.remove(); if (img) img.style.display = ''; };
    document.head.appendChild(s);
  }
})();
