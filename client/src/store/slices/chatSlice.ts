import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatDTO, MessageDTO } from '../../shared/types';

interface ChatState {
  chats: ChatDTO[];
  activeChatId: string | null;
  messages: { [chatId: string]: MessageDTO[] };
  onlineUsers: string[]; // List of user IDs
  typingUsers: { [chatId: string]: string[] }; // chatId -> array of usernames typing
  isLoading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  activeChatId: null,
  messages: {},
  onlineUsers: [],
  typingUsers: {},
  isLoading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats(state, action: PayloadAction<ChatDTO[]>) {
      state.chats = action.payload;
    },
    addChat(state, action: PayloadAction<ChatDTO>) {
      const exists = state.chats.some(c => c.id === action.payload.id);
      if (!exists) {
        state.chats.unshift(action.payload);
      }
    },
    setActiveChatId(state, action: PayloadAction<string | null>) {
      state.activeChatId = action.payload;
    },
    setMessages(state, action: PayloadAction<{ chatId: string; messages: MessageDTO[] }>) {
      state.messages[action.payload.chatId] = action.payload.messages;
    },
    addMessage(state, action: PayloadAction<MessageDTO>) {
      const { chatId } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      // Check for duplicates
      const exists = state.messages[chatId].some(m => m.id === action.payload.id);
      if (!exists) {
        state.messages[chatId].push(action.payload);
      }

      // Update last message in the chat list
      const chatIdx = state.chats.findIndex(c => c.id === chatId);
      if (chatIdx !== -1) {
        state.chats[chatIdx].lastMessage = action.payload;
        // Move chat to the top of list
        const chat = state.chats.splice(chatIdx, 1)[0];
        state.chats.unshift(chat);
      }
    },
    updateMessage(state, action: PayloadAction<MessageDTO>) {
      const { chatId, id } = action.payload;
      if (state.messages[chatId]) {
        const msgIdx = state.messages[chatId].findIndex(m => m.id === id);
        if (msgIdx !== -1) {
          state.messages[chatId][msgIdx] = action.payload;
        }
      }
    },
    deleteMessageFromStore(state, action: PayloadAction<{ chatId: string; messageId: string }>) {
      const { chatId, messageId } = action.payload;
      if (state.messages[chatId]) {
        const msgIdx = state.messages[chatId].findIndex(m => m.id === messageId);
        if (msgIdx !== -1) {
          state.messages[chatId][msgIdx].content = 'This message was deleted.';
          state.messages[chatId][msgIdx].messageType = 'text';
          state.messages[chatId][msgIdx].fileUrl = undefined;
          state.messages[chatId][msgIdx].fileName = undefined;
        }
      }
    },
    setOnlineUsers(state, action: PayloadAction<string[]>) {
      state.onlineUsers = action.payload;
    },
    addUserOnline(state, action: PayloadAction<string>) {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
      // Update status in loaded chat participants
      state.chats.forEach(chat => {
        chat.participants.forEach((p: any) => {
          if (p.id === action.payload) {
            p.status = 'online';
          }
        });
      });
    },
    setUserOffline(state, action: PayloadAction<string>) {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
      // Update status in loaded chat participants
      state.chats.forEach(chat => {
        chat.participants.forEach((p: any) => {
          if (p.id === action.payload) {
            p.status = 'offline';
          }
        });
      });
    },
    setTyping(state, action: PayloadAction<{ chatId: string; username: string; isTyping: boolean }>) {
      const { chatId, username, isTyping } = action.payload;
      if (!state.typingUsers[chatId]) {
        state.typingUsers[chatId] = [];
      }

      if (isTyping) {
        if (!state.typingUsers[chatId].includes(username)) {
          state.typingUsers[chatId].push(username);
        }
      } else {
        state.typingUsers[chatId] = state.typingUsers[chatId].filter(name => name !== username);
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    }
  }
});

export const {
  setChats,
  addChat,
  setActiveChatId,
  setMessages,
  addMessage,
  updateMessage,
  deleteMessageFromStore,
  setOnlineUsers,
  addUserOnline,
  setUserOffline,
  setTyping,
  setLoading,
  setError
} = chatSlice.actions;

export default chatSlice.reducer;
