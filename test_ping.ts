import { connectionService } from './src/lib/services/connectionService';
import { io } from 'socket.io-client';

async function run() {
  const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
  if (!kumaConn) return console.log("No kuma conn");
  console.log("Kuma URL:", kumaConn.url);

  const socket = io(kumaConn.url, { transports: ['websocket'], reconnection: false });
  socket.on('connect', () => {
    console.log("Connected to Kuma");
    const [username, password] = kumaConn.authCredentials.split(':');
    socket.emit('login', { username, password, token: '' }, (resAuth) => {
      console.log("Login:", resAuth);
      if (resAuth.ok) {
        socket.emit('add', {
          type: 'ping',
          name: 'TestPing',
          hostname: '192.168.0.215',
          interval: 60,
          retryInterval: 60,
          maxretries: 0,
          upsideDown: false
        }, (resAdd) => {
          console.log("Add Ping:", resAdd);
          socket.disconnect();
          process.exit(0);
        });
      } else {
        process.exit(1);
      }
    });
  });
  socket.on('connect_error', (e) => console.log("Conn Error", e));
}
run();
