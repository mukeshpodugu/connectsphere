import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Chat from '../models/Chat';
import Message from '../models/Message';
import Group from '../models/Group';
import User from '../models/User';
import UploadService from '../services/UploadService';

export const getChats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id);

    const chats = await Chat.find({
      participants: userId,
      isArchived: false
    })
      .populate('participants', 'username email avatarUrl status lastSeen bio')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username avatarUrl' }
      })
      .sort({ updatedAt: -1 });

    // Format chats and add group names if applicable
    const formattedChats = await Promise.all(chats.map(async (chat) => {
      let name = '';
      let avatarUrl = '';
      let description = '';

      if (chat.type === 'group') {
        const groupInfo = await Group.findOne({ chatId: chat._id });
        if (groupInfo) {
          name = groupInfo.name;
          avatarUrl = groupInfo.avatarUrl || '';
          description = groupInfo.description || '';
        }
      } else {
        // Direct chat: set name to the other participant's username
        const otherUser = chat.participants.find(p => p._id.toString() !== userId.toString()) as any;
        if (otherUser) {
          name = otherUser.username;
          avatarUrl = otherUser.avatarUrl || '';
        }
      }

      return {
        id: chat._id,
        type: chat.type,
        participants: chat.participants,
        lastMessage: chat.lastMessage,
        name,
        avatarUrl,
        description,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      };
    }));

    res.status(200).json({ success: true, chats: formattedChats });
  } catch (error) {
    next(error);
  }
};

export const getOrCreateDirectChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.user?.id);
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required.' });
    }

    const recipientUserId = new mongoose.Types.ObjectId(recipientId);

    // Find if chat exists
    let chat = await Chat.findOne({
      type: 'direct',
      participants: { $all: [currentUserId, recipientUserId] }
    });

    if (!chat) {
      chat = new Chat({
        type: 'direct',
        participants: [currentUserId, recipientUserId]
      });
      await chat.save();
    }

    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatarUrl status lastSeen bio');

    const otherUser = populatedChat?.participants.find(p => p._id.toString() !== currentUserId.toString()) as any;

    res.status(200).json({
      success: true,
      chat: {
        id: chat._id,
        type: 'direct',
        participants: populatedChat?.participants,
        name: otherUser ? otherUser.username : 'Chat',
        avatarUrl: otherUser ? otherUser.avatarUrl : '',
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string;

    const query: any = { chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username email avatarUrl status')
      .populate({
        path: 'parentMessage',
        select: 'content sender messageType',
        populate: { path: 'sender', select: 'username' }
      })
      .sort({ createdAt: -1 })
      .limit(limit);

    // Return in chronological order
    res.status(200).json({ success: true, messages: messages.reverse() });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const senderId = new mongoose.Types.ObjectId(req.user?.id);
    const { chatId, content, parentMessageId, iv } = req.body;

    if (!chatId) {
      return res.status(400).json({ success: false, message: 'Chat ID is required.' });
    }

    let messageType: 'text' | 'file' = 'text';
    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let fileType = '';

    if (req.file) {
      messageType = 'file';
      fileName = req.file.originalname;
      fileSize = req.file.size;
      fileType = req.file.mimetype;
      fileUrl = UploadService.getFileUrl(req.file.filename);
    } else if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const newMessage = new Message({
      chatId,
      sender: senderId,
      content: content || 'Sent an attachment',
      messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      iv,
      status: 'sent',
      readBy: [senderId],
      deliveredTo: [senderId],
      parentMessage: parentMessageId ? new mongoose.Types.ObjectId(parentMessageId) : undefined
    });

    await newMessage.save();

    // Update last message in the Chat
    await Chat.findByIdAndUpdate(chatId, { lastMessage: newMessage._id });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'username email avatarUrl status')
      .populate({
        path: 'parentMessage',
        select: 'content sender messageType',
        populate: { path: 'sender', select: 'username' }
      });

    res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    next(error);
  }
};

export const editMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;
    const { content, iv } = req.body;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit this message.' });
    }

    message.content = content;
    message.iv = iv;
    message.isEdited = true;
    await message.save();

    const populated = await Message.findById(messageId).populate('sender', 'username email avatarUrl status');

    res.status(200).json({ success: true, message: populated });
  } catch (error) {
    next(error);
  }
};

export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this message.' });
    }

    // Instead of hard deleting, we modify the content to show "Message deleted"
    message.content = 'This message was deleted.';
    message.messageType = 'text';
    message.fileUrl = undefined;
    message.fileName = undefined;
    message.fileSize = undefined;
    message.fileType = undefined;
    message.iv = undefined; // Clear encryption key reference
    await message.save();

    res.status(200).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

export const toggleStarMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user?.id);
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const isStarred = message.isStarredBy.includes(userId);
    if (isStarred) {
      message.isStarredBy = message.isStarredBy.filter(id => id.toString() !== userId.toString());
    } else {
      message.isStarredBy.push(userId);
    }

    await message.save();
    res.status(200).json({ success: true, starred: !isStarred });
  } catch (error) {
    next(error);
  }
};

export const togglePinMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.status(200).json({ success: true, pinned: message.isPinned });
  } catch (error) {
    next(error);
  }
};
