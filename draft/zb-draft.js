/* zb-draft — "Draft Controls": one tuning panel for every page of zoltonbaize.com, for Zolton only.
   Shows on the webflow.io preview, or on the live site with ?tune in the address. Visitors never see it.
   Page scripts add their own groups of sliders:  (window.zbDraft ? zbDraft.add(g) : (window.__zbDraftQ = window.__zbDraftQ || []).push(g))
     g = { id, title, open, rows: [[key, label, min, max, step], ...], values, defaults, onChange(key), buttons: [[label, fn]], store, order }
   values is the script's own settings object; the panel edits it in place, saves it (localStorage, key g.store or 'zbDraft:'+id)
   and calls onChange. Saved settings are reapplied when the page loads. "Copy settings" copies every group as JSON to send to Claude.
   Built in: an adapter for the About page cloud field (window.zbAbout), and Light / dark, Reset and Copy for every page. */
(function () {
  'use strict';
  if (window.zbDraft) return;
  var on = /\.webflow\.io$/.test(location.hostname) || /[?&]tune\b/.test(location.search);
  var html = document.documentElement, groups = [], box = null, list = null, ta = null;
  function load(g) { try { return JSON.parse(localStorage.getItem(g.store || 'zbDraft:' + g.id) || 'null'); } catch (e) { return null; } }
  function save(g) { try { localStorage.setItem(g.store || 'zbDraft:' + g.id, JSON.stringify(g.values)); } catch (e) {} }
  function fmt(v, step) { var d = String(step).split('.')[1]; return (+v).toFixed(d ? d.length : 0); }

  function ui() {
    if (box || !document.body) return;
    var st = document.createElement('style');
    st.textContent = [
      '.zbt{--ink:#0f1a2b;--soft:#4a5b74;--line:rgba(15,26,43,.14);--acc:#2f6fd6;position:fixed;left:16px;bottom:16px;z-index:2147482000;font:12px/1.3 system-ui,-apple-system,sans-serif;color:var(--ink)}',
      '.zbt-chip,.zbt button{font:600 12px system-ui,-apple-system,sans-serif;color:var(--ink);background:rgba(240,246,252,.88);border:1px solid var(--line);border-radius:999px;padding:7px 12px;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}',
      '.zbt-card button{border-radius:6px;padding:5px 9px;background:transparent;-webkit-backdrop-filter:none;backdrop-filter:none}',
      '.zbt button:hover{border-color:var(--acc);color:var(--acc)}',
      '.zbt button:focus-visible,.zbt input:focus-visible,.zbt summary:focus-visible{outline:2px solid var(--acc);outline-offset:2px}',
      '.zbt-card{width:min(300px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow-y:auto;background:rgba(240,246,252,.9);-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);border:1px solid var(--line);border-radius:10px;padding:10px 14px;box-shadow:0 8px 30px rgba(15,26,43,.18)}',
      '.zbt-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:4px}.zbt-head b{font-size:14px}',
      '.zbt-note{font:11px ui-monospace,Menlo,monospace;color:var(--soft)}',
      '.zbt details{border-top:1px solid var(--line)}',
      '.zbt summary{list-style:none;cursor:pointer;padding:8px 0;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;display:flex;justify-content:space-between}',
      '.zbt summary::-webkit-details-marker{display:none}.zbt summary::after{content:"+";color:var(--soft)}.zbt details[open] summary::after{content:"–"}',
      '.zbt-body{display:grid;gap:8px;padding-bottom:10px}',
      '.zbt-row{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center}.zbt-row label{color:var(--soft)}.zbt-row output{font:11px ui-monospace,Menlo,monospace}',
      '.zbt-row input{grid-column:1/-1;width:100%;margin:0;accent-color:var(--acc)}',
      '.zbt-btns{display:flex;flex-wrap:wrap;gap:6px}',
      '.zbt-foot{display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid var(--line);padding-top:10px}',
      '.zbt textarea{width:100%;box-sizing:border-box;font:11px ui-monospace,Menlo,monospace;min-height:90px;border:1px solid var(--line);border-radius:6px}',
      '.zbt [hidden]{display:none!important}',
      '@media (max-width:767px){.zbt{bottom:auto;top:12px;left:12px}}'
    ].join('');
    document.head.appendChild(st);
    box = document.createElement('div'); box.className = 'zbt';
    box.innerHTML = '<button class="zbt-chip" type="button">Draft Controls</button><div class="zbt-card" hidden role="dialog" aria-label="Draft Controls">' +
      '<div class="zbt-head"><b>Draft Controls</b><span class="zbt-note"></span><button type="button" data-a="close" aria-label="Close panel">×</button></div><div class="zbt-groups"></div>' +
      '<div class="zbt-foot"><button type="button" data-a="mode">Light / dark</button><button type="button" data-a="reset">Reset all</button><button type="button" data-a="copy">Copy settings</button><textarea hidden readonly aria-label="Settings as JSON"></textarea></div>' +
      '<div class="zbt-foot zbt-bk"><b style="width:100%;font-size:11px;letter-spacing:.1em;text-transform:uppercase">Backups</b>' +
      '<button type="button" data-a="backup">Save backup</button><select aria-label="Saved backups" style="font:12px system-ui;max-width:100%;flex:1;min-width:120px"></select>' +
      '<button type="button" data-a="restore">Restore</button><button type="button" data-a="load">Load file…</button><input type="file" accept="application/json,.json" hidden></div></div>';
    list = box.querySelector('.zbt-groups'); ta = box.querySelector('textarea');
    var sel = box.querySelector('.zbt-bk select'), file = box.querySelector('.zbt-bk input');
    function fill() { var b = backups(); sel.innerHTML = b.length ? b.map(function (x, i) { return '<option value="' + i + '">' + x.date + '</option>'; }).join('') : '<option value="">No backups yet</option>'; }
    fill();
    file.addEventListener('change', function () { var f = file.files && file.files[0]; if (!f) return; var r = new FileReader();
      r.onload = function () { try { var d = JSON.parse(r.result); restore(d.data || d); } catch (er) { alert('That file isn’t a Draft Controls backup.'); } }; r.readAsText(f); });
    var chip = box.querySelector('.zbt-chip'), card = box.querySelector('.zbt-card');
    api.note = box.querySelector('.zbt-note');
    function show(v) { card.hidden = !v; chip.hidden = v; try { localStorage.setItem('zbDraftOpen', v ? '1' : '0'); } catch (e) {} }
    chip.addEventListener('click', function () { show(true); });
    box.addEventListener('click', function (e) {
      var a = e.target.getAttribute && e.target.getAttribute('data-a'); if (!a) return;
      if (a === 'close') show(false);
      if (a === 'mode') { var t = [].filter.call(document.querySelectorAll('button,a,[role=button]'), function (el) { return !box.contains(el) && /^\s*(light|dark)\s*$/i.test(el.textContent); })[0];
        if (t) t.click(); else html.setAttribute('data-mode', html.getAttribute('data-mode') === 'dark' ? 'light' : 'dark'); }
      if (a === 'reset') { groups.forEach(reset); ta.hidden = true; }
      if (a === 'backup') { var snap = { date: stamp(), site: location.host, data: snapshot() }, b = backups(); b.unshift(snap); b = b.slice(0, 40);
        try { localStorage.setItem('zbDraftBackups', JSON.stringify(b)); } catch (er) {}
        var url = URL.createObjectURL(new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' })), dl = document.createElement('a');
        dl.href = url; dl.download = 'zb-draft-' + snap.date.replace(/[: ]/g, '-') + '.json'; document.body.appendChild(dl); dl.click(); dl.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
        fill(); e.target.textContent = 'Saved'; setTimeout(function () { e.target.textContent = 'Save backup'; }, 1400); }
      if (a === 'restore') { var bb = backups()[+sel.value]; if (bb && confirmRestore(bb.date)) restore(bb.data); }
      if (a === 'load') file.click();
      if (a === 'copy') { var all = {}; groups.forEach(function (g) { var o = {}; g.rows.forEach(function (r) { o[r[0]] = g.values[r[0]]; }); all[g.id] = Object.assign(all[g.id] || {}, o); });
        var json = JSON.stringify({ page: location.pathname, settings: all }, null, 2), b = e.target;
        var fall = function () { ta.value = json; ta.hidden = false; ta.select(); b.textContent = 'Select & copy'; };
        try { navigator.clipboard.writeText(json).then(function () { b.textContent = 'Copied'; ta.hidden = true; setTimeout(function () { b.textContent = 'Copy settings'; }, 1400); }, fall); } catch (er) { fall(); } }
    });
    document.body.appendChild(box);
    var open = /[?&]tune\b/.test(location.search); try { open = open || localStorage.getItem('zbDraftOpen') === '1'; } catch (e) {}
    show(open);
    groups.forEach(render);
  }
  // ---- dated backups: every Draft Controls setting on this site (all pages), kept in this browser and downloaded as a file ----
  function isKey(k) { return /^zbDraft:/.test(k) || k === 'zbSeaTune'; }
  function snapshot() { var o = {}; try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (isKey(k)) o[k] = localStorage.getItem(k); } } catch (e) {} return o; }
  function backups() { try { return JSON.parse(localStorage.getItem('zbDraftBackups') || '[]'); } catch (e) { return []; } }
  function stamp() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; }; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()); }
  function confirmRestore(date) { return window.confirm('Restore the backup from ' + date + '? Your current settings are replaced (save a backup first to keep them).'); }
  function restore(data) {
    if (!data || typeof data !== 'object') return;
    try { Object.keys(snapshot()).forEach(function (k) { localStorage.removeItem(k); }); Object.keys(data).forEach(function (k) { if (isKey(k)) localStorage.setItem(k, data[k]); }); } catch (e) {}
    location.reload();
  }
  function reset(g) { if (!g.defaults) return; g.rows.forEach(function (r) { if (r[0] in g.defaults) g.values[r[0]] = g.defaults[r[0]]; }); save(g); sync(g); if (g.onChange) g.onChange('*'); }
  function sync(g) { if (g.sync) g.sync(); }
  function render(g) {
    if (!list) return;
    var d = document.createElement('details'); if (g.open) d.open = true;
    d.innerHTML = '<summary>' + g.title + '</summary><div class="zbt-body"></div>';
    var body = d.querySelector('.zbt-body'), setters = [];
    g.rows.forEach(function (r) {
      var key = r[0], row = document.createElement('div'); row.className = 'zbt-row';
      var id = 'zbt-' + g.id + '-' + key;
      row.innerHTML = '<label for="' + id + '">' + r[1] + '</label><output></output><input id="' + id + '" type="range" min="' + r[2] + '" max="' + r[3] + '" step="' + r[4] + '">';
      var inp = row.querySelector('input'), out = row.querySelector('output');
      setters.push(function () { inp.value = g.values[key]; out.textContent = fmt(g.values[key], r[4]); });
      inp.addEventListener('input', function () { g.values[key] = +inp.value; out.textContent = fmt(g.values[key], r[4]); save(g); if (g.onChange) g.onChange(key); });
      body.appendChild(row);
    });
    if (g.buttons && g.buttons.length) {
      var bw = document.createElement('div'); bw.className = 'zbt-btns';
      g.buttons.forEach(function (b) { var el = document.createElement('button'); el.type = 'button'; el.textContent = b[0]; el.addEventListener('click', function () { b[1](el); }); bw.appendChild(el); });
      body.appendChild(bw);
    }
    g.sync = function () { setters.forEach(function (f) { f(); }); };
    g.sync();
    // keep groups in their declared order
    d.dataset.order = g.order || 50;
    var after = [].filter.call(list.children, function (c) { return +c.dataset.order > +d.dataset.order; })[0];
    list.insertBefore(d, after || null);
  }
  var api = {
    on: on,
    add: function (g) {
      if (!g || !g.id || !g.values) return;
      var saved = load(g);
      if (saved) { g.rows.forEach(function (r) { if (r[0] in saved) g.values[r[0]] = saved[r[0]]; }); if (g.onChange) try { g.onChange('*'); } catch (e) {} }
      if (!on) return;
      groups.push(g); render(g);
    },
    refresh: function () { groups.forEach(sync); }
  };
  window.zbDraft = api;
  (window.__zbDraftQ || []).splice(0).forEach(api.add);
  window.__zbDraftQ = { push: api.add };
  if (!on) return;
  if (document.body) ui(); else document.addEventListener('DOMContentLoaded', ui);

  // ---- About page: its cloud field (about/zb-about.js exposes window.zbAbout) ----
  var tries = 0;
  (function about() {
    if (window.zbAbout && window.zbAbout.settings) {
      var A = window.zbAbout, S = A.settings, D = {}; for (var k in S) D[k] = S[k];
      var ch = function () { var o = {}; for (var k2 in S) o[k2] = S[k2]; A.set(o); };
      api.add({ id: 'about-flight', title: 'About · scroll flight', open: true, order: 10, values: S, defaults: D, onChange: ch, rows: [
        ['count', 'Clouds', 3, 24, 1], ['travel', 'Scroll speed (distance)', 0, 120, 1], ['depth', 'Parallax depth', 10, 90, 1], ['near', 'Closest cloud', 2, 30, .5],
        ['travelX', 'Direction X', -1, 1, .05], ['travelY', 'Direction Y', -1, 1, .05], ['travelZ', 'Direction Z', -1, 1, .05],
        ['typeTop', 'Cloud type at top (0 humilis · 1 cumulonimbus)', 0, 1, .01], ['typeBottom', 'Cloud type at bottom', 0, 1, .01]],
        buttons: [['New cloud shapes', function () { A.randomize(); }]] });
      api.add({ id: 'about-cloud', title: 'About · cloud look', open: false, order: 11, values: S, defaults: D, onChange: ch, rows: [
        ['sunHeight', 'Sun height', 2, 80, 1], ['sunAzimuth', 'Sun direction', 0, 360, 1], ['sunIntensity', 'Sun intensity', .2, 2.5, .05],
        ['coverage', 'Coverage', .2, .9, .01], ['density', 'Density', .5, 8, .1], ['size', 'Size', .6, 1.6, .01],
        ['billowScale', 'Billow scale', .05, .3, .005], ['detail', 'Edge detail', 0, .7, .01], ['absorption', 'Absorption', .4, 4, .05],
        ['multiScatter', 'Multi-scatter', 0, .7, .01], ['silver', 'Silver lining', 0, .9, .01], ['ambient', 'Ambient', 0, 2, .05], ['exposure', 'Exposure', .4, 2.2, .05],
        ['speed', 'Billow speed', 0, 4, .1]] });
    } else if (++tries < 80) setTimeout(about, 250);
  })();
})();
