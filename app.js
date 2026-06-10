/* ===== Green Landscaping — shared scripts ===== */
(function(){
  var y = document.getElementById('yr'); if(y) y.textContent = new Date().getFullYear();

  var isTouch = window.matchMedia('(max-width:980px), (pointer:coarse)').matches;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var isMobile = isTouch;

  /* Nav solid on scroll */
  var nav = document.getElementById('nav');
  if(nav){
    var onScrollNav = function(){ nav.classList.toggle('solid', window.scrollY > 60); };
    onScrollNav(); window.addEventListener('scroll', onScrollNav, {passive:true});
  }

  /* Beat opacity helper */
  function beatOpacity(p, din, dout){
    var fade = 0.08;
    if(p < din - fade || p > dout + fade) return 0;
    if(p < din) return (p - (din - fade)) / fade;
    if(p > dout) return 1 - (p - dout) / fade;
    return 1;
  }

  /* Scroll-scrub videos + staged text (home only)
     REAL FIX: every scrollscene stays tall + sticky in CSS, and this script
     seeks the video based on the section's scroll progress on all devices. */
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  function beatOpacity(p, din, dout){
    var fade = 0.08;
    if(p < din - fade || p > dout + fade) return 0;
    if(p < din) return (p - (din - fade)) / fade;
    if(p > dout) return 1 - (p - dout) / fade;
    return 1;
  }

  var scrubScenes = [].slice.call(document.querySelectorAll('.scrollscene'));
  scrubScenes.forEach(function(scene){
    var video = scene.querySelector('video.scrub');
    var beats = [].slice.call(scene.querySelectorAll('.beat'));
    var duration = 0;

    if(video){
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('muted','');
      video.setAttribute('playsinline','');
      video.setAttribute('webkit-playsinline','');
      video.setAttribute('preload','auto');
      video.removeAttribute('autoplay');
      video.removeAttribute('loop');

      function rememberDuration(){
        if(video.duration && isFinite(video.duration)){
          duration = video.duration;
        }
      }
      video.addEventListener('loadedmetadata', rememberDuration);
      video.addEventListener('durationchange', rememberDuration);
      video.addEventListener('canplay', rememberDuration);
      if(video.readyState >= 1) rememberDuration();
      try { video.load(); } catch(e){}

      /* Unlock iOS/Safari seeking without making it play visibly. */
      function unlock(){
        var p = video.play();
        if(p && p.then){
          p.then(function(){ video.pause(); updateAllScrubScenes(); }).catch(function(){ updateAllScrubScenes(); });
        } else {
          try { video.pause(); } catch(e){}
        }
      }
      window.addEventListener('touchstart', unlock, {once:true, passive:true});
      window.addEventListener('pointerdown', unlock, {once:true, passive:true});
    }
  });

  function updateAllScrubScenes(){
    scrubScenes.forEach(function(scene){
      var video = scene.querySelector('video.scrub');
      var beats = [].slice.call(scene.querySelectorAll('.beat'));
      var rect = scene.getBoundingClientRect();
      var total = Math.max(scene.offsetHeight - window.innerHeight, 1);
      var p = clamp(-rect.top / total, 0, 1);

      if(video && video.duration && isFinite(video.duration)){
        var dur = video.duration;
        var end = Math.max(dur - 0.02, 0);
        var target = p >= 0.995 ? end : clamp(p * end, 0.001, end);

        try {
          if(video.fastSeek && Math.abs(video.currentTime - target) > 0.06){
            video.fastSeek(target);
          } else if(Math.abs(video.currentTime - target) > 0.015){
            video.currentTime = target;
          }
        } catch(e){}
      }

      beats.forEach(function(b){
        var din = parseFloat(b.dataset.in || 0);
        var dout = parseFloat(b.dataset.out || 1);
        var op = beatOpacity(p, din, dout);
        b.style.opacity = op;
        b.style.transform = 'translateY(' + ((1 - op) * 22) + 'px)';
        b.style.pointerEvents = op > 0.2 ? 'auto' : 'none';
      });
    });
  }

  var scrubTicking = false;
  function requestScrubUpdate(){
    if(scrubTicking) return;
    scrubTicking = true;
    requestAnimationFrame(function(){
      updateAllScrubScenes();
      scrubTicking = false;
    });
  }

  window.addEventListener('scroll', requestScrubUpdate, {passive:true});
  window.addEventListener('resize', requestScrubUpdate, {passive:true});
  window.addEventListener('orientationchange', requestScrubUpdate, {passive:true});
  setInterval(updateAllScrubScenes, 250);
  updateAllScrubScenes();

  /* Count-up stats */
  var stats = [].slice.call(document.querySelectorAll('.num[data-target]'));
  var statSeen = false;
  function runStats(){
    if(statSeen) return; statSeen = true;
    stats.forEach(function(el){
      var end = parseInt(el.getAttribute('data-target'),10);
      var pre = el.getAttribute('data-prefix')||'', suf = el.getAttribute('data-suffix')||'';
      if(end===0){ el.textContent = pre+'0'+suf; return; }
      var t0=null, dur=1300;
      function step(ts){ if(!t0)t0=ts; var p=Math.min((ts-t0)/dur,1);
        el.textContent = pre + Math.round(end*(0.5-Math.cos(p*Math.PI)/2)) + suf;
        if(p<1) requestAnimationFrame(step); }
      requestAnimationFrame(step);
    });
  }
  var trustEl = document.querySelector('.trust');
  if(trustEl && stats.length){ new IntersectionObserver(function(en){ en.forEach(function(e){ if(e.isIntersecting) runStats(); }); },{threshold:.4}).observe(trustEl); }

  /* Reveal on scroll */
  var ro = new IntersectionObserver(function(en){
    en.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target);} });
  },{threshold:.15});
  [].slice.call(document.querySelectorAll('.reveal')).forEach(function(el){ ro.observe(el); });

  /* 3D tilt (desktop only) */
  if(!isTouch){
    [].slice.call(document.querySelectorAll('.tilt')).forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r=card.getBoundingClientRect();
        var x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
        card.style.transform='perspective(800px) rotateY('+(x*7)+'deg) rotateX('+(-y*7)+'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform=''; });
    });
  }

  /* Before/After slider(s) */
  [].slice.call(document.querySelectorAll('.ba')).forEach(function(ba){
    var dragging=false;
    function setPos(clientX){
      var r=ba.getBoundingClientRect();
      var pct=((clientX-r.left)/r.width)*100;
      pct=Math.max(4,Math.min(96,pct));
      ba.style.setProperty('--pos',pct+'%');
    }
    ba.addEventListener('pointerdown',function(e){dragging=true;setPos(e.clientX);ba.setPointerCapture(e.pointerId);});
    ba.addEventListener('pointermove',function(e){if(dragging)setPos(e.clientX);});
    ba.addEventListener('pointerup',function(){dragging=false;});
    ba.addEventListener('pointercancel',function(){dragging=false;});
  });
  /* Estimate form -> pre-filled SMS to business phone */
  [].slice.call(document.querySelectorAll('.sms-estimate-form')).forEach(function(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var data = new FormData(form);
      var lines = ['New Green Landscaping estimate request:'];
      ['Name','Phone','Address','Project Type','Approx Sq Ft','Notes'].forEach(function(key){
        var val = (data.get(key) || '').toString().trim();
        if(val) lines.push(key + ': ' + val);
      });
      var body = encodeURIComponent(lines.join('\n'));
      window.location.href = 'sms:+19168494844?&body=' + body;
    });
  });



  /* Mobile hamburger menu + hide-on-scroll nav */
  var menuBtn = document.querySelector('.menu-toggle');
  var navLinks = nav ? nav.querySelector('.nav-links') : null;

  function closeMobileMenu(){
    if(!nav || !menuBtn) return;
    nav.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded','false');
  }

  if(nav && menuBtn && navLinks){
    menuBtn.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      nav.classList.toggle('menu-open');
      var open = nav.classList.contains('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.classList.remove('nav-hidden');
    });

    [].slice.call(navLinks.querySelectorAll('a')).forEach(function(link){
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('click', function(e){
      if(nav.classList.contains('menu-open') && !nav.contains(e.target)){
        closeMobileMenu();
      }
    });

    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeMobileMenu();
    });
  }

  var lastY = window.scrollY || 0;
  var tickingNavHide = false;
  function mobileHideNav(){
    if(!nav || window.innerWidth > 980) return;
    var yNow = window.scrollY || 0;
    var goingDown = yNow > lastY + 8;
    var goingUp = yNow < lastY - 8;

    if(nav.classList.contains('menu-open')){
      nav.classList.remove('nav-hidden');
      lastY = yNow;
      return;
    }

    if(goingDown && yNow > 160) nav.classList.add('nav-hidden');
    if(goingUp || yNow < 90) nav.classList.remove('nav-hidden');
    lastY = yNow;
  }

  window.addEventListener('scroll', function(){
    if(!tickingNavHide){
      requestAnimationFrame(function(){
        mobileHideNav();
        tickingNavHide = false;
      });
      tickingNavHide = true;
    }
  }, {passive:true});

  window.addEventListener('resize', function(){
    if(window.innerWidth > 980){
      closeMobileMenu();
      if(nav) nav.classList.remove('nav-hidden');
    }
  });

  /* Slim mobile call/text notification bar */
  var stickyCall = document.querySelector('.sticky-call');
  var stickyDismiss = document.querySelector('.sticky-dismiss, .sticky-close');

  if(stickyCall){
    try {
      if(sessionStorage.getItem('gl_sticky_call_hidden') === '1'){
        stickyCall.classList.add('is-hidden');
        document.body.classList.add('sticky-hidden');
      }
    } catch(e){}

    if(stickyDismiss){
      stickyDismiss.addEventListener('click', function(e){
        e.preventDefault();
        stickyCall.classList.add('is-hidden');
        document.body.classList.add('sticky-hidden');
        try { sessionStorage.setItem('gl_sticky_call_hidden','1'); } catch(err){}
      });
    }
  }

})();
