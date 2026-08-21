


// serverSide/src/controllers/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  /**
   * Get all users except the currently authenticated user.
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.userId;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const users = await UserService.getAllUsers();

      const filteredUsers = users.filter(
        (user) => user.uid !== currentUserId
      );

      res.status(200).json({
        success: true,
        users: filteredUsers,
      });
    } catch (error) {
      console.error('Get all users error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get users',
      });
    }
  }

  /**
   * Search users by phone number or name.
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const currentUserId = req.userId;
      const { query } = req.query;

      if (!currentUserId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      if (typeof query !== 'string' || query.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
        return;
      }

      const users = await UserService.searchUsers(query.trim());

      const filteredUsers = users.filter(
        (user) => user.uid !== currentUserId
      );

      res.status(200).json({
        success: true,
        users: filteredUsers,
      });
    } catch (error) {
      console.error('Search users error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to search users',
      });
    }
  }

  /**
   * Get a single user by their Firebase UID.
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      // Express route parameters should be strings,
      // but explicitly validate the type for TypeScript safety.
      if (typeof userId !== 'string' || userId.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Valid user ID is required',
        });
        return;
      }

      const user = await UserService.getUser(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Get user error:', error);

      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  }

  /**
   * Update the currently authenticated user's profile.
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const { displayName, photoURL, status } = req.body;

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

      res.status(500).json({
        success: false,
        error: 'Failed to update profile',
      });
    }
  }
}