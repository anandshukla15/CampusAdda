module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // join specific room
    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      console.log(`User joined room ${roomId}`);
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