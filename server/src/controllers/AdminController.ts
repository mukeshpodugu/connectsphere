import { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import Message from '../models/Message';
import Group from '../models/Group';
import File from '../models/File';
import Report from '../models/Report';
import Chat from '../models/Chat';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments();
    const onlineUsers = await User.countDocuments({ status: { $ne: 'offline' } });
    
    // Messages today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const messagesToday = await Message.countDocuments({ createdAt: { $gte: startOfToday } });

    const totalGroups = await Group.countDocuments();
    const totalFiles = await File.countDocuments();

    // Generate weekly activity datasets for chart analytics
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = await Message.countDocuments({
        createdAt: { $gte: d, $lt: nextDay }
      });

      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyData.push({ day: label, messages: count });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        onlineUsers,
        messagesToday,
        totalGroups,
        totalFiles
      },
      weeklyActivity: weeklyData
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-passwordHash -refreshTokens').sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

export const getAllGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await Group.find()
      .populate('adminId', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, groups });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'username email')
      .populate('reportedUserId', 'username email')
      .populate('messageId', 'content sender createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reporterId = req.user?.id;
    const { reportedUserId, messageId, reason } = req.body;

    if (!reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: 'Reported User ID and reason are required.' });
    }

    const report = new Report({
      reportedBy: reporterId,
      reportedUserId,
      messageId: messageId || undefined,
      reason,
      status: 'pending'
    });

    await report.save();
    res.status(201).json({ success: true, message: 'Report submitted successfully.', report });
  } catch (error) {
    next(error);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    const { action } = req.body; // 'resolve' or 'delete_message'

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (action === 'delete_message' && report.messageId) {
      // Clear message content
      await Message.findByIdAndUpdate(report.messageId, {
        content: 'This message was removed by moderator.',
        fileUrl: undefined,
        fileName: undefined,
        iv: undefined
      });
    }

    report.status = 'resolved';
    await report.save();

    res.status(200).json({ success: true, message: 'Report status marked as resolved.' });
  } catch (error) {
    next(error);
  }
};

export const deleteUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Prevent delete main admin
    const user = await User.findById(userId);
    if (user && user.isAdmin) {
      return res.status(400).json({ success: false, message: 'Cannot delete an administrator account.' });
    }

    await User.findByIdAndDelete(userId);
    // Cleanup their messages
    await Message.deleteMany({ sender: userId });

    res.status(200).json({ success: true, message: 'User and their message records deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
