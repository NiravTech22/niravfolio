// MINIMAL SCROLL HANDLER - WORKS INDEPENDENTLY
(function () {
    const header = document.querySelector('header');
    if (!header) return;

    function updateHeader() {
        const scrolled = window.pageYOffset || document.documentElement.scrollTop;
        if (scrolled > 50) {
            header.classList.add('header-compact');
        } else {
            header.classList.remove('header-compact');
        }
    }

    window.addEventListener('scroll', updateHeader);
    updateHeader(); // Check on load
})();
