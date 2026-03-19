const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files from parent directory (the frontend)
app.use(express.static(path.join(__dirname, '..')));

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected users and their channels
const users = new Map();
const channels = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  let currentUser = null;
  let currentChannel = null;

  // User joins with their username
  socket.on('join', (data) => {
    const { username, channel } = data;
    currentUser = username;
    currentChannel = channel;
    
    // Store user info
    users.set(socket.id, {
      username,
      channel,
      socketId: socket.id
    });
    
    // Join the socket room for this channel
    socket.join(channel);
    
    // Get all users in this channel
    const channelUsers = Array.from(users.values())
      .filter(u => u.channel === channel)
      .map(u => ({ username: u.username, socketId: u.socketId }));
    
    // Notify everyone in the channel about the new user
    socket.to(channel).emit('user-joined', {
      username,
      socketId: socket.id,
      users: channelUsers
    });
    
    // Send current users to the new user
    socket.emit('channel-users', {
      channel,
      users: channelUsers
    });
    
    console.log(`${username} joined channel: ${channel}`);
  });

  // WebRTC signaling: Offer
  socket.on('offer', (data) => {
    const { target, offer } = data;
    io.to(target).emit('offer', {
      offer,
      from: socket.id,
      username: currentUser
    });
  });

  // WebRTC signaling: Answer
  socket.on('answer', (data) => {
    const { target, answer } = data;
    io.to(target).emit('answer', {
      answer,
      from: socket.id
    });
  });

  // WebRTC signaling: ICE Candidate
  socket.on('ice-candidate', (data) => {
    const { target, candidate } = data;
    io.to(target).emit('ice-candidate', {
      candidate,
      from: socket.id
    });
  });

  // User speaking status
  socket.on('speaking', (data) => {
    const { isSpeaking } = data;
    if (currentChannel) {
      socket.to(currentChannel).emit('user-speaking', {
        username: currentUser,
        isSpeaking
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (currentUser && currentChannel) {
      // Remove user from users map
      users.delete(socket.id);
      
      // Notify others in the channel
      socket.to(currentChannel).emit('user-left', {
        username: currentUser,
        socketId: socket.id
      });
    }
  });

  // Leave channel
  socket.on('leave-channel', () => {
    if (currentChannel) {
      socket.leave(currentChannel);
      users.delete(socket.id);
      
      socket.to(currentChannel).emit('user-left', {
        username: currentUser,
        socketId: socket.id
      });
      
      currentChannel = null;
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connectedUsers: users.size,
    activeChannels: new Set(Array.from(users.values()).map(u => u.channel)).size
  });
});

// Get server info
app.get('/info', (req, res) => {
  res.json({
    server: 'Discord Clone Signaling Server',
    version: '1.0.0',
    socketIoVersion: require('socket.io/package.json').version
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
