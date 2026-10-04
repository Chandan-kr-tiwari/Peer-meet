
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";

function Meeting() {
  const { roomId } = useParams();

 useEffect(() => {
  if (!roomId) {
    return;
  }

  socket.connect();

 const handleConnect = () => {
      console.log("Connected:", socket.id);
      socket.emit("join-room", roomId);
    };
      const handleUserJoined = (data: { socketId: string }) => {
      console.log("New user joined:", data.socketId);
    };
    socket.on("connect", handleConnect);
    socket.on("user-joined", handleUserJoined);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("user-joined", handleUserJoined);
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">
        Meeting Room
      </h1>

      <p className="text-base-content/70">
        Room ID: {roomId}
      </p>
    </div>
  );
}

export default Meeting;