

// serverSide/src/routes/user.routes.ts
import express from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (except yourself)
router.get('/', UserController.getAllUsers);

// Search users by phone number or name
router.get('/search', UserController.searchUsers);

// Get user by ID
router.get('/:userId', UserController.getUserById);

// Update user profile
router.put('/profile', UserController.updateProfile);

export default router;