/* Transparent video that looks the same in every browser.
   Browsers disagree on alpha video: Safari/iOS only draws HEVC alpha, Chrome/Android only VP9 alpha, and a browser
   that decodes the "wrong" one silently drops the alpha and shows the colour hidden behind the matte. So these clips
   ship as one plain H.264 file with the (premultiplied) colour on top, 16 px of black, and the alpha matte below,
   and a small WebGL canvas recombines them. Works anywhere H.264 + WebGL work, iPhone included.
   Markup: add data-stacked="<stacked.mp4>" to the existing <video>. The <video> stays in the page as the driver
   (play/pause/currentTime/ended, IntersectionObserver, sizing scripts all keep working); it is made invisible and the
   canvas is laid exactly over its box. Without WebGL the video is left untouched. */
(function () {
  var GAP = 16;
  var VS = 'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
  var FS = 'precision mediump float;uniform sampler2D t;uniform float hs,gs;varying vec2 uv;' +
    'void main(){vec3 c=texture2D(t,vec2(uv.x,uv.y*hs)).rgb;float a=texture2D(t,vec2(uv.x,uv.y*hs+gs)).r;' +
    'a=clamp((a-.02)/.96,0.,1.);gl_FragColor=vec4(min(c,vec3(a)),a);}';

  function upgrade(v) {
    if (v.__zbStacked) return; v.__zbStacked = true;
    var canvas = document.createElement('canvas');
    var gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return; // leave the original sources alone
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
    gl.useProgram(pr);
    var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(function (q) { gl.texParameteri(gl.TEXTURE_2D, q[0], q[1]); });
    var uHs = gl.getUniformLocation(pr, 'hs'), uGs = gl.getUniformLocation(pr, 'gs');

    // swap the video over to the stacked file; it keeps every other attribute and listener
    [].slice.call(v.querySelectorAll('source')).forEach(function (s) { s.remove(); });
    v.setAttribute('crossorigin', 'anonymous'); v.src = v.getAttribute('data-stacked');
    var w0 = +v.getAttribute('data-w') || 0, h0 = +v.getAttribute('data-h') || 0;
    if (w0 && h0) v.style.aspectRatio = w0 + ' / ' + h0;
    v.style.filter = 'opacity(0)';              // invisible but still laid out, decoded and observed
    v.load();
    if (v.autoplay) { var p0 = v.play(); if (p0 && p0.catch) p0.catch(function () {}); }

    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;pointer-events:none;display:block';
    if (v.poster) { canvas.style.background = 'url("' + v.poster + '") center/100% 100% no-repeat'; }
    v.insertAdjacentElement('afterend', canvas);
    var par = v.offsetParent || v.parentElement; if (par && getComputedStyle(par).position === 'static') par.style.position = 'relative';

    var drawn = false, H = 0, T = 0;
    function place() {
      var cs = getComputedStyle(v);
      if (!v.offsetWidth || cs.display === 'none' || cs.visibility === 'hidden') { canvas.style.display = 'none'; return; }
      canvas.style.display = 'block';
      canvas.style.left = v.offsetLeft + 'px'; canvas.style.top = v.offsetTop + 'px';
      canvas.style.width = v.offsetWidth + 'px'; canvas.style.height = v.offsetHeight + 'px';
      canvas.style.borderRadius = cs.borderRadius; canvas.style.opacity = cs.opacity;
      var dpr = Math.min(window.devicePixelRatio || 1, 2), vw = v.videoWidth || 4096;
      var cw = Math.max(1, Math.round(Math.min(v.offsetWidth * dpr, vw))), ch = Math.max(1, Math.round(cw * v.offsetHeight / v.offsetWidth));
      if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; if (drawn) draw(); }
    }
    function draw() {
      if (!v.videoWidth || v.readyState < 2) return;
      T = v.videoHeight; H = (T - GAP) / 2;
      if (!w0) { v.style.aspectRatio = v.videoWidth + ' / ' + H; w0 = 1; place(); }
      gl.viewport(0, 0, canvas.width, canvas.height);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v); } catch (e) { return; }
      gl.uniform1f(uHs, H / T); gl.uniform1f(uGs, (H + GAP) / T);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!drawn) { drawn = true; canvas.style.background = 'none'; }
    }
    // redraw on every new video frame (requestVideoFrameCallback where available, otherwise rAF while playing)
    var rvfc = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;
    function onFrame() { draw(); v.requestVideoFrameCallback(onFrame); }
    if (rvfc) v.requestVideoFrameCallback(onFrame);
    else (function loop() { if (!v.paused) draw(); requestAnimationFrame(loop); })();
    ['loadeddata', 'seeked', 'play', 'pause', 'ended'].forEach(function (ev) { v.addEventListener(ev, draw); });
    v.addEventListener('loadedmetadata', function () { place(); draw(); });
    if ('ResizeObserver' in window) new ResizeObserver(place).observe(v);
    addEventListener('resize', place);
    (function sync() { place(); setTimeout(sync, 500); })(); // follows class/style changes made by other scripts
    place();
  }
  function run() { document.querySelectorAll('video[data-stacked]').forEach(upgrade); }
  window.__zbAlphaVideo = { upgrade: upgrade, run: run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
