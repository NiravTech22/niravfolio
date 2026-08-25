/* Rain easter egg, day and night.
 *
 * Type "rainy night", "rainy day", or just "rain" anywhere on the site.
 * "rain" on its own follows whichever theme you are already in. Escape
 * clears it, and so does typing the same phrase again.
 *
 * State lives in sessionStorage, so the weather follows you from the home
 * page into an article and back instead of resetting on every navigation.
 *
 * Cheap by construction: one canvas, a few hundred drops on a fixed
 * timestep, paused whenever the tab is hidden. Under prefers-reduced-motion
 * the palette still shifts but nothing moves, because a full-screen particle
 * field is precisely what that setting exists to suppress.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'weather-mode';
  var SEQUENCES = { rainynight: 'night', rainyday: 'day', rain: 'auto' };
  var LONGEST = 10;

  var PREFIX_GRACE_MS = 700;
  var typed = '';
  var pendingTimer = null;
  var mode = null;             // null | 'day' | 'night'
  var canvas = null, ctx = null, drops = [], rafId = null, lastTime = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var PALETTE = {
    night: { stroke: '198, 214, 235', alphaScale: 1.0, speed: 1.0, count: 5200 },
    day:   { stroke: '235, 241, 248', alphaScale: 0.72, speed: 0.88, count: 6400 }
  };

  function isPrefixOfLonger(key, keys) {
    for (var i = 0; i < keys.length; i++) {
      if (keys[i] !== key && keys[i].indexOf(key) === 0) return true;
    }
    return false;
  }

  function resolveAuto() {
    return document.body.classList.contains('light-mode') ? 'day' : 'night';
  }

  function viewport() {
    // innerWidth can read 0 in a backgrounded or zero-sized view; without a
    // fallback the canvas gets allocated at 0x0 and silently draws nothing.
    return {
      w: window.innerWidth || document.documentElement.clientWidth || 1024,
      h: window.innerHeight || document.documentElement.clientHeight || 768
    };
  }

  function makeDrops(w, h) {
    var cfg = PALETTE[mode];
    var count = Math.min(360, Math.round((w * h) / cfg.count));
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 8 + Math.random() * 18,
        speed: (420 + Math.random() * 560) * cfg.speed,
        drift: -30 - Math.random() * 45,
        alpha: (0.16 + Math.random() * 0.40) * cfg.alphaScale
      });
    }
    return out;
  }

  function resize() {
    if (!canvas) return;
    var v = viewport();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(v.w * dpr);
    canvas.height = Math.floor(v.h * dpr);
    canvas.style.width = v.w + 'px';
    canvas.style.height = v.h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drops = makeDrops(v.w, v.h);
  }

  function frame(now) {
    if (!mode) return;
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    var v = viewport();
    var stroke = PALETTE[mode].stroke;

    ctx.clearRect(0, 0, v.w, v.h);
    ctx.lineCap = 'round';
    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.speed * dt;
      d.x += d.drift * dt;
      if (d.y - d.len > v.h) { d.y = -d.len; d.x = Math.random() * v.w; }
      if (d.x < -20) d.x = v.w + 20;
      ctx.strokeStyle = 'rgba(' + stroke + ', ' + d.alpha + ')';
      ctx.lineWidth = d.len > 20 ? 1.4 : 1.0;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.drift * 0.03, d.y - d.len);
      ctx.stroke();
    }
    rafId = window.requestAnimationFrame(frame);
  }

  function start(which, announce) {
    var next = which === 'auto' ? resolveAuto() : which;
    if (mode === next) { stop(); return; }
    if (mode) stop(true);

    mode = next;
    document.documentElement.classList.add('weather', 'weather-' + mode);
    try { window.sessionStorage.setItem(STORAGE_KEY, mode); } catch (e) {}

    canvas = document.createElement('canvas');
    canvas.className = 'weather-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    if (announce) {
      toast(mode === 'night'
        ? 'rainy night · esc to clear the sky'
        : 'rainy day · esc to clear the sky');
    }
    if (!reduced) {
      lastTime = window.performance.now();
      rafId = window.requestAnimationFrame(frame);
    }
  }

  function stop(switching) {
    if (!mode) return;
    document.documentElement.classList.remove('weather', 'weather-' + mode);
    mode = null;
    if (!switching) {
      try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
    }
    window.removeEventListener('resize', resize);
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
  }

  function toast(text) {
    if (window.siteToast) { window.siteToast(text); return; }
    var el = document.createElement('div');
    el.className = 'site-toast';
    el.textContent = text;
    document.body.appendChild(el);
    window.setTimeout(function () { el.classList.add('is-fading'); }, 2600);
    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 3600);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      window.clearTimeout(pendingTimer);
      if (mode) stop();
      return;
    }
    var tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.isComposing) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return;

    var ch = e.key.toLowerCase();
    if (ch === ' ') return;                  // "rainy night" == "rainynight"
    typed = (typed + ch).slice(-LONGEST);

    // Longest first, so "rainynight" is not read as "rainy" plus noise.
    var keys = Object.keys(SEQUENCES).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (typed.slice(-key.length) !== key) continue;

      // "rain" is a prefix of both longer phrases, so firing it the moment it
      // completes eats the buffer and "rainy day" never gets the chance to
      // match. Prefixes wait to see whether more is coming; anything that
      // cannot be extended fires immediately.
      if (isPrefixOfLonger(key, keys)) {
        window.clearTimeout(pendingTimer);
        pendingTimer = window.setTimeout(function (k) {
          return function () { typed = ''; start(SEQUENCES[k], true); };
        }(key), PREFIX_GRACE_MS);
        return;
      }

      window.clearTimeout(pendingTimer);
      typed = '';
      start(SEQUENCES[key], true);
      return;
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (!mode || reduced) return;
    if (document.hidden) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      lastTime = window.performance.now();
      rafId = window.requestAnimationFrame(frame);
    }
  });

  // Follow the theme toggle while it is raining: switching to light mode
  // during a rainy night should become a rainy day, not stay dark.
  var observer = new MutationObserver(function () {
    if (!mode) return;
    var want = resolveAuto();
    if (want !== mode) start(want, false);
  });

  function restore() {
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    var saved = null;
    try { saved = window.sessionStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (saved === 'day' || saved === 'night') start(saved, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restore);
  } else {
    restore();
  }
})();
