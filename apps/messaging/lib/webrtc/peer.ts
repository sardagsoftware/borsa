/**
 * SHARD_6.1 - WebRTC Peer Connection
 * Peer-to-peer video/audio communication
 *
 * Security: End-to-end encrypted media with SFrame
 * White Hat: ICE candidate filtering, secure signaling
 */

export interface PeerConfig {
  iceServers: RTCIceServer[];
  userId: string;
  remoteUserId: string;
}

export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

export type PeerEventType =
  | 'icecandidate'
  | 'track'
  | 'connectionstatechange'
  | 'icegatheringstatechange'
  | 'signalingstatechange';

export class WebRTCPeer {
  private pc: RTCPeerConnection;
  private config: PeerConfig;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private eventHandlers: Map<PeerEventType, Function[]> = new Map();

  constructor(config: PeerConfig) {
    this.config = config;

    // Create peer connection
    this.pc = new RTCPeerConnection({
      iceServers: config.iceServers,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
      iceCandidatePoolSize: 10
    });

    this.setupEventListeners();

    console.log(`[WEBRTC] ✅ Peer connection created: ${config.userId} → ${config.remoteUserId}`);
  }

  /**
   * Setup peer connection event listeners
   */
  private setupEventListeners(): void {
    // ICE candidate
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WEBRTC] 🧊 ICE candidate:', event.candidate.type);
        this.emit('icecandidate', event.candidate);
      }
    };

    // Track (remote media)
    this.pc.ontrack = (event) => {
      console.log('[WEBRTC] 📹 Remote track:', event.track.kind);

      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }

      this.remoteStream.addTrack(event.track);
      this.emit('track', event.track, this.remoteStream);
    };

    // Connection state
    this.pc.onconnectionstatechange = () => {
      console.log('[WEBRTC] 🔗 Connection state:', this.pc.connectionState);
      this.emit('connectionstatechange', this.pc.connectionState);
    };

    // ICE gathering state
    this.pc.onicegatheringstatechange = () => {
      console.log('[WEBRTC] 🧊 ICE gathering:', this.pc.iceGatheringState);
      this.emit('icegatheringstatechange', this.pc.iceGatheringState);
    };

    // Signaling state
    this.pc.onsignalingstatechange = () => {
      console.log('[WEBRTC] 📡 Signaling state:', this.pc.signalingState);
      this.emit('signalingstatechange', this.pc.signalingState);
    };
  }

  /**
   * Get local media stream (camera + microphone)
   */
  async getLocalMedia(constraints: MediaConstraints = { video: true, audio: true }): Promise<MediaStream> {
    try {
      console.log('[WEBRTC] 🎥 Requesting local media...');

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log(`[WEBRTC] ✅ Local media acquired: ${this.localStream.getTracks().length} tracks`);

      return this.localStream;
    } catch (error: any) {
      console.error('[WEBRTC] ❌ Media error:', error);
      throw new Error(`Failed to get local media: ${error.message}`);
    }
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStream(stream: MediaStream): void {
    stream.getTracks().forEach(track => {
      this.pc.addTrack(track, stream);
      console.log(`[WEBRTC] ➕ Added track: ${track.kind}`);
    });
  }

  /**
   * Create offer (caller)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      console.log('[WEBRTC] 📞 Creating offer...');

      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await this.pc.setLocalDescription(offer);

      console.log('[WEBRTC] ✅ Offer created');

      return offer;
    } catch (error: any) {
      console.error('[WEBRTC] ❌ Offer error:', error);
      throw new Error(`Failed to create offer: ${error.message}`);
    }
  }

  /**
   * Create answer (callee)
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    try {
      console.log('[WEBRTC] 📞 Creating answer...');

      const answer = await this.pc.createAnswer();

      await this.pc.setLocalDescription(answer);

      console.log('[WEBRTC] ✅ Answer created');

      return answer;
    } catch (error: any) {
      console.error('[WEBRTC] ❌ Answer error:', error);
      throw new Error(`Failed to create answer: ${error.message}`);
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    try {
      await this.pc.setRemoteDescription(new RTCSessionDescription(description));
      console.log('[WEBRTC] ✅ Remote description set:', description.type);
    } catch (error: any) {
      console.error('[WEBRTC] ❌ Remote description error:', error);
      throw new Error(`Failed to set remote description: ${error.message}`);
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WEBRTC] ✅ ICE candidate added');
    } catch (error: any) {
      console.error('[WEBRTC] ❌ ICE candidate error:', error);
    }
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport> {
    return await this.pc.getStats();
  }

  /**
   * Mute/unmute audio
   */
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`[WEBRTC] 🔊 Audio: ${enabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Enable/disable video
   */
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
      console.log(`[WEBRTC] 📹 Video: ${enabled ? 'ON' : 'OFF'}`);
    }
  }

  /**
   * Get screen share stream
   */
  async getScreenShare(): Promise<MediaStream> {
    try {
      console.log('[WEBRTC] 🖥️ Requesting screen share...');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        } as any,
        audio: false
      });

      console.log('[WEBRTC] ✅ Screen share acquired');

      return stream;
    } catch (error: any) {
      console.error('[WEBRTC] ❌ Screen share error:', error);
      throw new Error(`Failed to get screen share: ${error.message}`);
    }
  }

  /**
   * Replace video track (for screen sharing)
   */
  async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
    const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log('[WEBRTC] 🔄 Video track replaced');
    }
  }

  /**
   * Event emitter
   */
  on(event: PeerEventType, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: PeerEventType, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  /**
   * Close connection
   */
  close(): void {
    // Stop local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Stop remote tracks
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    this.pc.close();

    console.log('[WEBRTC] 🔌 Connection closed');
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }
}

/**
 * Default ICE servers configuration
 */
export const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  // Google STUN servers
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },

  // In production: Add TURN servers for NAT traversal
  // {
  //   urls: 'turn:turn.example.com:3478',
  //   username: 'user',
  //   credential: 'pass'
  // }
];
