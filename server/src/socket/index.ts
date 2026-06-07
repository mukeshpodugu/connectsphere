import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketEvents } from '../shared/types';
import PresenceService from '../services/PresenceService';

const JWT_SECRET = process.env.JWT_SECRET || 'connectsphere_secret_key_123';

// Map of userId -> socketId
const userSocketMap = new Map<string, string>();
// Map of socketId -> userId
const socketUserMap = new Map<string, string>();

export const setupSocket = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token missing.'));
      }

      const decoded = jwt.verify(token as string, JWT_SECRET) as any;
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      return next(new Error('Authentication failed.'));
    }
  });

  io.on(SocketEvents.CONNECTION, async (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[Socket] User connected: ${userId} (Socket: ${socket.id})`);

    // Map user
    userSocketMap.set(userId, socket.id);
    socketUserMap.set(socket.id, userId);

    // Set online in presence service
    await PresenceService.setUserOnline(userId, socket.id, 'online');

    // Notify all other clients that this user has come online
    socket.broadcast.emit(SocketEvents.USER_PRESENCE_CHANGE, {
      userId,
      status: 'online',
      lastSeen: new Date()
    });

    // Provide user with their own confirmation
    socket.emit(SocketEvents.AUTHENTICATED, { userId });

    // JOIN CHAT ROOMS
    socket.on(SocketEvents.JOIN_CHAT, (chatId: string) => {
      socket.join(chatId);
      console.log(`[Socket] Socket ${socket.id} joined room ${chatId}`);
    });

    socket.on(SocketEvents.LEAVE_CHAT, (chatId: string) => {
      socket.leave(chatId);
      console.log(`[Socket] Socket ${socket.id} left room ${chatId}`);
    });

    // TYPING INDICATORS
    socket.on(SocketEvents.TYPING_START, (data: { chatId: string; username: string }) => {
      socket.to(data.chatId).emit(SocketEvents.TYPING_START, {
        chatId: data.chatId,
        userId,
        username: data.username
      });
    });

    socket.on(SocketEvents.TYPING_STOP, (data: { chatId: string }) => {
      socket.to(data.chatId).emit(SocketEvents.TYPING_STOP, {
        chatId: data.chatId,
        userId
      });
    });

    // SEND MESSAGE BROADCAST
    socket.on(SocketEvents.SEND_MESSAGE, (data: { chatId: string; message: any }) => {
      // Broadcast to other members in the chat room
      socket.to(data.chatId).emit(SocketEvents.RECEIVE_MESSAGE, data.message);
    });

    // WEBRTC CALL SIGNALING HANDLERS
    // 1. Initiate call
    socket.on(SocketEvents.CALL_INITIATE, (data: { receiverId: string; callerName: string; callType: 'audio' | 'video'; callId: string }) => {
      const receiverSocketId = userSocketMap.get(data.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(SocketEvents.CALL_RECEIVE, {
          callerId: userId,
          callerName: data.callerName,
          callType: data.callType,
          callId: data.callId
        });
        console.log(`[Socket] Call initiated from ${userId} to ${data.receiverId}`);
      } else {
        socket.emit('call:error', { message: 'User is currently offline.' });
      }
    });

    // 2. Answer call
    socket.on(SocketEvents.CALL_ANSWER, (data: { callerId: string; callId: string }) => {
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit(SocketEvents.CALL_ANSWER, {
          receiverId: userId,
          callId: data.callId
        });
      }
    });

    // 3. Reject call
    socket.on(SocketEvents.CALL_REJECT, (data: { callerId: string; callId: string }) => {
      const callerSocketId = userSocketMap.get(data.callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit(SocketEvents.CALL_REJECT, {
          receiverId: userId,
          callId: data.callId
        });
      }
    });

    // 4. Forward ICE candidate & SDP signals
    socket.on(SocketEvents.CALL_SIGNAL, (data: { to: string; signal: any }) => {
      const recipientSocketId = userSocketMap.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(SocketEvents.CALL_SIGNAL, {
          from: userId,
          signal: data.signal
        });
      }
    });

    // 5. End call
    socket.on(SocketEvents.CALL_END, (data: { to: string; callId: string }) => {
      const recipientSocketId = userSocketMap.get(data.to);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit(SocketEvents.CALL_END, {
          from: userId,
          callId: data.callId
        });
      }
    });

    // DISCONNECT
    socket.on(SocketEvents.DISCONNECT, async () => {
      console.log(`[Socket] Socket disconnected: ${socket.id} (User: ${userId})`);
      
      // Remove mapping
      userSocketMap.delete(userId);
      socketUserMap.delete(socket.id);

      // Set offline in presence service
      await PresenceService.setUserOffline(userId);

      // Broadcast presence change to other users
      socket.broadcast.emit(SocketEvents.USER_PRESENCE_CHANGE, {
        userId,
        status: 'offline',
        lastSeen: new Date()
      });
    });
  });
};
