const players = new Map();
const scene = document.querySelector('#scene');
const playerLayer = document.querySelector('#players');
const messages = document.querySelector('#messages');
const nameInput = document.querySelector('#name');
const colorInput = document.querySelector('#color');
let style = 'snowman';
let ownId = '';
let room = 'plaza';
let socket;

function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${location.host}`);
  socket.addEventListener('open', () => {
    document.querySelector('.connection').classList.add('online');
    document.querySelector('#online').textContent = 'Connected';
    socket.send(JSON.stringify({ type: 'join', room, name: nameInput.value, style, color: colorInput.value }));
  });
  socket.addEventListener('message', ({ data }) => handle(JSON.parse(data)));
  socket.addEventListener('close', () => {
    document.querySelector('.connection').classList.remove('online');
    document.querySelector('#online').textContent = 'Reconnecting…';
    setTimeout(connect, 1800);
  });
}
function send(type, data = {}) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...data }));
}
function addPlayer(player) {
  const element = document.createElement('div');
  element.className = 'avatar';
  element.innerHTML = '<div class="hat"></div><div class="head"></div><div class="eyes">● ●</div><div class="nose"></div><div class="scarf"></div><div class="body"></div><div class="nameplate"></div>';
  playerLayer.append(element);
  player.element = element;
  players.set(player.id, player);
  draw(player);
}
function draw(player) {
  player.element.style.left = `${player.x}%`;
  player.element.style.top = `${player.y}%`;
  player.element.style.setProperty('--scarf', player.color);
  player.element.querySelector('.nameplate').textContent = player.id === ownId ? `${player.name} (you)` : player.name;
  player.element.querySelector('.hat').style.background = player.style === 'snowwoman' ? '#bb7e9b' : '#6b91a9';
}
function handle(message) {
  if (message.type === 'welcome') {
    ownId = message.id;
    for (const old of players.values()) old.element.remove();
    players.clear();
    addPlayer({ id: ownId, name: nameInput.value || 'Snowfriend', style, color: colorInput.value, x: 50, y: 65 });
    message.players.forEach(addPlayer);
    document.querySelector('#online').textContent = `${players.size} here`;
  } else if (message.type === 'join') {
    addPlayer(message.player); updateCount();
    addMessage('notice', `${message.player.name} joined the room`);
  } else if (message.type === 'leave') {
    players.get(message.id)?.element.remove(); players.delete(message.id); updateCount();
  } else if (message.type === 'move') {
    const player = players.get(message.id);
    if (player) { player.x = message.x; player.y = message.y; draw(player); }
  } else if (message.type === 'emote') {
    const player = players.get(message.id);
    if (player) { const bubble = document.createElement('span'); bubble.className = 'bubble'; bubble.textContent = message.emote; player.element.append(bubble); setTimeout(() => bubble.remove(), 1300); }
  } else if (message.type === 'chat') addMessage(message.name, message.message);
}
function updateCount() { document.querySelector('#online').textContent = `${players.size} here`; }
function addMessage(name, text) {
  const line = document.createElement('p');
  line.className = name === 'notice' ? 'notice' : 'message';
  if (name === 'notice') line.textContent = text;
  else { const who = document.createElement('b'); who.textContent = `${name}: `; line.append(who, document.createTextNode(text)); }
  messages.append(line); messages.scrollTop = messages.scrollHeight;
  while (messages.children.length > 30) messages.firstElementChild.remove();
}
scene.addEventListener('pointerdown', event => {
  if (event.target.closest('button,input')) return;
  const bounds = scene.getBoundingClientRect();
  const x = Math.max(8, Math.min(92, (event.clientX - bounds.left) / bounds.width * 100));
  const y = Math.max(28, Math.min(83, (event.clientY - bounds.top) / bounds.height * 100));
  const me = players.get(ownId);
  if (me) { me.x = x; me.y = y; draw(me); send('move', { x, y }); }
});
document.querySelectorAll('.room').forEach(button => button.addEventListener('click', () => {
  room = button.dataset.room;
  document.querySelectorAll('.room').forEach(item => item.classList.toggle('active', item === button));
  document.querySelector('#room-title').textContent = room === 'plaza' ? 'Frostberry Plaza' : 'Moon-glass Ice Lake';
  scene.classList.toggle('lake', room === 'ice-lake'); send('room', { room });
}));
document.querySelector('#man').addEventListener('click', () => setStyle('snowman'));
document.querySelector('#woman').addEventListener('click', () => setStyle('snowwoman'));
function setStyle(value) {
  style = value;
  document.querySelector('#man').classList.toggle('selected', style === 'snowman');
  document.querySelector('#woman').classList.toggle('selected', style === 'snowwoman');
  const me = players.get(ownId);
  if (me) { me.style = style; draw(me); }
}
nameInput.addEventListener('change', () => {
  const me = players.get(ownId);
  if (me) { me.name = nameInput.value.slice(0, 16) || 'Snowfriend'; draw(me); }
});
colorInput.addEventListener('input', () => {
  const me = players.get(ownId);
  if (me) { me.color = colorInput.value; draw(me); }
});
document.querySelectorAll('[data-emote]').forEach(button => button.addEventListener('click', () => send('emote', { emote: button.dataset.emote })));
document.querySelector('#chat-form').addEventListener('submit', event => {
  event.preventDefault();
  const input = document.querySelector('#chat-input');
  const message = input.value.trim().slice(0, 100);
  if (message) { send('chat', { message }); input.value = ''; }
});
connect();
