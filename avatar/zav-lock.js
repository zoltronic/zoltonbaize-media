// About page embed: hold the page still for the ~1 s the avatar takes to fly onto his cloud.
// zolton-avatar.js calls window.zavUnlock() once he's seated; this unlocks anyway after 15 s if he never loads.
(function(){
  var de=document.documentElement; de.classList.add('zav-lock');
  if('scrollRestoration' in history) history.scrollRestoration='manual'; scrollTo(0,0);
  function held(){ return de.classList.contains('zav-lock'); }
  function stop(e){ if(held()) e.preventDefault(); }
  addEventListener('wheel',stop,{passive:false}); addEventListener('touchmove',stop,{passive:false});
  addEventListener('keydown',function(e){ if(held()&&/^(ArrowDown|ArrowUp|PageDown|PageUp|Home|End| )$/.test(e.key)&&!/^(INPUT|TEXTAREA)$/.test(e.target.tagName)) e.preventDefault(); });
  window.zavUnlock=function(){ de.classList.remove('zav-lock'); };
  setTimeout(window.zavUnlock,15000);
})();
