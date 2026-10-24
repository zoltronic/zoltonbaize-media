/* zb-mobile — keep phones and tablets simple on zoltonbaize.com.
   On touch devices the sky's WebGL "liquid glass" pass is switched off and every glass element (nav bars, the light/dark
   pill, cards) gets plain CSS frosted glass instead. The WebGL glass redraws a beat behind native scrolling and could show
   empty "bubbles" or a hard line where a panel's edge was drawn; CSS glass is part of the element, so it can't.
   The rising cloud floor at the bottom of the Work page is off on touch devices too. Desktop keeps the full effect. Load in the site <head>. */
(function () {
  'use strict';
  if (!matchMedia('(pointer: coarse)').matches) return;
  document.documentElement.classList.add('zb-touch');
  var css = document.createElement('style');
  css.textContent =
    '.zb-touch [data-zb-glass], .zb-touch [data-zb-liquid] {' +
    ' background: rgba(255,255,255,.56) !important; border: 1px solid rgba(255,255,255,.9) !important;' +
    ' -webkit-backdrop-filter: blur(16px) saturate(160%) !important; backdrop-filter: blur(16px) saturate(160%) !important;' +
    ' box-shadow: 0 14px 34px -18px rgba(4,34,58,.45), inset 0 1px 0 rgba(255,255,255,.9) !important; }' +
    '.zb-touch[data-mode="dark"] [data-zb-glass], .zb-touch[data-mode="dark"] [data-zb-liquid], .zb-touch.zb-night [data-zb-glass], .zb-touch.zb-night [data-zb-liquid] {' +
    ' background: rgba(10,30,50,.62) !important; border-color: rgba(180,220,248,.26) !important;' +
    ' box-shadow: 0 14px 34px -18px rgba(0,0,0,.7), inset 0 1px 0 rgba(215,238,255,.22) !important; }' +
    /* the cloud floor at the bottom of the Work page: off on phones (its strips showed a faint seam on iPhone) */
    '.zb-touch #zb-deck { display: none !important; }' +
    /* the Work page's contact band is meant to sit straight on the sky, with no panel at all */
    '.zb-touch #contact .cta_band { background: none !important; border: 0 !important; box-shadow: none !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }';
  document.head.appendChild(css);
  // the sky still draws (clouds, sun, night), but with no glass panels on top of it
  function patch() {
    var Sky = window.customElements && customElements.get('zb-sky');
    if (!Sky || Sky.prototype.__zbTouch) return;
    Sky.prototype.__zbTouch = true;
    Sky.prototype._measure = function () { this._panels = []; };
  }
  if (window.customElements) customElements.whenDefined('zb-sky').then(patch);
})();
