const { auth, db } = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await auth.verifyIdToken(token);
    req.firebaseUser = decodedToken;
    
    // Get or create user in Firestore
    const usersRef = db.collection('users');
    const userDoc = await usersRef.doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      // Create new user in Firestore
      const userData = {
        uid: decodedToken.uid,
        email: decodedToken.email.toLowerCase(),
        displayName: decodedToken.name || '',
        photoURL: decodedToken.picture || '',
        authProvider: decodedToken.firebase?.sign_in_provider === 'google.com' ? 'google' : 'email',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp(),
        profileCompleted: false,
        userType: 'student' // default
      };
      
      await usersRef.doc(decodedToken.uid).set(userData);
      console.log(`✅ New user created in Firestore: ${userData.email}`);
      req.user = userData;
    } else {
      // Update last login for existing user
      const userData = userDoc.data();
      await usersRef.doc(decodedToken.uid).update({
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
      req.user = userData;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Firebase authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false,
        error: 'Token expired. Please sign in again.' 
      });
    }
    
    res.status(401).json({ 
      success: false,
      error: 'Invalid authentication token.' 
    });
  }
};

module.exports = { verifyFirebaseToken };