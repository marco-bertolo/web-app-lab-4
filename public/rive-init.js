(() => {
  const canvas = document.getElementById('hero-canvas');
  const loadingEl = document.getElementById('hero-loading');
  const statusEl = document.getElementById('hero-status');
  if (!canvas || !window.rive) {
    console.warn('[rive] runtime or canvas missing');
    if (loadingEl) loadingEl.textContent = '⚠ rive runtime não carregou';
    return;
  }

  // Known structure of mindjoin_hero.riv (from binary inspection + console log):
  //   state machine: "heros-combi" (0 inputs → pure ambient/idle driver)
  //   timelines:     js_scene-reveal   → one-shot intro
  //                  js_cursor_x       → JS-driven by mouse X (scrub)
  //                  js_scroll_0       → one-shot, fire when scroll returns to 0%
  //                  js_scroll_100     → one-shot, fire when scroll reaches 100%
  const SM             = 'heros-combi';
  const ANIM_REVEAL    = 'js_scene-reveal';
  const ANIM_CURSOR    = 'js_cursor_x';
  const ANIM_SCROLL_0  = 'js_scroll_0';
  const ANIM_SCROLL_100 = 'js_scroll_100';

  // Scrub value is time in seconds. Real duration is unknown — 2s is a reasonable
  // default for hero timelines. Tune if the parallax range feels clipped.
  const SCRUB_DURATION = 2;

  const r = new rive.Rive({
    src: '/mindjoin_hero.riv',
    canvas,
    autoplay: true,
    stateMachines: SM,
    layout: new rive.Layout({
      fit: rive.Fit.Cover,
      alignment: rive.Alignment.Center
    }),
    onLoad: () => {
      r.resizeDrawingSurfaceToCanvas();
      requestAnimationFrame(() => r.resizeDrawingSurfaceToCanvas());

      const anims = r.animationNames || [];
      const has = (n) => anims.includes(n);
      console.log('[rive] ready. state machine:', SM, '| animations:', anims);

      if (loadingEl) loadingEl.style.display = 'none';
      if (statusEl) statusEl.textContent = `✓ heros-combi + ${anims.length} timelines`;

      // Play → pause registers js_cursor_x so we can scrub it. The state machine
      // keeps the render loop alive; scrubbing layers cursor parallax on top.
      if (has(ANIM_CURSOR)) {
        r.play(ANIM_CURSOR);
        requestAnimationFrame(() => {
          try {
            r.pause(ANIM_CURSOR);
            r.scrub(ANIM_CURSOR, 0.5 * SCRUB_DURATION);
          } catch (e) { console.warn('[rive] cursor setup failed', e); }
        });
      }

      // Scene reveal plays once (layered over the state machine)
      if (has(ANIM_REVEAL)) {
        setTimeout(() => {
          try { r.play(ANIM_REVEAL); } catch (e) {}
        }, 120);
      }

      // --- MOUSE → scrub js_cursor_x by horizontal viewport fraction ---
      let lastMove = Date.now();
      const scrubCursor = (clientX) => {
        if (!has(ANIM_CURSOR)) return;
        lastMove = Date.now();
        const frac = Math.max(0, Math.min(1, clientX / window.innerWidth));
        try { r.scrub(ANIM_CURSOR, frac * SCRUB_DURATION); } catch (e) {}
      };
      document.addEventListener('mousemove', (e) => scrubCursor(e.clientX));
      document.addEventListener('touchmove', (e) => {
        if (e.touches[0]) scrubCursor(e.touches[0].clientX);
      }, { passive: true });

      // --- SCROLL → fire threshold one-shots when crossing 0% and 100% ---
      let state = 'mid';
      const onScroll = () => {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const pct = window.scrollY / max;
        if (pct <= 0.02 && state !== 'top') {
          state = 'top';
          if (has(ANIM_SCROLL_0)) { try { r.play(ANIM_SCROLL_0); } catch (e) {} }
        } else if (pct >= 0.98 && state !== 'bot') {
          state = 'bot';
          if (has(ANIM_SCROLL_100)) { try { r.play(ANIM_SCROLL_100); } catch (e) {} }
        } else if (pct > 0.02 && pct < 0.98) {
          state = 'mid';
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });

      // --- RESIZE ---
      const onResize = () => r.resizeDrawingSurfaceToCanvas();
      window.addEventListener('resize', onResize);
      if (window.ResizeObserver) {
        const ro = new ResizeObserver(onResize);
        ro.observe(canvas);
      }

      // --- IDLE HEARTBEAT: keep cursor timeline moving when user is AFK ---
      const idleTick = () => {
        if (has(ANIM_CURSOR) && Date.now() - lastMove > 2500) {
          const t = performance.now() / 4000;
          const sweep = Math.sin(t) * 0.5 + 0.5;
          try { r.scrub(ANIM_CURSOR, sweep * SCRUB_DURATION); } catch (e) {}
        }
        requestAnimationFrame(idleTick);
      };
      requestAnimationFrame(idleTick);
    },
    onLoadError: (err) => {
      console.error('[rive] load error:', err);
      if (loadingEl) loadingEl.innerHTML = '⚠ falha a carregar mindjoin_hero.riv';
    }
  });

  window.__rive = r;
})();
