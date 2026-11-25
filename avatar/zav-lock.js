(function(){
  var de=document.documentElement; de.classList.add('zav-lock');
  if('scrollRestoration' in history) history.scrollRestoration='manual'; scrollTo(0,0);
  // While the page is held, scroll input still moves the hero text (so visitors can see scrolling works);
  // when the lock lifts, that distance becomes the real scroll position, so nothing jumps.
  var v=0, ty=null, raf=0;
  function txt(){ return document.querySelector('.about_hero .page_wrap')||document.querySelector('.about_hero h1')&&document.querySelector('.about_hero h1').parentElement; }
  function paint(){ raf=0; var el=txt(); if(el) el.style.transform=v?'translate3d(0,'+(-v).toFixed(1)+'px,0)':''; }
  function push(d){ var max=innerHeight*0.55; v=Math.max(0,Math.min(max,v+d)); if(!raf) raf=requestAnimationFrame(paint); }
  function held(){ return de.classList.contains('zav-lock'); }
  addEventListener('wheel',function(e){ if(!held()) return; e.preventDefault(); push(e.deltaMode===1?e.deltaY*32:e.deltaY); },{passive:false});
  addEventListener('touchstart',function(e){ ty=e.touches[0].clientY; },{passive:true});
  addEventListener('touchmove',function(e){ if(!held()) return; e.preventDefault(); var y=e.touches[0].clientY; if(ty!=null) push(ty-y); ty=y; },{passive:false});
  addEventListener('keydown',function(e){ if(!held()||/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    var k=e.key, d=k==='ArrowDown'?80:k==='ArrowUp'?-80:(k==='PageDown'||k===' ')?innerHeight*0.8:k==='PageUp'?-innerHeight*0.8:0;
    if(d||k==='Home'||k==='End'){ e.preventDefault(); if(d) push(d); } });
  window.zavUnlock=function(){ var el=txt(), y=v; de.classList.remove('zav-lock'); v=0; if(el) el.style.transform=''; if(y) scrollTo(0,(scrollY||0)+y); };
  setTimeout(function(){ if(!window.__z) window.zavUnlock(); },20000);
})();
