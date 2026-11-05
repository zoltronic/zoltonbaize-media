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
    '.zbi-study .ks *{stroke:var(--zbi-ortho);stroke-width:1;stroke-dasharray:2 1.5;opacity:.7}',
    '.zbi-study .t{font-weight:900;font-size:15px;margin-bottom:8px}',
    '.zbi-study .m{display:flex;flex-wrap:wrap;gap:5px}',
    '.zbi-study .m i{width:24px;height:24px;border:1px solid rgba(224,126,232,.55);border-radius:4px;display:flex;align-items:center;justify-content:center;transition:background 200ms,border-color 200ms}',
    '.zbi-study .m i.on{background:rgba(224,126,232,.18);border-color:var(--zbi-ortho)}',
    '.zbi-study .m svg{width:16px;height:16px}',
    '.zbi-dots{display:none}',
    '@media (max-width:640px){.zbi-studies{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;gap:12px;margin:0 -16px;padding:4px 16px 8px;scroll-padding:0 16px;scrollbar-width:none;-webkit-overflow-scrolling:touch}.zbi-studies::-webkit-scrollbar{display:none}' +
      '.zbi-study{flex:0 0 82%;scroll-snap-align:center;flex-direction:column;align-items:stretch;padding:16px}.zbi-study .g{flex:none;width:168px;height:168px;margin:0 auto}.zbi-study .g>svg{inset:8px;width:152px;height:152px}' +
      '.zbi-study .t{text-align:center;margin:4px 0 10px}.zbi-study .m{display:grid;grid-template-columns:repeat(3,44px);gap:8px;justify-content:center}.zbi-study .m i{width:44px;height:44px;border-radius:8px}.zbi-study .m svg{width:24px;height:24px}' +
      '.zbi-dots{display:flex;justify-content:center;gap:6px;margin:10px 0 2px}.zbi-dots button{width:8px;height:8px;padding:0;border:0;border-radius:99px;background:rgba(7,40,61,.22);transition:width 200ms,background 200ms}.zbi-dots button[aria-current="true"]{width:20px;background:#07283D}' +
      'html[data-mode="dark"] .zbi-dots button{background:rgba(234,246,253,.3)}html[data-mode="dark"] .zbi-dots button[aria-current="true"]{background:#EAF6FD}}',
    '.zbi-credit{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:14px;color:var(--zbi-muted);margin-top:12px}',
    '.zbi-credit a{display:inline-flex;align-items:center;gap:5px;font-weight:600;text-decoration:none;color:var(--_zb-mode---mode--link,#0083B8)}',
    /* grid explorer */
    '.zbi-gx{padding:clamp(16px,2.6vw,26px);display:flex;flex-wrap:wrap;gap:26px;align-items:flex-start}',
    '.zbi-gx .art{flex:0 0 auto;width:min(300px,100%);aspect-ratio:1;border-radius:14px;background:#fff;border:1px solid var(--zbi-hair);position:relative}',
    'html[data-mode="dark"] .zbi-gx .art{background:#eef3f6}',
    '.zbi-gx .art svg{position:absolute;inset:6%;width:88%;height:88%}',
    '.zbi-gx .art .lay{transition:opacity 260ms ease}',
    '.zbi-sz{margin-top:28px}.zbi-szb{padding:clamp(14px,2.4vw,24px)}',
    '.zbi-szb .hd{display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;align-items:baseline;margin-bottom:10px}',
    '.zbi-szb .hd .zbi-mono{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--zbi-muted)}',
    '.zbi-szb .pp{font:500 12px "JetBrains Mono",ui-monospace,monospace;color:var(--zbi-muted)}.zbi-szb .pp b{font-weight:600;color:#9747FF;margin-left:6px}',
    '.zbi-szb .wrap{position:relative;border-radius:12px;background:#F5F5F5;background-image:radial-gradient(#E3E3E3 1px,transparent 1px);background-size:12px 12px;padding:10px 6px}',
    'html[data-mode="dark"] .zbi-szb .wrap{background-color:#1E1E1E;background-image:radial-gradient(#333 1px,transparent 1px)}',
    '.zbi-szb svg{display:block;width:100%;max-width:820px;height:auto;margin:0 auto;overflow:visible}',
    '.zbi-szb .rl,.zbi-szb .cl{font:500 9px Inter,system-ui,sans-serif;fill:#7A7A7A}.zbi-szb .sl{font:600 10px Inter,system-ui,sans-serif;fill:#9747FF}',
    '.zbi-szb .v{cursor:pointer}.zbi-szb .v .ol{opacity:0;transition:opacity 120ms}.zbi-szb .v:hover .ol,.zbi-szb .v.on .ol{opacity:1}',
    '.zbi-szb .tip{position:absolute;transform:translate(-50%,-100%);background:#1E1E1E;color:#fff;font:500 11px Inter,system-ui,sans-serif;padding:5px 8px;border-radius:5px;white-space:nowrap;pointer-events:none;opacity:0;transition:opacity 120ms}.zbi-szb .tip.on{opacity:1}',
    '.zbi-gx .art .gsz{position:absolute;left:10px;bottom:6px;font-size:10px;letter-spacing:.06em;color:#4f6b7d}',
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
    '.zbi-hx{padding:clamp(12px,2vw,18px)}',
    '.zbi-fx{--fx-bg:#fff;--fx-cv:#F5F5F5;--fx-ln:#E6E6E6;--fx-tx:#2B2B2B;--fx-mu:#8C8C8C;--fx-ink:#1E1E1E;--fx-cell:#fff;--fx-sel:#0D99FF;--fx-cmp:#9747FF;border-radius:12px;overflow:hidden;border:1px solid var(--fx-ln);background:var(--fx-bg);color:var(--fx-tx);font:500 11px Inter,system-ui,sans-serif;box-shadow:0 18px 40px -24px rgba(7,40,61,.45)}',
    'html[data-mode="dark"] .zbi-fx{--fx-bg:#2C2C2C;--fx-cv:#1E1E1E;--fx-ln:#3D3D3D;--fx-tx:#EDEDED;--fx-mu:#9A9A9A;--fx-ink:#EDEDED;--fx-cell:#2C2C2C}',
    '.zbi-fx .bar{display:flex;align-items:center;gap:6px;padding:9px 12px;border-bottom:1px solid var(--fx-ln)}',
    '.zbi-fx .bar>i{width:9px;height:9px;border-radius:50%;background:var(--fx-ln)}',
    '.zbi-fx .ttl{margin-left:8px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}','.zbi-fx .live{white-space:nowrap;flex:0 0 auto}',
    '.zbi-fx .live{margin-left:auto;display:flex;align-items:center;gap:6px;padding:4px 9px;border-radius:999px;background:rgba(151,71,255,.12);color:var(--fx-cmp);font-weight:600}',
    '.zbi-fx .live b{width:7px;height:7px;border-radius:50%;background:var(--fx-cmp);animation:zbiPulse 1.1s ease-in-out infinite}',
    '.zbi-fx .live.done{background:rgba(20,174,92,.12);color:#14AE5C}.zbi-fx .live.done b{background:#14AE5C;animation:none}',
    '@keyframes zbiPulse{50%{opacity:.25}}',
    '.zbi-fx .body{display:grid;grid-template-columns:170px minmax(0,1fr) 180px;min-height:330px}',
    '.zbi-fx .ph{padding:10px 12px 6px;font-weight:600;border-bottom:1px solid var(--fx-ln)}',
    '.zbi-fx .lay{border-right:1px solid var(--fx-ln);display:flex;flex-direction:column;min-height:0}',
    '.zbi-fx .ll{flex:1;overflow:hidden;padding:4px 0;max-height:290px}',
    '.zbi-fx .ll div{padding:4px 12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:zbiIn 220ms ease both}',
    '.zbi-fx .ll .c{color:var(--fx-cmp);font-weight:600}.zbi-fx .ll .v{padding-left:26px;color:var(--fx-tx)}.zbi-fx .ll .v.act{background:rgba(13,153,255,.12)}',
    '@keyframes zbiIn{from{opacity:0;transform:translateY(4px)}}',
    '.zbi-fx .cv{position:relative;background:var(--fx-cv);background-image:radial-gradient(var(--fx-ln) 1px,transparent 1px);background-size:14px 14px;display:flex;align-items:center;justify-content:center;gap:26px;padding:34px 18px 18px;overflow:hidden}',
    '.zbi-fx .lb{position:absolute;top:-18px;left:0;font-weight:600;white-space:nowrap;color:var(--fx-mu)}',
    '.zbi-fx .mst{position:relative;flex:0 0 auto;width:74px;height:74px;background:var(--fx-cell);display:flex;align-items:center;justify-content:center;color:var(--fx-ink);outline:1px solid transparent;transition:outline-color 200ms}',
    '.zbi-fx .mst.sel{outline:1.5px solid var(--fx-sel)}',
    '.zbi-fx .mst svg{width:56px;height:56px}',
    '.zbi-fx .set{position:relative;flex:1 1 auto;max-width:440px;border:1.5px dashed var(--fx-cmp);border-radius:4px;padding:10px;opacity:0;transform:scale(.97);transition:opacity 260ms,transform 260ms}',
    '.zbi-fx .set.on{opacity:1;transform:none}',
    '.zbi-fx .set .lb{color:var(--fx-cmp)}',
    '.zbi-fx .cells{display:grid;grid-template-columns:44px repeat(9,minmax(0,1fr));gap:4px;align-items:center}',
    '.zbi-fx .cells em{font-style:normal;font-size:9px;color:var(--fx-mu)}',
    '.zbi-fx .cells i{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--fx-cell);color:var(--fx-ink);outline:1px solid transparent;opacity:0;transform:scale(.6);transition:opacity 160ms,transform 220ms cubic-bezier(.2,.8,.2,1),outline-color 300ms}',
    '.zbi-fx .cells i.on{opacity:1;transform:none}.zbi-fx .cells i.sel{outline:1.5px solid var(--fx-sel)}',
    '.zbi-fx .cells svg{width:var(--s);height:var(--s)}',
    '.zbi-fx .cur{position:absolute;left:0;top:0;z-index:3;pointer-events:none;transition:transform 240ms cubic-bezier(.3,.7,.2,1);display:flex;align-items:flex-start}',
    '.zbi-fx .cur span{margin:14px 0 0 -2px;padding:2px 7px;border-radius:4px 10px 10px 10px;background:var(--fx-cmp);color:#fff;font-weight:600;font-size:10px}',
    '.zbi-fx .props{border-left:1px solid var(--fx-ln)}',
    '.zbi-fx .pr{padding:10px 12px;display:flex;flex-direction:column;gap:12px}',
    '.zbi-fx .pr .k{color:var(--fx-mu);margin-bottom:5px}',
    '.zbi-fx .pr .chips{display:flex;flex-wrap:wrap;gap:3px}',
    '.zbi-fx .pr .chips span{padding:3px 6px;border-radius:4px;border:1px solid var(--fx-ln);transition:background 150ms,color 150ms,border-color 150ms}',
    '.zbi-fx .pr .chips span.on{background:var(--fx-sel);border-color:var(--fx-sel);color:#fff}',
    '.zbi-fx .pr .big{font-size:20px;font-weight:800;color:var(--fx-tx)}',
    '.zbi-fx .log{border-top:1px solid var(--fx-ln);padding:10px 12px;font:500 11px "JetBrains Mono",ui-monospace,monospace;height:112px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:3px}',
    '.zbi-fx .log div{animation:zbiIn 220ms ease both;color:var(--fx-mu)}.zbi-fx .log div:last-child{color:var(--fx-tx)}',
    '.zbi-fx .log b{color:var(--fx-cmp);font-weight:600}.zbi-fx .log .ok{color:#14AE5C}',
    '@media (max-width:760px){.zbi-fx .body{grid-template-columns:minmax(0,1fr)}.zbi-fx .lay,.zbi-fx .props{display:none}.zbi-fx .mst{display:none}.zbi-fx .cv{padding:30px 10px 12px}}',
    '.zbi-hx .meta{margin-top:14px}',
    '.zbi-hx .meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}',
    '.zbi-hx .meta div{flex:1 1 150px;padding:12px 14px;border-radius:12px;background:var(--zbi-card2)}',
    '.zbi-hx .meta b{display:block;font-size:22px;font-weight:900;letter-spacing:-.02em}',
    '.zbi-hx .meta span{font:500 10px "JetBrains Mono",ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--zbi-muted)}',
    /* result */
    '.zbi-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:6px}',
    '.zbi-res .zbi-stat b{font-size:clamp(24px,2.8vw,32px)}',
    /* new headings the script adds */
    '.zbi-h3{margin:34px 0 10px;font-size:24px;line-height:1.2;font-weight:900;letter-spacing:-.02em}',
    '.zbi-p{margin:0 0 16px;font-size:16.5px;line-height:1.62;text-wrap:pretty}',
    /* the clouds give section text a soft light halo for legibility; on the dark band it reads as a glow, so drop it there */
    'html.zb-cloud-cards .layout_band :is(h1,h2,h3,p,.label-mono){text-shadow:none}'
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
  // an n × n pixel grid drawn over the 32-unit artboard, so every size reads at the same display size
  function pxGrid(n) { var d = '', st = 32 / n; for (var i = 0; i <= n; i++) { var v = +(i * st).toFixed(3); d += 'M' + v + ' 0V32M0 ' + v + 'H32'; }
    return '<path d="' + d + '" stroke="#4280FC" stroke-opacity="' + (n < 32 ? .4 : .28) + '" stroke-width="' + (n < 32 ? .09 : .06) + '"/>'; }
  var G = {
    px: pxGrid(32),
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
    ['Hands', '', ['hand', 'hand-palm', 'hand-pointing', 'hand-grabbing', 'hand-heart', 'hand-coins']],
    ['Portrait', '<rect x="7" y="3" width="18" height="26" rx="1.5" fill="none" stroke="#3b3f45" stroke-width="2"/>', ['file', 'device-mobile', 'clipboard-text', 'door', 'receipt', 'bookmark-simple']],
    ['Triangle', '<path d="M16 4 29 27H3z" fill="none" stroke="#3b3f45" stroke-width="2" stroke-linejoin="round"/>', ['warning', 'triangle', 'play', 'mountains', 'tent', 'warning']],
    ['People', '<path d="M16 5a5 5 0 1 0 .01 0M6 27a10 10 0 0 1 20 0" fill="none" stroke="#3b3f45" stroke-width="2" stroke-linecap="round"/>', ['user', 'users', 'user-circle', 'users-three', 'user-plus', 'identification-badge']],
    ['Arrows', '<path d="M4 16h24M20 8l8 8-8 8" fill="none" stroke="#3b3f45" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', ['arrow-right', 'arrow-up-right', 'arrows-clockwise', 'arrow-bend-up-right', 'caret-right', 'arrows-out']]
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
      var pend = null;
      function show(i) { var p = ph(s[2][i]); if (!p) return; big.style.opacity = 0; clearTimeout(pend); pend = setTimeout(function () { big.innerHTML = '<svg x="0" y="0" width="32" height="32" viewBox="0 0 256 256">' + p.b + '</svg>'; big.style.opacity = 1; }, 140);
        [].forEach.call(minis, function (m, j) { m.classList.toggle('on', j === i); }); }
      function start() { if (timer || reduce) return; timer = setInterval(function () { k = (k + 1) % s[2].length; show(k); }, 900); }
      function stop() { clearInterval(timer); timer = null; }
      card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
      card.addEventListener('click', function () { k = (k + 1) % s[2].length; show(k); });
      [].forEach.call(minis, function (m, j) { m.addEventListener('mouseenter', function () { stop(); k = j; show(j); }); m.addEventListener('mouseleave', start);
        m.addEventListener('click', function (e) { e.stopPropagation(); stop(); k = j; show(j); });
        m.setAttribute('role', 'button'); m.setAttribute('tabindex', '0'); m.setAttribute('aria-label', 'Show ' + s[2][j]); });
      grid.appendChild(card); show(0);
    });
    w.appendChild(grid);
    // phones: the cards become a swipeable row; dots show where you are
    var dots = el('div', 'zbi-dots');
    STUDIES.forEach(function (s, i) { var d = el('button', ''); d.type = 'button'; d.setAttribute('aria-label', s[0]); d.addEventListener('click', function () { var c = grid.children[i]; grid.scrollTo({ left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' }); }); dots.appendChild(d); });
    function cur() { var mid = grid.scrollLeft + grid.clientWidth / 2, best = 0, bd = 1e9; [].forEach.call(grid.children, function (c, i) { var dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (dd < bd) { bd = dd; best = i; } }); [].forEach.call(dots.children, function (d, i) { d.setAttribute('aria-current', i === best ? 'true' : 'false'); }); }
    grid.addEventListener('scroll', function () { requestAnimationFrame(cur); }, { passive: true }); setTimeout(cur, 0);
    w.appendChild(dots);
    w.appendChild(el('div', 'zbi-cap', 'Shape studies: Phosphor icons sorted by the shape they are built on. Hover or tap a card. On a phone, swipe through them'));
    w.appendChild(el('div', 'zbi-credit', '<span>The system I studied: Phosphor, by Helena Zhang and Tobias Fried</span><a href="https://phosphoricons.com/" target="_blank" rel="noopener">phosphoricons.com <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 .01 0M9.5 14.5l5-5M10 9.5h4.5V14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></a>'));
    return w;
  }

  // ---------- 05 grid explorer ----------
  function buildGrid() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-gx');
    var icon = find(D.std, 'hand_sparkles') || D.std[0];
    var lay = { px: 1, key: 1, ortho: 0, safe: 0 };
    var LAYERS = [['px', 'Pixel', '#4280FC'], ['key', 'Keyshapes', '#006FCF'], ['ortho', 'Orthogonal', '#FF2AEC'], ['safe', 'Full · safe area', '#b06bff']];
    box.innerHTML = '<div class="art"><svg viewBox="0 0 32 32" fill="none" role="img" aria-label="Hand with sparkles icon on its 32 pixel construction grid">' +
      LAYERS.map(function (l) { return '<g class="lay" data-l="' + l[0] + '">' + G[l[0]] + '</g>'; }).join('') +
      '<g style="color:#07283D">' + icon.b + '</g></svg><span class="gsz zbi-mono">32 × 32 px grid · the base grid</span></div>' +
      '<div class="ctl"><div><div class="lbl">Layers</div><div class="zbi-pills">' +
      LAYERS.map(function (l) { return '<button type="button" class="zbi-pill" data-l="' + l[0] + '"><span class="sw" style="background:' + l[2] + '"></span>' + l[1] + '</button>'; }).join('') +
      '</div></div><div><div class="lbl">Rendered at</div><div class="zbi-sizes"></div></div>' +
      '<div class="note">Keyshapes on the 32px grid: a 26px circle, a 22px square, 18 × 26 and 26 × 18 rectangles, inside a 1px trim and 2px safe area.</div></div>';
    var sizes = box.querySelector('.zbi-sizes');
    [12, 16, 20, 24, 32, 48, 64].forEach(function (s, i) {
      var b = el('button', '', '<span class="cell" style="width:' + s + 'px;height:' + s + 'px;color:#07283D">' + svg(icon, ' width="' + s + '" height="' + s + '" shape-rendering="geometricPrecision"') + '</span><span class="zbi-mono">' + s + 'px</span>');
      b.type = 'button'; b.setAttribute('aria-label', 'Show the icon at ' + s + ' pixels'); b.setAttribute('aria-pressed', i === 4 ? 'true' : 'false');
      b.addEventListener('click', function () { [].forEach.call(sizes.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true');
        box.querySelector('.lay[data-l="px"]').innerHTML = pxGrid(s); box.querySelector('.gsz').textContent = s + ' × ' + s + ' px grid' + (s === 32 ? ' · the base grid' : ''); });
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
    w.appendChild(buildSizing());
    return w;
  }

  // ---------- 05b the grid as a Figma component: 7 sizes × 4 grid views, drawn from Zolton's own geometry ----------
  // Mirrors the "Icon -sizing" component set in his sandbox: same positions, colours and stroke widths at each size.
  function buildSizing() {
    var SIZES = [['64x64px', 64, 21], ['56x56', 56, 99], ['48x48', 48, 169], ['40x40', 40, 231], ['32x32', 32, 285], ['24x24', 24, 331], ['20x20', 20, 369]];
    var GRIDS = ['Full grid', 'Keyshapes', 'Orthogonals', 'Pixel Grid'], ROWC = [52, 124, 196, 268];
    function cell(n, g) {
      var k = n / 32, h = n / 2, b = k, o = '<rect width="' + n + '" height="' + n + '" fill="#fff"/><g opacity=".5">';
      if (g === 0 || g === 3) { var d = ''; for (var i = 0; i <= n; i++) d += 'M' + i + ' 0V' + n + 'M0 ' + i + 'H' + n; o += '<path d="' + d + '" stroke="#4280FC" stroke-width=".12" opacity=".85"/>'; }
      if (g === 0 || g === 2) { var e = n - b, q = n / 8; o += '<path d="M' + b + ' ' + b + 'L' + e + ' ' + e + 'M' + e + ' ' + b + 'L' + b + ' ' + e +
        [h - q, h, h + q].map(function (v) { return 'M' + v + ' ' + b + 'V' + e + 'M' + b + ' ' + v + 'H' + e; }).join('') + '" stroke="#FF2AEC" stroke-width=".3" opacity=".75"/>'; }
      o += '<path d="M0 0V' + n + 'H' + n + 'V0ZM' + (n - 2) + ' ' + (n - 2) + 'H2V2H' + (n - 2) + 'Z" fill="#FF00FF" opacity=".49"/><path d="M0 0V' + n + 'H' + n + 'V0ZM' + (n - 1) + ' ' + (n - 1) + 'H1V1H' + (n - 1) + 'Z" fill="#FF00FF" opacity=".49"/>';
      if (g === 0 || (n === 32 && g < 3)) o += '<rect x="1" y="1" width="' + (n - 2) + '" height="' + (n - 2) + '" rx="' + (n * .068).toFixed(2) + '" fill="none" stroke="#6D1ED4" stroke-width=".3"/>';
      if (g === 0 || g === 1) { var r = function (x, y, w, hh) { return '<rect x="' + x * k + '" y="' + y * k + '" width="' + w * k + '" height="' + hh * k + '"/>'; };
        o += '<g stroke="#006FCF" stroke-width=".46" fill="none"><circle cx="' + h + '" cy="' + h + '" r="' + 13 * k + '" opacity=".7"/><circle cx="' + h + '" cy="' + h + '" r="' + (5.67 * k).toFixed(2) + '" opacity=".7"/>' + r(5, 5, 22, 22) + r(7, 3, 18, 26) + r(3, 7, 26, 18) + '</g>'; }
      return o + '</g>';
    }
    var LX = 86, TY = 26, W = 421, H = 313, inner = '';
    GRIDS.forEach(function (g, gi) {
      inner += '<text x="' + (LX - 12) + '" y="' + (TY + ROWC[gi] + 3) + '" text-anchor="end" class="rl">' + g + '</text>';
      SIZES.forEach(function (sz) {
        var n = sz[1], x = LX + sz[2] + (sz[1] === 56 ? 0 : 0), y = TY + ROWC[gi] - n / 2, name = 'Size=' + sz[0] + ', Grid=' + g;
        inner += '<g class="v" data-n="' + name + '" data-s="' + sz[0] + '" data-g="' + g + '" transform="translate(' + x + ' ' + y + ')">' + cell(n, gi) +
          '<rect class="hit" width="' + n + '" height="' + n + '" fill="transparent"/><rect class="ol" x="-.75" y="-.75" width="' + (n + 1.5) + '" height="' + (n + 1.5) + '" fill="none" stroke="#0D99FF" stroke-width="1.5"/></g>';
      });
    });
    SIZES.forEach(function (sz) { inner += '<text x="' + (LX + sz[2] + sz[1] / 2) + '" y="' + (TY + H + 16) + '" text-anchor="middle" class="cl">' + sz[1] + '</text>'; });
    var VW = LX + W + 8, VH = TY + H + 24;
    var w = el('div', 'zbi zbi-sz');
    w.innerHTML = '<div class="zbi-box zbi-szb"><div class="hd"><span class="zbi-mono">The grid, as a component</span><span class="pp"></span></div>' +
      '<div class="wrap"><svg viewBox="0 0 ' + VW + ' ' + VH + '" role="img" aria-label="Zolton\'s grid component in Figma: seven sizes from 64 to 20 pixels, each in four views: full grid, keyshapes, orthogonals and pixel grid">' +
      '<text x="' + LX + '" y="' + (TY - 8) + '" class="sl">❖ Icon -sizing</text><rect x="' + LX + '" y="' + TY + '" width="' + W + '" height="' + H + '" rx="5" fill="none" stroke="#9747FF" stroke-width="1" stroke-dasharray="4 3"/>' +
      inner + '</svg><div class="tip"></div></div></div>' +
      '<div class="zbi-cap">My grid component in Figma: 7 sizes × 4 grid views, 28 variants. Hover or tap one</div>';
    var svgEl = w.querySelector('svg'), tip = w.querySelector('.tip'), pp = w.querySelector('.pp'), wrap = w.querySelector('.wrap');
    function pick(v) {
      [].forEach.call(svgEl.querySelectorAll('.v.on'), function (x) { x.classList.remove('on'); }); v.classList.add('on');
      pp.innerHTML = '<b>Size</b> ' + v.getAttribute('data-s') + ' <b>Grid</b> ' + v.getAttribute('data-g');
      var a = wrap.getBoundingClientRect(), r = v.getBoundingClientRect();
      tip.textContent = v.getAttribute('data-n'); tip.style.left = (r.left - a.left + r.width / 2) + 'px'; tip.style.top = (r.top - a.top - 8) + 'px'; tip.classList.add('on');
    }
    [].forEach.call(svgEl.querySelectorAll('.v'), function (v) { v.addEventListener('mouseenter', function () { pick(v); }); v.addEventListener('click', function () { pick(v); }); });
    svgEl.addEventListener('mouseleave', function () { tip.classList.remove('on'); });
    setTimeout(function () { var d = svgEl.querySelector('.v[data-n="Size=32x32, Grid=Full grid"]'); if (d) { d.classList.add('on'); pp.innerHTML = '<b>Size</b> 32x32 <b>Grid</b> Full grid · the base'; } }, 0);
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
    var mine = ['hand_coin', 'hand_sparkles', 'atm', 'document_certification', 'rose 1', 'Cruise ship 17', 'ToothCare', 'hands holding heart'].map(function (n) { return { ic: find(D.std.concat(D.pack), n), who: 'Zolton', cls: 'mine' }; });
    var theirs = ['bank', 'wallet', 'credit-card', 'file-text', 'flower-tulip', 'boat', 'tooth', 'hand-heart'].map(function (n) { return { ic: ph(n), who: 'Phosphor', cls: 'ph' }; });
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
      box.innerHTML = '<div class="st">' + (ex.old ? svg(ex.old) : '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="4" width="24" height="24" rx="4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" opacity=".5"/></svg>') + '<div class="zbi-mono">' + ex.oldName + '<br>' + (ex.old ? 'Icon 1.0' : 'no icon yet') + '</div></div><div class="op" aria-hidden="true">+</div>' +
        '<div class="st"><div class="row">' + ex.parts.map(function (p) { return typeof p === 'string' ? '<div>' + svg(ph(p)) + '<div class="zbi-mono">' + p + '<br>Phosphor</div></div>' : '<div>' + svg(p.ic) + '<div class="zbi-mono">' + p.n + '<br>Fusion</div></div>'; }).join('') + '</div></div>' +
        '<div class="op" aria-hidden="true">=</div><div class="st fin">' + svg(ex.neu) + '<div class="zbi-mono">' + ex.neuName + '<br>Fusion · mine</div></div>';
    }
    function play() { box.classList.add('pre'); var kids = [].slice.call(box.children); kids.forEach(function (k, i) { k.style.transitionDelay = (reduce ? 0 : i * 260) + 'ms'; }); requestAnimationFrame(function () { requestAnimationFrame(function () { box.classList.remove('pre'); }); }); }
    EX.forEach(function (ex, i) {
      var b = el('button', 'zbi-pill', ex.neuName); b.type = 'button'; b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      b.addEventListener('click', function () { [].forEach.call(tabs.children, function (x) { x.setAttribute('aria-pressed', 'false'); }); b.setAttribute('aria-pressed', 'true'); render(ex); play(); });
      tabs.appendChild(b);
    });
    render(EX[0]);
    if (EX.length > 1) w.appendChild(tabs);
    w.appendChild(box);
    onView(box, play);
    w.appendChild(el('div', 'zbi-cap', 'The old icon, the parts it was built from (Phosphor, or icons already in Fusion), the new icon. From my intake cards'));
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

  // ---------- 10 harness: an agent building the component sets in Figma, live ----------
  function buildHarness() {
    var w = el('div', 'zbi'), box = el('div', 'zbi-box zbi-hx');
    // the Personal Loan icons, the set where the harness started; label = the name the component set gets
    var LOAN = [['Hand heartbeat 1', 'hand_heartbeat'], ['Rose 3', 'rose'], ['Hand and Plane', 'hand_plane'], ['Rental Key 3', 'rental_keys'],
      ['hand holding med shield', 'hand_med_shield'], ['Suitcase rolling sheild', 'suitcase_shield'], ['Ticket attraction 1 new', 'ticket_attraction'], ['hands clock', 'hands_clock']];
    var NAMES = LOAN.filter(function (x) { return find(D.pack, x[0]); });
    var SIZES = [12, 16, 20, 24, 32, 40, 48, 56, 64], WTS = [['Light', 1.5], ['Regular', 2], ['Bold', 2.6]];
    var CUR = '<svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M1 1l13 7.2-5.8 1.5L5.5 16z" fill="#9747FF" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
    box.innerHTML = '<div class="zbi-fx" aria-label="An agent building icon component sets in Figma">' +
      '<div class="bar"><i></i><i></i><i></i><span class="ttl">Personal Loan Icons / Components</span><span class="live"><b></b><em style="font-style:normal">Agent building</em></span></div>' +
      '<div class="body"><div class="lay"><div class="ph">Layers</div><div class="ll"></div></div>' +
      '<div class="cv"><div class="mst"><div class="lb"></div><div class="mi"></div></div><div class="set"><div class="lb"></div><div class="cells"></div></div><div class="cur">' + CUR + '<span>Agent</span></div></div>' +
      '<div class="props"><div class="ph">Properties</div><div class="pr">' +
        '<div><div class="k">Size</div><div class="chips sz">' + SIZES.map(function (z) { return '<span>' + z + '</span>'; }).join('') + '</div></div>' +
        '<div><div class="k">Weight</div><div class="chips wt">' + WTS.map(function (x) { return '<span>' + x[0] + '</span>'; }).join('') + '</div></div>' +
        '<div><div class="k">Variants</div><div class="big vc">0</div></div>' +
        '<div><div class="k">Stroke</div><div class="big sk">—</div></div></div></div></div>' +
      '<div class="log"></div></div>' +
      '<div class="meta"><div><span>By hand</span><b>days</b></div><div><span>With the harness</span><b>a couple of hours</b></div><div><span>Files per icon</span><b>1 → 27</b></div></div>';
    var q = function (c) { return box.querySelector(c); };
    var cv = q('.cv'), mst = q('.mst'), set = q('.set'), cellsEl = q('.cells'), cur = q('.cur'), ll = q('.ll'), log = q('.log'), live = q('.live'), liveT = q('.live em');
    var szs = box.querySelectorAll('.sz span'), wts = box.querySelectorAll('.wt span'), vc = q('.vc'), sk = q('.sk');
    function weighted(ic, sw) { return { v: ic.v, b: ic.b.replace(/stroke-width="[^"]*"/g, 'stroke-width="' + sw + '"') }; }
    function say(h) { var d = el('div', '', h); log.appendChild(d); while (log.children.length > 6) log.removeChild(log.firstChild); }
    function layer(t, c) { var d = el('div', c, t); ll.appendChild(d); while (ll.children.length > 14) ll.removeChild(ll.children[1]); return d; }
    function point(node) { var a = cv.getBoundingClientRect(), b = node.getBoundingClientRect(); cur.style.transform = 'translate(' + (b.left - a.left + b.width * .6) + 'px,' + (b.top - a.top + b.height * .6) + 'px)'; }
    function chips(list, i) { [].forEach.call(list, function (s, j) { s.classList.toggle('on', j === i); }); }
    var run = 0, k = 0, visible = false;
    function paint(n, ic) {
      mst.querySelector('.lb').textContent = 'Master · 32px'; mst.querySelector('.mi').innerHTML = svg(ic);
      set.querySelector('.lb').textContent = '❖ ' + n;
      var h = '';
      WTS.forEach(function (wt) { h += '<em>' + wt[0] + '</em>'; SIZES.forEach(function (z) { h += '<i style="--s:' + Math.round(24 + (z - 12) / 52 * 70) + '%">' + svg(weighted(ic, wt[1])) + '</i>'; }); });
      cellsEl.innerHTML = h;
    }
    function build(i) {
      var my = ++run, n = NAMES[i][1], ic = find(D.pack, NAMES[i][0]);
      function T(ms, fn) { setTimeout(function () { if (my === run) fn(); }, ms); }
      ll.innerHTML = ''; log.innerHTML = ''; vc.textContent = '0'; sk.textContent = '—'; chips(szs, -1); chips(wts, -1);
      live.classList.remove('done'); liveT.textContent = 'Agent building';
      set.classList.remove('on'); mst.classList.remove('sel'); paint(n, ic);
      var cells = cellsEl.querySelectorAll('i');
      layer('▢ Master / ' + n, '');
      T(150, function () { point(mst); mst.classList.add('sel'); say('› Reading master <b>' + n + '</b> · 32 px grid'); });
      T(800, function () { say('› Outlining strokes, snapping to the pixel grid'); sk.textContent = '2 px'; });
      T(1400, function () { set.classList.add('on'); mst.classList.remove('sel'); layer('❖ ' + n, 'c'); say('› Creating component set <b>❖ ' + n + '</b>'); point(set); });
      T(1900, function () { say('› Adding 27 variants: Size × Weight'); });
      var prev = null;
      [].forEach.call(cells, function (c, j) {
        T(2000 + j * 75, function () {
          var wi = Math.floor(j / 9), si = j % 9;
          if (prev) prev.classList.remove('sel'); c.classList.add('on', 'sel'); prev = c; point(c);
          chips(szs, si); chips(wts, wi); vc.textContent = j + 1; sk.textContent = WTS[wi][1] + ' px';
          var old = ll.querySelector('.act'); if (old) old.classList.remove('act');
          layer('Size=' + SIZES[si] + ', Weight=' + WTS[wi][0], 'v act'); ll.scrollTop = ll.scrollHeight;
        });
      });
      var end = 2000 + cells.length * 75;
      T(end + 150, function () { if (prev) prev.classList.remove('sel'); say('› Binding tokens <b>icon/stroke</b> · <b>icon/color</b>'); });
      T(end + 750, function () { say('<span class="ok">✓</span> Layers locked · published to the Fusion library'); live.classList.add('done'); liveT.textContent = '27 variants ready'; point(set); });
      T(end + 2900, function () { if (visible) { k = (k + 1) % NAMES.length; build(k); } });
    }
    function still() { // reduced motion: the finished state, no movement
      var n = NAMES[0][1], ic = find(D.pack, NAMES[0][0]); paint(n, ic); set.classList.add('on');
      [].forEach.call(cellsEl.querySelectorAll('i'), function (c) { c.classList.add('on'); });
      layer('❖ ' + n, 'c'); say('<span class="ok">✓</span> 27 variants built and published'); vc.textContent = '27';
      live.classList.add('done'); liveT.textContent = '27 variants ready'; cur.style.display = 'none';
    }
    w.appendChild(box);
    w.appendChild(el('div', 'zbi-cap', 'The harness at work: one master icon in, a component set of 9 sizes × 3 weights out. Tap to watch the next icon'));
    if (reduce || !NAMES.length) { if (NAMES.length) setTimeout(still, 0); return w; }
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !visible) { visible = true; build(k); } else if (!e.isIntersecting && visible) { visible = false; run++; } });
    }, { threshold: .35 }).observe(box);
    else { visible = true; setTimeout(function () { build(0); }, 0); }
    box.addEventListener('click', function () { k = (k + 1) % NAMES.length; build(k); });
    return w;
  }

  // ---------- result ----------
  function buildResult() {
    var w = el('div', 'zbi'), r = stats([['233', 'icons audited'], ['71', 'gaps found'], ['44', 'new icons in the library'], ['3', 'weights'], ['9', 'sizes'], ['May 2025', 'live in Fusion']]);
    r.className = 'zbi-res'; w.style.marginTop = '8px'; w.appendChild(r); return w;
  }

  // the site's blue sky (the <zb-sky> element defined in Site settings) behind the page, when the page has none of its own
  function sky() {
    if (document.querySelector('zb-sky') || !(window.customElements && customElements.get('zb-sky'))) return;
    var s = document.createElement('zb-sky'); s.setAttribute('fixed', ''); s.setAttribute('aria-hidden', 'true');
    var de = document.documentElement, dark = function () { return de.getAttribute('data-mode') === 'dark'; };
    if (dark()) s.setAttribute('night', '1');
    document.body.insertBefore(s, document.body.firstChild);
    var root = document.querySelector('.page_root'); if (root && getComputedStyle(root).position === 'static') root.style.position = 'relative';
    if (root && !root.style.zIndex) root.style.zIndex = '1';
    document.body.style.backgroundColor = 'transparent';
    new MutationObserver(function () { s.setAttribute('night', dark() ? '1' : '0'); }).observe(de, { attributes: true, attributeFilter: ['data-mode'] });
  }
  function init() {
    if (!D) return;
    try { sky(); } catch (e) {}
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
