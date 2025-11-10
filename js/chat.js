// js/chat.js - AI Tutor functionality ONLY
class AITutor {
    constructor() {
        this.userProfile = null;
        this.chatHistory = [];
        this.isTyping = false;
        this.init();
    }

    async init() {
        await this.loadUserProfile();
        this.setupChatInterface();
        this.displayPersonalizedWelcome();
        console.log('AI Tutor initialized');
    }

    async loadUserProfile() {
        try {
            const user = JSON.parse(localStorage.getItem('edugpt_user'));
            if (user) {
                this.userProfile = user;
                console.log('User profile loaded for AI Tutor:', this.userProfile);
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    setupChatInterface() {
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendMessage');
        
        if (messageInput && sendButton) {
            sendButton.addEventListener('click', () => this.sendMessage());
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }

        // Setup quick action buttons
        this.setupQuickActions();
        
        // Setup sidebar interactions
        this.setupSidebarInteractions();
    }

    setupQuickActions() {
        const quickButtons = document.querySelectorAll('.quick-btn');
        quickButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.currentTarget.textContent.trim();
                this.handleQuickAction(action);
            });
        });
    }

    handleQuickAction(action) {
        const messageInput = document.getElementById('messageInput');
        let prompt = '';

        switch(action) {
            case 'Summarize':
                prompt = "Can you summarize a key topic from my interests in simple terms?";
                break;
            case 'Explain':
                prompt = "Please explain an important concept from my courses in detail:";
                break;
            case 'Quiz Me':
                prompt = "Give me a quiz on one of my subjects to test my understanding!";
                break;
        }

        if (prompt && messageInput) {
            messageInput.value = prompt;
            messageInput.focus();
        }
    }

    setupSidebarInteractions() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                
                // Add active class to clicked item
                item.classList.add('active');
                
                const action = item.querySelector('span').textContent;
                this.handleSidebarAction(action);
            });
        });

        // Clear conversations button
        const clearBtn = document.querySelector('.footer-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearConversations();
            });
        }
    }

    handleSidebarAction(action) {
        switch(action) {
            case 'New Chat':
                this.startNewChat();
                break;
            case 'Chat History':
                this.showChatHistory();
                break;
            case 'Saved Notes':
                this.showSavedNotes();
                break;
            case 'Performance Insights':
                this.showPerformanceInsights();
                break;
            case 'Settings':
                this.showSettings();
                break;
        }
    }

    displayPersonalizedWelcome() {
        if (!this.userProfile) {
            // Default welcome if no user profile
            this.addMessageToChat('ai', "Hello! I'm Alex, your AI tutor. I'm here to help you with any questions about your courses, homework, or learning concepts. What would you like to know today?");
            return;
        }

        const welcomeMessage = this.generatePersonalizedWelcome();
        this.addMessageToChat('ai', welcomeMessage);
    }

    generatePersonalizedWelcome() {
        const { name, firstName, interests, educationLevel, learningGoals } = this.userProfile;
        const userName = firstName || name || 'there';
        
        let message = `Welcome back, ${userName}! `;
        
        if (interests && interests.length > 0) {
            message += `I see you're interested in ${interests.join(' and ')}. `;
        }
        
        if (educationLevel) {
            message += `As a ${educationLevel} student, `;
        }
        
        if (learningGoals) {
            message += `I'm here to help you work on your goal of ${learningGoals.toLowerCase()}. `;
        }
        
        message += "What would you like to learn today? I can help explain concepts, create study materials, or quiz you on your subjects!";
        
        return message;
    }

    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        messageInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Generate AI response
        const response = await this.generateAIResponse(message);
        
        // Remove typing indicator and add AI response
        this.hideTypingIndicator();
        this.addMessageToChat('ai', response);
    }

    async generateAIResponse(userMessage) {
        // Simulate API call delay
        return new Promise((resolve) => {
            setTimeout(() => {
                const response = this.generateContextualResponse(userMessage);
                resolve(response);
            }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
        });
    }

    generateContextualResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        // Check for personalized responses based on user interests
        if (this.userProfile?.interests) {
            for (const interest of this.userProfile.interests) {
                if (lowerMessage.includes(interest.toLowerCase())) {
                    return this.generateSubjectSpecificResponse(interest, userMessage);
                }
            }
        }

        // Fallback to general responses
        if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
            const subject = this.userProfile?.interests?.[0] || 'mathematics';
            return this.generateQuizResponse(subject);
        } else if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
            return this.generateExplanationResponse(userMessage);
        } else if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
            const subject = this.userProfile?.interests?.[0] || 'mathematics';
            return this.generateSummaryResponse(subject);
        } else {
            return this.generateGeneralResponse(userMessage);
        }
    }

    generateSubjectSpecificResponse(subject, message) {
        const responses = {
            'Mathematics': `Great question about ${subject}! This relates to core mathematical concepts. Let me break down "${message}" in a way that's perfect for your level.`,
            'Physics': `Excellent physics inquiry! "${message}" touches on fundamental physical principles. Let me explain this with real-world examples.`,
            'Chemistry': `Fascinating chemistry question! "${message}" involves important chemical concepts. Let me make this clear and engaging for you.`,
            'Biology': `Interesting biology question! "${message}" relates to living organisms and biological processes. Let me explain this clearly.`,
            'History': `Fascinating historical question! "${message}" involves important events and contexts. Let me provide some historical perspective.`,
            'Literature': `Great literature question! "${message}" relates to literary works and analysis. Let me break this down for you.`
        };

        return responses[subject] || `I'd be happy to help with your ${subject} question! "${message}" is a great topic to explore.`;
    }

    generateQuizResponse(subject) {
        const quizzes = {
            'Mathematics': "**Math Quiz Time!** 🎯\n\n1. Solve for x: 2x + 5 = 13\n2. What's the area of a circle with radius 4?\n3. Simplify: (3x²)(2x³)\n\nTake your time, and I'll help you with any questions!",
            'Physics': "**Physics Challenge!** 🌌\n\n1. What's Newton's First Law of Motion?\n2. Calculate the force needed to accelerate a 5kg object at 3m/s²\n3. What is conservation of energy?\n\nReady to test your physics knowledge?",
            'Chemistry': "**Chemistry Quiz!** 🔬\n\n1. What is the atomic number of Carbon?\n2. Balance this equation: H₂ + O₂ → H₂O\n3. What are valence electrons?\n\nLet's see how you do!"
        };

        return quizzes[subject] || "Let me create a personalized quiz for you! What specific topic would you like to be quizzed on?";
    }

    generateExplanationResponse(question) {
        return `I'd be happy to explain "${question}"! This is an important concept that connects to your learning goals. Let me break it down into simple, understandable parts...`;
    }

    generateSummaryResponse(subject) {
        return `Here's a summary of key ${subject} concepts relevant to your studies:\n\n• Fundamental principles and theories\n• Important formulas and applications\n• Common problem-solving approaches\n• Real-world connections\n\nWould you like me to elaborate on any specific area?`;
    }

    generateGeneralResponse(message) {
        const { firstName, name } = this.userProfile || {};
        const userName = firstName || name || 'there';
        
        return `Thanks for your question, ${userName}! "${message}" is a great topic to explore. Based on your learning journey, here's what you should know...\n\n[Personalized explanation and guidance would follow here]`;
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-${sender === 'ai' ? 'robot' : 'user'}"></i>
            </div>
            <div class="message-content">
                <p>${this.formatMessage(message)}</p>
                <span class="message-time">${time}</span>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Add to chat history
        this.chatHistory.push({
            sender,
            message,
            timestamp: new Date().toISOString()
        });
    }

    formatMessage(message) {
        // Simple markdown-like formatting
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const chatMessages = document.querySelector('.chat-messages');
        if (!chatMessages) return;

        const typingElement = document.createElement('div');
        typingElement.className = 'message ai-message typing-indicator';
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        this.isTyping = true;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    startNewChat() {
        const chatMessages = document.querySelector('.chat-messages');
        if (chatMessages) {
            chatMessages.innerHTML = '';
            this.displayPersonalizedWelcome();
        }
    }

    clearConversations() {
        if (confirm('Are you sure you want to clear all conversations?')) {
            this.startNewChat();
        }
    }

    showChatHistory() {
        alert('Chat history feature would show your previous conversations here.');
    }

    showSavedNotes() {
        alert('Saved notes feature would display your bookmarked content and important notes.');
    }

    showPerformanceInsights() {
        alert('Performance insights would show your learning analytics and progress trends.');
    }

    showSettings() {
        alert('Settings panel would allow you to customize your AI Tutor experience and preferences.');
    }
}

// Initialize AI Tutor when on AI Tutor page
function initializeAITutor() {
    // Check if we're on the AI Tutor page
    const tutorPage = document.getElementById('ai-tutor');
    if (tutorPage && tutorPage.classList.contains('active')) {
        window.aiTutor = new AITutor();
    }
}

// Auto-initialize if on correct page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Chat script loaded');
    
    // Check authentication
    const token = localStorage.getItem('edugpt_token');
    const user = localStorage.getItem('edugpt_user');
    
    if (!token || !user) {
        console.log('No user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    // Initialize AI Tutor if on the correct page
    initializeAITutor();
});

// Export for manual initialization if needed
window.initializeAITutor = initializeAITutor;