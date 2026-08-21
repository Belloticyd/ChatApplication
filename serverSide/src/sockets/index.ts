

// serverSide/src/sockets/index.ts
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.util';
import { UserService } from '../services/user.service';

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId

export const setupSocketHandlers = (io: Server) => {
  io.use(async (socket: Socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify token
      const decoded = verifyAccessToken(token);
      
      // Attach user to socket
      socket.data.userId = decoded.uid;
      socket.data.phoneNumber = decoded.phoneNumber;
      
      // Check if user exists
      const user = await UserService.getUser(decoded.uid);
      if (!user) {
        return next(new Error('User not found'));
      }
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });
 
  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    
    console.log(`🔌 User ${userId} connected with socket ${socket.id}`);
    
    // Add user to online users
    onlineUsers.set(userId, socket.id);
    
    // Update user status in database
    UserService.updateOnlineStatus(userId, 'online')
      .then(() => {
        // Broadcast to all other users that this user is online
        socket.broadcast.emit('user:online', { userId });
      })
      .catch(console.error);

    // Join user's personal room for private messages
    socket.join(`user:${userId}`);

    // Handle sending messages
    socket.on('message:send', async (data) => {
      try {
        const { recipientId, content, type = 'text' } = data;
        
        if (!recipientId || !content) {
          socket.emit('message:error', { 
            error: 'Recipient and content are required' 
          });
          return;
        }

        // Create message object
        const message = {
          id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
          senderId: userId,
          recipientId,
          content,
          type,
          sentAt: new Date(),
          deliveredAt: null,
          readAt: null,
        };

        // Send to recipient if online
        const recipientSocketId = onlineUsers.get(recipientId);
        
        if (recipientSocketId) {
          // Emit to recipient's personal room
          io.to(`user:${recipientId}`).emit('message:receive', {
            ...message,
            deliveredAt: new Date(),
          });
          
          // Also emit to sender for confirmation
          socket.emit('message:delivered', { 
            messageId: message.id, 
            deliveredAt: new Date() 
          });
        } else {
          // User is offline - we'll handle this later with push notifications
          socket.emit('message:delivered', { 
            messageId: message.id, 
            deliveredAt: null,
            status: 'pending'
          });
        }

        // Save message to database
        // We'll implement this later with Firestore
        console.log(`📩 Message from ${userId} to ${recipientId}: ${content}`);
        
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message:error', { 
          error: 'Failed to send message' 
        });
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      
      if (recipientSocketId) {
        io.to(`user:${recipientId}`).emit('typing:start', { 
          senderId: userId 
        });
      }
    });

    socket.on('typing:stop', (data) => {
      const { recipientId } = data;
      const recipientSocketId = onlineUsers.get(recipientId);
      
      if (recipientSocketId) {
        io.to(`user:${recipientId}`).emit('typing:stop', { 
          senderId: userId 
        });
      }
    });

    // Handle read receipts
    socket.on('message:read', async (data) => {
      const { messageId, senderId } = data;
      
      // Notify sender that message was read
      const senderSocketId = onlineUsers.get(senderId);
      
      if (senderSocketId) {
        io.to(`user:${senderId}`).emit('message:read', {
          messageId,
          readerId: userId,
          readAt: new Date(),
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User ${userId} disconnected`);
      
      // Remove user from online users
      onlineUsers.delete(userId);
      
      // Update user status in database
      UserService.updateOnlineStatus(userId, 'offline')
        .then(() => {
          // Broadcast to all other users that this user is offline
          socket.broadcast.emit('user:offline', { userId }); 
        })
        .catch(console.error);
    });
  });

  // Return online users helper
  return {
    getOnlineUsers: () => Array.from(onlineUsers.keys()),
    isUserOnline: (userId: string) => onlineUsers.has(userId),
  };
};