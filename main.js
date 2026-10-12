/* Portfolio de Chancelle AHOMAGNON : comportements et animations.
   Amélioration progressive : sans ce fichier (ou sans GSAP), le site reste complet.
   Si l'utilisateur demande moins d'animations, rien ne bouge et tout reste visible. */
(function () {
  'use strict';
  window.__site = true;

  var d = document, h = d.documentElement, w = window;
  /* Si le filet de sécurité du head a retiré les classes (CDN lent), on les rétablit. */
  h.classList.add('js');
  try { if (!w.matchMedia('(prefers-reduced-motion: reduce)').matches) h.classList.add('motion'); } catch (e) {}
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var mm = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  var reduce = !h.classList.contains('motion');
  var fine = mm('(hover: hover) and (pointer: fine)');
  var G = w.gsap, ST = w.ScrollTrigger;
  var hasG = !!(G && ST);
  if (hasG) G.registerPlugin(ST);

  /* ---------- Défilement doux (bureau seulement) ---------- */
  var lenis = null;
  if (!reduce && hasG && w.Lenis && fine) {
    try {
      lenis = new w.Lenis({ duration: 1.05, smoothWheel: true });
      lenis.on('scroll', ST.update);
      G.ticker.add(function (t) { lenis.raf(t * 1000); });
      G.ticker.lagSmoothing(0);
    } catch (e) { lenis = null; }
  }

  var nav = $('#nav');
  function navH() { return nav ? nav.offsetHeight : 68; }

  /* ---------- Onglets accessibles ---------- */
  function setupTabs(root) {
    var list = $('[role=tablist]', root);
    if (!list) return;
    var tabs = $$('[role=tab]', list);
    var panels = tabs.map(function (t) { return d.getElementById(t.getAttribute('aria-controls')); });
    var ind = d.createElement('span');
    ind.className = 'tab-ind'; ind.setAttribute('aria-hidden', 'true');
    list.appendChild(ind);
    function place() {
      var t = tabs.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0];
      if (!t) return;
      ind.style.transform = 'translateX(' + t.offsetLeft + 'px) scaleX(' + (t.offsetWidth / 100) + ')';
    }
    function select(i, focus, animate) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
        if (on && animate && !reduce) {
          panels[j].classList.remove('swap'); void panels[j].offsetWidth; panels[j].classList.add('swap');
        }
      });
      if (focus) tabs[i].focus();
      var t = tabs[i];
      if (t.offsetLeft < list.scrollLeft || t.offsetLeft + t.offsetWidth > list.scrollLeft + list.clientWidth) {
        list.scrollLeft = t.offsetLeft - 16;
      }
      place();
      if (hasG) ST.refresh();
    }
    panels.forEach(function (p) { p.tabIndex = 0; });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i, false, true); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, j = null;
        if (e.key === 'ArrowRight') j = (i + 1) % n;
        else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
        else if (e.key === 'Home') j = 0;
        else if (e.key === 'End') j = n - 1;
        if (j !== null) { e.preventDefault(); select(j, true, true); }
      });
    });
    var init = 0;
    tabs.forEach(function (t, i) { if (t.getAttribute('aria-selected') === 'true') init = i; });
    select(init, false, false);
    w.addEventListener('resize', place);
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(place);
    root._reveal = function (el) {
      for (var j = 0; j < panels.length; j++) {
        if (panels[j] === el || panels[j].contains(el)) { if (panels[j].hidden) select(j, false, false); return true; }
      }
      return false;
    };
  }
  var tabRoots = $$('[data-tabs]');
  tabRoots.forEach(setupTabs);
  function revealInTabs(el) { tabRoots.forEach(function (r) { if (r._reveal) r._reveal(el); }); }

  /* ---------- Ancres : défilement, focus, onglet ---------- */
  function goTo(el, focus) {
    var off = navH() + 12;
    if (el.id === 'top') { if (lenis) lenis.scrollTo(0); else w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    else if (lenis) lenis.scrollTo(el, { offset: -off });
    else w.scrollTo({ top: el.getBoundingClientRect().top + w.pageYOffset - off, behavior: reduce ? 'auto' : 'smooth' });
    if (focus) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    }
  }
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute('href').slice(1));
    var el = id && d.getElementById(id);
    if (!el) return;
    e.preventDefault();
    closeMenu(false);
    revealInTabs(el);
    goTo(el, true);
    if (history.pushState) history.pushState(null, '', '#' + id);
  });

  /* ---------- Barre de navigation, progression ---------- */
  var prog = $('.progress'), lastY = w.pageYOffset, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = w.pageYOffset, max = h.scrollHeight - h.clientHeight;
      if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      if (nav) {
        nav.classList.toggle('scrolled', y > 10);
        var hide = !reduce && y > lastY + 2 && y > 500 && !d.body.classList.contains('menu-open') && !nav.contains(d.activeElement);
        if (y < lastY - 2 || y < 500) nav.classList.remove('hide');
        else if (hide) nav.classList.add('hide');
      }
      lastY = y;
    });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (nav) nav.addEventListener('focusin', function () { nav.classList.remove('hide'); });

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger'), links = $('#navLinks');
  $$('#navLinks a').forEach(function (a, i) { a.style.setProperty('--i', i); });
  function openMenu() {
    d.body.classList.add('menu-open');
    burger.setAttribute('aria-expanded', 'true');
    $('.sr', burger).textContent = 'Fermer le menu';
    d.body.style.overflow = 'hidden';
    if (lenis) lenis.stop();
    setTimeout(function () { var f = links && $('a', links); if (f) f.focus(); }, 60);
  }
  function closeMenu(refocus) {
    if (!d.body.classList.contains('menu-open')) return;
    d.body.classList.remove('menu-open');
    burger.setAttribute('aria-expanded', 'false');
    $('.sr', burger).textContent = 'Ouvrir le menu';
    d.body.style.overflow = '';
    if (lenis) lenis.start();
    if (refocus) burger.focus();
  }
  if (burger) {
    burger.addEventListener('click', function () { d.body.classList.contains('menu-open') ? closeMenu(true) : openMenu(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(true); });
    w.addEventListener('resize', function () { if (!mm('(max-width: 1060px)')) closeMenu(false); });
  }

  /* ---------- Section active dans la navigation ---------- */
  var spyLinks = $$('#navLinks a[href^="#"], .pj-toc a[href^="#"]');
  if (spyLinks.length && 'IntersectionObserver' in w) {
    var spy = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        spyLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Compétences : preuves dans un panneau ---------- */
  var proof = $('#proof');
  if (proof) {
    var proofHome = proof.parentNode, selected = null;
    $$('details.sk').forEach(function (dt) {
      var name = $('summary', dt).textContent;
      var items = $$('li', dt).map(function (li) {
        var b = $('b', li), k = b ? b.textContent : '';
        return { k: k, v: li.textContent.slice(k.length) };
      });
      var btn = d.createElement('button');
      btn.type = 'button'; btn.className = 'sk has'; btn.textContent = name;
      btn.setAttribute('aria-pressed', 'false'); btn.setAttribute('aria-controls', 'proof');
      btn.addEventListener('click', function () {
        if (selected) selected.setAttribute('aria-pressed', 'false');
        selected = btn; btn.setAttribute('aria-pressed', 'true');
        proof.textContent = '';
        var k = d.createElement('p'); k.className = 'k'; k.textContent = 'Preuves';
        var t = d.createElement('h3'); t.textContent = name;
        var ul = d.createElement('ul');
        items.forEach(function (it, i) {
          var li = d.createElement('li'); li.style.setProperty('--i', i);
          var b = d.createElement('b'); b.textContent = it.k;
          li.appendChild(b); li.appendChild(d.createTextNode(it.v)); ul.appendChild(li);
        });
        proof.appendChild(k); proof.appendChild(t); proof.appendChild(ul);
        if (mm('(max-width: 940px)')) {
          var grp = btn.closest('.sk-group');
          if (grp && grp.nextSibling !== proof) grp.parentNode.insertBefore(proof, grp.nextSibling);
          proof.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
        } else if (proof.parentNode !== proofHome) proofHome.appendChild(proof);
      });
      dt.parentNode.replaceChild(btn, dt);
    });
    w.addEventListener('resize', function () { if (!mm('(max-width: 940px)') && proof.parentNode !== proofHome) proofHome.appendChild(proof); });
  }

  /* ---------- Repliables : ouverts sur grand écran, compacts sur mobile ---------- */
  if (mm('(min-width: 900px)')) $$('.more-d').forEach(function (x) { x.open = true; });
  if (mm('(max-width: 940px)')) $$('.sk-group').forEach(function (g, i) { if (i > 0) g.open = false; });
  else $$('.sk-group > summary').forEach(function (s) { s.setAttribute('tabindex', '-1'); s.addEventListener('click', function (e) { e.preventDefault(); }); });

  /* ---------- Certifications : six d'abord, le reste à la demande ---------- */
  var certList = $('#certList'), certLimit = 6, certAll = false, moreBtn = null;
  function applyLimit() {
    if (!certList) return;
    var f = ($('.fbtn[aria-pressed=true]') || {}).getAttribute ? $('.fbtn[aria-pressed=true]').getAttribute('data-f') : 'all';
    var shown = 0;
    $$('.cert').forEach(function (c) {
      var inCat = f === 'all' || c.getAttribute('data-cat') === f;
      var show = inCat && (certAll || f !== 'all' || shown < certLimit);
      if (inCat) shown++;
      c.hidden = !show;
    });
    if (moreBtn) moreBtn.hidden = certAll || f !== 'all';
  }
  if (certList) {
    moreBtn = d.createElement('button');
    moreBtn.type = 'button'; moreBtn.className = 'btn btn-ghost cert-more';
    moreBtn.innerHTML = 'Afficher les 17 certifications <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
    moreBtn.addEventListener('click', function () {
      certAll = true; applyLimit();
      var first = $$('.cert')[certLimit]; if (first) { var s = $('summary', first); if (s) s.focus(); }
      if (hasG) ST.refresh();
    });
    certList.parentNode.insertBefore(moreBtn, certList.nextSibling);
    applyLimit();
  }
  /* ---------- Certifications : filtres ---------- */
  var fbtns = $$('.fbtn'), certs = $$('.cert'), certStatus = $('#certStatus');
  fbtns.forEach(function (b) {
    b.addEventListener('click', function () {
      fbtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-f'), n = 0;
      applyLimit();
      certs.forEach(function (c) {
        var show = !c.hidden;
        if (show) {
          n++;
          if (!reduce) { c.style.animation = 'none'; void c.offsetWidth; c.style.animation = 'swap .55s cubic-bezier(.16,1,.3,1) ' + (n * 35) + 'ms both'; }
        }
      });
      if (certStatus) certStatus.textContent = n + (n > 1 ? ' certifications affichées' : ' certification affichée');
      if (hasG) ST.refresh();
    });
  });

  /* ---------- Copier l'adresse ---------- */
  var mail = $('.contact .mail');
  if (mail && navigator.clipboard) {
    var addr = mail.getAttribute('href').replace('mailto:', '');
    var copy = d.createElement('button');
    copy.type = 'button'; copy.className = 'copy'; copy.textContent = "Copier l'adresse";
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(addr).then(function () {
        copy.textContent = 'Adresse copiée'; copy.classList.add('done');
        setTimeout(function () { copy.textContent = "Copier l'adresse"; copy.classList.remove('done'); }, 2200);
      }, function () {});
    });
    mail.insertAdjacentElement('afterend', copy);
  }

  /* ---------- Vidéo : couverture recadrée (sans filigrane) ---------- */
  $$('.video[data-cover]').forEach(function (fig) {
    var v = $('video', fig); if (!v) return;
    var btn = d.createElement('button');
    btn.type = 'button'; btn.className = 'vcover';
    btn.setAttribute('aria-label', fig.getAttribute('data-label') || 'Lire la vidéo');
    btn.innerHTML = '<img src="' + fig.getAttribute('data-cover') + '" alt=""><span><i><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg></i>' + (fig.getAttribute('data-text') || 'Lire la vidéo') + '</span>';
    btn.addEventListener('click', function () {
      btn.hidden = true;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.focus();
    });
    fig.insertBefore(btn, fig.firstChild);
  });

  /* ---------- Moments clés : carrousel ou défilement épinglé ---------- */
  var mo = $('#moments'), pinned = false;
  if (mo) {
    var track = $('.mo-track', mo), cards = $$('.mo-card', mo), ctrl = $('.mo-ctrl', mo);
    var prev = $('.mo-prev', mo), next = $('.mo-next', mo), cnt = $('.mo-count', mo), bar = $('.mo-progress i', mo);
    var upd = function () {
      if (pinned) return;
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      if (bar) bar.style.transform = 'scaleX(' + p + ')';
      var idx = Math.round(p * (cards.length - 1));
      if (cnt) cnt.textContent = (idx + 1) + ' / ' + cards.length;
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    };
    var step = function (dir) {
      var gap = parseFloat(getComputedStyle(track).columnGap) || 20;
      track.scrollBy({ left: dir * (cards[0].getBoundingClientRect().width + gap), behavior: reduce ? 'auto' : 'smooth' });
    };
    if (ctrl) ctrl.hidden = false;
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    track.addEventListener('scroll', upd, { passive: true });
    w.addEventListener('resize', upd);
    upd();

    if (hasG && !reduce) {
      G.matchMedia().add('(min-width: 1024px) and (min-height: 600px)', function () {
        mo.classList.add('mo-pinned'); pinned = true;
        track.removeAttribute('tabindex');
        var dist = function () { return Math.max(0, track.scrollWidth - mo.clientWidth); };
        var tw = G.to(track, {
          x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: {
            trigger: $('.mo-pin', mo), start: 'top top', end: function () { return '+=' + dist(); },
            pin: true, scrub: 0.7, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (s) { if (bar) bar.style.transform = 'scaleX(' + s.progress + ')'; }
          }
        });
        cards.forEach(function (c) {
          var y = $('.mo-year', c);
          if (y) G.fromTo(y, { xPercent: 22 }, { xPercent: -22, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
        });
        var onFocus = function (e) {
          var c = e.target.closest('.mo-card'); if (!c) return;
          var st = tw.scrollTrigger, dd = dist(); if (!dd) return;
          var p = Math.min(1, Math.max(0, (c.offsetLeft - (mo.clientWidth - c.offsetWidth) / 2) / dd));
          var y = st.start + (st.end - st.start) * p;
          if (lenis) lenis.scrollTo(y, { immediate: true }); else w.scrollTo(0, y);
        };
        track.addEventListener('focusin', onFocus);
        return function () {
          mo.classList.remove('mo-pinned'); pinned = false;
          track.setAttribute('tabindex', '0');
          track.removeEventListener('focusin', onFocus);
          upd();
        };
      });
    }
  }

  /* ---------- Tout ce qui suit est purement décoratif ---------- */
  if (reduce) { staticCanvas(); afterSetup(); return; }

  /* Titres : mots qui montent */
  $$('[data-split]').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(p)); return; }
            var o = d.createElement('span'); o.className = 'w';
            var inn = d.createElement('span'); inn.textContent = p; inn.style.setProperty('--i', i++);
            o.appendChild(inn); frag.appendChild(o);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('w')) walk(n);
      });
    })(el);
  });

  /* Héros : lettres du nom */
  var ci = 0;
  $$('[data-chars]').forEach(function (el) {
    var t = el.textContent; el.textContent = '';
    Array.prototype.forEach.call(t, function (ch) {
      if (ch === ' ') { el.appendChild(d.createTextNode(' ')); return; }
      var s = d.createElement('span'); s.className = 'ch'; s.textContent = ch; s.style.setProperty('--c', ci++);
      el.appendChild(s);
    });
  });
  var go = function () { requestAnimationFrame(function () { h.classList.add('loaded'); }); };
  if (d.fonts && d.fonts.ready) { var t0 = setTimeout(go, 900); d.fonts.ready.then(function () { clearTimeout(t0); go(); }); } else go();

  /* Apparitions au défilement */
  if ('IntersectionObserver' in w) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
    $$('.rv, .rv-scale, [data-split]').forEach(function (el) { io.observe(el); });
  } else $$('.rv, .rv-scale, [data-split]').forEach(function (el) { el.classList.add('in'); });

  /* Compteurs */
  function countUp(el) {
    var node = el.firstChild; if (!node || node.nodeType !== 3) return;
    var m = node.nodeValue.match(/^([\d\s  ]+)(,(\d+))?(.*)$/); if (!m) return;
    var sep = (m[1].match(/[\s  ]/) || [''])[0];
    var dec = m[3] ? m[3].length : 0;
    var target = parseFloat(m[1].replace(/[\s  ]/g, '') + (dec ? '.' + m[3] : ''));
    var rest = m[4], t0 = null, dur = 1400;
    var fmt = function (v) {
      var s = v.toFixed(dec).split('.');
      s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, sep || ' ');
      return s[0] + (dec ? ',' + s[1] : '') + rest;
    };
    node.nodeValue = fmt(0);
    (function stepC(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / dur, 1); node.nodeValue = fmt(target * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(stepC); })(performance.now());
    setTimeout(function () { node.nodeValue = fmt(target); }, dur + 200);
  }
  var nums = $$('[data-count], .kpi b, .pj-stat b, .figs3 b');
  if ('IntersectionObserver' in w) {
    var cio = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); } }); }, { threshold: 0.6 });
    nums.forEach(function (n) { cio.observe(n); });
  }

  /* Halo qui suit le pointeur et boutons aimantés */
  if (fine) {
    $$('.spot').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
    if (hasG) {
      $$('.mag').forEach(function (el) {
        var xTo = G.quickTo(el, 'x', { duration: 0.5, ease: 'power3' }), yTo = G.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
        el.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35);
        });
        el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
      });
    }
  }

  /* Effets liés au défilement (GSAP) */
  if (hasG) {
    var hw = $('.hero .wrap');
    if (hw) G.to(hw, { yPercent: -10, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    $$('[data-parallax]').forEach(function (el) {
      G.fromTo(el, { yPercent: 7 }, { yPercent: -7, ease: 'none', scrollTrigger: { trigger: el.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.phone.p2').forEach(function (el) {
      G.fromTo(el, { rotation: 14, y: 40 }, { rotation: 6, y: -10, ease: 'none', scrollTrigger: { trigger: el.closest('.proj-media'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.pj-hero h1, .hello').forEach(function (el) {
      G.to(el, { yPercent: -18, ease: 'none', scrollTrigger: { trigger: el, start: 'top 30%', end: 'bottom top', scrub: true } });
    });
  }

  rainCanvas();
  afterSetup();

  /* ---------- Héros : pluie qui remplit un histogramme de pertes ---------- */
  function rainCanvas() {
    var cv = $('.hero-canvas'); if (!cv || !cv.getContext) return;
    var ctx = cv.getContext('2d'), hero = cv.parentNode;
    var W = 0, H = 0, base = 0, mob = false, bins = [], drops = [], raf = 0, last = 0, acc = 0, visible = true;
    function build(full) {
      var dpr = Math.min(w.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mob = W < 900;
      var x0 = mob ? 16 : Math.round(W * 0.6), x1 = W - (mob ? 16 : Math.max(32, (W - 1240) / 2));
      var bw = mob ? 7 : 12, gap = mob ? 4 : 6;
      base = H - (mob ? 64 : 64);
      var maxH = mob ? 116 : H * 0.6;
      var n = Math.max(8, Math.floor((x1 - x0 + gap) / (bw + gap)));
      var seed = 11, r = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      var e1 = Math.round(n * 0.3), e2 = Math.round(n * 0.76), old = bins;
      bins = [];
      for (var i = 0; i < n; i++) {
        var ext = i === e1 || i === e2;
        var t = ext ? maxH * (i === e2 ? 0.95 : 0.66) : maxH * (0.05 + r() * 0.12);
        var prevB = old[i];
        bins.push({ x: x0 + i * (bw + gap), w: bw, t: t, h: full ? t : (prevB ? Math.min(t, prevB.h / (prevB.t || 1) * t) : 0), ext: ext });
      }
      drops = [];
    }
    function rr(x, y, wd, ht, rad) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, wd, ht, [rad, rad, 0, 0]); else ctx.rect(x, y, wd, ht);
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      if (!bins.length) return;
      ctx.strokeStyle = 'rgba(201,230,255,.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(bins[0].x - 10, base + 0.5); ctx.lineTo(bins[bins.length - 1].x + bins[0].w + 10, base + 0.5); ctx.stroke();
      bins.forEach(function (b) {
        if (b.h < 0.5) return;
        var y = base - b.h;
        if (b.ext) {
          var g = ctx.createLinearGradient(0, y, 0, base);
          g.addColorStop(0, mob ? 'rgba(140,208,255,.55)' : '#8cd0ff'); g.addColorStop(1, mob ? 'rgba(26,115,217,.45)' : '#1a73d9');
          ctx.fillStyle = g; ctx.shadowColor = 'rgba(77,179,255,.55)'; ctx.shadowBlur = mob ? 0 : 26;
        } else { ctx.fillStyle = 'rgba(201,230,255,.18)'; ctx.shadowBlur = 0; }
        rr(b.x, y, b.w, b.h, Math.min(3, b.w / 2)); ctx.fill(); ctx.shadowBlur = 0;
        if (b.ext && !mob && b.h > b.t * 0.92) {
          ctx.fillStyle = '#8cd0ff'; ctx.font = '500 11px "JetBrains Mono", Consolas, monospace'; ctx.textAlign = 'center';
          ctx.fillText('année extrême', b.x + b.w / 2, y - 12);
        }
      });
      if (drops.length) {
        ctx.strokeStyle = 'rgba(140,208,255,.6)'; ctx.lineWidth = 1.2; ctx.beginPath();
        drops.forEach(function (p) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 16); });
        ctx.stroke();
      }
    }
    function spawn(growing) {
      var pool = bins;
      if (growing && Math.random() < 0.55) { var un = bins.filter(function (b) { return b.h < b.t - 0.5; }); if (un.length) pool = un; }
      var b = pool[Math.floor(Math.random() * pool.length)];
      drops.push({ b: b, x: b.x + b.w / 2 + (Math.random() - 0.5) * 2, y: -30 - Math.random() * H * 0.25, v: (mob ? 560 : 760) + Math.random() * 420 });
    }
    function frame(t) {
      raf = 0;
      if (!visible || d.hidden) { last = 0; return; }
      var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016; last = t;
      var growing = false;
      for (var i = 0; i < bins.length; i++) if (bins[i].h < bins[i].t - 0.5) { growing = true; break; }
      acc += (growing ? (mob ? 70 : 120) : (mob ? 5 : 9)) * dt;
      while (acc > 1) { spawn(growing); acc--; }
      for (var j = drops.length - 1; j >= 0; j--) {
        var p = drops[j]; p.y += p.v * dt;
        if (p.y + 16 >= base - p.b.h) {
          if (p.b.h < p.b.t) p.b.h = Math.min(p.b.t, p.b.h + p.b.t * (p.b.ext ? 0.05 : 0.24));
          drops.splice(j, 1);
        }
      }
      draw();
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && visible && !d.hidden) raf = requestAnimationFrame(frame); }
    build(false); draw();
    if ('IntersectionObserver' in w) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; start(); }).observe(hero);
    d.addEventListener('visibilitychange', start);
    var rt; w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(false); draw(); }, 150); });
    setTimeout(start, 500);
  }

  /* Version immobile : histogramme complet, sans pluie */
  function staticCanvas() {
    var cv = $('.hero-canvas'); if (!cv || !cv.getContext) return;
    var hero = cv.parentNode, ctx = cv.getContext('2d');
    function paint() {
      var dpr = Math.min(w.devicePixelRatio || 1, 2), W = hero.clientWidth, H = hero.clientHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var mob = W < 900, x0 = mob ? 16 : Math.round(W * 0.6), x1 = W - (mob ? 16 : Math.max(32, (W - 1240) / 2));
      var bw = mob ? 7 : 12, gap = mob ? 4 : 6, base = H - 64, maxH = mob ? 116 : H * 0.6;
      var n = Math.max(8, Math.floor((x1 - x0 + gap) / (bw + gap)));
      var seed = 11, r = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      var e1 = Math.round(n * 0.3), e2 = Math.round(n * 0.76);
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(201,230,255,.25)'; ctx.beginPath(); ctx.moveTo(x0 - 10, base + 0.5); ctx.lineTo(x0 + n * (bw + gap), base + 0.5); ctx.stroke();
      for (var i = 0; i < n; i++) {
        var ext = i === e1 || i === e2, t = ext ? maxH * (i === e2 ? 0.95 : 0.66) : maxH * (0.05 + r() * 0.12), x = x0 + i * (bw + gap);
        ctx.fillStyle = ext ? (mob ? 'rgba(77,179,255,.5)' : '#4db3ff') : 'rgba(201,230,255,.18)';
        ctx.fillRect(x, base - t, bw, t);
        if (ext && !mob) { ctx.fillStyle = '#8cd0ff'; ctx.font = '500 11px "JetBrains Mono", Consolas, monospace'; ctx.textAlign = 'center'; ctx.fillText('année extrême', x + bw / 2, base - t - 12); }
      }
    }
    paint();
    var rt; w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(paint, 150); });
  }

  function afterSetup() {
    /* Ancre présente dans l'URL : ouvrir le bon onglet et s'y rendre une fois la mise en page stable */
    var id = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';
    var target = id && d.getElementById(id);
    if (target) revealInTabs(target);
    w.addEventListener('load', function () {
      if (hasG) ST.refresh();
      if (target) setTimeout(function () { goTo(target, false); }, 60);
    });
    if (hasG && d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ST.refresh(); });
  }
})();
