// js/page.js - Page Navigation and Transitions ONLY
class PageManager {
    constructor() {
        this.currentPage = 'ai-tutor';
        this.pages = document.querySelectorAll('.page');
        this.navButtons = document.querySelectorAll('.nav-btn');
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupLogout();
        this.setupThemeToggle();
        this.initializeCurrentPage();
    }

    setupNavigation() {
        this.navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetPage = e.target.getAttribute('data-target');
                if (targetPage) {
                    this.navigateTo(targetPage);
                }
            });
        });

        // Set initial active state for nav buttons
        this.updateNavButtons();
    }

    navigateTo(pageId) {
        if (this.currentPage === pageId) return;

        const currentPageElement = document.getElementById(this.currentPage);
        const targetPageElement = document.getElementById(pageId);

        // Determine scroll direction
        const currentIndex = Array.from(this.pages).indexOf(currentPageElement);
        const targetIndex = Array.from(this.pages).indexOf(targetPageElement);
        const direction = targetIndex > currentIndex ? 'down' : 'up';

        // Add transition class based on direction
        currentPageElement.style.transform = direction === 'down' ? 'translateY(-100vh)' : 'translateY(100vh)';
        targetPageElement.style.transform = 'translateY(0)';

        // Update active classes
        currentPageElement.classList.remove('active');
        targetPageElement.classList.add('active');

        this.currentPage = pageId;
        this.updateNavButtons();

        // Initialize the target page's functionality
        this.initializePageFunctionality(pageId);

        // Smooth scroll to top of target page
        setTimeout(() => {
            targetPageElement.scrollTop = 0;
        }, 600);
    }

    updateNavButtons() {
        this.navButtons.forEach(button => {
            const targetPage = button.getAttribute('data-target');
            if (targetPage === this.currentPage) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    initializeCurrentPage() {
        this.initializePageFunctionality(this.currentPage);
    }

    initializePageFunctionality(pageId) {
        switch(pageId) {
            case 'ai-tutor':
                this.initializeAITutor();
                break;
            case 'student-dashboard':
                this.initializeStudentDashboard();
                break;
        }
    }

    initializeAITutor() {
        // Initialize AI Tutor functionality if not already initialized
        if (typeof window.aiTutor === 'undefined') {
            // Load and initialize AI Tutor
            console.log('Initializing AI Tutor page');
            // The actual AI Tutor initialization will be handled by its own module
        }
    }

    initializeStudentDashboard() {
        // Initialize Student Dashboard functionality if not already initialized
        if (typeof window.dashboard === 'undefined') {
            // Load and initialize Dashboard
            console.log('Initializing Student Dashboard page');
            // The actual Dashboard initialization will be handled by its own module
        }
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                // Clear authentication data
                localStorage.removeItem('edugpt_token');
                localStorage.removeItem('edugpt_user');
                
                // Redirect to login page
                window.location.href = 'index.html';
            });
        }
    }

    setupThemeToggle() {
        const toggle = document.querySelector('.toggle-switch input');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                const isDark = e.target.checked;
                document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
                localStorage.setItem('edugpt_theme', isDark ? 'dark' : 'light');
            });
            
            // Load saved theme
            const savedTheme = localStorage.getItem('edugpt_theme') || 'dark';
            toggle.checked = savedTheme === 'dark';
            document.body.setAttribute('data-theme', savedTheme);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.pageManager = new PageManager();
});