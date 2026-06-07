import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { useSocket } from './useSocket';
import { endCallSession, acceptCall } from '../store/slices/callSlice';
import { SocketEvents } from '../shared/types';

const CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export const useWebRTC = (
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) => {
  const dispatch = useAppDispatch();
  const { addSocketListener, removeSocketListener, emitCallSignal, emitCallEnd } = useSocket();

  const { callId, callType, callStatus, isMuted, isCameraOff, isScreenSharing, callerId, receiverId } = useAppSelector(
    (state) => state.call
  );
  
  const targetPeerId = callerId || receiverId; // Whoever we are talking to

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // 1. Manage local media streams based on call status
  useEffect(() => {
    const initLocalMedia = async () => {
      try {
        console.log(`[WebRTC] Initializing local media. Type: ${callType}`);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('[WebRTC] Error gaining user media access:', err);
      }
    };

    if (callStatus === 'ringing' || callStatus === 'connected') {
      initLocalMedia();
    }

    return () => {
      // Cleanup streams when calling state drops to idle
      if (callStatus === 'idle') {
        stopAllTracks();
      }
    };
  }, [callStatus, callType]);

  // 2. Setup RTCPeerConnection when call is accepted/connected
  useEffect(() => {
    if (callStatus !== 'connected' || !targetPeerId) return;

    const createPeerConnection = () => {
      console.log('[WebRTC] Creating Peer Connection.');
      const pc = new RTCPeerConnection(CONFIG);
      peerConnectionRef.current = pc;

      // Send local tracks to remote peer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Capture remote stream
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track.');
        const rStream = event.streams[0];
        setRemoteStream(rStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = rStream;
        }
      };

      // Send ICE candidates to signaling peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          emitCallSignal(targetPeerId, { candidate: event.candidate });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTC] Connection state: ${pc.connectionState}`);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          handleEndCall();
        }
      };

      return pc;
    };

    const pc = createPeerConnection();

    // If we are the caller (we started the call, call status transitioned to connected), create offer
    const initiateHandshake = async () => {
      // Caller has receiverId, no callerId
      if (receiverId) {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          emitCallSignal(targetPeerId, { sdp: offer });
          console.log('[WebRTC] Offer sent.');
        } catch (err) {
          console.error('[WebRTC] Error creating description offer:', err);
        }
      }
    };

    initiateHandshake();

    // Listen to signaling responses from WebSocket
    const signalingHandler = async (event: string, data: any) => {
      if (event === SocketEvents.CALL_SIGNAL && peerConnectionRef.current) {
        const pcInstance = peerConnectionRef.current;
        if (data.signal.sdp) {
          const sdpObj = new RTCSessionDescription(data.signal.sdp);
          await pcInstance.setRemoteDescription(sdpObj);

          // If we received an offer, we must answer it
          if (sdpObj.type === 'offer') {
            const answer = await pcInstance.createAnswer();
            await pcInstance.setLocalDescription(answer);
            emitCallSignal(targetPeerId, { sdp: answer });
            console.log('[WebRTC] Answer sent.');
          }
        } else if (data.signal.candidate) {
          try {
            await pcInstance.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
          } catch (err) {
            console.warn('[WebRTC] Failed to add candidate:', err);
          }
        }
      } else if (event === SocketEvents.CALL_END) {
        handleEndCall(false); // don't emit end, just cleanup locally
      }
    };

    addSocketListener(signalingHandler);

    return () => {
      removeSocketListener(signalingHandler);
      closePeerConnection();
    };
  }, [callStatus, targetPeerId]);

  // 3. Track mute controls
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // 4. Track camera toggle controls
  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isCameraOff;
      });
    }
  }, [isCameraOff, localStream]);

  // 5. Handle screen sharing
  useEffect(() => {
    const handleScreenShare = async () => {
      if (!peerConnectionRef.current || !localStream) return;
      const pc = peerConnectionRef.current;

      if (isScreenSharing) {
        try {
          console.log('[WebRTC] Requesting screen capture.');
          const screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: true
          });
          screenStreamRef.current = screenStream;

          // Replace video track in peer connection
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');

          if (sender) {
            sender.replaceTrack(videoTrack);
          }

          // Show screen stream in local video ref
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }

          // Handle screen share stopped by browser bar
          videoTrack.onended = () => {
            stopScreenSharingLocally();
          };
        } catch (err) {
          console.error('[WebRTC] Screen sharing access denied:', err);
        }
      } else {
        stopScreenSharingLocally();
      }
    };

    handleScreenShare();
  }, [isScreenSharing]);

  const stopScreenSharingLocally = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }

    // Restore camera stream video track in Peer connection
    if (peerConnectionRef.current && localStreamRef.current) {
      const pc = peerConnectionRef.current;
      const cameraTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
      if (sender && cameraTrack) {
        sender.replaceTrack(cameraTrack);
      }
    }

    // Restore local video source
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  };

  const stopAllTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
  };

  const closePeerConnection = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleEndCall = (shouldEmit = true) => {
    console.log('[WebRTC] Ending Call Session.');
    if (shouldEmit && targetPeerId && callId) {
      emitCallEnd(targetPeerId, callId);
    }
    stopAllTracks();
    closePeerConnection();
    dispatch(endCallSession());
  };

  return {
    localStream,
    remoteStream,
    handleEndCall
  };
};
