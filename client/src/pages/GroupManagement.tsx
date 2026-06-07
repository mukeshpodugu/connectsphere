import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { setChats, addChat } from '../store/slices/chatSlice';
import api from '../services/api';
import { Users, UserCheck, Plus, Shield, Loader2, ArrowRight } from 'lucide-react';

interface UserItem {
  _id: string;
  username: string;
  avatarUrl?: string;
}

const GroupManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { chats } = useAppSelector((state) => state.chat);

  const groupChats = chats.filter((c) => c.type === 'group');

  // Creation states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<UserItem[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user candidates for selection list
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get('/users/search?query=');
        setUserOptions(res.data.users || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, []);

  const handleMemberToggle = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      // Append members array
      formData.append('memberIds', JSON.stringify(selectedMembers));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.post('/groups', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Add new group chat to Redux
      dispatch(addChat(res.data.chat));
      
      setSuccess(true);
      setName('');
      setDescription('');
      setSelectedMembers([]);
      setAvatarFile(null);

      // Refresh chats
      const chatsRes = await api.get('/chats');
      dispatch(setChats(chatsRes.data.chats || []));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create group.');
    } finally {
      setCreating(false);
    }
  };

  const handleLeaveGroup = async (chatId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await api.delete(`/groups/${chatId}/members/${currentUser.id}`);
      // Refresh chats
      const res = await api.get('/chats');
      dispatch(setChats(res.data.chats || []));
      alert('You have left the group.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave group.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold font-display mb-6 font-display">Group Channels Hub</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left panel: Create Group Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-brand-500" />
              <span>Create New Group Channel</span>
            </h3>

            {success && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
                Group created successfully! View it in the Chat list.
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Group Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Project Dev Team"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Group Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Focus topics, goals, channels details"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Group Avatar Icon</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAvatarFile(e.target.files[0]);
                    }
                  }}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-950 file:text-brand-500 hover:file:bg-slate-200 dark:hover:file:bg-slate-850"
                />
              </div>

              {/* Members candidates list */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase">Select Group Members</label>
                <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 space-y-1 bg-slate-50 dark:bg-slate-950">
                  {userOptions.map((usr) => (
                    <button
                      key={usr._id}
                      type="button"
                      onClick={() => handleMemberToggle(usr._id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition ${
                        selectedMembers.includes(usr._id)
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold border border-brand-500/25'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{usr.username}</span>
                      {selectedMembers.includes(usr._id) && <UserCheck size={14} />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition shadow-md shadow-brand-600/15"
              >
                {creating ? <Loader2 className="animate-spin" size={16} /> : 'Create Collaborative Group'}
              </button>
            </form>
          </div>

          {/* Right panel: Active Groups list */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Users size={18} className="text-brand-500" />
              <span>Your Collaborative Group Channels ({groupChats.length})</span>
            </h3>

            {groupChats.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12">
                You are not currently enrolled in any group channels. Create one or ask an administrator to add you.
              </p>
            ) : (
              <div className="space-y-3">
                {groupChats.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate block">{c.name}</span>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{c.description}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleLeaveGroup(c.id)}
                      className="px-2.5 py-1 bg-red-650/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-[10px] font-bold transition"
                    >
                      Leave
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupManagement;
