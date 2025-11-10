// js/api.js
class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // AI Tutor methods
    async sendChatMessage(userId, message) {
        return this.request('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ userId, message })
        });
    }

    async getChatHistory(userId) {
        return this.request(`/ai/chat/history/${userId}`);
    }

    async clearChatHistory(userId) {
        return this.request(`/ai/chat/history/${userId}`, {
            method: 'DELETE'
        });
    }

    async generateQuiz(userId, subject, difficulty = 'beginner') {
        return this.request('/ai/quiz/generate', {
            method: 'POST',
            body: JSON.stringify({ userId, subject, difficulty })
        });
    }

    // User methods
    async getUserProfile(userId) {
        return this.request(`/users/${userId}`);
    }

    async updateUserProfile(userId, data) {
        return this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getDashboardData(userId) {
        return this.request(`/users/${userId}/dashboard`);
    }

    // Progress methods
    async updateProgress(userId, progressData) {
        return this.request('/ai/progress/update', {
            method: 'POST',
            body: JSON.stringify({ userId, progressData })
        });
    }

    async getProgress(userId) {
        return this.request(`/ai/progress/${userId}`);
    }
}

// Create global instance
window.apiService = new APIService();