// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Active navigation highlighting
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || 
            (currentPage === '' && href === 'index.html') ||
            (currentPage === 'index.html' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

// Contact form submission
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        e.target.reset();
    });
}

// Carousel functionality
let currentSlide = 0;
const carouselTrack = document.getElementById('carouselTrack');

if (carouselTrack) {
    const slides = document.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;

    function moveCarousel(direction) {
        currentSlide += direction;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        if (currentSlide >= totalSlides) currentSlide = 0;
        updateCarousel();
    }

    function goToSlide(index) {
        currentSlide = index;
        updateCarousel();
    }

    function updateCarousel() {
        slides.forEach((slide, index) => {
            const diff = index - currentSlide;
            slide.style.willChange = 'transform, opacity';

            if (diff === 0) {
                slide.style.transform = 'scale(1) translateX(0) translateZ(0)';
                slide.style.opacity = '1';
                slide.style.zIndex = '10';
            } else if (diff === -1 || (currentSlide === 0 && index === totalSlides - 1)) {
                slide.style.transform = 'scale(0.85) translateX(-80%) translateZ(0)';
                slide.style.opacity = '0.7';
                slide.style.zIndex = '5';
            } else if (diff === 1 || (currentSlide === totalSlides - 1 && index === 0)) {
                slide.style.transform = 'scale(0.85) translateX(80%) translateZ(0)';
                slide.style.opacity = '0.7';
                slide.style.zIndex = '5';
            } else {
                slide.style.transform = 'scale(0.6) translateX(0) translateZ(0)';
                slide.style.opacity = '0';
                slide.style.zIndex = '1';
            }

            // Clear willChange after animation completes
            setTimeout(() => {
                slide.style.willChange = 'auto';
            }, 600);
        });
    }

    // Touch events for swipe
    let startX = 0;
    carouselTrack.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    });
    carouselTrack.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) moveCarousel(1);
            else moveCarousel(-1);
        }
    });

    // Auto-advance carousel
    setInterval(() => {
        moveCarousel(1);
    }, 5000);

    // Initialize
    updateCarousel();

    // Make moveCarousel available globally
    window.moveCarousel = moveCarousel;
}

// Timeline toggle functionality
function toggleTimeline(element) {
    const wasExpanded = element.classList.contains('expanded');

    // Close all other timeline items with smooth transition
    document.querySelectorAll('.timeline-content').forEach(content => {
        content.classList.remove('expanded');
    });

    if (!wasExpanded) {
        // Use requestAnimationFrame for smoother transitions
        requestAnimationFrame(() => {
            element.classList.add('expanded');

            // Smooth scroll to the expanded item after animation begins
            setTimeout(() => {
                const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
                const offset = 100;

                window.scrollTo({
                    top: elementTop - offset,
                    behavior: 'smooth'
                });
            }, 250);
        });
    }
}

// Make toggleTimeline available globally
window.toggleTimeline = toggleTimeline;

// Testimonials functionality
let currentTestimonial = 0;
const testimonialTrack = document.getElementById('testimonialTrack');

if (testimonialTrack) {
    const tslides = document.querySelectorAll('.testimonial-slide');
    const totalTestimonials = tslides.length;

    function moveTestimonial(direction) {
        currentTestimonial += direction;
        if (currentTestimonial < 0) currentTestimonial = totalTestimonials - 1;
        if (currentTestimonial >= totalTestimonials) currentTestimonial = 0;
        updateTestimonials();
    }

    function updateTestimonials() {
        tslides.forEach((slide, index) => {
            const diff = index - currentTestimonial;
            slide.style.willChange = 'transform, opacity';

            if (diff === 0) {
                slide.style.transform = 'scale(1) translateX(0) translateZ(0)';
                slide.style.opacity = '1';
                slide.style.zIndex = '10';
            } else if (diff === -1 || (currentTestimonial === 0 && index === totalTestimonials - 1)) {
                slide.style.transform = 'scale(0.85) translateX(-80%) translateZ(0)';
                slide.style.opacity = '0.7';
                slide.style.zIndex = '5';
            } else if (diff === 1 || (currentTestimonial === totalTestimonials - 1 && index === 0)) {
                slide.style.transform = 'scale(0.85) translateX(80%) translateZ(0)';
                slide.style.opacity = '0.7';
                slide.style.zIndex = '5';
            } else {
                slide.style.transform = 'scale(0.6) translateX(0) translateZ(0)';
                slide.style.opacity = '0';
                slide.style.zIndex = '1';
            }

            // Clear willChange after animation completes
            setTimeout(() => {
                slide.style.willChange = 'auto';
            }, 600);
        });
    }

    // Initialize
    updateTestimonials();

    // Make moveTestimonial available globally
    window.moveTestimonial = moveTestimonial;
}

// Back to Top functionality
const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
    let scrollTimeout;

    // Throttle scroll event for better performance
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }

        scrollTimeout = window.requestAnimationFrame(() => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
    }, { passive: true });

    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Navbar scroll effect
const navbar = document.getElementById('navbar');
if (navbar) {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }

        scrollTimeout = window.requestAnimationFrame(() => {
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }, { passive: true });
}

// Scroll reveal animation for sections
function initScrollReveal() {
    const sections = document.querySelectorAll('section:not(.hero)');

    const revealOnScroll = () => {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const triggerPoint = window.innerHeight * 0.85;

            if (sectionTop < triggerPoint && !section.classList.contains('revealed')) {
                section.classList.add('revealed');
            }
        });
    };

    let scrollRevealTimeout;
    window.addEventListener('scroll', () => {
        if (scrollRevealTimeout) {
            window.cancelAnimationFrame(scrollRevealTimeout);
        }

        scrollRevealTimeout = window.requestAnimationFrame(revealOnScroll);
    }, { passive: true });

    // Initial check
    revealOnScroll();
}

// Initialize active nav on page load
document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    initScrollReveal();
});