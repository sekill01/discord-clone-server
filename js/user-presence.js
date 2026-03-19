// User Presence and Online Status System

class UserPresence {
    constructor() {
        this.users = new Map();
        this.currentChannel = null;
        this.currentUserId = null;
        this.speakingThreshold = 0.02; // Audio level threshold for "speaking"
        this.speakingUsers = new Set();
    }
    
    // Initialize user presence system
    init() {
        const user = this.getCurrentUser();
        if (user) {
            this.currentUserId = user.username;
            this.setUserOnline(user.username);
        }
    }
    
    // Get current logged in user
    getCurrentUser() {
        const user = localStorage.getItem('discord_clone_current_user');
        return user ? JSON.parse(user) : null;
    }
    
    // Set user as online
    setUserOnline(username) {
        const user = {
            username: username,
            status: 'online',
            lastActive: Date.now(),
            avatar: `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`,
            inChannel: null,
            isSpeaking: false,
            audioLevel: 0
        };
        
        this.users.set(username, user);
        this.updateUserList();
        return user;
    }
    
    // Set user as offline
    setUserOffline(username) {
        const user = this.users.get(username);
        if (user) {
            user.status = 'offline';
            user.inChannel = null;
            user.isSpeaking = false;
            this.updateUserList();
        }
    }
    
    // User joins a voice channel
    userJoinChannel(username, channelName) {
        const user = this.users.get(username) || this.setUserOnline(username);
        user.inChannel = channelName;
        user.lastActive = Date.now();
        this.currentChannel = channelName;
        this.updateUserList();
        console.log(`${username} joined ${channelName}`);
        
        // Play sound if it's not the current user joining (for other users joining)
        if (username !== this.currentUserId && window.audioEffects) {
            audioEffects.playVoiceJoinSound();
        }
    }
    
    // User leaves voice channel
    userLeaveChannel(username) {
        const user = this.users.get(username);
        if (user) {
            user.inChannel = null;
            user.isSpeaking = false;
            this.updateUserList();
            console.log(`${username} left channel`);
            
            // Play sound if it's not the current user leaving (for other users leaving)
            if (username !== this.currentUserId && window.audioEffects) {
                audioEffects.playVoiceLeaveSound();
            }
        }
    }
    
    // Update user's speaking status based on audio level
    updateUserSpeaking(username, audioLevel) {
        const user = this.users.get(username);
        if (!user) return;
        
        const isSpeaking = audioLevel > this.speakingThreshold;
        
        if (isSpeaking && !user.isSpeaking) {
            user.isSpeaking = true;
            user.lastActive = Date.now();
            this.speakingUsers.add(username);
            this.updateUserList();
        } else if (!isSpeaking && user.isSpeaking) {
            user.isSpeaking = false;
            this.speakingUsers.delete(username);
            this.updateUserList();
        }
        
        user.audioLevel = audioLevel;
    }
    
    // Get users in current channel
    getUsersInChannel(channelName) {
        return Array.from(this.users.values()).filter(user => 
            user.inChannel === channelName && user.status === 'online'
        );
    }
    
    // Get all online users
    getOnlineUsers() {
        return Array.from(this.users.values()).filter(user => 
            user.status === 'online'
        );
    }
    
    // Simulate other users for demo
    simulateUsers(channelId) {
        const currentUser = this.getCurrentUser();
        const usernames = ['AlexGamer', 'SarahPlays', 'ProPlayer99', 'MemeKing', 'DevMaster'];
        
        usernames.forEach(username => {
            if (!currentUser || username !== currentUser.username) {
                setTimeout(() => {
                    this.setUserOnline(username);
                    this.userJoinChannel(username, channelId);
                    
                    // Simulate speaking randomly
                    setInterval(() => {
                        if (Math.random() > 0.7 && this.users.get(username)?.inChannel === channelId) {
                            this.updateUserSpeaking(username, Math.random() * 0.1);
                            setTimeout(() => {
                                this.updateUserSpeaking(username, 0);
                            }, 1000 + Math.random() * 2000);
                        }
                    }, 3000 + Math.random() * 5000);
                }, Math.random() * 2000);
            }
        });
    }
    
    // Update user list in UI
    updateUserList() {
        // Also trigger the new voice users display update
        if (window.updateVoiceUsersDisplay) {
            window.updateVoiceUsersDisplay();
        }
    }
    
    // Cleanup when leaving
    cleanup() {
        if (this.currentUserId) {
            this.userLeaveChannel(this.currentUserId);
        }
        this.currentChannel = null;
    }
}

// Global instance
const userPresence = new UserPresence();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    userPresence.init();
});

// Export for use in other modules
window.userPresence = userPresence;
