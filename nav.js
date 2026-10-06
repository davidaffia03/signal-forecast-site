(function(){
  var nav=document.querySelector('nav');
  if(!nav)return;
  var links=[].slice.call(nav.querySelectorAll('a'));
  var n=links.length, STEP=44, MAXR=(n-1)/2*STEP, open=false, cur=0;

  var disc=document.createElement('div'); disc.className='disc';
  var ring=document.createElement('div'); ring.className='ring';
  var home=null;
  links.forEach(function(a,i){
    a._ang=(i-(n-1)/2)*STEP;
    a.style.setProperty('--a',a._ang+'deg');
    if(a.classList.contains('active'))home=a;
    ring.appendChild(a);
  });
  disc.appendChild(ring);
  nav.appendChild(disc);

  function setRot(deg){cur=deg;ring.style.setProperty('--r',deg+'deg');}
  function setActive(a){links.forEach(function(l){l.classList.toggle('active',l===a)});}
  function setOpen(v){open=v;nav.classList.toggle('open',v);}
  function nearest(){
    var best=links[0],d=1e9;
    links.forEach(function(l){var x=Math.abs(-l._ang-cur);if(x<d){d=x;best=l;}});
    return best;
  }
  function buzz(){if(navigator.vibrate)navigator.vibrate(8);}
  function go(a){setTimeout(function(){location.href=a.href;},520);}

  function reset(){
    ring.style.transition='none';
    if(home){setRot(-home._ang);setActive(home);}
    ring.getBoundingClientRect();
    ring.style.transition='';
  }
  reset();
  window.addEventListener('pageshow',function(e){if(e.persisted){setOpen(false);reset();}});

  // tap: closed = unfold, open = rotate to the tapped page then go there
  var justDragged=false;
  nav.addEventListener('click',function(e){
    e.preventDefault();
    if(justDragged){justDragged=false;return;}
    var a=e.target.closest('a');
    if(!open){setOpen(true);return;}
    if(!a){setOpen(false);return;}
    if(a===home){setOpen(false);return;}
    setRot(-a._ang);
    setActive(a);
    buzz();
    go(a);
  });

  // drag the ring like a real dial, snaps to the nearest page on release
  var drag=null,moved=false,lastNear=null;
  function angleOf(e){return Math.atan2(e.clientY-drag.cy,e.clientX-drag.cx)*180/Math.PI;}
  disc.addEventListener('pointerdown',function(e){
    if(!open)return;
    var r=nav.getBoundingClientRect();
    drag={cx:r.left,cy:r.top,x:e.clientX,y:e.clientY,id:e.pointerId};
    drag.a0=angleOf(e);drag.r0=cur;
    moved=false;lastNear=nearest();
  });
  disc.addEventListener('pointermove',function(e){
    if(!drag)return;
    if(!moved){
      if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;
      moved=true;
      try{disc.setPointerCapture(drag.id);}catch(_){}
      ring.style.transition='none';
    }
    var r=drag.r0+(angleOf(e)-drag.a0);
    r=Math.max(-MAXR-8,Math.min(MAXR+8,r));
    setRot(r);
    var nr=nearest();
    if(nr!==lastNear){lastNear=nr;setActive(nr);buzz();}
  });
  function endDrag(){
    if(!drag)return;
    var wasMoved=moved;
    drag=null;
    if(!wasMoved)return;
    justDragged=true;
    setTimeout(function(){justDragged=false;},60);
    ring.style.transition='';
    var nr=nearest();
    setRot(-nr._ang);
    setActive(nr);
    if(nr!==home)go(nr);
  }
  disc.addEventListener('pointerup',endDrag);
  disc.addEventListener('pointercancel',endDrag);

  document.addEventListener('click',function(e){if(!nav.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});

  // swipe right from the left edge to unfold, swipe left to fold
  var sx=null,sy=null;
  document.addEventListener('touchstart',function(e){
    if(nav.contains(e.target)){sx=null;return;}
    var t=e.touches[0];sx=t.clientX;sy=t.clientY;
  },{passive:true});
  document.addEventListener('touchmove',function(e){
    if(sx===null)return;
    var t=e.touches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)<Math.abs(dy))return;
    if(sx<30&&dx>40){setOpen(true);sx=null;}
    else if(dx<-40&&open){setOpen(false);sx=null;}
  },{passive:true});
  document.addEventListener('touchend',function(){sx=null});
})();