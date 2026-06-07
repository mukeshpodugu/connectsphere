import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { MessageSquare, Mail, User, Lock, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();

  // Inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // States
  const [view, setView] = useState<'register' | 'verify'>('register');
  const [verificationToken, setVerificationToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', { username, email, password });
      setInfoMessage(res.data.message);
      // Auto-fill token in development for user convenience
      if (res.data.verificationToken) {
        setVerificationToken(res.data.verificationToken);
      }
      setView('verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationToken) return;

    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/verify-email', { token: verificationToken });
      setInfoMessage('Account verified successfully! You can now log in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. Invalid token.');
    } finally {
      setIsLoading(false);
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

          {/* VIEW: REGISTER */}
          {view === 'register' && (
            <form className="space-y-6" onSubmit={handleRegisterSubmit}>
              <h2 className="text-xl font-bold text-white mb-4">Create Account</h2>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
                    placeholder="Choose username"
                  />
                </div>
              </div>

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
                    placeholder="Enter email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
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
                    placeholder="Password (min. 6 chars)"
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Register'}
                </button>
              </div>
            </form>
          )}

          {/* VIEW: VERIFY EMAIL */}
          {view === 'verify' && (
            <form className="space-y-6" onSubmit={handleVerifySubmit}>
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
                >
                  <ArrowLeft size={16} />
                </button>
                <h2 className="text-xl font-bold text-white">Email Verification</h2>
              </div>

              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                <ShieldCheck className="text-brand-400 shrink-0 mt-0.5" size={20} />
                <p className="text-xs text-slate-300 leading-relaxed">
                  We've simulated sending a verification email. To finalize, check the server console log, extract the token key, and input it below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Verification Code</label>
                <input
                  type="text"
                  required
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm font-mono text-center tracking-wider"
                  placeholder="Paste verification token"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Verify Account'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400">Already registered?</span>
            <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300 transition">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
