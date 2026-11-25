// Animated hologram plates for the About scroll story.
// Each plate is a small canvas redrawn on a loop: gauges counting up, a confirmation check drawing in,
// icon-grid construction, research, systems, 3D, UX, UI, terminal, vector, bot, haptics, travel loader.
// Image plates use stills pulled from Zolton's Wells Fargo Figma (prepped as glowing RGBA in ./holo/).

const CY = '#7fe9ff', CY2 = 'rgba(127,233,255,', GR = '#5dfc9a', FONT = 'system-ui,Segoe UI,Helvetica,Arial';
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
const seg = (t, a, b) => ease((t - a) / (b - a));
const loop = (t, period) => (t % period) / period;
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

function frame(g, W, H) { // faint glass panel + bright corner ticks
  g.fillStyle = CY2 + '.07)'; rr(g, 4, 4, W - 8, H - 8, 14); g.fill();
  g.strokeStyle = CY2 + '.45)'; g.lineWidth = 2; g.stroke();
  g.strokeStyle = CY; g.lineWidth = 3; const L = 16;
  for (const [x, y, dx, dy] of [[6, 6, 1, 1], [W - 6, 6, -1, 1], [6, H - 6, 1, -1], [W - 6, H - 6, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y + dy * L); g.lineTo(x, y); g.lineTo(x + dx * L, y); g.stroke(); }
}
function caption(g, W, H, txt) { g.fillStyle = CY2 + '.85)'; g.font = `600 15px ${FONT}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(txt, 16, H - 14); }

// FICO-style gauge: arc fills red→green while the score counts up (his "colour changes as the gauge loads, numbers count up" note)
function gaugeRainbow(g, W, H, t) {
  frame(g, W, H); const p = seg(loop(t, 5), 0.05, 0.6), cx = W / 2, cy = H * 0.62, R = W * 0.33;
  const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
  g.lineCap = 'round'; g.lineWidth = 14; g.strokeStyle = CY2 + '.18)'; g.beginPath(); g.arc(cx, cy, R, a0, a1); g.stroke();
  const score = Math.round(300 + p * 520), hue = 0 + p * 140;
  const grd = g.createConicGradient(a0, cx, cy); grd.addColorStop(0, '#ff6a6a'); grd.addColorStop(0.25, '#ffc86a'); grd.addColorStop(0.45, '#e8ff7a'); grd.addColorStop(0.7, '#62f59a'); grd.addColorStop(1, '#62f59a');
  g.strokeStyle = grd; g.beginPath(); g.arc(cx, cy, R, a0, a0 + (a1 - a0) * p); g.stroke();
  const ex = cx + Math.cos(a0 + (a1 - a0) * p) * (R + 16), ey = cy + Math.sin(a0 + (a1 - a0) * p) * (R + 16);
  g.fillStyle = CY; g.beginPath(); g.arc(ex, ey, 4, 0, 7); g.fill();
  g.fillStyle = `hsl(${hue},95%,75%)`; g.font = `500 52px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(score, cx, cy + 2);
  g.fillStyle = CY; g.font = `600 13px ${FONT}`; g.fillText(score < 580 ? 'POOR' : score < 670 ? 'FAIR' : score < 740 ? 'GOOD' : score < 800 ? 'VERY GOOD' : 'EXCEPTIONAL', cx, cy + 40);
  g.fillStyle = CY2 + '.8)'; g.font = `500 13px ${FONT}`; g.textAlign = 'left'; g.fillText('Your FICO® Score', 16, 26);
}
// slinky tick gauge (2022 motion exploration)
function gaugeTicks(g, W, H, t) {
  frame(g, W, H); const p = seg(loop(t + 2, 4.4), 0.05, 0.62), cx = W / 2, cy = H * 0.64, R = W * 0.34, N = 34;
  for (let i = 0; i < N; i++) { const k = i / (N - 1), a = Math.PI * (0.85 + k * 1.3), on = k <= p, len = on ? 22 + 6 * Math.sin(t * 6 + i * 0.5) * (k > p - 0.08 ? 1 : 0.2) : 14;
    g.strokeStyle = on ? `hsl(${k * 130},95%,${62 + k * 8}%)` : CY2 + '.22)'; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len)); g.stroke(); }
  g.fillStyle = CY; g.font = `300 44px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(300 + p * 482), cx, cy - 4);
  g.font = `500 12px ${FONT}`; g.fillStyle = CY2 + '.7)'; g.fillText('300', cx - R + 8, cy + 34); g.fillText('850', cx + R - 8, cy + 34);
}
// confirmation checkmark: outline loops in, fills, check draws, pops, resets (his loop-to-fill / spiral explorations)
function checkmark(g, W, H, t) {
  const u = loop(t, 3.2), cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.32;
  const ring = seg(u, 0.02, 0.32), fill = seg(u, 0.3, 0.45), chk = seg(u, 0.42, 0.6), out = seg(u, 0.88, 1), pop = 1 + 0.08 * Math.sin(Math.PI * seg(u, 0.58, 0.72));
  g.save(); g.translate(cx, cy); g.scale(pop * (1 - out * 0.3), pop * (1 - out * 0.3)); g.globalAlpha = 1 - out;
  g.strokeStyle = GR; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + ring * Math.PI * 2); g.stroke();
  if (fill > 0) { g.fillStyle = `rgba(40,200,120,${0.75 * fill})`; g.beginPath(); g.arc(0, 0, R * fill, 0, 7); g.fill(); }
  if (chk > 0) { const P = [[-R * 0.42, R * 0.02], [-R * 0.1, R * 0.33], [R * 0.45, -R * 0.3]]; const L1 = Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]), L2 = Math.hypot(P[2][0] - P[1][0], P[2][1] - P[1][1]), d = chk * (L1 + L2);
    g.strokeStyle = '#eafff6'; g.lineWidth = 12; g.shadowColor = GR; g.shadowBlur = 16; g.beginPath(); g.moveTo(...P[0]);
    if (d <= L1) g.lineTo(P[0][0] + (P[1][0] - P[0][0]) * d / L1, P[0][1] + (P[1][1] - P[0][1]) * d / L1);
    else { g.lineTo(...P[1]); const k = (d - L1) / L2; g.lineTo(P[1][0] + (P[2][0] - P[1][0]) * k, P[1][1] + (P[2][1] - P[1][1]) * k); } g.stroke(); }
  g.restore();
}
// icon grid construction: keylines draw in, then the real grid still is revealed by a sweep
function iconGrid(g, W, H, t, img) {
  frame(g, W, H); const u = loop(t, 6), m = 22, s = W - m * 2;
  const k1 = seg(u, 0.0, 0.3), k2 = seg(u, 0.25, 0.65), out = seg(u, 0.9, 1);
  g.globalAlpha = 1 - out;
  if (img && img.complete && img.naturalWidth) { g.save(); g.beginPath(); g.rect(m, m, s * k2, s); g.clip(); g.drawImage(img, m, m, s, s); g.restore(); }
  g.strokeStyle = CY; g.lineWidth = 2; g.setLineDash([6, 6]);
  g.beginPath(); g.moveTo(m, m); g.lineTo(m + s * k1, m + s * k1); g.moveTo(m + s, m); g.lineTo(m + s - s * k1, m + s * k1); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.arc(W / 2, m + s / 2, s * 0.36, 0, Math.PI * 2 * k1); g.stroke();
  const sx = m + s * k2; g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, m); g.lineTo(sx, m + s); g.stroke(); g.globalAlpha = 1;
}
// research: notes drift into affinity clusters while a magnifier scans
function research(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Research · synthesis'); const u = (Math.sin(t * 0.7) + 1) / 2;
  const C = [[70, 70], [178, 80], [124, 150]];
  for (let i = 0; i < 15; i++) { const c = C[i % 3], hx = 28 + ((i * 53) % 200), hy = 30 + ((i * 37) % 130), x = hx + (c[0] + ((i * 7) % 26) - 13 - hx) * u, y = hy + (c[1] + ((i * 11) % 22) - 11 - hy) * u;
    g.fillStyle = ['rgba(255,226,120,.75)', 'rgba(127,233,255,.7)', 'rgba(255,150,200,.7)'][i % 3]; g.fillRect(x - 9, y - 7, 18, 14); }
  const mx = 128 + Math.cos(t * 1.1) * 70, my = 96 + Math.sin(t * 1.7) * 40;
  g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.arc(mx, my, 20, 0, 7); g.stroke(); g.beginPath(); g.moveTo(mx + 14, my + 14); g.lineTo(mx + 30, my + 30); g.stroke();
}
// systems thinking: nodes and links with signals travelling between them
function systems(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Systems'); const N = [[50, 50], [128, 36], [206, 58], [72, 130], [150, 112], [212, 150], [118, 178]], E = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 5], [3, 4], [4, 5], [3, 6], [4, 6], [6, 5]];
  g.strokeStyle = CY2 + '.45)'; g.lineWidth = 2; for (const [a, b] of E) { g.beginPath(); g.moveTo(...N[a]); g.lineTo(...N[b]); g.stroke(); }
  E.forEach(([a, b], i) => { const k = loop(t * 0.8 + i * 0.37, 1); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(N[a][0] + (N[b][0] - N[a][0]) * k, N[a][1] + (N[b][1] - N[a][1]) * k, 3, 0, 7); g.fill(); });
  N.forEach(([x, y], i) => { const r = 9 + 2 * Math.sin(t * 3 + i); g.fillStyle = i === 4 ? 'rgba(255,226,120,.9)' : CY2 + '.35)'; g.strokeStyle = CY; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.stroke(); });
}
// 3D: a rotating wireframe cube on an isometric floor
function cube3d(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, '3D'); const cx = W / 2, cy = H * 0.46, s = 46, a = t * 0.9, b = 0.55;
  const V = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) { const X = x * Math.cos(a) - z * Math.sin(a), Z = x * Math.sin(a) + z * Math.cos(a), Y = y * Math.cos(b) - Z * Math.sin(b), Z2 = y * Math.sin(b) + Z * Math.cos(b); const p = 3.2 / (3.2 + Z2); V.push([cx + X * s * p, cy + Y * s * p]); }
  g.strokeStyle = CY2 + '.25)'; g.lineWidth = 1; for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(cx + i * 22 - 60, cy + 80); g.lineTo(cx + i * 22 + 60, cy + 50); g.stroke(); }
  g.strokeStyle = CY; g.lineWidth = 3; for (let i = 0; i < 8; i++) for (let j = i + 1; j < 8; j++) { const d = (i ^ j); if (d === 1 || d === 2 || d === 4) { g.beginPath(); g.moveTo(...V[i]); g.lineTo(...V[j]); g.stroke(); } }
  g.fillStyle = '#fff'; for (const v of V) { g.beginPath(); g.arc(v[0], v[1], 3, 0, 7); g.fill(); }
}
// UX: a flow of three screens; a cursor hops along the path
function uxFlow(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'UX flow'); const S = [[22, 40], [100, 40], [178, 40]];
  for (const [x, y] of S) { g.strokeStyle = CY; g.lineWidth = 2; rr(g, x, y, 56, 92, 8); g.stroke(); g.fillStyle = CY2 + '.35)'; g.fillRect(x + 8, y + 12, 40, 8); g.fillRect(x + 8, y + 28, 28, 6); rr(g, x + 8, y + 70, 40, 12, 6); g.fill(); }
  g.strokeStyle = CY2 + '.7)'; for (const x of [80, 158]) { g.beginPath(); g.moveTo(x, 86); g.lineTo(x + 18, 86); g.lineTo(x + 12, 81); g.moveTo(x + 18, 86); g.lineTo(x + 12, 91); g.stroke(); }
  const k = loop(t, 3), i = Math.floor(k * 3), f = ease((k * 3) % 1), x = S[i][0] + 28 + (i < 2 ? (S[i + 1][0] - S[i][0]) * seg(f, 0.6, 1) : 0), y = 116;
  g.fillStyle = 'rgba(255,226,120,.95)'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 12, y + 10); g.lineTo(x + 5, y + 11); g.lineTo(x + 2, y + 18); g.closePath(); g.fill();
  if (f < 0.25) { g.strokeStyle = 'rgba(255,226,120,' + (1 - f * 4) + ')'; g.beginPath(); g.arc(x, y, 6 + f * 40, 0, 7); g.stroke(); }
}
// UI: a phone where cards slide up and stack
function uiPhone(g, W, H, t) {
  frame(g, W, H); const px = W / 2 - 52, py = 16, pw = 104, ph = H - 32; g.strokeStyle = CY; g.lineWidth = 3; rr(g, px, py, pw, ph, 16); g.stroke();
  g.fillStyle = CY2 + '.5)'; rr(g, px + 38, py + 8, 28, 6, 3); g.fill();
  const u = loop(t, 3.6);
  for (let i = 0; i < 4; i++) { const k = seg(u, 0.08 + i * 0.12, 0.3 + i * 0.12), y = py + 26 + i * 44 + (1 - k) * 40;
    g.globalAlpha = k * (1 - seg(u, 0.9, 1)); g.fillStyle = i === 0 ? 'rgba(93,252,154,.55)' : CY2 + '.28)'; rr(g, px + 10, y, pw - 20, 36, 8); g.fill(); g.strokeStyle = CY; g.lineWidth = 1.5; g.stroke(); g.globalAlpha = 1; }
}
// terminal: typing commands with a blinking cursor
const TERM = ['$ npm run build', '✓ avatar.glb  2.1 MB', '$ claude "make it rain"', '✓ storm: 1400 drops', '$ git push'];
function terminal(g, W, H, t) {
  frame(g, W, H); g.fillStyle = CY2 + '.2)'; g.fillRect(6, 6, W - 12, 22); for (let i = 0; i < 3; i++) { g.fillStyle = ['#ff7a7a', '#ffd76a', '#5dfc9a'][i]; g.beginPath(); g.arc(20 + i * 14, 17, 4, 0, 7); g.fill(); }
  const chars = Math.floor(loop(t, 7) * 110); let n = chars; g.font = `600 14px ui-monospace,Menlo,monospace`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  let y = 50, lastX = 14;
  for (const line of TERM) { if (n <= 0) break; const s = line.slice(0, n); n -= line.length + 4; g.fillStyle = line.startsWith('✓') ? GR : CY; g.fillText(s, 14, y); lastX = 14 + g.measureText(s).width; y += 24; }
  if (Math.floor(t * 2.5) % 2) { g.fillStyle = CY; g.fillRect(lastX + 3, y - 24 - 13, 9, 16); }
}
// vector: a bezier being edited with the pen tool, handles swinging
function vectorPen(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Vector'); const a = Math.sin(t * 1.3) * 0.9;
  const P0 = [36, 140], P3 = [220, 60], H1 = [96 + Math.cos(a) * 40, 40 + Math.sin(a) * 30], H2 = [160 - Math.cos(a) * 40, 170 - Math.sin(a) * 30];
  g.strokeStyle = CY; g.lineWidth = 4; g.beginPath(); g.moveTo(...P0); g.bezierCurveTo(...H1, ...H2, ...P3); g.stroke();
  g.strokeStyle = CY2 + '.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...P0); g.lineTo(...H1); g.moveTo(...P3); g.lineTo(...H2); g.stroke();
  g.fillStyle = '#fff'; for (const p of [P0, P3]) g.fillRect(p[0] - 5, p[1] - 5, 10, 10);
  g.fillStyle = 'rgba(255,226,120,.95)'; for (const p of [H1, H2]) { g.beginPath(); g.arc(p[0], p[1], 5, 0, 7); g.fill(); }
  const pen = H1; g.save(); g.translate(pen[0] + 8, pen[1] + 8); g.rotate(-0.6); g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(8, 20); g.lineTo(-8, 20); g.closePath(); g.stroke(); g.restore();
}
// bot: friendly head, blinking eyes, typing bubble
function bot(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'AI agents'); const cx = W * 0.36, cy = H * 0.46, bob = Math.sin(t * 2) * 3;
  g.strokeStyle = CY; g.lineWidth = 3; rr(g, cx - 44, cy - 32 + bob, 88, 68, 18); g.stroke(); g.beginPath(); g.moveTo(cx, cy - 32 + bob); g.lineTo(cx, cy - 48 + bob); g.stroke();
  g.fillStyle = 'rgba(255,226,120,' + (0.6 + 0.4 * Math.sin(t * 5)) + ')'; g.beginPath(); g.arc(cx, cy - 52 + bob, 6, 0, 7); g.fill();
  const blink = (t % 3.2) < 0.14 ? 0.15 : 1; g.fillStyle = CY; for (const ex of [-18, 18]) { g.beginPath(); g.ellipse(cx + ex, cy + bob, 8, 9 * blink, 0, 0, 7); g.fill(); }
  g.strokeStyle = CY2 + '.7)'; g.beginPath(); g.arc(cx, cy + 16 + bob, 10, 0.2, Math.PI - 0.2); g.stroke();
  const bx = W * 0.62, by = H * 0.24; g.fillStyle = CY2 + '.22)'; rr(g, bx, by, 76, 34, 14); g.fill(); g.strokeStyle = CY; g.lineWidth = 2; g.stroke();
  for (let i = 0; i < 3; i++) { g.fillStyle = CY; g.beginPath(); g.arc(bx + 22 + i * 16, by + 17 - Math.max(0, Math.sin(t * 6 - i * 0.8)) * 5, 4, 0, 7); g.fill(); }
}
// haptics: preset waveforms pulsing (his Haptics at Wells Fargo presets)
function haptics(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Haptics · Success');
  const pat = [[0.2, 0.5], [0.45, 1], [0.62, 0.7]], u = loop(t, 1.8);
  g.strokeStyle = CY2 + '.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 100); g.lineTo(W - 16, 100); g.stroke();
  for (const [x, h] of pat) { const k = Math.max(0, 1 - Math.abs(u - x) * 6), X = 16 + x * (W - 32), hh = 18 + h * 60 * (0.35 + 0.65 * k);
    g.fillStyle = `rgba(93,252,154,${0.45 + 0.55 * k})`; g.fillRect(X - 7, 100 - hh / 2, 14, hh); if (k > 0.2) { g.strokeStyle = `rgba(93,252,154,${k * 0.6})`; g.beginPath(); g.arc(X, 100, 20 + (1 - k) * 30, 0, 7); g.stroke(); } }
}
// travel loader: the plane loops a dotted route
function travel(g, W, H, t, img) {
  frame(g, W, H); caption(g, W, H, 'Travel loader'); const cx = W / 2, cy = H * 0.5, rx = 92, ry = 44;
  g.fillStyle = CY2 + '.6)'; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 2, 0, 7); g.fill(); }
  const a = t * 1.4, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, dx = -Math.sin(a) * rx, dy = Math.cos(a) * ry;
  g.save(); g.translate(x, y); g.rotate(Math.atan2(dy, dx)); g.fillStyle = 'rgba(255,150,200,.95)';
  g.beginPath(); g.moveTo(26, 0); g.quadraticCurveTo(20, -5, 6, -5); g.lineTo(-22, -4); g.lineTo(-28, -14); g.lineTo(-33, -14); g.lineTo(-30, -2); g.lineTo(-30, 3); g.lineTo(6, 5); g.quadraticCurveTo(20, 5, 26, 0); g.fill();
  g.fillStyle = 'rgba(150,120,255,.95)'; g.beginPath(); g.moveTo(4, 0); g.lineTo(-10, 18); g.lineTo(-16, 18); g.lineTo(-8, 0); g.fill(); g.restore();
  g.fillStyle = CY; g.font = `500 12px ${FONT}`; g.textAlign = 'center'; g.fillText('Loading your favourite flight…', cx, cy + 4);
}
// DTI pie: 10% slice sweeps, number counts
function dtiPie(g, W, H, t) {
  frame(g, W, H); const u = loop(t, 4), p = seg(u, 0.1, 0.5) * 0.1, cx = W / 2, cy = H * 0.46, R = 52;
  g.fillStyle = 'rgba(40,200,120,.45)'; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
  g.fillStyle = 'rgba(93,252,154,.95)'; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.font = `700 30px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(Math.round(p * 100) + '%', cx, cy);
  g.fillStyle = CY; g.font = `700 16px ${FONT}`; g.fillText('Nice job!', cx, cy + 76);
}
// motion: an ease-in-out curve with a ball riding it and its position echoed on a track
function motionCurve(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Motion · easing'); const x0 = 24, y0 = H - 40, w = 120, h = 110, u = loop(t, 2.4), k = seg(u, 0.1, 0.8);
  g.strokeStyle = CY2 + '.35)'; g.lineWidth = 1; g.strokeRect(x0, y0 - h, w, h);
  g.strokeStyle = CY; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= 40; i++) { const q = i / 40; g.lineTo(x0 + q * w, y0 - ease(q) * h); } g.stroke();
  const q = Math.min(1, Math.max(0, (u - 0.1) / 0.7)); g.fillStyle = '#fff'; g.beginPath(); g.arc(x0 + q * w, y0 - k * h, 5, 0, 7); g.fill();
  const tx = 170, ty0 = y0, ty1 = y0 - h; g.strokeStyle = CY2 + '.4)'; g.beginPath(); g.moveTo(tx, ty0); g.lineTo(tx, ty1); g.stroke();
  g.fillStyle = 'rgba(255,226,120,.95)'; g.beginPath(); g.arc(tx, ty0 + (ty1 - ty0) * k, 11, 0, 7); g.fill();
  for (let i = 1; i < 5; i++) { g.fillStyle = `rgba(255,226,120,${0.15 * (5 - i) / 4})`; const kk = seg(u - i * 0.03, 0.1, 0.8); g.beginPath(); g.arc(tx, ty0 + (ty1 - ty0) * kk, 11, 0, 7); g.fill(); }
}
// icon set: four icons stroke-draw onto their keyline grids, one after another
const ICONS = [
  (g) => { g.moveTo(-14, 2); g.lineTo(0, -12); g.lineTo(14, 2); g.moveTo(-10, -1); g.lineTo(-10, 13); g.lineTo(10, 13); g.lineTo(10, -1); },
  (g) => { g.rect(-15, -10, 30, 20); g.moveTo(-15, -4); g.lineTo(15, -4); g.moveTo(-10, 5); g.lineTo(-2, 5); },
  (g) => { g.moveTo(-10, 8); g.lineTo(-10, -2); g.arc(0, -2, 10, Math.PI, 0); g.lineTo(10, 8); g.lineTo(-13, 8); g.moveTo(13, 8); g.lineTo(10, 8); g.moveTo(-3, 12); g.lineTo(3, 12); },
  (g) => { g.rect(-11, -2, 22, 16); g.moveTo(-6, -2); g.lineTo(-6, -7); g.arc(0, -7, 6, Math.PI, 0); g.lineTo(6, -2); },
];
function iconSet(g, W, H, t) {
  frame(g, W, H); caption(g, W, H, 'Icon system'); const u = loop(t, 5);
  ICONS.forEach((ic, i) => { const cx = 40 + i * 58, cy = H / 2 - 6, k = seg(u, 0.05 + i * 0.12, 0.3 + i * 0.12) * (1 - seg(u, 0.9, 1));
    g.strokeStyle = CY2 + '.25)'; g.lineWidth = 1; for (let j = -2; j <= 2; j++) { g.beginPath(); g.moveTo(cx - 22, cy + j * 10); g.lineTo(cx + 22, cy + j * 10); g.moveTo(cx + j * 10, cy - 22); g.lineTo(cx + j * 10, cy + 22); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, 18, 0, 7); g.stroke();
    g.save(); g.translate(cx, cy); g.strokeStyle = CY; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash([140 * k, 200]); g.beginPath(); ic(g); g.stroke(); g.restore(); });
}
// globe (Wires cross-border): his globe art, a spinning meridian sweep and a payment arcing between two cities
function globe(g, W, H, t, img) {
  frame(g, W, H); caption(g, W, H, 'Cross-border wires'); const cx = W / 2, cy = H / 2 - 8, R = 70;
  if (img && img.complete && img.naturalWidth) g.drawImage(img, cx - R, cy - R, R * 2, R * 2);
  g.strokeStyle = CY2 + '.55)'; g.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) { const k = Math.cos(t * 0.8 + i * Math.PI / 4); g.beginPath(); g.ellipse(cx, cy, Math.abs(k) * R, R, 0, 0, 7); g.stroke(); }
  for (const y of [-0.5, 0, 0.5]) { g.beginPath(); g.ellipse(cx, cy + y * R, R * Math.sqrt(1 - y * y), R * 0.12, 0, 0, 7); g.stroke(); }
  const A = [cx - 40, cy - 16], B = [cx + 46, cy + 10], C = [cx + 4, cy - 92], u = loop(t, 2.6), k = seg(u, 0.05, 0.75);
  g.strokeStyle = 'rgba(255,226,120,.9)'; g.lineWidth = 2.5; g.setLineDash([5, 5]); g.beginPath(); g.moveTo(...A); g.quadraticCurveTo(...C, ...B); g.stroke(); g.setLineDash([]);
  const q = (a, b, c, k) => (1 - k) * (1 - k) * a + 2 * (1 - k) * k * b + k * k * c, px = q(A[0], C[0], B[0], k), py = q(A[1], C[1], B[1], k);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill();
  for (const P of [A, B]) { g.fillStyle = 'rgba(255,226,120,.95)'; g.beginPath(); g.arc(P[0], P[1], 4, 0, 7); g.fill(); }
  const land = seg(u, 0.75, 0.85) * (1 - seg(u, 0.95, 1)); if (land > 0) { g.strokeStyle = `rgba(255,226,120,${land})`; g.lineWidth = 2; g.beginPath(); g.arc(B[0], B[1], 6 + land * 14, 0, 7); g.stroke(); }
}
// easing library: his curve cards, a dot riding each curve and a ghost following on a track
const EZ = {
  easeInSine: (x) => 1 - Math.cos(x * Math.PI / 2), easeOutCubic: (x) => 1 - Math.pow(1 - x, 3), easeInOutQuint: (x) => x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2,
  easeOutBack: (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2),
  easeOutElastic: (x) => x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  easeOutBounce: (x) => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; },
};
function easing(g, W, H, t) {
  frame(g, W, H); const names = Object.keys(EZ), u = Math.min(1, loop(t, 2.2) / 0.75);
  names.forEach((n, i) => { const cw = 74, ch = 56, x = 16 + (i % 3) * (cw + 8), y = 16 + Math.floor(i / 3) * (ch + 24), f = EZ[n];
    g.fillStyle = CY2 + '.08)'; g.fillRect(x, y, cw, ch); g.strokeStyle = CY2 + '.3)'; g.lineWidth = 1; g.strokeRect(x, y, cw, ch);
    g.strokeStyle = i % 2 ? '#8fb8ff' : CY; g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= 30; j++) { const q = j / 30; g.lineTo(x + 6 + q * (cw - 12), y + ch - 8 - f(q) * (ch - 20)); } g.stroke();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 6 + u * (cw - 12), y + ch - 8 - f(u) * (ch - 20), 3.5, 0, 7); g.fill();
    g.fillStyle = CY2 + '.8)'; g.font = `500 9px ${FONT}`; g.textAlign = 'center'; g.fillText(n, x + cw / 2, y + ch + 11); });
}
// motion spec: his timeline legend (position, scale, rotation, opacity, haptic) with a playhead sweeping the ms ruler
const TRACKS = [['POSITION', '#d6246e', 0, 200], ['SCALE', '#1188e6', 60, 260], ['ROTATION', '#159a86', 120, 320], ['OPACITY', '#f26b3a', 0, 160], ['HAPTIC', '#3fbf62', 260, 300]];
function motionSpec(g, W, H, t) {
  frame(g, W, H); const x0 = 82, x1 = W - 14, ms = (v) => x0 + (v / 400) * (x1 - x0), u = loop(t, 2.8), play = u * 440;
  g.font = `600 9px ${FONT}`; g.textAlign = 'center'; g.fillStyle = CY2 + '.7)';
  for (let v = 0; v <= 400; v += 100) { g.fillText(v, ms(v), 22); g.strokeStyle = CY2 + '.15)'; g.beginPath(); g.moveTo(ms(v), 28); g.lineTo(ms(v), H - 12); g.stroke(); }
  TRACKS.forEach(([n, c, a, b], i) => { const y = 40 + i * 26, on = play >= a && play <= b + 20;
    g.fillStyle = c; g.beginPath(); g.moveTo(10, y); g.lineTo(64, y); g.lineTo(72, y + 8); g.lineTo(64, y + 16); g.lineTo(10, y + 16); g.closePath(); g.globalAlpha = on ? 1 : 0.6; g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(n, 14, y + 11);
    g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.moveTo(ms(a), y + 8); g.lineTo(ms(b), y + 8); g.stroke();
    if (n === 'HAPTIC') { g.fillStyle = c; g.fillRect(ms(a) + 6, y + 1, 5, 14); g.fillRect(ms(a) + 16, y + 3, 5, 10); }
    else { g.fillStyle = c; rr(g, ms(a) + (ms(b) - ms(a)) / 2 - 18, y + 1, 36, 14, 7); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText((b - a) + 'ms', ms(a) + (ms(b) - ms(a)) / 2, y + 11); }
    g.globalAlpha = 1; });
  if (play <= 400) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(ms(play), 28); g.lineTo(ms(play), H - 12); g.stroke(); }
}
// image plates from his Figma, each given a looping move
const imgPlate = (mode) => (g, W, H, t, img) => {
  if (!img || !img.complete || !img.naturalWidth) return; const u = loop(t, 3.4);
  let s = 1, a = 1, clipK = 1, dy = 0;
  if (mode === 'pop') { s = 0.6 + 0.4 * ease(seg(u, 0, 0.25)) + 0.06 * Math.sin(Math.PI * seg(u, 0.25, 0.4)); a = 1 - seg(u, 0.88, 1); }
  if (mode === 'wipe') { clipK = seg(u, 0.05, 0.5); a = 1 - seg(u, 0.9, 1); }
  if (mode === 'float') { dy = Math.sin(t * 1.6) * 6; s = 1 + 0.03 * Math.sin(t * 2.3); }
  if (mode === 'scroll') { const ih = W * img.naturalHeight / img.naturalWidth, off = (t * 18) % ih; g.drawImage(img, 0, -off, W, ih); g.drawImage(img, 0, ih - off, W, ih); return; }
  g.save(); g.globalAlpha = a; g.translate(W / 2, H / 2 + dy); g.scale(s, s);
  if (clipK < 1) { g.beginPath(); g.rect(-W / 2, -H / 2, W * clipK, H); g.clip(); }
  g.drawImage(img, -W / 2, -H / 2, W, H); g.restore();
  if (mode === 'wipe' && clipK < 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(W * clipK, 0); g.lineTo(W * clipK, H); g.stroke(); }
  if (mode === 'scan') { const y = loop(t, 2.2) * H; const gr = g.createLinearGradient(0, y - 20, 0, y + 4); gr.addColorStop(0, 'rgba(127,233,255,0)'); gr.addColorStop(1, 'rgba(127,233,255,.7)'); g.fillStyle = gr; g.fillRect(0, y - 20, W, 24); }
};

// [name, aspect (w/h), draw, image file]
export const PLATES = [
  ['gauge', 1.3, gaugeRainbow], ['ticks', 1.3, gaugeTicks], ['check', 1, checkmark], ['grid', 1, iconGrid, 'grid.webp'],
  ['research', 1.3, research], ['systems', 1.3, systems], ['3d', 1.3, cube3d], ['ux', 1.3, uxFlow], ['ui', 0.8, uiPhone],
  ['terminal', 1.3, terminal], ['vector', 1.3, vectorPen], ['bot', 1.3, bot], ['haptics', 1.3, haptics], ['travel', 1.3, travel],
  ['dti', 1, dtiPie], ['globe', 1, globe, 'globe.webp'], ['easing', 1.3, easing], ['spec', 1.3, motionSpec],
  ['motion', 1.3, motionCurve], ['icons', 1.3, iconSet],
];

export function makePlate(THREE, spec, base, phase) {
  const [name, ar, draw, file] = spec, W = 256, H = Math.round(W / ar);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  let img = null; if (file) { img = new Image(); img.crossOrigin = 'anonymous'; img.src = new URL('./holo/' + file, base).href; }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return { name, ar, tex, update(t) { g.clearRect(0, 0, W, H); g.save(); try { draw(g, W, H, t + phase, img); } catch (e) {} g.restore(); tex.needsUpdate = true; } };
}
