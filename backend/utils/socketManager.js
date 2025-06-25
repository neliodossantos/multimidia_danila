
let io;
const connectedUsers = new Map(); // userId -> socketId

const init = (socketInstance) => {
  io = socketInstance;

  io.on('connection', (socket) => {
    console.log('Utilizador conectado:', socket.id);

    // Registar utilizador
    socket.on('register_user', (userId) => {
      connectedUsers.set(parseInt(userId), socket.id);
      console.log(`Utilizador ${userId} registado com socket ${socket.id}`);
    });

    socket.on('disconnect', () => {
      // Remover utilizador da lista de conectados
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`Utilizador ${userId} desconectado`);
          break;
        }
      }
    });
  });
};

const sendNotification = (userId, notification) => {
  const socketId = connectedUsers.get(parseInt(userId));
  if (socketId && io) {
    io.to(socketId).emit('notification', notification);
    console.log(`Notificação enviada para utilizador ${userId}`);
  }
};

const broadcastToEditors = (editorIds, notification) => {
  editorIds.forEach(userId => {
    sendNotification(userId, notification);
  });
};

module.exports = {
  init,
  sendNotification,
  broadcastToEditors
};
