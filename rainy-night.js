/* "rainy night" easter egg.
 *
 * Type the words anywhere on the page (spaces optional) and the site turns
 * into a wet window at night. Escape, or typing it again, puts it back.
 *
 * Deliberately cheap: one canvas, a few hundred drops integrated with a
 * fixed timestep, paused whenever the tab is hidden. Under
 * prefers-reduced-motion it still dims to night but nothing moves, because
 * a full-screen particle field is exactly the kind of thing that setting
 * exists to suppress.
 */
(function () {
  'use strict';

  var SEQUENCE = 'rainynight';
  var typed = '';
  var active = false;
  var canvas = null;
  var ctx = null;
  var drops = [];
  var rafId = null;
  var lastTime = 0;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function makeDrops(w, h) {
    var count = Math.min(340, Math.round((w * h) / 5200));
    var out = [];
    for (var i = 0; i < count; i++) {
      out.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 8 + Math.random() * 18,
        speed: 420 + Math.random() * 560,   // px per second
        drift: -30 - Math.random() * 45,
        alpha: 0.18 + Math.random() * 0.42
      });
    }
    return out;
  }

  function viewport() {
    // innerWidth can read 0 in a backgrounded or zero-sized view; falling back
    // keeps the canvas from being allocated at 0x0 and silently drawing
    // nothing once the view becomes visible again.
    var w = window.innerWidth || document.documentElement.clientWidth || 1024;
    var h = window.innerHeight || document.documentElement.clientHeight || 768;
    return { w: w, h: h };
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
    if (!active) return;
    var dt = Math.min((now - lastTime) / 1000, 0.05);   // clamp after a stall
    lastTime = now;

    var v = viewport();
    var w = v.w;
    var h = v.h;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      d.y += d.speed * dt;
      d.x += d.drift * dt;
      if (d.y - d.len > h) {
        d.y = -d.len;
        d.x = Math.random() * w;
      }
      if (d.x < -20) d.x = w + 20;

      ctx.strokeStyle = 'rgba(198, 214, 235, ' + d.alpha + ')';
      ctx.lineWidth = d.len > 20 ? 1.4 : 1.0;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.drift * 0.03, d.y - d.len);
      ctx.stroke();
    }
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (active) return;
    active = true;
    document.documentElement.classList.add('rainy-night');

    canvas = document.createElement('canvas');
    canvas.className = 'rainy-night-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', resize);

    showHint();
    if (!reduced) {
      lastTime = window.performance.now();
      rafId = window.requestAnimationFrame(frame);
    }
  }

  function stop() {
    if (!active) return;
    active = false;
    document.documentElement.classList.remove('rainy-night');
    window.removeEventListener('resize', resize);
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
  }

  function showHint() {
    var hint = document.createElement('div');
    hint.className = 'rainy-night-hint';
    hint.textContent = 'rainy night · esc to clear the sky';
    document.body.appendChild(hint);
    window.setTimeout(function () { hint.classList.add('is-fading'); }, 2600);
    window.setTimeout(function () {
      if (hint.parentNode) hint.parentNode.removeChild(hint);
    }, 3600);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && active) { stop(); return; }

    // Ignore typing aimed at a real input, and any modified keystroke.
    var tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return;

    var ch = e.key.toLowerCase();
    if (ch === ' ') return;                 // "rainy night" and "rainynight" both work
    typed = (typed + ch).slice(-SEQUENCE.length);
    if (typed === SEQUENCE) {
      typed = '';
      active ? stop() : start();
    }
  });

  document.addEventListener('visibilitychange', function () {
    if (!active || reduced) return;
    if (document.hidden) {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = null;
    } else {
      lastTime = window.performance.now();
      rafId = window.requestAnimationFrame(frame);
    }
  });
})();
