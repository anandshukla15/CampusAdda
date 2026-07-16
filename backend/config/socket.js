const { Server } = require("socket.io");


let io;

const allowedOrigins = [
  "http://localhost:3000",
  "https://campus-adda-azure.vercel.app"
];

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized");
    }

    return io;
  }
};