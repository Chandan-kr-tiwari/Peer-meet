
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import socket from "../socket";

function Meeting() {
  const { roomId } = useParams();

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

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