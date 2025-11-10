// js/dashboard.js - Dashboard functionality ONLY
class StudentDashboard {
    constructor() {
        this.userData = null;
        this.progressData = null;
        this.init();
    }

    async init() {
        await this.loadUserData();
        await this.loadProgressData();
        this.initializeDashboard();
        this.setupEventListeners();
        console.log('Student Dashboard initialized');
    }

    async loadUserData() {
        try {
            const user = JSON.parse(localStorage.getItem('edugpt_user'));
            if (user) {
                this.userData = user;
                console.log('User data loaded:', this.userData);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Fallback to mock data for demo
            this.userData = {
                name: 'Alex',
                firstName: 'Alex',
                interests: ['Mathematics', 'Physics'],
                educationLevel: 'High School',
                learningGoals: 'Improve calculus skills'
            };
        }
    }

    async loadProgressData() {
        try {
            // For demo purposes, using mock data
            this.progressData = {
                progress: 75,
                currentCourse: 'Advanced Mathematics',
                currentChapter: 'Chapter 5: Calculus',
                chapterProgress: 60,
                studyStreak: 12,
                totalStudyTime: 1560, // minutes
                completedLessons: 24,
                achievements: [
                    {
                        title: 'Math Master',
                        description: 'Completed Algebra course with 95% score',
                        date: '2 days ago',
                        type: 'gold'
                    },
                    {
                        title: 'Quick Learner',
                        description: 'Finished 5 chapters in one week',
                        date: '1 week ago',
                        type: 'silver'
                    },
                    {
                        title: 'Study Streak',
                        description: '7+ days of consistent learning',
                        date: '2 weeks ago',
                        type: 'bronze'
                    },
                    {
                        title: 'Problem Solver',
                        description: 'Solved 100+ practice problems',
                        date: '3 weeks ago',
                        type: 'blue'
                    }
                ]
            };
        } catch (error) {
            console.error('Error loading progress data:', error);
        }
    }

    initializeDashboard() {
        this.updateWelcomeSection();
        this.updateProgressMetrics();
        this.updateAchievements();
        this.updateStudyStreak();
    }

    updateWelcomeSection() {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && this.userData) {
            userNameElement.textContent = this.userData.name || this.userData.firstName || 'Student';
        }
    }

    updateProgressMetrics() {
        if (!this.progressData) return;

        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = `${this.progressData.progress}%`;
        }

        // Update current course information
        const currentCourseElements = document.querySelectorAll('.progress-card p');
        currentCourseElements.forEach(element => {
            if (element.textContent.includes('Advanced Mathematics') || element.previousElementSibling?.textContent === 'Current Course') {
                element.textContent = this.progressData.currentCourse;
                
                // Find the progress text span for chapter info
                const progressText = element.parentElement.querySelector('.progress-text');
                if (progressText) {
                    progressText.textContent = this.progressData.currentChapter;
                }
            }
        });

        // Update study streak
        const streakCount = document.querySelector('.streak-count');
        if (streakCount) {
            streakCount.textContent = `${this.progressData.studyStreak} days`;
        }
    }

    updateAchievements() {
        const achievementsGrid = document.querySelector('.achievements-grid');
        if (!achievementsGrid || !this.progressData) return;

        // Clear existing achievements
        achievementsGrid.innerHTML = '';

        this.progressData.achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = 'achievement-card';
            
            achievementCard.innerHTML = `
                <div class="achievement-icon ${achievement.type}">
                    <i class="fas fa-${this.getAchievementIcon(achievement.type)}"></i>
                </div>
                <h4>${achievement.title}</h4>
                <p>${achievement.description}</p>
                <span class="achievement-date">${achievement.date}</span>
            `;
            
            achievementsGrid.appendChild(achievementCard);
        });
    }

    getAchievementIcon(type) {
        const icons = {
            'gold': 'trophy',
            'silver': 'star',
            'bronze': 'bolt',
            'blue': 'check-circle'
        };
        return icons[type] || 'award';
    }

    updateStudyStreak() {
        const streakElement = document.querySelector('.streak-count');
        if (streakElement && this.progressData) {
            streakElement.textContent = `${this.progressData.studyStreak} days`;
        }
    }

    setupEventListeners() {
        // Continue Learning button
        const continueBtn = document.querySelector('.cta-btn');
        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Continue learning clicked');
                this.navigateToAITutor();
            });
        }

        // Progress card interactions
        this.setupProgressCardInteractions();
    }

    setupProgressCardInteractions() {
        const progressCards = document.querySelectorAll('.progress-card');
        progressCards.forEach(card => {
            card.addEventListener('click', () => {
                const cardTitle = card.querySelector('h3').textContent;
                this.handleProgressCardClick(cardTitle);
            });
        });
    }

    handleProgressCardClick(cardTitle) {
        switch(cardTitle.toLowerCase()) {
            case 'learning progress':
                this.showProgressDetails();
                break;
            case 'current course':
                this.showCourseDetails();
                break;
            case 'study streak':
                this.showStreakDetails();
                break;
        }
    }

    showProgressDetails() {
        alert(`Your overall learning progress: ${this.progressData.progress}%\nCompleted Lessons: ${this.progressData.completedLessons}\nTotal Study Time: ${Math.round(this.progressData.totalStudyTime / 60)} hours`);
    }

    showCourseDetails() {
        alert(`Current Course: ${this.progressData.currentCourse}\nCurrent Chapter: ${this.progressData.currentChapter}\nChapter Progress: ${this.progressData.chapterProgress}%`);
    }

    showStreakDetails() {
        alert(`Amazing! You've maintained a ${this.progressData.studyStreak}-day study streak! Keep up the great work!`);
    }

    navigateToAITutor() {
        if (window.pageManager && typeof window.pageManager.navigateTo === 'function') {
            window.pageManager.navigateTo('ai-tutor');
        }
    }
}

// Initialize dashboard when on student dashboard page
function initializeStudentDashboard() {
    // Check if we're on the student dashboard page
    const dashboardPage = document.getElementById('student-dashboard');
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        window.dashboard = new StudentDashboard();
    }
}

// Auto-initialize if on correct page
document.addEventListener('DOMContentLoaded', function() {
    console.log('Dashboard script loaded');
    
    // Check authentication
    const token = localStorage.getItem('edugpt_token');
    const user = localStorage.getItem('edugpt_user');
    
    if (!token || !user) {
        console.log('No user found, redirecting to login');
        window.location.href = 'index.html';
        return;
    }

    // Initialize dashboard if on the correct page
    initializeStudentDashboard();
});

// Export for manual initialization if needed
window.initializeStudentDashboard = initializeStudentDashboard;