const admin = require('firebase-admin');

// Load service account
const serviceAccount = require('./firebase-config/service-account-key.json');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: `${serviceAccount.project_id}.appspot.com`
  });
  console.log('✅ Firebase Admin initialized successfully');
  
  // Test Firestore connection
  const db = admin.firestore();
  console.log('✅ Firestore connected successfully');
  
  // Test Auth connection
  const auth = admin.auth();
  console.log('✅ Firebase Auth connected successfully');
  
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  process.exit(1); // Exit if Firebase fails to initialize
}

// Firebase services with enhanced configuration
const auth = admin.auth();
const db = admin.firestore();

// Optimize Firestore settings for better performance
db.settings({
  ignoreUndefinedProperties: true, // Ignore undefined fields
  timestampsInSnapshots: true // Better timestamp handling
});

// Helper functions for common operations
const firebaseHelpers = {
  // Safe document creation with timestamp
  async createDocument(collection, data, id = null) {
    try {
      const docRef = id ? db.collection(collection).doc(id) : db.collection(collection).doc();
      const documentData = {
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await docRef.set(documentData);
      return { success: true, id: docRef.id, ref: docRef };
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Safe document update with timestamp
  async updateDocument(collection, id, data) {
    try {
      const docRef = db.collection(collection).doc(id);
      const updateData = {
        ...data,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      await docRef.update(updateData);
      return { success: true, ref: docRef };
    } catch (error) {
      console.error(`Error updating document ${id} in ${collection}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Safe document retrieval
  async getDocument(collection, id) {
    try {
      const docRef = db.collection(collection).doc(id);
      const doc = await docRef.get();
      
      if (!doc.exists) {
        return { success: false, error: 'Document not found' };
      }
      
      return { success: true, data: doc.data(), id: doc.id };
    } catch (error) {
      console.error(`Error getting document ${id} from ${collection}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Batch operations for better performance
  createBatch() {
    return db.batch();
  },

  // Query helper
  async queryCollection(collection, conditions = []) {
    try {
      let query = db.collection(collection);
      
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });
      
      const snapshot = await query.get();
      const results = [];
      
      snapshot.forEach(doc => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, data: results };
    } catch (error) {
      console.error(`Error querying collection ${collection}:`, error);
      return { success: false, error: error.message };
    }
  },

  // User management helpers
  async createUserWithProfile(email, password, userData) {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email,
        password,
        emailVerified: false,
        disabled: false
      });

      // Create user profile in Firestore
      const profileResult = await this.createDocument('users', {
        ...userData,
        email,
        uid: userRecord.uid,
        profileCompleted: true
      }, userRecord.uid);

      if (!profileResult.success) {
        // Rollback: delete the auth user if profile creation fails
        await auth.deleteUser(userRecord.uid);
        return { success: false, error: 'Failed to create user profile' };
      }

      return { 
        success: true, 
        uid: userRecord.uid, 
        userRecord, 
        profile: profileResult 
      };
    } catch (error) {
      console.error('Error creating user with profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Initialize user progress data
  async initializeUserProgress(uid, initialData = {}) {
    const defaultProgress = {
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
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    return await this.createDocument('progress', {
      ...defaultProgress,
      ...initialData
    }, uid);
  },

  // Initialize user chat history
  async initializeUserChat(uid) {
    return await this.createDocument('chats', {
      messages: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, uid);
  }
};

// Database collections reference for easy access
const collections = {
  users: db.collection('users'),
  progress: db.collection('progress'),
  chats: db.collection('chats'),
  achievements: db.collection('achievements'),
  courses: db.collection('courses')
};

module.exports = { 
  admin, 
  auth, 
  db,
  firebaseHelpers,
  collections 
};