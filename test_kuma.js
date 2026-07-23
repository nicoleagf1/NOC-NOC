const { io } = require("socket.io-client");
const socket = io("http://localhost:3001", { transports: ['websocket'] }); // Assuming Uptime Kuma is on 3001
socket.on("connect", () => {
    console.log("Connected to Kuma");
    socket.emit("login", { username: "admin", password: "password", token: "" }, (res) => {
        console.log("Login:", res);
        socket.emit("add", {
            type: "ping",
            name: "Test Ping",
            hostname: "192.168.0.215",
            interval: 60,
            retryInterval: 60,
            maxretries: 0
        }, (addRes) => {
            console.log("Add:", addRes);
            socket.disconnect();
        });
    });
});
socket.on("connect_error", (err) => console.log("Conn error:", err));
