// Discord Clone - Application Logic

// Load servers data from localStorage or initialize with default data
function loadServers() {
    const savedServers = localStorage.getItem('discord_clone_servers');
    if (savedServers) {
        return JSON.parse(savedServers);
    }
    
    // Default servers
    return {
        home: {
            name: 'Home',
            ownerId: 'default-owner',
            channels: {
                text: [
                    { id: 'friends', name: 'friends', type: 'text' },
                    { id: 'nitro', name: 'nitro', type: 'text' }
                ],
                voice: []
            }
        },
        gaming: {
            name: 'Gaming Hub',
            ownerId: 'default-owner',
            channels: {
                text: [
                    { id: 'general', name: 'general', type: 'text' },
                    { id: 'random', name: 'random', type: 'text' },
                    { id: 'memes', name: 'memes', type: 'text' },
                    { id: 'clips', name: 'game-clips', type: 'text' }
                ],
                voice: [
                    { id: 'voice-general', name: 'General Voice', type: 'voice' },
                    { id: 'voice-gaming', name: 'Gaming Voice', type: 'voice' }
                ]
            }
        },
        coding: {
            name: 'Coding Community',
            ownerId: 'default-owner',
            channels: {
                text: [
                    { id: 'general', name: 'general', type: 'text' },
                    { id: 'help', name: 'help', type: 'text' },
                    { id: 'showcase', name: 'showcase', type: 'text' },
                    { id: 'resources', name: 'resources', type: 'text' }
                ],
                voice: [
                    { id: 'voice-general', name: 'General Voice', type: 'voice' },
                    { id: 'pair-programming', name: 'Pair Programming', type: 'voice' }
                ]
            }
        },
        music: {
            name: 'Music Lovers',
            ownerId: 'default-owner',
            channels: {
                text: [
                    { id: 'general', name: 'general', type: 'text' },
                    { id: 'recommendations', name: 'recommendations', type: 'text' },
                    { id: 'playlists', name: 'playlists', type: 'text' }
                ],
                voice: [
                    { id: 'voice-general', name: 'General Voice', type: 'voice' },
                    { id: 'listening-party', name: 'Listening Party', type: 'voice' }
                ]
            }
        },
        design: {
            name: 'Design Studio',
            ownerId: 'default-owner',
            channels: {
                text: [
                    { id: 'general', name: 'general', type: 'text' },
                    { id: 'inspiration', name: 'inspiration', type: 'text' },
                    { id: 'feedback', name: 'feedback', type: 'text' }
                ],
                voice: [
                    { id: 'voice-general', name: 'General Voice', type: 'voice' }
                ]
            }
        }
    };
}

// Save servers data to localStorage
function saveServers(servers) {
    localStorage.setItem('discord_clone_servers', JSON.stringify(servers));
}

// Initialize servers
let servers = loadServers();

// Mock Messages Data
const messagesData = {
    'gaming-general': [
        {
            id: 1,
            author: 'AlexGamer',
            avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
            content: 'Hey everyone! Anyone up for some Valorant tonight?',
            timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
            id: 2,
            author: 'SarahPlays',
            avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
            content: 'I\'m down! What time were you thinking?',
            timestamp: new Date(Date.now() - 3000000).toISOString()
        },
        {
            id: 3,
            author: 'ProPlayer99',
            avatar: 'https://cdn.discordapp.com/embed/avatars/3.png',
            content: 'Count me in too! 🎮',
            timestamp: new Date(Date.now() - 2400000).toISOString()
        }
    ],
    'gaming-random': [
        {
            id: 1,
            author: 'MemeKing',
            avatar: 'https://cdn.discordapp.com/embed/avatars/4.png',
            content: 'Did you see the new game trailer? It looks amazing!',
            timestamp: new Date(Date.now() - 7200000).toISOString()
        }
    ],
    'coding-general': [
        {
            id: 1,
            author: 'DevMaster',
            avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
            content: 'Just pushed my first open source project! Check it out 🚀',
            timestamp: new Date(Date.now() - 1800000).toISOString()
        },
        {
            id: 2,
            author: 'CodeNewbie',
            avatar: 'https://cdn.discordapp.com/embed/avatars/2.png',
            content: 'Congratulations! That\'s awesome!',
            timestamp: new Date(Date.now() - 1200000).toISOString()
        }
    ]
};

// State
let currentServer = 'gaming';
let currentChannel = 'general';
let currentUser = {
    username: 'User123',
    avatar: 'https://cdn.discordapp.com/embed/avatars/0.png',
    status: 'online'
};

// DOM Elements
const serverItems = document.querySelectorAll('.server-item[data-server]');
const serverNameEl = document.querySelector('.server-name');
const channelsContainer = document.querySelector('.channels-container');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const channelTitleEl = document.querySelector('.channel-title');

// Initialize
function init() {
    // Check authentication
    const user = checkAuth();
    if (!user) return;
    
    // Update user info
    currentUser = user;
    updateUserUI();
    
    // Render everything after DOM is loaded
    renderServers();
    renderChannels();
    renderMessages();
    setupEventListeners();
    setupVoiceChat();
    
    // Setup server creation
    setupServerCreation();
}

// Render the server list - only add user-created servers
function renderServers() {
    const serverList = document.querySelector('.server-list');
    if (!serverList) return;
    
    // Find the position to insert user-created servers (after home, before first separator)
    const homeServer = serverList.querySelector('.home-server');
    const firstSeparator = serverList.querySelector('.server-separator');
    
    // Remove only the user-created servers (those that have data-server attributes but aren't default ones)
    const userCreatedServers = serverList.querySelectorAll('.server-item[data-server]:not([data-server="home"]):not([data-server="gaming"]):not([data-server="coding"]):not([data-server="music"]):not([data-server="design"])');
    userCreatedServers.forEach(server => server.remove());
    
    // Add user-created servers (excluding default ones)
    Object.keys(servers).forEach(serverId => {
        const server = servers[serverId];
        
        // Skip default servers that are already in HTML
        if (['home', 'gaming', 'coding', 'music', 'design'].includes(serverId)) return;
        
        const serverItem = document.createElement('div');
        serverItem.className = 'server-item';
        serverItem.setAttribute('data-server', serverId);
        
        // Create server icon (first letter of server name)
        const serverIcon = document.createElement('div');
        serverIcon.className = 'server-icon';
        serverIcon.textContent = server.name.charAt(0).toUpperCase();
        serverIcon.style.background = `linear-gradient(135deg, 
            hsl(${Math.abs(serverId.hashCode()) % 360}, 70%, 50%), 
            hsl(${(Math.abs(serverId.hashCode()) + 60) % 360}, 70%, 40%))`;
        
        serverItem.appendChild(serverIcon);
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'server-tooltip';
        tooltip.textContent = server.name;
        serverItem.appendChild(tooltip);
        
        // Insert after home server and before the first separator
        if (firstSeparator) {
            serverList.insertBefore(serverItem, firstSeparator);
        } else {
            // If no separator found, add after home server
            serverList.insertBefore(serverItem, homeServer ? homeServer.nextSibling : serverList.firstChild);
        }
    });
    
    // Attach event listeners to all server items (including default ones)
    document.querySelectorAll('.server-item[data-server]').forEach(item => {
        // Remove existing listeners to avoid duplicates
        const existingClickListeners = item.getAttribute('data-initialized');
        if (!existingClickListeners) {
            item.setAttribute('data-initialized', 'true');
            
            item.addEventListener('click', () => {
                const serverId = item.dataset.server;
                if (servers[serverId]) {
                    switchServer(serverId);
                }
            });
        }
    });
}

// Add string hash function for consistent color generation
String.prototype.hashCode = function() {
    let hash = 0;
    if (this.length === 0) return hash;
    for (let i = 0; i < this.length; i++) {
        const char = this.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

// Setup server creation functionality
function setupServerCreation() {
    // Add server button
    document.querySelector('.add-server')?.addEventListener('click', () => {
        showCreateServerModal();
    });
    
    // Explore servers button
    document.querySelector('.explore-servers')?.addEventListener('click', () => {
        showExploreServersModal();
    });
}

// Show create server modal
function showCreateServerModal() {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'createServerModal';
    modal.innerHTML = `
        <div class="create-server-modal">
            <div class="create-server-header">
                <h2>Create Your Server</h2>
                <button class="close-create-server" id="closeCreateServerBtn">&times;</button>
            </div>
            <div class="create-server-content">
                <div class="create-server-step active" id="step1">
                    <h3>What's the name of your server?</h3>
                    <p>Give it a descriptive name so members know what to expect.</p>
                    <input type="text" id="serverNameInput" class="server-name-input" placeholder="Enter server name" maxlength="100">
                    <div class="create-server-buttons">
                        <button class="secondary-btn" id="backToTemplateBtn">Back</button>
                        <button class="primary-btn" id="createServerNextBtn" disabled>Create Server</button>
                    </div>
                </div>
                <div class="create-server-step" id="step2">
                    <h3>Customize your server</h3>
                    <p>You can always change these settings later in Server Settings.</p>
                    <div class="server-icon-upload">
                        <div class="server-icon-placeholder">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                            </svg>
                        </div>
                        <p>Upload Icon</p>
                    </div>
                    <div class="create-server-add-channels">
                        <h4>ADD CHANNELS</h4>
                        <p>Start with just text and voice, you can add more later.</p>
                        <div class="channel-options">
                            <div class="channel-option">
                                <input type="checkbox" id="create-text-channel" checked>
                                <label for="create-text-channel">Text Channels</label>
                            </div>
                            <div class="channel-option">
                                <input type="checkbox" id="create-voice-channel" checked>
                                <label for="create-voice-channel">Voice Channels</label>
                            </div>
                        </div>
                    </div>
                    <div class="create-server-buttons">
                        <button class="secondary-btn" id="backToNameBtn">Back</button>
                        <button class="primary-btn" id="finishCreateServerBtn">Create Server</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners for the modal
    document.getElementById('closeCreateServerBtn')?.addEventListener('click', () => {
        document.getElementById('createServerModal').remove();
    });
    
    // Server name input validation
    const serverNameInput = document.getElementById('serverNameInput');
    const createServerNextBtn = document.getElementById('createServerNextBtn');
    
    serverNameInput?.addEventListener('input', () => {
        createServerNextBtn.disabled = serverNameInput.value.trim().length === 0;
    });
    
    // Next button click
    document.getElementById('createServerNextBtn')?.addEventListener('click', () => {
        if (serverNameInput.value.trim().length > 0) {
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step2').classList.add('active');
        }
    });
    
    // Back to name button
    document.getElementById('backToNameBtn')?.addEventListener('click', () => {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step1').classList.add('active');
    });
    
    // Back to template button
    document.getElementById('backToTemplateBtn')?.addEventListener('click', () => {
        document.getElementById('step2').classList.remove('active');
        document.getElementById('step1').classList.add('active');
    });
    
    // Finish create server button
    document.getElementById('finishCreateServerBtn')?.addEventListener('click', () => {
        const serverName = document.getElementById('serverNameInput').value.trim();
        if (serverName) {
            createNewServer(serverName);
            document.getElementById('createServerModal').remove();
        }
    });
    
    // Click outside to close modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Create a new server
function createNewServer(name) {
    const serverId = generateServerId(name);
    
    // Create server object
    const newServer = {
        name: name,
        ownerId: currentUser.username,
        channels: {
            text: [],
            voice: []
        }
    };
    
    // Add default channels if selected
    const createTextChannel = document.getElementById('create-text-channel')?.checked ?? true;
    const createVoiceChannel = document.getElementById('create-voice-channel')?.checked ?? true;
    
    if (createTextChannel) {
        newServer.channels.text.push({
            id: 'general',
            name: 'general',
            type: 'text'
        });
    }
    
    if (createVoiceChannel) {
        newServer.channels.voice.push({
            id: 'general-voice',
            name: 'General Voice',
            type: 'voice'
        });
    }
    
    // Add to servers
    servers[serverId] = newServer;
    
    // Save to localStorage
    saveServers(servers);
    
    // Re-render the server list
    renderServers();
    
    // Switch to the new server
    switchServer(serverId);
    
    // Play notification sound
    if (window.audioEffects) {
        audioEffects.playNotificationSound();
    }
}

// Generate a unique server ID from the name
function generateServerId(name) {
    let baseId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let serverId = baseId;
    let counter = 1;
    
    // Make sure the ID is unique
    while (servers[serverId]) {
        serverId = `${baseId}-${counter}`;
        counter++;
    }
    
    return serverId;
}

// Show explore servers modal
function showExploreServersModal() {
    // For now, just show a simple message - this would connect to public server discovery in a full implementation
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'exploreServersModal';
    modal.innerHTML = `
        <div class="explore-servers-modal">
            <div class="explore-servers-header">
                <h2>Explore Public Servers</h2>
                <button class="close-explore-servers" id="closeExploreServersBtn">&times;</button>
            </div>
            <div class="explore-servers-content">
                <p>In a full implementation, this would show public servers you can join.</p>
                <p>Currently, you can only join servers by invitation.</p>
                <div class="explore-servers-buttons">
                    <button class="primary-btn" id="closeExploreBtn">Close</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    document.getElementById('closeExploreServersBtn')?.addEventListener('click', () => {
        document.getElementById('exploreServersModal').remove();
    });
    
    document.getElementById('closeExploreBtn')?.addEventListener('click', () => {
        document.getElementById('exploreServersModal').remove();
    });
    
    // Click outside to close modal
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.getElementById('exploreServersModal').remove();
        }
    });
}

// Check authentication
function checkAuth() {
    const currentUser = localStorage.getItem('discord_clone_current_user');
    if (!currentUser) {
        window.location.href = 'login.html';
        return null;
    }
    return JSON.parse(currentUser);
}

// Update user UI
function updateUserUI() {
    document.querySelector('.username').textContent = currentUser.username;
    document.querySelector('.user-avatar img').src = currentUser.avatar;
}

// Setup Event Listeners
function setupEventListeners() {
    // Server switching
    serverItems.forEach(item => {
        item.addEventListener('click', () => {
            const serverId = item.dataset.server;
            if (serverId && servers[serverId]) {
                switchServer(serverId);
            }
        });
    });

    // Message input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && messageInput.value.trim()) {
            sendMessage(messageInput.value.trim());
            messageInput.value = '';
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('discord_clone_current_user');
        window.location.href = 'login.html';
    });
    
    // Settings button
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        showSettingsModal();
    });
    
    // Close settings button
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
        hideSettingsModal();
    });
    
    // Confirm logout button
    document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('discord_clone_current_user');
        window.location.href = 'login.html';
    });
    
    // Settings navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all nav items
            document.querySelectorAll('.settings-nav-item').forEach(navItem => {
                navItem.classList.remove('active');
            });
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Hide all tabs
            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Show the selected tab
            const tabId = item.getAttribute('data-tab');
            const tab = document.getElementById(tabId);
            if (tab) {
                tab.classList.add('active');
            }
        });
    });
    
    // Click outside to close modal
    document.getElementById('settingsModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            hideSettingsModal();
        }
    });
    
    // Setup channel context menu
    setupChannelContextMenu();
}

// Show settings modal
function showSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
    }
}

// Hide settings modal
function hideSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Voice Chat Setup
function setupVoiceChat() {
    // Remove existing event listeners from voice channels to prevent duplicates
    document.querySelectorAll('.voice-channel').forEach(channel => {
        // Store the channel ID and name before cloning
        const channelId = channel.getAttribute('data-channel');
        const channelName = channel.querySelector('.channel-name').textContent;
        
        // Replace with a clone to remove event listeners
        const newChannel = channel.cloneNode(true);
        channel.parentNode.replaceChild(newChannel, channel);
        
        // Add the event listener to the new element
        newChannel.addEventListener('click', () => {
            joinVoiceChannel(channelId, channelName);
        });
    });
}

// Initialize WebRTC
const voiceChat = new VoiceChatManager();

// Function to handle microphone access status in UI
function updateMicrophoneStatusUI() {
    // Update the mute button based on whether we have microphone access
    const muteBtn = document.getElementById('muteBtn');
    if (muteBtn) {
        if (voiceChat.hasMicrophoneAccess()) {
            // We have microphone access, so the button should work as normal mute/unmute
            muteBtn.title = voiceChat.isMuted ? 'Unmute' : 'Mute';
        } else {
            // We don't have microphone access, indicate this in the UI
            muteBtn.title = 'Microphone Access Denied';
        }
    }
}

// Override UI callbacks
voiceChat.onUserJoined = function(userId, channel) {
    console.log(`${userId} joined ${channel}`);
    // Ensure the user is marked as in the channel in the user presence system
    if (userPresence.users.has(userId)) {
        const user = userPresence.users.get(userId);
        user.inChannel = channel;
    } else {
        // If user doesn't exist in presence system, add them
        userPresence.setUserOnline(userId);
        userPresence.userJoinChannel(userId, channel);
    }
    updateVoiceUsersDisplay();
    userPresence.updateUserList(); // Also update the voice panel
    updateMicrophoneStatusUI();
};

voiceChat.onUserLeft = function(userId) {
    console.log(`${userId} left`);
    // Update user presence to reflect user left channel
    userPresence.userLeaveChannel(userId);
    updateVoiceUsersDisplay();
    userPresence.updateUserList(); // Also update the voice panel
    updateMicrophoneStatusUI();
};

voiceChat.onUserAudio = function(userId, stream) {
    console.log(`Audio stream from ${userId}`);
    // Mark user as speaking when audio is detected
    // The actual speaking detection is now handled by the audio analysis in webrtc.js
    // This function serves as a fallback if audio analysis fails
    userPresence.updateUserSpeaking(userId, 0.05); // Set to a moderate level to show speaking
    
    updateVoiceUsersDisplay();
};

// Join Voice Channel
let currentVoiceChannel = null;
let currentVoiceChannelName = null;

async function joinVoiceChannel(channelId, channelName) {
    // Leave current channel if in one
    if (currentVoiceChannel) {
        leaveVoiceChannel();
    }
    
    currentVoiceChannel = channelId;
    currentVoiceChannelName = channelName || channelId;
    
    // Update user presence first - use channel ID for consistency
    const currentUser = localStorage.getItem('discord_clone_current_user');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        userPresence.userJoinChannel(user.username, channelId);
    }
    
    // Connect via WebRTC
    const success = await voiceChat.joinChannel(channelId);
    if (success) {
        // Play voice channel join sound
        if (window.audioEffects) {
            audioEffects.playVoiceJoinSound();
        }
        
        // Simulate other users joining
        setTimeout(() => {
            userPresence.simulateUsers(channelId);
        }, 1000);
        
        console.log(`Connected to ${channelName || channelId} via WebRTC`);
    }
    
    // Update both displays after joining
    // Small delay to ensure all systems are updated
    setTimeout(() => {
        updateVoiceUsersDisplay();
        userPresence.updateUserList();
    }, 100);
}

function leaveVoiceChannel() {
    voiceChat.leaveChannel();
    userPresence.cleanup();
    currentVoiceChannel = null;
    
    // Play voice channel leave sound
    if (window.audioEffects) {
        audioEffects.playVoiceLeaveSound();
    }
    
    // Update both displays after leaving
    // Small delay to ensure all systems are updated
    setTimeout(() => {
        updateVoiceUsersDisplay();
        userPresence.updateUserList();
    }, 100);
}



// Update voice users display under voice channels
function updateVoiceUsersDisplay() {
    // Get all users grouped by channel
    const allUsers = userPresence.getOnlineUsers();
    
    // Group users by voice channel ID
    const usersByChannelId = {};
    
    // Group users by their channel ID (inChannel is now the channel ID)
    allUsers.forEach(user => {
        if (user.inChannel) {
            const channelId = user.inChannel;
            // Verify this is a valid channel ID by checking if element exists
            const element = document.querySelector(`.voice-channel[data-channel="${channelId}"]`);
            if (element) {
                if (!usersByChannelId[channelId]) {
                    usersByChannelId[channelId] = [];
                }
                usersByChannelId[channelId].push(user);
            }
        }
    });
    
    // First, remove all existing voice user containers
    document.querySelectorAll('.voice-users-container').forEach(container => {
        container.remove();
    });
    
    // Update each voice channel's user container
    Object.keys(usersByChannelId).forEach(channelId => {
        // Find the voice channel element by data-channel attribute
        const channelElement = document.querySelector(`.voice-channel[data-channel="${channelId}"]`);
        
        if (channelElement && usersByChannelId[channelId].length > 0) {
            // Create a new container for users
            const container = document.createElement('div');
            container.className = 'voice-users-container';
            container.id = `${channelId}-users`;
            
            // Add users to the container
            usersByChannelId[channelId].forEach(user => {
                const userElement = document.createElement('div');
                userElement.className = `voice-user-entry ${user.isSpeaking ? 'speaking' : ''}`;
                userElement.dataset.userId = user.username;
                
                // Determine if this is the current user
                const currentUser = localStorage.getItem('discord_clone_current_user');
                const isCurrentUser = currentUser && JSON.parse(currentUser).username === user.username;
                
                userElement.innerHTML = `
                    <svg class="voice-user-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                    <span class="voice-username">${isCurrentUser ? 'You' : user.username}</span>
                `;
                
                container.appendChild(userElement);
            });
            
            // Insert the container after the voice channel element
            channelElement.parentNode.insertBefore(container, channelElement.nextSibling);
        }
    });
}

// Update voice panel users list (now handled by userPresence)
function updateVoicePanelUsers() {
    // This function is now handled by userPresence.updateUserList()
    // Keeping for backward compatibility
    if (userPresence) {
        userPresence.updateUserList();
    }
    // Also update the new voice users display
    updateVoiceUsersDisplay();
}

// Switch Server
function switchServer(serverId) {
    currentServer = serverId;
    currentChannel = servers[serverId].channels.text[0]?.id || 'general';
    
    // Update active server in UI
    serverItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.server === serverId) {
            item.classList.add('active');
        }
    });
    
    // Update server name
    serverNameEl.textContent = servers[serverId].name;
    
    // Re-render channels and messages
    renderChannels();
    renderMessages();
}

// Add channel context menu
function setupChannelContextMenu() {
    // Add event listener for right-click on channel items
    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest('.channel-item')) {
            e.preventDefault();
            const channelItem = e.target.closest('.channel-item');
            const channelId = channelItem.dataset.channel;
            const server = servers[currentServer];
            
            // Check if user owns the server
            if (server.ownerId === currentUser.username) {
                showChannelContextMenu(e.clientX, e.clientY, channelId);
            }
        }
    });
}

// Show channel context menu
function showChannelContextMenu(x, y, channelId) {
    // Remove any existing context menus
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.innerHTML = `
        <div class="context-menu-item" data-action="rename">Rename Channel</div>
        <div class="context-menu-item" data-action="delete">Delete Channel</div>
    `;
    
    document.body.appendChild(contextMenu);
    
    // Add event listeners to menu items
    contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const action = item.getAttribute('data-action');
            if (action === 'delete') {
                deleteChannel(channelId);
            } else if (action === 'rename') {
                renameChannel(channelId);
            }
            contextMenu.remove();
        });
    });
    
    // Remove menu when clicking elsewhere
    const removeMenu = () => {
        contextMenu.remove();
        document.removeEventListener('click', removeMenu);
    };
    setTimeout(() => {
        document.addEventListener('click', removeMenu);
    }, 10);
}

// Delete a channel
function deleteChannel(channelId) {
    if (!confirm(`Are you sure you want to delete #${getChannelNameById(channelId)}? This cannot be undone.`)) {
        return;
    }
    
    const server = servers[currentServer];
    
    // Find and remove the channel from text channels
    const textIndex = server.channels.text.findIndex(ch => ch.id === channelId);
    if (textIndex !== -1) {
        server.channels.text.splice(textIndex, 1);
    }
    
    // Find and remove the channel from voice channels
    const voiceIndex = server.channels.voice.findIndex(ch => ch.id === channelId);
    if (voiceIndex !== -1) {
        server.channels.voice.splice(voiceIndex, 1);
    }
    
    // Save servers
    saveServers(servers);
    
    // Re-render channels
    renderChannels();
    
    // If we deleted the current channel, switch to general
    if (currentChannel === channelId) {
        currentChannel = server.channels.text[0]?.id || 'general';
        renderMessages();
    }
}

// Rename a channel
function renameChannel(channelId) {
    const currentName = getChannelNameById(channelId);
    const newName = prompt('Enter new channel name:', currentName);
    
    if (newName && newName.trim() && newName !== currentName) {
        const server = servers[currentServer];
        
        // Find the channel and update its name
        const textChannel = server.channels.text.find(ch => ch.id === channelId);
        if (textChannel) {
            textChannel.name = newName.trim();
        }
        
        const voiceChannel = server.channels.voice.find(ch => ch.id === channelId);
        if (voiceChannel) {
            voiceChannel.name = newName.trim();
        }
        
        // Save servers
        saveServers(servers);
        
        // Re-render channels
        renderChannels();
        
        // If this is the current channel, update the header
        if (currentChannel === channelId) {
            const channelTitle = document.querySelector('.channel-title');
            if (channelTitle) {
                channelTitle.textContent = newName.trim();
                const messageInput = document.getElementById('messageInput');
                if (messageInput) {
                    messageInput.placeholder = `Message #${newName.trim()}`;
                }
            }
        }
    }
}

// Get channel name by ID
function getChannelNameById(channelId) {
    const server = servers[currentServer];
    const textChannel = server.channels.text.find(ch => ch.id === channelId);
    if (textChannel) return textChannel.name;
    
    const voiceChannel = server.channels.voice.find(ch => ch.id === channelId);
    if (voiceChannel) return voiceChannel.name;
    
    return channelId;
}

// Add channel functionality
function setupAddChannelButton() {
    // Add a plus button to the channel header
    const categoryHeaders = document.querySelectorAll('.category-header');
    categoryHeaders.forEach(header => {
        if (!header.querySelector('.add-channel-btn')) {
            const addBtn = document.createElement('button');
            addBtn.className = 'add-channel-btn';
            addBtn.innerHTML = '+';
            addBtn.title = 'Add Channel';
            addBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const category = header.parentElement;
                const categoryName = header.querySelector('.category-name').textContent;
                
                if (categoryName.includes('TEXT')) {
                    showAddChannelModal('text');
                } else if (categoryName.includes('VOICE')) {
                    showAddChannelModal('voice');
                }
            });
            
            header.appendChild(addBtn);
        }
    });
}

// Show add channel modal
function showAddChannelModal(type) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'addChannelModal';
    modal.innerHTML = `
        <div class="add-channel-modal">
            <div class="add-channel-header">
                <h2>${type === 'text' ? 'Create Text Channel' : 'Create Voice Channel'}</h2>
                <button class="close-add-channel" id="closeAddChannelBtn">&times;</button>
            </div>
            <div class="add-channel-content">
                <div class="form-group">
                    <label for="channelName">CHANNEL NAME</label>
                    <input type="text" id="channelName" class="settings-input" placeholder="${type === 'text' ? 'e.g. general' : 'e.g. General Voice'}" maxlength="100">
                </div>
                <div class="add-channel-buttons">
                    <button class="secondary-btn" id="cancelAddChannelBtn">Cancel</button>
                    <button class="primary-btn" id="createChannelBtn" ${type === 'text' ? '' : 'disabled'}>Create Channel</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup event listeners
    document.getElementById('closeAddChannelBtn')?.addEventListener('click', () => {
        document.getElementById('addChannelModal').remove();
    });
    
    document.getElementById('cancelAddChannelBtn')?.addEventListener('click', () => {
        document.getElementById('addChannelModal').remove();
    });
    
    const channelNameInput = document.getElementById('channelName');
    const createChannelBtn = document.getElementById('createChannelBtn');
    
    channelNameInput?.addEventListener('input', () => {
        createChannelBtn.disabled = channelNameInput.value.trim().length === 0;
    });
    
    createChannelBtn?.addEventListener('click', () => {
        const channelName = channelNameInput.value.trim();
        if (channelName) {
            createChannel(type, channelName);
            document.getElementById('addChannelModal').remove();
        }
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Create a new channel
function createChannel(type, name) {
    const server = servers[currentServer];
    const channelId = generateChannelId(name, type);
    
    const newChannel = {
        id: channelId,
        name: name,
        type: type
    };
    
    if (type === 'text') {
        server.channels.text.push(newChannel);
    } else if (type === 'voice') {
        server.channels.voice.push(newChannel);
    }
    
    // Save servers
    saveServers(servers);
    
    // Re-render channels
    renderChannels();
    
    // Play notification sound
    if (window.audioEffects) {
        audioEffects.playNotificationSound();
    }
}

// Generate a unique channel ID
function generateChannelId(name, type) {
    let baseId = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (type === 'voice') {
        baseId = `voice-${baseId}`;
    }
    
    let channelId = baseId;
    let counter = 1;
    
    // Make sure the ID is unique within the server
    const allChannels = [...servers[currentServer].channels.text, ...servers[currentServer].channels.voice];
    while (allChannels.some(ch => ch.id === channelId)) {
        channelId = `${baseId}-${counter}`;
        counter++;
    }
    
    return channelId;
}

// Render Channels
function renderChannels() {
    const server = servers[currentServer];
    if (!server) return;
    
    let html = '';
    
    // Text Channels
    if (server.channels.text.length > 0) {
        html += `
            <div class="channel-category">
                <div class="category-header">
                    <svg class="category-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                    <span class="category-name">TEXT CHANNELS</span>
                </div>
                <div class="channel-list">
        `;
        
        server.channels.text.forEach(channel => {
            const isActive = channel.id === currentChannel;
            html += `
                <div class="channel-item ${isActive ? 'active' : ''}" data-channel="${channel.id}">
                    <svg class="channel-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                    <span class="channel-name">${channel.name}</span>
                </div>
            `;
        });
        
        html += '</div></div>';
    }
    
    // Voice Channels
    if (server.channels.voice.length > 0) {
        html += `
            <div class="channel-category">
                <div class="category-header">
                    <svg class="category-arrow" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 10l5 5 5-5z"/>
                    </svg>
                    <span class="category-name">VOICE CHANNELS</span>
                </div>
                <div class="channel-list">
        `;
        
        server.channels.voice.forEach(channel => {
            html += `
                <div class="channel-item voice-channel" data-channel="${channel.id}">
                    <svg class="channel-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                    <span class="channel-name">${channel.name}</span>
                </div>
                <!-- Voice users container will be dynamically added here by updateVoiceUsersDisplay -->
            `;
        });
        
        html += '</div></div>';
    }
    
    channelsContainer.innerHTML = html;
    
    // Add click listeners to channels
    document.querySelectorAll('.channel-item[data-channel]').forEach(item => {
        // For voice channels, we'll handle clicks separately
        if (item.classList.contains('voice-channel')) {
            return; // Skip adding listener here, will be added by setupVoiceChat
        }
        
        item.addEventListener('click', () => {
            const channelId = item.dataset.channel;
            switchChannel(channelId);
        });
    });
    
    // Setup voice chat functionality
    setupVoiceChat();
    
    // Setup add channel buttons
    setupAddChannelButton();
    
    // Update voice users display after rendering
    setTimeout(updateVoiceUsersDisplay, 100);
}

// Switch Channel
function switchChannel(channelId) {
    currentChannel = channelId;
    
    // Update active channel in UI
    document.querySelectorAll('.channel-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.channel === channelId) {
            item.classList.add('active');
        }
    });
    
    // Update channel title
    const server = servers[currentServer];
    const channel = server.channels.text.find(c => c.id === channelId) || 
                   server.channels.voice.find(c => c.id === channelId);
    if (channel) {
        channelTitleEl.textContent = channel.name;
        messageInput.placeholder = `Message #${channel.name}`;
    }
    
    renderMessages();
}

// Render Messages
function renderMessages() {
    const messageKey = `${currentServer}-${currentChannel}`;
    const messages = messagesData[messageKey] || [];
    
    let html = `
        <div class="welcome-message">
            <div class="welcome-icon">#</div>
            <h2>Welcome to #${currentChannel}!</h2>
            <p>This is the start of the #${currentChannel} channel.</p>
        </div>
    `;
    
    messages.forEach(msg => {
        html += createMessageHTML(msg);
    });
    
    messagesContainer.innerHTML = html;
    scrollToBottom();
}

// Create Message HTML
function createMessageHTML(msg) {
    const time = formatTime(msg.timestamp);
    return `
        <div class="message" data-id="${msg.id}">
            <img src="${msg.avatar}" alt="${msg.author}" class="message-avatar">
            <div class="message-content">
                <div class="message-header">
                    <span class="message-author">${msg.author}</span>
                    <span class="message-timestamp">${time}</span>
                </div>
                <div class="message-text">${escapeHtml(msg.content)}</div>
            </div>
        </div>
    `;
}

// Send Message
function sendMessage(content) {
    const messageKey = `${currentServer}-${currentChannel}`;
    
    if (!messagesData[messageKey]) {
        messagesData[messageKey] = [];
    }
    
    const newMessage = {
        id: Date.now(),
        author: currentUser.username,
        avatar: currentUser.avatar,
        content: content,
        timestamp: new Date().toISOString()
    };
    
    messagesData[messageKey].push(newMessage);
    
    // Append to UI
    const messageHTML = createMessageHTML(newMessage);
    messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    scrollToBottom();
}

// Scroll to bottom
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Format Time
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        hour: 'numeric',
        minute: '2-digit'
    });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Category collapse functionality
document.addEventListener('click', (e) => {
    if (e.target.closest('.category-header')) {
        const header = e.target.closest('.category-header');
        const category = header.parentElement;
        const channelList = category.querySelector('.channel-list');
        
        header.classList.toggle('collapsed');
        if (channelList) {
            channelList.style.display = header.classList.contains('collapsed') ? 'none' : 'flex';
        }
    }
});

// Add Server Modal (placeholder)
document.querySelector('.add-server')?.addEventListener('click', () => {
    alert('Add Server feature would open a modal here!');
});

// Explore Servers (placeholder)
document.querySelector('.explore-servers')?.addEventListener('click', () => {
    alert('Explore Public Servers feature would open here!');
});

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
