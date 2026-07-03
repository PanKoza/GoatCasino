require('dotenv').config();
const http    = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors    = require('cors');
const { Server } = require('socket.io');
const jwt     = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const gameManager = require('./game/gameManager');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true },
});

gameManager.init(io);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json({ limit: '16kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera.' });
});

// ── Socket.io auth middleware ─────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Brak tokenu'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = payload.sub;
    socket.username = payload.username; // may be undefined for old tokens
    next();
  } catch {
    next(new Error('Nieprawidłowy token'));
  }
});

// ── Socket.io connection ──────────────────────────────────────────
io.on('connection', async (socket) => {
  // Fetch username if not in token
  if (!socket.username) {
    try {
      const User = require('./models/User');
      const user = await User.findById(socket.userId).select('username');
      socket.username = user?.username ?? 'Gracz';
    } catch { socket.username = 'Gracz'; }
  }

  console.log(`[Socket] ${socket.username} połączony (${socket.id})`);

  const user = { id: socket.userId, username: socket.username };

  socket.on('queue:join',    ()           => gameManager.joinQueue(socket, user));
  socket.on('queue:leave',   ()           => gameManager.leaveQueue(socket.id));
  socket.on('game:bet',      (bet)        => gameManager.setBet(socket.id, bet));
  socket.on('game:ready',    ()           => gameManager.setReady(socket.id));
  socket.on('game:action',   (action)     => gameManager.playerAction(socket.id, action));
  socket.on('disconnect',    ()           => {
    gameManager.handleDisconnect(socket.id);
    console.log(`[Socket] ${socket.username} rozłączony`);
  });
});

// ── Start ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Połączono z MongoDB');
    server.listen(PORT, () => console.log(`🚀 Serwer działa na http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ Błąd połączenia z MongoDB:', err.message);
    process.exit(1);
  });

