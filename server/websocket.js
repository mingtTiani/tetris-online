const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`Tetris WebSocket server is running on ws://localhost:${PORT}`);
});

const rooms = new Map(); // roomId -> [ws1, ws2, ...]

function broadcast(roomId, sender, message) {
  const clients = rooms.get(roomId);
  if (!clients) {
    return;
  }
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function notifyRoomState(roomId) {
  const clients = rooms.get(roomId);
  if (!clients) {
    return;
  }
  const count = clients.filter(c => c.readyState === WebSocket.OPEN).length;
  const data = JSON.stringify({ type: 'ROOM_STATE', count });
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws) => {
  let currentRoom = null;

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (e) {
      console.error('Invalid message:', raw);
      return;
    }

    if (message.type === 'JOIN') {
      const roomId = message.roomId;
      if (!roomId) {
        return;
      }
      currentRoom = roomId;
      if (!rooms.has(roomId)) {
        rooms.set(roomId, []);
      }
      const clients = rooms.get(roomId);
      if (!clients.includes(ws)) {
        clients.push(ws);
      }
      notifyRoomState(roomId);
      return;
    }

    if (message.type === 'SYNC' && currentRoom) {
      broadcast(currentRoom, ws, {
        type: 'SYNC',
        state: message.state,
      });
    }
  });

  ws.on('close', () => {
    if (currentRoom && rooms.has(currentRoom)) {
      const clients = rooms.get(currentRoom);
      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        rooms.delete(currentRoom);
      } else {
        notifyRoomState(currentRoom);
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});
