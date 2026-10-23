/* zb-spatial — sky-world page transitions for zoltonbaize.com (cross-document View Transitions).
   Work center, About right, Contact further right; case studies push forward; unlocking a password page flies through the glass.
   Load in <head> WITHOUT defer/async so it is ready before the page first renders. */
(function () {
  var st = document.createElement('style');
  st.textContent = "@view-transition { navigation: auto; }\nzb-sky { view-transition-name: zb-sky; }\n::view-transition-group(root), ::view-transition-group(zb-sky) { animation-duration: 300ms; }\n:root { --zb-pan: cubic-bezier(.2,.8,.2,1); --zb-fade: cubic-bezier(.65,0,.35,1); }\n\n/* pan right: the page on the right slides in, the sky drifts less (depth) */\n:root:active-view-transition-type(zb-right)::view-transition-old(root) { animation: 300ms var(--zb-pan) both zb-to-left; }\n:root:active-view-transition-type(zb-right)::view-transition-new(root) { animation: 300ms var(--zb-pan) both zb-from-right; }\n:root:active-view-transition-type(zb-right)::view-transition-old(zb-sky) { animation: 300ms var(--zb-pan) both zb-sky-to-left; }\n:root:active-view-transition-type(zb-right)::view-transition-new(zb-sky) { animation: 300ms var(--zb-pan) both zb-sky-from-right; }\n/* pan left */\n:root:active-view-transition-type(zb-left)::view-transition-old(root) { animation: 300ms var(--zb-pan) both zb-to-right; }\n:root:active-view-transition-type(zb-left)::view-transition-new(root) { animation: 300ms var(--zb-pan) both zb-from-left; }\n:root:active-view-transition-type(zb-left)::view-transition-old(zb-sky) { animation: 300ms var(--zb-pan) both zb-sky-to-right; }\n:root:active-view-transition-type(zb-left)::view-transition-new(zb-sky) { animation: 300ms var(--zb-pan) both zb-sky-from-left; }\n/* forward into a case study, back out of one */\n:root:active-view-transition-type(zb-forward)::view-transition-old(root) { animation: 360ms var(--zb-pan) both zb-push-out; }\n:root:active-view-transition-type(zb-forward)::view-transition-new(root) { animation: 360ms var(--zb-pan) both zb-push-in; }\n:root:active-view-transition-type(zb-back)::view-transition-old(root) { animation: 300ms var(--zb-pan) both zb-pull-out; }\n:root:active-view-transition-type(zb-back)::view-transition-new(root) { animation: 300ms var(--zb-pan) both zb-pull-in; }\n/* unlocked a password page: fly forward through the glass card */\n:root:active-view-transition-type(zb-unlock)::view-transition-old(root) { animation: 460ms var(--zb-pan) both zb-unlock-out; }\n:root:active-view-transition-type(zb-unlock)::view-transition-new(root) { animation: 460ms var(--zb-pan) both zb-push-in; }\n/* anything else: a quick crossfade */\n:root:active-view-transition-type(zb-fade)::view-transition-old(root) { animation: 200ms var(--zb-fade) both zb-fade-out; }\n:root:active-view-transition-type(zb-fade)::view-transition-new(root) { animation: 200ms var(--zb-fade) both zb-fade-in; }\n\n@keyframes zb-to-left { to { transform: translateX(-100vw); } }\n@keyframes zb-from-right { from { transform: translateX(100vw); } }\n@keyframes zb-to-right { to { transform: translateX(100vw); } }\n@keyframes zb-from-left { from { transform: translateX(-100vw); } }\n@keyframes zb-sky-to-left { to { transform: translateX(-18vw); opacity: 0; } }\n@keyframes zb-sky-from-right { from { transform: translateX(18vw); opacity: 0; } }\n@keyframes zb-sky-to-right { to { transform: translateX(18vw); opacity: 0; } }\n@keyframes zb-sky-from-left { from { transform: translateX(-18vw); opacity: 0; } }\n@keyframes zb-push-out { to { transform: scale(1.12); opacity: 0; } }\n@keyframes zb-push-in { from { transform: scale(.9); opacity: 0; } }\n@keyframes zb-pull-out { to { transform: scale(.9); opacity: 0; } }\n@keyframes zb-pull-in { from { transform: scale(1.12); opacity: 0; } }\n@keyframes zb-unlock-out { to { transform: scale(1.22); opacity: 0; filter: blur(8px); } }\n@keyframes zb-fade-out { to { opacity: 0; } }\n.zb-toast { position: fixed; top: calc(18px + env(safe-area-inset-top, 0px)); left: 50%; transform: translate(-50%, -8px); z-index: 2147483000; padding: 10px 16px; border-radius: 999px; background: rgba(255,255,255,.55); border: 1px solid rgba(255,255,255,.9); box-shadow: 0 12px 30px -16px rgba(4,34,58,.45); backdrop-filter: blur(14px) saturate(150%); -webkit-backdrop-filter: blur(14px) saturate(150%); font: 600 13px system-ui, -apple-system, sans-serif; color: #07283D; opacity: 0; transition: opacity 300ms var(--zb-pan), transform 300ms var(--zb-pan); pointer-events: none; }\n.zb-toast.on { opacity: 1; transform: translate(-50%, 0); }\n@keyframes zb-fade-in { from { opacity: 0; } }\n\n@media (prefers-reduced-motion: reduce) {\n  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }\n}\n";
  document.head.appendChild(st);
})();
(function () {
  // Where each page sits in the sky: x = left/right position, d = depth (case studies are forward).
  function place(href) {
    var u; try { u = new URL(href, location.href); } catch (e) { return null; }
    if (u.origin !== location.origin) return null;
    var p = u.pathname.replace(/\/+$/, '') || '/';
    if (p === '/') return { x: 0, d: 0 };
    if (p.indexOf('/about') === 0) return { x: 1, d: 0 };
    if (p.indexOf('/contact') === 0) return { x: 2, d: 0 };
    if (p.indexOf('/project/') === 0 || p === '/gold') return { x: 0, d: 1 };
    return null;
  }
  function kind(from, to) {
    var a = place(from), b = place(to);
    if (!a || !b) return 'zb-fade';
    if (b.d > a.d) return 'zb-forward';
    if (b.d < a.d) return 'zb-back';
    if (b.x > a.x) return 'zb-right';
    if (b.x < a.x) return 'zb-left';
    return 'zb-fade';
  }
  var KEY = 'zbTransition';
  function unlocking() { try { return sessionStorage.getItem('zbUnlock') === '1'; } catch (e) { return false; } }
  function toast(text) {
    function show() { var t = document.createElement('div'); t.className = 'zb-toast'; t.setAttribute('role', 'status'); t.textContent = text; document.body.appendChild(t); requestAnimationFrame(function () { t.classList.add('on'); }); setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 400); }, 2600); }
    document.body ? show() : document.addEventListener('DOMContentLoaded', show);
  }
  function remember(to, k) { try { sessionStorage.setItem(KEY, JSON.stringify({ to: new URL(to, location.href).href, k: k })); } catch (e) {} }

  // Leaving a page: decide the move from here to there (and keep it for browsers without the Navigation API).
  addEventListener('pageswap', function (e) {
    var to = e.activation && e.activation.entry && e.activation.entry.url;
    if (!to) return;
    var k = unlocking() ? 'zb-unlock' : kind(location.href, to);
    remember(to, k);
    if (e.viewTransition) e.viewTransition.types.add(k);
  });
  // Your name in the header replays the intro: from any page it goes to Work with the splash (Work's ?splash forces it).
  // The Z logo next to it stays a plain link to Work.
  addEventListener('click', function (e) {
    var name = e.target.closest && e.target.closest('.nav_brand');
    if (!name || e.target.closest('svg, .nav_mark') || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); e.stopPropagation();
    location.href = '/?splash';
  }, true);
  // Fallback for browsers that skip pageswap: remember the clicked link's move.
  addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (a && !a.target && !e.metaKey && !e.ctrlKey && !e.shiftKey) remember(a.href, kind(location.href, a.href));
  }, true);

  // Arriving: apply the same move to the incoming page.
  addEventListener('pagereveal', function (e) {
    if (unlocking()) {
      // Arrived from the password page. If this is the password page again (wrong password, page reloaded), it didn't unlock.
      const gate = () => !!document.querySelector('form[action*="wf_auth"], .w-password-page');
      try { sessionStorage.removeItem('zbUnlock'); } catch (err) {}
      if (!gate() && e.viewTransition) e.viewTransition.types.add('zb-unlock');
      const done = () => { if (!gate()) toast('Unlocked. Welcome in.'); };
      document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', done) : done();
      return;
    }
    if (!e.viewTransition) return;
    var k = null;
    var act = window.navigation && navigation.activation;
    if (act && act.from && act.from.url) k = kind(act.from.url, location.href);
    if (!k) {
      try { var s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s && s.to === location.href) k = s.k; } catch (err) {}
    }
    e.viewTransition.types.add(k || 'zb-fade');
  });
})();
