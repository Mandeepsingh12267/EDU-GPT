// Loading State Manager
class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
    }

    // Show button loading
    showButtonLoading(button, text = 'Loading...') {
        const originalText = button.innerHTML;
        button.classList.add('btn-loading');
        button.setAttribute('data-original-text', originalText);
        button.innerHTML = text;
        button.disabled = true;
    }

    // Hide button loading
    hideButtonLoading(button) {
        button.classList.remove('btn-loading');
        const originalText = button.getAttribute('data-original-text');
        button.innerHTML = originalText;
        button.disabled = false;
    }

    // Show page loading overlay
    showPageLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.id = 'pageLoadingOverlay';
        overlay.innerHTML = `
            <div class="loading-spinner loading-spinner-large"></div>
            <div class="loading-text">${message}</div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
    }

    // Hide page loading overlay
    hidePageLoading() {
        const overlay = document.getElementById('pageLoadingOverlay');
        if (overlay) {
            overlay.remove();
            document.body.style.overflow = '';
        }
    }

    // Show skeleton loading for cards
    showSkeletonLoading(container, count = 3) {
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'dashboard-card skeleton-loading skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-loading skeleton-text short"></div>
                <div class="skeleton-loading skeleton-text medium"></div>
                <div class="skeleton-loading skeleton-text" style="height: 12px; width: 40%;"></div>
            `;
            container.appendChild(skeleton);
        }
    }

    // Show typing indicator in chat
    showChatTyping(container) {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'chat-loading';
        typingIndicator.id = 'chatTypingIndicator';
        typingIndicator.innerHTML = `
            <div class="ai-avatar small">🤖</div>
            <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
            <span style="color: #6b7280; font-size: 14px;">AI is typing...</span>
        `;
        container.appendChild(typingIndicator);
        container.scrollTop = container.scrollHeight;
    }

    // Hide typing indicator
    hideChatTyping(container) {
        const typingIndicator = document.getElementById('chatTypingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
}

// Initialize loading manager
const loadingManager = new LoadingManager();

// Common utility functions
function refreshPage() {
    window.location.href = window.location.href.split('?')[0];
}

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-container');
    pages.forEach(page => page.classList.remove('active'));
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
}

function selectUserType(type) {
    userType = type;
    const studentBtn = document.getElementById('studentTypeBtn');
    const educatorBtn = document.getElementById('educatorTypeBtn');
    
    if (type === 'student') {
        studentBtn.classList.add('active');
        educatorBtn.classList.remove('active');
    } else {
        educatorBtn.classList.add('active');
        studentBtn.classList.remove('active');
    }
}

function logout() {
    localStorage.removeItem('edugpt_token');
    localStorage.removeItem('edugpt_user');
    window.location.href = 'index.html';
} 