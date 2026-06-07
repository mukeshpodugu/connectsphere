// Shared types and interfaces for ConnectSphere

export type UserStatus = 'online' | 'offline' | 'away' | 'busy';

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  status: UserStatus;
  lastSeen: Date;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: Date;
}

export type MessageStatus = 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'file';

export interface MessageDTO {
  id: string;
  chatId: string;
  sender: UserDTO | string; // Populated or ID
  content: string; // Encrypted in DB/Transit, decrypted in client
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status: MessageStatus;
  readBy: string[]; // User IDs
  deliveredTo: string[]; // User IDs
  isEdited: boolean;
  isPinned: boolean;
  isStarredBy: string[]; // User IDs
  parentMessage?: string; // Reply ID
  iv?: string; // Initialization vector for encryption
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatDTO {
  id: string;
  type: 'direct' | 'group';
  participants: (UserDTO | string)[];
  lastMessage?: MessageDTO;
  unreadCount?: number;
  name?: string;
  avatarUrl?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupDTO {
  id: string;
  chatId: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  adminId: string;
  members: {
    userId: string;
    role: 'admin' | 'member';
    joinedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CallDTO {
  id: string;
  callerId: string;
  receiverId: string;
  callType: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'completed' | 'missed' | 'rejected' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number; // In seconds
}

export const SocketEvents = {
  // Connection Events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',

  // Presence Events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_PRESENCE_CHANGE: 'user:presence_change',
  GET_ONLINE_USERS: 'user:get_online',

  // Messaging Events
  JOIN_CHAT: 'chat:join',
  LEAVE_CHAT: 'chat:leave',
  SEND_MESSAGE: 'message:send',
  RECEIVE_MESSAGE: 'message:receive',
  MESSAGE_DELIVERED: 'message:delivered',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'message:typing_start',
  TYPING_STOP: 'message:typing_stop',
  MESSAGE_EDITED: 'message:edited',
  MESSAGE_DELETED: 'message:deleted',

  // Call Signaling Events
  CALL_INITIATE: 'call:initiate',
  CALL_RECEIVE: 'call:receive',
  CALL_ANSWER: 'call:answer',
  CALL_REJECT: 'call:reject',
  CALL_END: 'call:end',
  CALL_SIGNAL: 'call:signal', // WebRTC Offer/Answer/ICE candidate exchange

  // Notifications
  NEW_NOTIFICATION: 'notification:new'
} as const;

export interface ReportDTO {
  id: string;
  reportedBy: string;
  reportedUserId: string;
  messageId?: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: Date;
}
