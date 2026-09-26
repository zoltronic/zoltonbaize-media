/* Coin hero — a scroll-scrubbed frame sequence (alpha). It starts once the element is fully in view and
   finishes just before it starts to leave; the frames after `split` follow the pointer.
   Markup: <div class="coin_hero" data-frames="…/coin_%03d.webp" data-count="80" data-aspect="2.5" data-split="52"></div>
   Knobs (window.COIN_HERO_CONFIG or data-attributes):
     endMargin   how close to the top the element gets when the sequence completes, as a fraction of viewport height (default 0.08)
     lead        fraction of viewport height the sequence starts before the element is fully in view (default 0; negative delays it)
     split       last frame driven by scroll; frames after it are driven by the pointer (default: last frame)
     tilt        max CSS tilt in degrees on hover (default 0 = none) */
const CFG = Object.assign({ endMargin: 0.08, lead: 0, tilt: 0, ease: 0.12 }, window.COIN_HERO_CONFIG || {});
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
for (const el of document.querySelectorAll('.coin_hero')) setup(el);

function setup(el) {
  const pattern = el.dataset.frames, count = parseInt(el.dataset.count, 10) || 1, aspect = parseFloat(el.dataset.aspect) || 2.5;
  const split = Math.min(count - 1, parseInt(el.dataset.split ?? CFG.split ?? (count - 1), 10));
  const endMargin = parseFloat(el.dataset.endMargin ?? CFG.endMargin), lead = parseFloat(el.dataset.lead ?? CFG.lead), tiltMax = parseFloat(el.dataset.tilt ?? CFG.tilt);
  el.style.position = el.style.position || 'relative'; el.style.aspectRatio = String(aspect); el.style.width = '100%';
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%;will-change:transform'; el.appendChild(canvas);
  if (tiltMax) el.style.perspective = '900px';
  const ctx = canvas.getContext('2d');
  const frames = new Array(count); let loaded = 0;
  const url = i => pattern.replace(/%0(\d)d/, (_, w) => String(i).padStart(+w, '0'));
  function load(i) { if (frames[i]) return; const im = new Image(); im.decoding = 'async'; im.src = url(i); frames[i] = im; im.onload = () => { loaded++; if (i === Math.round(current)) draw(); }; }
  load(0); for (let i = 1; i < count; i++) setTimeout(() => load(i), 12 * i);

  let current = 0, target = 0, hover = 0, hoverT = 0, tiltX = 0, tiltY = 0, raf = 0;
  function draw() {
    const w = el.clientWidth, h = el.clientHeight, pr = Math.min(devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(w * pr) || canvas.height !== Math.round(h * pr)) { canvas.width = Math.round(w * pr); canvas.height = Math.round(h * pr); }
    const im = nearest(Math.round(current)); if (!im) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const s = Math.min(canvas.width / im.naturalWidth, canvas.height / im.naturalHeight); const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
    ctx.drawImage(im, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }
  function nearest(i) { for (let d = 0; d < count; d++) { const a = frames[i - d], b = frames[i + d]; if (a && a.complete && a.naturalWidth) return a; if (b && b.complete && b.naturalWidth) return b; } return null; }
  // 0 when the element's bottom edge has just entered the viewport (fully in view), 1 when its top reaches the end margin
  function progress() { const r = el.getBoundingClientRect(), vh = innerHeight; const start = vh + lead * vh, end = endMargin * vh + r.height; const p = (start - r.bottom) / Math.max(1, start - end); return Math.max(0, Math.min(1, p)); }
  function tick() {
    raf = 0;
    const p = reduce ? 1 : progress();
    const tail = (count - 1 - split) * hoverT;
    target = p * split + (p >= 0.999 ? tail : 0);
    current += (target - current) * (reduce ? 1 : 0.35);
    if (tiltMax) { tiltX += ((hover ? -pointer.y * tiltMax : 0) - tiltX) * CFG.ease; tiltY += ((hover ? pointer.x * tiltMax : 0) - tiltY) * CFG.ease; canvas.style.transform = `rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`; }
    draw();
    if (Math.abs(target - current) > 0.05 || Math.abs(tiltX) + Math.abs(tiltY) > 0.05 || hover) raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
  const pointer = { x: 0, y: 0 };
  addEventListener('scroll', kick, { passive: true }); addEventListener('resize', () => { draw(); kick(); });
  el.addEventListener('pointerenter', () => { hover = 1; kick(); });
  el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1; pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1; hoverT = Math.max(0, Math.min(1, (pointer.x + 1) / 2)); kick(); });
  el.addEventListener('pointerleave', () => { hover = 0; hoverT = 0; kick(); });
  new IntersectionObserver(kick, { threshold: [0, 0.25, 0.5, 0.75, 1] }).observe(el);
  kick();
  el.classList.add('is-live');
  (window.__coinHeroes ||= []).push({ el, get frame() { return current; }, get progress() { return progress(); }, seek(i) { current = target = i; draw(); }, CFG });
}
