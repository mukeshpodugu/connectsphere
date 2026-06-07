import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('connectsphere-token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem('connectsphere-token', action.payload.token);
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      localStorage.removeItem('connectsphere-token');
    },
    updateUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('connectsphere-token', action.payload);
    },
    logoutSuccess(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem('connectsphere-token');
    },
    clearError(state) {
      state.error = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    }
  }
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  updateUser,
  setToken,
  logoutSuccess,
  clearError,
  setLoading
} = authSlice.actions;

export default authSlice.reducer;
