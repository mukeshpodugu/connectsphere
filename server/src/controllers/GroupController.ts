import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Group from '../models/Group';
import User from '../models/User';
import UploadService from '../services/UploadService';

export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user?.id);
    const { name, description, memberIds } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Group name is required.' });
    }

    // Parse list of members (always include the admin/creator)
    let parsedMemberIds: mongoose.Types.ObjectId[] = [adminId];
    if (memberIds && Array.isArray(memberIds)) {
      memberIds.forEach((id: string) => {
        const objId = new mongoose.Types.ObjectId(id);
        if (!parsedMemberIds.some(existing => existing.equals(objId))) {
          parsedMemberIds.push(objId);
        }
      });
    }

    // 1. Create a Chat entity of type "group"
    const newChat = new Chat({
      type: 'group',
      participants: parsedMemberIds
    });
    await newChat.save();

    // 2. Map members details for Group schema
    const groupMembers = parsedMemberIds.map(userId => ({
      userId,
      role: userId.equals(adminId) ? ('admin' as const) : ('member' as const),
      joinedAt: new Date()
    }));

    // 3. File upload if avatar icon provided
    let avatarUrl = '';
    if (req.file) {
      avatarUrl = UploadService.getFileUrl(req.file.filename);
    }

    // 4. Create the Group entity
    const newGroup = new Group({
      chatId: newChat._id,
      name,
      description: description || '',
      avatarUrl,
      adminId,
      members: groupMembers
    });
    await newGroup.save();

    res.status(201).json({
      success: true,
      chat: {
        id: newChat._id,
        type: 'group',
        name: newGroup.name,
        description: newGroup.description,
        avatarUrl: newGroup.avatarUrl,
        adminId: newGroup.adminId,
        participants: parsedMemberIds
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user?.id;
    const { chatId } = req.params;
    const { memberIds } = req.body; // Array of IDs

    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Members to add are required.' });
    }

    const group = await Group.findOne({ chatId });
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Check if requester is an admin in the group
    const isAdmin = group.members.some(
      m => m.userId.toString() === requesterId && m.role === 'admin'
    );
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: 'Only group admins can add members.' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found.' });

    // Filter out existing members
    const newObjectIds: mongoose.Types.ObjectId[] = [];
    memberIds.forEach((id: string) => {
      const objId = new mongoose.Types.ObjectId(id);
      const exists = group.members.some(m => m.userId.equals(objId));
      if (!exists) {
        newObjectIds.push(objId);
      }
    });

    if (newObjectIds.length === 0) {
      return res.status(400).json({ success: false, message: 'All users are already members of this group.' });
    }

    // Add to chat participants
    chat.participants.push(...newObjectIds);
    await chat.save();

    // Add to group member arrays
    newObjectIds.forEach(userId => {
      group.members.push({
        userId,
        role: 'member',
        joinedAt: new Date()
      });
    });
    await group.save();

    res.status(200).json({ success: true, message: 'Members added successfully.' });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user?.id;
    const { chatId, userId } = req.params;

    const group = await Group.findOne({ chatId });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    // Validate that either the requester is admin, OR requester is removing themselves
    const isSelfRemove = requesterId === userId;
    const isAdmin = group.members.some(
      m => m.userId.toString() === requesterId && m.role === 'admin'
    );

    if (!isAdmin && !isSelfRemove) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Only admins can remove members.' });
    }

    // Prevent removing admin if they are the only admin left
    const targetMember = group.members.find(m => m.userId.toString() === userId);
    if (targetMember?.role === 'admin' && !isSelfRemove) {
      const adminCount = group.members.filter(m => m.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot remove the last remaining admin. Please transfer ownership first.' });
      }
    }

    // Remove from Chat participants list
    await Chat.findByIdAndUpdate(chatId, {
      $pull: { participants: new mongoose.Types.ObjectId(userId) }
    });

    // Remove from Group members list
    group.members = group.members.filter(m => m.userId.toString() !== userId);
    
    // If admin is leaving, re-assign admin role to the next oldest member
    if (isSelfRemove && targetMember?.role === 'admin' && group.members.length > 0) {
      group.members[0].role = 'admin';
      group.adminId = group.members[0].userId;
    }

    await group.save();

    res.status(200).json({ success: true, message: 'Member removed from group.' });
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user?.id;
    const { chatId } = req.params;
    const { name, description } = req.body;

    const group = await Group.findOne({ chatId });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const isMember = group.members.some(m => m.userId.toString() === requesterId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Only members can update group details.' });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;

    if (req.file) {
      group.avatarUrl = UploadService.getFileUrl(req.file.filename);
    }

    await group.save();

    res.status(200).json({
      success: true,
      message: 'Group settings updated.',
      group: {
        chatId: group.chatId,
        name: group.name,
        description: group.description,
        avatarUrl: group.avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
};
