// Home Page JavaScript
class HomePage {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;
        this.sliderInterval = null;
        this.init();
    }

    init() {
        this.setupMobileMenu();
        this.setupSlider();
        this.setupSmoothScroll();
        this.setupAnimations();
        this.setupLogoRefresh();
        this.setupContactForm();
    }

    // Logo click to refresh page
    setupLogoRefresh() {
        const logo = document.getElementById('logo');
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = 'home.html';
        });
    }

    // Contact form handling
    setupContactForm() {
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission(contactForm);
            });
        }
    }

    handleFormSubmission(form) {
        const formData = new FormData(form);
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        // Simulate form submission
        setTimeout(() => {
            // Show success message
            this.showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
            
            // Reset form
            form.reset();
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }, 2000);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#1CAFAA' : '#ff6b6b'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }

    // Mobile Menu Toggle
    setupMobileMenu() {
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');

        mobileMenuBtn.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close mobile menu when clicking on links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Slider Functionality
    setupSlider() {
        const track = document.querySelector('.slider-track');
        const dots = document.querySelectorAll('.dot');
        const prevArrow = document.querySelector('.prev-arrow');
        const nextArrow = document.querySelector('.next-arrow');

        // Auto-slide every 5 seconds
        this.startAutoSlide();

        // Manual navigation with arrows
        prevArrow.addEventListener('click', () => {
            this.prevSlide();
            this.resetAutoSlide();
        });

        nextArrow.addEventListener('click', () => {
            this.nextSlide();
            this.resetAutoSlide();
        });

        // Dot navigation
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                this.goToSlide(index);
                this.resetAutoSlide();
            });
        });

        // Pause auto-slide on hover
        const sliderWrapper = document.querySelector('.slider-wrapper');
        sliderWrapper.addEventListener('mouseenter', () => {
            this.pauseAutoSlide();
        });

        sliderWrapper.addEventListener('mouseleave', () => {
            this.resumeAutoSlide();
        });

        // Touch/swipe support for mobile
        this.setupTouchEvents();
    }

    startAutoSlide() {
        this.sliderInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }

    pauseAutoSlide() {
        if (this.sliderInterval) {
            clearInterval(this.sliderInterval);
            this.sliderInterval = null;
        }
    }

    resumeAutoSlide() {
        if (!this.sliderInterval) {
            this.startAutoSlide();
        }
    }

    resetAutoSlide() {
        this.pauseAutoSlide();
        this.resumeAutoSlide();
    }

    nextSlide() {
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateSlider();
    }

    prevSlide() {
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateSlider();
    }

    goToSlide(slideIndex) {
        this.currentSlide = slideIndex;
        this.updateSlider();
    }

    updateSlider() {
        const track = document.querySelector('.slider-track');
        const dots = document.querySelectorAll('.dot');
        const slides = document.querySelectorAll('.slide');

        // Update track position
        track.style.transform = `translateX(-${this.currentSlide * 100}%)`;

        // Update active dot
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });

        // Update active slide
        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === this.currentSlide);
        });
    }

    setupTouchEvents() {
        const sliderWrapper = document.querySelector('.slider-wrapper');
        let startX = 0;
        let currentX = 0;

        sliderWrapper.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        sliderWrapper.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
        });

        sliderWrapper.addEventListener('touchend', () => {
            const diff = startX - currentX;
            const swipeThreshold = 50;

            if (Math.abs(diff) > swipeThreshold) {
                if (diff > 0) {
                    this.nextSlide();
                } else {
                    this.prevSlide();
                }
                this.resetAutoSlide();
            }
        });
    }

    // Smooth Scroll for Anchor Links
    setupSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // Animations on Scroll
    setupAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .slide, .pricing-card, .contact-item').forEach(el => {
            observer.observe(el);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});

// Add CSS for animations and notifications
const style = document.createElement('style');
style.textContent = `
    .feature-card, .slide, .pricing-card, .contact-item {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }

    .feature-card.animate-in, .slide.animate-in, 
    .pricing-card.animate-in, .contact-item.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .feature-card:nth-child(odd), .pricing-card:nth-child(odd) {
        transition-delay: 0.1s;
    }

    .feature-card:nth-child(even), .pricing-card:nth-child(even) {
        transition-delay: 0.2s;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .logo {
        transition: transform 0.3s ease;
    }

    .logo:hover {
        transform: scale(1.05);
    }
`;
document.head.appendChild(style);