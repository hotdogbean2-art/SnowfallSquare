const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const WebSocket = require('ws');

const root = path.join(__dirname, 'public');
const rooms = new Map();
const server = http.createServer((req, res) => {
  const requested = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, requested.replace(/^\/+/, ''));
  if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, bytes) => {
    if (error) { res.writeHead(404).end('Not found'); return; }
    const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.js') ? 'text/javascript' : 'text/html';
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` }).end(bytes);
  });
});
const wss = new WebSocket.Server({ server });

function send(ws, data) { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); }
function broadcast(room, data, except) {
  for (const player of rooms.get(room)?.values() ?? []) if (player.ws !== except) send(player.ws, data);
}
function leave(ws) {
  const player = ws.player;
  if (!player) return;
  const room = rooms.get(player.room);
  room?.delete(player.id);
  broadcast(player.room, { type: 'leave', id: player.id });
  if (room?.size === 0) rooms.delete(player.room);
  ws.player = null;
}
wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (data.type === 'join') {
      leave(ws);
      const roomName = ['plaza', 'ice-lake'].includes(data.room) ? data.room : 'plaza';
      const room = rooms.get(roomName) ?? new Map();
      rooms.set(roomName, room);
      const player = {
        id: Math.random().toString(36).slice(2, 10), ws,
        name: String(data.name || 'Snowfriend').slice(0, 16),
        style: data.style === 'snowwoman' ? 'snowwoman' : 'snowman',
        color: /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : '#62aee8',
        x: 50, y: 65, room: roomName, emote: ''
      };
      ws.player = player;
      send(ws, { type: 'welcome', id: player.id, players: [...room.values()].map(({ ws: _, ...p }) => p) });
      room.set(player.id, player);
      broadcast(roomName, { type: 'join', player: { ...player, ws: undefined } }, ws);
      return;
    }
    const player = ws.player;
    if (!player) return;
    if (data.type === 'move') {
      player.x = Math.max(8, Math.min(92, Number(data.x) || player.x));
      player.y = Math.max(28, Math.min(83, Number(data.y) || player.y));
      broadcast(player.room, { type: 'move', id: player.id, x: player.x, y: player.y }, ws);
    } else if (data.type === 'emote') {
      const emote = ['❄️', '☃️', '👋', '💙'].includes(data.emote) ? data.emote : '❄️';
      broadcast(player.room, { type: 'emote', id: player.id, emote }, null);
    } else if (data.type === 'chat') {
      const message = String(data.message || '').replace(/[<>]/g, '').trim().slice(0, 100);
      if (message) broadcast(player.room, { type: 'chat', id: player.id, name: player.name, message }, null);
    } else if (data.type === 'room') {
      const roomName = data.room === 'ice-lake' ? 'ice-lake' : 'plaza';
      if (roomName !== player.room) {
        leave(ws);
        player.room = roomName; player.x = 50; player.y = 65;
        const room = rooms.get(roomName) ?? new Map(); rooms.set(roomName, room); room.set(player.id, player);
        send(ws, { type: 'welcome', id: player.id, players: [...room.values()].filter(p => p.id !== player.id).map(({ ws: _, ...p }) => p) });
        broadcast(roomName, { type: 'join', player: { ...player, ws: undefined } }, ws);
      }
    }
  });
  ws.on('close', () => leave(ws));
});
const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`Snowfall Square listening on ${port}`));
