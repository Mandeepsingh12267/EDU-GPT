// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// AI Chat endpoint
router.post('/chat', async (req, res) => {
    try {
        const { message, userId } = req.body;
        
        if (!message || !userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Message and userId are required' 
            });
        }

        // Get user profile for personalization
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        const userProfile = userDoc.data();
        
        // Generate personalized AI response
        const response = await generatePersonalizedResponse(message, userProfile);
        
        // Save to chat history
        await saveChatMessage(userId, 'user', message);
        await saveChatMessage(userId, 'assistant', response);
        
        // Update user's last activity
        await updateUserActivity(userId);

        res.json({ 
            success: true, 
            response,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('AI chat error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Get chat history
router.get('/chat/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const chatDoc = await admin.firestore().collection('chats').doc(userId).get();
        
        if (!chatDoc.exists) {
            return res.json({ 
                success: true, 
                messages: [] 
            });
        }

        const chatData = chatDoc.data();
        
        res.json({ 
            success: true, 
            messages: chatData.messages || [] 
        });

    } catch (error) {
        console.error('Get chat history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Clear chat history
router.delete('/chat/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        await admin.firestore().collection('chats').doc(userId).set({
            messages: [],
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ 
            success: true, 
            message: 'Chat history cleared successfully' 
        });

    } catch (error) {
        console.error('Clear chat history error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Generate personalized quiz
router.post('/quiz/generate', async (req, res) => {
    try {
        const { userId, subject, difficulty = 'beginner' } = req.body;
        
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userProfile = userDoc.data();
        
        const quiz = await generatePersonalizedQuiz(subject, difficulty, userProfile);
        
        res.json({ 
            success: true, 
            quiz 
        });

    } catch (error) {
        console.error('Quiz generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Progress tracking
router.post('/progress/update', async (req, res) => {
    try {
        const { userId, progressData } = req.body;
        
        await updateUserProgress(userId, progressData);
        
        res.json({ 
            success: true, 
            message: 'Progress updated successfully' 
        });

    } catch (error) {
        console.error('Progress update error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Get user progress
router.get('/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const progressDoc = await admin.firestore().collection('progress').doc(userId).get();
        
        if (!progressDoc.exists) {
            return res.json({ 
                success: true, 
                progress: getDefaultProgressData() 
            });
        }

        res.json({ 
            success: true, 
            progress: progressDoc.data() 
        });

    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Helper functions
async function generatePersonalizedResponse(message, userProfile) {
    const { firstName, interests, educationLevel, learningGoals } = userProfile;
    
    // This is where you'd integrate with OpenAI API
    // For now, return a mock personalized response
    
    let personalizedContext = '';
    if (interests && interests.length > 0) {
        personalizedContext += ` The user is interested in ${interests.join(', ')}.`;
    }
    if (educationLevel) {
        personalizedContext += ` They are at ${educationLevel} level.`;
    }
    if (learningGoals) {
        personalizedContext += ` Their learning goal is: ${learningGoals}.`;
    }

    // Simple rule-based responses for demo
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
        const subject = interests?.[0] || 'general knowledge';
        return `I'd be happy to create a quiz for you about ${subject}!${personalizedContext} What specific topic would you like to be quizzed on?`;
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        return `I'll explain that concept in simple terms suitable for your level.${personalizedContext} Let me break it down for you...`;
    }
    
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
        return `I can help summarize that content for you.${personalizedContext} Here are the key points...`;
    }

    return `Hello ${firstName || 'there'}!${personalizedContext} Regarding your question "${message}", here's what I can tell you based on your learning profile and goals...`;
}

async function generatePersonalizedQuiz(subject, difficulty, userProfile) {
    // Generate quiz based on subject and user level
    const quizzes = {
        'mathematics': {
            title: `Mathematics Quiz - ${difficulty}`,
            questions: [
                {
                    question: "Solve for x: 2x + 5 = 13",
                    options: ["x = 4", "x = 5", "x = 6", "x = 7"],
                    correctAnswer: 0,
                    explanation: "Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4"
                },
                {
                    question: "What is the area of a circle with radius 4?",
                    options: ["16π", "8π", "12π", "4π"],
                    correctAnswer: 0,
                    explanation: "Area = πr² = π(4)² = 16π"
                }
            ]
        },
        'physics': {
            title: `Physics Quiz - ${difficulty}`,
            questions: [
                {
                    question: "What is Newton's First Law of Motion?",
                    options: [
                        "An object at rest stays at rest",
                        "F = ma", 
                        "For every action there is an equal reaction",
                        "Energy cannot be created or destroyed"
                    ],
                    correctAnswer: 0,
                    explanation: "Newton's First Law states that an object at rest stays at rest unless acted upon by a force."
                }
            ]
        }
    };

    return quizzes[subject.toLowerCase()] || quizzes.mathematics;
}

async function saveChatMessage(userId, role, content) {
    await admin.firestore().collection('chats').doc(userId).set({
        messages: admin.firestore.FieldValue.arrayUnion({
            role,
            content,
            timestamp: new Date().toISOString()
        }),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

async function updateUserActivity(userId) {
    await admin.firestore().collection('users').doc(userId).set({
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        totalSessions: admin.firestore.FieldValue.increment(1)
    }, { merge: true });
}

async function updateUserProgress(userId, progressData) {
    await admin.firestore().collection('progress').doc(userId).set({
        ...progressData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
}

function getDefaultProgressData() {
    return {
        progress: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        completedLessons: 0,
        achievements: [],
        courses: {},
        weeklyGoals: {
            studySessions: 5,
            studyHours: 10,
            lessonsCompleted: 7
        }
    };
}

module.exports = router;