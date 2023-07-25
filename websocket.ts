import { Context } from './deps.ts';

interface MyWebSocket extends WebSocket {
  username: string;
}

const connectedClients = new Map<string, MyWebSocket>();

// deno-lint-ignore no-explicit-any
const log = (...args: any[]) => console.log(new Date(), ...args);

// send a message to all connected clients
function broadcast(message: string) {
  for (const client of connectedClients.values()) {
    client.send(message);
  }
}

// send updated users list to all connected clients
function broadcastUsernames() {
  const usernames = [...connectedClients.keys()];
  log('Sending username list to all clients: ' + JSON.stringify(usernames));
  broadcast(
    JSON.stringify({
      event: 'update-users',
      usernames: usernames,
    })
  );
}

export function handleWebSocket(ctx: Context) {
  const socket = ctx.upgrade() as MyWebSocket;

  const username = ctx.request.url.searchParams.get('username');

  if (!username) {
    log(new Date(), 'Username not provided');
    socket.close(1008, 'Username not provided');
    return;
  }

  if (connectedClients.has(username)) {
    log(new Date(), `Username ${username} is already taken`);
    socket.close(1008, `Username ${username} is already taken`);
    return;
  }

  socket.username = username;
  connectedClients.set(username, socket);
  log(`New client connected: ${username}`);

  // broadcast the active users list when a new user logs in
  socket.onopen = () => {
    broadcastUsernames();
    broadcast(
      JSON.stringify({
        event: 'send-message',
        username: socket.username,
        message: '[SYSTEM] USER JOINED',
      })
    );
  };

  // when a client disconnects, remove them from the connected clients list
  // and broadcast the active users list
  socket.onclose = () => {
    log(`Client ${socket.username} disconnected`);
    connectedClients.delete(socket.username);
    broadcastUsernames();
    broadcast(
      JSON.stringify({
        event: 'send-message',
        username: socket.username,
        message: '[SYSTEM] USER EXITED',
      })
    );
  };

  // broadcast new message if someone sent one
  socket.onmessage = (m) => {
    const data = JSON.parse(m.data);
    switch (data.event) {
      case 'send-message':
        broadcast(
          JSON.stringify({
            event: 'send-message',
            username: socket.username,
            message: data.message,
          })
        );
        break;
      case 'client-exit':
        socket.close(1000, 'Client exited actively');
        break;
    }
  };
}
