import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import UploadService from '../services/UploadService';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('-passwordHash -refreshTokens');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { bio, status } = req.body;

    const updateFields: any = {};
    if (bio !== undefined) updateFields.bio = bio;
    if (status !== undefined) updateFields.status = status;

    if (req.file) {
      // If there's an uploaded file (avatar)
      const filename = req.file.filename;
      updateFields.avatarUrl = UploadService.getFileUrl(filename);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-passwordHash -refreshTokens');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

export const searchUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user?.id;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, message: 'Search query is required.' });
    }

    // Search by username or email, excluding the current user
    const users = await User.find({
      _id: { $ne: currentUserId },
      isVerified: true,
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('username email avatarUrl status lastSeen bio').limit(15);

    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select('username email bio status avatarUrl isAdmin isVerified createdAt');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      settings: {
        user,
        notifications: {
          messages: true,
          mentions: true,
          sound: true
        },
        theme: 'dark'
      }
    });
  } catch (error) {
    next(error);
  }
};
