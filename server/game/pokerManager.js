// ── Texas Hold'em Online Manager ─────────────────────────────────
const SMALL_BLIND = 25;
const BIG_BLIND   = 50;
const START_CHIPS = 500;
const ACTION_TIMEOUT_MS = 30000;

let _io = null;
const rooms = {};          // roomId -> room
const socketToRoom = {};   // socketId -> roomId

function init(io) { _io = io; }

// ── Deck ──────────────────────────────────────────────────────────
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const SUITS = ['♠','♥','♦','♣'];

function createDeck() {
  const deck = [];
  for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });
  for (let i = deck.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ── Hand evaluation (same logic as client) ────────────────────────
function rankVal(r) { return RANKS.indexOf(r); }
function choose5(cards) {
  const r = [];
  const n = cards.length;
  for (let a=0;a<n-4;a++) for (let b=a+1;b<n-3;b++) for (let c=b+1;c<n-2;c++)
  for (let d=c+1;d<n-1;d++) for (let e=d+1;e<n;e++) r.push([cards[a],cards[b],cards[c],cards[d],cards[e]]);
  return r;
}
function checkStraight(vals) {
  const u = [...new Set(vals)].sort((a,b)=>b-a);
  for (let i=0;i<=u.length-5;i++) if(u[i]-u[i+4]===4) return {is:true,high:u[i]};
  if([12,0,1,2,3].every(v=>u.includes(v))) return {is:true,high:3};
  return {is:false};
}
function eval5(cards) {
  const s=[...cards].sort((a,b)=>rankVal(b.rank)-rankVal(a.rank));
  const vals=s.map(c=>rankVal(c.rank)), suits=s.map(c=>c.suit);
  const flush=suits.every(x=>x===suits[0]), str=checkStraight(vals);
  const cnt={};for(const v of vals)cnt[v]=(cnt[v]||0)+1;
  const g=Object.entries(cnt).sort((a,b)=>b[1]-a[1]||b[0]-a[0]).map(([k,v])=>({v:+k,c:v}));
  if(flush&&str.is) return{rank:8,tb:[str.high]};
  if(g[0].c===4)return{rank:7,tb:[g[0].v,g[1].v]};
  if(g[0].c===3&&g[1]?.c===2)return{rank:6,tb:[g[0].v,g[1].v]};
  if(flush)return{rank:5,tb:vals};if(str.is)return{rank:4,tb:[str.high]};
  if(g[0].c===3)return{rank:3,tb:[g[0].v,g[1]?.v,g[2]?.v]};
  if(g[0].c===2&&g[1]?.c===2)return{rank:2,tb:[Math.max(g[0].v,g[1].v),Math.min(g[0].v,g[1].v),g[2]?.v]};
  if(g[0].c===2)return{rank:1,tb:[g[0].v,g[1]?.v,g[2]?.v,g[3]?.v]};
  return{rank:0,tb:vals};
}
function cmpEval(a,b){
  if(a.rank!==b.rank)return a.rank-b.rank;
  for(let i=0;i<Math.max(a.tb.length,b.tb.length);i++){const d=(a.tb[i]??-1)-(b.tb[i]??-1);if(d)return d;}
  return 0;
}
function evaluateHand(cards){
  if(cards.length<5)return null;
  const combos=cards.length===5?[cards]:choose5(cards);
  return combos.reduce((best,c)=>{const e=eval5(c);return!best||cmpEval(e,best)>0?e:best;},null);
}

// ── Winners ───────────────────────────────────────────────────────
function determineWinners(players, community) {
  const active = players.filter(p => !p.folded);
  if (active.length === 1) return [active[0].id];
  const evs = active.map(p => ({ id: p.id, ev: evaluateHand([...p.hand, ...community]) }));
  const best = evs.reduce((b,e)=>cmpEval(e.ev,b.ev)>0?e:b,evs[0]);
  return evs.filter(e=>cmpEval(e.ev,best.ev)===0).map(e=>e.id);
}

// ── Broadcast ─────────────────────────────────────────────────────
function broadcast(room) {
  room.players.forEach(p => {
    if (!p.socketId) return;
    const state = {
      phase: room.phase,
      community: room.community,
      pot: room.pot,
      currentBet: room.currentBet,
      minRaise: room.minRaise,
      activeIdx: room.activeIdx,
      dealerIdx: room.dealerIdx,
      winners: room.winners,
      log: room.log.slice(-5),
      players: room.players.map((pl, i) => ({
        id: pl.id,
        name: pl.name,
        chips: pl.chips,
        folded: pl.folded,
        allIn: pl.allIn,
        currentBet: pl.currentBet,
        isDealer: pl.isDealer,
        isSB: pl.isSB,
        isBB: pl.isBB,
        // Only reveal hand to owner or in showdown
        hand: (pl.id === p.id || room.phase === 'showdown') ? pl.hand : pl.hand.map(() => null),
      })),
      myIdx: room.players.findIndex(pl => pl.id === p.id),
    };
    _io.to(p.socketId).emit('poker:state', state);
  });
}

function broadcastRoomList() {
  const list = Object.values(rooms)
    .filter(r => r.phase === 'lobby' && !r.started)
    .map(r => ({
      id: r.id,
      host: r.players[0]?.name,
      players: r.players.length,
      maxPlayers: r.maxPlayers,
    }));
  _io.emit('poker:rooms', list);
}

// ── Room lifecycle ────────────────────────────────────────────────
function createRoom(socket, user, maxPlayers) {
  const roomId = `pk-${Date.now()}-${Math.random().toString(36).slice(2,5)}`;
  const room = {
    id: roomId,
    maxPlayers: Math.min(5, Math.max(2, maxPlayers || 5)),
    phase: 'lobby',
    started: false,
    deck: [],
    community: [],
    pot: 0,
    players: [{
      id: user.id,
      name: user.username,
      socketId: socket.id,
      chips: START_CHIPS,
      hand: [],
      folded: false,
      allIn: false,
      currentBet: 0,
      totalBet: 0,
      isDealer: false,
      isSB: false,
      isBB: false,
      leftGame: false,
    }],
    activeIdx: -1,
    dealerIdx: 0,
    currentBet: 0,
    minRaise: BIG_BLIND,
    raiseCount: 0,
    lastAggressorIdx: -1,
    acted: [],
    winners: [],
    log: ['Pokój utworzony. Czekam na graczy...'],
    handOver: false,
    actionTimer: null,
  };
  rooms[roomId] = room;
  socketToRoom[socket.id] = roomId;
  socket.join(roomId);
  socket.emit('poker:created', { roomId });
  broadcastRoomList();
  broadcast(room);
}

function joinRoom(socket, user, roomId) {
  const room = rooms[roomId];
  if (!room || room.started || room.players.length >= room.maxPlayers) {
    return socket.emit('poker:error', 'Nie można dołączyć do pokoju.');
  }
  if (room.players.find(p => p.id === user.id)) {
    // Reconnect
    room.players.find(p => p.id === user.id).socketId = socket.id;
    socketToRoom[socket.id] = roomId;
    socket.join(roomId);
    broadcast(room);
    return;
  }
  room.players.push({
    id: user.id, name: user.username, socketId: socket.id,
    chips: START_CHIPS, hand: [], folded: false, allIn: false,
    currentBet: 0, totalBet: 0, isDealer:false, isSB:false, isBB:false,
    leftGame: false,
  });
  socketToRoom[socket.id] = roomId;
  socket.join(roomId);
  socket.emit('poker:joined');
  room.log.push(`${user.username} dołączył.`);
  broadcastRoomList();
  broadcast(room);
}

function leaveRoom(socketId) {
  const roomId = socketToRoom[socketId];
  if (!roomId) return;
  const room = rooms[roomId];
  if (!room) return;
  delete socketToRoom[socketId];

  if (!room.started) {
    // Pre-game: just remove the player
    room.players = room.players.filter(p => p.socketId !== socketId);
    if (room.players.length === 0) {
      delete rooms[roomId];
    } else {
      room.log.push('Gracz opuścił pokój.');
      broadcast(room);
    }
    broadcastRoomList();
  } else {
    // Mid-game: fold the player immediately and mark for removal on next hand
    const p = room.players.find(p => p.socketId === socketId);
    if (!p) return;
    p.socketId = null;
    p.leftGame = true;

    const wasActive = room.players[room.activeIdx]?.id === p.id;

    if (!p.folded && !room.handOver) {
      p.folded = true;
      room.log.push(`${p.name} opuścił grę – automatyczny fold.`);
    }

    if (wasActive && !room.handOver) {
      clearActionTimeout(room);
      advanceRoom(room);
    } else {
      broadcast(room);
    }
  }
}

function startGame(socketId) {
  const roomId = socketToRoom[socketId];
  const room = rooms[roomId];
  if (!room || room.started || room.players.length < 2) return;
  if (room.players[0].socketId !== socketId) return; // only host
  room.started = true;
  broadcastRoomList();
  dealHand(room);
}

// ── Deal ──────────────────────────────────────────────────────────
function dealHand(room) {
  const deck = createDeck();
  const n = room.players.length;
  const dealerIdx = room.dealerIdx % n;
  const sbIdx = (dealerIdx + 1) % n;
  const bbIdx = (dealerIdx + 2) % n;
  const utg   = (dealerIdx + 3) % n;

  room.deck = deck;
  room.community = [];
  room.pot = 0;
  room.winners = [];
  room.handOver = false;
  room.phase = 'preflop';

  room.players.forEach((p, i) => {
    p.hand = [deck.pop(), deck.pop()];
    p.folded = false;
    p.allIn = false;
    p.currentBet = 0;
    p.totalBet = 0;
    p.isDealer = i === dealerIdx;
    p.isSB = i === sbIdx;
    p.isBB = i === bbIdx;
  });

  // Blinds
  const sb = Math.min(SMALL_BLIND, room.players[sbIdx].chips);
  room.players[sbIdx].chips -= sb;
  room.players[sbIdx].currentBet = sb;
  room.players[sbIdx].totalBet = sb;
  room.pot += sb;
  if (room.players[sbIdx].chips === 0) room.players[sbIdx].allIn = true;

  const bb = Math.min(BIG_BLIND, room.players[bbIdx].chips);
  room.players[bbIdx].chips -= bb;
  room.players[bbIdx].currentBet = bb;
  room.players[bbIdx].totalBet = bb;
  room.pot += bb;
  if (room.players[bbIdx].chips === 0) room.players[bbIdx].allIn = true;

  room.currentBet = bb; // actual BB posted (may be < BIG_BLIND if player is short-stacked)
  room.minRaise = BIG_BLIND;
  room.raiseCount = 0;
  room.lastAggressorIdx = bbIdx;
  room.acted = [];
  room.log = [`Nowa ręka! SB: $${sb}, BB: $${bb}`];

  let firstIdx = utg;
  let tries = 0;
  while ((room.players[firstIdx].folded || room.players[firstIdx].allIn) && tries < n) {
    firstIdx = (firstIdx + 1) % n;
    tries++;
  }
  if (room.players[firstIdx].folded || room.players[firstIdx].allIn) firstIdx = -1;
  room.activeIdx = firstIdx;

  broadcast(room);
  if (room.activeIdx >= 0) scheduleActionTimeout(room);
}

// ── Action ────────────────────────────────────────────────────────
function playerAction(socketId, action, amount) {
  const roomId = socketToRoom[socketId];
  const room = rooms[roomId];
  if (!room || room.handOver) return;

  const active = room.players[room.activeIdx];
  if (!active || active.socketId !== socketId) return;

  clearActionTimeout(room);

  const toCall = room.currentBet - active.currentBet;

  if (action === 'fold') {
    active.folded = true;
    room.log.push(`${active.name} folduje.`);
  } else if (action === 'check') {
    if (toCall > 0) return; // illegal
    room.log.push(`${active.name} czekuje.`);
  } else if (action === 'call') {
    const amt = Math.min(toCall, active.chips);
    active.chips -= amt;
    active.currentBet += amt;
    active.totalBet += amt;
    room.pot += amt;
    if (active.chips === 0) active.allIn = true;
    room.log.push(`${active.name} sprawdza $${amt}.`);
  } else if (action === 'raise') {
    const raise = Math.max(room.minRaise, Math.min(+amount || 0, active.chips - toCall));
    const total = Math.min(toCall + raise, active.chips);
    active.chips -= total;
    active.currentBet += total;
    active.totalBet += total;
    room.pot += total;
    room.minRaise = active.currentBet - room.currentBet;
    room.currentBet = active.currentBet;
    room.lastAggressorIdx = room.activeIdx;
    room.raiseCount++;
    if (active.chips === 0) active.allIn = true;
    room.log.push(`${active.name} podbija do $${active.currentBet}.`);
  }

  // Track that this player acted this street
  if (!room.acted.includes(active.id)) room.acted.push(active.id);

  advanceRoom(room);
}

function advanceRoom(room) {
  const nonFolded = room.players.filter(p => !p.folded);

  // Only one left
  if (nonFolded.length === 1) {
    nonFolded[0].chips += room.pot;
    room.winners = [nonFolded[0].id];
    room.phase = 'showdown';
    room.handOver = true;
    room.log.push(`${nonFolded[0].name} wygrywa $${room.pot}!`);
    broadcast(room);
    scheduleNextHand(room);
    return;
  }

  // Advance to next player
  const n = room.players.length;
  let nextIdx = (room.activeIdx + 1) % n;
  let loops = 0;
  while ((room.players[nextIdx].folded || room.players[nextIdx].allIn) && loops < n) {
    nextIdx = (nextIdx + 1) % n;
    loops++;
  }

  // Check if betting round is done
  const canAct = room.players.filter(p => !p.folded && !p.allIn);
  const allActed   = canAct.every(p => (room.acted ?? []).includes(p.id));
  const allMatched = canAct.every(p => p.currentBet === room.currentBet);
  const bettingDone = canAct.length === 0 || (allActed && allMatched);

  if (bettingDone) {
    if (room.phase === 'river') {
      return resolveShowdown(room);
    }
    // All-in: clear any pending timer and run out the board automatically
    if (canAct.length <= 1) {
      clearActionTimeout(room);
      while (['preflop','flop','turn'].includes(room.phase)) {
        advanceStreet(room, true); // skipTimer=true – no timeouts during all-in runout
        if (room.community.length >= 5) break;
      }
      return resolveShowdown(room);
    }
    return advanceStreet(room);
  }

  room.activeIdx = nextIdx;
  broadcast(room);
  scheduleActionTimeout(room);
}

function advanceStreet(room, skipTimer = false) {
  const deck = room.deck;
  if (room.phase === 'preflop') {
    deck.pop();
    room.community = [deck.pop(), deck.pop(), deck.pop()];
    room.phase = 'flop';
    room.log.push('Flop odkryty.');
  } else if (room.phase === 'flop') {
    deck.pop();
    room.community.push(deck.pop());
    room.phase = 'turn';
    room.log.push('Turn odkryty.');
  } else if (room.phase === 'turn') {
    deck.pop();
    room.community.push(deck.pop());
    room.phase = 'river';
    room.log.push('River odkryty.');
  }

  room.players.forEach(p => { p.currentBet = 0; });
  room.currentBet = 0;
  room.minRaise = BIG_BLIND;
  room.raiseCount = 0;
  room.lastAggressorIdx = -1;
  room.acted = [];

  const n = room.players.length;
  let firstIdx = (room.dealerIdx + 1) % n;
  let loops = 0;
  while ((room.players[firstIdx].folded || room.players[firstIdx].allIn) && loops < n) {
    firstIdx = (firstIdx + 1) % n;
    loops++;
  }
  room.activeIdx = room.players[firstIdx].folded || room.players[firstIdx].allIn ? -1 : firstIdx;

  broadcast(room);
  if (!skipTimer && room.activeIdx >= 0) scheduleActionTimeout(room);
}

function resolveShowdown(room) {
  const winnerIds = determineWinners(room.players, room.community);
  const split = Math.floor(room.pot / winnerIds.length);
  winnerIds.forEach((id, i) => {
    const p = room.players.find(pl => pl.id === id);
    if (p) p.chips += split + (i === 0 ? room.pot - split * winnerIds.length : 0);
  });
  room.winners = winnerIds;
  room.phase = 'showdown';
  room.handOver = true;
  const names = winnerIds.map(id => room.players.find(p=>p.id===id)?.name).join(', ');
  room.log.push(`Showdown: ${names} wygrywa $${room.pot}!`);
  broadcast(room);
  scheduleNextHand(room);
}

function scheduleNextHand(room) {
  setTimeout(() => {
    if (!rooms[room.id]) return;
    // Remove busted players and players who left
    room.players = room.players.filter(p => p.chips > 0 && !p.leftGame);
    if (room.players.length === 0) {
      // Everyone left – clean up the room
      clearActionTimeout(room);
      delete rooms[room.id];
      broadcastRoomList();
      return;
    }
    if (room.players.length < 2) {
      const winner = room.players[0];
      room.log.push(`${winner.name} wygrywa grę!`);
      room.phase = 'game_over';
      broadcast(room);
      // Clean up after a short delay so clients can show game_over screen
      setTimeout(() => { delete rooms[room.id]; broadcastRoomList(); }, 15000);
      return;
    }
    room.dealerIdx = (room.dealerIdx + 1) % room.players.length;
    dealHand(room);
  }, 6000);
}

// ── Action timeout (auto-fold) ─────────────────────────────────────
function scheduleActionTimeout(room) {
  clearActionTimeout(room); // always clear before scheduling to prevent stale timers
  room.actionTimer = setTimeout(() => {
    if (room.handOver) return; // hand already resolved – do nothing
    const active = room.players[room.activeIdx];
    if (!active) return;
    room.log.push(`${active.name} przekroczył czas – automatyczny fold.`);
    active.folded = true;
    advanceRoom(room);
  }, ACTION_TIMEOUT_MS);
}
function clearActionTimeout(room) {
  if (room.actionTimer) { clearTimeout(room.actionTimer); room.actionTimer = null; }
}

// ── Exports ───────────────────────────────────────────────────────
module.exports = {
  init,
  createRoom,
  joinRoom,
  leaveRoom,
  startGame,
  playerAction,
  getRooms: () => Object.values(rooms).filter(r => r.phase === 'lobby' && !r.started)
    .map(r => ({ id:r.id, host:r.players[0]?.name, players:r.players.length, maxPlayers:r.maxPlayers })),
};
