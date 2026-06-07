import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch, useAppSelector } from '../store';
import {
  addMessage,
  addUserOnline,
  setUserOffline,
  setTyping,
  setOnlineUsers
} from '../store/slices/chatSlice';
import { incomingCall } from '../store/slices/callSlice';
import { SocketEvents } from '../shared/types';

let socketInstance: Socket | null = null;
const eventListeners = new Set<(event: string, data: any) => void>();

export const getSocket = () => socketInstance;

export const useSocket = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const user = useAppSelector((state) => state.auth.user);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (!socketInstance) {
      // Connect to backend node server
      const socketUrl = import.meta.env.VITE_API_URL || '/';
      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        console.log('[Socket] Connected to server.');
      });

      // Synchronize presence list on startup
      socketInstance.on(SocketEvents.AUTHENTICATED, () => {
        socketInstance?.emit(SocketEvents.GET_ONLINE_USERS);
      });

      // Listening presence updates
      socketInstance.on(SocketEvents.USER_PRESENCE_CHANGE, (data: { userId: string; status: string }) => {
        if (data.status === 'online') {
          dispatch(addUserOnline(data.userId));
        } else {
          dispatch(setUserOffline(data.userId));
        }
      });

      // Listening message receives
      socketInstance.on(SocketEvents.RECEIVE_MESSAGE, (message: any) => {
        dispatch(addMessage(message));
        // Native Browser Push Notification
        if (Notification.permission === 'granted' && document.hidden) {
          new Notification(`New message from ${message.sender.username}`, {
            body: message.messageType === 'text' ? message.content : 'Sent an attachment',
            icon: message.sender.avatarUrl || '/favicon.ico'
          });
        }
      });

      // Typing feedback
      socketInstance.on(SocketEvents.TYPING_START, (data: { chatId: string; username: string }) => {
        dispatch(setTyping({ chatId: data.chatId, username: data.username, isTyping: true }));
      });

      socketInstance.on(SocketEvents.TYPING_STOP, (data: { chatId: string; username: string }) => {
        dispatch(setTyping({ chatId: data.chatId, username: data.username, isTyping: false }));
      });

      // Calling signals
      socketInstance.on(SocketEvents.CALL_RECEIVE, (data: { callerId: string; callerName: string; callType: 'audio' | 'video'; callId: string }) => {
        dispatch(incomingCall(data));
      });

      // Multiplex raw socket events to local observers (WebRTC hook)
      const registerForwarder = (event: string) => {
        socketInstance?.on(event, (data: any) => {
          eventListeners.forEach(listener => listener(event, data));
        });
      };

      registerForwarder(SocketEvents.CALL_ANSWER);
      registerForwarder(SocketEvents.CALL_REJECT);
      registerForwarder(SocketEvents.CALL_SIGNAL);
      registerForwarder(SocketEvents.CALL_END);
    }

    socketRef.current = socketInstance;

    return () => {
      // Don't disconnect here because multiple components use this hook.
      // Disconnection is managed in auth states.
    };
  }, [token, user, dispatch]);

  // Observer registration for WebRTC components
  const addSocketListener = (listener: (event: string, data: any) => void) => {
    eventListeners.add(listener);
  };

  const removeSocketListener = (listener: (event: string, data: any) => void) => {
    eventListeners.delete(listener);
  };

  const joinChat = (chatId: string) => {
    socketRef.current?.emit(SocketEvents.JOIN_CHAT, chatId);
  };

  const leaveChat = (chatId: string) => {
    socketRef.current?.emit(SocketEvents.LEAVE_CHAT, chatId);
  };

  const sendTypingStart = (chatId: string, username: string) => {
    socketRef.current?.emit(SocketEvents.TYPING_START, { chatId, username });
  };

  const sendTypingStop = (chatId: string) => {
    socketRef.current?.emit(SocketEvents.TYPING_STOP, { chatId });
  };

  const broadcastMessage = (chatId: string, message: any) => {
    socketRef.current?.emit(SocketEvents.SEND_MESSAGE, { chatId, message });
  };

  // WebRTC Signal emitters
  const emitCallInitiate = (receiverId: string, callerName: string, callType: 'audio' | 'video', callId: string) => {
    socketRef.current?.emit(SocketEvents.CALL_INITIATE, { receiverId, callerName, callType, callId });
  };

  const emitCallAnswer = (callerId: string, callId: string) => {
    socketRef.current?.emit(SocketEvents.CALL_ANSWER, { callerId, callId });
  };

  const emitCallReject = (callerId: string, callId: string) => {
    socketRef.current?.emit(SocketEvents.CALL_REJECT, { callerId, callId });
  };

  const emitCallSignal = (to: string, signal: any) => {
    socketRef.current?.emit(SocketEvents.CALL_SIGNAL, { to, signal });
  };

  const emitCallEnd = (to: string, callId: string) => {
    socketRef.current?.emit(SocketEvents.CALL_END, { to, callId });
  };

  return {
    socket: socketRef.current,
    joinChat,
    leaveChat,
    sendTypingStart,
    sendTypingStop,
    broadcastMessage,
    emitCallInitiate,
    emitCallAnswer,
    emitCallReject,
    emitCallSignal,
    emitCallEnd,
    addSocketListener,
    removeSocketListener
  };
};
