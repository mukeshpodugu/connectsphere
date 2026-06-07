import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { addChat, setActiveChatId } from '../store/slices/chatSlice';
import api from '../services/api';
import { MessageSquare, Users, User, ArrowRight, Activity, Calendar, ShieldCheck, Mail } from 'lucide-react';

interface UserItem {
  _id: string;
  username: string;
  avatarUrl?: string;
  status: string;
  bio?: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const currentUser = useAppSelector((state) => state.auth.user);
  const { chats } = useAppSelector((state) => state.chat);
  
  const [onlineList, setOnlineList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        // Find users to show in quick-chat list (search fallback)
        const res = await api.get('/users/search?query=');
        setOnlineList(res.data.users || []);
      } catch (err) {
        console.error('Failed to load user list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleStartChat = async (recipientId: string) => {
    try {
      const res = await api.post('/chats/direct', { recipientId });
      dispatch(addChat(res.data.chat));
      dispatch(setActiveChatId(res.data.chat.id));
      navigate('/chat');
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
    }
  };

  const directCount = chats.filter((c) => c.type === 'direct').length;
  const groupCount = chats.filter((c) => c.type === 'group').length;

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/15 mb-8">
        <h2 className="text-2xl font-bold font-display">Hello, {currentUser?.username}!</h2>
        <p className="text-brand-100 text-sm mt-1">
          Welcome back to ConnectSphere. All channels and messaging pipelines are running securely.
        </p>
        <div className="flex items-center gap-2 mt-4 bg-slate-950/20 w-fit px-3 py-1.5 rounded-lg border border-white/10 text-xs">
          <Calendar size={14} />
          <span>Session started: {new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <MessageSquare size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Direct Chats</span>
            <span className="text-xl font-bold">{directCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Active Groups</span>
            <span className="text-xl font-bold">{groupCount}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Presence Service</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 mt-1 inline-block">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Main section splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Quick Chat list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 lg:col-span-2">
          <h3 className="text-lg font-bold mb-4">Start a Conversation</h3>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">Loading users list...</div>
          ) : onlineList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No registered users found. Try searching in the Chat tab.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {onlineList.map((usr) => (
                <div key={usr._id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {usr.avatarUrl ? (
                        <img src={usr.avatarUrl} alt="Avatar" className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center">
                          {usr.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-white dark:border-slate-900 rounded-full ${
                        usr.status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{usr.username}</p>
                      <p className="text-xs text-slate-400 line-clamp-1">{usr.bio || 'Available on ConnectSphere'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleStartChat(usr._id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-500/10 text-brand-500 dark:text-brand-400 dark:bg-brand-500/10 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 dark:hover:text-white rounded-xl text-xs font-bold transition-all duration-200"
                  >
                    <span>Chat</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Developer info card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Project Information</h3>
            <div className="space-y-3.5 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <ShieldCheck size={16} className="text-brand-500" />
                <span className="font-semibold">ConnectSphere Capstone</span>
              </div>
              <p className="leading-relaxed">
                This project represents a fully functional capstone platform developed to satisfy requirements for degree completion.
              </p>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">Developer Coordinates:</p>
                <div className="flex items-center gap-2">
                  <User size={14} className="text-slate-400" />
                  <span>Mukesh Podugu</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-slate-400" />
                  <span>mukeshpodugu123@gmail.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
