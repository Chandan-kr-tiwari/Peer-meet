import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import socket from "../socket";

function Meeting() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState("Connecting...");
  const [hasRemoteUser, setHasRemoteUser] = useState(false);
  const [showLeaveNotification, setShowLeaveNotification] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteSocketId = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId) return;

    const startCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStream.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      peerConnection.current = new RTCPeerConnection();

      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });

      peerConnection.current.ontrack = (event) => {
        console.log("Remote track received");

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }

        setHasRemoteUser(true);
      };

      peerConnection.current.onicecandidate = (event) => {
        if (!event.candidate || !remoteSocketId.current) {
          return;
        }

        console.log("Sending ICE candidate");

        socket.emit("ice-candidate", {
          targetSocketId: remoteSocketId.current,
          candidate: event.candidate,
        });
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current?.connectionState;

        console.log("Connection state:", state);

        if (state) {
          setConnectionState(state);
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        console.log(
          "ICE connection state:",
          peerConnection.current?.iceConnectionState,
        );
      };
    };

    const handleConnect = () => {
      console.log("Connected:", socket.id);

      socket.emit("join-room", roomId);
    };

    const handleUserJoined = async (data: { socketId: string }) => {
      console.log("New user joined:", data.socketId);

      if (remoteSocketId.current) {
        console.log(
          "Already connected to a peer. Ignoring user-joined.",
        );
        return;
      }

      remoteSocketId.current = data.socketId;
      setHasRemoteUser(true);

      if (!peerConnection.current) {
        return;
      }

      const offer = await peerConnection.current.createOffer();

      await peerConnection.current.setLocalDescription(offer);

      console.log("Sending offer");

      socket.emit("offer", {
        targetSocketId: data.socketId,
        offer,
      });
    };

    const handleOffer = async (data: {
      offer: RTCSessionDescriptionInit;
      senderSocketId: string;
    }) => {
      console.log("Offer received from:", data.senderSocketId);

      if (
        remoteSocketId.current &&
        remoteSocketId.current !== data.senderSocketId
      ) {
        console.log("Ignoring offer from another peer.");
        return;
      }

      remoteSocketId.current = data.senderSocketId;
      setHasRemoteUser(true);

      if (!peerConnection.current) {
        return;
      }

      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        console.log("Remote description set");

        const answer =
          await peerConnection.current.createAnswer();

        await peerConnection.current.setLocalDescription(answer);

        console.log("Sending answer");

        socket.emit("answer", {
          targetSocketId: data.senderSocketId,
          answer,
        });
      } catch (error) {
        console.error("Failed to handle offer:", error);
      }
    };

    const handleAnswer = async (data: {
      answer: RTCSessionDescriptionInit;
      senderSocketId: string;
    }) => {
      console.log("Answer received from:", data.senderSocketId);

      remoteSocketId.current = data.senderSocketId;

      if (!peerConnection.current) {
        return;
      }

      try {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );

        console.log("Answer remote description set");
      } catch (error) {
        console.error("Failed to set answer:", error);
      }
    };

    const handleIceCandidate = async (data: {
      candidate: RTCIceCandidateInit;
      senderSocketId: string;
    }) => {
      console.log(
        "ICE candidate received from:",
        data.senderSocketId,
      );

      remoteSocketId.current = data.senderSocketId;

      if (!peerConnection.current) {
        return;
      }

      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );

        console.log("ICE candidate added");
      } catch (error) {
        console.error(
          "Failed to add ICE candidate:",
          error,
        );
      }
    };

    const handleUserLeft = (data: { socketId: string }) => {
      console.log("User left:", data.socketId);

      if (remoteSocketId.current !== data.socketId) {
        return;
      }

      remoteSocketId.current = null;

      setHasRemoteUser(false);
      setShowLeaveNotification(true);

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      peerConnection.current?.close();
      peerConnection.current = null;

      setConnectionState("Waiting for user...");

      setTimeout(() => {
        setShowLeaveNotification(false);
      }, 3000);
    };

    const start = async () => {
      try {
        await startCamera();
      } catch (error) {
        console.error(
          "Failed to access camera/microphone:",
          error,
        );

        setConnectionState(
          "Camera/Microphone unavailable",
        );

        return;
      }

      socket.on("connect", handleConnect);
      socket.on("user-joined", handleUserJoined);
      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);
      socket.on("user-left", handleUserLeft);

      socket.connect();
    };

    start();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("user-left", handleUserLeft);

      localStream.current
        ?.getTracks()
        .forEach((track) => track.stop());

      localStream.current = null;

      peerConnection.current?.close();
      peerConnection.current = null;

      remoteSocketId.current = null;

      socket.disconnect();
    };
  }, [roomId]);

  const toggleMute = () => {
    const audioTrack =
      localStream.current?.getAudioTracks()[0];

    if (!audioTrack) {
      return;
    }

    audioTrack.enabled = !audioTrack.enabled;

    setIsMuted(!audioTrack.enabled);
  };

  const toggleCamera = () => {
    const videoTrack =
      localStream.current?.getVideoTracks()[0];

    if (!videoTrack) {
      return;
    }

    videoTrack.enabled = !videoTrack.enabled;

    setIsCameraOff(!videoTrack.enabled);
  };

  const leaveMeeting = () => {
    localStream.current
      ?.getTracks()
      .forEach((track) => track.stop());

    localStream.current = null;

    peerConnection.current?.close();
    peerConnection.current = null;

    remoteSocketId.current = null;

    socket.disconnect();

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Leave notification */}
      {showLeaveNotification && (
        <div className="alert alert-info fixed top-6 right-6 w-auto z-50 shadow-lg">
          <span>👋 User left the meeting</span>
        </div>
      )}

      {/* Header */}
      <header className="navbar bg-base-100 shadow-sm px-6">
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            PeerMeet
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`badge ${
              connectionState === "connected"
                ? "badge-success"
                : "badge-warning"
            }`}
          >
            {connectionState}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Meeting Room
          </h2>

          <p className="text-sm text-base-content/60 mt-1">
            Room ID: {roomId}
          </p>
        </div>

        {/* Videos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-6xl">
          {/* Local video */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                You
              </h3>

              <div className="relative">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full aspect-video object-cover rounded-lg bg-black"
                />

                {isCameraOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral rounded-lg">
                    <span className="text-5xl">
                      📹
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remote video */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">
                Remote User
              </h3>

              <div className="relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full aspect-video object-cover rounded-lg bg-black"
                />

                {!hasRemoteUser && (
                  <div className="absolute inset-0 flex items-center justify-center bg-neutral rounded-lg">
                    <div className="text-center">
                      <div className="text-5xl mb-3">
                        👤
                      </div>

                      <p className="text-white">
                        Waiting for someone to join...
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className={`btn ${
              isMuted
                ? "btn-warning"
                : "btn-primary"
            }`}
            onClick={toggleMute}
          >
            {isMuted
              ? "🔇 Unmute"
              : "🎤 Mute"}
          </button>

          <button
            className={`btn ${
              isCameraOff
                ? "btn-warning"
                : "btn-primary"
            }`}
            onClick={toggleCamera}
          >
            {isCameraOff
              ? "📹 Turn Camera On"
              : "📹 Turn Camera Off"}
          </button>

          <button
            className="btn btn-error"
            onClick={leaveMeeting}
          >
            📞 Leave
          </button>
        </div>
      </main>
    </div>
  );
}

export default Meeting;