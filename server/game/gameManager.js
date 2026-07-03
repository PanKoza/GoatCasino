const { createDeck, handTotal, isBust, isBlackjack } = require('./blackjack');

const SESSION_START = 500;
const WIN_TARGET    = 1000;
const ROUND_RESET_MS = 6000; // delay before next round starts
const DEALER_PLAY_MS = 800;  // delay before dealer plays after both done

let _io = null;
const queue   = []; // waiting players: { socket, userId, username }
const rooms   = {}; // active rooms by roomId
const socketToRoom = {}; // socketId -> roomId

function init(io) { _io = io; }

// ── Queue ─────────────────────────────────────────────────────────
function joinQueue(socket, user) {
  // Already queued?
  if (queue.some(p => p.userId === user.id)) {
    socket.emit('queue:waiting', { size: queue.length });
    return;
  }
  // Already in a room?
  if (socketToRoom[socket.id]) {
    socket.emit('error:already-in-game');
    return;
  }
  queue.push({ socket, userId: user.id, username: user.username });
  socket.emit('queue:waiting', { size: queue.length });

  if (queue.length >= 2) {
    const p1 = queue.shift();
    const p2 = queue.shift();
    createRoom(p1, p2);
  }
}

function leaveQueue(socketId) {
  const idx = queue.findIndex(p => p.socket.id === socketId);
  if (idx !== -1) queue.splice(idx, 1);
}

// ── Room ──────────────────────────────────────────────────────────
function createRoom(p1, p2) {
  const roomId = `r-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

  const mkPlayer = (p, idx) => ({
    idx,
    socketId: p.socket.id,
    userId: p.userId,
    username: p.username,
    hand: [],
    bet: 50,
    balance: SESSION_START,
    status: 'betting', // betting | ready | playing | done | blackjack
    result: null,      // null | win | lose | draw | blackjack
  });

  const room = {
    id: roomId,
    deck: createDeck(),
    dealer: { hand: [] },
    players: [mkPlayer(p1, 0), mkPlayer(p2, 1)],
    phase: 'betting', // betting | playing | dealer | round_done | session_over
    round: 0,
  };

  rooms[roomId] = room;
  socketToRoom[p1.socket.id] = roomId;
  socketToRoom[p2.socket.id] = roomId;

  p1.socket.join(roomId);
  p2.socket.join(roomId);

  _io.to(p1.socket.id).emit('game:matched', { roomId, playerIdx: 0, opponentName: p2.username });
  _io.to(p2.socket.id).emit('game:matched', { roomId, playerIdx: 1, opponentName: p1.username });

  broadcastState(roomId);
}

// ── Player sets bet ───────────────────────────────────────────────
function setBet(socketId, bet) {
  const room = getRoom(socketId);
  if (!room || room.phase !== 'betting') return;
  const player = getPlayer(room, socketId);
  if (!player || player.status !== 'betting') return;

  const valid = [10, 25, 50, 100, 250];
  if (!valid.includes(bet) || bet > player.balance) return;

  player.bet = bet;
  broadcastState(room.id);
}

// ── Player signals ready ──────────────────────────────────────────
function setReady(socketId) {
  const room = getRoom(socketId);
  if (!room || room.phase !== 'betting') return;
  const player = getPlayer(room, socketId);
  if (!player || player.status !== 'betting') return;
  if (player.bet > player.balance) return;

  player.status = 'ready';
  broadcastState(room.id);

  if (room.players.every(p => p.status === 'ready')) {
    dealRound(room.id);
  }
}

// ── Deal ──────────────────────────────────────────────────────────
function dealRound(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.phase = 'playing';
  room.round++;

  // Safety: reshuffle if deck too small
  if (room.deck.length < 20) room.deck = createDeck();

  const pop = () => room.deck.pop();

  room.players.forEach(p => {
    p.balance -= p.bet;
    p.hand = [pop(), pop()];
    p.result = null;
    p.status = isBlackjack(p.hand) ? 'blackjack' : 'playing';
  });
  room.dealer.hand = [pop(), pop()];

  broadcastState(roomId);

  // If all done immediately (two BJs) → go to dealer
  if (room.players.every(p => p.status !== 'playing')) {
    setTimeout(() => dealerPlay(roomId), DEALER_PLAY_MS);
  }
}

// ── Player action ─────────────────────────────────────────────────
function playerAction(socketId, action) {
  const room = getRoom(socketId);
  if (!room || room.phase !== 'playing') return;
  const player = getPlayer(room, socketId);
  if (!player || player.status !== 'playing') return;

  if (action === 'hit') {
    player.hand.push(room.deck.pop());
    const total = handTotal(player.hand);
    if (isBust(player.hand) || total >= 21) player.status = 'done';
  } else if (action === 'stand') {
    player.status = 'done';
  } else if (action === 'double') {
    if (player.hand.length !== 2 || player.balance < player.bet) return;
    player.balance -= player.bet;
    player.bet    *= 2;
    player.hand.push(room.deck.pop());
    player.status = 'done';
  } else {
    return;
  }

  broadcastState(room.id);

  if (room.players.every(p => p.status !== 'playing')) {
    setTimeout(() => dealerPlay(room.id), DEALER_PLAY_MS);
  }
}

// ── Dealer plays ──────────────────────────────────────────────────
function dealerPlay(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  room.phase = 'dealer';
  while (handTotal(room.dealer.hand) < 17) {
    room.dealer.hand.push(room.deck.pop());
  }

  const dt = handTotal(room.dealer.hand);
  const dealerBJ = isBlackjack(room.dealer.hand);

  room.players.forEach(p => {
    const pt  = handTotal(p.hand);
    const pBJ = isBlackjack(p.hand);

    if (isBust(p.hand)) {
      p.result = 'lose';
    } else if (pBJ && dealerBJ) {
      p.result = 'draw';
      p.balance += p.bet;
    } else if (pBJ) {
      p.result = 'blackjack';
      p.balance += Math.floor(p.bet * 2.5);
    } else if (isBust(room.dealer.hand) || pt > dt) {
      p.result = 'win';
      p.balance += p.bet * 2;
    } else if (pt === dt) {
      p.result = 'draw';
      p.balance += p.bet;
    } else {
      p.result = 'lose';
    }
  });

  room.phase = 'round_done';
  broadcastState(roomId);

  // Check session end
  const hasWinner = room.players.some(p => p.balance >= WIN_TARGET);
  const hasBankrupt = room.players.some(p => p.balance <= 0);

  if (hasWinner || hasBankrupt) {
    room.phase = 'session_over';
    broadcastState(roomId);
    setTimeout(() => cleanRoom(roomId), 60_000);
  } else {
    // Reset for next round after delay
    setTimeout(() => {
      room.players.forEach(p => {
        p.hand   = [];
        p.result = null;
        p.status = 'betting';
        p.bet    = Math.min(p.bet, p.balance);
      });
      room.dealer.hand = [];
      room.phase = 'betting';
      broadcastState(roomId);
    }, ROUND_RESET_MS);
  }
}

// ── Disconnect ────────────────────────────────────────────────────
function handleDisconnect(socketId) {
  leaveQueue(socketId);
  const roomId = socketToRoom[socketId];
  if (!roomId) return;

  const room = rooms[roomId];
  if (!room) return;

  // Notify the other player
  const other = room.players.find(p => p.socketId !== socketId);
  if (other && room.phase !== 'session_over') {
    _io.to(other.socketId).emit('game:opponent-left');
  }

  cleanRoom(roomId);
}

function cleanRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;
  room.players.forEach(p => delete socketToRoom[p.socketId]);
  delete rooms[roomId];
}

// ── Broadcast helpers ─────────────────────────────────────────────
function broadcastState(roomId) {
  const room = rooms[roomId];
  if (!room || !_io) return;

  room.players.forEach((me, myIdx) => {
    const opp = room.players[1 - myIdx];
    const showDealer = ['dealer', 'round_done', 'session_over'].includes(room.phase);

    const state = {
      phase:  room.phase,
      round:  room.round,
      dealer: {
        hand:  showDealer ? room.dealer.hand : [room.dealer.hand[0], null],
        total: showDealer ? handTotal(room.dealer.hand) : null,
        bust:  showDealer ? isBust(room.dealer.hand) : false,
      },
      me: {
        username: me.username,
        hand:    me.hand,
        total:   handTotal(me.hand),
        bust:    isBust(me.hand),
        bet:     me.bet,
        balance: me.balance,
        status:  me.status,
        result:  me.result,
      },
      opponent: {
        username: opp.username,
        hand:    opp.hand,
        total:   handTotal(opp.hand),
        bust:    isBust(opp.hand),
        bet:     opp.bet,
        balance: opp.balance,
        status:  opp.status,
        result:  opp.result,
      },
    };

    _io.to(me.socketId).emit('game:state', state);
  });
}

function getRoom(socketId) {
  const roomId = socketToRoom[socketId];
  return roomId ? rooms[roomId] : null;
}

function getPlayer(room, socketId) {
  return room.players.find(p => p.socketId === socketId);
}

module.exports = { init, joinQueue, leaveQueue, setBet, setReady, playerAction, handleDisconnect };
