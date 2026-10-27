/* zb-analytics — Google Analytics 4 for zoltonbaize.com, plus the portfolio's own events.
   Use: <script>window.ZB_GA_ID='G-XXXXXXXXXX'</script><script src=".../analytics/zb-analytics.js" async></script>
   - Runs only on the live domain (not *.webflow.io or the Designer preview).
   - Visit any page once with ?notrack=1 to stop counting your own visits in this browser (?notrack=0 undoes it).
   - Never sends what people type (chat messages, passwords, emails); only which buttons and links they used.
   Events (all show up in GA4 under Reports > Engagement > Events; mark the starred ones as Key events):
     case_study_click   {case_study}           a Work card or link to /gold, /iconography, /atm
     experience_click * {company}              a logo in the Experience strip
     cta_click        * {cta_text, link_url}   "Let's connect", "Start a project", links to #contact or /contact
     email_click      * {link_url}             any mailto: link
     outbound_click     {link_domain}          any other link off the site (LinkedIn etc.)
     zoltbot_open       {page}                 the chat panel opens
     zoltbot_chip       {chip}                 a suggested-reply button in the chat
     zoltbot_message  * {page}                 a visitor sends a typed message (the text is not sent)
     password_view      {protected_page}       someone reaches a password wall
     password_fail      {protected_page}       a wrong password
     case_study_unlock* {protected_page}       a correct password
     theme_toggle       {mode}                 light/dark switch
     scroll_experience  {}                     the Experience strip scrolls into view (they read to the bottom) */
(function () {
  'use strict';
  if (window.__zbAnalytics) return; window.__zbAnalytics = true;
  var ID = window.ZB_GA_ID;
  if (!ID || !/^G-[A-Z0-9]+$/.test(ID)) return;
  if (!/(^|\.)zoltonbaize\.com$/.test(location.hostname)) return;

  try {
    var q = new URLSearchParams(location.search).get('notrack');
    if (q === '1') localStorage.setItem('zb-notrack', '1');
    if (q === '0') localStorage.removeItem('zb-notrack');
    if (localStorage.getItem('zb-notrack') === '1') return;
  } catch (e) {}

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  var s = document.createElement('script'); s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', ID, { theme: document.documentElement.getAttribute('data-mode') || 'light' });

  function ev(name, params) { try { window.gtag('event', name, params || {}); } catch (e) {} }
  var CASES = { '/gold': 'Bringing Gold to Wells Fargo', '/iconography': 'Drawing One Cohesive System', '/atm': 'A Teaching Machine' };
  var chipAt = 0;   // chip taps also add a "me" line; those aren't typed messages
  var page = location.pathname.replace(/\/$/, '') || '/';
  var text = function (el) { return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80); };

  // ---------- Links and buttons ----------
  document.addEventListener('click', function (e) {
    var t = e.target; if (!t || !t.closest) return;
    var chip = t.closest('.zb-chip');
    if (chip) { chipAt = Date.now(); ev('zoltbot_chip', { chip: text(chip) }); return; }
    if (t.closest('.theme_toggle')) {
      setTimeout(function () { ev('theme_toggle', { mode: document.documentElement.getAttribute('data-mode') }); }, 30);
      return;
    }
    var a = t.closest('a[href]'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) { ev('email_click', { link_url: href.split('?')[0] }); return; }
    if (a.closest('[data-zb-experience]')) { ev('experience_click', { company: (a.textContent || a.getAttribute('aria-label') || '').trim() }); return; }
    var u; try { u = new URL(href, location.href); } catch (err) { return; }
    var path = u.pathname.replace(/\/$/, '');
    if (u.host === location.host) {
      if (CASES[path] && path !== page) { ev('case_study_click', { case_study: CASES[path], from_page: page }); return; }
      if (u.hash === '#contact' || path === '/contact' || a.matches('[data-zb-chat]') || /connect|start a project|get in touch|hire/i.test(text(a))) {
        ev('cta_click', { cta_text: text(a), link_url: u.pathname + u.hash }); return;
      }
      return;
    }
    if (/^https?:$/.test(u.protocol)) ev('outbound_click', { link_domain: u.hostname, link_url: u.origin + u.pathname });
  }, true);

  // ---------- Zoltbot ----------
  function watchChat(el) {
    if (el.__zbWatched) return; el.__zbWatched = true;
    var wasOpen = el.classList.contains('open');
    new MutationObserver(function () {
      var open = el.classList.contains('open');
      if (open && !wasOpen) ev('zoltbot_open', { page: page });
      wasOpen = open;
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
    var log = el.querySelector('.zb-chat-log');
    if (log) new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) {
        var n = muts[i].addedNodes[j];
        if (n.classList && n.classList.contains('me')) {
          if (Date.now() - chipAt > 300) ev('zoltbot_message', { page: page });
        }
      }
    }).observe(log, { childList: true });
  }

  // ---------- Password walls (Webflow's protected pages) ----------
  function passwordPage() {
    var form = document.querySelector('form[action*="wf_auth"]');
    if (!form) return;
    var p = form.querySelector('input[name="path"]');
    var prot = (p && p.value) || page;
    var name = CASES[prot.replace(/\/$/, '')] || prot;
    ev('password_view', { protected_page: name });
    var fail = document.querySelector('.w-form-fail');
    if (fail && getComputedStyle(fail).display !== 'none') ev('password_fail', { protected_page: name });
    addEventListener('zb:unlocked', function () { ev('case_study_unlock', { protected_page: name }); });
  }

  // ---------- Read to the bottom ----------
  function watchExperience() {
    var x = document.querySelector('[data-zb-experience]');
    if (!x || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { ev('scroll_experience', {}); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(x);
  }

  function boot() {
    passwordPage(); watchExperience();
    var found = document.querySelector('.zb-chat');
    if (found) watchChat(found);
    else {   // the chat is added later by zb-password.js
      var mo = new MutationObserver(function () { var c = document.querySelector('.zb-chat'); if (c) { watchChat(c); mo.disconnect(); } });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 20000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
