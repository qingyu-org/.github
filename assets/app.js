/* 清羽 showcase — theme, reveal, and the tide line. No dependencies. */
(function () {
  'use strict';

  var root = document.documentElement;
  var THEME_KEY = 'qingyu-theme';
  var media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function storedTheme() {
    try {
      var value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function currentTheme() {
    return root.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  root.classList.add('js-reveal');

  /* ---------- theme toggle ---------- */

  var toggle = document.querySelector('[data-theme-toggle]');

  function syncToggle() {
    if (!toggle) return;
    var dark = currentTheme() === 'dark';
    toggle.setAttribute('aria-checked', dark ? 'true' : 'false');
  }

  function announceTheme() {
    document.dispatchEvent(new CustomEvent('qingyu:themechange', { detail: currentTheme() }));
  }

  syncToggle();

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {}
      syncToggle();
      announceTheme();
    });
  }

  if (media) {
    var onSystemTheme = function (event) {
      if (storedTheme()) return;
      root.dataset.theme = event.matches ? 'dark' : 'light';
      syncToggle();
      announceTheme();
    };
    if (media.addEventListener) {
      media.addEventListener('change', onSystemTheme);
    } else if (media.addListener) {
      media.addListener(onSystemTheme);
    }
  }

  /* ---------- header hairline ---------- */

  var header = document.querySelector('[data-header]');
  var scrollQueued = false;

  function updateHeader() {
    scrollQueued = false;
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  if (header) {
    window.addEventListener('scroll', function () {
      if (scrollQueued) return;
      scrollQueued = true;
      window.requestAnimationFrame(updateHeader);
    }, { passive: true });
    updateHeader();
  }

  /* ---------- section reveals ---------- */

  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (revealItems.length) {
    if ('IntersectionObserver' in window) {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

      revealItems.forEach(function (item) {
        revealObserver.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add('is-visible');
      });
    }
  }

  /* ---------- the tide ---------- */

  var canvas = document.querySelector('[data-tide]');

  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var hero = canvas.closest('.hero');
  var width = 0;
  var height = 0;
  var dpr = 1;
  var colors = { a: '#4f46e5', b: '#0e7490', c: 'rgba(31,35,40,.16)' };
  var pointer = { x: 0.5, y: 0.55, targetX: 0.5, targetY: 0.55, active: false };
  var visible = true;
  var frame = 0;
  var started = performance.now();
  var reduce = motionQuery ? motionQuery.matches : false;
  var originX = 0;
  var spanW = 1;

  function readColors() {
    var styles = getComputedStyle(root);
    colors.a = styles.getPropertyValue('--tide-1').trim() || colors.a;
    colors.b = styles.getPropertyValue('--tide-2').trim() || colors.b;
    colors.c = styles.getPropertyValue('--tide-3').trim() || colors.c;
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors();
    if (reduce) draw(performance.now(), true);
  }

  function waveY(x, phase, amplitude, frequency, baseline) {
    var nx = (x - originX) / spanW;
    var local = Math.exp(-Math.pow((nx - pointer.x) * 4.2, 2));
    var lift = (0.55 - pointer.y) * height * 0.16 * local * (pointer.active ? 1 : 0.25);
    return baseline +
      Math.sin(nx * frequency + phase) * amplitude +
      Math.sin(nx * frequency * 2.35 + phase * 0.72) * amplitude * 0.26 +
      lift;
  }

  function strokeWave(phase, amplitude, frequency, baseline, color, alpha, lineWidth) {
    var step = 6;
    ctx.beginPath();
    for (var x = originX; x <= width + step; x += step) {
      var y = waveY(x, phase, amplitude, frequency, baseline);
      if (x === originX) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function draw(now, still) {
    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    var elapsed = (now - started) / 1000;
    var intro = still || reduce ? 1 : Math.min(1, (now - started) / 900);
    intro = 1 - Math.pow(1 - intro, 3);

    pointer.x += (pointer.targetX - pointer.x) * (still ? 1 : 0.045);
    pointer.y += (pointer.targetY - pointer.y) * (still ? 1 : 0.045);

    var wide = width >= 1200;
    var compact = width <= 760;
    originX = wide ? width * 0.53 : 0;
    spanW = width - originX;
    var baseline = wide ? height * 0.46 : height * (compact ? 0.72 : 0.84);
    var amp = (wide ? height * 0.155 : height * (compact ? 0.06 : 0.05)) * intro;
    var phase = elapsed * 0.34;
    var phase2 = elapsed * 0.18 + 1.4;
    var phase3 = elapsed * 0.47 + 2.6;
    var freq = wide ? 7 : 8.5;

    // Quiet instrument baseline.
    ctx.beginPath();
    ctx.moveTo(originX, baseline + 0.5);
    ctx.lineTo(width, baseline + 0.5);
    ctx.strokeStyle = colors.c;
    ctx.globalAlpha = 0.3 * intro;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Tick marks, like measuring a shoreline.
    ctx.beginPath();
    var tickGap = wide ? 58 : 48;
    for (var tx = originX + 18; tx < width; tx += tickGap) {
      ctx.moveTo(tx + 0.5, baseline + 8);
      ctx.lineTo(tx + 0.5, baseline + 14);
    }
    ctx.strokeStyle = colors.c;
    ctx.globalAlpha = 0.28 * intro;
    ctx.stroke();
    ctx.globalAlpha = 1;

    strokeWave(phase2 + 0.6, amp * 0.52, freq * 0.62, baseline + 18, colors.c, 0.32 * intro, 1);
    strokeWave(phase3, amp * 0.44, freq * 1.45, baseline - 26, colors.c, 0.22 * intro, 1);

    var gradient = ctx.createLinearGradient(originX, 0, width, 0);
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.1, colors.b);
    gradient.addColorStop(0.55, colors.a);
    gradient.addColorStop(0.9, colors.b);
    gradient.addColorStop(1, 'transparent');

    strokeWave(phase, amp, freq, baseline, gradient, 0.9 * intro, 1.5);

    // A single point of light travelling the crest.
    var headX = originX + ((elapsed * 0.045) % 1) * spanW;
    var headY = waveY(headX, phase, amp, freq, baseline);
    var glow = ctx.createRadialGradient(headX, headY, 0, headX, headY, 26);
    glow.addColorStop(0, colors.a);
    glow.addColorStop(0.26, colors.b);
    glow.addColorStop(1, 'transparent');
    ctx.globalAlpha = 0.34 * intro;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(headX, headY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = intro;
    ctx.fillStyle = colors.a;
    ctx.beginPath();
    ctx.arc(headX, headY, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    if (!visible || document.hidden) {
      frame = 0;
      return;
    }
    draw(now, false);
    frame = window.requestAnimationFrame(loop);
  }

  function start() {
    if (frame) return;
    if (reduce) {
      draw(performance.now(), true);
      return;
    }
    frame = window.requestAnimationFrame(loop);
  }

  function stop() {
    if (!frame) return;
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function refresh() {
    readColors();
    if (reduce) draw(performance.now(), true);
  }

  document.addEventListener('qingyu:themechange', function () {
    refresh();
  });

  if (motionQuery) {
    var onMotion = function () {
      reduce = motionQuery.matches;
      if (reduce) {
        stop();
        draw(performance.now(), true);
      } else {
        started = performance.now();
        start();
      }
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotion);
    else if (motionQuery.addListener) motionQuery.addListener(onMotion);
  }

  if (hero) {
    hero.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      var rect = hero.getBoundingClientRect();
      pointer.targetX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.targetY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
      pointer.active = true;
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      pointer.targetX = 0.5;
      pointer.targetY = 0.55;
      pointer.active = false;
    });
  }

  if ('ResizeObserver' in window) {
    var resizeObserver = new ResizeObserver(function () {
      resize();
    });
    resizeObserver.observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  if ('IntersectionObserver' in window) {
    var canvasObserver = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }, { threshold: 0 });
    canvasObserver.observe(canvas);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else if (visible) start();
  });

  resize();
  start();
}());
