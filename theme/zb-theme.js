/* zb-theme — one light/dark setting for the whole zoltonbaize.com site.
   - The site starts light; only a visitor's choice (saved as localStorage 'zb-home-mode') makes it dark, on every page.
   - Dark: .page_root gets .is-dark (Webflow's dark variable mode), <html data-mode="dark"> and .zb-night (the custom scripts),
     <zb-sky night="1">, and every .theme_toggle shows "Light" with a sun.
   - Works alongside the Work page's own toggle embed: if that embed already flipped the mode on a click, this only syncs;
     on pages without it (About, password pages) this does the toggling.
   - Fires a 'zb-theme' event on window after every change so the About sky and Zoltbot switch at once.
   - The Gold case study keeps its own mode and is left alone; Gold's password screen (same address, before it unlocks)
     uses this one like every other password page. */
(function () {
  'use strict';
  if (window.__zbTheme) return; window.__zbTheme = true;
  // /gold: the unlocked case study has its own light/dark, but its password screen is a normal site page.
  // The page isn't parsed yet, so decide once it is: password form there -> run as usual; otherwise stay out of it.
  if (/^\/gold\b/.test(location.pathname)) {
    var later = function () { if (document.querySelector('form[action*="wf_auth"], .utility-page-form')) start(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', later); else later();
    return;
  }
  start();
  function start() {
  var KEY = 'zb-home-mode', de = document.documentElement;
  function saved() {
    try {
      var v = localStorage.getItem(KEY);
      if (v) return v === 'dark';
      var old = localStorage.getItem('zbTheme');   // the old key the password and About drafts used
      if (old) { localStorage.setItem(KEY, old === 'dark' ? 'dark' : 'light'); return old === 'dark'; }
    } catch (e) {}
    return false;
  }
  var dark = saved();
  function paint() {
    de.setAttribute('data-mode', dark ? 'dark' : 'light');
    de.classList.toggle('zb-night', dark);
    var roots = document.querySelectorAll('.page_root');
    for (var i = 0; i < roots.length; i++) roots[i].classList.toggle('is-dark', dark);
    var skies = document.querySelectorAll('zb-sky');
    for (var j = 0; j < skies.length; j++) skies[j].setAttribute('night', dark ? '1' : '0');
    var tg = document.querySelectorAll('.theme_toggle');
    for (var k = 0; k < tg.length; k++) {
      var t = tg[k], l = t.querySelector('.theme_label'), ic = t.querySelector('i');
      if (l) l.textContent = dark ? 'Light' : 'Dark';
      if (ic) ic.className = dark ? 'ph ph-sun' : 'ph ph-moon-stars';
      t.setAttribute('role', 'button'); t.setAttribute('tabindex', '0');
      t.setAttribute('aria-pressed', dark ? 'true' : 'false');
      t.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    try { window.dispatchEvent(new Event('zb-theme')); } catch (e) {}
  }
  function set(v) { dark = !!v; try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (e) {} paint(); }
  window.zbTheme = { isDark: function () { return dark; }, set: set, toggle: function () { set(!dark); } };

  de.setAttribute('data-mode', dark ? 'dark' : 'light');   // early, so custom scripts read the right mode before the page paints
  de.classList.toggle('zb-night', dark);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paint); else paint();
  setTimeout(paint, 0);   // after any page embed has run its own DOMContentLoaded setup

  // Clicks: note the mode before the click, then see whether the page's own toggle (the Work embed) already flipped it.
  var before = null;
  function press(e) {
    var t = e.target && e.target.closest && e.target.closest('.theme_toggle');
    if (!t) return;
    before = de.getAttribute('data-mode');
    setTimeout(function () {
      var now = de.getAttribute('data-mode');
      if (now !== before) { dark = now === 'dark'; try { localStorage.setItem(KEY, dark ? 'dark' : 'light'); } catch (err) {} paint(); }
      else set(!dark);
    }, 0);
  }
  document.addEventListener('click', press, true);
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.closest && e.target.closest('.theme_toggle')) { e.preventDefault(); e.target.click(); }
  });
  // Another tab changed it
  addEventListener('storage', function (e) { if (e.key === KEY) { dark = e.newValue === 'dark'; paint(); } });
  }
})();
