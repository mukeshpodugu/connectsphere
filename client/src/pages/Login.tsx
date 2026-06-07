import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginSuccess, loginFailure, clearError } from '../store/slices/authSlice';
import api from '../services/api';
import { MessageSquare, Lock, Mail, ArrowLeft, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, isAuthenticated } = useAppSelector((state) => state.auth);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Forgot/Reset Password states
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    dispatch(loginStart());
    try {
      const res = await api.post('/auth/login', { email, password });
      dispatch(loginSuccess({ user: res.data.user, token: res.data.accessToken }));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.message || 'Login failed. Please verify credentials.'));
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setInfoMessage(null);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setInfoMessage(`Reset instructions sent: ${res.data.message}`);
      // Auto fill token for easy local testing in dev mode
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
        setView('reset');
      }
    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.message || 'Failed to send reset link.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !newPassword) return;

    setSubmitting(true);
    setInfoMessage(null);
    try {
      await api.post('/auth/reset-password', { token: resetToken, password: newPassword });
      setInfoMessage('Password reset successful. Please sign in with your new password.');
      setView('login');
      setPassword('');
    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.message || 'Reset password failed. Token may be expired.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-brand-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center items-center gap-2 mb-6">
          <div className="bg-brand-600 p-2 rounded-xl text-white">
            <MessageSquare size={28} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-display">ConnectSphere</span>
        </Link>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-950/40 border border-red-500/30 text-red-200 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-sm px-4 py-3 rounded-lg">
              {infoMessage}
            </div>
          )}

          {/* VIEW: LOGIN FORM */}
          {view === 'login' && (
            <form className="space-y-6" onSubmit={handleLoginSubmit}>
              <h2 className="text-xl font-bold text-white mb-4">Welcome back</h2>
              
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      dispatch(clearError());
                    }}
                    className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Sign In'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD FORM */}
          {view === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgotSubmit}>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-xl font-bold text-white">Reset Password</h2>
              </div>

              <p className="text-slate-400 text-xs leading-relaxed">
                Enter your email address and we will print the password reset verification token to the server console log for quick debugging.
              </p>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail size={18} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: RESET PASSWORD FORM */}
          {view === 'reset' && (
            <form className="space-y-6" onSubmit={handleResetSubmit}>
              <h2 className="text-xl font-bold text-white mb-2">Create New Password</h2>
              <p className="text-slate-400 text-xs">Enter your reset code and set a new password.</p>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Verification Code</label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-mono"
                  placeholder="Paste reset token here"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                  placeholder="New password"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
                >
                  {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Reset Password'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Don't have an account?</span>
            <Link to="/register" className="font-semibold text-brand-400 hover:text-brand-300 transition">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
