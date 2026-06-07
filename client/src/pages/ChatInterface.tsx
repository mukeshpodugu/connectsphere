import React, { useEffect, useState, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import {
  setChats,
  addChat,
  setActiveChatId,
  setMessages,
  addMessage,
  updateMessage,
  deleteMessageFromStore
} from '../store/slices/chatSlice';
import { startCall } from '../store/slices/callSlice';
import { useSocket } from '../hooks/useSocket';
import { encryptMessage, decryptMessage } from '../services/encryption';
import api from '../services/api';
import {
  Search,
  Send,
  Video,
  Phone,
  Paperclip,
  Smile,
  Trash2,
  Edit3,
  Star,
  Pin,
  Forward,
  CornerUpLeft,
  X,
  FileText,
  Download,
  AlertTriangle,
  Users,
  ChevronDown,
  MessageSquare
} from 'lucide-react';

const EMOJIS = ['😀', '😂', '😍', '👍', '🔥', '🎉', '👏', '❤️', '👀', '💡', '🚀', '💯'];

const ChatInterface: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { chats, activeChatId, messages, onlineUsers, typingUsers } = useAppSelector((state) => state.chat);

  const {
    joinChat,
    leaveChat,
    sendTypingStart,
    sendTypingStop,
    broadcastMessage,
    emitCallInitiate
  } = useSocket();

  // Component UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);

  // File Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Message Actions states
  const [replyMessage, setReplyMessage] = useState<any | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState<string | null>(null); // Message ID
  const [msgFilterQuery, setMsgFilterQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);
  const [reportingUser, setReportingUser] = useState<any | null>(null);
  const [reportReason, setReportReason] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await api.get('/chats');
        dispatch(setChats(res.data.chats || []));
      } catch (err) {
        console.error('Failed to load chats:', err);
      }
    };
    fetchChats();
  }, [dispatch]);

  // Set active chat object
  useEffect(() => {
    if (activeChatId) {
      const found = chats.find((c) => c.id === activeChatId);
      setActiveChat(found || null);
      joinChat(activeChatId);

      // Load active messages
      const fetchMessages = async () => {
        try {
          const res = await api.get(`/chats/${activeChatId}/messages`);
          dispatch(setMessages({ chatId: activeChatId, messages: res.data.messages || [] }));
        } catch (err) {
          console.error('Failed to fetch messages:', err);
        }
      };
      fetchMessages();
    }

    return () => {
      if (activeChatId) {
        leaveChat(activeChatId);
      }
    };
  }, [activeChatId, chats]);

  // Scroll messages to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatId]);

  // Handle user search in left-column
  const handleUserSearch = async (val: string) => {
    setSearchQuery(val);
    if (!val) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search?query=${val}`);
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartDirectChat = async (recipientId: string) => {
    try {
      const res = await api.post('/chats/direct', { recipientId });
      dispatch(addChat(res.data.chat));
      dispatch(setActiveChatId(res.data.chat.id));
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Typings indicator emitter
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!activeChatId || !currentUser) return;

    sendTypingStart(activeChatId, currentUser.username);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStop(activeChatId);
    }, 2000);
  };

  // SEND MESSAGE HANDLER
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatId || (!messageText.trim() && !fileToUpload)) return;

    try {
      let res;
      // If uploading a file
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('chatId', activeChatId);
        formData.append('file', fileToUpload);
        if (replyMessage) formData.append('parentMessageId', replyMessage.id);

        setUploadProgress(0);
        res = await api.post('/chats/message', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (prog) => {
            const percent = Math.round((prog.loaded * 100) / (prog.total || 1));
            setUploadProgress(percent);
          }
        });
      } else {
        // Encrypt text client-side before sending
        const { ciphertext, iv } = encryptMessage(messageText, activeChatId);

        res = await api.post('/chats/message', {
          chatId: activeChatId,
          content: ciphertext,
          iv,
          parentMessageId: replyMessage ? replyMessage.id : undefined
        });
      }

      const savedMsg = res.data.message;
      dispatch(addMessage(savedMsg));
      broadcastMessage(activeChatId, savedMsg);

      // Reset
      setMessageText('');
      setFileToUpload(null);
      setUploadProgress(null);
      setReplyMessage(null);
      sendTypingStop(activeChatId);
    } catch (err) {
      console.error('Failed to send message:', err);
      setUploadProgress(null);
    }
  };

  // WEBRTC CALL INITIATION HANDLER
  const handleDialCall = async (type: 'audio' | 'video') => {
    if (!activeChat || activeChat.type === 'group' || !currentUser) return;
    const recipient = activeChat.participants.find((p: any) => p._id !== currentUser.id);
    if (!recipient) return;

    try {
      const res = await api.post('/calls', {
        receiverId: recipient._id,
        callType: type
      });
      const call = res.data.call;

      // Update calling overlay slice
      dispatch(
        startCall({
          callId: call._id,
          receiverId: recipient._id,
          callType: type
        })
      );

      // Emit socket notification to recipient
      emitCallInitiate(recipient._id, currentUser.username, type, call._id);
    } catch (err) {
      alert('Failed to place call. Recipient might be offline.');
    }
  };

  // Edit message
  const handleEditMessage = async (msgId: string) => {
    if (!editText.trim() || !activeChatId) return;
    try {
      const { ciphertext, iv } = encryptMessage(editText, activeChatId);
      const res = await api.put(`/chats/message/${msgId}`, { content: ciphertext, iv });
      dispatch(updateMessage(res.data.message));
      setEditingMessageId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (msgId: string) => {
    if (!activeChatId) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chats/message/${msgId}`);
      dispatch(deleteMessageFromStore({ chatId: activeChatId, messageId: msgId }));
    } catch (err) {
      console.error(err);
    }
  };

  // Star message
  const handleToggleStar = async (msgId: string) => {
    try {
      await api.post(`/chats/message/${msgId}/star`);
      // Reload active messages to sync starred state
      const res = await api.get(`/chats/${activeChatId}/messages`);
      dispatch(setMessages({ chatId: activeChatId!, messages: res.data.messages || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  // Pin message
  const handleTogglePin = async (msgId: string) => {
    try {
      await api.post(`/chats/message/${msgId}/pin`);
      const res = await api.get(`/chats/${activeChatId}/messages`);
      dispatch(setMessages({ chatId: activeChatId!, messages: res.data.messages || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  // Forward message
  const handleForwardMessage = async (targetChatId: string) => {
    if (!showForwardModal || !currentUser) return;
    const activeMsgs = messages[activeChatId || ''] || [];
    const sourceMsg = activeMsgs.find((m) => m.id === showForwardModal);
    if (!sourceMsg) return;

    try {
      // Decrypt first
      const rawText = decryptMessage(sourceMsg.content, activeChatId!, sourceMsg.iv);
      // Encrypt for target
      const { ciphertext, iv } = encryptMessage(rawText, targetChatId);

      const res = await api.post('/chats/message', {
        chatId: targetChatId,
        content: ciphertext,
        iv
      });

      const saved = res.data.message;
      if (activeChatId === targetChatId) {
        dispatch(addMessage(saved));
      }
      broadcastMessage(targetChatId, saved);
      setShowForwardModal(null);
      alert('Message forwarded successfully.');
    } catch (err) {
      console.error(err);
    }
  };

  // Report user
  const handleReportUserSubmit = async () => {
    if (!reportingUser || !reportReason.trim()) return;
    try {
      await api.post('/admin/reports', {
        reportedUserId: reportingUser._id,
        reason: reportReason
      });
      alert('User reported. Moderator team will investigate.');
      setReportingUser(null);
      setReportReason('');
    } catch (err) {
      console.error(err);
    }
  };

  // Drag and Drop File Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFileToUpload(e.dataTransfer.files[0]);
    }
  };

  const activeMessages = messages[activeChatId || ''] || [];

  // Filter messages based on search query and pinned settings
  const filteredMessages = activeMessages.filter((msg) => {
    const text = decryptMessage(msg.content, msg.chatId, msg.iv).toLowerCase();
    const matchesQuery = text.includes(msgFilterQuery.toLowerCase());
    const matchesPin = showPinnedOnly ? msg.isPinned : true;
    return matchesQuery && matchesPin;
  });

  const activeTypers = typingUsers[activeChatId || ''] || [];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-slate-50 dark:bg-slate-950 selection:bg-brand-500 selection:text-white">
      
      {/* 1. LEFT COLUMN: CHATS LIST & SEARCH */}
      <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-white dark:bg-slate-900/50 shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleUserSearch(e.target.value)}
              placeholder="Search users to chat..."
              className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-sm"
            />
          </div>
        </div>

        {/* Chats or Search Results list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {searchQuery ? (
            searchResults.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">No users found</p>
            ) : (
              searchResults.map((usr) => (
                <button
                  key={usr._id}
                  onClick={() => handleStartDirectChat(usr._id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center">
                    {usr.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{usr.username}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{usr.bio || 'ConnectSphere user'}</p>
                  </div>
                </button>
              ))
            )
          ) : chats.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No active chats</p>
          ) : (
            chats.map((chat) => {
              const isSelected = chat.id === activeChatId;
              return (
                <button
                  key={chat.id}
                  onClick={() => dispatch(setActiveChatId(chat.id))}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left ${
                    isSelected
                      ? 'bg-brand-500/10 dark:bg-brand-600/15 border border-brand-500/20 text-brand-600 dark:text-brand-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="relative shrink-0">
                    {chat.avatarUrl ? (
                      <img src={chat.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                        {(chat.name || '').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {chat.type === 'direct' && (
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-white dark:border-slate-900 rounded-full ${
                        // Simple online match logic
                        chat.participants.some((p: any) => p._id !== currentUser?.id && p.status === 'online')
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`} />
                    )}
                  </div>
                  <div className="overflow-hidden flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 dark:text-slate-200 text-sm truncate">{chat.name}</span>
                    </div>
                    {chat.lastMessage && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {chat.lastMessage.messageType === 'file'
                          ? '📎 Shared a file'
                          : decryptMessage(chat.lastMessage.content, chat.id, chat.lastMessage.iv)}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. MAIN WINDOW: MESSAGES CONTAINER */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950">
        {activeChat ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 bg-white dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat.avatarUrl ? (
                  <img src={activeChat.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center">
                    {activeChat.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{activeChat.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{activeChat.description || 'Secure communication'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search messages input */}
                <div className="relative hidden md:block">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={msgFilterQuery}
                    onChange={(e) => setMsgFilterQuery(e.target.value)}
                    placeholder="Search messages..."
                    className="pl-9 pr-3 py-1.5 w-48 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-lg text-xs"
                  />
                </div>

                {/* Pin toggle filter */}
                <button
                  onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                  className={`p-2 rounded-xl transition ${
                    showPinnedOnly ? 'bg-brand-500/20 text-brand-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'
                  }`}
                  title="Filter pinned messages"
                >
                  <Pin size={18} />
                </button>

                {/* Call Buttons (Only for Direct Chats) */}
                {activeChat.type === 'direct' && (
                  <>
                    <button
                      onClick={() => handleDialCall('audio')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                      title="Start voice call"
                    >
                      <Phone size={18} />
                    </button>
                    <button
                      onClick={() => handleDialCall('video')}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                      title="Start video call"
                    >
                      <Video size={18} />
                    </button>
                    <button
                      onClick={() => {
                        const rec = activeChat.participants.find((p: any) => p._id !== currentUser?.id);
                        if (rec) setReportingUser(rec);
                      }}
                      className="p-2 hover:bg-red-500/10 dark:hover:bg-red-950/20 rounded-xl text-slate-400 hover:text-red-400 transition"
                      title="Report User"
                    >
                      <AlertTriangle size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages body with Drag & Drop */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex-1 overflow-y-auto p-6 space-y-4 relative ${
                isDragging ? 'bg-brand-500/5 border-2 border-dashed border-brand-500' : ''
              }`}
            >
              {filteredMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  {showPinnedOnly ? 'No pinned messages' : 'Send a message to begin conversation.'}
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const isOwn = (msg.sender as any).id === currentUser?.id || (msg.sender as any)._id === currentUser?.id;
                  const decrypted = decryptMessage(msg.content, msg.chatId, msg.iv);
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 max-w-xl group relative ${isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                        {((msg.sender as any).username || '').charAt(0).toUpperCase()}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {(msg.sender as any).username}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {msg.isEdited && <span className="text-[9px] text-slate-500 bg-slate-200 dark:bg-slate-800 px-1 rounded">edited</span>}
                          {msg.isPinned && <Pin size={10} className="text-brand-500 fill-brand-500" />}
                        </div>

                        <div
                          className={`rounded-2xl px-4 py-2 text-sm shadow-sm relative ${
                            isOwn
                              ? 'bg-brand-600 text-white rounded-tr-none'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {/* Parent reply view */}
                          {msg.parentMessage && (
                            <div className="mb-2 p-1.5 rounded bg-slate-950/20 border-l-2 border-brand-400 text-xs opacity-75">
                              <p className="font-semibold">{(msg.parentMessage as any).sender?.username}</p>
                              <p className="truncate">
                                {(msg.parentMessage as any).messageType === 'file'
                                  ? '📎 Attachment'
                                  : decryptMessage((msg.parentMessage as any).content, msg.chatId, (msg.parentMessage as any).iv)}
                              </p>
                            </div>
                          )}

                          {/* Inline Edit View */}
                          {editingMessageId === msg.id ? (
                            <div className="flex gap-2 min-w-[12rem]">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-2 py-1 bg-slate-950 text-white text-xs rounded border border-brand-500 focus:outline-none"
                              />
                              <button
                                onClick={() => handleEditMessage(msg.id)}
                                className="px-2 py-1 bg-brand-500 text-white text-[10px] rounded font-bold"
                              >
                                Save
                              </button>
                            </div>
                          ) : msg.messageType === 'file' ? (
                            /* File attachment bubble rendering */
                            <div className="flex items-center gap-3 p-1">
                              <FileText size={28} className="text-brand-300" />
                              <div className="overflow-hidden">
                                <p className="text-xs font-semibold truncate max-w-[12rem]">{msg.fileName}</p>
                                <p className="text-[9px] opacity-75">
                                  {msg.fileSize ? `${Math.round(msg.fileSize / 1024)} KB` : ''}
                                </p>
                              </div>
                              <a
                                href={msg.fileUrl}
                                download
                                className="p-1.5 hover:bg-slate-950/20 rounded-lg transition"
                                title="Download attachment"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          ) : (
                            /* Regular text message */
                            <p className="leading-relaxed break-words">{decrypted}</p>
                          )}
                        </div>
                      </div>

                      {/* Floating hover controls for message items */}
                      <div className={`absolute -top-3 hidden group-hover:flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1 shadow-lg z-10 ${
                        isOwn ? 'left-0' : 'right-0'
                      }`}>
                        <button
                          onClick={() => setReplyMessage(msg)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Reply"
                        >
                          <CornerUpLeft size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleStar(msg.id)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Toggle Star"
                        >
                          <Star size={12} className={msg.isStarredBy.includes(currentUser?.id as any) ? 'fill-yellow-500 text-yellow-500' : ''} />
                        </button>
                        <button
                          onClick={() => handleTogglePin(msg.id)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Toggle Pin"
                        >
                          <Pin size={12} className={msg.isPinned ? 'text-brand-400 fill-brand-400' : ''} />
                        </button>
                        <button
                          onClick={() => setShowForwardModal(msg.id)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-300"
                          title="Forward"
                        >
                          <Forward size={12} />
                        </button>
                        {isOwn && (
                          <>
                            <button
                              onClick={() => {
                                setEditingMessageId(msg.id);
                                setEditText(decrypted);
                              }}
                              className="p-1 hover:bg-slate-700 rounded text-slate-300"
                              title="Edit"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="p-1 hover:bg-red-500/20 rounded text-red-400"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
              {/* Attachment selector pill */}
              {fileToUpload && (
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950 p-2.5 rounded-xl mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Paperclip size={14} className="text-brand-500" />
                    <span>File queued: {fileToUpload.name} ({Math.round(fileToUpload.size / 1024)} KB)</span>
                  </div>
                  <button onClick={() => setFileToUpload(null)} className="text-red-400">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Reply message bar */}
              {replyMessage && (
                <div className="flex items-center justify-between bg-brand-500/5 border-l-2 border-brand-500 p-2.5 rounded mb-3 text-xs">
                  <div>
                    <span className="font-semibold block">Replying to {replyMessage.sender.username}</span>
                    <span className="opacity-75 truncate block max-w-md">
                      {replyMessage.messageType === 'file'
                        ? '📎 Shared a file'
                        : decryptMessage(replyMessage.content, replyMessage.chatId, replyMessage.iv)}
                    </span>
                  </div>
                  <button onClick={() => setReplyMessage(null)} className="text-slate-400">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Upload progress indicator */}
              {uploadProgress !== null && (
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-3 overflow-hidden">
                  <div className="bg-brand-600 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}

              {/* Input Form controls */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 relative">
                {/* Emoji Menu */}
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
                >
                  <Smile size={20} />
                </button>

                {showEmojis && (
                  <div className="absolute bottom-14 left-0 bg-slate-800 border border-slate-700 p-2 rounded-xl flex gap-1.5 shadow-2xl z-20">
                    {EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setMessageText((prev) => prev + emoji);
                          setShowEmojis(false);
                        }}
                        className="p-1 hover:bg-slate-700 rounded text-lg transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                {/* File picker */}
                <label className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition cursor-pointer">
                  <Paperclip size={20} />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFileToUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>

                {/* Text Input */}
                <input
                  type="text"
                  value={messageText}
                  onChange={handleMessageChange}
                  placeholder={fileToUpload ? 'Press Send to upload attachment...' : 'Type a message (AES Encrypted)...'}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-transparent dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 text-sm"
                />

                {/* Submit button */}
                <button
                  type="submit"
                  className="p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition shadow-md shadow-brand-600/15"
                >
                  <Send size={18} />
                </button>
              </form>

              {/* Typing users feedback banner */}
              {activeTypers.length > 0 && (
                <div className="text-[10px] text-slate-400 italic mt-1.5 ml-2.5">
                  {activeTypers.join(', ')} {activeTypers.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}
            </div>
          </>
        ) : (
          /* Placeholder welcome view */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="bg-brand-500/10 text-brand-500 p-4 rounded-full mb-4">
              <MessageSquare size={36} />
            </div>
            <h3 className="text-lg font-bold">Your Inbox</h3>
            <p className="text-slate-400 text-sm max-w-sm mt-1">
              Select an active direct conversation or collaborative group channel to start talking.
            </p>
          </div>
        )}
      </div>

      {/* 3. FORWARD MESSAGE MODAL DIALOG */}
      {showForwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-xs shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white text-sm">Forward Message</h4>
              <button onClick={() => setShowForwardModal(null)}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Select conversation to share this message details:</p>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleForwardMessage(c.id)}
                  className="w-full text-left p-2 hover:bg-slate-800 rounded-lg text-xs truncate"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. MODERATION REPORT MODAL DIALOG */}
      {reportingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 w-full max-w-sm shadow-2xl text-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-white">Report User</h4>
              <button onClick={() => setReportingUser(null)}>
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Reporting: <span className="text-white font-semibold">{reportingUser.username}</span>. Briefly state the reason for this report.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Spam, harassment, abusive messages..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand-500 mb-4 h-24"
            />
            <div className="flex justify-end gap-3 text-xs">
              <button
                onClick={() => setReportingUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReportUserSubmit}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-bold"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
