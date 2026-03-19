// Audio Effects for Discord Clone
class AudioEffects {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.5; // Default 50% volume
        
        // Initialize audio context on first user interaction
        document.addEventListener('click', () => {
            this.initAudioContext();
        }, { once: true });
    }
    
    // Initialize audio context on first user interaction (required by browsers)
    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    // Play a sound effect from file
    playSoundEffect(soundFile) {
        try {
            // Only play if audio context is initialized
            if (!this.audioContext) {
                console.log('Audio context not initialized yet');
                return;
            }
            
            // Create audio element to play the sound
            const audio = new Audio(`/sounds/${soundFile}`);
            audio.volume = this.masterVolume;
            audio.play().catch(e => {
                console.log('Audio play failed:', e);
            });
        } catch (error) {
            console.error('Error playing sound effect:', error);
        }
    }
    
    // Generate a simple tone for basic sound effects (fallback if no audio files)
    playTone(frequency, duration, type = 'sine') {
        if (!this.audioContext) {
            return;
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.value = frequency;
            
            gainNode.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.error('Error playing tone:', error);
        }
    }
    
    // Play voice channel join sound (similar to Discord)
    playVoiceJoinSound() {
        // Try to play the actual sound file first
        this.playSoundEffect('voice_join.mp3');
        
        // Fallback: Generate a pleasant tone sequence
        setTimeout(() => this.playTone(523.25, 0.15, 'sine'), 0); // C5
        setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 150); // E5
        setTimeout(() => this.playTone(783.99, 0.2, 'sine'), 300); // G5
    }
    
    // Play voice channel leave sound
    playVoiceLeaveSound() {
        // Try to play the actual sound file first
        this.playSoundEffect('voice_leave.mp3');
        
        // Fallback: Generate a tone sequence
        setTimeout(() => this.playTone(783.99, 0.15, 'sine'), 0); // G5
        setTimeout(() => this.playTone(659.25, 0.15, 'sine'), 150); // E5
        setTimeout(() => this.playTone(523.25, 0.2, 'sine'), 300); // C5
    }
    
    // Play notification sound
    playNotificationSound() {
        this.playSoundEffect('notification.mp3');
        
        // Fallback
        this.playTone(880.00, 0.1, 'sine'); // A5
    }
    
    // Set master volume (0.0 to 1.0)
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }
}

// Global instance
const audioEffects = new AudioEffects();

// Export for use in other modules
window.audioEffects = audioEffects;