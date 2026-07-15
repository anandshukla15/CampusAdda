const { Server } = require("socket.io");

let io;

module.exports = {
  init: (server) => {
    io = new Server(server, {
      cors: {
        origin: "https://campus-adda-azure.vercel.app",
        methods: ["GET", "POST"]
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