import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import { acceptCall, endCallSession, toggleMute, toggleCamera, toggleScreenShare, incrementDuration } from '../store/slices/callSlice';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ScreenShare, Maximize2, Minimize2, Volume2 } from 'lucide-react';

const CallingOverlay: React.FC = () => {
  const dispatch = useAppDispatch();
  const { emitCallAnswer, emitCallReject } = useSocket();

  const {
    callId,
    callerId,
    callerName,
    receiverId,
    callType,
    callStatus,
    isMuted,
    isCameraOff,
    isScreenSharing,
    duration
  } = useAppSelector((state) => state.call);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Hook WebRTC signaling and stream outputs
  const { handleEndCall } = useWebRTC(localVideoRef, remoteVideoRef);

  // Timer increment for call duration
  useEffect(() => {
    let timer: any = null;
    if (callStatus === 'connected') {
      timer = setInterval(() => {
        dispatch(incrementDuration());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callStatus, dispatch]);

  if (callStatus === 'idle') return null;

  const handleAccept = () => {
    if (callerId && callId) {
      emitCallAnswer(callerId, callId);
      dispatch(acceptCall());
    }
  };

  const handleDecline = () => {
    if (callerId && callId) {
      emitCallReject(callerId, callId);
      dispatch(endCallSession());
    }
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      overlayRef.current?.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white selection:bg-transparent"
    >
      {/* 1. OUTGOING RINGING SCREEN */}
      {callStatus === 'ringing' && (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center text-3xl font-bold border-4 border-slate-800 animate-ring-pulse">
              R
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">Calling...</h3>
            <p className="text-slate-400 text-sm mt-1">Waiting for reply</p>
          </div>
          <button
            onClick={() => handleEndCall()}
            className="p-4 bg-red-600 hover:bg-red-500 rounded-full transition shadow-lg shadow-red-600/20"
            title="Cancel Call"
          >
            <PhoneOff size={24} />
          </button>
        </div>
      )}

      {/* 2. INCOMING CALL SCREEN */}
      {callStatus === 'incoming' && (
        <div className="flex flex-col items-center justify-center space-y-6">
          <div className="w-24 h-24 rounded-full bg-brand-600 flex items-center justify-center text-3xl font-bold border-4 border-slate-800 animate-ring-pulse">
            {callerName?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold">{callerName || 'Incoming Connection'}</h3>
            <p className="text-slate-400 text-sm mt-1">
              Incoming {callType === 'video' ? 'Video Call' : 'Voice Call'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleAccept}
              className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-full transition shadow-lg shadow-emerald-600/20 animate-bounce"
              title="Answer"
            >
              <Phone size={24} />
            </button>
            <button
              onClick={handleDecline}
              className="p-4 bg-red-600 hover:bg-red-500 rounded-full transition shadow-lg shadow-red-600/20"
              title="Decline"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      )}

      {/* 3. CONNECTED CALL PANEL */}
      {callStatus === 'connected' && (
        <div className="relative w-full h-full flex flex-col justify-between p-6">
          {/* Top Panel (Details & Fullscreen toggle) */}
          <div className="flex items-center justify-between z-10 bg-gradient-to-b from-slate-950/60 to-transparent p-4 absolute top-0 left-0 right-0">
            <div>
              <span className="font-semibold text-sm">
                Active {callType === 'video' ? 'Video' : 'Voice'} Call
              </span>
              <span className="ml-3 px-2 py-0.5 bg-brand-500/20 border border-brand-500/30 text-brand-400 text-xs rounded font-mono">
                {formatDuration(duration)}
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-slate-800/80 rounded-xl transition text-slate-400 hover:text-white"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>

          {/* Media Stream Video Outputs */}
          <div className="flex-1 flex items-center justify-center relative bg-slate-900 rounded-2xl overflow-hidden mt-16 mb-24 border border-slate-800">
            {callType === 'video' ? (
              <>
                {/* Remote Video Stream (Main body) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Local Video Stream (Miniature overlay) */}
                <div className="absolute bottom-4 right-4 w-40 h-28 rounded-xl border border-slate-700 bg-slate-950 overflow-hidden shadow-2xl">
                  {isCameraOff ? (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                      Camera Off
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </>
            ) : (
              /* Voice Call Visualization (No Video elements) */
              <div className="flex flex-col items-center justify-center space-y-6">
                <Volume2 size={48} className="text-brand-400 animate-pulse-slow" />
                <p className="text-sm text-slate-400">Audio stream connected. Microphone active.</p>
                <div className="flex items-center gap-1.5 justify-center">
                  <span className="w-1.5 h-6 bg-brand-500 rounded-full animate-pulse" />
                  <span className="w-1.5 h-10 bg-brand-500 rounded-full animate-pulse [animation-delay:0.2s]" />
                  <span className="w-1.5 h-8 bg-brand-500 rounded-full animate-pulse [animation-delay:0.4s]" />
                  <span className="w-1.5 h-4 bg-brand-500 rounded-full animate-pulse [animation-delay:0.1s]" />
                </div>
              </div>
            )}
          </div>

          {/* Control Bar (Mute, Camera, Share, End call) */}
          <div className="flex items-center justify-center gap-4 z-10 bg-gradient-to-t from-slate-950/80 to-transparent p-6 absolute bottom-0 left-0 right-0">
            <button
              onClick={() => dispatch(toggleMute())}
              className={`p-3.5 rounded-full transition shadow-lg ${
                isMuted
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {callType === 'video' && (
              <>
                <button
                  onClick={() => dispatch(toggleCamera())}
                  className={`p-3.5 rounded-full transition shadow-lg ${
                    isCameraOff
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                >
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>

                <button
                  onClick={() => dispatch(toggleScreenShare())}
                  className={`p-3.5 rounded-full transition shadow-lg ${
                    isScreenSharing
                      ? 'bg-brand-600 hover:bg-brand-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                >
                  <ScreenShare size={20} />
                </button>
              </>
            )}

            <button
              onClick={() => handleEndCall()}
              className="p-3.5 bg-red-600 hover:bg-red-500 text-white rounded-full transition shadow-lg shadow-red-600/20"
              title="Hang Up"
            >
              <PhoneOff size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallingOverlay;
