/* ==========================================================================
   MARIANA & JOÃO — Convite digital interativo
   --------------------------------------------------------------------------
   Índice
   01. Utilidades
   02. Montagem da arte (capa clonada do <template>)
   03. Layout responsivo + ajuste de tipografia do cardápio
   04. Envelope: inclinação 3D, abertura, saída do cartão
   05. Livro: virada de página (Pointer Events — mouse, toque e caneta)
   06. Navegação, teclado
   07. Poeira de luz (canvas, muito discreta)
   08. Música de fundo (MP3 + painel de volume; desligada por padrão)
   09. Início
   10. A nossa história (folha que desliza por cima do convite, depois do menu)
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- 01. UTILIDADES ------------------------------------------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp  = (a, b, t) => a + (b - a) * t;
  const wait  = (ms) => new Promise((r) => setTimeout(r, ms));
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut   = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SPEED  = reduce ? 0.45 : 1;                       // acelera tudo se o usuário prefere menos movimento

  /** Interpolação por rAF. Retorna uma Promise que resolve ao fim. */
  function tween(duration, ease, onFrame) {
    duration *= SPEED;
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = (now) => {
        const t = clamp((now - t0) / duration, 0, 1);
        onFrame(ease(t), t);
        t < 1 ? requestAnimationFrame(step) : resolve();
      };
      requestAnimationFrame(step);
    });
  }

  /* elementos */
  const stage     = $('#stage');
  const envScene  = $('#env-scene');
  const env       = $('#env');
  const envTilt   = $('#env-tilt');
  const envBack   = $('#env-back');
  const envFront  = $('#env-front');
  const envCard   = $('#env-card');
  const envGround = $('#env-ground');
  const envSlot   = $('#env-slot');
  const flapWrap  = $('#flap-wrap');
  const flap      = $('#flap');
  const seal      = $('#seal');
  const envHint   = $('#env-hint');
  const bookScene = $('#book-scene');
  const book      = $('#book');
  const leaf      = $('#leaf');
  const leafFront = $('#leaf-front');
  const shadeF    = $('#shade-front');
  const shadeB    = $('#shade-back');
  const cast      = $('#cast');
  const menuScroll = $('#menu-scroll');
  const menuInner  = $('#menu-inner');
  const btnPrev   = $('#btn-prev');
  const btnNext   = $('#btn-next');
  const navHint   = $('#nav-hint');
  const btnSound  = $('#btn-sound');
  const root      = document.documentElement;

  const state = {
    phase: 'intro',        // intro → opening → book (open/flipping)
    p: 0,                  // progresso da virada: 0 = capa · 1 = cardápio
    peek: 0,               // “espiadinha” ao passar o mouse
    dragging: false,
    storyOpen: false,
    pw: 360, ph: 640, shiftOpen: 0,
    flipAnim: 0,
  };

  /* ---------- 02. MONTAGEM DA ARTE ------------------------------------- */
  function mountCovers() {
    const tpl = $('#tpl-cover');
    envCard.appendChild(tpl.content.cloneNode(true));
    leafFront.insertBefore(tpl.content.cloneNode(true), leafFront.firstChild);
  }

  /* ---------- 03. LAYOUT RESPONSIVO ------------------------------------ */
  function layout() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const navH = vw < 520 ? 70 : 78;
    root.style.setProperty('--nav', navH + 'px');
    const availH = vh - navH - 22;
    const availW = vw - (vw < 520 ? 26 : 70);
    const A5 = 1.404;                                      // proporção A5 retrato (como no cardápio aprovado)

    let ph, pw;
    if (vh < 520) {                                        // celular deitado: página maior que a tela, com rolagem
      pw = Math.min(vw - 36, 500); ph = pw * 1.45;
    } else {
      ph = Math.min(availH, 1120); pw = ph / A5;
      if (pw > availW) { pw = availW; ph = Math.min(availH, pw * 2.05); }   // telas estreitas: página mais alta
      if (ph / pw < 1.3) pw = ph / 1.3;
    }
    state.pw = pw; state.ph = ph;
    root.style.setProperty('--pw', pw.toFixed(1) + 'px');
    root.style.setProperty('--ph', ph.toFixed(1) + 'px');

    /* envelope */
    const ew = Math.min(vw * 0.9, 600, (vh - navH) * 0.37 * 1.46);
    const eh = ew / 1.46;
    root.style.setProperty('--ew', ew.toFixed(1) + 'px');
    root.style.setProperty('--eh', eh.toFixed(1) + 'px');
    state.ew = ew; state.eh = eh;

    /* aberto: se cabe uma folha dupla, centraliza o par; senão, o cardápio fica centralizado */
    state.shiftOpen = vw >= pw * 2 + 40 ? pw / 2 : 0;
    book.classList.toggle('is-spread', state.shiftOpen > 0);   // folha dupla visível → mensagem de agradecimento fica na página da esquerda

    /* se a página ficar maior que a tela (celular deitado), libera rolagem vertical */
    document.body.style.overflowY = vh < 520 ? 'auto' : 'hidden';
    stage.style.position = vh < 520 ? 'absolute' : 'fixed';
    if (vh < 520) stage.style.height = Math.max(vh - navH, ph + 40) + 'px'; else stage.style.height = '';

    fitMenu();
    renderBook();
    if (state.phase === 'intro') applyEnv();
  }

  /** Ajusta o tamanho da fonte do cardápio para caber inteiro na página (sem cortar). */
  function fitMenu() {
    const pw = state.pw;
    const min = pw < 480 ? 14 : 13, max = Math.min(26, pw * 0.0235);
    menuScroll.classList.remove('is-scroll');
    menuInner.classList.remove('is-spread');
    menuInner.style.minHeight = '0';
    menuInner.style.justifyContent = 'flex-start';
    const avail = menuScroll.clientHeight;
    let lo = min, hi = Math.max(min, max), best = min;
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      menuInner.style.setProperty('--fs', mid + 'px');
      if (menuInner.getBoundingClientRect().height <= avail) { best = mid; lo = mid; } else { hi = mid; }
    }
    menuInner.style.setProperty('--fs', best + 'px');
    const fits = menuInner.getBoundingClientRect().height <= avail + 0.5;
    menuInner.style.minHeight = ''; menuInner.style.justifyContent = '';
    if (fits) {
      menuInner.classList.add('is-spread');                // sobra de espaço → distribui com elegância
    } else {
      menuScroll.classList.add('is-scroll');               // telas muito pequenas: rolagem interna, texto legível
    }
    markLineStarts();
  }

  /** Esconde o losango separador no começo de cada linha (quando os itens quebram de linha). */
  function markLineStarts() {
    $$('.row', menuInner).forEach((row) => {
      const items = $$('span', row);
      items.forEach((s, i) => s.classList.toggle('sol', i === 0 || s.offsetTop > items[i - 1].offsetTop + 2));
    });
  }

  menuScroll.addEventListener('scroll', () => {
    menuScroll.classList.toggle('is-end', menuScroll.scrollTop + menuScroll.clientHeight >= menuScroll.scrollHeight - 4);
  }, { passive: true });

  /* ---------- 04. ENVELOPE --------------------------------------------- */
  const envState = { ty: 0, sc: 1, rx: 0, ry: 0, tx: 0, tRx: 0, tRy: 0, tSc: 1, bob: 0 };
  let envLoop = 0;

  function applyEnv() {
    envTilt.style.transform =
      `perspective(1400px) translateY(${(envState.ty + envState.bob).toFixed(2)}px) rotateX(${envState.rx.toFixed(2)}deg) rotateY(${envState.ry.toFixed(2)}deg) scale(${envState.sc.toFixed(4)})`;
  }
  function envFrame(now) {
    envState.bob = reduce ? 0 : Math.sin(now / 1100) * 3.2;
    envState.rx = lerp(envState.rx, envState.tRx, 0.08);
    envState.ry = lerp(envState.ry, envState.tRy, 0.08);
    envState.sc = lerp(envState.sc, envState.tSc, 0.1);
    applyEnv();
    envLoop = requestAnimationFrame(envFrame);
  }
  function startEnvLoop() { cancelAnimationFrame(envLoop); envLoop = requestAnimationFrame(envFrame); }
  function stopEnvLoop()  { cancelAnimationFrame(envLoop); }

  /* inclinação sutil com o mouse (efeito tridimensional antes de abrir) */
  window.addEventListener('pointermove', (e) => {
    if (state.phase !== 'intro' || e.pointerType !== 'mouse' || reduce) return;
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    envState.tRy = nx * 7; envState.tRx = -ny * 5;
  });

  function setCard(y, s) {
    envCard.style.transform = `translate(-50%, -50%) translateY(${y}px) scale(${s})`;
  }
  function setFall(f) {          // 0..1 — corpo do envelope desce e some, o cartão permanece
    const els = [envBack, envFront, flapWrap, envSlot];
    const ty = f * state.eh * 1.5;
    const op = 1 - clamp((f - 0.72) / 0.28, 0, 1);        // camadas permanecem opacas e só somem juntas, já fora de cena
    els.forEach((el) => { el.style.transform = `translateY(${ty}px) rotate(${-2.5 * f}deg) scale(${1 - .06 * f})`; el.style.opacity = op; });
    envGround.style.opacity = op;
  }

  function crumbs() {             // pedacinhos de cera que se soltam do selo
    const r = seal.getBoundingClientRect();
    const host = env;
    const hr = host.getBoundingClientRect();
    const cx = r.left + r.width / 2 - hr.left, cy = r.top + r.height / 2 - hr.top;
    for (let i = 0; i < 7; i++) {
      const c = document.createElement('i');
      c.className = 'crumb';
      const s = 3 + Math.random() * 5;
      c.style.cssText = `width:${s}px;height:${s * (0.8 + Math.random() * .4)}px;left:${cx - s / 2}px;top:${cy - s / 2}px`;
      host.appendChild(c);
      const dx = (Math.random() - .5) * state.ew * .22, dy = state.eh * (.28 + Math.random() * .2);
      c.animate([
        { transform: 'translate(0,0) rotate(0)', opacity: 1 },
        { transform: `translate(${dx * .6}px,${-state.eh * .04}px) rotate(${Math.random() * 200}deg)`, opacity: 1, offset: .28 },
        { transform: `translate(${dx}px,${dy}px) rotate(${Math.random() * 400}deg)`, opacity: 0 },
      ], { duration: 1100 * SPEED + Math.random() * 300, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'forwards' }).onfinish = () => c.remove();
    }
  }

  async function openEnvelope() {
    if (state.phase !== 'intro') return;
    state.phase = 'opening';
    stage.dataset.phase = 'opening';
    env.classList.add('is-open');
    env.removeAttribute('tabindex');
    env.setAttribute('aria-label', 'Abrindo o convite');
    envState.tRx = 0; envState.tRy = 0;

    const eh = state.eh, ph = state.ph;
    const s0 = (eh * 0.80) / ph;                           // tamanho do cartão dentro do envelope
    const cardY0 = eh * 0.07;
    const cardUp = -eh * 0.74;                             // posição do cartão totalmente fora do bolso

    /* 1 · aproximação */
    envState.tSc = 1.07;
    await wait(650 * SPEED);

    /* 2 · selo se desfaz */
    seal.classList.add('is-cracked');
    crumbs();
    await wait(780 * SPEED);

    /* 3 · aba superior abre em 3D */
    let swapped = false;
    await tween(1250, easeInOut, (e) => {
      flap.style.transform = `rotateX(${(e * 180).toFixed(2)}deg)`;
      if (!swapped && e > 0.5) { swapped = true; flapWrap.style.zIndex = 1; }
    });
    await wait(120 * SPEED);

    /* 4 · o cartão desliza para fora */
    envCard.style.zIndex = 2;
    await tween(1350, (t) => easeOut(t), (e) => {
      setCard(lerp(cardY0, cardUp, e), s0);
    });
    envState.tSc = 1;
    await wait(220 * SPEED);

    /* 5 · cartão se aproxima e o envelope recua/desaparece */
    envCard.style.zIndex = 6;
    envCard.firstElementChild.classList.add('is-drawn');   // começa a “desenhar” as flores e o monograma
    setTimeout(() => stopEnvLoop(), 100);
    const sc0 = envState.sc, ty0 = envState.ty + envState.bob;
    await tween(1700, easeInOut, (e, t) => {
      setCard(lerp(cardUp, 0, e), lerp(s0, 1, e));
      setFall(smooth(clamp((t - 0.05) / 0.9, 0, 1)));
      envState.sc = lerp(sc0, 1, e); envState.ty = lerp(ty0, 0, e); envState.bob = 0; envState.rx = envState.ry = 0; applyEnv();
    });

    /* 6 · passa o cartão (idêntico à capa) para o livro, sem emenda visível */
    leafFront.firstElementChild.classList.add('is-drawn', 'no-anim');   // já desenhado
    await wait(2300 * SPEED);                              // deixa as flores terminarem de se desenhar
    state.phase = 'book';
    stage.dataset.phase = 'book';
    bookScene.removeAttribute('aria-hidden');
    loadStoryImages();
    envScene.style.transition = 'opacity .5s ease';
    envScene.style.opacity = 0;
    await wait(520);
    envScene.style.display = 'none';
    updateUI();
    scheduleTeaser();
  }

  env.addEventListener('click', openEnvelope);
  env.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEnvelope(); } });

  /* ---------- 05. LIVRO · VIRADA DE PÁGINA ----------------------------- */
  const bookEls = { leaf, book };

  function renderBook() {
    const pw = state.pw;
    const p = clamp(state.p + state.peek, 0, 1);
    const a = -180 * p;
    const rad = Math.abs(a) * Math.PI / 180;
    const s = Math.sin(p * Math.PI);                       // 0 → 1 → 0 durante a virada
    const skew = -1.3 * s;                                 // leve “curvatura” do papel
    leaf.style.transform = `rotateY(${a.toFixed(3)}deg) skewY(${skew.toFixed(3)}deg)`;

    /* luz: frente escurece ao levantar; verso clareia ao assentar */
    shadeF.style.opacity = (p < .5 ? smooth(p / .5) * .62 : .62).toFixed(3);
    shadeB.style.opacity = (p > .5 ? (1 - smooth((p - .5) / .5)) * .55 : .55).toFixed(3);

    /* sombra projetada no cardápio */
    const sw = pw * .62 * Math.sin(rad);
    const x0 = Math.max(0, pw * Math.cos(rad));
    cast.style.left = x0.toFixed(1) + 'px';
    cast.style.width = sw.toFixed(1) + 'px';
    cast.style.opacity = (Math.pow(Math.sin(rad), .8) * .9).toFixed(3);

    /* centraliza o par de páginas ao abrir */
    book.style.transform = `translateX(${(state.shiftOpen * smooth(p)).toFixed(1)}px)`;
    book.style.setProperty('--p', p.toFixed(3));
  }

  function revealInside() { $$('.art-menu, .art-inside').forEach((a) => a.classList.add('is-drawn')); }

  function animateTo(target, opts = {}) {
    cancelAnimationFrame(state.flipAnim);
    if (target > state.p) revealInside();
    const from = state.p;
    if (Math.abs(target - from) < 0.002) { state.p = target; renderBook(); finishFlip(target); return; }
    const dist = Math.abs(target - from);
    const dur = (opts.duration ?? (520 + 620 * dist)) * SPEED;
    const ease = opts.fromDrag ? easeOutQuart : easeInOut;
    const t0 = performance.now();
    state.peekStart = state.peek;
    stage.dataset.phase = 'flipping';
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      state.p = lerp(from, target, ease(t));
      state.peek = lerp(state.peekStart, 0, t);
      renderBook();
      if (t < 1) state.flipAnim = requestAnimationFrame(step);
      else { state.p = target; state.peek = 0; renderBook(); finishFlip(target); }
    };
    state.flipAnim = requestAnimationFrame(step);
  }

  function finishFlip(target) {
    stage.dataset.phase = target >= 1 ? 'open' : 'book';
    if (target >= 1) { menuScroll.scrollTop = 0; menuScroll.dispatchEvent(new Event('scroll')); }
    updateUI();
  }

  function updateUI() {
    const isOpen = state.p >= 0.999;
    const isClosed = state.p <= 0.001;
    btnPrev.disabled = !(state.p > 0.5);
    btnNext.disabled = state.storyOpen;                    // na página aberta, a seta leva à história
    btnNext.setAttribute('aria-label', isOpen ? 'Continuar para a nossa história' : 'Virar a página e ver o menu');
    book.classList.toggle('is-open', isOpen);
    setHint(isOpen ? 'Continue: a nossa história' : 'Arraste para virar a página');
    leafFront.setAttribute('aria-hidden', isOpen ? 'true' : 'false');
    $('#pg-menu').setAttribute('aria-hidden', isClosed ? 'true' : 'false');
  }
  let hintText = '';
  function setHint(t) {
    if (t === hintText) return; hintText = t;
    navHint.classList.add('is-swap');
    setTimeout(() => { navHint.textContent = t; navHint.classList.remove('is-swap'); }, 260);
  }

  const openBook  = () => { if (state.phase === 'intro' || state.phase === 'opening') return; hideTeaser(); animateTo(1); };
  const closeBook = () => { if (state.phase === 'intro' || state.phase === 'opening') return; animateTo(0); };

  /* — arraste (mouse, toque, caneta) — */
  const drag = { id: null, x0: 0, y0: 0, p0: 0, active: false, moved: false, samples: [] };

  bookScene.addEventListener('pointerdown', (e) => {
    if (state.phase === 'intro' || state.phase === 'opening') return;
    if (e.button !== undefined && e.button > 0) return;
    if (e.target.closest('button')) return;
    cancelAnimationFrame(state.flipAnim);
    hideTeaser();
    drag.id = e.pointerId; drag.x0 = e.clientX; drag.y0 = e.clientY; drag.p0 = state.p;
    drag.active = false; drag.moved = false; drag.samples = [{ x: e.clientX, t: performance.now() }];
    drag.onLeaf = !!e.target.closest('.leaf');
  });

  window.addEventListener('pointermove', (e) => {
    if (drag.id === null || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    drag.dx = dx;
    if (!drag.active) {
      if (Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy) * 1.15) {
        drag.active = true; drag.moved = true; revealInside();
        state.dragging = true; book.classList.add('is-dragging');
        stage.dataset.phase = 'flipping';
        try { bookScene.setPointerCapture(e.pointerId); } catch (_) {}
      } else if (Math.abs(dy) > 12) { drag.id = null; return; }   // gesto vertical: deixa rolar
      else return;
    }
    e.preventDefault();
    const span = state.pw * 0.92;
    state.p = clamp(drag.p0 - dx / span, 0, 1);
    state.peek = 0;
    drag.samples.push({ x: e.clientX, t: performance.now() });
    if (drag.samples.length > 6) drag.samples.shift();
    renderBook();
  }, { passive: false });

  function endDrag(e) {
    if (drag.id === null || (e && e.pointerId !== drag.id)) return;
    const wasActive = drag.active;
    drag.id = null; state.dragging = false; book.classList.remove('is-dragging');
    try { bookScene.releasePointerCapture(e.pointerId); } catch (_) {}
    if (wasActive) {
      const s = drag.samples; let v = 0;                                 // velocidade em px/ms
      if (s.length > 1) { const a = s[0], b = s[s.length - 1]; v = (b.x - a.x) / Math.max(1, b.t - a.t); }
      const vp = -v / (state.pw * 0.92) * 220;                           // projeção do gesto
      const target = state.p + vp > 0.5 ? 1 : 0;
      if (drag.p0 >= 0.999 && state.p >= 0.999 && drag.dx < -70) { animateTo(1, { fromDrag: true }); openStory(); return; }   // gesto de virar além do menu
      animateTo(target, { fromDrag: true });
    } else if (e && e.type === 'pointerup') {
      /* toque simples */
      if (state.p < 0.5 && drag.onLeaf) openBook();
      else if (state.p >= 0.5 && drag.onLeaf) closeBook();
      else if (state.p >= 0.5 && state.shiftOpen > 0) {
        /* toque na página esquerda (visível quando há folha dupla) já cai em .leaf */
      }
    }
  }
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', (e) => {
    if (drag.id === null || e.pointerId !== drag.id) return;
    drag.id = null; state.dragging = false; book.classList.remove('is-dragging');
    animateTo(state.p > 0.5 ? 1 : 0, { fromDrag: true });
  });

  /* — “espiadinha” ao passar o mouse sobre a capa — */
  let peekRaf = 0;
  function peekTo(v) {
    cancelAnimationFrame(peekRaf);
    const step = () => {
      if (state.dragging || state.flipAnim && stage.dataset.phase === 'flipping') return;
      state.peek = lerp(state.peek, v, 0.14);
      if (Math.abs(state.peek - v) < 0.001) { state.peek = v; renderBook(); return; }
      renderBook(); peekRaf = requestAnimationFrame(step);
    };
    peekRaf = requestAnimationFrame(step);
  }
  leafFront.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && state.p < 0.01 && !state.dragging && stage.dataset.phase === 'book') peekTo(0.045); });
  leafFront.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && state.p < 0.01) peekTo(0); });

  /* — dica de gesto: após alguns segundos parado, a capa “respira” — */
  let teaserTimer = 0, teaserRaf = 0, teasing = false;
  function scheduleTeaser() {
    clearTimeout(teaserTimer);
    teaserTimer = setTimeout(runTeaser, 4200);
  }
  function hideTeaser() { clearTimeout(teaserTimer); cancelAnimationFrame(teaserRaf); if (teasing) { teasing = false; state.peek = 0; renderBook(); } }
  function runTeaser() {
    if (state.p > 0.01 || state.dragging || reduce || stage.dataset.phase !== 'book') return;
    teasing = true;
    const t0 = performance.now(), D = 1700;
    const step = (now) => {
      const t = clamp((now - t0) / D, 0, 1);
      state.peek = Math.sin(t * Math.PI) * 0.075 * (t < .5 ? 1 : .8);
      renderBook();
      if (t < 1 && teasing) teaserRaf = requestAnimationFrame(step);
      else { teasing = false; state.peek = 0; renderBook(); teaserTimer = setTimeout(runTeaser, 7000); }
    };
    teaserRaf = requestAnimationFrame(step);
  }

  /* ---------- 06. NAVEGAÇÃO / TECLADO ---------------------------------- */
  btnNext.addEventListener('click', () => (state.p >= 0.999 ? openStory() : openBook()));
  btnPrev.addEventListener('click', closeBook);
  leafFront.querySelector('.cover-hint') && leafFront.addEventListener('click', (e) => {
    if (e.target.closest('.cover-hint')) { e.stopPropagation(); }
  });
  window.addEventListener('keydown', (e) => {
    if (state.phase === 'intro') return;
    if (state.storyOpen) { if (e.key === 'Escape') closeStory(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { state.p >= 0.999 ? openStory() : openBook(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || e.key === 'Escape') { closeBook(); }
  });

  /* ---------- 07. POEIRA DE LUZ ---------------------------------------- */
  (function dust() {
    if (reduce) return;
    const cv = $('#dust'), ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = 1, parts = [], running = true;
    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = cv.width = Math.round(window.innerWidth * dpr); H = cv.height = Math.round(window.innerHeight * dpr);
    }
    function make() {
      const n = window.innerWidth < 600 ? 14 : 24;
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: (0.6 + Math.random() * 1.5) * dpr, v: (4 + Math.random() * 9) * dpr / 60,
        ph: Math.random() * 6.28, sw: 8 + Math.random() * 18, a: 0.16 + Math.random() * 0.26, tw: 0.4 + Math.random() * 0.9,
      }));
    }
    function frame(now) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.y -= p.v; p.ph += 0.004;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        const x = p.x + Math.sin(p.ph) * p.sw * dpr;
        const a = p.a * (0.55 + 0.45 * Math.sin(now / 1000 * p.tw + p.ph));
        const g = ctx.createRadialGradient(x, p.y, 0, x, p.y, p.r * 4);
        g.addColorStop(0, `rgba(226,190,140,${a})`); g.addColorStop(1, 'rgba(226,190,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, p.y, p.r * 4, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    size(); make(); requestAnimationFrame(frame);
    window.addEventListener('resize', () => { size(); make(); });
    document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(frame); });
  })();

  /* ---------- 08. MÚSICA DE FUNDO (MP3) --------------------------------- */
  /* O arquivo MP3 fica na mesma pasta do index.html. Só é carregado/tocado depois do clique no botão de som. */
  const MUSIC_SRC = 'Fundo-Musical-para-Casamento.mp3';
  const MUSIC_CFG = { volume: 0.15, fadeIn: 2000, fadeOut: 1200, slide: 140 };   // volume inicial 15% · fades em ms · suavização do slider em ms

  const volPanel  = $('#vol-panel');
  const volRange  = $('#vol-range');
  const volVal    = $('#vol-val');
  const volToggle = $('#vol-toggle');
  const volMsg    = $('#vol-msg');

  /* Estado único: saída = volume do visitante (suavizado) × fade. Fade e slider nunca disputam a mesma variável. */
  const music = {
    el: null, ctx: null, gain: null, viaGain: false,
    on: false, open: false, resume: false,
    vol: MUSIC_CFG.volume, shown: MUSIC_CFG.volume,        // volume escolhido · volume efetivamente aplicado (suavizado)
    fade: 0, fadeFrom: 0, fadeTo: 0, fadeT0: 0, fadeDur: 1,
    raf: 0, last: 0, msgTimer: 0,
  };

  /* iOS ignora HTMLMediaElement.volume (fica sempre 1): nesse caso o volume passa por um GainNode. */
  function volumeIsSettable() {
    try { const a = new Audio(); a.volume = 0.5; return Math.abs(a.volume - 0.5) < 0.001; } catch (_) { return true; }
  }

  function ensureAudio() {
    if (music.el && !music.el.error) return true;
    if (music.el) { try { music.el.pause(); } catch (_) {} music.el = null; }      // recria após erro (ex.: arquivo ainda não colocado)
    const el = new Audio();
    el.loop = true; el.preload = 'auto'; el.setAttribute('playsinline', '');
    el.addEventListener('error', () => onMusicError(el));
    el.src = MUSIC_SRC;
    music.el = el;
    if (!volumeIsSettable()) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        try {
          if (!music.ctx) { music.ctx = new AC(); music.gain = music.ctx.createGain(); music.gain.connect(music.ctx.destination); }
          music.ctx.createMediaElementSource(el).connect(music.gain);
          music.viaGain = true;
        } catch (_) { music.viaGain = false; }
      }
    }
    return true;
  }

  function applyVolume(v) {
    v = clamp(v, 0, 1);
    if (music.viaGain && music.gain) music.gain.gain.value = v;
    else if (music.el) music.el.volume = v;
  }

  function musicTick(now) {
    const dt = Math.min(100, now - (music.last || now)); music.last = now;
    music.shown += (music.vol - music.shown) * (1 - Math.exp(-dt / MUSIC_CFG.slide));
    if (Math.abs(music.vol - music.shown) < 0.0005) music.shown = music.vol;
    const t = clamp((now - music.fadeT0) / music.fadeDur, 0, 1);
    music.fade = music.fadeFrom + (music.fadeTo - music.fadeFrom) * smooth(t);
    applyVolume(music.shown * music.fade);
    const fading = t < 1, sliding = music.shown !== music.vol;
    if (!fading && music.fadeTo === 0 && music.el) { music.el.pause(); }          // fade-out terminou: pausa (mantém a posição)
    if (fading || sliding) music.raf = requestAnimationFrame(musicTick);
    else { music.raf = 0; music.last = 0; }
  }
  function musicLoop() { if (!music.raf) { music.last = 0; music.raf = requestAnimationFrame(musicTick); } }
  function startFade(to, ms) {
    music.fadeFrom = music.fade; music.fadeTo = to;
    music.fadeDur = Math.max(160, ms * Math.abs(to - music.fade)); music.fadeT0 = performance.now();
    musicLoop();
  }

  function showMsg(text) {
    clearTimeout(music.msgTimer);
    volMsg.textContent = text || ''; volMsg.hidden = !text;
    if (text) music.msgTimer = setTimeout(() => showMsg(''), 5000);
  }
  function syncSoundUI() {
    btnSound.setAttribute('aria-pressed', String(music.on));
    btnSound.setAttribute('aria-label', music.on ? 'Desligar som ambiente' : 'Ligar som ambiente');
    volPanel.dataset.on = String(music.on);
    volToggle.setAttribute('aria-label', music.on ? 'Desligar música' : 'Ligar música');
  }
  function onMusicError(el) {
    if (el !== music.el) return;
    const missing = el.error && el.error.code === 4;                           // MEDIA_ERR_SRC_NOT_SUPPORTED: arquivo ausente/ilegível
    console.warn('[convite] Não foi possível carregar "' + MUSIC_SRC + '".');
    musicFail(missing ? 'Arquivo de música não encontrado.' : 'Não foi possível tocar a música.');
  }
  function musicFail(text) {
    music.on = false; music.fade = music.fadeFrom = music.fadeTo = 0;
    if (music.raf) { cancelAnimationFrame(music.raf); music.raf = 0; }
    try { music.el && music.el.pause(); } catch (_) {}
    syncSoundUI(); showMsg(text);
  }

  function musicOn() {
    if (!ensureAudio()) return;
    music.on = true; syncSoundUI(); showMsg('');
    applyVolume(music.shown * music.fade);                                    // começa no nível atual (0 no primeiro play) — sem estalo
    if (music.ctx && music.ctx.state === 'suspended') music.ctx.resume().catch(() => {});
    const p = music.el.play();
    if (p && p.catch) p.catch((err) => {
      if (err && err.name === 'AbortError') return;                           // interrompido por pause/novo play: normal
      if (music.el && music.el.error) return;                                 // erro de arquivo é tratado em onMusicError
      musicFail('Toque novamente para ligar a música.');
    });
    startFade(1, MUSIC_CFG.fadeIn);
  }
  function musicOff() {
    music.on = false; syncSoundUI();
    startFade(0, MUSIC_CFG.fadeOut);
  }

  /* painel */
  function setPanel(open, focusRange) {
    music.open = open;
    volPanel.classList.toggle('is-open', open);
    btnSound.setAttribute('aria-expanded', String(open));
    if (open && focusRange) setTimeout(() => volRange.focus({ preventScroll: true }), 60);
    if (!open) showMsg('');
  }
  function paintVolume() {
    const pct = Math.round(music.vol * 100);
    volRange.value = String(pct);
    volRange.setAttribute('aria-valuetext', pct + '%');
    volVal.textContent = pct + '%';
    volPanel.style.setProperty('--v', pct + '%');
  }

  btnSound.setAttribute('aria-haspopup', 'true');
  btnSound.setAttribute('aria-expanded', 'false');
  btnSound.addEventListener('click', (e) => {
    const byKeyboard = e.detail === 0;
    if (!music.on) { musicOn(); setPanel(true, byKeyboard); }                 // 1º clique: liga a música e abre o painel
    else setPanel(!music.open, byKeyboard);                                   // depois: abre/fecha o painel
  });
  volToggle.addEventListener('click', () => { music.on ? musicOff() : musicOn(); });
  volRange.addEventListener('input', () => {
    music.vol = clamp(Number(volRange.value) / 100, 0, 1);
    paintVolume(); musicLoop();
  });
  /* clique fora fecha o painel; cliques dentro dele não */
  document.addEventListener('pointerdown', (e) => {
    if (!music.open || volPanel.contains(e.target) || btnSound.contains(e.target)) return;
    setPanel(false);
  }, true);
  /* teclas no painel não devem virar a página do convite */
  volPanel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setPanel(false); btnSound.focus({ preventScroll: true }); }
    e.stopPropagation();
  });
  /* aba em segundo plano: pausa e retoma (celulares bloqueados, troca de aba) */
  document.addEventListener('visibilitychange', () => {
    if (!music.el) return;
    if (document.hidden) { if (music.on && !music.el.paused) { music.resume = true; music.el.pause(); } }
    else if (music.resume) { music.resume = false; music.el.play().catch(() => {}); }
  });
  paintVolume(); syncSoundUI();

  /* ---------- 10. A NOSSA HISTÓRIA ------------------------------------- */
  const story       = $('#story');
  const storyScroll = $('#story-scroll');
  let storyIO = null, storyImgsLoaded = false;

  /** Fotografias só começam a baixar depois que o envelope abre (não pesam na primeira tela). */
  function loadStoryImages() {
    if (storyImgsLoaded) return; storyImgsLoaded = true;
    $$('img[data-src]', story).forEach((im) => {
      const done = () => im.classList.add('is-ready');
      im.addEventListener('load', done, { once: true });
      im.addEventListener('error', () => { im.classList.add('is-ready'); console.warn('[convite] Imagem não encontrada:', im.dataset.src); }, { once: true });
      im.src = im.dataset.src;
      if (im.complete && im.naturalWidth) done();
    });
  }

  function watchReveals() {
    const els = $$('[data-rv]', story);
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return; }
    if (storyIO) storyIO.disconnect();
    storyIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); storyIO.unobserve(en.target); } });
    }, { root: storyScroll, threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach((el) => { if (!el.classList.contains('is-in')) storyIO.observe(el); });
  }

  function openStory() {
    if (state.storyOpen || state.p < 0.999) return;
    state.storyOpen = true;
    loadStoryImages();
    story.removeAttribute('aria-hidden');
    stage.dataset.phase = 'story';
    story.classList.add('is-open');
    storyScroll.scrollTop = 0;
    setTimeout(watchReveals, 350);                         // as revelações começam quando a folha já está chegando
    setTimeout(() => { try { storyScroll.focus({ preventScroll: true }); } catch (_) {} }, 1000);
    updateUI();
  }
  function closeStory() {
    if (!state.storyOpen) return;
    state.storyOpen = false;
    story.classList.remove('is-open');
    story.setAttribute('aria-hidden', 'true');
    stage.dataset.phase = 'open';
    updateUI();
    setTimeout(() => { if (!state.storyOpen) btnNext.focus({ preventScroll: true }); }, 900);
  }
  $('#story-back').addEventListener('click', closeStory);
  $('#story-back-2').addEventListener('click', closeStory);

  /* ---------- 09. INÍCIO ------------------------------------------------ */
  function init() {
    mountCovers();
    layout();
    setCard(state.eh * 0.07, (state.eh * 0.80) / state.ph);
    updateUI();
    renderBook();

    const skip = /[#?&]skip\b/.test(location.hash + location.search);          // atalho de desenvolvimento
    const reveal = () => {
      document.body.classList.remove('is-loading');
      if (skip) {                                                              // pula direto para o livro
        mountSkip();
      } else {
        startEnvLoop();
        setTimeout(() => envFront.classList.add('is-drawn'), 500);             // florais do envelope se desenham
      }
    };
    function mountSkip() {
      state.phase = 'book'; stage.dataset.phase = 'book'; loadStoryImages();
      envScene.style.display = 'none'; bookScene.removeAttribute('aria-hidden');
      leafFront.firstElementChild.classList.add('is-drawn', 'no-anim');
      updateUI();
    }

    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const imgs = $$('img').map((im) => (im.complete ? Promise.resolve() : new Promise((r) => { im.onload = im.onerror = r; })));
    Promise.race([Promise.all([fontsReady, ...imgs]), wait(3000)]).then(() => { layout(); reveal(); });
    fontsReady.then(() => layout());
  }

  let rz = 0;
  window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { layout(); if (state.phase === 'opening') return; }, 80); });
  window.addEventListener('orientationchange', () => setTimeout(layout, 250));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* disponível para depuração no console */
  window.__convite = { state, openBook, closeBook, openEnvelope, openStory, closeStory, layout };
})();
