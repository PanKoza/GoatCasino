import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createPokerDeck, determineWinners, botDecide,
  evaluateHand, suitColor,
} from '../utils/poker';
import { api } from '../api';

// ── Constants ─────────────────────────────────────────────────────
const SMALL_BLIND = 25;
const BIG_BLIND   = 50;
const START_CHIPS = 500;

const PHASE_LABEL = {
  preflop:'Pre-flop', flop:'Flop', turn:'Turn', river:'River', showdown:'Showdown',
};
const PHASE_COLOR = {
  preflop:'#6366f1', flop:'#22c55e', turn:'#f59e0b', river:'#ef4444', showdown:'#a855f7',
};

// ── Helper ────────────────────────────────────────────────────────
function nextActive(players, from) {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (!players[idx].folded && !players[idx].allIn) return idx;
  }
  return -1;
}

// ── Animated card ─────────────────────────────────────────────────
function PokerCard({ card, hidden, size = 'md', delay = 0, winner = false }) {
  const dim = size === 'sm' ? 'w-10 h-[58px]' : size === 'lg' ? 'w-[76px] h-[108px]' : 'w-[56px] h-[80px]';

  if (hidden) return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.7, opacity: 0 }}
      animate={{ rotateY: 0, scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 200 }}
      className={`${dim} rounded-xl flex items-center justify-center font-black shadow-lg`}
      style={{ background: 'linear-gradient(135deg, #1e5c3a, #0d3322)', border: '2px solid #34d399' }}
    >
      <span className="text-emerald-400 text-xl">🂠</span>
    </motion.div>
  );

  const isRed = card.suit === '♥' || card.suit === '♦';
  const col = isRed ? '#dc2626' : '#111827';

  const rankSize = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl';
  const suitSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-lg';

  return (
    <motion.div
      initial={{ rotateY: 90, y: -20, scale: 0.8, opacity: 0 }}
      animate={{ rotateY: 0, y: 0, scale: 1, opacity: 1 }}
      transition={{ delay, duration: 0.35, type: 'spring', stiffness: 260, damping: 20 }}
      className={`${dim} rounded-xl bg-white flex flex-col items-center justify-center leading-none shadow-xl relative select-none`}
      style={{
        border: winner ? '3px solid #f59e0b' : '2px solid #d1d5db',
        boxShadow: winner ? '0 0 16px rgba(245,158,11,0.7), 0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.3)',
        color: col,
      }}
    >
      <span className={`${rankSize} font-black leading-none`} style={{ color: col }}>{card.rank}</span>
      <span className={`${suitSize} leading-none mt-0.5`} style={{ color: col }}>{card.suit}</span>
    </motion.div>
  );
}

// ── Chip stack visual ──────────────────────────────────────────────
function ChipStack({ amount, small }) {
  if (!amount) return null;
  const count = Math.min(5, Math.ceil(amount / 50));
  const colors = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6'];
  return (
    <div className="flex items-end gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${small ? 'w-3 h-3' : 'w-4 h-4'} rounded-full border-2 border-white/30`}
          style={{ background: colors[i % colors.length], boxShadow: '0 1px 3px rgba(0,0,0,0.5)' }} />
      ))}
      <span className={`${small ? 'text-[9px]' : 'text-xs'} text-yellow-300 font-black ml-1`}>${amount}</span>
    </div>
  );
}

// ── Player seat (fully redesigned) ────────────────────────────────
function PlayerSeat({ player, isActive, isHuman, community, phase, position }) {
  const handEv = (isHuman || phase === 'showdown') && player.hand?.length === 2 && community.length >= 3
    ? evaluateHand([...player.hand, ...community])
    : null;
  const isWinner = phase === 'showdown' && !player.folded && handEv;

  return (
    <motion.div
      layout
      className={`flex flex-col items-center gap-1.5 relative ${player.folded ? 'opacity-40' : ''}`}
    >
      {/* Active indicator – only the card border changes, no extra elements */}

      {/* Cards area */}
      <div className={`relative rounded-2xl p-3 border-2 transition-all ${
        isActive && !player.folded
          ? 'border-yellow-400 bg-yellow-950/30'
          : isWinner ? 'border-yellow-400 bg-yellow-950/30' : 'border-gray-700/60 bg-gray-900/60'
      }`}>
        <div className="flex gap-1.5 justify-center">
          {player.hand?.length > 0
            ? player.hand.map((c, i) => (
                <PokerCard key={i} card={c} hidden={!isHuman && phase !== 'showdown'}
                  size={isHuman ? 'lg' : 'sm'} delay={i * 0.15} winner={isWinner} />
              ))
            : [0,1].map(i => (
                <div key={i} className={`${isHuman ? 'w-[72px] h-[100px]' : 'w-9 h-[52px]'} rounded-xl bg-gray-800/50 border border-gray-700/30`} />
              ))
          }
        </div>

        {/* Badges */}
        <div className="absolute -top-2.5 -right-2 flex gap-1">
          {player.isDealer && (
            <span className="text-[10px] bg-white text-gray-900 font-black rounded-full w-5 h-5 flex items-center justify-center shadow">D</span>
          )}
          {player.isSB && (
            <span className="text-[10px] bg-blue-500 text-white font-black rounded-full w-5 h-5 flex items-center justify-center shadow">S</span>
          )}
          {player.isBB && (
            <span className="text-[10px] bg-orange-500 text-white font-black rounded-full w-5 h-5 flex items-center justify-center shadow">B</span>
          )}
        </div>

        {/* All-in badge */}
        <AnimatePresence>
          {player.allIn && (
            <motion.div initial={{ scale:0 }} animate={{ scale:1 }} exit={{ scale:0 }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow">
              ALL-IN
            </motion.div>
          )}
        </AnimatePresence>

        {/* Folded overlay */}
        {player.folded && (
          <div className="absolute inset-0 rounded-2xl bg-gray-900/70 flex items-center justify-center">
            <span className="text-gray-500 font-black text-xs tracking-widest">FOLD</span>
          </div>
        )}
      </div>

      {/* Name & chips */}
      <div className="text-center min-w-0">
        <div className={`text-sm font-black truncate max-w-[90px] ${isHuman ? 'text-emerald-400' : isActive ? 'text-yellow-300' : 'text-gray-300'}`}>
          {player.name}
        </div>
        <motion.div key={player.chips} initial={{ scale:1.3 }} animate={{ scale:1 }}
          className="text-base font-black text-yellow-400">${player.chips.toLocaleString()}</motion.div>
        {player.currentBet > 0 && (
          <ChipStack amount={player.currentBet} small />
        )}
      </div>

      {/* Hand strength */}
      <AnimatePresence>
        {handEv && !player.folded && (
          <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
              isWinner ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' : 'bg-purple-900/50 text-purple-300'
            }`}>
            {isWinner && '✨ '}{handEv.name}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Confetti burst ─────────────────────────────────────────────────
function Confetti() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl z-10">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div key={i}
          initial={{ y: '110%', x: `${Math.random() * 100}%`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '-20%', opacity: [1, 1, 0], rotate: Math.random() * 720, scale: [1, 1.2, 0.5] }}
          transition={{ duration: 1.4 + Math.random() * 0.8, delay: Math.random() * 0.4, ease: 'easeOut' }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ background: ['#fbbf24','#34d399','#60a5fa','#f87171','#a78bfa','#fb923c'][i % 6] }}
        />
      ))}
    </div>
  );
}

// ── Game engine (pure functions) ──────────────────────────────────
function buildInitialState(mode) {
  const botCount = mode === '1v1' ? 1 : 4;
  const names = ['Bot Alpha','Bot Beta','Bot Gamma','Bot Delta'];
  const players = [
    { id: 0, name: 'Ty', chips: START_CHIPS, hand: [], folded: false, allIn: false,
      currentBet: 0, totalBet: 0, isHuman: true, isDealer: false, isSB: false, isBB: false },
    ...Array.from({ length: botCount }, (_, i) => ({
      id: i+1, name: names[i], chips: START_CHIPS, hand: [], folded: false, allIn: false,
      currentBet: 0, totalBet: 0, isHuman: false, isDealer: false, isSB: false, isBB: false,
    })),
  ];
  return {
    phase: 'waiting',
    deck: [],
    community: [],
    pot: 0,
    players,
    activeIdx: -1,
    dealerIdx: 0,
    currentBet: 0,
    minRaise: BIG_BLIND,
    raiseCount: 0,
    lastAggressorIdx: -1,
    acted: [],      // ids of players who acted this street
    winners: [],
    log: [],
    handOver: false,
    gameOver: false,
  };
}

function postBlindsAndDeal(state) {
  const deck = createPokerDeck();
  const n = state.players.length;
  const dealerIdx = state.dealerIdx;
  const sbIdx = (dealerIdx + 1) % n;
  const bbIdx = (dealerIdx + 2) % n;
  const utg    = (dealerIdx + 3) % n; // first to act pre-flop

  const players = state.players.map((p, i) => ({
    ...p,
    hand: [deck.pop(), deck.pop()],
    folded: false,
    allIn: false,
    currentBet: 0,
    totalBet: 0,
    isDealer: i === dealerIdx,
    isSB: i === sbIdx,
    isBB: i === bbIdx,
  }));

  // Post blinds
  let pot = 0;
  const sb = Math.min(SMALL_BLIND, players[sbIdx].chips);
  players[sbIdx].chips -= sb;
  players[sbIdx].currentBet = sb;
  players[sbIdx].totalBet = sb;
  pot += sb;

  const bb = Math.min(BIG_BLIND, players[bbIdx].chips);
  players[bbIdx].chips -= bb;
  players[bbIdx].currentBet = bb;
  players[bbIdx].totalBet = bb;
  pot += bb;

  if (players[sbIdx].chips === 0) players[sbIdx].allIn = true;
  if (players[bbIdx].chips === 0) players[bbIdx].allIn = true;

  // Find first active player (UTG)
  let firstIdx = utg;
  while (players[firstIdx].folded || players[firstIdx].allIn) {
    firstIdx = (firstIdx + 1) % n;
  }

  return {
    ...state,
    deck,
    community: [],
    pot,
    players,
    phase: 'preflop',
    activeIdx: firstIdx,
    currentBet: BIG_BLIND,
    minRaise: BIG_BLIND,
    raiseCount: 0,
    lastAggressorIdx: bbIdx,
    acted: [],
    winners: [],
    log: [`Rozdano karty. SB: $${sb}, BB: $${bb}`],
    handOver: false,
  };
}

function dealCommunity(state) {
  const deck = [...state.deck];
  let community = [...state.community];
  let phase = state.phase;
  let log = [...state.log];

  if (phase === 'preflop') {
    deck.pop(); // burn
    community = [deck.pop(), deck.pop(), deck.pop()];
    phase = 'flop';
    log.push('Flop odkryty.');
  } else if (phase === 'flop') {
    deck.pop();
    community = [...community, deck.pop()];
    phase = 'turn';
    log.push('Turn odkryty.');
  } else if (phase === 'turn') {
    deck.pop();
    community = [...community, deck.pop()];
    phase = 'river';
    log.push('River odkryty.');
  }

  // Reset bets for new street
  const players = state.players.map(p => ({ ...p, currentBet: 0 }));
  const n = players.length;
  const dealerIdx = state.dealerIdx;

  // First to act: left of dealer
  let firstIdx = (dealerIdx + 1) % n;
  let tries = 0;
  while ((players[firstIdx].folded || players[firstIdx].allIn) && tries < n) {
    firstIdx = (firstIdx + 1) % n;
    tries++;
  }
  if (players[firstIdx].folded || players[firstIdx].allIn) firstIdx = -1;

  return {
    ...state,
    deck,
    community,
    phase,
    players,
    activeIdx: firstIdx,
    currentBet: 0,
    minRaise: BIG_BLIND,
    raiseCount: 0,
    lastAggressorIdx: -1,
    acted: [],
    log,
  };
}

function applyAction(state, playerId, action, raiseAmount) {
  const players = state.players.map(p => ({ ...p }));
  const pi = players.findIndex(p => p.id === playerId);
  const p = players[pi];
  const toCall = state.currentBet - p.currentBet;
  let pot = state.pot;
  let currentBet = state.currentBet;
  let minRaise = state.minRaise;
  let raiseCount = state.raiseCount;
  let lastAggressorIdx = state.lastAggressorIdx;
  const log = [...state.log];

  if (action === 'fold') {
    p.folded = true;
    log.push(`${p.name} folduje.`);
  } else if (action === 'check') {
    log.push(`${p.name} czekuje.`);
  } else if (action === 'call') {
    const callAmt = Math.min(toCall, p.chips);
    p.chips -= callAmt;
    p.currentBet += callAmt;
    p.totalBet += callAmt;
    pot += callAmt;
    if (p.chips === 0) p.allIn = true;
    log.push(`${p.name} sprawdza $${callAmt}.`);
  } else if (action === 'raise') {
    const total = Math.min(raiseAmount + toCall, p.chips);
    p.chips -= total;
    p.currentBet += total;
    p.totalBet += total;
    pot += total;
    const newBet = p.currentBet;
    minRaise = Math.max(BIG_BLIND, newBet - currentBet);
    currentBet = newBet;
    if (p.chips === 0) p.allIn = true;
    lastAggressorIdx = pi;
    raiseCount++;
    log.push(`${p.name} podbija do $${p.currentBet}.`);
  }

  const acted = [...(state.acted ?? []), playerId];
  return { ...state, players, pot, currentBet, minRaise, raiseCount, lastAggressorIdx, acted, log };
}

function isBettingDone(state) {
  const active = state.players.filter(p => !p.folded && !p.allIn);
  if (active.length === 0) return true;
  const acted = state.acted ?? [];
  // Every active player must have acted AND matched the current bet
  const allActed   = active.every(p => acted.includes(p.id));
  const allMatched = active.every(p => p.currentBet === state.currentBet);
  return allActed && allMatched;
}

function resolveShowdown(state) {
  const winnerIds = determineWinners(state.players, state.community);
  const split = Math.floor(state.pot / winnerIds.length);
  const players = state.players.map(p => ({
    ...p,
    chips: winnerIds.includes(p.id) ? p.chips + split : p.chips,
  }));
  // Remainder chip to first winner
  const rem = state.pot - split * winnerIds.length;
  if (rem > 0) {
    const fi = players.findIndex(p => p.id === winnerIds[0]);
    players[fi].chips += rem;
  }
  const names = winnerIds.map(id => state.players.find(p => p.id===id)?.name).join(', ');
  const log = [...state.log, `Showdown: ${names} wygrywa $${state.pot}!`];
  return { ...state, players, winners: winnerIds, phase: 'showdown', log, handOver: true };
}

// ── Main component ────────────────────────────────────────────────
export default function PokerGame({ mode, onBack }) {
  const [gs, setGs] = useState(() => buildInitialState(mode));
  const [raiseInput, setRaiseInput] = useState(BIG_BLIND * 2);
  const [showRaise, setShowRaise] = useState(false);
  const botTimerRef = useRef(null);
  const savedRef = useRef(false);

  // ── Advance game state ────────────────────────────────────────
  const advanceState = useCallback((state) => {
    // Check if only one player remains
    const nonFolded = state.players.filter(p => !p.folded);
    if (nonFolded.length === 1) {
      const winner = nonFolded[0];
      const players = state.players.map(p => ({
        ...p,
        chips: p.id === winner.id ? p.chips + state.pot : p.chips,
      }));
      return setGs({
        ...state, players, winners: [winner.id],
        phase: 'showdown', handOver: true,
        log: [...state.log, `${winner.name} wygrywa $${state.pot} (wszyscy sfoldowali).`],
      });
    }

    // Check if betting round is done
    if (isBettingDone(state)) {
      if (state.phase === 'river') {
        return setGs(resolveShowdown(state));
      }
      // All-in scenario: deal remaining streets then showdown without waiting for actions
      const canAct = state.players.filter(p => !p.folded && !p.allIn);
      if (canAct.length === 0) {
        // Nobody can act – deal all remaining community cards immediately
        let ns = dealCommunity(state);
        while (ns.community.length < 5) ns = dealCommunity(ns);
        return setGs(resolveShowdown(ns));
      }
      // Normal advance to next street – recurse so all-in check runs again on new street
      const next = dealCommunity(state);
      return advanceState(next);
    }

    setGs(state);
  }, []); // eslint-disable-line

  // ── Bot turns ─────────────────────────────────────────────────
  useEffect(() => {
    if (gs.handOver || gs.phase === 'waiting' || gs.phase === 'showdown') return;
    const active = gs.players[gs.activeIdx];
    if (!active || active.isHuman || active.folded || active.allIn) return;

    botTimerRef.current = setTimeout(() => {
      const toCall = gs.currentBet - active.currentBet;
      const decision = botDecide({
        hand: active.hand,
        community: gs.community,
        toCall,
        pot: gs.pot,
        chips: active.chips,
        phase: gs.phase,
        raiseCount: gs.raiseCount,
      });

      let ns = applyAction(gs, active.id, decision.action, decision.amount ?? 0);

      // Advance to next player
      const nextIdx = nextActive(ns.players, ns.activeIdx);
      ns = { ...ns, activeIdx: nextIdx };
      advanceState(ns);
    }, 600 + Math.random() * 500);

    return () => clearTimeout(botTimerRef.current);
  }, [gs, advanceState]);

  // ── Human actions ─────────────────────────────────────────────
  const humanAction = useCallback((action, amount) => {
    if (gs.phase === 'waiting' || gs.handOver) return;
    const human = gs.players[gs.activeIdx];
    if (!human?.isHuman) return;

    let ns = applyAction(gs, human.id, action, amount ?? 0);
    const nextIdx = nextActive(ns.players, ns.activeIdx);
    ns = { ...ns, activeIdx: nextIdx };
    advanceState(ns);
    setShowRaise(false);
  }, [gs, advanceState]);

  // ── Start / next hand ─────────────────────────────────────────
  const startHand = useCallback(() => {
    let base = gs.handOver
      ? { ...gs, dealerIdx: (gs.dealerIdx + 1) % gs.players.length }
      : gs;
    // Remove busted players
    const alive = base.players.filter(p => p.chips > 0);
    if (alive.length < 2) {
      // Save game result when game ends
      if (!savedRef.current) {
        savedRef.current = true;
        const humanPlayer = base.players.find(p => p.isHuman);
        const humanWins = humanPlayer && humanPlayer.chips > 0;
        const profit = (humanPlayer?.chips ?? 0) - START_CHIPS;
        api.saveGameResult(humanWins, profit, humanPlayer?.chips ?? 0, 'poker').catch(() => {});
      }
      return setGs({ ...base, gameOver: true, log: [...base.log, 'Koniec gry!'] });
    }
    base = { ...base, players: alive };
    setGs(postBlindsAndDeal(base));
    setShowRaise(false);
  }, [gs]);

  const human = gs.players.find(p => p.isHuman);
  const bots  = gs.players.filter(p => !p.isHuman);
  const isMyTurn = !gs.handOver && gs.phase !== 'waiting' && gs.players[gs.activeIdx]?.isHuman;
  const toCall = human ? Math.max(0, gs.currentBet - human.currentBet) : 0;
  const phaseColor = PHASE_COLOR[gs.phase] ?? '#6366f1';
  const humanWon = gs.handOver && gs.winners.includes(0);

  return (
    <div className="min-h-screen text-white flex flex-col overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a1f14 0%, #050d08 100%)' }}>

      {/* ── HEADER ── */}
      <motion.header initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="shrink-0 border-b border-emerald-900/40 bg-black/60 backdrop-blur-sm z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack}
            className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 font-semibold">
            ← Lobby
          </button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">♠</span>
            <div className="text-center">
              <div className="text-emerald-400 font-black tracking-widest text-sm">TEXAS HOLD'EM</div>
              <div className="text-[10px] text-gray-500">{mode === '1v1' ? '1v1 vs Bot' : '4 Boty'}</div>
            </div>
            {/* Phase pill */}
            <AnimatePresence mode="wait">
              {gs.phase !== 'waiting' && (
                <motion.span key={gs.phase}
                  initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                  className="text-xs font-black px-3 py-1 rounded-full"
                  style={{ background: `${phaseColor}33`, border: `1px solid ${phaseColor}88`, color: phaseColor }}>
                  {PHASE_LABEL[gs.phase]}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">Żetony</div>
            <motion.div key={human?.chips} initial={{ scale: 1.4, color: '#fbbf24' }} animate={{ scale: 1 }}
              className="text-lg font-black text-yellow-400">${human?.chips?.toLocaleString() ?? 0}</motion.div>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-3 py-3 gap-3">

        {/* ── OPPONENTS ── */}
        <div className="flex justify-center gap-5 flex-wrap pt-1">
          {bots.map((bot, i) => (
            <motion.div key={bot.id}
              initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}>
              <PlayerSeat
                player={bot}
                isActive={gs.players[gs.activeIdx]?.id === bot.id}
                isHuman={false}
                community={gs.community}
                phase={gs.phase}
              />
            </motion.div>
          ))}
        </div>

        {/* ── POKER TABLE (FELT) ── */}
        <div className="relative rounded-[40px] flex flex-col items-center justify-center gap-4 py-8 px-6 overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse 90% 90% at 50% 45%, #1a5c38 0%, #0d3820 55%, #071f12 100%)',
            border: '6px solid #0a2916',
            boxShadow: 'inset 0 8px 60px rgba(0,0,0,0.6), 0 0 0 3px #c9a84c55, 0 0 0 7px #0a2916',
          }}>

          {/* Table rim glow */}
          <div className="absolute inset-0 rounded-[34px] pointer-events-none"
            style={{ boxShadow: `inset 0 0 40px ${phaseColor}22` }} />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.04]">
            <div className="text-center">
              <div className="text-white text-3xl font-black tracking-[0.4em]">♠ GoatCasino ♠</div>
              <div className="text-white text-sm tracking-[0.2em]">TEXAS HOLD'EM</div>
            </div>
          </div>

          {/* POT display */}
          <AnimatePresence>
            {gs.pot > 0 && (
              <motion.div key={gs.pot}
                initial={{ scale: 0.7, opacity: 0, y: -10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-black/60 border border-yellow-600/40 px-5 py-2 rounded-full shadow-xl">
                <div className="flex gap-1">
                  {['#ef4444','#3b82f6','#22c55e','#f59e0b'].map((c,i) => (
                    <div key={i} className="w-4 h-4 rounded-full border border-white/20 shadow"
                      style={{ background: c }} />
                  ))}
                </div>
                <span className="text-yellow-300 font-black text-lg tracking-wider">POT: ${gs.pot}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Community cards */}
          <div className="flex gap-3 justify-center items-center min-h-[80px]">
            {gs.phase === 'waiting' ? (
              <div className="text-gray-600 text-base font-black tracking-[0.3em]">♠ ♥ ♦ ♣</div>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                gs.community[i]
                  ? <PokerCard key={`${gs.phase}-${i}`} card={gs.community[i]} size="md" delay={i * 0.12} />
                  : <div key={i} className="w-[56px] h-[80px] rounded-xl border-2 border-dashed border-emerald-900/50" />
              ))
            )}
          </div>

          {/* Log message */}
          <AnimatePresence mode="wait">
            {gs.log.length > 0 && (
              <motion.div key={gs.log[gs.log.length-1]}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-xs text-gray-400 text-center max-w-xs leading-snug bg-black/30 px-3 py-1.5 rounded-full">
                {gs.log[gs.log.length-1]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Winner confetti */}
          {humanWon && <Confetti />}
        </div>

        {/* ── HUMAN PLAYER ── */}
        <div className="flex flex-col items-center gap-3">
          {human && (
            <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <PlayerSeat
                player={human}
                isActive={isMyTurn}
                isHuman={true}
                community={gs.community}
                phase={gs.phase}
              />
            </motion.div>
          )}

          {/* Win / lose banner */}
          <AnimatePresence>
            {gs.handOver && gs.winners.length > 0 && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                className={`text-center rounded-2xl px-8 py-4 border-2 font-black text-lg ${
                  humanWon
                    ? 'bg-emerald-900/80 border-emerald-400 text-emerald-300'
                    : 'bg-red-900/60 border-red-600 text-red-300'
                }`}
                style={{ boxShadow: humanWon ? '0 0 30px rgba(52,211,153,0.4)' : '0 0 30px rgba(239,68,68,0.3)' }}
              >
                {humanWon
                  ? '🏆 Wygrywasz tę rękę!'
                  : `😞 ${gs.players.find(p => p.id === gs.winners[0])?.name} wygrywa`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Game over */}
          <AnimatePresence>
            {gs.gameOver && (
              <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}
                className="text-center">
                <div className="text-3xl font-black mb-2">
                  {human && human.chips > 0 ? '🎉 Wygrałeś całą grę!' : '💸 Bankrut!'}
                </div>
                <button onClick={onBack}
                  className="px-8 py-3 bg-emerald-700 hover:bg-emerald-600 rounded-2xl font-black text-lg transition-colors shadow-lg">
                  Wróć do lobby
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ACTION PANEL ── */}
        <div className="shrink-0 rounded-2xl overflow-hidden"
          style={{ background: 'rgba(5,15,10,0.9)', border: '1px solid rgba(52,211,153,0.15)' }}>
          <AnimatePresence mode="wait">

            {/* Start / next hand */}
            {(gs.phase === 'waiting' || gs.handOver) && !gs.gameOver && (
              <motion.div key="start" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="p-4">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(52,211,153,0.5)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={startHand}
                  className="w-full py-5 rounded-2xl font-black text-xl tracking-widest transition-all"
                  style={{ background: 'linear-gradient(135deg, #065f46, #059669)', boxShadow: '0 4px 20px rgba(5,150,105,0.4)' }}
                >
                  {gs.phase === 'waiting' ? '🃏 ROZPOCZNIJ GRĘ' : '▶ NASTĘPNA RĘKA'}
                </motion.button>
              </motion.div>
            )}

            {/* My turn – action buttons */}
            {isMyTurn && !gs.handOver && (
              <motion.div key="actions" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="p-3 space-y-3">

                {/* Raise slider panel */}
                <AnimatePresence>
                  {showRaise && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                      className="overflow-hidden bg-gray-900/60 rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 shrink-0">Podbicie:</span>
                        <input type="range" min={gs.minRaise} max={human?.chips ?? gs.minRaise} step={25}
                          value={raiseInput} onChange={e => setRaiseInput(+e.target.value)}
                          className="flex-1 h-2 accent-emerald-500" />
                        <span className="text-yellow-400 font-black text-base w-20 text-right">${raiseInput}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { label: '1/3',    val: () => Math.max(gs.minRaise, Math.floor((human?.chips ?? 0) / 3 / 25) * 25) },
                          { label: '½ pot',  val: () => Math.max(gs.minRaise, Math.floor(gs.pot / 2 / 25) * 25) },
                          { label: 'Pot',    val: () => Math.max(gs.minRaise, Math.floor(gs.pot / 25) * 25) },
                          { label: 'ALL IN', val: () => human?.chips ?? 0 },
                        ].map(({ label, val }) => (
                          <motion.button key={label} whileTap={{ scale: 0.9 }}
                            onClick={() => setRaiseInput(Math.min(val(), human?.chips ?? 0))}
                            className="flex-1 py-1.5 rounded-lg text-xs font-black border transition-all"
                            style={{ background:'#1f2937', borderColor:'#374151', color: label==='ALL IN' ? '#f87171' : '#34d399' }}>
                            {label}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main action buttons */}
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.94 }}
                    onClick={() => humanAction('fold')}
                    className="flex-1 py-4 rounded-2xl font-black text-base transition-all border"
                    style={{ background:'rgba(127,29,29,0.6)', borderColor:'rgba(239,68,68,0.4)', color:'#fca5a5' }}>
                    ✕ Fold
                  </motion.button>

                  {toCall === 0 ? (
                    <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.94 }}
                      onClick={() => humanAction('check')}
                      className="flex-1 py-4 rounded-2xl font-black text-base transition-all border"
                      style={{ background:'rgba(55,65,81,0.8)', borderColor:'rgba(107,114,128,0.5)', color:'#e5e7eb' }}>
                      ✓ Check
                    </motion.button>
                  ) : (
                    <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.94 }}
                      onClick={() => humanAction('call')}
                      disabled={human?.chips === 0}
                      className="flex-1 py-4 rounded-2xl font-black text-base transition-all border disabled:opacity-40"
                      style={{ background:'rgba(29,78,216,0.6)', borderColor:'rgba(96,165,250,0.4)', color:'#93c5fd' }}>
                      📞 Call ${toCall}
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.04, boxShadow: showRaise ? '0 0 20px rgba(52,211,153,0.5)' : undefined }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      if (showRaise) { humanAction('raise', raiseInput); }
                      else { setRaiseInput(Math.min(gs.minRaise * 2, human?.chips ?? gs.minRaise)); setShowRaise(true); }
                    }}
                    disabled={human?.chips <= toCall}
                    className="flex-1 py-4 rounded-2xl font-black text-base transition-all border disabled:opacity-40"
                    style={{
                      background: showRaise ? 'rgba(5,150,105,0.7)' : 'rgba(6,78,59,0.7)',
                      borderColor: 'rgba(52,211,153,0.4)', color: '#6ee7b7',
                    }}>
                    {showRaise ? '⚡ Potwierdź' : '⬆ Raise'}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Waiting for others */}
            {!isMyTurn && !gs.handOver && gs.phase !== 'waiting' && (
              <motion.div key="wait" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="p-4 flex items-center justify-center gap-3">
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <motion.div key={i} animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
                      transition={{ duration:0.8, delay:i*0.25, repeat:Infinity }}
                      className="w-2 h-2 rounded-full bg-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-400 text-sm font-semibold">
                  {gs.players[gs.activeIdx]?.name ?? '...'} myśli...
                </span>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>
    </div>
  );
}
