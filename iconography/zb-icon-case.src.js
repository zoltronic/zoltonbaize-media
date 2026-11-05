/* zb-icon-case — the visuals for the Iconography case study ("Drawing One Cohesive System").
   Every icon here is real: Zolton's custom Fusion icons and the audit rows come from his Figma files
   (ICONS LOAN, Fusion Icon Library V2 Sandbox); the Phosphor icons are Phosphor's own (MIT).
   Built by tools/build-icon-case.py: the data block below is generated, the rest is hand-written.
   Each visual mounts on an element marked data-zb-ic="<name>" in Webflow:
     a .zb-ph placeholder is replaced by the visual; any other element gets the visual right after it. */
(function () {
  'use strict';
  if (window.__zbIconCase) return; window.__zbIconCase = true;
  var D = /*DATA*/null;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- styles ----------
  var css = [
    '.zbi{--zbi-ink:var(--_zb-mode---mode--ink,#07283D);--zbi-muted:var(--_zb-mode---mode--muted,#2A5570);--zbi-hair:var(--_zb-mode---mode--hair,rgba(7,40,61,.14));',
    '--zbi-card:rgba(255,255,255,.72);--zbi-card2:rgba(243,247,250,.9);--zbi-pink:rgba(255,178,248,.55);--zbi-yellow:#FFE27A;--zbi-key:#00a5e0;--zbi-ortho:#e07ee8;',
    'color:var(--zbi-ink);margin:28px 0 32px;font-family:inherit}',
    'html[data-mode="dark"] .zbi{--zbi-card:rgba(255,255,255,.07);--zbi-card2:rgba(255,255,255,.05);--zbi-pink:rgba(224,126,232,.32);--zbi-yellow:#5a4a14}',
    '.zbi *{box-sizing:border-box}',
    '.zbi svg{display:block;overflow:visible}',
    '.zbi-ic{color:currentColor}',
    '.zbi-box{background:var(--zbi-card);border:1px solid var(--zbi-hair);border-radius:18px;overflow:hidden}',
    '.zbi-cap{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--zbi-muted);margin-top:12px}',
    '.zbi-mono{font-family:"JetBrains Mono",ui-monospace,monospace}',
    /* hero field */
    '.zbi-hero{position:relative;padding:clamp(18px,3vw,36px);background-color:var(--zbi-card);background-image:linear-gradient(rgba(0,165,224,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(0,165,224,.10) 1px,transparent 1px);background-size:calc(100%/12) 72px;background-position:clamp(18px,3vw,36px) clamp(18px,3vw,36px)}',
    '.zbi-field{display:grid;grid-template-columns:repeat(12,minmax(0,1fr))}',
    '.zbi-field>span{height:72px;display:flex;align-items:center;justify-content:center;transition:transform 900ms cubic-bezier(.2,.8,.2,1),opacity 600ms ease}',
    '.zbi-field svg{width:32px;height:32px}',
    '.zbi-field.pre>span{opacity:0}',
    '.zbi-keys{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity 500ms ease}',
    '.zbi-keys.on{opacity:1}',
    '@media (max-width:767px){.zbi-field{grid-template-columns:repeat(6,minmax(0,1fr))}.zbi-hero{background-size:calc(100%/6) 72px}.zbi-field>span:nth-child(n+31){display:none}}',
    /* rogue lineup */
    '.zbi-rogue{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,1fr));gap:10px;padding:18px}',
    '.zbi-rogue>div{display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px;border-radius:12px;background:var(--zbi-card2);transition:transform 500ms cubic-bezier(.2,.8,.2,1)}',
    '.zbi-rogue .zbi-mono{font-size:10px;color:var(--zbi-muted);text-align:center;line-height:1.3}',
    '.zbi-rogue:hover>div{transform:none!important}',
    /* audit table */
    '.zbi-at{width:100%;font-size:12px}',
    '.zbi-at .r{display:grid;grid-template-columns:minmax(0,2.1fr) repeat(4,minmax(0,1fr));border-bottom:1px solid var(--zbi-hair);align-items:stretch}',
    '.zbi-at .h>div{padding:11px 10px;font-weight:600;font-size:11px;text-align:center;color:#07283D}',
    '.zbi-at .h>div:first-child{text-align:left;padding-left:16px;background:#06222F;color:#EAF6FD}',
    '.zbi-at .c{display:flex;align-items:center;justify-content:center;min-height:52px;border-left:1px solid var(--zbi-hair)}',
    '.zbi-at .n{display:flex;flex-direction:column;justify-content:center;padding:6px 16px;line-height:1.35}',
    '.zbi-at .n b{font-weight:500}.zbi-at .n span{color:var(--zbi-muted)}',
    '.zbi-at .c svg{width:26px;height:26px}',
    '.zbi-at .gap{background:var(--zbi-pink);font-size:10px;color:#7d2591}',
    'html[data-mode="dark"] .zbi-at .gap{color:#f4c4f8}',
    '.zbi-at .dot{width:8px;height:8px;border-radius:50%;background:#b7a3ff}',
    '.zbi-scroll{max-height:470px;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000 72%,transparent);mask-image:linear-gradient(180deg,#000 72%,transparent)}',
    '.zbi-at .r.in{animation:zbiRow 520ms cubic-bezier(.2,.8,.2,1) both}',
    '@keyframes zbiRow{from{opacity:0;transform:translateY(10px)}}',
    '@media (max-width:600px){.zbi-at .r{grid-template-columns:minmax(0,1.6fr) repeat(3,minmax(0,1fr))}.zbi-at .r>.c:nth-child(2){display:none}}',
    '.zbi-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px}',
    '.zbi-stat{padding:16px 18px}',
    '.zbi-stat b{display:block;font-size:clamp(28px,3.4vw,38px);font-weight:900;letter-spacing:-.03em;line-height:1}',
    '.zbi-stat span{display:block;font-size:13px;color:var(--zbi-muted);margin-top:6px;line-height:1.35}',
    /* shape studies */
    '.zbi-studies{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}',
    '.zbi-study{padding:14px;display:flex;gap:14px;align-items:center;cursor:default}',
    '.zbi-study .g{flex:0 0 112px;height:112px;border-radius:10px;position:relative;background:#fff}',
    'html[data-mode="dark"] .zbi-study .g{background:#eef3f6}',
    '.zbi-study .g>svg{position:absolute;inset:6px;width:100px;height:100px}',
    '.zbi-study .big{color:#3b3f45;transition:opacity 180ms ease}',
    '.zbi-study .t{font-weight:900;font-size:15px;margin-bottom:8px}',
    '.zbi-study .m{display:flex;flex-wrap:wrap;gap:5px}',
    '.zbi-study .m i{width:24px;height:24px;border:1px solid rgba(224,126,232,.55);border-radius:4px;display:flex;align-items:center;justify-content:center;transition:background 200ms,border-color 200ms}',
    '.zbi-study .m i.on{background:rgba(224,126,232,.18);border-color:var(--zbi-ortho)}',
    '.zbi-study .m svg{width:16px;height:16px}',
    '.zbi-credit{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;color:var(--zbi-muted);margin-top:12px}',
    '.zbi-credit a{display:inline-flex;align-items:center;gap:5px;font-weight:600;text-decoration:none;color:var(--_zb-mode---mode--link,#0083B8)}',
    /* grid explorer */
    '.zbi-gx{padding:clamp(16px,2.6vw,26px);display:flex;flex-wrap:wrap;gap:26px;align-items:flex-start}',
    '.zbi-gx .art{flex:0 0 auto;width:min(300px,100%);aspect-ratio:1;border-radius:14px;background:#fff;border:1px solid var(--zbi-hair);position:relative}',
    'html[data-mode="dark"] .zbi-gx .art{background:#eef3f6}',
    '.zbi-gx .art svg{position:absolute;inset:6%;width:88%;height:88%}',
    '.zbi-gx .art .lay{transition:opacity 260ms ease}',
    '.zbi-gx .ctl{flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:18px}',
    '.zbi-gx .lbl{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--zbi-muted);margin-bottom:8px}',
    '.zbi-pills{display:flex;flex-wrap:wrap;gap:8px}',
    '.zbi-pill{height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--zbi-hair);background:var(--zbi-card2);color:var(--zbi-ink);font:500 13px "JetBrains Mono",ui-monospace,monospace;cursor:pointer}',
    '.zbi-pill[aria-pressed="true"]{background:#06222F;color:#EAFBF6;border-color:#06222F}',
    '.zbi-pill .sw{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:1px}',
    '.zbi-sizes{display:flex;align-items:flex-end;flex-wrap:wrap;gap:16px}',
    '.zbi-sizes button{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:0;padding:4px;cursor:pointer;color:var(--zbi-ink);border-radius:8px;min-width:44px;min-height:44px;justify-content:flex-end}',
    '.zbi-sizes button[aria-pressed="true"] .cell{outline:2px solid #c860db;outline-offset:3px}',
    '.zbi-sizes .cell{background:#fff;border-radius:2px;image-rendering:pixelated;display:flex}',
    'html[data-mode="dark"] .zbi-sizes .cell{background:#eef3f6;color:#07283D}',
    '.zbi-sizes .cell svg{width:100%;height:100%}',
    '.zbi-sizes .zbi-mono{font-size:10px;color:var(--zbi-muted)}',
    '.zbi-gx .note{font-size:13px;color:var(--zbi-muted);line-height:1.5;max-width:420px}',
    /* stroke specimen */
    '.zbi-spec{background:var(--zbi-yellow);border-radius:18px;padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}',
    '.zbi-spec .grp{background:rgba(255,255,255,.55);border-radius:12px;padding:14px}',
    'html[data-mode="dark"] .zbi-spec .grp{background:rgba(255,255,255,.08)}',
    '.zbi-spec .hd{display:flex;align-items:baseline;justify-content:space-between;border-bottom:1.5px solid currentColor;padding-bottom:6px;margin-bottom:12px}',
    '.zbi-spec .hd b{font-size:26px;font-weight:900;letter-spacing:-.02em}',
    '.zbi-spec .hd span{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase}',
    '.zbi-spec .pairs{display:flex;flex-wrap:wrap;gap:14px 18px}',
    '.zbi-spec .pair{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.zbi-spec .pair>div{display:flex;gap:6px}',
    '.zbi-spec .pair svg{width:36px;height:36px}',
    '.zbi-spec .pair .zbi-mono{font-size:9px;text-align:center;max-width:92px;line-height:1.3}',
    /* spot mine */
    '.zbi-spot{background:var(--zbi-yellow);border-radius:18px;padding:16px}',
    '.zbi-spot .top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px}',
    '.zbi-spot .top b{font-size:18px;font-weight:900}','.zbi-spot .top>span{display:flex;align-items:center;gap:12px}','.zbi-spot .score{font-size:12px}',
    '.zbi-spot .grid{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px}',
    '@media (max-width:600px){.zbi-spot .grid{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.zbi-spot button{position:relative;aspect-ratio:1;min-height:56px;border-radius:12px;border:1.5px solid rgba(7,40,61,.14);background:rgba(255,255,255,.75);color:#07283D;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:background 220ms,color 220ms,transform 220ms}',
    '.zbi-spot button svg{width:44%;height:44%}',
    '.zbi-spot button:hover{transform:translateY(-2px)}',
    '.zbi-spot button em{position:absolute;left:0;right:0;bottom:6%;font:500 9px "JetBrains Mono",ui-monospace,monospace;font-style:normal;letter-spacing:.06em;opacity:0;transition:opacity 220ms}',
    '.zbi-spot button.open em{opacity:1}',
    '.zbi-spot button.open.mine{background:#06222F;color:#EAFBF6;border-color:#06222F}',
    '.zbi-spot button.open.ph{background:#fff;border-color:rgba(7,40,61,.3)}',
    '.zbi-spot .reset{background:none;border:0;font:500 12px "JetBrains Mono",ui-monospace,monospace;color:#07283D;text-decoration:underline;cursor:pointer;min-height:44px}',
    /* gap to icon */
    '.zbi-g2i{padding:clamp(14px,2.4vw,24px);display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1.3fr) auto minmax(0,1fr);align-items:center;gap:12px}',
    '@media (max-width:640px){.zbi-g2i{grid-template-columns:1fr}.zbi-g2i .op{transform:rotate(90deg);justify-self:center}}',
    '.zbi-g2i .st{display:flex;flex-direction:column;align-items:center;gap:10px;padding:18px 8px;border-radius:12px;background:var(--zbi-card2);transition:opacity 700ms ease,transform 700ms cubic-bezier(.2,.8,.2,1)}',
    '.zbi-g2i .st.fin{background:#06222F;color:#EAF6FD}',
    '.zbi-g2i .row{display:flex;gap:16px;justify-content:center}',
    '.zbi-g2i .row>div{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.zbi-g2i svg{width:58px;height:58px}',
    '.zbi-g2i .row svg{width:46px;height:46px}',
    '.zbi-g2i .zbi-mono{font-size:10px;text-align:center;line-height:1.35;opacity:.85}',
    '.zbi-g2i .op{font-size:26px;color:var(--zbi-muted);text-align:center;transition:opacity 500ms}',
    '.zbi-g2i.pre .st,.zbi-g2i.pre .op{opacity:0;transform:translateY(12px)}',
    '.zbi-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}',
    /* rename */
    '.zbi-rn{margin-top:22px;border-radius:18px;background:rgba(255,255,255,.05);border:1px solid rgba(234,246,253,.14);padding:4px 20px}',
    '.zbi-rn .r{display:grid;grid-template-columns:40px minmax(0,240px) 26px minmax(0,1fr);align-items:center;gap:10px;padding:11px 0;border-bottom:1px solid rgba(234,246,253,.1);color:#EAF6FD}',
    '.zbi-rn .r:last-child{border-bottom:0}',
    '.zbi-rn svg{width:28px;height:28px}',
    '.zbi-rn s{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:13px;color:#B3D3E5;text-decoration-color:rgba(255,178,248,.9);text-decoration-thickness:1.5px}',
    '.zbi-rn b{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:13px;font-weight:500;color:#EAF6FD;overflow-wrap:anywhere}',
    '.zbi-rn .ar{color:#63ecc0}',
    '.zbi-rn.pre .r{opacity:0;transform:translateX(-8px)}',
    '.zbi-rn .r{transition:opacity 500ms ease,transform 500ms cubic-bezier(.2,.8,.2,1)}',
    '@media (max-width:560px){.zbi-rn .r{grid-template-columns:30px minmax(0,1fr);row-gap:2px}.zbi-rn .ar{display:none}.zbi-rn b{grid-column:2}}',
    /* harness */
    '.zbi-hx{padding:clamp(16px,2.6vw,26px);display:flex;flex-wrap:wrap;gap:24px;align-items:center}',
    '.zbi-hx .src{flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.zbi-hx .src .t{width:104px;height:104px;border-radius:14px;background:var(--zbi-yellow);display:flex;align-items:center;justify-content:center;color:#07283D}',
    '.zbi-hx .src svg{width:56px;height:56px}',
    '.zbi-hx .flow{flex:1 1 360px;min-width:0}',
    '.zbi-hx .steps{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}',
    '.zbi-hx .steps span{font:500 11px "JetBrains Mono",ui-monospace,monospace;padding:7px 10px;border-radius:999px;border:1px solid var(--zbi-hair);color:var(--zbi-muted);transition:background 300ms,color 300ms,border-color 300ms}',
    '.zbi-hx .steps span.on{background:#06222F;color:#EAFBF6;border-color:#06222F}',
    '.zbi-hx .out{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:6px;align-items:end}',
    '.zbi-hx .out i{display:flex;align-items:center;justify-content:center;aspect-ratio:1;border-radius:6px;background:var(--zbi-card2);border:1px solid var(--zbi-hair);opacity:.15;transform:scale(.8);transition:opacity 260ms ease,transform 260ms cubic-bezier(.2,.8,.2,1)}',
    '.zbi-hx .out i.on{opacity:1;transform:none}',
    '.zbi-hx .out svg{width:var(--s,60%);height:var(--s,60%)}',
    '.zbi-hx .meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}',
    '.zbi-hx .meta div{flex:1 1 150px;padding:12px 14px;border-radius:12px;background:var(--zbi-card2)}',
    '.zbi-hx .meta b{display:block;font-size:22px;font-weight:900;letter-spacing:-.02em}',
    '.zbi-hx .meta span{font:500 10px "JetBrains Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--zbi-muted)}',
    /* result */
    '.zbi-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:6px}',
    '.zbi-res .zbi-stat b{font-size:clamp(24px,2.8vw,32px)}',
    /* new headings the script adds */
    '.zbi-h3{margin:34px 0 10px;font-size:24px;line-height:1.2;font-weight:900;letter-spacing:-.02em}',
    '.zbi-p{margin:0 0 16px;font-size:16.5px;line-height:1.62;text-wrap:pretty}'
  ].join('\n');

  // ---------- helpers ----------
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function svg(ic, extra) { if (!ic) return ''; return '<svg class="zbi-ic" viewBox="' + ic.v + '" fill="none" aria-hidden="true"' + (extra || '') + '>' + ic.b + '</svg>'; }
  function find(list, name) { for (var i = 0; i < list.length; i++) if (list[i].n === name) return list[i]; return null; }
  function ph(name) { return D.ph[name]; }
  function onView(node, fn, margin) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } }); }, { rootMargin: margin || '0px 0px -15% 0px' });
    io.observe(node);
  }
  function count(node, to, ms) {
    var num = parseFloat(to), suffix = String(to).replace(/^[\d.,~]+/, ''), pre = String(to).match(/^~/) ? '~' : '';
    if (isNaN(num) || reduce) { node.textContent = to; return; }
    var t0 = performance.now(); node.textContent = pre + '0' + suffix;
    (function tick(t) { var k = Math.min(1, (t - t0) / ms); k = 1 - Math.pow(1 - k, 3); node.textContent = pre + Math.round(num * k) + suffix; if (k < 1) requestAnimationFrame(tick); })(t0);
  }
  function mount(name, build) {
    var spots = document.querySelectorAll('[data-zb-ic~="' + name + '"]');   // one anchor can hold several, in order: "spot gap"
    [].forEach.call(spots, function (spot) {
      spot.__zbi = spot.__zbi || {}; if (spot.__zbi[name]) return; spot.__zbi[name] = true;
      var fig = build(); if (!fig) return;
      if (spot.classList.contains('zb-ph')) { spot.parentNode.insertBefore(fig, spot); spot.style.display = 'none';
        var card = spot.closest('.media_card, .media_wide'); if (card) { card.style.aspectRatio = 'auto'; card.style.display = 'block'; } }
      else { var after = spot.__zbiLast || spot; after.parentNode.insertBefore(fig, after.nextSibling); spot.__zbiLast = fig; }
    });
  }
  function stats(list) {
    var w = el('div', 'zbi-stats');
    list.forEach(function (s) { var c = el('div', 'zbi-box zbi-stat', '<b>' + s[0] + '</b><span>' + s[1] + '</span>'); c.__n = s[0]; w.appendChild(c); });
    onView(w, function () { [].forEach.call(w.children, function (c) { count(c.querySelector('b'), c.__n, 1200); }); });
    return w;
  }

  // ---------- grid geometry (from Zolton's own 32px grid: Pixel, Keyshapes, Orthogonal, Full) ----------
  var G = {
    px: (function () { var d = ''; for (var i = 0; i <= 32; i++) d += 'M' + i + ' 0V32M0 ' + i + 'H32'; return '<path d="' + d + '" stroke="#4280FC" stroke-opacity=".28" stroke-width=".06"/>'; })(),
    key: '<g stroke="#006FCF" stroke-width=".28" fill="none" opacity=".75"><circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="5.7"/><rect x="5" y="5" width="22" height="22"/><rect x="7" y="3" width="18" height="26"/><rect x="3" y="7" width="26" height="18"/></g>',
    ortho: '<g stroke="#FF2AEC" stroke-width=".22" opacity=".8"><path d="M1 1 31 31M31 1 1 31M12 1V31M16 1V31M20 1V31M1 12H31M1 16H31M1 20H31"/></g>',
    safe: '<g><path d="M0 0V32H32V0ZM31 31H1V1H31Z" fill="#FF00FF" fill-opacity=".16"/><path d="M1 1V31H31V1ZM30 30H2V2H30Z" fill="#FF00FF" fill-opacity=".1"/><rect x="1" y="1" width="30" height="30" rx="2.1" fill="none" stroke="#6D1ED4" stroke-width=".22"/></g>'
  };

  // ---------- 01 hero field ----------
  function buildHero() {
    var box = el('div', 'zbi zbi-box zbi-hero'), field = el('div', 'zbi-field pre');
    var icons = D.pack.concat(D.std).slice(0, 48);
    icons.forEach(function (ic, i) {
      var s = el('span', '', svg(ic));
      if (!reduce) { var a = (i * 137.5) % 360, r = 140 + (i * 53) % 220; s.style.transform = 'translate(' + (Math.cos(a) * r).toFixed(0) + 'px,' + (Math.sin(a) * r * .6).toFixed(0) + 'px) rotate(' + ((i * 47) % 70 - 35) + 'deg) scale(.6)'; }
      s.style.transitionDelay = (reduce ? 0 : (i % 12) * 34 + Math.floor(i / 12) * 60) + 'ms';
      field.appendChild(s);
    });
    var keys = el('div', 'zbi-keys');
    box.appendChild(field); box.appendChild(keys);
    onView(box, function () {
      requestAnimationFrame(function () {
        field.classList.remove('pre');
        [].forEach.call(field.children, function (s) { s.style.transform = 'none'; });
        if (reduce) return;
        setTimeout(function () {   // keylines flash once on a few icons, then fade
          var spans = [].slice.call(field.children).filter(function (s) { return s.offsetParent; }), br = box.getBoundingClientRect(), html = '';
          [3, 9, 14, 20, 27].forEach(function (k) { var s = spans[k]; if (!s) return; var r = s.getBoundingClientRect(); var x = r.left - br.left + r.width / 2 - 26, y = r.top - br.top + r.height / 2 - 26;
            html += '<svg viewBox="0 0 32 32" style="position:absolute;left:' + x + 'px;top:' + y + 'px;width:52px;height:52px">' + G.key + G.ortho + '</svg>'; });
          keys.innerHTML = html; keys.classList.add('on'); setTimeout(function () { keys.classList.remove('on'); }, 1400);
        }, 1500);
      });
    }, '0px 0px -10% 0px');
    var wrap = el('div'); wrap.appendChild(box);
    wrap.appendChild(el('div', 'zbi-cap', 'Custom Fusion icons, drawn on one grid'));
    return wrap;
  }

  // ---------- 02 rogue lineup: the old library as it was ----------
  function buildRogue() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-rogue');
    D.audit.slice(0, 15).filter(function (r) { return r.one && /DEPRECATED/.test(r.oneRaw); }).slice(0, 8).forEach(function (r, i) {
      var c = el('div', '', svg(r.oneS, ' style="width:' + [40, 30, 46, 34, 42, 28, 38, 44][i % 8] + 'px;height:auto"') + '<div class="zbi-mono">' + r.one + '</div>');
      c.style.transform = 'translate(' + ((i * 7) % 9 - 4) + 'px,' + ((i * 11) % 13 - 6) + 'px) rotate(' + ((i * 5) % 9 - 4) + 'deg)';
      box.appendChild(c);
    });
    w.appendChild(box);
    w.appendChild(el('div', 'zbi-cap', 'Icon 1.0: one filled weight, no shared grid. Hover to straighten them up'));
    return w;
  }

  // ---------- 03 audit slice ----------
  function buildAudit() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-at');
    box.innerHTML = '<div class="r h"><div>Icon 1.0 → 2.0 name</div><div style="background:#b7a3ff">Prod</div><div style="background:#ffa6be">Icon 1.0</div><div style="background:#ccffee">Icon 2.0</div><div style="background:#e9eef2">Phosphor</div></div>';
    var sc = el('div', 'zbi-scroll');
    D.audit.forEach(function (r) {
      var gap2 = !r.twoS, gapP = !r.ph;
      var row = el('div', 'r',
        '<div class="n"><b>' + r.one + '</b><span>' + (r.two || '—') + '</span></div>' +
        '<div class="c"><i class="dot"></i></div>' +
        '<div class="c">' + svg(r.oneS) + '</div>' +
        '<div class="c' + (gap2 ? ' gap' : '') + '">' + (gap2 ? 'NA' : svg(r.twoS)) + '</div>' +
        '<div class="c' + (gapP ? ' gap' : '') + '">' + (gapP ? 'no match' : svg(ph(r.ph))) + '</div>');
      sc.appendChild(row);
    });
    box.appendChild(sc); w.appendChild(box);
    onView(box, function () { [].forEach.call(sc.children, function (r, i) { r.style.animationDelay = (i * 60) + 'ms'; r.classList.add('in'); }); });
    w.appendChild(stats([['233', 'Icon 1.0 icons audited, one row each'], ['120', 'captured in production'], ['71', 'with no match in Phosphor']]));
    return w;
  }

  // ---------- 04 shape studies ----------
  var STUDIES = [
    ['Circle', '<circle cx="16" cy="16" r="13" fill="none" stroke="#3b3f45" stroke-width="2"/>', ['clock', 'globe', 'compass', 'target', 'smiley', 'check-circle']],
    ['Square', '<rect x="5" y="5" width="22" height="22" rx="1.5" fill="none" stroke="#3b3f45" stroke-width="2"/>', ['calendar-blank', 'note-blank', 'grid-four', 'frame-corners', 'lock-simple', 'gift']],
    ['Landscape', '<rect x="3" y="7" width="26" height="18" rx="1.5" fill="none" stroke="#3b3f45" stroke-width="2"/>', ['credit-card', 'envelope-simple', 'monitor', 'wallet', 'ticket', 'folder']],
    ['Freeform', '', ['hands-clapping', 'bird', 'leaf', 'feather', 'butterfly', 'lightning']],
    ['Isometric', '<path d="M16 4l11 6v12l-11 6-11-6V10zM16 16l11-6M16 16v12M16 16 5 10" fill="none" stroke="#3b3f45" stroke-width="2" stroke-linejoin="round"/>', ['cube', 'package', 'stack', 'database', 'cylinder', 'cube']],
    ['Hands', '', ['hand', 'hand-palm', 'hand-pointing', 'hand-grabbing', 'hand-heart', 'hand-coins']]
  ];
  function buildStudies() {
    var w = el('div', 'zbi'), grid = el('div', 'zbi-studies');
    STUDIES.forEach(function (s) {
      var card = el('div', 'zbi-box zbi-study');
      var first = ph(s[2][0]);
      card.innerHTML = '<div class="g"><svg viewBox="0 0 32 32">' + G.safe + G.ortho + G.key + '<g class="ks">' + s[1] + '</g>' +
        '<g class="big"><svg x="0" y="0" width="32" height="32" viewBox="0 0 256 256">' + (first ? first.b : '') + '</svg></g></svg></div>' +
        '<div><div class="t">' + s[0] + '</div><div class="m">' + s[2].map(function (n) { var p = ph(n); return '<i data-n="' + n + '">' + (p ? svg(p) : '') + '</i>'; }).join('') + '</div></div>';
      var big = card.querySelector('.big'), minis = card.querySelectorAll('.m i'), k = 0, timer = null;
      function show(i) { var p = ph(s[2][i]); if (!p) return; big.style.opacity = 0; setTimeout(function () { big.innerHTML = '<svg x="0" y="0" width="32" height="32" viewBox="0 0 256 256">' + p.b + '</svg>'; big.style.opacity = 1; }, 140);
        [].forEach.call(minis, function (m, j) { m.classList.toggle('on', j === i); }); }
      function start() { if (timer || reduce) return; timer = setInterval(function () { k = (k + 1) % s[2].length; show(k); }, 900); }
      function stop() { clearInterval(timer); timer = null; }
      card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
      card.addEventListener('click', function () { k = (k + 1) % s[2].length; show(k); });
      [].forEach.call(minis, function (m, j) { m.addEventListener('mouseenter', function () { k = j; show(j); }); });
      grid.appendChild(card); show(0);
    });
    w.appendChild(grid);
    w.appendChild(el('div', 'zbi-cap', 'Shape studies: Phosphor icons sorted by the shape they are built on. Hover or tap a card'));
    w.appendChild(el('div', 'zbi-credit', '<span>The system I studied: Phosphor, by Helena Zhang and Tobias Fried</span><a href="https://phosphoricons.com/" target="_blank" rel="noopener">phosphoricons.com <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 .01 0M9.5 14.5l5-5M10 9.5h4.5V14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'));
    return w;
  }

  // ---------- 05 grid explorer ----------
  function buildGrid() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-gx');
    var icon = find(D.std, 'piggybank') || D.std[0];
    var lay = { px: 1, key: 1, ortho: 0, safe: 0 };
    var LAYERS = [['px', 'Pixel', '#4280FC'], ['key', 'Keyshapes', '#006FCF'], ['ortho', 'Orthogonal', '#FF2AEC'], ['safe', 'Full · safe area', '#b06bff']];
    box.innerHTML = '<div class="art"><svg viewBox="0 0 32 32" fill="none" role="img" aria-label="Piggy bank icon on its 32 pixel construction grid">' +
      LAYERS.map(function (l) { return '<g class="lay" data-l="' + l[0] + '">' + G[l[0]] + '</g>'; }).join('') +
      '<g style="color:#07283D">' + icon.b + '</g></svg></div>' +
      '<div class="ctl"><div><div class="lbl">Layers</div><div class="zbi-pills">' +
      LAYERS.map(function (l) { return '<button type="button" class="zbi-pill" data-l="' + l[0] + '"><span class="sw" style="background:' + l[2] + '"></span>' + l[1] + '</button>'; }).join('') +
      '</div></div><div><div class="lbl">Rendered at</div><div class="zbi-sizes"></div></div>' +
      '<div class="note">Keyshapes on the 32px grid: a 26px circle, a 22px square, 18 × 26 and 26 × 18 rectangles, inside a 1px trim and 2px safe area.</div></div>';
    var sizes = box.querySelector('.zbi-sizes');
    [12, 16, 20, 24, 32, 48, 64].forEach(function (s, i) {
      var b = el('button', '', '<span class="cell" style="width:' + s + 'px;height:' + s + 'px;color:#07283D">' + svg(icon, ' width="' + s + '" height="' + s + '" shape-rendering="geometricPrecision"') + '</span><span class="zbi-mono">' + s + 'px</span>');
      b.type = 'button'; b.setAttribute('aria-label', 'Show the icon at ' + s + ' pixels'); b.setAttribute('aria-pressed', i === 4 ? 'true' : 'false');
      b.addEventListener('click', function () { [].forEach.call(sizes.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); });
      sizes.appendChild(b);
    });
    function paint() {
      [].forEach.call(box.querySelectorAll('.lay'), function (g) { g.style.opacity = lay[g.getAttribute('data-l')] ? 1 : 0; });
      [].forEach.call(box.querySelectorAll('.zbi-pill'), function (b) { b.setAttribute('aria-pressed', lay[b.getAttribute('data-l')] ? 'true' : 'false'); });
    }
    [].forEach.call(box.querySelectorAll('.zbi-pill'), function (b) { b.addEventListener('click', function () { var k = b.getAttribute('data-l'); lay[k] = lay[k] ? 0 : 1; paint(); }); });
    paint();
    onView(box, function () {   // walk through the layers once so the idea reads without a click
      if (reduce) return; var seq = [{ px: 1, key: 0, ortho: 0, safe: 0 }, { px: 1, key: 0, ortho: 1, safe: 0 }, { px: 1, key: 1, ortho: 1, safe: 0 }, { px: 1, key: 1, ortho: 1, safe: 1 }, { px: 1, key: 1, ortho: 0, safe: 0 }], i = 0;
      (function step() { lay = seq[i]; paint(); i++; if (i < seq.length) setTimeout(step, 700); })();
    });
    w.appendChild(box);
    w.appendChild(el('div', 'zbi-cap', 'The four layers of the grid. Turn each one on and off'));
    return w;
  }

  // ---------- 06 stroke specimen (13 icons that needed their own stroke, drawn Light and Regular) ----------
  function buildStrokes() {
    var w = el('div', 'zbi');
    w.appendChild(el('h3', 'zbi-h3', '31 icons followed the rules. 13 needed new ones.'));
    w.appendChild(el('p', 'zbi-p', 'At one stroke weight, dense icons clogged up and open ones went thin. The 13 hardest got a stroke of their own, drawn twice: once Light, once Regular.'));
    var spec = el('div', 'zbi-spec');
    D.strokes.forEach(function (g) {
      var grp = el('div', 'grp', '<div class="hd"><b>' + g.w + '</b><span>' + g.items.length + (g.items.length > 1 ? ' icons' : ' icon') + '</span></div>');
      var pairs = el('div', 'pairs');
      g.items.forEach(function (p) { pairs.appendChild(el('div', 'pair', '<div>' + svg(p.light) + svg(p.reg) + '</div><div class="zbi-mono">' + p.n + '<br>Light · Regular</div>')); });
      grp.appendChild(pairs); spec.appendChild(grp);
    });
    w.appendChild(spec);
    w.appendChild(el('div', 'zbi-cap', 'From the Fusion single source of truth: non-standard strokes'));
    return w;
  }

  // ---------- 07 spot mine ----------
  function buildSpot() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-spot');
    var mine = ['piggybank', 'hand_coin', 'house_cycle', 'credit_card_gift', 'seedling', 'check_magnifying_glass', 'mobile_devices', 'graduation'].map(function (n) { return { ic: find(D.std, n), who: 'Zolton', cls: 'mine' }; });
    var theirs = ['bank', 'house', 'gift', 'lock-simple', 'bell', 'user', 'wallet', 'credit-card'].map(function (n) { return { ic: ph(n), who: 'Phosphor', cls: 'ph' }; });
    var all = [], order = [0, 8, 9, 1, 10, 2, 3, 11, 12, 4, 13, 5, 6, 14, 15, 7];
    var pool = mine.concat(theirs); order.forEach(function (i) { if (pool[i] && pool[i].ic) all.push(pool[i]); });
    box.innerHTML = '<div class="top"><b>Spot mine</b><span><span class="zbi-mono score">0 of 8 found</span> <button type="button" class="reset">Reset</button></span></div><div class="grid"></div>';
    var grid = box.querySelector('.grid'), score = box.querySelector('.score'), found = 0;
    all.forEach(function (t) {
      var b = el('button', t.cls, svg(t.ic) + '<em>' + t.who + '</em>'); b.type = 'button'; b.setAttribute('aria-label', 'Reveal who drew this icon');
      b.addEventListener('click', function () { if (b.classList.contains('open')) return; b.classList.add('open'); b.setAttribute('aria-label', t.who === 'Zolton' ? 'Drawn by Zolton' : 'Phosphor original'); if (t.who === 'Zolton') { found++; score.textContent = found + ' of 8 found'; } });
      grid.appendChild(b);
    });
    box.querySelector('.reset').addEventListener('click', function () { found = 0; score.textContent = '0 of 8 found'; [].forEach.call(grid.children, function (b) { b.classList.remove('open'); b.setAttribute('aria-label', 'Reveal who drew this icon'); }); });
    w.appendChild(box);
    w.appendChild(el('div', 'zbi-cap', 'Half are Phosphor originals, half are mine. Tap an icon to see who drew it'));
    return w;
  }

  // ---------- 08 from gap to icon ----------
  function buildGap() {
    var w = el('div', 'zbi');
    w.appendChild(el('h3', 'zbi-h3', 'From gap to icon'));
    w.appendChild(el('p', 'zbi-p', 'Every gap got an intake card: what the old icon meant, what Phosphor already had, and how to put the two together.'));
    var EX = D.gaps;
    var tabs = el('div', 'zbi-tabs'), box = el('div', 'zbi-box zbi-g2i pre');
    function render(ex) {
      box.innerHTML = '<div class="st">' + svg(ex.old) + '<div class="zbi-mono">' + ex.oldName + '<br>Icon 1.0</div></div><div class="op" aria-hidden="true">+</div>' +
        '<div class="st"><div class="row">' + ex.parts.map(function (p) { return '<div>' + svg(ph(p)) + '<div class="zbi-mono">' + p + '<br>Phosphor</div></div>'; }).join('') + '</div></div>' +
        '<div class="op" aria-hidden="true">=</div><div class="st fin">' + svg(ex.neu) + '<div class="zbi-mono">' + ex.neuName + '<br>Fusion · mine</div></div>';
    }
    function play() { box.classList.add('pre'); var kids = [].slice.call(box.children); kids.forEach(function (k, i) { k.style.transitionDelay = (reduce ? 0 : i * 260) + 'ms'; }); requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.remove('pre'); }); }); }
    EX.forEach(function (ex, i) {
      var b = el('button', 'zbi-pill', ex.oldName + ' → ' + ex.neuName); b.type = 'button'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { [].forEach.call(tabs.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); render(ex); play(); });
      tabs.appendChild(b);
    });
    render(EX[0]);
    if (EX.length > 1) w.appendChild(tabs);
    w.appendChild(box);
    onView(box, play);
    w.appendChild(el('div', 'zbi-cap', 'The old icon, the Phosphor parts, the new icon'));
    return w;
  }

  // ---------- 09 rename list (inside the dark band) ----------
  function buildRename() {
    var box = el('div', 'zbi zbi-rn pre');
    box.style.margin = '22px 0 0';
    D.renames.forEach(function (r) { box.appendChild(el('div', 'r', svg(r.ic, ' style="color:#EAF6FD"') + '<s>' + r.old + '</s><span class="ar" aria-hidden="true">→</span><b>' + r.neu + '</b>')); });
    onView(box, function () { [].forEach.call(box.children, function (r, i) { r.style.transitionDelay = (reduce ? 0 : i * 140) + 'ms'; }); box.classList.remove('pre'); });
    return box;
  }

  // ---------- 10 harness ----------
  function buildHarness() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-hx');
    var icon = find(D.std, 'piggybank');
    var STEPS = ['Master 32px', 'Outline strokes', '9 sizes', '3 weights', 'Tokens + variants', 'Locked layers'];
    var cells = '';
    for (var wgt = 0; wgt < 3; wgt++) for (var s = 0; s < 9; s++) {
      var sw = [1.5, 2, 2.6][wgt], sc = 34 + s * 7.5;
      cells += '<i style="--s:' + sc + '%">' + svg({ v: icon.v, b: icon.b.replace(/stroke-width="2"/g, 'stroke-width="' + sw + '"') }) + '</i>';
    }
    box.innerHTML = '<div class="src"><div class="t">' + svg(icon) + '</div><div class="zbi-mono" style="font-size:10px;color:var(--zbi-muted)">1 master icon</div></div>' +
      '<div class="flow"><div class="steps">' + STEPS.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div><div class="out">' + cells + '</div>' +
      '<div class="meta"><div><span>By hand</span><b>days</b></div><div><span>With the harness</span><b>a couple of hours</b></div><div><span>Files per icon</span><b>1 → 27</b></div></div></div>';
    var steps = box.querySelectorAll('.steps span'), outs = box.querySelectorAll('.out i');
    function run() {
      [].forEach.call(steps, function (s) { s.classList.remove('on'); }); [].forEach.call(outs, function (o) { o.classList.remove('on'); });
      if (reduce) { [].forEach.call(steps, function (s) { s.classList.add('on'); }); [].forEach.call(outs, function (o) { o.classList.add('on'); }); return; }
      [].forEach.call(steps, function (s, i) { setTimeout(function () { s.classList.add('on'); }, i * 420); });
      [].forEach.call(outs, function (o, i) { setTimeout(function () { o.classList.add('on'); }, 800 + i * 60); });
    }
    onView(box, run);
    box.addEventListener('click', run);
    w.appendChild(box);
    w.appendChild(el('div', 'zbi-cap', 'One master icon in, 9 sizes × 3 weights out. Tap to run it again'));
    return w;
  }

  // ---------- result ----------
  function buildResult() {
    var w = el('div', 'zbi'), r = stats([['233', 'icons audited'], ['71', 'gaps found'], ['44', 'new icons in the library'], ['3', 'weights'], ['9', 'sizes'], ['May 2025', 'live in Fusion']]);
    r.className = 'zbi-res'; w.style.marginTop = '8px'; w.appendChild(r); return w;
  }

  function init() {
    if (!D) return;
    var st = document.createElement('style'); st.id = 'zbi-css'; st.textContent = css; document.head.appendChild(st);
    mount('hero', buildHero);
    mount('rogue', buildRogue);
    mount('audit', buildAudit);
    mount('studies', buildStudies);
    mount('grid', buildGrid);
    mount('strokes', buildStrokes);
    mount('spot', buildSpot);
    mount('gap', buildGap);
    mount('rename', buildRename);
    mount('harness', buildHarness);
    mount('result', buildResult);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
