import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import PORT from "./config/server-config.js";

const app = express();

app.use(
  cors({
    origin: "*",
  }),
);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Store the room this socket joined
  let currentRoomId: string | null = null;

  // Join a meeting room
  socket.on("join-room", (roomId: string) => {
    currentRoomId = roomId;

    socket.join(roomId);

    console.log(
      `Socket ${socket.id} joined room ${roomId}`,
    );

    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
    });
  });

  // Forward WebRTC offer
  socket.on("offer", (data) => {
    console.log(
      `Forwarding offer from ${socket.id} to ${data.targetSocketId}`,
    );

    io.to(data.targetSocketId).emit("offer", {
      offer: data.offer,
      senderSocketId: socket.id,
    });
  });

  // Forward WebRTC answer
  socket.on("answer", (data) => {
    console.log(
      `Forwarding answer from ${socket.id} to ${data.targetSocketId}`,
    );

    io.to(data.targetSocketId).emit("answer", {
      answer: data.answer,
      senderSocketId: socket.id,
    });
  });

  // Forward ICE candidates
  socket.on("ice-candidate", (data) => {
    console.log(
      `Forwarding ICE candidate from ${socket.id} to ${data.targetSocketId}`,
    );

    io.to(data.targetSocketId).emit("ice-candidate", {
      candidate: data.candidate,
      senderSocketId: socket.id,
    });
  });

  // Client disconnected
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);

    if (!currentRoomId) {
      return;
    }

    console.log(
      `Notifying room ${currentRoomId} that ${socket.id} left`,
    );

    socket.to(currentRoomId).emit("user-left", {
      socketId: socket.id,
    });
  });
});

// Health check
app.get("/health", (_req, res) => {
  res.json({
    message: "PeerMeet server is running",
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});