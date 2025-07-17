
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');


const initializeSocket = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });


  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user._id}`);
    
    socket.join(socket.user._id.toString());
    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user._id}`);
    });
  });

  return io;
};

module.exports = initializeSocket;