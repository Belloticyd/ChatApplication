


import { auth, db } from '../config/firebase.config';
import { generateAccessToken } from '../utils/jwt.util';
import { FieldValue } from 'firebase-admin/firestore';

const OTP_COLLECTION = 'otps';

interface OTPRecord {
  phoneNumber: string;
  otp: string;
  expiresAt: Date;
  attempts: number;
}

export class OTPService {
  static async sendOTP(phoneNumber: string): Promise<{ sessionId: string }> {
    try {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      }

      const sessionId = Math.random().toString(36).substring(7);
      
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await db.collection(OTP_COLLECTION).doc(sessionId).set({
        phoneNumber,
        otp: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        attempts: 0,
        createdAt: new Date(),
      });

      console.log(`📱 OTP for ${phoneNumber}: ${otpCode}`);

      return { sessionId };
    } catch (error) {
      console.error('Send OTP error:', error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  static async verifyOTP(
    sessionId: string,
    otpCode: string
  ): Promise<{ success: boolean; userId?: string; token?: string; phoneNumber?: string }> {
    try {
      const otpDoc = await db.collection(OTP_COLLECTION).doc(sessionId).get();
      
      if (!otpDoc.exists) {
        throw new Error('Invalid session. Please request a new OTP.');
      }

      const otpData = otpDoc.data() as OTPRecord | undefined;
      
      // Type guard
      if (!otpData) {
        throw new Error('Invalid OTP data. Please request a new OTP.');
      }

      // Check if expired - convert Firestore Timestamp to Date if needed
      const expiresAt = otpData.expiresAt instanceof Date 
        ? otpData.expiresAt 
        : new Date(otpData.expiresAt);
      
      if (new Date() > expiresAt) {
        await db.collection(OTP_COLLECTION).doc(sessionId).delete();
        throw new Error('OTP has expired. Please request a new one.');
      }

      if (otpData.attempts >= 3) {
        await db.collection(OTP_COLLECTION).doc(sessionId).delete();
        throw new Error('Too many failed attempts. Please request a new OTP.');
      }

      if (otpData.otp !== otpCode) {
        await db.collection(OTP_COLLECTION).doc(sessionId).update({
          attempts: FieldValue.increment(1),
        });
        throw new Error('Invalid OTP code. Please try again.');
      }

      // OTP is valid!
      const phoneNumber = otpData.phoneNumber;
      
      // Check if user exists in Firebase Auth
      let userId = '';
      try {
        const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
        userId = userRecord.uid;
      } catch {
        // User doesn't exist, create one
        const newUser = await auth.createUser({
          phoneNumber: phoneNumber,
          displayName: `User_${phoneNumber.slice(-4)}`,
        });
        userId = newUser.uid;
      }

      // Clean up OTP
      await db.collection(OTP_COLLECTION).doc(sessionId).delete();

      // Generate JWT with uid
      const token = generateAccessToken({
        uid: userId,
        phoneNumber: phoneNumber,
      });

      return { success: true, userId, token, phoneNumber };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }
}