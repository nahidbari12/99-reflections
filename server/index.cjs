const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = {}; // { roomCode: [{ id, username }] }

io.on("connection", (socket) => {
  console.log(`✅ New user connected: ${socket.id}`);

  // Debugging: Confirm socket connection is active
  socket.on("ping", () => {
    console.log(`📡 Ping received from: ${socket.id}`);
  });

  socket.on("joinRoom", ({ roomCode, username }) => {
    console.log(`🔗 Received joinRoom event: ${username} is trying to join room: ${roomCode}`);

    if (!rooms[roomCode]) {
      rooms[roomCode] = [];
    }

    if (!rooms[roomCode].some((player) => player.id === socket.id)) {
      rooms[roomCode].push({ id: socket.id, username });
      socket.join(roomCode);
    }

    console.log(`👥 Room ${roomCode} now has ${rooms[roomCode].length} player(s)`);
    console.log(`📡 Current players in room ${roomCode}:`, rooms[roomCode]);

    if (rooms[roomCode].length === 2) {
      console.log(`🚀 Starting game in room: ${roomCode}`);
      io.to(roomCode).emit("startGame", {
        opponentName: rooms[roomCode][1].username,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.id}`);
    for (const roomCode in rooms) {
      rooms[roomCode] = rooms[roomCode].filter((user) => user.id !== socket.id);
      if (rooms[roomCode].length === 0) {
        console.log(`🗑️ Room ${roomCode} is now empty and will be deleted.`);
        delete rooms[roomCode];
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
