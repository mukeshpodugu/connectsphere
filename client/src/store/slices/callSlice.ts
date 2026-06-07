import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CallState {
  callId: string | null;
  callerId: string | null;
  callerName: string | null;
  receiverId: string | null;
  callType: 'audio' | 'video' | null;
  callStatus: 'idle' | 'ringing' | 'incoming' | 'connected' | 'ended';
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  duration: number; // in seconds
}

const initialState: CallState = {
  callId: null,
  callerId: null,
  callerName: null,
  receiverId: null,
  callType: null,
  callStatus: 'idle',
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  duration: 0,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    startCall(state, action: PayloadAction<{ callId: string; receiverId: string; callType: 'audio' | 'video' }>) {
      state.callId = action.payload.callId;
      state.receiverId = action.payload.receiverId;
      state.callType = action.payload.callType;
      state.callStatus = 'ringing';
      state.duration = 0;
    },
    incomingCall(state, action: PayloadAction<{ callId: string; callerId: string; callerName: string; callType: 'audio' | 'video' }>) {
      state.callId = action.payload.callId;
      state.callerId = action.payload.callerId;
      state.callerName = action.payload.callerName;
      state.callType = action.payload.callType;
      state.callStatus = 'incoming';
      state.duration = 0;
    },
    acceptCall(state) {
      state.callStatus = 'connected';
    },
    endCallSession(state) {
      state.callId = null;
      state.callerId = null;
      state.callerName = null;
      state.receiverId = null;
      state.callType = null;
      state.callStatus = 'idle';
      state.isMuted = false;
      state.isCameraOff = false;
      state.isScreenSharing = false;
      state.duration = 0;
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    toggleCamera(state) {
      state.isCameraOff = !state.isCameraOff;
    },
    toggleScreenShare(state) {
      state.isScreenSharing = !state.isScreenSharing;
    },
    incrementDuration(state) {
      state.duration += 1;
    }
  }
});

export const {
  startCall,
  incomingCall,
  acceptCall,
  endCallSession,
  toggleMute,
  toggleCamera,
  toggleScreenShare,
  incrementDuration
} = callSlice.actions;

export default callSlice.reducer;
