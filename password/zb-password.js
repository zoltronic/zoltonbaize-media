/* zb-password — Zoltbot and a cloud sky for the zoltonbaize.com password page.
   - Puts the form on a liquid-glass card (uses the site's <zb-sky> glass when present, CSS glass otherwise).
   - Zoltbot floats outside the card: a 3D drone with an LED visor face that changes expression
     (idle, curious on focus, eyes shut while you type, grin on submit, sad after a wrong password, talking).
   - Optional chat: Zoltbot follows a scripted tree (about Zolton, what's behind the password, request access).
     Set window.ZB_CHAT_ENDPOINT to the Zoltbot function (zoltbot/netlify/functions/zoltbot.mjs) to go live:
       POST {type:'request', request:{...}} delivers an access request to Zolton,
       POST {type:'chat', messages:[...]} asks the model, only when a visitor goes off the tree -> {reply, chips}.
     window.ZB_CHAT_DEMO = true runs the same tree as a preview that sends nothing. With neither, no chat UI is shown.
   Contact mode: on a page with no password form, put data-zb-bot on any element (the "Get in touch" panel) and Zoltbot
   docks on its corner instead, with the same tree pointed at sending Zolton a message (POST {type:'request', request:{kind:'contact',...}}).
   Loads three.js 0.152.2 from jsDelivr (shared with the About sky). */
(function () {
  'use strict';
  if (window.__zbPassword) return; window.__zbPassword = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const host = document.querySelector('[data-zb-bot]');
  const CONTACT = !!host;
  // Late mode (Work page): Zoltbot waits below the screen, in the clouds, and only rushes up once someone has stayed at the
  // footer for a while ("sorry I'm late!"). Turn on with data-zb-bot-late on the host; the wait is window.ZB_BOT_LATE ms (default 5000).
  const LATE = CONTACT && host.hasAttribute('data-zb-bot-late');
  const form = CONTACT ? null : (document.querySelector('form[action*="wf_auth"]') || document.querySelector('.utility-page-form'));
  if (!form && !host) return;
  const wrap = CONTACT ? document.body : (form.closest('.utility-page-wrap') || document.body);
  const card = CONTACT ? host : (form.closest('.utility-page-content') || form);
  const input = CONTACT ? null : form.querySelector('input[type="password"]');
  const failEl = CONTACT ? null : document.querySelector('.w-form-fail');
  const failed = !!(failEl && getComputedStyle(failEl).display !== 'none');
  const ENDPOINT = window.ZB_CHAT_ENDPOINT || null;
  const DEMO = !ENDPOINT && (!!window.ZB_CHAT_DEMO || CONTACT);   // contact mode always talks; without an endpoint it's a preview
  const CHAT = !!(ENDPOINT || DEMO);
  const hasSky = !CONTACT && !!(window.customElements && customElements.get('zb-sky'));
  // Touch devices: the sky draws its glass in WebGL a beat behind native scrolling, so the card's glass would trail its text.
  // There the card and chat use CSS glass instead, which is part of the element and scrolls with it.
  const touch = matchMedia('(pointer: coarse)').matches;
  const skyGlass = hasSky && !touch;
  // Nav icons: the password page doesn't load the icon font the other pages use; load it if it's missing.
  if (!document.querySelector('link[href*="phosphor"], script[src*="phosphor"]')) {
    ['regular', 'fill'].forEach(w => { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://unpkg.com/@phosphor-icons/web@2.1.1/src/' + w + '/style.css'; document.head.appendChild(l); });
  }

  // ---------- Which page is protected ----------
  // Webflow serves this page at the protected URL and puts that path in a hidden "path" field.
  const NAMES = { '/gold': 'Gold', '/iconography': 'Icons', '/icons': 'Icons', '/atm': 'ATM' };
  const pathEl = form && form.querySelector('input[name="path"]');
  const protPath = ((window.ZB_PROTECTED_PATH || (pathEl && pathEl.value) || location.pathname) + '').replace(/\/+$/, '') || '/';
  const PAGE = CONTACT ? '' : window.ZB_PROTECTED_NAME || NAMES[protPath.toLowerCase()] ||
    (protPath === '/' || protPath === '/401' ? '' : protPath.split('/').pop().replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  if (!CONTACT) {
    const h = card.querySelector('h1, h2, h3');
    // Site type: mono eyebrow + display title (Schibsted Grotesk 900), per the Portfolio 2.0 guidelines
    if (h) {
      h.classList.add('zb-pw-title'); h.textContent = PAGE || 'Protected page';
      const eb = document.createElement('div'); eb.className = 'zb-pw-eyebrow'; eb.textContent = PAGE ? 'Protected page' : 'zoltonbaize.com';
      h.parentNode.insertBefore(eb, h);
      const help = document.createElement('p'); help.className = 'zb-pw-help';
      help.textContent = PAGE ? 'Enter the password Zolton shared with you to view this case study.' : 'Enter the password Zolton shared with you.';
      h.after(help);
    }
    if (PAGE) document.title = PAGE + ' is a protected page';
  }
  // Passwords are all lowercase: lowercase what's typed (Caps Lock and phone auto-capitals can't break it).
  if (input) {
    input.setAttribute('autocapitalize', 'none'); input.setAttribute('autocorrect', 'off'); input.spellcheck = false;
    input.addEventListener('input', () => { const v = input.value, l = v.toLowerCase(); if (v !== l) { const a = input.selectionStart, b = input.selectionEnd; input.value = l; try { input.setSelectionRange(a, b); } catch (e) {} } });
  }

  // ---------- Styles ----------
  const css = document.createElement('style');
  css.textContent = `
  :root { --zb-ease: cubic-bezier(.2,.8,.2,1); --zb-ink: #07283D; --zb-muted: #2A5570; }
  .zb-pw-raise { position: relative; z-index: 1; }
  .zb-pw-card.zb-glass:not(.zb-on-sky) { border-radius: 38px; background: var(--_zb-mode---mode--glass-bg, rgba(255,255,255,.62)); border: 1px solid var(--_zb-mode---mode--glass-border, rgba(255,255,255,.9)); box-shadow: 0 22px 50px -26px rgba(8,60,95,.45), inset 0 0 2px 1px rgba(255,255,255,.35), inset 0 0 10px 4px rgba(255,255,255,.15); backdrop-filter: blur(22px) saturate(160%); -webkit-backdrop-filter: blur(22px) saturate(160%); }
  .zb-glass { position: relative; border-radius: 28px; overflow: visible;
    background: linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.04) 55%, rgba(255,255,255,.12));
    border: 1px solid rgba(255,255,255,.62);
    box-shadow: inset 0 1.5px 0 rgba(255,255,255,.95), inset 0 -1px 0 rgba(255,255,255,.3), inset 0 0 24px rgba(255,255,255,.18), 0 30px 60px -30px rgba(4,34,58,.5);
    backdrop-filter: blur(9px) saturate(130%); -webkit-backdrop-filter: blur(9px) saturate(130%); }
  .zb-glass.zb-on-sky { background: transparent; border-color: transparent; box-shadow: none; backdrop-filter: none; -webkit-backdrop-filter: none; }
  .zb-pw-card { padding: 32px 28px; }
  /* Card content in the site's own styles (field, field_label, btn btn--primary, label-mono, type is--h1) */
  .zb-pw-page .zb-pw-card { width: min(340px, calc(100vw - 32px)); max-width: none; box-sizing: border-box; padding: clamp(26px,4vw,40px); text-align: left; font-family: 'Schibsted Grotesk', system-ui, sans-serif; color: var(--_zb-mode---mode--ink, #07283D); }
  .zb-pw-card form { display: flex; flex-direction: column; align-items: stretch; gap: 0; }
  .zb-pw-eyebrow { margin: 0 0 10px; font: 400 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .18em; text-transform: uppercase; color: var(--_zb-mode---mode--accent, #0A5C86); }
  .zb-pw-help { margin: 0 0 24px; max-width: 30ch; font: 400 15px/1.5 'Schibsted Grotesk', system-ui, sans-serif; color: var(--_zb-mode---mode--muted, #2A5570); text-wrap: pretty; }
  .zb-pw-card .zb-pw-title { margin: 0 0 12px; font: 900 clamp(38px, 5vw, 48px)/.98 'Schibsted Grotesk', system-ui, sans-serif; letter-spacing: -.035em; color: var(--_zb-mode---mode--ink, #07283D); text-wrap: balance; }
  .zb-pw-card label { display: block; margin: 0 0 8px; font: 400 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--_zb-mode---mode--muted, #2A5570); }
  .zb-pw-card input[type="password"] { box-sizing: border-box; width: 100%; min-height: 48px; margin: 0 0 14px; padding: 0 14px; border: 1px solid var(--_zb-mode---mode--glass-border, rgba(255,255,255,.9)); border-radius: 16px; background: var(--_zb-mode---mode--field-bg, rgba(255,255,255,.78)); font: 400 15px 'Schibsted Grotesk', system-ui, sans-serif; color: var(--_zb-mode---mode--ink, #07283D); box-shadow: none; outline: none; transition: box-shadow 220ms cubic-bezier(.2,0,0,1), border-color 220ms cubic-bezier(.2,0,0,1); }
  .zb-pw-card input[type="password"]::placeholder { color: var(--_zb-mode---mode--muted, #2A5570); opacity: .7; }
  .zb-pw-card input[type="password"]:focus-visible { border-color: var(--_zb-mode---mode--accent, #0A5C86); box-shadow: 0 0 0 3px var(--_zb-mode---mode--ghost-wash, rgba(1,151,128,.12)); }
  .zb-pw-card input[type="submit"], .zb-pw-card button[type="submit"] { -webkit-appearance: none; appearance: none; width: 100%; min-height: 48px; margin: 0; padding: 0 22px; border: 0; border-radius: 18px; background: var(--_zb-mode---mode--btn-primary-bg, #06222F); color: var(--_zb-mode---mode--btn-primary-ink, #EAFBF6); font: 700 15px 'Schibsted Grotesk', system-ui, sans-serif; cursor: pointer; transition: background-color 220ms cubic-bezier(.2,0,0,1), transform 220ms cubic-bezier(.2,0,0,1); }
  .zb-pw-card input[type="submit"]:active { transform: scale(.98); }
  .zb-pw-card input[type="submit"]:focus-visible { outline: 2px solid var(--_zb-mode---mode--accent, #0A5C86); outline-offset: 3px; }
  .zb-pw-card .w-form-fail { margin: 14px 0 0; padding: 12px 14px; border-radius: 16px; background: var(--_zb-mode---mode--danger-ink, #FFF4F2); color: var(--_zb-mode---mode--danger-bg, #A32718); font: 400 14px/1.4 'Schibsted Grotesk', system-ui, sans-serif; text-align: left; }
  /* Night: the site's dark-mode tokens (same values as the Webflow mode variables) */
  :root.zb-night, .zb-night body { --_zb-mode---mode--ink: #EAF6FD; --_zb-mode---mode--muted: #B3D3E5; --_zb-mode---mode--accent: #5FDBFF; --_zb-mode---mode--live: #00E0B8; --_zb-mode---mode--glass-bg: rgba(10,28,48,.58); --_zb-mode---mode--glass-border: rgba(160,220,250,.22); --_zb-mode---mode--hair: rgba(160,220,250,.16); --_zb-mode---mode--btn-primary-bg: #00E0B8; --_zb-mode---mode--btn-primary-ink: #03231D; --_zb-mode---mode--btn-secondary-bg: rgba(160,205,240,.13); --_zb-mode---mode--ghost-wash: rgba(0,224,184,.14); --_zb-mode---mode--danger-bg: #FF8474; --_zb-mode---mode--danger-ink: #2B0904; --_zb-mode---mode--liquid-bg: rgba(10,28,48,.42); --_zb-mode---mode--mark: #EAF6FD; --_zb-mode---mode--field-bg: rgba(3,15,26,.5); --_zb-mode---mode--btn-secondary-border: rgba(180,220,248,.26); }
  .zb-pw-dock.zb-waiting { pointer-events: none; }
  .zb-puff { position: fixed; z-index: 5; width: 260px; height: 160px; margin: -80px 0 0 -130px; border-radius: 50%; pointer-events: none; background: radial-gradient(closest-side, rgba(255,255,255,.95), rgba(255,255,255,.6) 45%, rgba(255,255,255,0)); opacity: 0; transform: scale(.4); }
  .zb-night .zb-puff { background: radial-gradient(closest-side, rgba(150,175,210,.7), rgba(120,145,185,.35) 45%, rgba(120,145,185,0)); }
  .zb-puff.go { animation: zb-puff 1.4s cubic-bezier(.2,.8,.2,1) forwards; }
  @keyframes zb-puff { 0% { opacity: 0; transform: scale(.4); } 18% { opacity: 1; } 100% { opacity: 0; transform: scale(1.9) translateY(-30px); } }
  .zb-pw-dock { position: fixed; left: 0; top: 0; width: 320px; height: 320px; z-index: 6; cursor: pointer; border-radius: 50%; will-change: transform; -webkit-tap-highlight-color: transparent; }
  .zb-pw-dock:focus-visible { outline: 2px solid #0A5C86; outline-offset: -20px; }
  /* The 3D canvas overhangs the dock on every side so banking rotors, the flame and the exhaust are never cropped */
  .zb-pw-dock canvas { position: absolute; left: -35%; top: -30%; width: 170%; height: 170%; display: block; pointer-events: none; }
  .zb-pw-bubble { position: absolute; left: 76%; top: 26%; white-space: nowrap; padding: 9px 14px; border-radius: 18px 18px 18px 6px; font: 600 13px system-ui, -apple-system, sans-serif; color: var(--zb-ink);
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
  .zb-right { box-shadow: 0 0 0 3px var(--_zb-mode---mode--ghost-wash, rgba(1,151,128,.12)) !important; border-color: var(--_zb-mode---mode--live, #017465) !important; }
  .zb-wrong { box-shadow: 0 0 0 3px rgba(163,39,24,.16) !important; border-color: var(--_zb-mode---mode--danger-bg, #A32718) !important; }
  @media (prefers-reduced-motion: reduce) { .zb-shake { animation: none; } }
  .zb-pw-sky { position: fixed; inset: 0; z-index: 0; pointer-events: none; background: linear-gradient(178deg,#1E7FC4 0%,#7FD0F0 46%,#CFEBF9 74%,#F6E9D2 100%); }
  /* Site nav and footer on the password page: nav stays fixed at the top (thumb bar at the bottom on phones), footer pins to the bottom */
  @media (min-width: 768px) { .zb-pw-page .utility-page-wrap { box-sizing: border-box; height: auto; min-height: 100vh; max-height: none; padding-top: 108px; padding-bottom: 64px; } }   /* card never slides under the nav or footer */
  .zb-pw-page .page_footer { position: fixed; left: clamp(20px,4vw,48px); right: clamp(20px,4vw,48px); bottom: 18px; margin: 0; padding-top: 14px; z-index: 2; }
  @media (max-width: 767px) {
    .zb-pw-page .page_footer { bottom: 96px; justify-content: center; text-align: center; }
    .zb-has-thumb .zb-chat { bottom: 92px !important; height: min(52vh, 420px) !important; }
    .zb-pw-page.zb-has-thumb .zb-chat.zb-peek { bottom: 12px !important; height: auto !important; z-index: 22; }   /* short help card sits over the thumb nav so the password field stays clear */
  }
  /* Keyboard open on a phone: the card slides up so the field and Submit sit just above the keyboard; nav, toggle and bubble step aside */
  .zb-pw-card { transition: transform 260ms var(--zb-ease); }
  .zb-kb .nav_thumb, .zb-kb .theme_toggle, .zb-kb .zb-pw-bubble, .zb-kb .page_footer { opacity: 0 !important; pointer-events: none !important; transition: opacity 160ms; }
  .zb-kb .zb-pw-help, .zb-kb .zb-pw-eyebrow, .zb-kb .pw_help, .zb-kb .pw_eyebrow { display: none !important; }   /* compact card so Zoltbot fits above it */
  .zb-kb .zb-pw-card { padding-top: 22px; padding-bottom: 22px; }
  .zb-kb .zb-pw-dock { width: 190px !important; height: 190px !important; }   /* smaller Zoltbot so he fits above the keyboard too */
  .zb-kb .zb-pw-card .zb-pw-title { font-size: 30px; margin-bottom: 14px; }
  .zb-pw-sky canvas { position: absolute; inset: 0; width: 100%; height: 100%; transition: opacity 420ms; }
  .zb-pw-sky { transition: background 420ms; }
  /* Night (dark mode): deep sky, smoky glass, light ink */
  .zb-night { --zb-ink: #EAF6FD; --zb-muted: #9CC3DC; }
  .zb-night .zb-pw-sky { background: linear-gradient(178deg,#040D1C 0%,#0B2340 44%,#13375C 76%,#1E4E72 100%); }
  .zb-night .zb-pw-sky canvas { opacity: .09; }
  .zb-night .zb-glass:not(.zb-on-sky):not(.zb-pw-card) { background: linear-gradient(135deg, rgba(148,196,232,.16), rgba(148,196,232,.04) 55%, rgba(148,196,232,.1)); border-color: rgba(180,220,248,.3); box-shadow: inset 0 1.5px 0 rgba(215,238,255,.32), 0 30px 60px -30px rgba(0,0,0,.7); }
  .zb-night .zb-chat { background: rgba(10,30,50,.62); }
  .zb-night .zb-msg.bot, .zb-night .zb-chip, .zb-night .zb-chat-x, .zb-night .zb-chat-form input { background: rgba(255,255,255,.1); border-color: rgba(180,220,248,.22); color: var(--zb-ink); }
  .zb-night .zb-chat-head, .zb-night .zb-chat-form { border-color: rgba(180,220,248,.16); }
  .zb-night .zb-msg.me, .zb-night .zb-chat-form button { background: #EAF6FD; color: #07283D; }
  @media (max-width: 819px) {
    .zb-pw-card { margin-top: 176px; }
    .zb-pw-page .utility-page-wrap { box-sizing: border-box; height: auto; min-height: 100vh; min-height: 100svh; max-height: none; padding-bottom: 104px; }   /* keep the card clear of the bottom thumb nav */
    .zb-pw-help { margin-bottom: 18px; }
    .zb-pw-dock { width: 260px; height: 260px; }
    .zb-pw-bubble { left: 60%; top: -6px; width: 128px; white-space: normal; line-height: 1.3; }
    .zb-chat.zb-peek { height: auto !important; }
    .zb-chat.zb-peek .zb-chat-form, .zb-chat.zb-peek .zb-chat-head span { display: none; }
    .zb-chat.zb-peek .zb-chat-log { flex: none; }
    .zb-chat { left: 12px !important; right: 12px; bottom: 12px; top: auto !important; width: auto; height: min(60vh, 480px) !important; background: rgba(238,247,253,.88); }
    .zb-night .zb-chat { background: rgba(10,30,50,.9); }
  }`;
  document.head.appendChild(css);

  // ---------- Sky, glass card ----------
  if (!CONTACT) {
    wrap.classList.add('zb-pw-raise');
    card.classList.add('zb-glass', 'zb-pw-card');
    document.documentElement.classList.add('zb-pw-page');
  }
  if (document.querySelector('.nav_thumb')) document.documentElement.classList.add('zb-has-thumb');
  // Dark mode: follows the site's night sky (zb-sky[night]) or a dark theme class, else the system setting.
  let forcedNight = null, ownSky = null;
  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  function isNight() {
    if (forcedNight !== null) return forcedNight;
    const de = document.documentElement, other = [...document.querySelectorAll('zb-sky')].find(x => x !== ownSky);
    if (other && other.hasAttribute('night')) return !/^(0|false)$/.test(other.getAttribute('night'));
    if (de.getAttribute('data-mode')) return de.getAttribute('data-mode') === 'dark';   // zb-theme.js, the site-wide setting
    if (de.classList.contains('dark') || de.dataset.theme === 'dark' || document.body.classList.contains('dark')) return true;
    try { const t = localStorage.getItem('zb-home-mode') || localStorage.getItem('zbTheme'); if (t) return t === 'dark'; } catch (e) {}
    return false;   // the site is a day sky by default; night only when the visitor picks it with the toggle
  }
  function applyNight() {
    const n = isNight(); document.documentElement.classList.toggle('zb-night', n);
    if (ownSky) ownSky.setAttribute('night', n ? '1' : '0');
  }
  window.zbPasswordNight = (on) => { forcedNight = on == null ? null : !!on; applyNight(); };
  if (mqDark.addEventListener) mqDark.addEventListener('change', applyNight);
  if (hasSky) {
    const sky = document.createElement('zb-sky'); sky.setAttribute('fixed', ''); ownSky = sky;
    document.body.insertBefore(sky, document.body.firstChild);
    if (skyGlass) { card.classList.add('zb-on-sky'); card.setAttribute('data-zb-glass', ''); card.setAttribute('data-zb-radius', '38'); }
  } else if (!CONTACT) {
    paintSky();
  }
  applyNight();
  setInterval(applyNight, 1000);   // follow the site's theme toggle
  addEventListener('zb-theme', applyNight);
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
  const img = form && form.querySelector('img'); if (img) img.style.display = 'none';
  const dock = document.createElement('div');
  dock.className = 'zb-pw-dock';
  if (CHAT) { dock.setAttribute('role', 'button'); dock.setAttribute('tabindex', '0'); dock.setAttribute('aria-label', 'Chat with Zoltbot, Zolton’s sidekick robot'); }
  else { dock.setAttribute('role', 'img'); dock.setAttribute('aria-label', 'Zoltbot, Zolton’s sidekick robot'); }
  document.body.appendChild(dock);
  // The dock follows its anchor: the card's top-right corner, or the top of the chat panel when it is open.
  (function follow() {
    let cx = null, cy = null, last = performance.now();
    function anchor() {
      const s = dock.offsetWidth || 320, r = card.getBoundingClientRect(), mobile = innerWidth < 820;
      if (LATE && !bus.arrived) return [innerWidth * 0.62 - s / 2, innerHeight + s * 0.55];   // waiting below the screen, in the clouds
      if (LATE && !(bus.chatOpen && chat && !chat.el.classList.contains('zb-peek'))) {   // landed: just past the end of the Contact heading, kept on screen
        // where the text really ends (the heading box is full width): beside the heading if there's room, else beside the line under it
        const textBox = el => { if (!el) return null; const rg = document.createRange(); rg.selectNodeContents(el); const b = rg.getBoundingClientRect(); return b.width ? b : el.getBoundingClientRect(); };
        const room = innerWidth - (mobile ? 8 : 170), hd = textBox(host.querySelector('h1, h2, h3')), pp = textBox(host.querySelector('p'));
        if (mobile || !hd) { const q = (hd || host.getBoundingClientRect()); return [Math.max(8, Math.min(q.left + q.width / 2 - s / 2, innerWidth - s - 8)), q.top - s * 0.78]; }
        if (hd.right + s * 0.75 <= room) return [hd.right - s * 0.12, hd.top + hd.height / 2 - s * 0.5];
        const q = pp || hd; return [Math.min(q.right - s * 0.05, room - s * 0.8), q.top + q.height / 2 - s * 0.48];
      }
      if (bus.chatOpen && chat && !chat.el.classList.contains('zb-peek')) { const p = chat.el.getBoundingClientRect(); return [p.left + p.width / 2 - s / 2, p.top - s * 0.74]; }
      if (mobile) return [r.left + r.width / 2 - s / 2, r.top - s * (document.documentElement.classList.contains('zb-kb') ? 0.84 : 0.7)];   // keyboard up: hover just above the compact card
      return [r.right - s * 0.56, r.top - s * 0.44];   // tucked in over the card's top-right corner, clear of the nav
    }
    // Spring-damper flight: he accelerates toward his spot, overshoots a touch and settles.
    // Velocity and acceleration feed the 3D side (banking, thruster flame, exhaust that stays behind).
    let vx = 0, vy = 0;
    const K = 70, C = 2 * Math.sqrt(K) * 0.62;
    function step(now) {
      const total = Math.min(0.25, (now - last) / 1000); last = now;
      const [tx, ty] = anchor();
      if (bus.teleport) { cx = tx; cy = ty; vx = vy = 0; bus.teleport = false; }
      if (cx === null || reduce) { cx = tx; cy = ty; vx = vy = 0; }
      else {
        // fixed 1/60 s substeps, so a slow frame (heavy page, busy phone) never leaves him trailing behind
        const n = Math.max(1, Math.ceil(total / 0.0167)), dt = total / n;
        let ax = 0, ay = 0, sx = 0, sy = 0;
        for (let k = 0; k < n; k++) {
          ax = K * (tx - cx) - C * vx; ay = K * (ty - cy) - C * vy;
          vx += ax * dt; vy += ay * dt;
          const dx = vx * dt, dy = vy * dt; cx += dx; cy += dy; sx += dx; sy += dy;
        }
        if (window.__zbBus) { const b = window.__zbBus; b.vx = vx; b.vy = vy; b.ax = ax; b.ay = ay; b.mdx += sx; b.mdy += sy; }
      }
      dock.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  })();
  let bubble = null;
  if (CHAT) {
    bubble = document.createElement('div'); bubble.className = 'zb-pw-bubble zb-glass';
    bubble.textContent = LATE ? 'Sorry I’m late! Want to chat?' : CONTACT ? 'Say hi? Have a question?' : 'Need access? Have a question?';
    dock.appendChild(bubble);
    if (!LATE) setTimeout(() => bubble.classList.add('on'), 1400);
  }

  // ---------- Shared state between the bot and the chat ----------
  const bus = window.__zbBus = { vx: 0, vy: 0, ax: 0, ay: 0, mdx: 0, mdy: 0, busy: false, scanning: false, unlocked: false, checkUntil: 0, hopReq: false, mood: 'idle', moodUntil: 0, talkUntil: 0, chatOpen: false, poke: -1, shakeReq: false, thinking: false, chatKey: -9, chatInput: null, chatLog: null };
  // ---------- Late arrival: stay at the footer ZB_BOT_LATE ms and he flies up out of the clouds ----------
  if (LATE) {
    bus.arrived = false; dock.classList.add('zb-waiting'); dock.setAttribute('aria-hidden', 'true'); dock.tabIndex = -1;
    const foot = document.querySelector('footer, .page_footer') || host;
    let timer = 0;
    const arrive = () => {
      if (bus.arrived) return;
      bus.arrived = true; dock.classList.remove('zb-waiting'); dock.removeAttribute('aria-hidden'); if (CHAT) dock.tabIndex = 0;
      const s = dock.offsetWidth || 320, puff = document.createElement('div'); puff.className = 'zb-puff';
      puff.style.left = (innerWidth * 0.62) + 'px'; puff.style.top = (innerHeight - 30) + 'px';
      document.body.appendChild(puff); requestAnimationFrame(() => puff.classList.add('go')); setTimeout(() => puff.remove(), 1600);
      bus.mood = 'happy'; bus.moodUntil = performance.now() / 1000 + 2; bus.hopReq = true;
      if (bubble) setTimeout(() => { if (!bus.chatOpen) bubble.classList.add('on'); }, 900);
    };
    const wait = () => { const v = window.ZB_BOT_LATE; return v != null && isFinite(v) ? +v : 5000; };
    const io = new IntersectionObserver(es => {
      const on = es[0].isIntersecting;
      clearTimeout(timer);
      if (on && !bus.arrived) timer = setTimeout(arrive, wait());
    }, { threshold: 0.25 });
    io.observe(foot);
    // replay (tuning panel): back into the clouds, and the wait starts again if the footer is on screen
    window.zbBotReplay = () => {
      bus.arrived = false; bus.teleport = true; dock.classList.add('zb-waiting'); dock.tabIndex = -1; if (bubble) bubble.classList.remove('on');
      if (chat && bus.chatOpen && chat.close) chat.close();
      clearTimeout(timer); io.unobserve(foot); io.observe(foot);
    };
  }

  // Wrong password: the text field shakes and gets a red ring; Zoltbot looks at it, shakes his head and goes sad.
  function wrongPassword() {
    if (input) { input.classList.add('zb-wrong'); input.classList.remove('zb-shake'); void input.offsetWidth; input.classList.add('zb-shake'); }
    bus.mood = 'sad'; bus.moodUntil = performance.now() / 1000 + 2.6; bus.shakeReq = true;
    // After the head shake, Zoltbot pops the chat open to offer help (once per visit; focus stays on the password field).
    if (chat && !bus.chatOpen && !bus.offeredHelp) { bus.offeredHelp = true; setTimeout(() => { if (!bus.chatOpen && !bus.unlocked) chat.open('wrong'); }, 1300); }
  }
  window.zbPasswordWrong = wrongPassword;
  // Correct password: check it in the background (same request Webflow makes), celebrate, then push forward into the page.
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const submitBtn = form && form.querySelector('[type="submit"]');
  const btnLabel = submitBtn ? (submitBtn.value || submitBtn.textContent) : '';
  const setBtn = (txt) => { if (!submitBtn) return; if ('value' in submitBtn && submitBtn.tagName === 'INPUT') submitBtn.value = txt; else submitBtn.textContent = txt; };
  // Submitting: Webflow does the login itself (its own handler or a normal form post) — we never intercept it,
  // because re-sending the password ourselves broke Webflow's redirect. We only react to the outcome:
  //   wrong password -> Webflow shows .w-form-fail (same page) or reloads this page with it showing -> head shake
  //   right password -> Webflow navigates to the protected page -> the "unlock" flight plays on arrival.
  const UNLOCK = 'zbUnlock';
  const setFlag = (v) => { try { v ? sessionStorage.setItem(UNLOCK, '1') : sessionStorage.removeItem(UNLOCK); } catch (err) {} };
  setFlag(false);   // we are on the password page, so any earlier attempt did not get in
  const failShowing = () => !!(failEl && getComputedStyle(failEl).display !== 'none');
  let watching = false;
  function watchOutcome() {
    if (watching || !failEl) return; watching = true;
    const t0 = performance.now(), was = failShowing();
    const check = () => {
      if (!watching) return;
      const now = failShowing();
      // a fresh failure: the message appears, or it was already up and Webflow re-shows it after the request
      if ((now && !was) || (now && performance.now() - t0 > 1500)) { watching = false; onWrong(); return; }
      if (performance.now() - t0 > 12000) { watching = false; resetBtn(); return; }   // nothing happened: give the button back
      requestAnimationFrame(check);
    };
    if (was) failEl.style.display = 'none';   // hide the old message so a new one is visible as new
    requestAnimationFrame(check);
  }
  function resetBtn() { bus.scanning = false; bus.busy = false; setBtn(btnLabel); }
  function onWrong() {
    setFlag(false); resetBtn();
    if (failEl) failEl.style.display = 'block';
    wrongPassword(); if (input) { input.value = ''; input.focus(); }
  }
  if (form) form.addEventListener('submit', async (e) => {
    if (DEMO) {   // preview only: simulate both outcomes without a real login
      e.preventDefault(); if (bus.busy) return;
      bus.busy = true; bus.scanning = true; setBtn('Checking…');
      await wait(950); bus.scanning = false;
      if (input && input.value.trim().toLowerCase() === 'zolton') {
        if (failEl) failEl.style.display = 'none';
        if (input) { input.classList.remove('zb-wrong'); input.classList.add('zb-right'); }
        setBtn('Unlocked');
        bus.unlocked = true; bus.checkUntil = performance.now() / 1000 + 0.75; bus.mood = 'unlocked'; bus.moodUntil = performance.now() / 1000 + 4; bus.hopReq = true;
        await wait(1250); window.dispatchEvent(new CustomEvent('zb:unlocked'));
      } else onWrong();
      return;
    }
    // Live: let Webflow handle it. Show the scanner while it checks.
    bus.busy = true; bus.scanning = true; setBtn('Checking…');
    setFlag(true);        // if this navigates to the protected page, it arrives with the unlock flight
    watchOutcome();
  });
  // Leaving for the protected page: a quick celebration frame on the way out.
  addEventListener('pagehide', () => { if (bus.busy) { bus.scanning = false; bus.unlocked = true; bus.mood = 'unlocked'; } });
  if (input) input.addEventListener('input', () => input.classList.remove('zb-wrong'));
  if (failed) setTimeout(wrongPassword, 500);

  // ---------- Phone keyboard ----------
  // iOS keeps the layout viewport the same size when the keyboard opens and only shrinks the visual viewport,
  // so fixed things and centred content end up behind the keyboard. While the password field has focus,
  // slide the card so its bottom sits just above the keyboard (Zoltbot follows the card above it).
  (function keyboard() {
    const vv = window.visualViewport;
    if (!vv || !input) return;
    let shift = 0, raf = 0;
    function layout() {
      raf = 0;
      // iOS reports innerHeight as the visible height, so the keyboard can't be detected by size alone:
      // on a touch device, a focused password field means the keyboard is up.
      const open = document.activeElement === input && (touch || (innerHeight - vv.height) > 120);
      document.documentElement.classList.toggle('zb-kb', open);
      let want = 0;
      if (open) {
        // measure without our own shift (read the live, possibly mid-transition, translate from the computed style)
        const tf = getComputedStyle(card).transform, cur = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).m42 : 0;
        const r = card.getBoundingClientRect(), baseTop = r.top - cur, baseBottom = r.bottom - cur;
        const visTop = vv.offsetTop, visBottom = vv.offsetTop + vv.height;
        // card bottom just above the keyboard; the field and Submit live at the bottom of the card, so they always show
        want = (visBottom - 12) - baseBottom;
        if (baseTop + want > visTop + 200) want = (visTop + 200) - baseTop;   // short card on a tall screen: don't drop it lower than needed
      }
      if (Math.abs(want - shift) > 0.5) { shift = want; card.style.transform = shift ? 'translate3d(0,' + shift.toFixed(1) + 'px,0)' : ''; }
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(layout); };
    vv.addEventListener('resize', kick); vv.addEventListener('scroll', kick); addEventListener('scroll', kick, { passive: true });
    input.addEventListener('focus', () => { kick(); setTimeout(kick, 300); setTimeout(kick, 650); });
    input.addEventListener('blur', () => setTimeout(kick, 50));
  })();

  // ---------- Chat UI ----------
  let chat = null;
  if (CHAT) chat = buildChat();
  function buildChat() {
    const el = document.createElement('div');
    el.className = 'zb-chat zb-glass'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Chat with Zoltbot'); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="zb-chat-head"><div><strong>Zoltbot</strong><span>Zolton’s sidekick robot</span></div><button class="zb-chat-x" type="button" aria-label="Close chat">×</button></div>' +
      '<div class="zb-chat-log" aria-live="polite"></div><div class="zb-chips"></div>' +
      '<form class="zb-chat-form"><label for="zb-chat-in" style="position:absolute;left:-9999px">Message Zoltbot</label><input id="zb-chat-in" type="text" autocomplete="off" placeholder="Ask Zoltbot…" maxlength="500"><button type="submit">Send</button></form>';
    if (skyGlass) { el.classList.add('zb-on-sky'); el.setAttribute('data-zb-glass', ''); el.setAttribute('data-zb-radius', '28'); }
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
    // Keep the whole panel (and its Send button) inside the viewport: right of the card if it fits, else left of it,
    // else pinned to the right edge; shrink before it ever runs off the bottom, leaving room for the footer.
    function place() {
      if (innerWidth < 820) return;
      if (CONTACT) {   // contact: a corner panel, bottom right, whatever the scroll
        const W = el.offsetWidth || 340, h = Math.min(480, innerHeight - 240);
        el.style.left = (innerWidth - 24 - W) + 'px'; el.style.top = (innerHeight - 24 - h) + 'px'; el.style.height = h + 'px'; return;
      }
      const r = card.getBoundingClientRect(), W = el.offsetWidth || 340, M = 16, FOOT = 56;
      let left = r.right + 40;
      if (left + W > innerWidth - M) left = (r.left - 40 - W >= M) ? r.left - 40 - W : innerWidth - M - W;
      let top = Math.max(250, Math.round(r.top + 60));
      let h = Math.min(460, innerHeight - top - FOOT);
      if (h < 280) { h = Math.max(240, Math.min(460, innerHeight - 200 - FOOT)); top = Math.max(110, innerHeight - FOOT - h); }
      el.style.left = Math.round(Math.max(M, left)) + 'px';
      el.style.top = Math.round(top) + 'px';
      el.style.height = Math.round(Math.min(h, innerHeight - top - M)) + 'px';
    }
    function open(reason) {
      bus.chatOpen = true; place(); el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
      if (bubble) bubble.classList.remove('on');
      if (reason === 'wrong') {
        if (innerWidth < 820) el.classList.add('zb-peek');   // phone: a short card that leaves the password field visible
        greeted = true; bus.mood = 'curious'; bus.moodUntil = performance.now() / 1000 + 2;
        setTimeout(() => { say(history.length ? 'Still no luck with the password? I can help.' : 'Hmm, that password didn’t work' + (PAGE ? ' for ' + PAGE : '') + '. Need access? Have a question? I’m Zoltbot, Zolton’s sidekick robot, and I can help.', 'bot'); setChips(['Request access', 'I have a question', 'I’ll try again']); }, 250);
        return;   // leave focus on the password field so they can retry
      }
      if (!greeted && CONTACT) { greeted = true; setTimeout(() => { say('Hi! I’m Zoltbot, Zolton’s sidekick robot. Want to get in touch? I can pass Zolton a message, or answer questions about him and his work.', 'bot'); setChips(['Send Zolton a message', 'Who is Zolton?', 'What does he work on?']); }, 250); }
      if (!greeted) { greeted = true; setTimeout(() => { say('Hi! I’m Zoltbot, Zolton’s sidekick robot. ' + (PAGE ? PAGE + ' is a password-protected page.' : 'This part of the site is password-protected.') + ' Need access? Have a question? I can tell you about Zolton’s work, or help you ask him for access.', 'bot'); setChips(['Request access', 'What’s behind the password?', 'Who is Zolton?']); }, 250); }
      setTimeout(() => inp.focus(), 320);
    }
    function close() { bus.chatOpen = false; el.classList.remove('open', 'zb-peek'); el.setAttribute('aria-hidden', 'true'); dock.focus(); }
    el.querySelector('.zb-chat-x').onclick = close;
    el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    addEventListener('resize', () => { if (bus.chatOpen) place(); });
    f.addEventListener('submit', e => { e.preventDefault(); const t = inp.value.trim(); if (t) { inp.value = ''; send(t); } });

    inp.addEventListener('focus', () => el.classList.remove('zb-peek'));
    async function send(text) {
      if (/^I’ll try again$/.test(text) && el.classList.contains('zb-peek')) { close(); if (input) input.focus(); return; }
      el.classList.remove('zb-peek');
      say(text, 'me'); history.push({ role: 'user', content: text }); setChips([]);
      setTimeout(showTyping, 200);
      await wait(900 + Math.min(900, text.length * 12));
      if (!(await treeReply(text))) await offTrack();
      hideTyping();
    }
    const post = async (body) => {
      const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
      return r.json();
    };
    // Off the tree: ask the model (live), or say what the live version would do (preview).
    async function offTrack() {
      if (!ENDPOINT) {
        say('Good question. I don’t know that one yet, but I can pass it to Zolton.', 'bot');
        say('In the live version I’ll answer this with AI. For this preview, try the buttons.', 'note');
        setChips(CONTACT ? [ASK, 'Who is Zolton?'] : ['Request access', 'What’s behind the password?']); return;
      }
      try {
        const j = await post({ type: 'chat', messages: history.slice(-12), page: CONTACT ? 'Contact' : (PAGE || protPath) });
        say(j.reply || 'Hmm, I lost my signal for a second. Try asking again?', 'bot');
        setChips(Array.isArray(j.chips) && j.chips.length ? j.chips.slice(0, 3) : [ASK, 'Who is Zolton?']);
      } catch (err) { say('Hmm, I lost my signal for a second. I can still send Zolton a ' + (CONTACT ? 'message' : 'request') + ' for you.', 'bot'); setChips([ASK]); }
    }
    // The scripted tree from the Zoltbot Brief. Returns false when the message is off the tree.
    const QS = ['What’s your name?', 'What company or team are you with?', 'What’s your role? For example, recruiter, hiring manager or designer.', CONTACT ? 'What would you like to talk to Zolton about? A job link is welcome.' : 'Is this about a specific role or project? A job link is welcome.', 'What’s the best email to reach you?', CONTACT ? 'Anything else Zolton should know? (Optional, or say “skip”.)' : 'Anything you’d like Zolton to show you first? (Optional, or say “skip”.)'];
    const ASK = CONTACT ? 'Send Zolton a message' : 'Request access';
    let step = -1; const answers = [];
    let pending = null;
    async function treeReply(text) {
      const t = text.toLowerCase().trim();
      if (step >= 0) {
        if (step === 4 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text.trim())) { say('That email doesn’t look quite right. Mind checking it?', 'bot'); return true; }
        answers[step] = text; step++;
        if (step < QS.length) { say(QS[step], 'bot'); return true; }
        step = -1;
        pending = { kind: CONTACT ? 'contact' : 'access', page: CONTACT ? 'Contact' : (PAGE || protPath), name: answers[0], company: answers[1], role: answers[2], about: answers[3], email: answers[4], wantsToSee: answers[5] && !/^skip$/i.test(answers[5]) ? answers[5] : '' };
        say('Here’s what I’ll send Zolton:\n' + (PAGE ? '• Access to: ' + PAGE + '\n' : '') + '• ' + pending.name + ', ' + pending.role + ' at ' + pending.company + '\n• About: ' + pending.about + '\n• Email: ' + pending.email + (pending.wantsToSee ? (CONTACT ? '\n• Also: ' : '\n• Wants to see: ') + pending.wantsToSee : '') + '\n\nSend it?', 'bot');
        setChips(['Yes, send it', 'Start over']); return true;
      }
      if (/^i’ll try again$/.test(t)) { say('Go for it. I’ll be right here if you need me.', 'bot'); setChips(['Request access']); if (input) input.focus(); return true; }
      if (/^i have a question$/.test(t)) { say('Ask away! I can tell you about Zolton, his work, or how to get access.', 'bot'); setChips(['What’s behind the password?', 'Who is Zolton?', 'Request access']); inp.focus(); return true; }
      if (/^yes,? send it$/.test(t) && pending) {
        if (ENDPOINT) {
          try { await post({ type: 'request', request: pending, page: location.pathname }); }
          catch (err) {
            if (err.status === 429) { pending = null; say('Looks like you already sent Zolton a request today, so he has it. Anything else I can help with?', 'bot'); setChips(['Who is Zolton?']); return true; }
            say('Hmm, that didn’t go through. Mind trying again in a minute?', 'bot'); setChips(['Yes, send it', 'Start over']); return true;
          }
        }
        pending = null; bus.mood = 'happy'; bus.moodUntil = performance.now() / 1000 + 1.4;
        say('Done! I’ve sent that to Zolton. He’ll reply to the email you gave me.', 'bot');
        if (!ENDPOINT) say('Preview only: nothing was actually sent.', 'note');
        setChips(CONTACT ? ['What does he work on?'] : ['Who is Zolton?']); return true;
      }
      if (CONTACT && /^(start over|send zolton a message)$|\b(message|contact|reach|hire|hiring|email him|talk to (him|zolton)|get in touch)\b/.test(t) && !/^what/.test(t)) {
        step = 0; answers.length = 0; pending = null; say('Great, a few quick questions so Zolton knows who’s writing. ' + QS[0], 'bot'); return true;
      }
      if (CONTACT && /^what does he work on\?$|\b(work on|case stud|portfolio|projects?|behind)\b/.test(t)) { say('Product design with a lot of motion, 3D for the web and design systems. Recent work includes Premiere Loader, an ATM modernization, an icon system (“Drawing One Language Out of Many”) and the Gold piece. Some case studies are password-protected; I can ask Zolton for access.', 'bot'); setChips(['Send Zolton a message', 'Who is Zolton?']); return true; }
      if (!CONTACT && !/behind/.test(t) && /^(start over|request access)$|\b(request|access|let me in|get in)\b|\bpassword\b/.test(t)) {
        if (/password/.test(t) && !/request|access/.test(t)) say('I don’t have the password, and that’s on purpose. But I can send Zolton a request right now.', 'bot');
        step = 0; answers.length = 0; pending = null; if (/password/.test(t) && !/request|access/.test(t)) await wait(700); say('Great, a few quick questions. ' + QS[0], 'bot'); return true;
      }
      if (/^what’s behind the password\?$|\b(behind|case stud|portfolio)\b/.test(t)) { say('Case studies including Premiere Loader, ATM modernization, the icon system (“Drawing One Language Out of Many”) and the Gold piece.', 'bot'); setChips(['Request access', 'Who is Zolton?']); return true; }
      if (/^who is zolton\?$|^(who are you|who is (he|zolton)|tell me about (him|zolton))/.test(t)) { say('Zolton is a senior product designer who has been doing paid design work since 2004. He specializes in motion design, 3D for the web and design systems, and he prototypes in code with AI in his workflow.', 'bot'); setChips(CONTACT ? [ASK, 'What does he work on?'] : ['Request access', 'What’s behind the password?']); return true; }
      if (/^(hi|hello|hey|yo|sup)\b/.test(t)) { say(CONTACT ? 'Hi! I’m Zoltbot, Zolton’s sidekick robot. Want to send Zolton a message, or know more about him?' : 'Hi! I’m Zoltbot, Zolton’s sidekick robot. Want to know about Zolton, or get access?', 'bot'); setChips([ASK, 'Who is Zolton?']); return true; }
      return false;
    }
    return { open, close, el };
  }
  window.zbChat = { open: () => chat && chat.open(), close: () => chat && chat.close() };   // e.g. a "Chat with Zoltbot" button
  const toggleChat = () => { if (!chat) { bus.poke = 0; return; } bus.chatOpen ? chat.close() : chat.open(); };
  dock.addEventListener('click', toggleChat);
  dock.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleChat(); } });

  // ---------- 3D Zoltbot ----------
  function boot() {
    const THREE = window.THREE;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); } catch (e) { return; }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    dock.insertBefore(renderer.domElement, dock.firstChild);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    const OVER = 1.7;   // canvas is 1.7x the dock; pull the camera back the same amount so Zoltbot stays the same size
    camera.position.set(0, 0.04 + 0.06 * OVER, 2.15 * OVER); camera.lookAt(0, 0.04, 0);
    {
      const envScene = new THREE.Scene();
      envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide,
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
        fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0. ? mix(vec3(.85,.94,.99), vec3(.12,.45,.82), pow(h,.6)) : vec3(.95,.9,.82); c += vec3(1.) * pow(max(dot(vP, normalize(vec3(-.4,.6,.7))),0.), 40.) * 3.; gl_FragColor = vec4(c,1.); }' })));
      scene.environment = new THREE.PMREMGenerator(renderer).fromScene(envScene, 0.02).texture;
    }
    const hemi = new THREE.HemisphereLight(0xdff2ff, 0xe8d2b8, 0.7); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff4ea, 1.4); key.position.set(-3, 4, 5); scene.add(key);
    const rim = new THREE.DirectionalLight(0x7fe6ff, 1.3); rim.position.set(3, 2, -4); scene.add(rim);

    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    function limb(a, b, r, mat) {
      const dir = b.clone().sub(a), len = dir.length();
      const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14), mat);
      m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(V(0, 1, 0), dir.normalize());
      return m;
    }
    // ---------- Zoltbot: one sculpted shell (superellipsoid), inset visor with bezel, painted cap + seam ----------
    const shellMat = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1, sheen: 0.08, sheenColor: new THREE.Color('#e6f8ff') });
    const plainMat = new THREE.MeshPhysicalMaterial({ color: '#F3F6F8', roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.1 });
    const capMat = new THREE.MeshPhysicalMaterial({ color: '#1E8FE8', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 });
    const seamMat = new THREE.MeshStandardMaterial({ color: '#B9C4CC', roughness: 0.6 });
    const bezelMat = new THREE.MeshPhysicalMaterial({ color: '#E4EAEE', roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15 });
    const metalDark = new THREE.MeshStandardMaterial({ color: '#4D5862', metalness: 0.9, roughness: 0.32 });
    const ringMat = new THREE.MeshStandardMaterial({ color: '#00D0F0', emissive: '#00BEFF', emissiveIntensity: 1.2, roughness: 0.3 });
    const thrustMat = new THREE.MeshBasicMaterial({ color: '#8FF6FF' });
    const tipMat = new THREE.MeshStandardMaterial({ color: '#00E0B8', emissive: '#00BEFF', emissiveIntensity: 1.1 });

    const bot = new THREE.Group(); scene.add(bot);
    const head = new THREE.Group(); bot.add(head);
    const P = 2.7, SX = 0.3, SY = 0.265, SZ = 0.285;
    const surf = (d, grow = 1) => {
      const k = Math.pow(Math.pow(Math.abs(d.x), P) + Math.pow(Math.abs(d.y), P) + Math.pow(Math.abs(d.z), P), -1 / P);
      return V(d.x * k * SX * grow, d.y * k * SY * grow * (d.y < 0 ? 0.93 : 1), d.z * k * SZ * grow);
    };
    const dirAE = (az, el) => V(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const capLine = d => d.y - (0.56 + 0.16 * d.z);           // cap edge sits high at the front, lower at the back
    {
      const g = new THREE.SphereGeometry(1, 128, 96), pos = g.attributes.position, cols = [];
      const white = new THREE.Color('#F4F7F9'), blue = new THREE.Color('#0E6BD3'), cc = new THREE.Color();
      for (let i = 0; i < pos.count; i++) {
        const d = V(pos.getX(i), pos.getY(i), pos.getZ(i)).normalize(), p = surf(d);
        pos.setXYZ(i, p.x, p.y, p.z);
        const t = Math.min(1, Math.max(0, (capLine(d) + 0.012) / 0.024));
        cc.copy(white).lerp(blue, t * t * (3 - 2 * t)); cols.push(cc.r, cc.g, cc.b);
      }
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
      head.add(new THREE.Mesh(g, shellMat));
      // seam groove along the cap edge
      const pts = [];
      for (let n = 0; n < 160; n++) {
        const th = n / 160 * Math.PI * 2; let lo = 0, hi = Math.PI / 2;
        for (let it = 0; it < 30; it++) { const e = (lo + hi) / 2; capLine(dirAE(th, e)) > 0 ? hi = e : lo = e; }
        pts.push(surf(dirAE(th, (lo + hi) / 2), 1.004));
      }
      head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 240, 0.004, 6, true), seamMat));
    }

    // LED face: a 2D canvas drawn every frame, glowing through a dot-matrix mask, mapped on the visor
    const FW = 512, FH = 320;
    const face = document.createElement('canvas'); face.width = FW; face.height = FH;
    const fctx = face.getContext('2d');
    const src = document.createElement('canvas'); src.width = FW; src.height = FH; const sctx = src.getContext('2d');
    const led = document.createElement('canvas'); led.width = FW; led.height = FH; const lctx = led.getContext('2d');
    const dots = document.createElement('canvas'); dots.width = FW; dots.height = FH;
    { const d = dots.getContext('2d'); d.fillStyle = '#fff'; for (let y = 4; y < FH; y += 8) for (let x = 4; x < FW; x += 8) { d.beginPath(); d.arc(x, y, 3.1, 0, Math.PI * 2); d.fill(); } }
    const faceTex = new THREE.CanvasTexture(face); faceTex.colorSpace = THREE.SRGBColorSpace;
    const GW = 256, GH = 160, glowC = document.createElement('canvas'); glowC.width = GW; glowC.height = GH; const gctx = glowC.getContext('2d');
    const glowTex = new THREE.CanvasTexture(glowC); glowTex.colorSpace = THREE.SRGBColorSpace;
    const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const MOON = new THREE.Color(0.36, 0.45, 0.6);   // body tint under the night sky
    let bodyMats = [];
    let nightF = 0, lastNight = -1, faceMat = null, thrustLight = null, flameParts = null;
    // Visor: a rounded-rectangle patch that follows the shell, with a raised bezel around it
    {
      const HA = 0.98, HE = 0.6, EC = 0.0, N = 56, Q = 4;
      const toSq = (u, v) => { const m = Math.max(Math.abs(u), Math.abs(v)); if (m < 1e-6) return [0, 0]; const L = Math.pow(Math.pow(Math.abs(u), Q) + Math.pow(Math.abs(v), Q), 1 / Q); return [u * m / L, v * m / L]; };
      const vs = [], uvs = [], idx = [];
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        const u = i / N * 2 - 1, v = j / N * 2 - 1, [a, b] = toSq(u, v);
        const p = surf(dirAE(a * HA, EC + b * HE), 1.006); vs.push(p.x, p.y, p.z); uvs.push((a + 1) / 2, (b + 1) / 2);
      }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * (N + 1) + i; idx.push(k, k + 1, k + N + 1, k + 1, k + N + 2, k + N + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(vs, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); g.setIndex(idx); g.computeVertexNormals();
      faceMat = new THREE.MeshPhysicalMaterial({ color: '#06131D', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, emissive: '#ffffff', emissiveMap: faceTex, emissiveIntensity: 1.7 });
      head.add(new THREE.Mesh(g, faceMat));
      // glow shell: a slightly larger copy of the visor in front of it, additive, so the LEDs bloom past their edges
      { const gv = [], GA = HA * 1.12, GE = HE * 1.16;
        for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const u = i / N * 2 - 1, v = j / N * 2 - 1, [a, b] = toSq(u, v); const p = surf(dirAE(a * GA, EC + b * GE), 1.05); gv.push(p.x, p.y, p.z); }
        const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gv, 3)); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); gg.setIndex(idx);
        const gm = new THREE.Mesh(gg, glowMat); gm.renderOrder = 2; head.add(gm); }
      const ring = [];
      for (let n = 0; n < 120; n++) { const t = n / 120 * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t); const u = Math.sign(c) * Math.pow(Math.abs(c), 2 / Q), v = Math.sign(sn) * Math.pow(Math.abs(sn), 2 / Q); ring.push(surf(dirAE(u * HA, EC + v * HE), 1.012)); }
      head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring, true), 240, 0.014, 10, true), bezelMat));
    }

    // Ear pods: rounded lathed pucks with an inset blue disc and glowing ring; curved rotor masts
    const rotors = [], blurs = [];
    const blurTex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 8, 64, 64, 64); gr.addColorStop(0, 'rgba(220,250,255,0)'); gr.addColorStop(0.55, 'rgba(220,250,255,.55)'); gr.addColorStop(0.9, 'rgba(220,250,255,.35)'); gr.addColorStop(1, 'rgba(220,250,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; })());
    const podProfile = [[0.0001, 0.05], [0.06, 0.05], [0.08, 0.043], [0.091, 0.025], [0.093, 0], [0.088, -0.03], [0.07, -0.05]].map(([x, y]) => new THREE.Vector2(x, y));
    [-1, 1].forEach(s => {
      const side = surf(V(s, 0, 0));
      const pod = new THREE.Group(); pod.position.set(side.x - s * 0.012, -0.012, 0); pod.rotation.z = -s * Math.PI / 2; head.add(pod);
      pod.add(new THREE.Mesh(new THREE.LatheGeometry(podProfile, 48), plainMat));
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.056, 48), capMat); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.052; pod.add(disc);
      const glow = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.008, 12, 64), ringMat); glow.rotation.x = Math.PI / 2; glow.position.y = 0.051; pod.add(glow);
      const a = V(s * 0.27, 0.07, -0.01), b = V(s * 0.36, 0.16, -0.02), c = V(s * 0.33, 0.27, -0.02);
      head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, b, c), 24, 0.013, 10), plainMat));
      const hub = new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0.02], [0.02, 0.018], [0.028, 0], [0.022, -0.012], [0.012, -0.016]].map(([x, y]) => new THREE.Vector2(x, y)), 24), metalDark);
      hub.position.copy(c).add(V(0, 0.012, 0)); head.add(hub);
      const rotor = new THREE.Group(); rotor.position.copy(c).add(V(0, 0.03, 0)); head.add(rotor);
      const bladeMat = new THREE.MeshPhysicalMaterial({ color: '#DDF7FF', transparent: true, opacity: 0.45, roughness: 0.2, clearcoat: 1 });
      [0, Math.PI].forEach(ang => { const bl = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 8), bladeMat); bl.scale.set(0.1, 0.005, 0.022); bl.position.set(Math.cos(ang) * 0.1, 0, Math.sin(ang) * 0.1); bl.rotation.y = -ang; bl.rotation.x = 0.25; rotor.add(bl); });
      const blur = new THREE.Mesh(new THREE.CircleGeometry(0.21, 48), new THREE.MeshBasicMaterial({ map: blurTex, transparent: true, depthWrite: false, opacity: 0.5 }));
      blur.rotation.x = -Math.PI / 2; rotor.add(blur); blurs.push(blur);
      rotors.push(rotor);
    });
    // Antenna that bends back, glowing tip
    {
      const top = surf(V(0, 1, -0.25).normalize());
      const a = top.clone().add(V(0, -0.005, 0)), b = top.clone().add(V(0.005, 0.08, -0.01)), c = top.clone().add(V(0.035, 0.14, -0.05));
      head.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, b, c), 20, 0.008, 8), metalDark));
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 14), tipMat); tip.position.copy(c); head.add(tip);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.014, 24), plainMat); base.position.copy(top); head.add(base);
    }
    // Hover thruster under the head
    {
      const bottom = surf(V(0, -1, 0));
      const noz = new THREE.Mesh(new THREE.LatheGeometry([[0.0001, 0.01], [0.05, 0.01], [0.062, -0.006], [0.056, -0.03], [0.044, -0.038]].map(([x, y]) => new THREE.Vector2(x, y)), 40), plainMat);
      noz.position.set(0, bottom.y + 0.012, 0); head.add(noz);
      const g = new THREE.Mesh(new THREE.CircleGeometry(0.04, 32), thrustMat); g.rotation.x = Math.PI / 2; g.position.set(0, bottom.y - 0.025, 0); head.add(g);
      const pl = new THREE.PointLight(0x5fb8ff, 0.5, 0.8); pl.position.set(0, bottom.y - 0.08, 0); head.add(pl); thrustLight = pl;
      // Blue flame: two lathed plumes (white-hot core, blue outer) with a shader that flickers and licks
      const plume = (pts) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 32, 0, Math.PI * 2);
      const mkFlame = (core) => new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
        blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
        uniforms: { uT: { value: 0 }, uLen: { value: 1 }, uCore: { value: core ? 1 : 0 } },
        vertexShader: `varying vec2 vUv; varying float vRim; uniform float uT, uLen, uCore;
          void main(){ vUv = uv; vec3 p = position; float d = clamp(-p.y / 0.22, 0., 1.);
            p.y *= uLen; p.x += sin(p.y * 46. + uT * 31.) * 0.006 * d; p.z += cos(p.y * 39. - uT * 27.) * 0.006 * d;
            vec3 n = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(p, 1.);
            vRim = abs(dot(n, normalize(-mv.xyz))); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `varying vec2 vUv; varying float vRim; uniform float uT, uCore;
          void main(){ float y = vUv.y;   // 0 at the nozzle, 1 at the tip
            float flick = 0.85 + 0.15 * sin(uT * 53. + y * 20.);
            vec3 hot = vec3(0.9, 0.98, 1.0), blue = vec3(0.22, 0.62, 1.0), deep = vec3(0.12, 0.3, 1.0);
            vec3 c = uCore > .5 ? mix(hot, vec3(0.45, 0.85, 1.0), y) : mix(blue, deep, y);
            float a = pow(1. - y, uCore > .5 ? 2.2 : 1.4) * pow(vRim, uCore > .5 ? 0.6 : 1.4) * flick;
            a = min(1., a * (uCore > .5 ? 1.5 : 1.15));
            gl_FragColor = vec4(c * a, a * 0.95); }`   // premultiplied light, so it glows over the page instead of darkening it
      });
      const flameOuter = new THREE.Mesh(plume([[0.0001, 0.0], [0.042, -0.004], [0.048, -0.035], [0.038, -0.11], [0.022, -0.2], [0.0001, -0.3]]), mkFlame(false));
      const flameCore = new THREE.Mesh(plume([[0.0001, 0.0], [0.028, -0.004], [0.028, -0.03], [0.018, -0.09], [0.0001, -0.16]]), mkFlame(true));
      const flame = new THREE.Group(); flame.position.set(0, bottom.y - 0.03, 0); flame.add(flameOuter, flameCore); head.add(flame);
      const FLAME_SIZE = 0.9;   // overall flame scale
      flameParts = { flame, size: FLAME_SIZE, mats: [flameOuter.material, flameCore.material], nozzleY: bottom.y - 0.035 };
    }
    const hands = [];
    bodyMats = [shellMat, plainMat, bezelMat, capMat].map(mt => [mt, mt.color.clone()]);
    // face light: the LEDs light up the bezel and anything right in front of them
    const faceLight = new THREE.PointLight(0x5ff4ff, 0.25, 0.9); faceLight.position.set(0, 0.02, 0.5); head.add(faceLight);
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
      unlocked: { open: 1.0, squint: 1, closed: 0, sad: 0, pupil: 1.0, mouth: 1.0, mouthOpen: 0.65 },
      listen:  { open: 1.06, squint: 0, closed: 0, sad: 0, pupil: 1.08, mouth: 0.45, mouthOpen: 0 }
    };
    const F = Object.assign({}, MOODS[bus.mood]);
    const col = { r: 95, g: 244, b: 255 };
    const holes = [];
    function compose() {
      const W = FW, H = FH;
      fctx.globalCompositeOperation = 'source-over'; fctx.fillStyle = '#000'; fctx.fillRect(0, 0, W, H);
      // soft light behind the dots: a wide haze plus a tighter halo
      fctx.globalAlpha = 0.24 + 0.08 * nightF; fctx.filter = 'blur(26px)'; fctx.drawImage(src, 0, 0);
      fctx.globalAlpha = 0.3 + 0.06 * nightF; fctx.filter = 'blur(9px)'; fctx.drawImage(src, 0, 0); fctx.filter = 'none'; fctx.globalAlpha = 1;
      // keep the pupils dark: cut the haze back out of them, with a soft edge
      holes.forEach(h => { const g = fctx.createRadialGradient(h.x, h.y, h.r * 0.7, h.x, h.y, h.r * 1.25); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); fctx.fillStyle = g; fctx.beginPath(); fctx.arc(h.x, h.y, h.r * 1.25, 0, Math.PI * 2); fctx.fill(); });
      lctx.globalCompositeOperation = 'source-over'; lctx.clearRect(0, 0, W, H); lctx.drawImage(dots, 0, 0);
      lctx.globalCompositeOperation = 'source-in'; lctx.drawImage(src, 0, 0);
      fctx.drawImage(led, 0, 0);
      // hot white centers on lit dots, so each LED reads as a light, not a colored dot
      fctx.globalCompositeOperation = 'lighter'; fctx.globalAlpha = 0.2; fctx.drawImage(led, 0, 0); fctx.globalAlpha = 1; fctx.globalCompositeOperation = 'source-over';
      faceTex.needsUpdate = true;
      // light that spills past the visor glass onto the bezel and shell
      gctx.clearRect(0, 0, GW, GH); gctx.filter = 'blur(12px)'; gctx.drawImage(src, 0, 0, GW, GH); gctx.filter = 'none';
      gctx.globalCompositeOperation = 'destination-out'; const k = GW / FW;
      holes.forEach(h => { const g = gctx.createRadialGradient(h.x * k, h.y * k, 0, h.x * k, h.y * k, h.r * k * 1.4); g.addColorStop(0, '#000'); g.addColorStop(0.6, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); gctx.fillStyle = g; gctx.beginPath(); gctx.arc(h.x * k, h.y * k, h.r * k * 1.4, 0, Math.PI * 2); gctx.fill(); });
      gctx.globalCompositeOperation = 'source-over';
      glowTex.needsUpdate = true;
    }
    function drawFace(px, py, blink, talk, think, t) {
      const W = FW, H = FH, cx = W / 2;
      sctx.clearRect(0, 0, W, H); holes.length = 0;
      const c = `rgb(${col.r|0},${col.g|0},${col.b|0})`;
      sctx.strokeStyle = c; sctx.fillStyle = c; sctx.lineCap = 'round'; sctx.lineJoin = 'round';
      if (bus.scanning) {          // checking: a scanner bar sweeps across the visor
        const sx = cx + Math.sin(t * 6) * 150;
        sctx.globalAlpha = 0.3; sctx.lineWidth = 10; sctx.beginPath(); sctx.moveTo(70, 160); sctx.lineTo(W - 70, 160); sctx.stroke(); sctx.globalAlpha = 1;
        sctx.lineWidth = 30; sctx.beginPath(); sctx.moveTo(sx - 55, 160); sctx.lineTo(sx + 55, 160); sctx.stroke();
        compose(); return;
      }
      if (performance.now() / 1000 < bus.checkUntil) {   // unlocked: a big check mark
        sctx.lineWidth = 32; sctx.beginPath(); sctx.moveTo(cx - 92, 166); sctx.lineTo(cx - 26, 228); sctx.lineTo(cx + 104, 88); sctx.stroke();
        compose(); return;
      }
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
        const pr = 34 * F.pupil, ppx = ex + px * 26, ppy = ey + py * 20; holes.push({ x: ppx, y: ppy, r: pr });
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
      compose();
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
    dock.addEventListener('pointerenter', () => { if (!bus.chatOpen) { bus.mood = 'curious'; bus.moodUntil = performance.now() / 1000 + 0.9; } });

    function resize() { const s = Math.round((dock.clientWidth || 230) * OVER); renderer.setSize(s, s, false); camera.aspect = 1; camera.updateProjectionMatrix(); }
    resize(); addEventListener('resize', resize); new ResizeObserver(resize).observe(dock);

    // Exhaust: sparks spawn at the nozzle in world space, fall with gravity and drag, and are left behind as he flies
    const NP = 90, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 4), pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP).fill(-1);
    const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 4));
    const sparkTex = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; })());
    const sparks = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, map: sparkTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    sparks.frustumCulled = false; scene.add(sparks);
    const UPX = 2 * 2.15 * Math.tan(15 * Math.PI / 180);   // scene units across one dock width (the canvas is OVER x that)
    let spawnAcc = 0, thrust = 1, bank = 0, pitch = 0; const nozzle = new THREE.Vector3(), down = new THREE.Vector3();
    function physics(dt, t, hopping) {
      const b = bus, upp = UPX / (dock.clientWidth || 320);
      // thrust: hover baseline, more when he climbs (screen y up = negative ay) or hops, less when he drops
      const want = Math.max(0.45, Math.min(2.4, 1 - b.ay * 0.0016 - b.vy * 0.0012 + (hopping ? 1.1 : 0) + Math.cos(t * 2.2) * 0.18));
      thrust += (want - thrust) * Math.min(1, dt * 12);
      // bank into horizontal moves, pitch a little with vertical ones (a real drone tilts to fly)
      bank += (Math.max(-0.4, Math.min(0.4, -b.vx * 0.0011 - b.ax * 0.00012)) - bank) * Math.min(1, dt * 8);
      pitch += (Math.max(-0.2, Math.min(0.2, b.vy * 0.0005)) - pitch) * Math.min(1, dt * 8);
      bot.rotation.z = bank; bot.rotation.x = pitch;
      if (flameParts) {
        const fl = 0.75 + 0.45 * thrust + 0.06 * Math.sin(t * 47) + 0.04 * Math.sin(t * 83);
        flameParts.mats.forEach(mt => { mt.uniforms.uT.value = t; mt.uniforms.uLen.value = fl; });
        flameParts.flame.scale.set((0.9 + 0.12 * thrust) * flameParts.size, flameParts.size, (0.9 + 0.12 * thrust) * flameParts.size);
        if (thrustLight) thrustLight.intensity = (0.4 + 0.35 * thrust) * (1 + 0.6 * nightF);
      }
      // the page moved under him this frame: shift live sparks the other way so they stay put on the page
      const sx = -b.mdx * upp, sy = b.mdy * upp; b.mdx = b.mdy = 0;
      head.updateWorldMatrix(true, false);
      nozzle.set(0, flameParts ? flameParts.nozzleY - 0.05 : -0.3, 0); head.localToWorld(nozzle);
      down.set(0, -1, 0).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion()));
      spawnAcc += dt * (reduce ? 0 : 55 * thrust);
      for (let i = 0; i < NP; i++) {
        if (pLife[i] < 0 && spawnAcc >= 1) {
          spawnAcc -= 1; pLife[i] = 0;
          pPos[i * 3] = nozzle.x + (Math.random() - 0.5) * 0.03; pPos[i * 3 + 1] = nozzle.y; pPos[i * 3 + 2] = nozzle.z + (Math.random() - 0.5) * 0.03;
          const sp = 0.55 + 0.35 * thrust + Math.random() * 0.25;
          pVel[i * 3] = down.x * sp + (Math.random() - 0.5) * 0.18; pVel[i * 3 + 1] = down.y * sp; pVel[i * 3 + 2] = down.z * sp + (Math.random() - 0.5) * 0.18;
        }
        if (pLife[i] >= 0) {
          pLife[i] += dt / 0.7;
          if (pLife[i] >= 1) { pLife[i] = -1; pCol[i * 4 + 3] = 0; continue; }
          const drag = Math.exp(-dt * 2.6);
          pVel[i * 3] *= drag; pVel[i * 3 + 2] *= drag; pVel[i * 3 + 1] = pVel[i * 3 + 1] * drag - 0.5 * dt;   // gravity
          pPos[i * 3] += pVel[i * 3] * dt + sx; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt + sy; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
          const life = pLife[i], fade = (1 - life) * (1 - life) * (0.7 + 0.3 * nightF);
          // white-blue near the nozzle, cooling to deep blue
          pCol[i * 4] = 0.7 - 0.55 * life; pCol[i * 4 + 1] = 0.92 - 0.45 * life; pCol[i * 4 + 2] = 1.0; pCol[i * 4 + 3] = fade;
        }
      }
      pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
    }
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
      const sadCol = mood === 'sad', okCol = bus.unlocked;
      target.r = sadCol ? 255 : okCol ? 40 : 95; target.g = sadCol ? 176 : okCol ? 240 : 244; target.b = sadCol ? 139 : okCol ? 200 : 255;
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
      if (bus.hopReq) { bus.hopReq = false; hop = 0; }
      if (bus.unlocked) ringMat.emissive.set('#00E0B8');
      if (shake >= 0) { shake += dt; head.rotation.y += Math.sin(shake * 26) * 0.32 * Math.max(0, 1 - shake / 1.0); if (shake > 1.0) shake = -1; }
      if (hop >= 0) { hop += dt; const h = Math.min(1, hop / 0.55); bot.position.y += Math.sin(h * Math.PI) * 0.22; head.rotation.y += ease(h) * Math.PI * 2; if (hop > 0.55) hop = -1; }
      if (bus.poke >= 0) { bus.poke += dt; bot.position.y += Math.sin(Math.min(1, bus.poke / 0.4) * Math.PI) * 0.08; if (bus.poke > 0.4) bus.poke = -1; }
      hands.forEach(({ h }) => { h.visible = false; });
      head.rotation.y += c * 0.35; head.rotation.x -= c * 0.32;   // eyes shut, chin up, politely looking away
      rotors.forEach((r, i) => r.rotation.y += dt * (i ? -38 : 38));
      blurs.forEach(bm => { bm.material.opacity = 0.42 + 0.08 * Math.sin(t * 40); });
      thrustMat.color.setHSL(0.52, 1, 0.72 + 0.08 * Math.sin(t * 31));
      const sinceKey = now - bus.chatKey;
      if (mood === 'attentive') head.rotation.x += 0.14 * Math.exp(-sinceKey * 7) * Math.sin(sinceKey * 18 + 1.6) + 0.05;
      if (mood === 'talk') { head.rotation.x += 0.1 + Math.sin(t * 9) * 0.05 * m; head.rotation.z += Math.sin(t * 4.5) * 0.05 * m; }
      if (mood === 'think') head.rotation.z += 0.16;
      ringMat.emissiveIntensity = (bus.scanning ? 1.6 + Math.abs(Math.sin(t * 12)) : 0) + (bus.unlocked ? 1.2 : 0) + 0.9 + 0.4 * Math.sin(t * 3) + 2.2 * Math.exp(-sinceKey * 5) + (mood === 'think' ? 0.8 * Math.abs(Math.sin(t * 5)) : 0);
      // night: dim the studio light so the LEDs carry the bot, and push every glow harder
      nightF += ((document.documentElement.classList.contains('zb-night') ? 1 : 0) - nightF) * Math.min(1, dt * 4);
      // moonlit body: weaker, bluer light and much less sky reflection; the LEDs are not dimmed
      if (Math.abs(nightF - lastNight) > 0.002) {
        lastNight = nightF;
        hemi.intensity = 0.7 - 0.6 * nightF; hemi.color.setRGB(0.875 - 0.55 * nightF, 0.95 - 0.5 * nightF, 1 - 0.3 * nightF); hemi.groundColor.setRGB(0.91 - 0.82 * nightF, 0.82 - 0.7 * nightF, 0.72 - 0.5 * nightF);
        key.intensity = 1.4 - 1.2 * nightF; key.color.setRGB(1 - 0.35 * nightF, 0.96 - 0.2 * nightF, 0.92);
        rim.intensity = 1.3 - 0.5 * nightF;
        bodyMats.forEach(([mt, base]) => { mt.color.copy(base).multiply(MOON.clone().lerp(new THREE.Color(1, 1, 1), 1 - nightF)); });
        scene.traverse(o => { if (o.material && o.material.envMapIntensity !== undefined && o.material !== glowMat) o.material.envMapIntensity = 1 - 0.92 * nightF; });
      }
      if (faceMat) faceMat.emissiveIntensity = 1.7 + 0.3 * nightF;
      glowMat.opacity = 0.2 + 0.08 * nightF;
      faceLight.color.setRGB(col.r / 255, col.g / 255, col.b / 255); faceLight.intensity = 0.25 + 0.45 * nightF;
      ringMat.emissiveIntensity *= 1 + 0.3 * nightF; tipMat.emissiveIntensity = 1.1 + 0.5 * nightF + 0.3 * Math.sin(t * 2.2);
      physics(dt, t, hop >= 0 && hop < 0.3);
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // one shared three.js for every script on the page (the About sky uses the same copy)
  if (window.THREE && THREE.CapsuleGeometry) boot();
  else {
    const q = window.__zbThreeQ = window.__zbThreeQ || [];
    q.push(boot);
    if (q.length === 1) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.min.js';
      s.onload = () => q.splice(0).forEach(f => f());
      s.onerror = () => { dock.remove(); if (img) img.style.display = ''; };
      document.head.appendChild(s);
    }
  }
})();
