const express = require('express');
const Keycloak = require('keycloak-connect');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const session = require('express-session');

const app = express();
app.use(cors());
app.use(express.json());

const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

const keycloak = new Keycloak({ store: memoryStore });
app.use(keycloak.middleware());

app.get('/secure-endpoint', keycloak.protect(), (req, res) => {
  res.json({ message: 'This is a secured endpoint!' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('drawing-data', (data) => {
    socket.broadcast.emit('drawing-data', data);
  });

  socket.on('chat-message', (message) => {
    socket.broadcast.emit('chat-message', message);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(5000, () => {
  console.log('Server running on port 5000');
});
