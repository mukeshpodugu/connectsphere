import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logoutSuccess } from '../store/slices/authSlice';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ProjectInfoModal from './ProjectInfoModal';
import {
  MessageSquare,
  Home,
  Settings,
  Users,
  ShieldAlert,
  User,
  Info,
  Contact,
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();
  
  const user = useAppSelector((state) => state.auth.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      dispatch(logoutSuccess());
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/chat', label: 'Chat', icon: <MessageSquare size={20} /> },
    { path: '/groups', label: 'Groups', icon: <Users size={20} /> },
    { path: '/profile', label: 'Profile', icon: <User size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
    { path: '/about', label: 'About', icon: <Info size={20} /> },
    { path: '/contact', label: 'Contact', icon: <Contact size={20} /> },
  ];

  if (user?.isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: <ShieldAlert size={20} /> });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between h-screen shrink-0 text-slate-300 select-none">
      {/* Platform Title */}
      <div>
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg text-white">
              <MessageSquare size={20} />
            </div>
            <span className="font-bold text-white tracking-tight font-display">ConnectSphere</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-slate-500 hover:text-brand-400 p-1 hover:bg-slate-800 rounded-lg transition"
            title="Project Information"
          >
            <Info size={16} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="mt-4 px-3 space-y-1.5 flex-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/15'
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Bottom Profile Details */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {/* Profile Card */}
        <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded-xl mb-3">
          <div className="relative">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-700 text-white font-bold flex items-center justify-center text-sm">
                {user?.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Actions bar (Theme, Logout) */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition"
            title="Toggle theme mode"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 p-2 text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl text-sm font-semibold transition"
            title="Logout"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Modal holding Developer info */}
      <ProjectInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Sidebar;
