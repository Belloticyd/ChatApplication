




// serverSide/src/services/otp.service.ts
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
      // Validate phone number format (E.164)
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw new Error('Invalid phone number format. Use E.164 format (e.g., +1234567890)');
      }

      // Generate a unique session ID
      const sessionId = Math.random().toString(36).substring(7);
      
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in Firestore
      await db.collection(OTP_COLLECTION).doc(sessionId).set({
        phoneNumber,
        otp: otpCode,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        attempts: 0,
        createdAt: new Date(),
      });

      // Log OTP for development (in production, send via SMS)
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
      // Get OTP document from Firestore
      const otpDoc = await db.collection(OTP_COLLECTION).doc(sessionId).get();
      
      if (!otpDoc.exists) {
        throw new Error('Invalid session. Please request a new OTP.');
      }

      const otpData = otpDoc.data() as OTPRecord | undefined;
      
      // Type guard
      if (!otpData) {
        throw new Error('Invalid OTP data. Please request a new OTP.');
      }

      // Check if expired
      const expiresAt = otpData.expiresAt instanceof Date 
        ? otpData.expiresAt 
        : new Date(otpData.expiresAt);
      
      if (new Date() > expiresAt) {
        await db.collection(OTP_COLLECTION).doc(sessionId).delete();
        throw new Error('OTP has expired. Please request a new one.');
      }

      // Check attempts
      if (otpData.attempts >= 3) {
        await db.collection(OTP_COLLECTION).doc(sessionId).delete();
        throw new Error('Too many failed attempts. Please request a new OTP.');
      }

      // Verify OTP
      if (otpData.otp !== otpCode) {
        // Increment attempts
        await db.collection(OTP_COLLECTION).doc(sessionId).update({
          attempts: FieldValue.increment(1),
        });
        throw new Error('Invalid OTP code. Please try again.');
      }

      // ✅ OTP is valid! Now handle user authentication
      const phoneNumber = otpData.phoneNumber;
      let userId = '';

      try {
        // ✅ Correct method to get user by phone number in Firebase Admin SDK
        const userRecord = await auth.getUserByPhoneNumber(phoneNumber);
        userId = userRecord.uid;
      } catch (error) {
        // User doesn't exist, create one
        const newUser = await auth.createUser({
          phoneNumber: phoneNumber,
          displayName: `User_${phoneNumber.slice(-4)}`,
        });
        userId = newUser.uid;
      }

      // Clean up OTP document
      await db.collection(OTP_COLLECTION).doc(sessionId).delete();

      // Generate JWT token
      const token = generateAccessToken({
        uid: userId,
        phoneNumber: phoneNumber,
      });

      return { 
        success: true, 
        userId, 
        token, 
        phoneNumber 
      };
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error;
    }
  }
}