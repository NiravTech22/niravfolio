/* Scroll-reveal and reading progress. Both no-op under prefers-reduced-motion
   and both degrade to plain static content if JS never runs, since the
   reveal attribute is only applied from here. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setupReveal() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;

    var groups = [
      { selector: '.project-card', stagger: 70 },
      { selector: '.blog-card', stagger: 70 },
      { selector: '.timeline-item', stagger: 90 },
      { selector: '.article-content > h2', stagger: 0 },
      { selector: '.article-content > .table-wrap', stagger: 0 },
      { selector: '.article-content > .flowchart', stagger: 0 },
      { selector: '.article-content > .code-block', stagger: 0 }
    ];

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    groups.forEach(function (group) {
      var nodes = document.querySelectorAll(group.selector);
      Array.prototype.forEach.call(nodes, function (node, i) {
        node.setAttribute('data-reveal', '');
        if (group.stagger) {
          node.style.setProperty('--reveal-delay', (i % 6) * group.stagger + 'ms');
        }
        observer.observe(node);
      });
    });
  }

  function setupReadingProgress() {
    if (reducedMotion) return;
    var article = document.querySelector('.article-container');
    if (!article) return;

    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      var total = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = total > 0 ? Math.min(window.scrollY / total, 1) : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });

    update();
  }

  function init() {
    setupReveal();
    setupReadingProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Shared toast, used by the command palette and the weather egg. Replaces a
   blocking alert() that stopped the page dead to say "copied". */
window.siteToast = function (text) {
  var el = document.createElement('div');
  el.className = 'site-toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.appendChild(el);
  window.setTimeout(function () { el.classList.add('is-fading'); }, 2200);
  window.setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 3100);
};
