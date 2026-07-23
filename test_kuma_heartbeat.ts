import { connectionService } from './src/lib/services/connectionService';
import { io } from 'socket.io-client';

async function run() {
  const kumaConn = await connectionService.getActiveConnection('uptime-kuma');
  if (!kumaConn) return console.log("No kuma conn");

  const socket = io(kumaConn.url, { transports: ['websocket'] });
  
  socket.on('connect', () => {
    const [username, password] = kumaConn.authCredentials.split(':');
    socket.emit('login', { username, password }, (resAuth) => {
        console.log("Login OK:", resAuth.ok);
    });
  });

  socket.onAny((eventName, ...args) => {
    if (eventName === 'heartbeatList' || eventName === 'heartbeat') {
      console.log(eventName, JSON.stringify(args, null, 2));
    }
  });
  
  setTimeout(() => {
      console.log("Timeout");
      socket.disconnect();
      process.exit(0);
  }, 15000);
}
run();
