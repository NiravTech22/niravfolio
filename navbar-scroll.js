// BUTTERY SMOOTH SCROLL HANDLER - OPTIMIZED WITH RAF
(function () {
    const header = document.querySelector('header');
    if (!header) return;

    let ticking = false;
    let lastScrollY = 0;

    function updateHeader() {
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;

        // Smooth transition threshold
        if (scrolled > 50) {
            header.classList.add('header-compact');
        } else {
            header.classList.remove('header-compact');
        }

        lastScrollY = scrolled;
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick, { passive: true });
    updateHeader(); // Check on load
})();
