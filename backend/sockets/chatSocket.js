module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // join specific room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
    });

    // allow client to register userId and role for targeted notifications
    socket.on("register", (payload) => {
      try {
        if (!payload) return;
        const { userId, role } = payload;
        if (userId) {
          const room = `user_${userId}`;
          socket.join(room);
          console.log(`Socket ${socket.id} joined room ${room}`);
        }
        if (role) {
          const roleRoom = `role_${role}`;
          socket.join(roleRoom);
          console.log(`Socket ${socket.id} joined role room ${roleRoom}`);
        }
      } catch (err) {
        console.error("Error in register socket handler", err);
      }
    });

    // send message
    socket.on("send_message", (data) => {

      io.to(data.roomId).emit("receive_message", data);

    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

};