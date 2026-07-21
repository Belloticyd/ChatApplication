


import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

// Validate environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
];

requiredEnvVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Prepare service account credentials
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize Firebase Admin SDK only once
let app;
try {
  if (getApps().length === 0) {
    app = initializeApp({
      credential: cert(serviceAccount as any),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
    console.log('🔥 Firebase Admin initialized successfully');
  } else {
    app = getApps()[0];
    console.log('🔥 Firebase Admin already initialized');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error);
  throw error;
}

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const fieldValue = FieldValue;
export const timestamp = Timestamp;

// Helper function to verify Firebase ID token
export const verifyFirebaseToken = async (token: string) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided');
    }
    
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error: any) {
    console.error('Token verification error:', error?.code || error?.message || error);
    
    if (error?.code === 'auth/id-token-expired') {
      throw new Error('Token expired');
    }
    if (error?.code === 'auth/id-token-revoked') {
      throw new Error('Token revoked');
    }
    if (error?.code === 'auth/argument-error') {
      throw new Error('Invalid token format');
    }
    
    throw new Error('Invalid Firebase token');
  }
};

// Helper to create custom JWT
export const createCustomToken = async (uid: string, claims?: Record<string, any>) => {
  try {
    if (!uid) {
      throw new Error('User ID is required');
    }
    
    const token = await auth.createCustomToken(uid, claims);
    return token;
  } catch (error: any) {
    console.error('Create custom token error:', error?.code || error?.message);
    
    if (error?.code === 'auth/user-not-found') {
      throw new Error('User not found');
    }
    
    throw new Error('Failed to create custom token');
  }
};

// Helper to get user by phone number
export const getUserByPhone = async (phoneNumber: string) => {
  try {
    const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
    return userRecord;
  } catch (error: any) {
    if (error?.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
};

// Helper to create a new user
export const createUser = async (phoneNumber: string, displayName?: string) => {
  try {
    const user = await auth.createUser({
      phoneNumber,
      displayName: displayName || `User_${phoneNumber.slice(-4)}`,
    });
    return user;
  } catch (error: any) {
    console.error('Create user error:', error?.code || error?.message);
    throw error;
  }
};
