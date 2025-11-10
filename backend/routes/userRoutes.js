// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Get user profile
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        const userData = userDoc.data();
        
        // Remove sensitive data
        const { password, ...safeUserData } = userData;

        res.json({ 
            success: true, 
            user: safeUserData 
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Update user profile
router.put('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        await admin.firestore().collection('users').doc(userId).set(updateData, { merge: true });

        res.json({ 
            success: true, 
            message: 'Profile updated successfully' 
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Get user dashboard data
router.get('/:userId/dashboard', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Get user profile
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        
        // Get progress data
        const progressDoc = await admin.firestore().collection('progress').doc(userId).get();
        const progressData = progressDoc.exists ? progressDoc.data() : getDefaultProgressData();
        
        // Get recent achievements
        const achievements = progressData.achievements || [];
        
        // Calculate study streak (simplified)
        const studyStreak = await calculateStudyStreak(userId);

        res.json({ 
            success: true, 
            dashboard: {
                user: userData,
                progress: progressData.progress || 0,
                studyStreak,
                currentCourse: progressData.currentCourse || 'Getting Started',
                achievements: achievements.slice(0, 4), // Last 4 achievements
                totalStudyTime: progressData.totalStudyTime || 0,
                completedLessons: progressData.completedLessons || 0
            }
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Helper functions
async function calculateStudyStreak(userId) {
    // Simplified streak calculation
    // In production, you'd analyze study session timestamps
    const progressDoc = await admin.firestore().collection('progress').doc(userId).get();
    const progressData = progressDoc.exists ? progressDoc.data() : {};
    return progressData.studyStreak || 0;
}

function getDefaultProgressData() {
    return {
        progress: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        completedLessons: 0,
        achievements: [],
        courses: {}
    };
}

module.exports = router;