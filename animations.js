/* Animations discrètes et petits composants. Chargé en defer, après le script de la page.
   Rien ne s'anime si l'utilisateur demande moins d'animations ; sans JS, tout reste visible. */
(function(){
  var $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Bouton retour en haut et filet sous l'en-tête */
  var top=document.createElement('button');
  top.type='button';top.className='to-top';top.setAttribute('aria-label','Revenir en haut de la page');
  top.innerHTML='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg>';
  top.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'});});
  document.body.appendChild(top);
  var nav=document.querySelector('.nav');
  function onScroll(){var y=window.scrollY;top.classList.toggle('show',y>window.innerHeight);if(nav)nav.classList.toggle('scrolled',y>8);}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();

  /* Copier l'adresse e-mail */
  var mail=document.querySelector('.cta-card .mail');
  if(mail&&navigator.clipboard){
    var addr=mail.getAttribute('href').replace('mailto:','');
    var copy=document.createElement('button');
    copy.type='button';copy.className='copy';copy.textContent="Copier l'adresse";
    copy.addEventListener('click',function(){
      navigator.clipboard.writeText(addr).then(function(){
        copy.textContent='Copié';copy.classList.add('done');
        setTimeout(function(){copy.textContent="Copier l'adresse";copy.classList.remove('done');},2000);
      });
    });
    mail.insertAdjacentElement('afterend',copy);
  }

  /* Soulignement glissant des onglets et des filtres */
  $$('.tabs,.chips-bar').forEach(function(bar){
    var ind=document.createElement('span');ind.className='ind';ind.setAttribute('aria-hidden','true');bar.appendChild(ind);
    function place(){var on=bar.querySelector('.on,.active');if(!on)return;ind.style.width=on.offsetWidth+'px';ind.style.transform='translate('+on.offsetLeft+'px,'+(on.offsetTop+on.offsetHeight)+'px)';}
    bar.addEventListener('click',function(e){if(e.target.closest('button'))requestAnimationFrame(place);});
    window.addEventListener('resize',place);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(place);
    place();bar.classList.add('has-ind');
  });

  if(reduce)return;
  document.documentElement.classList.add('anim');

  /* Fondu à la réapparition (panneaux d'onglets, éléments filtrés) */
  function replay(el,delay){el.classList.remove('pop');void el.offsetWidth;el.style.animationDelay=(delay||0)+'ms';el.classList.add('pop');}
  $$('.tab').forEach(function(t){t.addEventListener('click',function(){$$('.tpan:not([hidden])').forEach(function(p){replay(p);});});});
  $$('.chips-bar').forEach(function(bar){
    var grid=document.getElementById(bar.dataset.target);
    bar.addEventListener('click',function(e){
      if(!e.target.closest('button'))return;
      requestAnimationFrame(function(){$$('[data-k]:not(.hidden),[data-cat]:not(.hidden)',grid).slice(0,12).forEach(function(it,i){replay(it,i*40);});});
    });
  });

  /* Apparition au défilement, avec un léger décalage entre les lignes d'une même liste */
  var rows='.fq,.bt,.fd,.eng,.tl-item,.feat,.proj,.cert,.hl>div,.h2-stats>div,.checks li,.sk-group,.event,.lang,.memo-figs>div,.cert-flow>div,.p-cards>.pc,.p-steps>.ps';
  $$(rows).forEach(function(el){
    el.classList.remove('reveal');el.classList.add('rise');
    var i=Array.prototype.indexOf.call(el.parentNode.children,el);
    el.style.setProperty('--d',Math.min(i,6)*60+'ms');
  });
  var watched=$$('.rise,.steps,.pchart,.h2-stats,.memo-figs');
  var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target);}});},{threshold:.12,rootMargin:'0px 0px -6% 0px'});
  watched.forEach(function(el){io.observe(el);});

  /* Barres du graphique : chacune pousse avec un petit retard */
  $$('.pchart rect').forEach(function(r,i){r.style.transitionDelay=(i*22)+'ms';});

  /* Compteurs : 0 → valeur, en gardant le format français d'origine */
  function countUp(el){
    var node=el.firstChild;if(!node||node.nodeType!==3)return;
    var m=node.nodeValue.match(/^([\d\s  ]+)(,(\d+))?(.*)$/);if(!m)return;
    var sep=(m[1].match(/[\s  ]/)||[''])[0];
    var dec=m[3]?m[3].length:0;
    var target=parseFloat(m[1].replace(/[\s  ]/g,'')+(dec?'.'+m[3]:''));
    var rest=m[4],t0=null,dur=900;
    function fmt(v){
      var s=v.toFixed(dec).split('.');
      s[0]=s[0].replace(/\B(?=(\d{3})+(?!\d))/g,sep||' ');
      return s[0]+(dec?','+s[1]:'')+rest;
    }
    node.nodeValue=fmt(0);
    function step(t){if(!t0)t0=t;var p=Math.min((t-t0)/dur,1);node.nodeValue=fmt(target*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(step);}
    requestAnimationFrame(step);
    setTimeout(function(){node.nodeValue=fmt(target);},dur+150);
  }
  var nums=$$('.h2-stats b,.memo-figs b');
  var cio=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){countUp(en.target);cio.unobserve(en.target);}});},{threshold:.6});
  nums.forEach(function(n){cio.observe(n);});
})();
