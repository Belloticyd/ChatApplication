


// serverSide/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  // Get all users except the current user
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.userId;
      
      if (!currentUserId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Get all users
      const users = await UserService.getAllUsers();
      
      // Filter out the current user
      const filteredUsers = users.filter(user => user.uid !== currentUserId);
      
      res.status(200).json({
        success: true,
        users: filteredUsers,
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  // Search users by phone number or name
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;
      const currentUserId = req.userId;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      if (!currentUserId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const users = await UserService.searchUsers(query);
      
      // Filter out the current user
      const filteredUsers = users.filter(user => user.uid !== currentUserId);
      
      res.status(200).json({
        success: true,
        users: filteredUsers,
      });
    } catch (error) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const user = await UserService.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to get user' });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { displayName, photoURL, status } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const updatedUser = await UserService.upsertUser(userId, {
        displayName,
        photoURL,
        status,
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        user: updatedUser,
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
}