(function () {
  var navbar  = document.getElementById('navbar');
  var toggle  = document.getElementById('navToggle');
  var links   = document.getElementById('navLinks');
  var backdrop = document.getElementById('navBackdrop');

  // Subpages: navbar is always solid (no transparent-on-top treatment)
  if (navbar && navbar.dataset.solid === 'true') {
    navbar.classList.add('solid');
  }

  // Scroll: add .scrolled class (for index.html transparent→solid transition)
  if (navbar) {
    window.addEventListener('scroll', function () {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  // Back to top
  var backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', function () {
      backToTop.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    backToTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (!toggle || !links) return;

  function openNav() {
    links.classList.add('open');
    toggle.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.style.overflow = '';
    links.querySelectorAll('.dropdown.open').forEach(function (d) {
      d.classList.remove('open');
    });
  }

  toggle.addEventListener('click', function () {
    links.classList.contains('open') ? closeNav() : openNav();
  });

  if (backdrop) backdrop.addEventListener('click', closeNav);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  // Close on any non-dropdown link tap
  links.querySelectorAll('a:not(.dropdown > a)').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });

  // Dropdown toggle (mobile only)
  links.querySelectorAll('.dropdown > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        var dropdown = this.closest('.dropdown');
        var wasOpen  = dropdown.classList.contains('open');
        links.querySelectorAll('.dropdown.open').forEach(function (d) {
          d.classList.remove('open');
        });
        if (!wasOpen) dropdown.classList.add('open');
      }
    });
  });

  // Scroll-reveal observer for .fade-in elements.
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0 });

  document.querySelectorAll('.fade-in').forEach(function (el) {
    observer.observe(el);
  });
}());
