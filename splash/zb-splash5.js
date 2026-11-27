/* zb-splash5 — the Work page splash, part 2 (Nov 2026). Part 1 is inline in the page head (splash/zb-splash-head.html): it decides
   whether to show the splash, paints an out-of-focus first frame and the loading bar with the first byte, starts the video
   download, tracks the page load and runs the reveal (window.zbSp).
   The shot is the original 3D splash (splash/zb-splash.js) — low over the cloud sea, the Z gathering out of the clouds, then
   through it — pre-rendered as a video so it plays smoothly everywhere, with the moonlit night re-lit. The glass Z is NOT in
   the video: it's drawn here, live, so it can refract what's behind it like the nav bar's liquid glass (an SVG displacement
   map drawn from the Z's own shape, one pass per colour channel). It is pinned to the video frame by frame from a track the
   renderer recorded (where the Z's four corners land on screen), so it sits exactly where the 3D Z did.
   Chrome gets the refraction; Safari and Firefox get frosted glass. */
(function () {
  'use strict';
  var sp = window.zbSp; if (!sp || sp.started || sp.out || !sp.video || !sp.video.parentNode) return; sp.started = 1;   // part 1 owns playback and sets sp.hold once the video plays
  var d = document, el = sp.el, video = sp.video;
  var FPS = 30, VW = 1280, VH = 720, ZOOM = 1.45;   // zoom-through starts here in the video (s)
  // per frame: the Z's corners (logo 0,0 / 100,0 / 0,100 / 100,100) as fractions of the frame, glass amount, reveal amount
  var TR = [[[0.4488,0.2358,34.04],[0.5503,0.2617,37.31],[0.4486,0.4571,33.88],[0.5505,0.4636,37.15],0,0],[[0.4465,0.2254,32.42],[0.5528,0.2535,35.69],[0.4458,0.4578,32.29],[0.5526,0.4647,35.55],0,0],[[0.4441,0.2145,30.88],[0.5555,0.2449,34.14],[0.443,0.4586,30.77],[0.5548,0.4658,34.03],0,0],[[0.4415,0.2031,29.41],[0.5582,0.2359,32.66],[0.44,0.4595,29.33],[0.5572,0.4668,32.59],0,0],[[0.4387,0.1911,28.01],[0.561,0.2265,31.26],[0.4369,0.4604,27.97],[0.5595,0.4678,31.22],0,0],[[0.4358,0.1787,26.68],[0.5639,0.2167,29.93],[0.4337,0.4615,26.67],[0.562,0.4687,29.92],0,0],[[0.4327,0.1658,25.42],[0.5668,0.2065,28.67],[0.4303,0.4626,25.44],[0.5646,0.4697,28.69],0,0],[[0.4294,0.1525,24.23],[0.5698,0.1959,27.47],[0.4269,0.4639,24.28],[0.5673,0.4705,27.52],0,0],[[0.426,0.1386,23.1],[0.5729,0.1849,26.34],[0.4234,0.4653,23.18],[0.5701,0.4713,26.43],0,0],[[0.4224,0.1242,22.03],[0.576,0.1735,25.27],[0.4197,0.4668,22.15],[0.5729,0.4721,25.39],0,0],[[0.4187,0.1095,21.02],[0.5791,0.1618,24.26],[0.416,0.4684,21.18],[0.5758,0.4728,24.42],0,0],[[0.4148,0.0943,20.07],[0.5824,0.1498,23.31],[0.4122,0.4702,20.27],[0.5787,0.4735,23.51],0,0],[[0.4108,0.0788,19.18],[0.5856,0.1376,22.42],[0.4084,0.4721,19.42],[0.5817,0.4741,22.65],0,0],[[0.4066,0.0629,18.35],[0.5888,0.1251,21.58],[0.4045,0.4741,18.62],[0.5848,0.4746,21.86],0,0],[[0.4024,0.0469,17.57],[0.5921,0.1125,20.8],[0.4006,0.4762,17.88],[0.5878,0.4751,21.11],0,0],[[0.398,0.0307,16.84],[0.5955,0.0997,20.07],[0.3966,0.4784,17.19],[0.5909,0.4754,20.42],0,0],[[0.3934,0.0145,16.17],[0.5989,0.0867,19.38],[0.3926,0.4807,16.56],[0.5941,0.4757,19.77],0,0],[[0.3887,-0.0015,15.54],[0.6024,0.0736,18.73],[0.3885,0.4831,15.98],[0.5974,0.4759,19.17],0,0],[[0.3838,-0.0169,14.97],[0.606,0.0608,18.13],[0.3844,0.4858,15.46],[0.6007,0.4763,18.61],0,0],[[0.3788,-0.0312,14.46],[0.6098,0.0485,17.56],[0.3802,0.4892,14.99],[0.6042,0.4772,18.09],0,0],[[0.3737,-0.0434,14.0],[0.6137,0.0375,17.04],[0.3759,0.4936,14.57],[0.6078,0.4791,17.61],0,0],[[0.3685,-0.0529,13.59],[0.6177,0.0283,16.55],[0.3717,0.4995,14.2],[0.6115,0.4826,17.15],0,0],[[0.3634,-0.0587,13.25],[0.6219,0.0215,16.1],[0.3674,0.5075,13.88],[0.6154,0.4882,16.73],0,0],[[0.3583,-0.0601,12.96],[0.6262,0.018,15.69],[0.3631,0.5178,13.62],[0.6195,0.4964,16.34],0,0],[[0.3535,-0.0561,12.74],[0.6306,0.0182,15.31],[0.359,0.5312,13.4],[0.6237,0.5079,15.97],0,0],[[0.349,-0.046,12.58],[0.635,0.023,14.96],[0.3549,0.5479,13.23],[0.6281,0.5234,15.61],0,0],[[0.345,-0.0291,12.49],[0.6395,0.033,14.65],[0.3511,0.5687,13.11],[0.6327,0.5436,15.27],0,0],[[0.3416,-0.0048,12.46],[0.644,0.0489,14.36],[0.3476,0.5939,13.04],[0.6374,0.5692,14.94],0,0],[[0.339,0.0274,12.49],[0.6482,0.0714,14.1],[0.3444,0.6243,13.0],[0.6423,0.6011,14.61],0,0],[[0.3374,0.0651,12.56],[0.6517,0.1002,13.88],[0.3418,0.6594,12.96],[0.6468,0.6385,14.29],0.0,0],[[0.3363,0.0983,12.62],[0.6546,0.1259,13.69],[0.3397,0.6909,12.93],[0.6507,0.6725,14.0],0.012,0],[[0.3356,0.1258,12.66],[0.6571,0.1472,13.51],[0.3381,0.7173,12.89],[0.654,0.7017,13.75],0.054,0],[[0.335,0.1481,12.69],[0.6591,0.1645,13.36],[0.3369,0.739,12.86],[0.6568,0.7262,13.53],0.148,0],[[0.3347,0.1658,12.72],[0.6608,0.1781,13.23],[0.336,0.7564,12.84],[0.6591,0.7461,13.35],0.315,0],[[0.3344,0.1794,12.74],[0.6622,0.1883,13.11],[0.3354,0.7697,12.83],[0.661,0.7619,13.2],0.568,0],[[0.3342,0.1894,12.75],[0.6633,0.1957,13.02],[0.335,0.7796,12.82],[0.6624,0.7738,13.08],0.779,0],[[0.3342,0.1964,12.76],[0.6641,0.2007,12.95],[0.3347,0.7864,12.81],[0.6635,0.7823,13.0],0.907,0],[[0.3341,0.2009,12.77],[0.6648,0.2037,12.89],[0.3346,0.7907,12.81],[0.6642,0.788,12.93],0.972,0],[[0.3341,0.2035,12.78],[0.6652,0.2051,12.85],[0.3346,0.7931,12.82],[0.6647,0.7914,12.89],0.997,0],[[0.3341,0.2047,12.78],[0.6656,0.2056,12.82],[0.3346,0.794,12.82],[0.665,0.7931,12.86],1,0],[[0.3341,0.2051,12.78],[0.6658,0.2055,12.8],[0.3346,0.7942,12.83],[0.6652,0.7937,12.85],1,0],[[0.3341,0.2051,12.79],[0.6659,0.2053,12.79],[0.3347,0.7941,12.83],[0.6653,0.7939,12.84],1,0],[[0.3341,0.2052,12.79],[0.6659,0.2052,12.79],[0.3347,0.794,12.84],[0.6653,0.794,12.84],1,0],[[0.3341,0.2052,12.79],[0.6659,0.2052,12.79],[0.3347,0.794,12.84],[0.6653,0.794,12.84],1,0],[[0.3341,0.2052,12.79],[0.6659,0.2052,12.79],[0.3347,0.794,12.84],[0.6653,0.794,12.84],1,0],[[0.3337,0.2056,12.77],[0.6658,0.2056,12.78],[0.3343,0.7949,12.82],[0.6652,0.7949,12.82],1,0],[[0.3326,0.2074,12.73],[0.6653,0.2076,12.74],[0.3331,0.7982,12.77],[0.6649,0.7981,12.78],1,0],[[0.3303,0.2116,12.66],[0.6641,0.2121,12.68],[0.3304,0.8054,12.67],[0.664,0.8049,12.69],1,0],[[0.3262,0.2194,12.54],[0.6618,0.2204,12.58],[0.3257,0.8181,12.51],[0.6623,0.8169,12.55],1,0],[[0.3198,0.2319,12.37],[0.6581,0.2339,12.45],[0.3183,0.8381,12.26],[0.6594,0.8359,12.35],1,0.005],[[0.3105,0.2504,12.13],[0.6525,0.2537,12.28],[0.3072,0.8677,11.92],[0.6552,0.8638,12.07],1,0.044],[[0.299,0.2715,11.83],[0.6463,0.2766,12.04],[0.2932,0.9045,11.49],[0.6505,0.8982,11.71],1,0.148],[[0.2882,0.285,11.44],[0.6431,0.2917,11.71],[0.2799,0.9374,11.01],[0.6486,0.929,11.28],1,0.351],[[0.2774,0.2913,10.97],[0.6429,0.2994,11.27],[0.2669,0.9679,10.48],[0.6494,0.9574,10.78],1,0.649],[[0.2659,0.2913,10.41],[0.6455,0.3004,10.73],[0.2533,0.9981,9.88],[0.6531,0.9854,10.2],1,0.852],[[0.2526,0.2851,9.76],[0.6511,0.2955,10.09],[0.2378,1.0308,9.21],[0.6598,1.0158,9.54],1,0.956],[[0.2361,0.273,9.01],[0.6598,0.2847,9.35],[0.2188,1.07,8.46],[0.6698,1.052,8.79],1,0.995],[[0.2141,0.2545,8.16],[0.6723,0.2679,8.5],[0.1934,1.1215,7.61],[0.6843,1.0995,7.95],1,1],[[0.183,0.228,7.21],[0.6902,0.2438,7.53],[0.1573,1.195,6.67],[0.7049,1.1667,6.99],1,1],[[0.1366,0.1883,6.14],[0.7166,0.2081,6.46],[0.1024,1.3066,5.61],[0.7359,1.2678,5.93],1,1],[[0.0614,0.1241,4.96],[0.759,0.1509,5.27],[0.0112,1.4921,4.45],[0.7867,1.4332,4.76],1,1],[[-0.0785,0.0051,3.66],[0.8362,0.0464,3.94],[-0.1645,1.8498,3.18],[0.8821,1.7445,3.47],1,1],[[-0.4189,-0.2835,2.24],[1.0204,-0.2029,2.47],[-0.6137,2.766,1.84],[1.1181,2.5154,2.08],1,1],[[-2.2994,-1.8584,0.71],[2.2444,-1.8584,0.71],[-2.2994,6.2195,0.71],[2.2444,6.2195,0.71],1,1],[[-2.2994,-1.8584,0.71],[2.2444,-1.8584,0.71],[-2.2994,6.2195,0.71],[2.2444,6.2195,0.71],1,1],[[-2.2994,-1.8584,0.71],[2.2444,-1.8584,0.71],[-2.2994,6.2195,0.71],[2.2444,6.2195,0.71],1,1]];
  var PATH = 'M53.5 11H93.5Q98 11 95.3 14.6L67.7 51.4Q65 55 61.46 52.22L12.54 13.78Q9 11 13.5 11ZM46.5 89H86.5Q91 89 87.43 86.26L38.57 48.74Q35 46 32.26 49.57L4.74 85.43Q2 89 6.5 89Z';
  var A = [[9, 11], [98, 11], [65, 55]], B = [[2, 89], [91, 89], [35, 46]];
  var clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  function strokePts(seq) {   // [start, [ctrl, end] | end, ...] -> points, quadratic corners sampled
    var out = [seq[0]], cur = seq[0];
    for (var i = 1; i < seq.length; i++) {
      var q = seq[i];
      if (q.length === 2 && typeof q[0] === 'object') { for (var t = 1; t <= 4; t++) { var u = t / 4, w = 1 - u; out.push([w * w * cur[0] + 2 * w * u * q[0][0] + u * u * q[1][0], w * w * cur[1] + 2 * w * u * q[0][1] + u * u * q[1][1]]); } cur = q[1]; }
      else { out.push(q); cur = q; }
    }
    return out;
  }
  var HOLES = [
    { c: [57.3, 25.7], pts: strokePts([[53.5, 11], [93.5, 11], [[98, 11], [95.3, 14.6]], [67.7, 51.4], [[65, 55], [61.46, 52.22]], [12.54, 13.78], [[9, 11], [13.5, 11]]]) },
    { c: [42.7, 74.7], pts: strokePts([[46.5, 89], [86.5, 89], [[91, 89], [87.43, 86.26]], [38.57, 48.74], [[35, 46], [32.26, 49.57]], [4.74, 85.43], [[2, 89], [6.5, 89]]]) }];

  var css = d.createElement('style');
  css.textContent = [
    '#zb-sp .zg{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;opacity:0;will-change:transform,opacity}',
    '#zb-sp .zg .lens{position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.03) 55%,rgba(255,255,255,.09))}',
    'html[data-mode=dark] #zb-sp .zg .lens{background:linear-gradient(160deg,rgba(190,215,255,.1),rgba(150,190,240,.02) 55%,rgba(170,200,255,.07))}',
    '#zb-sp .zg svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}',
    '#zb-sp .zg .e{fill:none;stroke:rgba(255,255,255,.95);stroke-width:1.3;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-dasharray:1 1;stroke-dashoffset:1}',
    '#zb-sp .zg .rim{fill:none;stroke:rgba(255,255,255,.32);stroke-width:5;stroke-linejoin:round}',
    'html[data-mode=dark] #zb-sp .zg .rim{stroke:rgba(200,225,255,.2)}',
    '#zb-sp .zg.on .e{animation:zbSpT5 .5s cubic-bezier(.65,0,.35,1) forwards}',
    '#zb-sp .zg.on .e+.e{animation-delay:.06s}',
    '#zb-sp .zg .s{opacity:0}',
    '#zb-sp .zg.on .s{animation:zbSpS5 1s cubic-bezier(.45,0,.25,1) .2s both}',
    '@keyframes zbSpT5{to{stroke-dashoffset:0}}',
    '@keyframes zbSpS5{0%{opacity:0;transform:translateX(-60px) skewX(-18deg)}15%{opacity:1}100%{opacity:1;transform:translateX(140px) skewX(-18deg)}}'
  ].join('\n');
  d.head.appendChild(css);
  var zg = d.createElement('div'); zg.className = 'zg';
  zg.innerHTML = '<div class="lens"></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><defs><clipPath id="zbsp5-c"><path d="' + PATH + '"/></clipPath>' +
    '<linearGradient id="zbsp5-s" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
    '<g clip-path="url(#zbsp5-c)"><path class="rim" d="' + PATH + '"/><rect class="s" x="-6" y="-12" width="16" height="124" fill="url(#zbsp5-s)"/></g>' +
    '<path class="e" pathLength="1" d="M53.5 11H93.5Q98 11 95.3 14.6L67.7 51.4Q65 55 61.46 52.22L12.54 13.78Q9 11 13.5 11Z"/>' +
    '<path class="e" pathLength="1" d="M46.5 89H86.5Q91 89 87.43 86.26L38.57 48.74Q35 46 32.26 49.57L4.74 85.43Q2 89 6.5 89Z"/></svg>';
  el.insertBefore(zg, video.nextSibling);
  var lens = zg.firstChild, BOX = 0, CLIP = [video];

  // ---------- the lens: refraction like the nav bar ----------
  var canRefract = window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'url(#zb) blur(1px)') && /Chrome\//.test(navigator.userAgent);
  function sdTri(px, py, t) {
    var p0 = t[0], p1 = t[1], p2 = t[2];
    var e0x = p1[0] - p0[0], e0y = p1[1] - p0[1], e1x = p2[0] - p1[0], e1y = p2[1] - p1[1], e2x = p0[0] - p2[0], e2y = p0[1] - p2[1];
    var v0x = px - p0[0], v0y = py - p0[1], v1x = px - p1[0], v1y = py - p1[1], v2x = px - p2[0], v2y = py - p2[1];
    var k0 = clamp((v0x * e0x + v0y * e0y) / (e0x * e0x + e0y * e0y), 0, 1), k1 = clamp((v1x * e1x + v1y * e1y) / (e1x * e1x + e1y * e1y), 0, 1), k2 = clamp((v2x * e2x + v2y * e2y) / (e2x * e2x + e2y * e2y), 0, 1);
    var q0x = v0x - e0x * k0, q0y = v0y - e0y * k0, q1x = v1x - e1x * k1, q1y = v1y - e1y * k1, q2x = v2x - e2x * k2, q2y = v2y - e2y * k2;
    var s = Math.sign(e0x * e2y - e0y * e2x);
    var dx = Math.min(q0x * q0x + q0y * q0y, q1x * q1x + q1y * q1y, q2x * q2x + q2y * q2y);
    var sy = Math.min(s * (v0x * e0y - v0y * e0x), s * (v1x * e1y - v1y * e1x), s * (v2x * e2y - v2y * e2x));
    return -Math.sqrt(dx) * Math.sign(sy);
  }
  var sdZ = function (x, y) { return Math.min(sdTri(x, y, A), sdTri(x, y, B)) + 1.2; };
  function buildLens() {
    var S = BOX, clip = 'path("' + PATH.replace(/-?\d+(\.\d+)?/g, function (n) { return (parseFloat(n) * S / 100).toFixed(2); }) + '")';
    zg.style.width = zg.style.height = S + 'px';
    lens.style.clipPath = lens.style.webkitClipPath = clip;
    if (!canRefract) { lens.style.backdropFilter = lens.style.webkitBackdropFilter = 'blur(8px) saturate(160%) brightness(1.06)'; return; }
    var m = Math.max(16, Math.round(S * 0.5)), c = d.createElement('canvas'); c.width = c.height = m;
    var g = c.getContext('2d'), im = g.createImageData(m, m), px = im.data, bw = 10, u = 100 / m;
    for (var j = 0; j < m; j++) for (var i = 0; i < m; i++) {
      var x = (i + 0.5) * u, y = (j + 0.5) * u, dd = sdZ(x, y), k = (j * m + i) * 4, r = 128, gg = 128;
      if (dd < 0) {
        var nx = sdZ(x + 0.6, y) - sdZ(x - 0.6, y), ny = sdZ(x, y + 0.6) - sdZ(x, y - 0.6), nl = Math.hypot(nx, ny) || 1;
        var bev = Math.pow(1 - clamp(-dd / bw, 0, 1), 2.2);
        r = 128 + nx / nl * bev * 127; gg = 128 + ny / nl * bev * 127;
      }
      px[k] = r; px[k + 1] = gg; px[k + 2] = 128; px[k + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    var sc = Math.round(S * 0.2), f = '<filter xmlns="http://www.w3.org/2000/svg" id="zbSpLq5" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">' +
      '<feImage x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" href="' + c.toDataURL() + '"/>';
    [['1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0', -sc], ['0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0', -Math.round(sc * 1.15)], ['0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0', -Math.round(sc * 1.3)]].forEach(function (t, n) {
      f += '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + t[1] + '" xChannelSelector="R" yChannelSelector="G" result="d' + n + '"/><feColorMatrix in="d' + n + '" type="matrix" values="' + t[0] + '" result="c' + n + '"/>';
    });
    f += '<feBlend in="c0" in2="c1" mode="screen" result="rg"/><feBlend in="rg" in2="c2" mode="screen"/></filter>';
    var svg = d.getElementById('zbsp5-defs');
    if (!svg) { svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'zbsp5-defs'; svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.cssText = 'position:absolute;width:0;height:0'; el.appendChild(svg); }
    svg.innerHTML = f;
    lens.style.backdropFilter = 'url(#zbSpLq5) blur(.7px) saturate(160%) brightness(1.06)';
    lens.style.webkitBackdropFilter = 'blur(8px) saturate(160%) brightness(1.06)';
  }

  // ---------- pin the glass to the video ----------
  var W = 0, H = 0, K = 1, OX = 0, OY = 0;
  function size() {
    W = el.clientWidth; H = el.clientHeight; K = Math.max(W / VW, H / VH); OX = (W - VW * K) / 2; OY = (H - VH * K) / 2;
    var b = Math.round(clamp(H * 0.42, 160, 460)); if (b !== BOX) { BOX = b; buildLens(); }
  }
  function lerpP(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }
  function place(tm) {
    if (!TR.length) return 0;
    var f = clamp(tm * FPS, 0, TR.length - 1), i = Math.floor(f), k = f - i, a = TR[i], b = TR[Math.min(i + 1, TR.length - 1)];
    var q = [0, 1, 2, 3].map(function (n) { var p = lerpP(a[n], b[n], k); return [OX + p[0] * VW * K, OY + p[1] * VH * K, p[2]]; });
    var gl = a[4] + (b[4] - a[4]) * k, rv = a[5] + (b[5] - a[5]) * k;
    if (q[0][2] < 0.6 || q[1][2] < 0.6 || q[2][2] < 0.6 || q[3][2] < 0.6) { zg.style.opacity = '0'; return gl; }
    // unit square -> quad (Heckbert): q0 (0,0), q1 (1,0), q3 (1,1), q2 (0,1)
    var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[3][0], y2 = q[3][1], x3 = q[2][0], y3 = q[2][1];
    var sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, ga = 0, gb = 0, a1, b1, d1, e1;
    if (Math.abs(sx) > 1e-6 || Math.abs(sy) > 1e-6) {
      var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, den = dx1 * dy2 - dx2 * dy1;
      ga = (sx * dy2 - dx2 * sy) / den; gb = (dx1 * sy - sx * dy1) / den;
    }
    a1 = x1 - x0 + ga * x1; b1 = x3 - x0 + gb * x3; d1 = y1 - y0 + ga * y1; e1 = y3 - y0 + gb * y3;
    var s = 1 / BOX;
    zg.style.transform = 'matrix3d(' + [a1 * s, d1 * s, 0, ga * s, b1 * s, e1 * s, 0, gb * s, 0, 0, 1, 0, x0, y0, 0, 1].map(function (v) { return +v.toFixed(6); }).join(',') + ')';
    zg.style.opacity = gl.toFixed(3);
    // the portal: during the zoom the Z opens onto the page underneath (each stroke grows from its centre)
    if (rv > 0.001) {
      var M = function (u, v) { u /= 100; v /= 100; var w = ga * u + gb * v + 1; return ((a1 * u + b1 * v + x0) / w).toFixed(1) + ' ' + ((d1 * u + e1 * v + y0) / w).toFixed(1); };
      var hole = 'M-20 -20H' + (W + 20) + 'V' + (H + 20) + 'H-20Z';
      HOLES.forEach(function (tri) {
        var c = tri.c, k = Math.min(1, rv * 1.15);
        hole += 'M' + tri.pts.map(function (q) { return M(c[0] + (q[0] - c[0]) * k, c[1] + (q[1] - c[1]) * k); }).join('L') + 'Z';
      });
      var cp = 'path(evenodd,"' + hole + '")';
      for (var n = 0; n < CLIP.length; n++) CLIP[n].style.clipPath = CLIP[n].style.webkitClipPath = cp;
    }
    return gl;
  }

  // ---------- timeline: follows the video ----------
  var raf = 0, on = 0, held = 0, ending = 0, END = 0, tHold0 = 0;
  function frame() {
    var tm = video.currentTime;
    END = video.duration || END;
    var gl = place(tm);
    if (gl > 0.02 && !on) { on = 1; zg.classList.add('on'); }
    // hold just before the zoom-through until the page underneath is ready (never more than ~1.5 s)
    if (!held && !sp.ready() && tm >= ZOOM - 0.05 && tm < ZOOM + 0.1) { held = 1; tHold0 = performance.now(); video.pause(); }
    if (held === 1 && (sp.ready() || performance.now() - tHold0 > 1500)) { held = 2; var p = video.play(); if (p && p.catch) p.catch(end); }
    if (!ending && END && tm >= END - 0.1) { ending = 1; end(); }
    raf = requestAnimationFrame(frame);
  }
  function end() {
    if (ending > 1) return; ending = 2;
    sp.end();                                   // part 1 fades the splash out and reveals the page
    setTimeout(function () { cancelAnimationFrame(raf); }, 500);
  }
  addEventListener('resize', size);
  size();
  function begin() { if (raf) return; raf = requestAnimationFrame(frame); }
  if (!video.paused && video.currentTime > 0) begin(); else video.addEventListener('playing', begin, { once: true });
  video.addEventListener('ended', end);
})();
