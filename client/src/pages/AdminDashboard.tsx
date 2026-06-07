import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Users, MessageSquare, AlertTriangle, File, UserMinus, ShieldAlert, Loader2, Check } from 'lucide-react';

interface Stats {
  totalUsers: number;
  onlineUsers: number;
  messagesToday: number;
  totalGroups: number;
  totalFiles: number;
}

interface ReportItem {
  _id: string;
  reportedBy: { username: string; email: string };
  reportedUserId: { username: string; email: string };
  messageId?: { content: string; createdAt: string };
  reason: string;
  status: 'pending' | 'resolved';
}

interface UserItem {
  _id: string;
  username: string;
  email: string;
  status: string;
  isAdmin: boolean;
  createdAt: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const statsRes = await api.get('/admin/stats');
      setStats(statsRes.data.stats);
      setChartData(statsRes.data.weeklyActivity || []);

      const reportsRes = await api.get('/admin/reports');
      setReports(reportsRes.data.reports || []);

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (reportId: string, action: 'resolve' | 'delete_message') => {
    setActioningId(reportId);
    try {
      await api.put(`/admin/reports/${reportId}`, { action });
      alert(action === 'delete_message' ? 'Message deleted and report resolved.' : 'Report marked as resolved.');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActioningId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete this user account and all their message history?')) return;
    setActioningId(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      alert('User deleted.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-500" size={36} />
          <p className="text-xs">Fetching moderation records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Title */}
        <div className="flex items-center gap-2 text-red-500">
          <ShieldAlert size={28} />
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Admin Controls Panel</h2>
        </div>

        {/* Aggregate Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-brand-500 mb-2">
                <Users size={18} />
                <span className="text-xs font-semibold uppercase">Total Users</span>
              </div>
              <span className="text-xl font-bold">{stats.totalUsers}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Users size={18} />
                <span className="text-xs font-semibold uppercase">Online</span>
              </div>
              <span className="text-xl font-bold">{stats.onlineUsers}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <MessageSquare size={18} />
                <span className="text-xs font-semibold uppercase">Today's Msg</span>
              </div>
              <span className="text-xl font-bold">{stats.messagesToday}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <Users size={18} />
                <span className="text-xs font-semibold uppercase">Groups</span>
              </div>
              <span className="text-xl font-bold">{stats.totalGroups}</span>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-cyan-500 mb-2">
                <File size={18} />
                <span className="text-xs font-semibold uppercase">Files Shared</span>
              </div>
              <span className="text-xl font-bold">{stats.totalFiles}</span>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Weekly Message Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="messages" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Moderator reports */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Reported Content Moderation</h3>
          {reports.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">No pending complaints reported</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {reports.map((rep) => (
                <div key={rep._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-400">Reporter:</span>
                      <span className="text-slate-900 dark:text-white font-bold">{rep.reportedBy?.username || 'System'}</span>
                      <span className="text-slate-500">|</span>
                      <span className="font-semibold text-slate-400">Target:</span>
                      <span className="text-red-400 font-bold">{rep.reportedUserId?.username}</span>
                      {rep.status === 'resolved' && (
                        <span className="ml-2 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] rounded font-bold">
                          Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      Reason: <span className="text-slate-200 italic">"{rep.reason}"</span>
                    </p>
                    {rep.messageId && (
                      <div className="p-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-xs max-w-lg mt-1 font-mono">
                        "{rep.messageId.content}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {rep.status === 'pending' && (
                    <div className="flex items-center gap-2 text-xs self-end sm:self-center">
                      <button
                        onClick={() => handleResolveReport(rep._id, 'resolve')}
                        disabled={actioningId !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-semibold"
                      >
                        <Check size={12} />
                        <span>Dismiss</span>
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep._id, 'delete_message')}
                        disabled={actioningId !== null}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg font-bold"
                      >
                        <AlertTriangle size={12} />
                        <span>Delete Message</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* User directories */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">User Administration Directory</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {users.map((usr) => (
              <div key={usr._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm flex items-center gap-1.5">
                    <span>{usr.username}</span>
                    {usr.isAdmin && (
                      <span className="px-1 bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[9px] rounded font-bold">
                        Admin
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{usr.email}</p>
                </div>
                {!usr.isAdmin && (
                  <button
                    onClick={() => handleDeleteUser(usr._id)}
                    disabled={actioningId !== null}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-650/10 text-red-500 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold"
                  >
                    <UserMinus size={12} />
                    <span>Delete Account</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
