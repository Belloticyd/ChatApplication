


import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { otpLimiter, authLimiter } from '../middleware/rate-limit.middleware';

const router = express.Router();

// Public routes with rate limiting
router.post('/send-otp', otpLimiter, AuthController.sendOTP);
router.post('/verify-otp', authLimiter, AuthController.verifyOTP);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;