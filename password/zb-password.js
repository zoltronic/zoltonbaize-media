/* zb-password — Zoltbot and a cloud sky for the zoltonbaize.com password page.
   - Puts the form on a liquid-glass card (uses the site's <zb-sky> glass when present, CSS glass otherwise).
   - Zoltbot floats outside the card: a 3D drone with an LED visor face that changes expression
     (idle, curious on focus, eyes shut while you type, grin on submit, sad after a wrong password, talking).
   - Optional chat: set window.ZB_CHAT_ENDPOINT (POST {messages} -> {reply}) for the live AI,
     or window.ZB_CHAT_DEMO = true for a scripted preview. With neither, no chat UI is shown.
   Loads three.js 0.152.2 from jsDelivr. */
(function () {
  'use strict';
  if (window.__zbPassword) return; window.__zbPassword = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const form = document.querySelector('form[action*="wf_auth"]') || document.querySelector('.utility-page-form') || document.querySelector('form');
  if (!form) return;
  const wrap = form.closest('.utility-page-wrap') || document.body;
  const card = form.closest('.utility-page-content') || form;
  const input = form.querySelector('input[type="password"]');
  const failEl = document.querySelector('.w-form-fail');
  const failed = !!(failEl && getComputedStyle(failEl).display !== 'none');
  const ENDPOINT = window.ZB_CHAT_ENDPOINT || null;
  const DEMO = !ENDPOINT && !!window.ZB_CHAT_DEMO;
  const CHAT = !!(ENDPOINT || DEMO);
  const hasSky = !!(window.customElements && customElements.get('zb-sky'));

  // ---------- Styles ----------
  const css = document.createElement('style');
  css.textContent = `
  :root { --zb-ease: cubic-bezier(.2,.8,.2,1); --zb-ink: #07283D; --zb-muted: #2A5570; }
  .zb-pw-raise { position: relative; z-index: 1; }
  .zb-glass { position: relative; border-radius: 28px; overflow: visible;
    background: linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.04) 55%, rgba(255,255,255,.12));
    border: 1px solid rgba(255,255,255,.62);
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(255,255,255,.3), inset 0 0 24px rgba(255,255,255,.18), 0 30px 60px -30px rgba(4,34,58,.5);
    backdrop-filter: blur(9px) saturate(130%); -webkit-backdrop-filter: blur(9px) saturate(130%); }
  .zb-glass.zb-on-sky { background: transparent; border-color: transparent; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
  .zb-pw-card { padding: 32px 28px; }
  .zb-pw-dock { position: fixed; left: 0; top: 0; width: 230px; height: 230px; z-index: 6; cursor: pointer; border-radius: 50%; will-change: transform; -webkit-tap-highlight-color: transparent; }
  .zb-pw-dock:focus-visible { outline: 2px solid #0A5C86; outline-offset: -20px; }
  .zb-pw-dock canvas { width: 100%; height: 100%; display: block; }
  .zb-pw-bubble { position: absolute; left: 74%; top: 14px; white-space: nowrap; padding: 9px 14px; border-radius: 18px 18px 18px 6px; font: 600 13px system-ui, -apple-system, sans-serif; color: var(--zb-ink);
    opacity: 0; transform: translateY(6px) scale(.96); transform-origin: 0 100%; transition: opacity 300ms var(--zb-ease), transform 300ms var(--zb-ease); pointer-events: none; }
  .zb-pw-bubble.on { opacity: 1; transform: none; }
  .zb-chat { position: fixed; z-index: 5; width: 340px; display: flex; flex-direction: column; color: var(--zb-ink); font: 14px/1.45 system-ui, -apple-system, sans-serif;
    opacity: 0; transform: translateY(10px) scale(.98); pointer-events: none; transition: opacity 300ms var(--zb-ease), transform 300ms var(--zb-ease); }
  .zb-chat.open { opacity: 1; transform: none; pointer-events: auto; }
  .zb-chat-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 14px 16px 10px 18px; border-bottom: 1px solid rgba(7,40,61,.1); }
  .zb-chat-head strong { display: block; font-size: 15px; }
  .zb-chat-head span { font-size: 12px; color: var(--zb-muted); }
  .zb-chat-x { border: 0; background: rgba(255,255,255,.55); color: var(--zb-ink); width: 32px; height: 32px; border-radius: 50%; font-size: 18px; line-height: 1; cursor: pointer; }
  .zb-chat-log { flex: 1; overflow-y: auto; padding: 14px 14px 6px; display: flex; flex-direction: column; gap: 8px; min-height: 0; }
  .zb-msg { max-width: 85%; padding: 9px 12px; border-radius: 16px; white-space: pre-wrap; word-wrap: break-word; }
  .zb-msg.bot { align-self: flex-start; background: rgba(255,255,255,.72); border-bottom-left-radius: 6px; }
  .zb-msg.me { align-self: flex-end; background: #06222F; color: #EAFBF6; border-bottom-right-radius: 6px; }
  .zb-msg.typing { display: inline-flex; gap: 5px; padding: 12px 14px; }
  .zb-msg.typing i { width: 7px; height: 7px; border-radius: 50%; background: #2A5570; opacity: .35; animation: zb-dot 1s infinite; }
  .zb-msg.typing i:nth-child(2) { animation-delay: .15s; } .zb-msg.typing i:nth-child(3) { animation-delay: .3s; }
  @keyframes zb-dot { 0%,60%,100% { opacity: .3; transform: none; } 30% { opacity: 1; transform: translateY(-3px); } }
  .zb-msg.note { align-self: center; max-width: 100%; font-size: 12px; color: var(--zb-muted); background: none; padding: 2px 0; }
  .zb-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 14px 8px; }
  .zb-chip { border: 1px solid rgba(7,40,61,.16); background: rgba(255,255,255,.6); color: var(--zb-ink); border-radius: 999px; padding: 6px 11px; font: 600 12px system-ui, sans-serif; cursor: pointer; }
  .zb-chat-form { display: flex; gap: 8px; padding: 10px 12px 12px; border-top: 1px solid rgba(7,40,61,.1); }
  .zb-chat-form input { flex: 1; min-width: 0; font: 14px system-ui, sans-serif; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(7,40,61,.14); background: rgba(255,255,255,.8); color: var(--zb-ink); }
  .zb-chat-form button { border: 0; border-radius: 12px; padding: 0 14px; background: #06222F; color: #EAFBF6; font: 600 13px system-ui, sans-serif; cursor: pointer; }
  .zb-chat button:focus-visible, .zb-chat input:focus-visible { outline: 2px solid #0A5C86; outline-offset: 2px; }
  @keyframes zb-shake { 0%,100% { transform: translateX(0); } 15% { transform: translateX(-11px); } 30% { transform: translateX(9px); } 45% { transform: translateX(-7px); } 60% { transform: translateX(5px); } 75% { transform: translateX(-3px); } }
  .zb-shake { animation: zb-shake 520ms var(--zb-ease); }
  .zb-wrong { box-shadow: 0 0 0 3px rgba(220,60,40,.4) !important; border-color: rgba(200,50,30,.75) !important; }
  @media (prefers-reduced-motion: reduce) { .zb-shake { animation: none; } }
  .zb-pw-sky { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%); }
  .zb-pw-sky canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
  @media (max-width: 819px) {
    .zb-pw-card { margin-top: 150px; }
    .zb-pw-dock { width: 200px; height: 200px; }
    .zb-pw-bubble { left: 66%; top: 0; }
    .zb-chat { left: 12px !important; right: 12px; bottom: 12px; top: auto !important; width: auto; height: min(60vh, 480px) !important; background: rgba(238,247,253,.88); }
  }`;
  document.head.appendChild(css);

  // ---------- Sky, glass card ----------
  wrap.classList.add('zb-pw-raise');
  card.classList.add('zb-glass', 'zb-pw-card');
  if (hasSky) {
    const sky = document.createElement('zb-sky'); sky.setAttribute('fixed', '');
    document.body.insertBefore(sky, document.body.firstChild);
    card.classList.add('zb-on-sky');
    card.setAttribute('data-zb-glass', ''); card.setAttribute('data-zb-radius', '28');
  } else {
    paintSky();
  }
  function paintSky() {
    const sky = document.createElement('div'); sky.className = 'zb-pw-sky';
    const c = document.createElement('canvas'); sky.appendChild(c);
    document.body.insertBefore(sky, document.body.firstChild);
    const g = c.getContext('2d');
    const puff = (seed) => {
      const pc = document.createElement('canvas'); pc.width = 640; pc.height = 360;
      const q = pc.getContext('2d'); let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
      for (let i = 0; i < 9; i++) {
        const x = 200 + r() * 240, y = 190 + r() * 40 - (i < 4 ? 40 : 0), rad = 50 + r() * 60;
        const gr = q.createRadialGradient(x, y - rad * 0.2, 0, x, y, rad);
        gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        q.fillStyle = gr; q.beginPath(); q.arc(x, y, rad, 0, Math.PI * 2); q.fill();
      }
      q.globalCompositeOperation = 'source-atop';
      const sh = q.createLinearGradient(0, 200, 0, 330); sh.addColorStop(0, 'rgba(170,200,225,0)'); sh.addColorStop(1, 'rgba(150,185,215,.55)');
      q.fillStyle = sh; q.fillRect(0, 0, 640, 360);
      return pc;
    };
    const puffs = [puff(7), puff(91), puff(303)];
    const items = Array.from({ length: 9 }, (_, i) => ({ p: puffs[i % 3], x: Math.random(), y: 0.08 + (i / 9) * 0.85, s: 0.45 + Math.random() * 0.8, v: 0.004 + Math.random() * 0.008 }));
    const draw = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      items.forEach(it => {
        if (!reduce) it.x += it.v / 60;
        if (it.x > 1.25) it.x = -0.35;
        const cw = 640 * it.s * Math.max(0.7, w / 1400), ch = cw * 360 / 640;
        g.globalAlpha = 0.92; g.drawImage(it.p, it.x * w - cw / 2, it.y * h - ch / 2, cw, ch);
      });
      requestAnimationFrame(draw);
    };
    requestAnimationFrame(draw);
  }

  // ---------- Dock (Zoltbot lives here, outside the card) ----------
  const img = form.querySelector('img'); if (img) img.style.display = 'none';
  const dock = document.createElement('div');
  dock.className = 'zb-pw-dock';
  if (CHAT) { dock.setAttribute('role', 'button'); dock.setAttribute('tabindex', '0'); dock.setAttribute('aria-label', 'Chat with Zoltbot, Zolton’s sidekick robot'); }
  else { dock.setAttribute('role', 'img'); dock.setAttribute('aria-label', 'Zoltbot, Zolton’s sidekick robot'); }
  document.body.appendChild(dock);
  // The dock follows its anchor: the card's top-right corner, or the top of the chat panel when it is open.
  (function follow() {
    let cx = null, cy = null, last = performance.now();
    function anchor() {
      const s = dock.offsetWidth || 230, r = card.getBoundingClientRect(), mobile = innerWidth < 820;
      if (bus.chatOpen && chat) { const p = chat.el.getBoundingClientRect(); return [p.left + p.width / 2 - s / 2, p.top - s * 0.74]; }
      if (mobile) return [r.left + r.width / 2 - s / 2, r.top - s * 0.86];
      return [r.right - 64, r.top - 104];
    }
    function step(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const [tx, ty] = anchor();
      if (cx === null || reduce) { cx = tx; cy = ty; }
      else { const k = 1 - Math.pow(0.0004, dt); cx += (tx - cx) * k; cy += (ty - cy) * k; }
      dock.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();
  let bubble = null;
  if (CHAT) {
    bubble = document.createElement('div'); bubble.className = 'zb-pw-bubble zb-glass';
    bubble.textContent = 'Need the password? Ask me.';
    dock.appendChild(bubble);
    setTimeout(() => bubble.classList.add('on'), 1400);
  }

  // ---------- Shared state between the bot and the chat ----------
  const bus = { mood: 'idle', moodUntil: 0, talkUntil: 0, chatOpen: false, poke: -1, shakeReq: false, thinking: false, chatKey: -9, chatInput: null, chatLog: null };
  // Wrong password: the text field shakes and gets a red ring; Zoltbot looks at it, shakes his head and goes sad.
  function wrongPassword() {
    if (input) { input.classList.add('zb-wrong'); input.classList.remove('zb-shake'); void input.offsetWidth; input.classList.add('zb-shake'); }
    bus.mood = 'sad'; bus.moodUntil = performance.now() / 1000 + 2.6; bus.shakeReq = true;
  }
  window.zbPasswordWrong = wrongPassword;
  if (input) input.addEventListener('input', () => input.classList.remove('zb-wrong'));
  if (failed) setTimeout(wrongPassword, 500);

  // ---------- Chat UI ----------
  let chat = null;
  if (CHAT) chat = buildChat();
  function buildChat() {
    const el = document.createElement('div');
    el.className = 'zb-chat zb-glass'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Chat with Zoltbot'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="zb-chat-head"><div><strong>Zoltbot</strong><span>Zolton’s sidekick robot</span></div><button class="zb-chat-x" type="button" aria-label="Close chat">×</button></div>' +
      '<div class="zb-chat-log" aria-live="polite"></div><div class="zb-chips"></div>' +
      '<form class="zb-chat-form"><label for="zb-chat-in" style="position:absolute;left:-9999px">Message Zoltbot</label><input id="zb-chat-in" type="text" autocomplete="off" placeholder="Ask Zoltbot…" maxlength="500"><button type="submit">Send</button></form>';
    if (hasSky) { el.classList.add('zb-on-sky'); el.setAttribute('data-zb-glass', ''); el.setAttribute('data-zb-radius', '28'); }
    document.body.appendChild(el);
    const log = el.querySelector('.zb-chat-log'), chips = el.querySelector('.zb-chips'), f = el.querySelector('form'), inp = el.querySelector('input');
    const history = [];
    let greeted = false;
    bus.chatInput = inp; bus.chatLog = log;
    inp.addEventListener('input', () => { bus.chatKey = performance.now() / 1000; });
    let typingEl = null;
    const showTyping = () => { if (typingEl) return; typingEl = document.createElement('div'); typingEl.className = 'zb-msg bot typing'; typingEl.setAttribute('aria-label', 'Zoltbot is typing'); typingEl.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(typingEl); log.scrollTop = log.scrollHeight; bus.thinking = true; };
    const hideTyping = () => { if (typingEl) { typingEl.remove(); typingEl = null; } bus.thinking = false; };
    const say = (text, who) => { if (who === 'bot') hideTyping(); const m = document.createElement('div'); m.className = 'zb-msg ' + who; m.textContent = text; log.appendChild(m); log.scrollTop = log.scrollHeight; if (who === 'bot') { history.push({ role: 'assistant', content: text }); bus.talkUntil = performance.now() / 1000 + Math.min(2.4, 0.4 + text.length * 0.03); } };
    const setChips = (list) => { chips.innerHTML = ''; list.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.className = 'zb-chip'; b.textContent = t; b.onclick = () => send(t); chips.appendChild(b); }); };
    function place() {
      if (innerWidth < 820) return;
      const r = card.getBoundingClientRect();
      el.style.left = Math.round(r.right + 40) + 'px';
      const top = Math.max(180, Math.round(r.top + 40));
      el.style.top = top + 'px';
      el.style.height = Math.max(300, Math.min(460, innerHeight - top - 16)) + 'px';
    }
    function open() {
      bus.chatOpen = true; place(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
      if (bubble) bubble.classList.remove('on');
      if (!greeted) { greeted = true; setTimeout(() => { say('Hi! I’m Zoltbot, Zolton’s sidekick robot. This part of the site is password-protected. I can tell you about Zolton’s work, or help you ask him for access.', 'bot'); setChips(['Request access', 'What’s behind the password?', 'Who is Zolton?']); }, 250); }
      setTimeout(() => inp.focus(), 320);
    }
    function close() { bus.chatOpen = false; el.classList.remove('open'); el.setAttribute('aria-hidden', 'true'); dock.focus(); }
    el.querySelector('.zb-chat-x').onclick = close;
    el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    addEventListener('resize', () => { if (bus.chatOpen) place(); });
    f.addEventListener('submit', e => { e.preventDefault(); const t = inp.value.trim(); if (t) { inp.value = ''; send(t); } });

    async function send(text) {
      say(text, 'me'); history.push({ role: 'user', content: text }); setChips([]);
      setTimeout(showTyping, 200);
      if (ENDPOINT) {
        try {
          const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history.slice(-20) }) });
          const j = await r.json(); say(j.reply || 'Hmm, my signal dropped. Try again?', 'bot');
          if (j.chips) setChips(j.chips);
        } catch (err) { say('Hmm, my signal dropped. Try again in a moment?', 'bot'); }
        hideTyping();
      } else {
        setTimeout(() => demoReply(text), 1100 + Math.min(900, text.length * 12));
      }
    }
    // Scripted preview of the flow in the Zoltbot Brief. Nothing is sent anywhere.
    const QS = ['What’s your name?', 'What company or team are you with?', 'What’s your role? For example, recruiter, hiring manager or designer.', 'Is this about a specific role or project? A job link is welcome.', 'What’s the best email to reach you?', 'Anything you’d like Zolton to show you first? (Optional, or say “skip”.)'];
    let step = -1; const answers = [];
    function demoReply(text) {
      const t = text.toLowerCase();
      if (step >= 0) {
        if (step === 4 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) { say('That email doesn’t look quite right. Mind checking it?', 'bot'); return; }
        answers[step] = text; step++;
        if (step < QS.length) { say(QS[step], 'bot'); return; }
        step = -1;
        say('Here’s what I’ll send Zolton:\n• ' + answers[0] + ', ' + answers[2] + ' at ' + answers[1] + '\n• About: ' + answers[3] + '\n• Email: ' + answers[4] + (answers[5] && !/^skip$/i.test(answers[5]) ? '\n• Wants to see: ' + answers[5] : '') + '\n\nSend it?', 'bot');
        setChips(['Yes, send it', 'Start over']); return;
      }
      if (/^yes, send it$/.test(t)) { bus.mood = 'happy'; bus.moodUntil = performance.now() / 1000 + 1.4; say('Done! I’ve sent that to Zolton. He’ll reply to the email you gave me.', 'bot'); say('Preview only: nothing was actually sent.', 'note'); setChips(['Who is Zolton?']); return; }
      if (/start over|request|access|password|let me in|get in/.test(t)) {
        if (/password/.test(t) && !/request|access/.test(t)) say('I don’t have the password, and that’s on purpose. But I can send Zolton a request right now.', 'bot');
        step = 0; answers.length = 0; setTimeout(() => say('Great, a few quick questions. ' + QS[0], 'bot'), /password/.test(t) ? 700 : 0); return;
      }
      if (/behind|case|work|project/.test(t)) { say('Case studies including Premiere Loader, ATM modernization, the icon system (“Drawing One Language Out of Many”) and the Gold piece.', 'bot'); setChips(['Request access', 'Who is Zolton?']); return; }
      if (/who|zolton|about|designer/.test(t)) { say('Zolton is a senior product designer with 8+ years of experience. He specializes in motion design, 3D for the web and design systems, and he prototypes in code with AI in his workflow.', 'bot'); setChips(['Request access', 'What’s behind the password?']); return; }
      say('Good question. I don’t know that one yet, but I can pass it to Zolton.', 'bot');
      say('In the live version I’ll answer with AI. For this preview, try the buttons.', 'note');
      setChips(['Request access', 'What’s behind the password?']);
    }
    return { open, close, el };
  }
  const toggleChat = () => { if (!chat) { bus.poke = 0; return; } bus.chatOpen ? chat.close() : chat.open(); };
  dock.addEventListener('click', toggleChat);
  dock.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); } });

  // ---------- 3D Zoltbot ----------
  function boot() {
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    dock.insertBefore(renderer.domElement, dock.firstChild);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    camera.position.set(0, 0.1, 2.15); camera.lookAt(0, 0.04, 0);
    {
      const envScene = new THREE.Scene();
      envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
        fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0. ? mix(vec3(.85,.94,.99), vec3(.12,.45,.82), pow(h,.6)) : vec3(.95,.9,.82); c += vec3(1.) * pow(max(dot(vP, normalize(vec3(-.4,.6,.7))),0.), 40.) * 3.; gl_FragColor = vec4(c,1.); }' })));
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;
    }
    scene.add(new THREE.HemisphereLight(0xdff2ff, 0xe8d2b8, 0.7));
    const key = new THREE.DirectionalLight(0xfff4ea, 1.4); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fe6ff, 1.3); rim.position.set(3, 2, -4); scene.add(rim);

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    function limb(a, b, r, mat) {
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
      return m;
    }
    const shellMat = new THREE.MeshPhysicalMaterial({ color: '#F5F8FA', roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
    const capMat = new THREE.MeshPhysicalMaterial({ color: '#1E8FE8', roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 });
    const metalDark = new THREE.MeshStandardMaterial({ color: '#56616B', metalness: 1, roughness: 0.35 });
    const ringMat = new THREE.MeshStandardMaterial({ color: '#00D0F0', emissive: '#00BEFF', emissiveIntensity: 1.2, roughness: 0.3 });

    const bot = new THREE.Group(); scene.add(bot);
    const head = new THREE.Group(); bot.add(head);
    const S = V(1, 0.92, 0.95);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 64, 40), shellMat); shell.scale.copy(S); head.add(shell);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.304, 64, 20, 0, Math.PI * 2, 0, Math.PI * 0.3), capMat); cap.scale.copy(S); cap.rotation.x = -0.18; head.add(cap);

    // LED face: a 2D canvas drawn every frame, glowing through a dot-matrix mask, mapped on the visor
    const FW = 512, FH = 320;
    const face = document.createElement('canvas'); face.width = FW; face.height = FH;
    const fctx = face.getContext('2d');
    const src = document.createElement('canvas'); src.width = FW; src.height = FH; const sctx = src.getContext('2d');
    const led = document.createElement('canvas'); led.width = FW; led.height = FH; const lctx = led.getContext('2d');
    const dots = document.createElement('canvas'); dots.width = FW; dots.height = FH;
    { const d = dots.getContext('2d'); d.fillStyle = '#fff'; for (let y = 4; y < FH; y += 8) for (let x = 4; x < FW; x += 8) { d.beginPath(); d.arc(x, y, 3.1, 0, Math.PI * 2); d.fill(); } }
    const faceTex = new THREE.CanvasTexture(face); faceTex.colorSpace = THREE.SRGBColorSpace;
    const VW = 1.95, VH = 1.25;
    const visor = new THREE.Mesh(new THREE.SphereGeometry(0.306, 64, 40, Math.PI / 2 - VW / 2, VW, Math.PI / 2 - VH / 2 + 0.06, VH),
      new THREE.MeshPhysicalMaterial({ color: '#06131D', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.03, emissive: '#ffffff', emissiveMap: faceTex, emissiveIntensity: 1.5 }));
    visor.scale.copy(S); head.add(visor);
    // Ear pods with glowing rings, small rotors above
    const rotors = [], pods = [];
    [-1, 1].forEach(s => {
      const pod = new THREE.Group(); pod.position.set(s * 0.285, -0.01, 0); head.add(pod); pods.push(pod);
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 40), shellMat); can.rotation.z = Math.PI / 2; pod.add(can);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.068, 40), capMat); disc.position.x = s * 0.036; disc.rotation.y = s * Math.PI / 2; pod.add(disc);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.011, 12, 48), ringMat); ring.position.x = s * 0.04; ring.rotation.y = Math.PI / 2; pod.add(ring);
      pod.add(limb(V(0, 0.07, 0), V(s * 0.03, 0.2, 0), 0.016, metalDark));
      const rotor = new THREE.Group(); rotor.position.set(s * 0.03, 0.215, 0); pod.add(rotor);
      const bladeMat = new THREE.MeshStandardMaterial({ color: '#BFF6FF', transparent: true, opacity: 0.55, roughness: 0.3 });
      [0, Math.PI].forEach(a => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.007, 0.042), bladeMat); b.position.x = Math.cos(a) * 0.1; b.position.z = Math.sin(a) * 0.1; rotor.add(b); });
      rotors.push(rotor);
    });
    // Hands for covering his eyes
    const hands = [-1, 1].map(s => { const h = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 16), shellMat); h.scale.set(1.15, 0.85, 0.6); bot.add(h); return { h, s }; });

    // ---------- Expressions ----------
    const MOODS = {
      idle:    { open: 1.0, squint: 0, closed: 0, sad: 0, pupil: 1.0, mouth: 0.55, mouthOpen: 0 },
      curious: { open: 1.12, squint: 0, closed: 0, sad: 0, pupil: 1.18, mouth: 0.15, mouthOpen: 0.25 },
      shy:     { open: 1.0, squint: 0, closed: 1, sad: 0, pupil: 1.0, mouth: 0.45, mouthOpen: 0 },
      happy:   { open: 1.0, squint: 1, closed: 0, sad: 0, pupil: 1.0, mouth: 1.0, mouthOpen: 0.7 },
      sad:     { open: 0.82, squint: 0, closed: 0, sad: 1, pupil: 0.9, mouth: -0.75, mouthOpen: 0 },
      attentive: { open: 1.16, squint: 0, closed: 0, sad: 0, pupil: 1.22, mouth: 0.35, mouthOpen: 0 },
      think:   { open: 0.94, squint: 0, closed: 0, sad: 0, pupil: 0.92, mouth: 0, mouthOpen: 0 },
      talk:    { open: 1.02, squint: 0, closed: 0, sad: 0, pupil: 1.05, mouth: 0.75, mouthOpen: 0 },
      listen:  { open: 1.06, squint: 0, closed: 0, sad: 0, pupil: 1.08, mouth: 0.45, mouthOpen: 0 }
    };
    const F = Object.assign({}, MOODS[bus.mood]);
    const col = { r: 95, g: 244, b: 255 };
    function drawFace(px, py, blink, talk, think, t) {
      const W = FW, H = FH, cx = W / 2;
      sctx.clearRect(0, 0, W, H);
      const c = `rgb(${col.r|0},${col.g|0},${col.b|0})`;
      sctx.strokeStyle = c; sctx.fillStyle = c; sctx.lineCap = 'round'; sctx.lineJoin = 'round';
      [-1, 1].forEach(s => {
        const ex = cx + s * 112, ey = 140, R = 70, ry = R * F.open * blink;
        if (F.closed > 0.5) {
          sctx.lineWidth = 20; sctx.beginPath(); sctx.arc(ex, ey - 22, 56, Math.PI * 0.18, Math.PI * 0.82); sctx.stroke();
          return;
        }
        if (F.squint > 0.5 || blink < 0.12) {
          // closed, happy ^ ^ arcs (or a blink line)
          sctx.lineWidth = 22; sctx.beginPath();
          if (F.squint > 0.5) sctx.arc(ex, ey + 34, 58, Math.PI * 1.16, Math.PI * 1.84);
          else { sctx.moveTo(ex - 54, ey + 6); sctx.lineTo(ex + 54, ey + 6); }
          sctx.stroke();
          return;
        }
        sctx.save();
        sctx.beginPath(); sctx.ellipse(ex, ey, R, ry, 0, 0, Math.PI * 2); sctx.clip();
        const gr = sctx.createRadialGradient(ex, ey, 10, ex, ey, R);
        gr.addColorStop(0, `rgba(${col.r|0},${col.g|0},${col.b|0},.25)`); gr.addColorStop(1, `rgba(${col.r|0},${col.g|0},${col.b|0},.75)`);
        sctx.fillStyle = gr; sctx.fillRect(ex - R, ey - R, R * 2, R * 2);
        // pupil (dark = no glow) with catch-lights
        const pr = 34 * F.pupil, ppx = ex + px * 26, ppy = ey + py * 20;
        sctx.globalCompositeOperation = 'destination-out';
        sctx.beginPath(); sctx.arc(ppx, ppy, pr, 0, Math.PI * 2); sctx.fill();
        sctx.globalCompositeOperation = 'source-over';
        sctx.fillStyle = '#fff';
        sctx.beginPath(); sctx.arc(ppx - pr * 0.38, ppy - pr * 0.38, pr * 0.34, 0, Math.PI * 2); sctx.fill();
        sctx.beginPath(); sctx.arc(ppx + pr * 0.32, ppy + pr * 0.34, pr * 0.16, 0, Math.PI * 2); sctx.fill();
        // sad lids: slant down toward the outer corners
        if (F.sad > 0.02) {
          sctx.globalCompositeOperation = 'destination-out';
          const lift = 62 * F.sad;
          sctx.beginPath(); sctx.moveTo(ex - s * R - 4, ey - ry - 4); sctx.lineTo(ex - s * R - 4, ey - ry * 0.2 + lift * 0.1); sctx.lineTo(ex + s * R + 4, ey - ry + lift * 1.4); sctx.lineTo(ex + s * R + 4, ey - ry - 4); sctx.closePath(); sctx.fill();
          sctx.globalCompositeOperation = 'source-over';
        }
        sctx.restore();
        sctx.strokeStyle = c; sctx.lineWidth = 12; sctx.beginPath(); sctx.ellipse(ex, ey, R, ry, 0, 0, Math.PI * 2); sctx.stroke();
      });
      // mouth
      const my = 262, mo = Math.max(F.mouthOpen, talk);
      sctx.strokeStyle = c; sctx.fillStyle = c;
      if (think) {
        for (let i = 0; i < 3; i++) { const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 0.9)); sctx.globalAlpha = a; sctx.beginPath(); sctx.arc(cx + (i - 1) * 34, my + 2 - 6 * a, 11, 0, Math.PI * 2); sctx.fill(); }
        sctx.globalAlpha = 1;
      } else if (mo > 0.12) {
        sctx.beginPath(); sctx.ellipse(cx, my + 4, 26 + 8 * F.mouth, 6 + 22 * mo, 0, 0, Math.PI * 2); sctx.fill();
      } else {
        sctx.lineWidth = 12; sctx.beginPath(); sctx.moveTo(cx - 38, my); sctx.quadraticCurveTo(cx, my + 34 * F.mouth, cx + 38, my); sctx.stroke();
      }
      // compose: soft glow underlay + crisp LED dots
      fctx.globalCompositeOperation = 'source-over'; fctx.fillStyle = '#000'; fctx.fillRect(0, 0, W, H);
      fctx.globalAlpha = 0.35; fctx.filter = 'blur(10px)'; fctx.drawImage(src, 0, 0); fctx.filter = 'none'; fctx.globalAlpha = 1;
      lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, W, H); lctx.drawImage(dots, 0, 0);
      lctx.globalCompositeOperation = 'source-in'; lctx.drawImage(src, 0, 0);
      fctx.drawImage(led, 0, 0);
      faceTex.needsUpdate = true;
    }

    // ---------- Input wiring ----------
    const look = new THREE.Vector2(), lookT = new THREE.Vector2();
    let focused = false, typing = 0, hop = -1, shake = -1;
    const towards = (el) => { const a = dock.getBoundingClientRect(), b = el.getBoundingClientRect(); return new THREE.Vector2(Math.max(-1, Math.min(1, ((b.left + b.width * 0.45) - (a.left + a.width / 2)) / (innerWidth / 2.2))), Math.max(-1, Math.min(1, -((b.top + b.height / 2) - (a.top + a.height / 2)) / (innerHeight / 2.2)))); };
    // wrong password: look at the field, shake the head while the field shakes

    addEventListener('pointermove', e => {
      const r = dock.getBoundingClientRect();
      lookT.set(Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2.2))), Math.max(-1, Math.min(1, -(e.clientY - (r.top + r.height / 2)) / (innerHeight / 2.2))));
    });
    if (input) {
      input.addEventListener('focus', () => { focused = true; });
      input.addEventListener('blur', () => { focused = false; typing = 0; });
      input.addEventListener('input', () => { typing = 1.6; });
    }
    if (!DEMO) form.addEventListener('submit', () => { hop = 0; typing = 0; bus.mood = 'happy'; bus.moodUntil = performance.now() / 1000 + 1.2; });
    dock.addEventListener('pointerenter', () => { if (!bus.chatOpen) { bus.mood = 'curious'; bus.moodUntil = performance.now() / 1000 + 0.9; } });

    function resize() { const s = dock.clientWidth || 230; renderer.setSize(s, s, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    resize(); addEventListener('resize', resize); new ResizeObserver(resize).observe(dock);

    const clock = new THREE.Clock();
    const ease = x => x * x * (3 - 2 * x);
    let cover = 0, nextBlink = 2.5, blinkT = -1;
    const target = { r: 95, g: 244, b: 255 };
    function frame() {
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime, now = performance.now() / 1000, m = reduce ? 0.3 : 1;
      typing = Math.max(0, typing - dt);
      // decide mood
      let mood = 'idle';
      if (now < bus.moodUntil) mood = bus.mood;
      else if (typing > 0) mood = 'shy';
      else if (focused) mood = 'curious';
      else if (bus.chatOpen && bus.thinking) mood = 'think';
      else if (bus.chatOpen && now < bus.talkUntil) mood = 'talk';
      else if (bus.chatOpen && now - bus.chatKey < 1.3) mood = 'attentive';
      else if (bus.chatOpen) mood = 'listen';
      const T = MOODS[mood], k = 1 - Math.pow(0.0005, dt);
      for (const p in T) F[p] += (T[p] - F[p]) * k;
      const sadCol = mood === 'sad';
      target.r = sadCol ? 255 : 95; target.g = sadCol ? 176 : 244; target.b = sadCol ? 139 : 255;
      col.r += (target.r - col.r) * k; col.g += (target.g - col.g) * k; col.b += (target.b - col.b) * k;

      // where to look: cursor, the password field when focused, the chat panel when open
      let tgt = lookT;
      if (input && (focused || shake >= 0 || mood === 'sad')) tgt = towards(input);
      else if (mood === 'attentive' && bus.chatInput) tgt = towards(bus.chatInput);
      else if (mood === 'think') tgt = new THREE.Vector2(-0.45 + Math.sin(t * 0.9) * 0.15, 0.55);
      else if (mood === 'talk' && bus.chatLog) tgt = towards(bus.chatLog).multiplyScalar(0.5);
      look.lerp(tgt, 1 - Math.pow(0.004, dt));

      // blink
      let blink = 1;
      if (t > nextBlink && blinkT < 0) blinkT = 0;
      if (blinkT >= 0) { blinkT += dt; blink = blinkT < 0.08 ? 1 - blinkT / 0.08 : Math.min(1, (blinkT - 0.08) / 0.1); if (blinkT > 0.18) { blinkT = -1; nextBlink = t + 2.5 + Math.random() * 3.5; } }
      const talk = now < bus.talkUntil ? (0.35 + 0.35 * Math.abs(Math.sin(t * 14))) : 0;
      drawFace(Math.max(-1, Math.min(1, look.x * 1.3)), Math.max(-1, Math.min(1, -look.y * 1.3)), Math.max(0.05, blink), talk, mood === 'think', t);

      cover += ((mood === 'shy' ? 1 : 0) - cover) * (1 - Math.pow(0.0008, dt));
      const c = ease(Math.min(1, cover));
      bot.position.y = Math.sin(t * 2.2) * 0.04 * m;
      head.rotation.y = look.x * 0.5 * (1 - c * 0.6);
      head.rotation.x = -look.y * 0.3 + c * 0.22;
      head.rotation.z = Math.sin(t * 1.7) * 0.05 * m;
      if (bus.shakeReq) { bus.shakeReq = false; shake = 0; }
      if (shake >= 0) { shake += dt; head.rotation.y += Math.sin(shake * 26) * 0.32 * Math.max(0, 1 - shake / 1.0); if (shake > 1.0) shake = -1; }
      if (hop >= 0) { hop += dt; const h = Math.min(1, hop / 0.55); bot.position.y += Math.sin(h * Math.PI) * 0.22; head.rotation.y += ease(h) * Math.PI * 2; if (hop > 0.55) hop = -1; }
      if (bus.poke >= 0) { bus.poke += dt; bot.position.y += Math.sin(Math.min(1, bus.poke / 0.4) * Math.PI) * 0.08; if (bus.poke > 0.4) bus.poke = -1; }
      hands.forEach(({ h }) => { h.visible = false; });
      head.rotation.y += c * 0.35; head.rotation.x -= c * 0.32;   // eyes shut, chin up, politely looking away
      rotors.forEach((r, i) => r.rotation.y += dt * (i ? -38 : 38));
      const sinceKey = now - bus.chatKey;
      if (mood === 'attentive') head.rotation.x += 0.14 * Math.exp(-sinceKey * 7) * Math.sin(sinceKey * 18 + 1.6) + 0.05;
      if (mood === 'talk') { head.rotation.x += 0.1 + Math.sin(t * 9) * 0.05 * m; head.rotation.z += Math.sin(t * 4.5) * 0.05 * m; }
      if (mood === 'think') head.rotation.z += 0.16;
      ringMat.emissiveIntensity = 0.9 + 0.4 * Math.sin(t * 3) + 2.2 * Math.exp(-sinceKey * 5) + (mood === 'think' ? 0.8 * Math.abs(Math.sin(t * 5)) : 0);
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
    s.onerror = () => { dock.remove(); if (img) img.style.display = ''; };
    document.head.appendChild(s);
  }
})();
