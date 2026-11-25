/* zb-404 — the 404 page: Zoltbot lost in the stratosphere.
   - Sky: deep blue fading to faint stars at the top, the cloud sea (clouds/sea-1, sea-2) drifting below. Night mode follows zb-theme (html.zb-night).
   - Zoltbot drifts and bounces off the screen edges like the DVD logo. His face reads 404 (eyes are 4s, mouth an O),
     his display colour changes on every bounce, and a dead-on corner hit flashes !!! with a burst of confetti.
   - Any move, scroll, tap or key wakes him: he floats over and opens his chat ("Oh hey, you found me out here...").
     Asked for a page (Work, About, Gold, ATM, Icons) he takes you there. After a while alone he drifts off again.
   How it plugs in: the page's head sets window.__zbBotLoad = 1, so the site-wide Zoltbot loader stands down here, and this
   script loads Zoltbot itself with window.__zbHooks (anchor / face / faceCol / greet / onSend), which zb-password.js reads.
   The clouds are about/zb-about.js with its camera and sky colours swapped at load time (falls back to the About look). */
(function () {
  'use strict';
  var GH = 'https://cdn.jsdelivr.net/gh/zoltronic/zoltonbaize-media@';
  var BOT = GH + 'b6c958b1823dcfaf27eb2df706f3642e18010f40/password/zb-password.js';   // has the 404 hooks and the Easter eggs built in
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var de = document.documentElement;
  var night = function () { return de.classList.contains('zb-night'); };
  de.classList.add('zb-lost');

  // ---------- Stratosphere sky ----------
  var sky = document.createElement('div'); sky.className = 'nf_sky'; sky.setAttribute('aria-hidden', 'true');
  var stars = document.createElement('canvas'); stars.className = 'nf_stars';
  sky.append(stars);
  document.body.prepend(sky);
  // Clouds: the About page's live cloud engine (about/zb-about.js), lifted into the stratosphere: the camera sits above the
  // cloud tops, so the soft cumulus fills the lower half, and the sky gradient runs from near-black blue to pale blue.
  var ABOUT = GH + 'de34a4ec503ae3bdd1793b8ed2260b62f1c03676/about/zb-about.js';
  window.ZB_ABOUT_CLOUDS = { count: 22, seed: 3, near: 20, depth: 46, typeTop: 0.12, typeBottom: 0.12, travel: 0 };
  var ABOUT_PATCH = [
    ['const VIEW = V(-0.12, -0.11, -1).normalize();', 'const VIEW = V(-0.04, 0.02, -1).normalize();'],
    ['const START = V(0, 2.6, 26);', 'const START = V(0, 5.6, 26);'],
    ["const WG = ['#1E7FC4', '#7FD0F0', '#CFEBF9', '#F6E9D2']", "const WG = ['#030D24', '#0E3474', '#3F8BCB', '#BFE3F6']"]];
  var st = [];
  for (var i = 0; i < 170; i++) st.push({ x: Math.random(), y: Math.pow(Math.random(), 1.8) * 0.62, r: 0.4 + Math.random() * 1.1, a: 0.25 + Math.random() * 0.75, tw: Math.random() < 0.3 ? 0.6 + Math.random() * 2 : 0, ph: Math.random() * 6.28 });
  var sg = stars.getContext('2d');
  function drawStars(t) {
    var dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
    if (stars.width !== Math.round(w * dpr) || stars.height !== Math.round(h * dpr)) { stars.width = Math.round(w * dpr); stars.height = Math.round(h * dpr); }
    sg.setTransform(dpr, 0, 0, dpr, 0, 0); sg.clearRect(0, 0, w, h);
    var k = night() ? 1 : 0.55;   // faint by day up here, brighter at night
    for (var j = 0; j < st.length; j++) {
      var s = st[j], fade = 1 - s.y / 0.62, a = s.a * k * fade * (s.tw && !reduce ? 0.55 + 0.45 * Math.sin(t * s.tw + s.ph) : 1);
      sg.globalAlpha = a; sg.fillStyle = '#EAF6FF'; sg.beginPath(); sg.arc(s.x * w, s.y * h, s.r, 0, 6.283); sg.fill();
    }
    if (!reduce) requestAnimationFrame(function (n) { drawStars(n / 1000); });
  }
  requestAnimationFrame(function (n) { drawStars(n / 1000); });
  addEventListener('resize', function () { if (reduce) drawStars(0); });

  // ---------- Hooks the bot picks up when it starts ----------
  var PAL = [[95, 244, 255], [255, 92, 214], [255, 226, 84], [96, 255, 150], [255, 150, 64], [176, 128, 255]];
  var H = window.__zbHooks = { lost: true, faceCol: PAL[0] };
  var S = function () { return window.__zbBus || H; };   // the bot copies these hooks into its own state (bus) when it starts
  var ci = 0, cornerUntil = 0, blinkAt = 3, px = null, py = null, vx = 0, vy = 0, lastT = 0, lostSince = 0;
  var SPEED = 105;   // px/s, slow and floaty

  function startDrift() {
    var a = (Math.random() * 0.5 + 0.25) * Math.PI / 2 + Math.floor(Math.random() * 4) * Math.PI / 2;   // never too flat or too steep
    vx = Math.cos(a) * SPEED; vy = Math.sin(a) * SPEED; lostSince = performance.now();
  }
  startDrift();

  function confetti(x, y) {
    if (reduce) return;
    for (var n = 0; n < 36; n++) {
      var p = document.createElement('i'); p.className = 'nf_bit';
      var c = PAL[n % PAL.length], ang = Math.random() * 6.283, d = 80 + Math.random() * 160;
      p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;background:rgb(' + c + ');--dx:' + (Math.cos(ang) * d).toFixed(0) + 'px;--dy:' + (Math.sin(ang) * d - 60).toFixed(0) + 'px;--r:' + (Math.random() * 720 - 360).toFixed(0) + 'deg;animation-delay:' + (Math.random() * 80).toFixed(0) + 'ms';
      document.body.appendChild(p); setTimeout(p.remove.bind(p), 1500);
    }
  }

  // Where he is: drifting (lost), or beside the text once woken. s = his box size.
  H.anchor = function (s, chatUp) {
    if (chatUp) return null;
    var dock = document.querySelector('.zb-pw-dock'), mobile = innerWidth < 820;
    var sc = mobile ? 0.8 : 0.9, R = s * sc * 0.3;   // radius of his visible head, near enough
    if (!H.lost) {   // awake, chat closed: hovering just above the heading
      var t = document.querySelector('.nf_title'), b = t ? t.getBoundingClientRect() : { left: innerWidth / 2, right: innerWidth / 2, top: innerHeight / 2 };
      return [innerWidth / 2 - s / 2, b.top - R * 1.7 - s / 2];
    }
    var now = performance.now(), dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 0; lastT = now;
    if (px === null) { px = innerWidth * (0.25 + Math.random() * 0.5); py = innerHeight * (0.2 + Math.random() * 0.25); }
    if (!reduce) { px += vx * dt; py += vy * dt; }
    var hitX = false, hitY = false, minX = R, maxX = innerWidth - R, minY = R * 0.9, maxY = innerHeight - R * 1.25;
    if (px < minX) { px = minX; vx = Math.abs(vx); hitX = true; } else if (px > maxX) { px = maxX; vx = -Math.abs(vx); hitX = true; }
    if (py < minY) { py = minY; vy = Math.abs(vy); hitY = true; } else if (py > maxY) { py = maxY; vy = -Math.abs(vy); hitY = true; }
    // a corner counts if both walls are hit within a few pixels of each other
    var nearX = px - minX < 6 || maxX - px < 6, nearY = py - minY < 6 || maxY - py < 6;
    if (hitX || hitY) {
      ci = (ci + 1 + Math.floor(Math.random() * (PAL.length - 2))) % PAL.length; S().faceCol = PAL[ci];
      if (nearX && nearY && now > cornerUntil) { cornerUntil = now + 1400; S().hopReq = true; confetti(px, py); }
    }
    return [px - s / 2, py - s / 2];
  };

  // His LED face while lost: 4 O 4, a blink now and then, !!! on a corner hit
  H.face = function (g, W, Hh, c, t) {
    if (!H.lost) return false;
    var cx = W / 2, corner = performance.now() < cornerUntil;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (corner) {
      g.font = '900 150px "JetBrains Mono", ui-monospace, monospace';
      [-1, 1].forEach(function (s) { g.fillText('!!!', cx + s * 112, 140); });
      g.lineWidth = 16; g.beginPath(); g.ellipse(cx, 264, 40, 40, 0, 0, 6.283); g.stroke();
      return true;
    }
    if (t > blinkAt) blinkAt = t + 2.5 + Math.random() * 3.5;
    var blink = blinkAt - t > 0 && blinkAt - t < 0.12;
    if (blink) { g.lineWidth = 20; [-1, 1].forEach(function (s) { g.beginPath(); g.moveTo(cx + s * 112 - 50, 146); g.lineTo(cx + s * 112 + 50, 146); g.stroke(); }); }
    else { g.font = '900 172px "Schibsted Grotesk", system-ui, sans-serif'; [-1, 1].forEach(function (s) { g.fillText('4', cx + s * 128, 150); }); }
    g.lineWidth = 20; g.beginPath(); g.ellipse(cx, 212, 26, 44, 0, 0, 6.283); g.stroke();   // his surprised mouth: a zero between the 4s, set lower so it's still a mouth (4 0 4)
    return true;
  };

  // ---------- Z z z: while he's lost he's half asleep, little Z's drift up off his head ----------
  function snooze() {
    if (H.lost && !reduce && !document.hidden) {
      var d = document.querySelector('.zb-pw-dock');
      if (d) {
        var r = d.getBoundingClientRect(), R = r.width * 0.3, col = S().faceCol || PAL[0], z = document.createElement('span');
        z.className = 'nf_z'; z.textContent = 'Z';
        var big = 0.7 + Math.random() * 0.6;
        z.style.cssText = 'left:' + (r.left + r.width / 2 + R * 0.55).toFixed(0) + 'px;top:' + (r.top + r.height / 2 - R * 0.95).toFixed(0) + 'px;color:rgb(' + col + ');font-size:' + (22 * big).toFixed(0) + 'px;--zx:' + (18 + Math.random() * 30).toFixed(0) + 'px';
        document.body.appendChild(z); setTimeout(z.remove.bind(z), 2600);
      }
    }
    setTimeout(snooze, 700 + Math.random() * 500);
  }
  setTimeout(snooze, 1200);

  // ---------- Waking up ----------
  var moved = 0, lastX = null, lastY = null, t0 = performance.now(), idleTimer = 0;
  function wake(e) {
    if (e && e.target && e.target.closest && e.target.closest('a')) return;   // heading home: let them go
    poked();
    if (!H.lost) return;
    var b = S(); H.lost = b.lost = false; b.faceCol = null; de.classList.remove('zb-lost');
    b.mood = 'curious'; b.moodUntil = performance.now() / 1000 + 1.2;
    setTimeout(function () { if (window.zbChat) window.zbChat.open(); }, 650);
  }
  // He drifts off again after a while alone with his chat closed
  function poked() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      var b = window.__zbBus;
      if (b && b.chatOpen) return poked();
      H.lost = true; S().faceCol = PAL[ci];
      var d = document.querySelector('.zb-pw-dock'), r = d && d.getBoundingClientRect();
      if (r) { px = r.left + r.width / 2; py = r.top + r.height / 2; }
      lastT = 0; startDrift(); de.classList.add('zb-lost');
    }, 20000);
  }
  var GRACE = 1500;   // let the drift read for a moment before a stray mouse wiggle wakes him
  addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    if (lastX !== null) moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY;
    if (H.lost && performance.now() - t0 > GRACE && moved > 60) wake(e);
    if (!H.lost) poked();
  }, { passive: true });
  ['pointerdown', 'wheel', 'keydown', 'touchstart', 'scroll'].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  // tapping him wakes him too (the bot's own click handler then toggles his chat)

  // ---------- Chat: first line, and taking people where they meant to go ----------
  var asking = false;
  var DEST = [
    [/\b(home|work|portfolio|projects?|case stud(y|ies)|main)\b/, '/', 'the Work page'],
    [/\b(about|bio|who is|resume|cv)\b/, '/about', 'About'],
    [/\bgold\b/, '/gold', 'the Gold case study'],
    [/\batm\b/, '/atm', 'the ATM case study'],
    [/\b(icons?|iconography)\b/, '/iconography', 'the Icons case study']];
  H.greet = function (say, setChips) {
    asking = true;
    say('Oh hey, you found me out here. What page were you looking for? I can take you there.', 'bot');
    setChips(['Work', 'About', 'Gold case study', 'Send Zolton a message']);
  };
  H.onSend = function (text, say, setChips) {
    var t = text.toLowerCase(), wants = asking || /\b(take me|go to|bring me|show me|open|where is)\b/.test(t);
    asking = false;
    if (!wants || /\b(message|contact|email|hire|role)\b/.test(t)) return false;
    for (var k = 0; k < DEST.length; k++) {
      if (DEST[k][0].test(t)) {
        say(text, 'me', true); setChips([]);
        say('Hold on, flying you to ' + DEST[k][2] + '…', 'bot', true);
        var b = window.__zbBus; if (b) { b.hopReq = true; b.mood = 'happy'; b.moodUntil = performance.now() / 1000 + 2; }
        setTimeout(function (p) { location.href = p; }.bind(null, DEST[k][1]), 1100);
        return true;
      }
    }
    return false;
  };

  // ---------- Load Zoltbot with the hooks ----------
  function patched(url, list, then) {
    fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (code) {
      for (var p = 0; p < list.length; p++) { if (code.indexOf(list[p][0]) < 0) throw new Error('zb-404: hook not found in ' + url); code = code.replace(list[p][0], list[p][1]); }
      run(URL.createObjectURL(new Blob([code + '\n//# sourceURL=' + url.split('/').pop().replace('.js', '+404.js')], { type: 'text/javascript' })));
    }).catch(function (e) { console.warn(e); then && then(); run(url); });
  }
  patched(ABOUT, ABOUT_PATCH);
  function run(src) { var s = document.createElement('script'); s.src = src; document.body.appendChild(s); }
  run(BOT);
})();
