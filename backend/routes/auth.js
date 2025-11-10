const express = require('express');
const { verifyFirebaseToken } = require('../middleware/firebase-auth');
const { auth, db } = require('../config/firebase');
const router = express.Router();

// ✅ Sync user after Client SDK signup
router.post('/sync-user', verifyFirebaseToken, async (req, res) => {
  try {
    const { email, displayName, role } = req.body;
    
    console.log('🔄 Syncing user with backend:', email);
    
    // Create/update user in Firestore
    const userData = {
      uid: req.user.uid,
      email: email,
      displayName: displayName,
      role: role,
      authProvider: 'email',
      profileCompleted: false,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      isActive: true,
      profile: {
        educationLevel: '',
        interests: [],
        learningGoals: '',
        bio: ''
      }
    };

    await db.collection('users').doc(req.user.uid).set(userData, { merge: true });

    console.log('✅ User synced with backend:', email);
    
    res.json({
      success: true,
      message: 'User synced successfully',
      user: userData
    });
    
  } catch (error) {
    console.error('❌ User sync error:', error);
    res.status(500).json({
      success: false,
      error: 'User sync failed'
    });
  }
});

// ✅ Verify token and get user data
router.get('/verify', verifyFirebaseToken, async (req, res) => {
  try {
    console.log('🔐 Verifying token for user:', req.user.uid);
    
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
});

module.exports = router;