// Floating Images - Collision Detection on Spawn/Recycle Only
(function() {
    'use strict';

    const floatingImages = document.querySelectorAll('.floating-image');
    if (floatingImages.length === 0) return;

    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Store image data
    const imageData = Array.from(floatingImages).map((img, index) => {
        const computedStyle = window.getComputedStyle(img);
        return {
            element: img,
            index: index,
            originalTop: parseFloat(computedStyle.top),
            width: img.offsetWidth,
            height: img.offsetHeight
        };
    });

    // Check if two rectangles overlap
    function isOverlapping(rect1, rect2, buffer = 30) {
        return !(
            rect1.right + buffer < rect2.left ||
            rect1.left - buffer > rect2.right ||
            rect1.bottom + buffer < rect2.top ||
            rect1.top - buffer > rect2.bottom
        );
    }

    // Get bounding box for an image at a specific vertical position
    function getBoundingBox(data, top) {
        const rect = data.element.getBoundingClientRect();
        return {
            left: rect.left,
            right: rect.right,
            top: top,
            bottom: top + data.height,
            width: data.width,
            height: data.height
        };
    }

    // Find a non-overlapping vertical position for an image
    function findSafePosition(data, currentTop) {
        const heroHeight = heroSection.offsetHeight;
        const maxAttempts = 50;
        let attempts = 0;
        let bestTop = currentTop;
        let minCollisions = Infinity;

        // Try different positions
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Random position within allowed range
            const tryTop = Math.random() * (heroHeight - data.height - 40) + 20;
            const tryBox = getBoundingBox(data, tryTop);

            let collisionCount = 0;

            // Check against all other images
            for (let i = 0; i < imageData.length; i++) {
                if (imageData[i].index === data.index) continue;

                const otherRect = imageData[i].element.getBoundingClientRect();
                const otherBox = {
                    left: otherRect.left,
                    right: otherRect.right,
                    top: otherRect.top,
                    bottom: otherRect.bottom
                };

                if (isOverlapping(tryBox, otherBox)) {
                    collisionCount++;
                }
            }

            // Track best position found
            if (collisionCount < minCollisions) {
                minCollisions = collisionCount;
                bestTop = tryTop;

                // If we found a collision-free spot, use it
                if (collisionCount === 0) {
                    break;
                }
            }

            attempts++;
        }

        return bestTop;
    }

    // Adjust positions on initial load
    function adjustInitialPositions() {
        imageData.forEach(data => {
            const currentTop = parseFloat(window.getComputedStyle(data.element).top);
            const safeTop = findSafePosition(data, currentTop);

            // Only adjust if we found a better position
            if (safeTop !== currentTop) {
                data.element.style.top = `${safeTop}px`;
                data.originalTop = safeTop;
            }
        });
    }

    // Monitor when images loop back (check horizontal position)
    function checkForRecycle() {
        imageData.forEach(data => {
            const rect = data.element.getBoundingClientRect();

            // When image goes off the left side and is about to recycle from right
            // (detecting the moment it reappears on the right)
            if (rect.right < -100) {
                // Mark that this image is recycling
                data.element.setAttribute('data-recycling', 'true');
            }

            // When image appears back on the right side after recycling
            if (rect.left > window.innerWidth - 200 &&
                data.element.getAttribute('data-recycling') === 'true') {

                // Find new safe position
                const currentTop = parseFloat(window.getComputedStyle(data.element).top);
                const safeTop = findSafePosition(data, currentTop);

                if (safeTop !== currentTop) {
                    // Smoothly transition to new position using cubic-bezier
                    data.element.style.transition = 'top 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
                    data.element.style.top = `${safeTop}px`;

                    // Remove transition after it completes
                    setTimeout(() => {
                        data.element.style.transition = '';
                    }, 1200);
                }

                // Clear recycling flag
                data.element.removeAttribute('data-recycling');
            }
        });
    }

    // Initial position adjustment after short delay
    setTimeout(() => {
        adjustInitialPositions();
        console.log('✓ Floating Images initialized - collision-free positions set');
    }, 1000);

    // Check for recycling every 500ms
    setInterval(checkForRecycle, 500);

    // Re-adjust on window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            adjustInitialPositions();
        }, 300);
    });

})();
