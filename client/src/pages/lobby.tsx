import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Lobby() {
  const navigate = useNavigate();

  const [isJoining, setIsJoining] = useState(false);
  const [roomId, setRoomId] = useState("");

  const createMeeting = () => {
    const newRoomId = crypto.randomUUID();

    navigate(`/room/${newRoomId}`);
  };

  const joinMeeting = () => {
    const trimmedRoomId = roomId.trim();

    if (!trimmedRoomId) {
      return;
    }

    navigate(`/room/${trimmedRoomId}`);
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title text-3xl">
            PeerMeet
          </h1>

          <p className="text-base-content/70">
            Simple peer-to-peer video calling.
          </p>

          {!isJoining ? (
            <div className="flex flex-col gap-3 mt-4">
              <button
                className="btn btn-primary"
                onClick={createMeeting}
              >
                Create Meeting
              </button>

              <button
                className="btn btn-outline"
                onClick={() => setIsJoining(true)}
              >
                Join Meeting
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              <input
                type="text"
                placeholder="Enter meeting ID"
                className="input input-bordered w-full"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
              />

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={joinMeeting}
                >
                  Join
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setIsJoining(false);
                    setRoomId("");
                  }}
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Lobby;