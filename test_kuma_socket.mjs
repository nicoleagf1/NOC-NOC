import { io } from "socket.io-client";

const socket = io("http://192.168.0.110:3001/", {
  transports: ["websocket"],
  reconnection: false,
  timeout: 5000,
});

socket.on("connect", () => {
  console.log("Connected to Kuma");
  // Assuming basic auth is correct, we can't fully test auth without decrypting.
  // But we can check if it connects.
  socket.disconnect();
});

socket.on("connect_error", (err) => {
  console.error("Connect error:", err);
});
