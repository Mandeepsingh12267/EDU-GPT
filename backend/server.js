const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/userRoutes');
const aiRoutes = require('./routes/aiRoutes'); // New AI routes

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:5501', 'http://localhost:3000'],
    credentials: true
}));

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Your existing user routes
app.use('/api/ai', aiRoutes); // New AI Tutor routes

// =============================================
// ✅ HEALTH CHECK
// =============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'EduGPT Backend is running! 🚀',
        timestamp: new Date().toISOString(),
        database: 'Firebase Firestore',
        auth: 'Firebase Authentication',
        features: ['Authentication', 'AI Tutor', 'User Management', 'Progress Tracking']
    });
});

// =============================================
// ✅ FIREBASE AUTH ROUTES
// =============================================

// Create custom token for client-side auth
app.post('/api/auth/create-custom-token', async (req, res) => {
    try {
        const { uid, additionalClaims } = req.body;
        
        if (!uid) {
            return res.status(400).json({
                success: false,
                error: 'User ID is required'
            });
        }

        const { admin } = require('./config/firebase');
        const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
        
        res.json({
            success: true,
            customToken
        });
    } catch (error) {
        console.error('Error creating custom token:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create custom token'
        });
    }
});

// =============================================
// ✅ GOOGLE OAUTH ROUTES
// =============================================
app.get('/auth/google', (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.redirect('http://127.0.0.1:5501/signup.html?error=oauth_not_configured');
        }

        const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        
        const params = {
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid profile email',
            access_type: 'offline',
            prompt: 'consent'
        };
        
        Object.keys(params).forEach(key => 
            googleAuthUrl.searchParams.append(key, params[key])
        );
        
        console.log('🔐 Starting Google OAuth flow...');
        res.redirect(googleAuthUrl.toString());
        
    } catch (error) {
        console.error('Error starting Google OAuth:', error);
        res.redirect('http://127.0.0.1:5501/signup.html?error=oauth_config');
    }
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;
        
        console.log('🔄 Google OAuth callback received');
        
        if (error) {
            console.error('Google OAuth error:', error);
            return res.redirect('http://127.0.0.1:5501/signup.html?error=google_' + error);
        }
        
        if (!code) {
            return res.redirect('http://127.0.0.1:5501/signup.html?error=no_auth_code');
        }
        
        // For now, simple redirect - implement full OAuth flow later
        console.log('✅ OAuth successful, redirecting to dashboard...');
        res.redirect('http://127.0.0.1:5501/dashboard.html?auth=success&method=google');
        
    } catch (error) {
        console.error('❌ Google OAuth callback error:', error);
        res.redirect('http://127.0.0.1/signup.html?error=auth_failed');
    }
});

// =============================================
// ✅ AI TUTOR & DASHBOARD ROUTES (NEW)
// =============================================

// Get user progress data for dashboard
app.get('/api/dashboard/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { db } = require('./config/firebase');
        
        // Get user profile
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();
        
        // Get progress data
        const progressDoc = await db.collection('progress').doc(userId).get();
        const progressData = progressDoc.exists ? progressDoc.data() : getDefaultProgressData();
        
        // Get chat history count
        const chatDoc = await db.collection('chats').doc(userId).get();
        const chatHistory = chatDoc.exists ? chatDoc.data().messages || [] : [];
        
        res.json({
            success: true,
            dashboard: {
                user: userData,
                progress: progressData.progress || 0,
                studyStreak: progressData.studyStreak || 0,
                totalStudyTime: progressData.totalStudyTime || 0,
                completedLessons: progressData.completedLessons || 0,
                achievements: progressData.achievements || [],
                currentCourse: progressData.currentCourse || 'Getting Started',
                chatSessions: chatHistory.length,
                lastActive: progressData.lastUpdated || new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard data'
        });
    }
});

// Update user progress
app.post('/api/progress/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const progressData = req.body;
        const { db } = require('./config/firebase');
        
        await db.collection('progress').doc(userId).set({
            ...progressData,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
        
        res.json({
            success: true,
            message: 'Progress updated successfully'
        });
        
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update progress'
        });
    }
});

// Simple AI chat endpoint (can be enhanced later)
app.post('/api/chat/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { message } = req.body;
        const { db } = require('./config/firebase');
        
        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        // Get user profile for personalization
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        // Generate personalized response
        const aiResponse = generateAITutorResponse(message, userData);
        
        // Save to chat history
        await db.collection('chats').doc(userId).set({
            messages: require('firebase-admin').firestore.FieldValue.arrayUnion({
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            }, {
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date().toISOString()
            }),
            lastUpdated: require('firebase-admin').firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        res.json({
            success: true,
            response: aiResponse,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error in AI chat:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process message'
        });
    }
});

// Get chat history
app.get('/api/chat/:userId/history', async (req, res) => {
    try {
        const { userId } = req.params;
        const { db } = require('./config/firebase');
        
        const chatDoc = await db.collection('chats').doc(userId).get();
        
        if (!chatDoc.exists) {
            return res.json({
                success: true,
                messages: []
            });
        }
        
        res.json({
            success: true,
            messages: chatDoc.data().messages || []
        });
        
    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chat history'
        });
    }
});

// =============================================
// ✅ HELPER FUNCTIONS
// =============================================

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

function generateAITutorResponse(message, userData) {
    const { firstName, interests, educationLevel, learningGoals } = userData;
    const userName = firstName || 'there';
    
    let personalizedContext = '';
    if (interests && interests.length > 0) {
        personalizedContext += ` I see you're interested in ${interests.join(', ')}.`;
    }
    if (educationLevel) {
        personalizedContext += ` As a ${educationLevel} student,`;
    }
    if (learningGoals) {
        personalizedContext += ` I'll help you work on ${learningGoals}.`;
    }
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
        const subject = interests?.[0] || 'your studies';
        return `I'd be happy to create a quiz for you about ${subject}!${personalizedContext} What specific topic would you like to be quizzed on?`;
    }
    
    if (lowerMessage.includes('explain') || lowerMessage.includes('what is')) {
        return `I'll explain that concept in simple terms.${personalizedContext} Let me break it down for you...`;
    }
    
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
        return `I can help summarize that content.${personalizedContext} Here are the key points...`;
    }
    
    return `Hello ${userName}!${personalizedContext} Regarding "${message}", here's what I can tell you based on your learning profile...`;
}

// =============================================
// ✅ 404 HANDLER
// =============================================
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// =============================================
// ✅ ERROR HANDLER
// =============================================
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('\n🎉 ==================================');
    console.log('🚀 EduGPT Firebase Backend Started!');
    console.log('==================================');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🏪 Database: Firebase Firestore`);
    console.log(`🔐 Auth: Firebase Authentication`);
    console.log(`🤖 AI Tutor: Enabled`);
    console.log(`📊 Dashboard API: Enabled`);
    console.log(`✅ Health: http://localhost:${PORT}/api/health`);
    console.log('==================================\n');
});