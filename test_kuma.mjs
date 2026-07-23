import { io } from "socket.io-client";

const socket = io("http://192.168.0.110:3001/", {
  transports: ["websocket"],
  reconnection: false,
  timeout: 5000,
});

socket.on("connect", () => {
  console.log("Connected to Kuma");
  
  socket.emit("login", {
    username: "administrador",
    password: "S1stemas3031*."
  }, (res) => {
    console.log("Login response:", res);
    
    if (res.ok) {
       socket.emit("add", {
          type: "http",
          name: "Test Eureka",
          url: "https://eurka.vepagos.com",
          interval: 60,
          retryInterval: 60,
          maxretries: 0,
          upsideDown: false,
          accepted_statuscodes: ["200-299"]
       }, (addRes) => {
          console.log("Add response:", addRes);
          socket.disconnect();
       });
    } else {
       socket.disconnect();
    }
  });
});

socket.on("connect_error", (err) => {
  console.error("Connect error:", err);
});
