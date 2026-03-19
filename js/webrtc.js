// WebRTC Voice Chat Implementation with Socket.io Signaling

class VoiceChatManager {
    constructor() {
        this.localStream = null;
        this.peerConnections = new Map();
        this.audioElements = new Map();
        this.isMuted = false;
        this.isDeafened = false;
        this.currentChannel = null;
        this.microphoneAccessRequested = false;
        this.socket = null;
        this.socketId = null;
        
        // Server URL - Change this to your deployed server URL
        // For local testing: 'http://localhost:3000'
        // For production: 'https://your-app.railway.app' or your deployed URL
        this.serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000' 
            : 'https://discord-clone-server-production-eb78.up.railway.app';
        
        // Connect to signaling server
        this.connectSocket();
    }
    
    // Connect to Socket.io signaling server
    connectSocket() {
        try {
            // Load Socket.io client dynamically
            this.loadSocketIO().then(() => {
                this.socket = io(this.serverUrl, {
                    transports: ['websocket', 'polling'],
                    reconnection: true,
                    reconnectionAttempts: 5,
                    reconnectionDelay: 1000
                });
                
                this.socket.on('connect', () => {
                    console.log('Connected to signaling server:', this.socket.id);
                    this.socketId = this.socket.id;
                });
                
                this.socket.on('disconnect', () => {
                    console.log('Disconnected from signaling server');
                });
                
                // Handle incoming WebRTC signaling
                this.socket.on('offer', (data) => {
                    this.handleRemoteOffer(data.from, data.offer, data.username);
                });
                
                this.socket.on('answer', (data) => {
                    this.handleRemoteAnswer(data.from, data.answer);
                });
                
                this.socket.on('ice-candidate', (data) => {
                    this.handleRemoteIceCandidate(data.from, data.candidate);
                });
                
                // Handle user events
                this.socket.on('user-joined', (data) => {
                    console.log('User joined:', data.username);
                    this.onUserJoined(data.username, this.currentChannel);
                    // Create peer connection to new user
                    this.createOffer(data.socketId);
                });
                
                this.socket.on('user-left', (data) => {
                    console.log('User left:', data.username);
                    this.removeUser(data.socketId);
                    this.onUserLeft(data.username);
                });
                
                this.socket.on('channel-users', (data) => {
                    console.log('Channel users:', data.users);
                    // Connect to all existing users in channel
                    data.users.forEach(user => {
                        if (user.socketId !== this.socketId) {
                            this.onUserJoined(user.username, this.currentChannel);
                        }
                    });
                });
                
                this.socket.on('user-speaking', (data) => {
                    if (window.userPresence) {
                        userPresence.updateUserSpeaking(data.username, data.isSpeaking ? 0.1 : 0);
                    }
                });
                
            }).catch(err => {
                console.error('Failed to load Socket.io:', err);
            });
        } catch (error) {
            console.error('Error connecting to signaling server:', error);
        }
    }
    
    // Dynamically load Socket.io client
    loadSocketIO() {
        return new Promise((resolve, reject) => {
            if (window.io) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
            script.integrity = 'sha384-KA7m0DwgQGmeRx6CjC3Mx8mi4K3r6wE8f/4l+uw4V0lZ9w8a+4l0k8x8w8w8w8w8w';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    // Initialize WebRTC
    async init() {
        try {
            // Check if we already have a local stream
            if (this.localStream) {
                console.log('Already have microphone access');
                return true;
            }
            
            // Check if we've already requested permission and were denied
            if (this.microphoneAccessRequested) {
                console.log('Microphone access was previously denied or rejected');
                return false;
            }
            
            // Get user media (microphone)
            this.localStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                },
                video: false 
            });
            
            // Mark that we've successfully obtained permission
            this.microphoneAccessRequested = true;
            
            console.log('Microphone access granted');
            return true;
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.microphoneAccessRequested = true; // Mark that we tried to request permission
            this.showError('Microphone access denied. Please allow microphone permissions.');
            return false;
        }
    }
    
    // Join a voice channel
    async joinChannel(channelId) {
        // Initialize if we don't have a local stream yet, but don't fail if we've already tried
        if (!this.localStream) {
            const success = await this.init();
            // Even if init fails (user denied permission), we continue so they can still see other users
            // but won't be able to speak themselves
        }
        
        // If already in a channel, leave it first
        if (this.currentChannel) {
            this.leaveChannel();
        }
        
        this.currentChannel = channelId;
        
        // Join via Socket.io signaling server
        const userId = this.getUserId();
        if (this.socket && this.socket.connected) {
            this.socket.emit('join', {
                username: userId,
                channel: channelId
            });
        }
        
        // Notify UI
        this.onUserJoined(userId, channelId);
        
        return true;
    }
    
    // Leave current channel
    leaveChannel() {
        if (this.currentChannel) {
            const userId = this.getUserId();
            
            // Notify server
            if (this.socket && this.socket.connected) {
                this.socket.emit('leave-channel');
            }
            
            this.currentChannel = null;
            
            // Close all peer connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();
            
            // Remove audio elements
            this.audioElements.forEach(el => el.remove());
            this.audioElements.clear();
            
            // Stop local stream
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
                this.localStream = null;
            }
            
            this.onUserLeft(userId);
        }
    }
    
    // Handle signaling messages
    async handleSignalingMessage(data) {
        const { type, from, sdp, candidate } = data;
        
        if (type === 'offer') {
            await this.handleOffer(from, sdp);
        } else if (type === 'answer') {
            await this.handleAnswer(from, sdp);
        } else if (type === 'candidate') {
            await this.handleCandidate(from, candidate);
        } else if (type === 'join') {
            await this.createOffer(from);
        }
    }
    
    // Create peer connection
    createPeerConnection(socketId) {
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        });
        
        // Add local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                pc.addTrack(track, this.localStream);
            });
        }
        
        // Handle remote stream
        pc.ontrack = (event) => {
            this.handleRemoteStream(event.streams[0], socketId);
        };
        
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage(socketId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };
        
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log(`Connection state for ${socketId}:`, pc.connectionState);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.removeUser(socketId);
            }
        };
        
        this.peerConnections.set(socketId, pc);
        return pc;
    }
    
    // Create offer for new user
    async createOffer(toSocketId) {
        const pc = this.createPeerConnection(toSocketId);
        
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        
        this.sendSignalingMessage(toSocketId, {
            type: 'offer',
            offer: offer
        });
    }
    
    // Handle remote stream
    handleRemoteStream(stream, socketId) {
        // Create audio element
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        audio.autoplay = true;
        audio.volume = 0.7;
        
        // Add to DOM
        document.body.appendChild(audio);
        this.audioElements.set(socketId, audio);
        
        // Create audio context for analyzing audio levels
        this.setupAudioAnalysis(stream, socketId);
        
        // Notify UI
        this.onUserAudio(socketId, stream);
    }
    
    // Set up audio analysis for speaking detection
    setupAudioAnalysis(stream, socketId) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            
            source.connect(analyser);
            analyser.fftSize = 256;
            
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const detectSpeaking = () => {
                if (!this.audioElements.has(socketId)) {
                    // User has disconnected, stop monitoring
                    return;
                }
                
                analyser.getByteFrequencyData(dataArray);
                
                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / bufferLength / 255; // Normalize to 0-1
                
                // Update speaking status based on audio level
                if (userPresence) {
                    // Map socketId to username for display
                    const username = this.getUsernameFromSocketId(socketId);
                    if (username) {
                        userPresence.updateUserSpeaking(username, avg);
                        if (window.updateVoiceUsersDisplay) {
                            window.updateVoiceUsersDisplay();
                        }
                    }
                }
                
                // Continue monitoring
                requestAnimationFrame(detectSpeaking);
            };
            
            detectSpeaking();
        } catch (error) {
            console.warn('Could not set up audio analysis:', error);
            // Fallback: trigger onUserAudio without continuous monitoring
            if (this.onUserAudio) {
                this.onUserAudio(socketId, stream);
            }
        }
    }
    
    // Helper to map socket ID to username
    getUsernameFromSocketId(socketId) {
        // This would need to be populated from server messages
        // For now, return the socketId as username
        return socketId;
    }
    
    // Send signaling message via Socket.io
    sendSignalingMessage(to, data) {
        if (this.socket && this.socket.connected) {
            const message = {
                ...data,
                target: to,
                from: this.socketId
            };
            this.socket.emit(data.type, message);
        }
    }
    
    // Handle remote offer
    async handleRemoteOffer(fromSocketId, offer, username) {
        const pc = this.createPeerConnection(fromSocketId);
        
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        this.sendSignalingMessage(fromSocketId, {
            type: 'answer',
            answer: answer
        });
        
        // Store username for this connection
        if (username) {
            this.onUserJoined(username, this.currentChannel);
        }
    }
    
    // Handle remote answer
    async handleRemoteAnswer(fromSocketId, answer) {
        const pc = this.peerConnections.get(fromSocketId);
        if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
        }
    }
    
    // Handle remote ICE candidate
    async handleRemoteIceCandidate(fromSocketId, candidate) {
        const pc = this.peerConnections.get(fromSocketId);
        if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
    }
    
    // Toggle mute
    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !this.isMuted;
            });
        }
        
        // Notify others about speaking status
        if (this.socket && this.socket.connected) {
            this.socket.emit('speaking', { isSpeaking: !this.isMuted });
        }
        
        return this.isMuted;
    }
    
    // Toggle deafen
    toggleDeafen() {
        this.isDeafened = !this.isDeafened;
        
        this.audioElements.forEach(audio => {
            audio.muted = this.isDeafened;
        });
        
        return this.isDeafened;
    }
    
    // Get current user ID
    getUserId() {
        const user = localStorage.getItem('discord_clone_current_user');
        return user ? JSON.parse(user).username : 'anonymous';
    }
    
    // Remove user
    removeUser(userId) {
        const pc = this.peerConnections.get(userId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(userId);
        }
        
        const audio = this.audioElements.get(userId);
        if (audio) {
            audio.remove();
            this.audioElements.delete(userId);
        }
        
        this.onUserLeft(userId);
    }
    
    // Error handling
    showError(message) {
        // Check if we already have an error message displayed
        const existingError = document.querySelector('.voice-error');
        if (existingError) {
            existingError.remove();
        }
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'voice-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ed4245;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
    
    // Check if we have microphone access
    hasMicrophoneAccess() {
        return this.localStream !== null && this.microphoneAccessRequested;
    }
    
    // UI Callbacks (to be overridden)
    onUserJoined(userId, channel) {}
    onUserLeft(userId) {}
    onUserAudio(userId, stream) {}
}

// Export for use in app.js
window.VoiceChatManager = VoiceChatManager;
