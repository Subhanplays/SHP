import admin from 'firebase-admin';

let firebaseApp = null;

export const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    const firebaseConfig = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !firebaseConfig.privateKey) {
      console.warn('⚠️ Firebase Admin SDK not configured. Authentication will be limited.');
      return;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig),
    });

    console.log('✅ Firebase Admin SDK initialized');
  }
  return firebaseApp;
};

export const getFirebaseApp = () => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
};

export const verifyFirebaseToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    throw new Error('Invalid or expired Firebase token');
  }
};

export default firebaseApp;