// Optimized Hero Floating Images
(function() {
    'use strict';

    const container = document.getElementById('floatingImages');
    if (!container) return;

    // Configuration
    const CONFIG = {
        imageCount: 8, // Reduced from 20 to 8 for better performance
        imagePaths: [
            'images/historical-photos/triple-nickle-1.jpg',
            'images/historical-photos/triple-nickle-2.jpg',
            'images/historical-photos/triple-nickle-3.png',
            'images/historical-photos/triple-nickle-5.jpg',
            'images/historical-photos/triple-nickle-7.jpg',
            'images/historical-photos/triple-nickle-10.jpg',
            'images/historical-photos/triple-nickle-13.jpg',
            'images/historical-photos/triple-nickle-17.jpg'
        ],
        minSize: 180,
        maxSize: 220,
        animationDuration: [50, 70], // Range in seconds
        minSpacing: 150 // Minimum pixels between images vertically
    };

    // Image pool for efficient rendering
    const images = [];
    let isReducedMotion = false;

    // Check for reduced motion preference
    function checkReducedMotion() {
        if (window.matchMedia) {
            isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        }
    }

    // Create images efficiently
    function createImages() {
        const fragment = document.createDocumentFragment();
        const heroHeight = container.offsetHeight || window.innerHeight;
        const usedPositions = [];

        for (let i = 0; i < CONFIG.imageCount; i++) {
            const img = document.createElement('div');
            img.className = 'floating-image';

            // Random size
            const size = Math.floor(Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize);
            const aspectRatio = 0.7 + Math.random() * 0.3; // Random aspect ratio
            const width = size;
            const height = Math.floor(size * aspectRatio);

            // Find non-overlapping vertical position
            let top;
            let attempts = 0;
            do {
                top = Math.floor(Math.random() * (heroHeight - height - 40) + 20);
                attempts++;
            } while (attempts < 20 && usedPositions.some(pos =>
                Math.abs(pos - top) < CONFIG.minSpacing
            ));

            usedPositions.push(top);

            // Set image properties
            img.style.cssText = `
                width: ${width}px;
                height: ${height}px;
                top: ${top}px;
                background-image: url('${CONFIG.imagePaths[i]}');
            `;

            // Random animation duration and delay
            const duration = CONFIG.animationDuration[0] +
                Math.random() * (CONFIG.animationDuration[1] - CONFIG.animationDuration[0]);
            const delay = -Math.random() * duration; // Negative delay for staggered start

            img.style.animationDuration = `${duration}s`;
            img.style.animationDelay = `${delay}s`;

            // Disable animation if reduced motion preferred
            if (isReducedMotion) {
                img.style.animation = 'none';
                img.style.transform = 'translateX(0)';
                img.style.opacity = '0.3';
            }

            fragment.appendChild(img);
            images.push({
                element: img,
                width,
                height,
                top
            });
        }

        container.appendChild(fragment);
    }

    // Lazy load images with Intersection Observer
    function setupLazyLoading() {
        if (!('IntersectionObserver' in window)) {
            return; // Images will load normally
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const bgImage = img.style.backgroundImage;
                    if (bgImage) {
                        // Image is already set, just make it visible
                        img.style.opacity = '';
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        images.forEach(img => observer.observe(img.element));
    }

    // Efficient resize handler with debouncing
    let resizeTimer;
    function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            const heroHeight = container.offsetHeight || window.innerHeight;

            // Recalculate positions without recreating elements
            images.forEach((img, index) => {
                const top = Math.floor((index / CONFIG.imageCount) * (heroHeight - img.height - 40) + 20);
                img.element.style.top = `${top}px`;
                img.top = top;
            });
        }, 250);
    }

    // Initialize
    function init() {
        checkReducedMotion();
        createImages();
        setupLazyLoading();

        // Add resize listener with passive flag for better scroll performance
        window.addEventListener('resize', handleResize, { passive: true });

        // Listen for reduced motion changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', () => {
                checkReducedMotion();
                images.forEach(img => {
                    if (isReducedMotion) {
                        img.element.style.animation = 'none';
                        img.element.style.transform = 'translateX(0)';
                        img.element.style.opacity = '0.3';
                    } else {
                        img.element.style.animation = '';
                        img.element.style.opacity = '';
                    }
                });
            });
        }
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Pause animations when page is hidden to save resources
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            images.forEach(img => img.element.style.animationPlayState = 'paused');
        } else {
            images.forEach(img => img.element.style.animationPlayState = 'running');
        }
    });

})();
