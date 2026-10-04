
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

  socket.on("join-room", (roomId: string) => {
    socket.join(roomId);

    console.log(
      `Socket ${socket.id} joined room ${roomId}`,
    );
    socket.to(roomId).emit("user-joined", {
    socketId: socket.id,
  });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.get("/health", (_req, res) => {
  res.json({ message: "PeerMeet server is running" });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
