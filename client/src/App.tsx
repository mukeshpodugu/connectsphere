import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './store';
import { loginSuccess, loginFailure, setLoading } from './store/slices/authSlice';
import api from './services/api';
import { useSocket } from './hooks/useSocket';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChatInterface from './pages/ChatInterface';
import GroupManagement from './pages/GroupManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';

// Components
import Sidebar from './components/Sidebar';
import CallingOverlay from './components/CallingOverlay';

// Loading Screen
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({
  children,
  requireAdmin = false
}) => {
  const { isAuthenticated, isLoading, user } = useAppSelector((state) => state.auth);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-brand-500" size={40} />
          <p className="text-slate-400 text-sm">Authenticating session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Initialize socket listeners on auth change
  useSocket();

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        dispatch(setLoading(false));
        return;
      }

      try {
        const res = await api.get('/users/profile');
        dispatch(loginSuccess({ user: res.data.user, token }));
      } catch (err) {
        console.warn('[Session] Auto login session restore failed.');
        dispatch(loginFailure(''));
      }
    };

    fetchUser();
  }, [token, dispatch]);

  // Request browser notification permissions on startup
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex h-screen bg-slate-50 dark:bg-dark-400 overflow-hidden font-sans text-slate-800 dark:text-slate-200">
                {/* Global Sidebar */}
                <Sidebar />

                {/* Main page content container */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/chat" element={<ChatInterface />} />
                    <Route path="/groups" element={<GroupManagement />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedRoute requireAdmin>
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </div>

                {/* Call panel overlays */}
                <CallingOverlay />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
