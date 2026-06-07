"use strict";
// Shared types and interfaces for ConnectSphere
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvents = void 0;
exports.SocketEvents = {
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
};
