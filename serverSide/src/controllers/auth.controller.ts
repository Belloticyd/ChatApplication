



import { Request, Response } from 'express';
import { OTPService } from '../services/otp.service';
import { UserService } from '../services/user.service';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { db } from '../config/firebase.config';

export class AuthController {
  // Send OTP to phone number
  static async sendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        res.status(400).json({ error: 'Phone number is required' });
        return;
      }

      const result = await OTPService.sendOTP(phoneNumber);
      
      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        sessionId: result.sessionId,
      });
    } catch (error) {
      console.error('Send OTP error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to send OTP',
      });
    }
  }

  // Verify OTP and login/register user
  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, otp } = req.body;

      if (!sessionId || !otp) {
        res.status(400).json({ error: 'Session ID and OTP are required' });
        return;
      }

      const result = await OTPService.verifyOTP(sessionId, otp);

      if (!result.success || !result.userId || !result.token || !result.phoneNumber) {
        res.status(401).json({ error: 'Invalid OTP' });
        return;
      }

      // Get or create user in Firestore
      let user = await UserService.getUser(result.userId);

      if (!user) {
        user = await UserService.upsertUser(result.userId, {
          phoneNumber: result.phoneNumber,
          displayName: `User_${result.phoneNumber.slice(-4)}`,
          onlineStatus: 'online',
          lastSeen: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Update online status
        await UserService.updateOnlineStatus(result.userId, 'online');
      }

      // Generate refresh token (store in Firestore)
      const refreshToken = generateRefreshToken();
      
      // Store refresh token in Firestore
      await db.collection('refresh_tokens').doc(refreshToken).set({
        userId: result.userId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      // Return user data and tokens
      res.status(200).json({
        success: true,
        message: 'OTP verified successfully',
        token: result.token,
        refreshToken,
        user: {
          uid: result.userId,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          photoURL: user.photoURL,
          onlineStatus: user.onlineStatus,
          lastSeen: user.lastSeen,
        },
      });
    } catch (error) {
      console.error('Verify OTP error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to verify OTP',
      });
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      // Check if refresh token exists in Firestore
      const tokenDoc = await db.collection('refresh_tokens').doc(refreshToken).get();

      if (!tokenDoc.exists) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      const tokenData = tokenDoc.data();
      
      // Type guard: Check if tokenData exists
      if (!tokenData) {
        res.status(401).json({ error: 'Invalid token data' });
        return;
      }

      // Check if expired
      if (new Date() > tokenData.expiresAt.toDate()) {
        await db.collection('refresh_tokens').doc(refreshToken).delete();
        res.status(401).json({ error: 'Refresh token expired' });
        return;
      }

      // Get user
      const user = await UserService.getUser(tokenData.userId);
      
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Generate new access token with uid
      const newToken = generateAccessToken({
        uid: user.uid,
        phoneNumber: user.phoneNumber,
      });

      // Generate new refresh token
      const newRefreshToken = generateRefreshToken();
      
      // Store new refresh token
      await db.collection('refresh_tokens').doc(newRefreshToken).set({
        userId: user.uid,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      // Delete old refresh token
      await db.collection('refresh_tokens').doc(refreshToken).delete();

      res.status(200).json({
        token: newToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({ error: 'Failed to refresh token' });
    }
  }

  // Logout user
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { refreshToken } = req.body;

      // Update online status
      if (userId) {
        await UserService.updateOnlineStatus(userId, 'offline');
      }

      // Delete refresh token
      if (refreshToken) {
        await db.collection('refresh_tokens').doc(refreshToken).delete();
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await UserService.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user: {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          photoURL: user.photoURL,
          status: user.status,
          onlineStatus: user.onlineStatus,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}