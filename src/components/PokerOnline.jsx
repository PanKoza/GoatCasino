import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, disconnectSocket } from '../socket';
import { api } from '../api';
import { suitColor, evaluateHand } from '../utils/poker';
import PlayingCard from './PlayingCard';

const BIG_BLIND = 50;
const PHASE_LABEL = { preflop:'Pre-flop', flop:'Flop', turn:'Turn', river:'River', showdown:'Showdown', lobby:'Lobby', game_over:'Koniec gry' };

// ── Hidden card (opponent back) ───────────────────────────────────
function HiddenCard({ dealDelay = 0, small = false }) {
  const cls = small
    ? 'w-9 h-13 rounded-lg border border-emerald-500'
    : 'w-14 h-20 rounded-xl border-2 border-emerald-500';
  return (
    <motion.div
      initial={{ x: 160, y: -100, rotate: 18, opacity: 0, scale: 0.7 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      transition={{ delay: dealDelay, duration: 0.42, type: 'spring', stiffness: 210, damping: 22 }}
      className={`${cls} bg-gradient-to-br from-emerald-700 to-emerald-950 flex items-center justify-center shadow-lg`}
    >
      <span className={`text-emerald-300 select-none ${small ? 'text-base' : 'text-2xl'}`}>🂠</span>
    </motion.div>
  );
}

// ── Opponent seat (compact, shown above the table) ────────────────
function OpponentSeat({ player, isActive, dealKey }) {
  const hasCards = player.hand?.some(Boolean);
  return (
    <motion.div
      animate={isActive && !player.folded ? { y: [0, -4, 0] } : {}}
      transition={{ repeat: Infinity, duration: 1.2 }}
      className={`flex flex-col items-center gap-1.5 transition-opacity duration-300 ${player.folded ? 'opacity-20' : ''}`}
    >
      {/* Cards (small) */}
      <div className={`relative rounded-2xl px-2 pt-2 pb-1.5 border-2 transition-all duration-300 ${
        isActive && !player.folded
          ? 'border-yellow-400 shadow-lg shadow-yellow-400/50 bg-yellow-950/30'
          : 'border-gray-700/30 bg-black/20'
      }`}>
        <div className="flex gap-1 justify-center">
          {[0, 1].map(i =>
            player.hand?.[i]
              ? <PlayingCard key={`${dealKey}-opp-${player.id}-${i}`} card={player.hand[i]} fromDeck dealDelay={i * 0.18} />
              : <HiddenCard key={`${dealKey}-h-${player.id}-${i}`} dealDelay={i * 0.16} small />
          )}
        </div>
        {/* Role badges */}
        <div className="absolute -top-2 -right-2 flex gap-0.5 z-10">
          {player.isDealer && <span className="text-[8px] bg-white text-gray-900 font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">D</span>}
          {player.isSB    && <span className="text-[8px] bg-blue-500 text-white font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">S</span>}
          {player.isBB    && <span className="text-[8px] bg-orange-500 text-white font-black rounded-full w-4 h-4 flex items-center justify-center shadow-md">B</span>}
        </div>
        {player.allIn && (
          <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[8px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full whitespace-nowrap shadow-md z-10">
            ALL-IN
          </div>
        )}
      </div>

      {/* Nameplate */}
      <div className={`rounded-xl px-3 py-1 text-center min-w-[72px] border transition-all ${
        isActive && !player.folded
          ? 'bg-yellow-900/40 border-yellow-600/60'
          : 'bg-black/40 border-gray-700/40'
      }`}>
        <div className="text-[11px] font-bold text-gray-200 truncate max-w-[80px]">{player.name}</div>
        <div className="text-[11px] font-black text-yellow-400">${player.chips}</div>
        {player.currentBet > 0 && (
          <div className="text-[9px] text-blue-300 font-semibold">Bet: ${player.currentBet}</div>
        )}
      </div>
    </motion.div>
  );
}

// ── My seat (large, at the bottom) ───────────────────────────────
function MySeat({ player, isActive, community, dealKey }) {
  const handEv = player.hand?.filter(Boolean).length === 2 && community.length >= 3
    ? evaluateHand([...player.hand, ...community])
    : null;

  return (
    <div className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${player.folded ? 'opacity-30' : ''}`}>
      {/* Cards */}
      <div className={`relative rounded-3xl px-4 pt-3 pb-2 border-2 transition-all duration-300 ${
        isActive && !player.folded
          ? 'border-yellow-400 shadow-2xl shadow-yellow-400/40 bg-yellow-950/20'
          : 'border-emerald-800/50 bg-black/30'
      }`}>
        <div className="flex gap-3 justify-center">
          {player.hand?.map((card, i) =>
            card
              ? <PlayingCard key={`${dealKey}-me-${i}`} card={card} fromDeck dealDelay={i * 0.18} />
              : <div key={i} className="w-20 h-28 rounded-xl border-2 border-dashed border-emerald-700/30" />
          )}
        </div>
        {/* Role badges */}
        <div className="absolute -top-2.5 -right-2.5 flex gap-0.5 z-10">
          {player.isDealer && <span className="text-[9px] bg-white text-gray-900 font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">D</span>}
          {player.isSB    && <span className="text-[9px] bg-blue-500 text-white font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">S</span>}
          {player.isBB    && <span className="text-[9px] bg-orange-500 text-white font-black rounded-full w-5 h-5 flex items-center justify-center shadow-md">B</span>}
        </div>
        {player.allIn && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-md z-10">
            ALL-IN
          </div>
        )}
      </div>

      {/* Nameplate */}
      <div className="flex items-center gap-3 bg-black/50 border border-emerald-800/60 rounded-2xl px-5 py-2">
        <div>
          <div className="text-xs font-bold text-emerald-400">{player.name} (Ty)</div>
          <div className="text-sm font-black text-yellow-400">${player.chips}</div>
          {player.currentBet > 0 && <div className="text-[10px] text-blue-300 font-semibold">Bet: ${player.currentBet}</div>}
        </div>
        {handEv && !player.folded && (
          <div className="text-[10px] text-purple-200 font-bold bg-purple-800/60 border border-purple-500/40 px-2 py-1 rounded-xl text-center">
            {handEv.name}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Room list ─────────────────────────────────────────────────────
function RoomList({ rooms, onJoin, onCreate, creating, setMaxPlayers, maxPlayers, loading }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Create room */}
      <div className="bg-gray-900/60 border border-emerald-800/50 rounded-2xl p-4">
        <div className="text-sm font-bold text-emerald-400 mb-3">➕ Utwórz nowy pokój</div>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-400">Maks. graczy:</span>
          <div className="flex gap-2">
            {[2,3,4,5].map(n => (
              <button key={n} onClick={() => setMaxPlayers(n)}
                className={`w-8 h-8 rounded-lg font-bold text-sm transition-all ${maxPlayers===n ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onCreate} disabled={creating}
          className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-black text-sm transition-colors disabled:opacity-50">
          {creating ? 'Tworzenie...' : '🃏 UTWÓRZ POKÓJ'}
        </button>
      </div>

      {/* Room list */}
      <div>
        <div className="text-xs text-gray-500 tracking-widest uppercase mb-2">Dostępne pokoje</div>
        {loading ? (
          <div className="text-center text-gray-500 py-4">Ładowanie...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-gray-600 py-8 border border-dashed border-gray-700 rounded-xl">Brak otwartych pokoi</div>
        ) : (
          <div className="space-y-2">
            {rooms.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3">
                <div>
                  <div className="text-sm font-bold text-white">Host: {r.host}</div>
                  <div className="text-xs text-gray-400">{r.players}/{r.maxPlayers} graczy</div>
                </div>
                <button onClick={() => onJoin(r.id)}
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 font-bold text-sm transition-colors">
                  Dołącz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export default function PokerOnline({ onBack, username }) {
  const [screen, setScreen]     = useState('lobby'); // lobby | game
  const [gs, setGs]             = useState(null);
  const [rooms, setRooms]       = useState([]);
  const [maxPlayers, setMaxPlayers] = useState(5);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState('');
  const [raiseInput, setRaiseInput] = useState(BIG_BLIND * 2);
  const [showRaise, setShowRaise]   = useState(false);
  const [dealKey, setDealKey]       = useState(0);
  const socketRef = useRef(null);
  const savedRef  = useRef(false);
  const prevPhaseRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('gc_token');
    const socket = getSocket(token);
    socketRef.current = socket;

    socket.emit('poker:rooms');

    socket.on('poker:rooms', setRooms);
    socket.on('poker:created', ({ roomId }) => {
      setCreating(false);
      setScreen('game');
    });
    socket.on('poker:state', (state) => {
      setGs(prev => {
        // Save result once when game ends
        if (state.phase === 'game_over' && (!prev || prev.phase !== 'game_over') && !savedRef.current) {
          savedRef.current = true;
          const me = state.players[state.myIdx];
          const won = me && me.chips > 0;
          const profit = (me?.chips ?? 0) - 500;
          const rankBonus = won ? 60 : -10;
          api.saveGameResult(won, profit, me?.chips ?? 0, 'poker', rankBonus).catch(() => {});
        }
        // Increment dealKey on new hand (lobby→preflop transition)
        if (state.phase === 'preflop' && prevPhaseRef.current === 'lobby') {
          setDealKey(k => k + 1);
        }
        prevPhaseRef.current = state.phase;
        return state;
      });
      if (screen !== 'game') setScreen('game');
    });
    socket.on('poker:error', (msg) => { setError(msg); setCreating(false); });

    return () => {
      socket.off('poker:rooms');
      socket.off('poker:created');
      socket.off('poker:state');
      socket.off('poker:error');
    };
  }, []); // eslint-disable-line

  const handleCreate = () => {
    setCreating(true);
    setError('');
    socketRef.current?.emit('poker:create', maxPlayers);
  };

  const handleJoin = (roomId) => {
    setError('');
    socketRef.current?.emit('poker:join', roomId);
  };

  const handleLeave = () => {
    socketRef.current?.emit('poker:leave');
    setScreen('lobby');
    setGs(null);
    socketRef.current?.emit('poker:rooms');
  };

  const handleStart = () => {
    socketRef.current?.emit('poker:start');
  };

  const sendAction = useCallback((action, amount) => {
    socketRef.current?.emit('poker:action', { action, amount });
    setShowRaise(false);
  }, []);

  // ── Lobby screen ───────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-green-950 to-gray-950 text-white flex flex-col">
        <header className="border-b border-green-800/40 bg-black/50 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">← Lobby</button>
            <div className="flex items-center gap-2">
              <span className="text-xl">🌐</span>
              <span className="text-emerald-400 font-black tracking-wider text-sm">POKER ONLINE</span>
            </div>
            <div className="w-16" />
          </div>
        </header>
        <main className="max-w-2xl mx-auto w-full px-4 py-6">
          <h2 className="text-xl font-black mb-4">Texas Hold'em – Pokoje online</h2>
          {error && <div className="bg-red-900/50 border border-red-700/50 text-red-300 text-sm px-4 py-2 rounded-xl mb-4">{error}</div>}
          <RoomList
            rooms={rooms}
            onJoin={handleJoin}
            onCreate={handleCreate}
            creating={creating}
            maxPlayers={maxPlayers}
            setMaxPlayers={setMaxPlayers}
            loading={false}
          />
        </main>
      </div>
    );
  }

  // ── Game screen ────────────────────────────────────────────────
  if (!gs) return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-gray-400">Łączenie...</div>
    </div>
  );

  const me = gs.players[gs.myIdx];
  const opponents = gs.players.filter((_, i) => i !== gs.myIdx);
  const isMyTurn = gs.activeIdx === gs.myIdx && gs.phase !== 'lobby' && gs.phase !== 'showdown' && gs.phase !== 'game_over';
  const toCall = me ? Math.max(0, gs.currentBet - me.currentBet) : 0;
  const isHost = gs.myIdx === 0;

  return (
    <div className="min-h-screen text-white flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #0f2d1a 0%, #060d0a 100%)' }}>

      {/* Header */}
      <header className="shrink-0 border-b border-emerald-900/40 bg-black/60 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <button onClick={handleLeave}
            className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
            ← Opuść
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base">♠️</span>
            <span className="text-emerald-400 font-black tracking-wider text-xs">POKER ONLINE</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              gs.phase === 'preflop' ? 'bg-blue-900/70 text-blue-300 border border-blue-700/50' :
              gs.phase === 'flop'    ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700/50' :
              gs.phase === 'turn'    ? 'bg-yellow-900/70 text-yellow-300 border border-yellow-700/50' :
              gs.phase === 'river'   ? 'bg-orange-900/70 text-orange-300 border border-orange-700/50' :
              gs.phase === 'showdown'? 'bg-purple-900/70 text-purple-300 border border-purple-700/50' :
              'bg-gray-800 text-gray-400 border border-gray-700/50'
            }`}>
              {PHASE_LABEL[gs.phase] ?? gs.phase}
            </span>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-gray-500">Twoje żetony</div>
            <div className="text-sm font-black text-yellow-400">${me?.chips ?? 0}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-3 py-3 gap-3 overflow-hidden">

        {/* ── Opponents row ──────────────────────────────────────────── */}
        <div className="flex justify-center items-end gap-5 flex-wrap min-h-[130px] px-2">
          {opponents.map(p => (
            <OpponentSeat
              key={p.id}
              player={p}
              isActive={gs.players.indexOf(p) === gs.activeIdx}
              dealKey={dealKey}
            />
          ))}
          {opponents.length === 0 && (
            <div className="text-gray-700 text-xs self-center">Brak przeciwników</div>
          )}
        </div>

        {/* ── Poker table (oval felt) ────────────────────────────────── */}
        <div className="relative flex flex-col items-center justify-center py-8 px-6 gap-4"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #1e6040 0%, #0e3a24 60%, #082014 100%)',
            border: '6px solid #8b6914',
            borderRadius: '50% / 40%',
            boxShadow: [
              'inset 0 6px 40px rgba(0,0,0,0.6)',
              'inset 0 -4px 20px rgba(255,255,255,0.03)',
              '0 0 0 2px #c9a84c55',
              '0 8px 40px rgba(0,0,0,0.8)',
            ].join(', '),
          }}>

          {/* Pot */}
          <AnimatePresence mode="wait">
            {gs.pot > 0 && (
              <motion.div
                key={gs.pot}
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                className="flex items-center gap-2 bg-black/60 border border-yellow-700/60 px-4 py-1.5 rounded-full shadow-lg backdrop-blur-sm"
              >
                <span className="text-yellow-500 text-sm">🪙</span>
                <span className="text-yellow-400 font-black text-sm tracking-wide">POT: ${gs.pot}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Community cards */}
          <div className="flex gap-2.5 justify-center items-center min-h-[116px]">
            {gs.phase === 'lobby' ? (
              <div className="text-emerald-800 text-sm font-bold tracking-[0.3em] uppercase select-none">Texas Hold'em</div>
            ) : (
              Array.from({ length: 5 }).map((_, i) => (
                gs.community[i]
                  ? <PlayingCard
                      key={`comm-${dealKey}-${i}`}
                      card={gs.community[i]}
                      fromDeck
                      dealDelay={i * 0.13}
                    />
                  : <div key={i} className="w-20 h-28 rounded-xl border-2 border-dashed border-emerald-800/40" />
              ))
            )}
          </div>

          {/* Last log line */}
          {gs.log?.length > 0 && gs.phase !== 'lobby' && (
            <div className="text-[10px] text-emerald-400/70 text-center max-w-[260px] font-medium">
              {gs.log[gs.log.length - 1]}
            </div>
          )}
        </div>

        {/* ── My hand ───────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-2">
          {me && (
            <MySeat player={me} isActive={isMyTurn} community={gs.community} dealKey={dealKey} />
          )}

          {/* Winner banner */}
          <AnimatePresence>
            {gs.winners?.length > 0 && gs.phase === 'showdown' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={`text-center rounded-2xl px-8 py-3 border-2 font-black text-sm shadow-xl ${
                  gs.winners.includes(me?.id)
                    ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200 shadow-emerald-900/50'
                    : 'bg-red-950/90 border-red-700 text-red-300 shadow-red-950/50'
                }`}>
                {gs.winners.includes(me?.id)
                  ? '🏆 Wygrywasz tę rękę!'
                  : `😞 ${gs.players.find(p => gs.winners.includes(p.id))?.name ?? '?'} wygrywa`}
              </motion.div>
            )}
          </AnimatePresence>

          {gs.phase === 'game_over' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
              <div className="text-xl font-black text-yellow-400">Gra zakończona!</div>
              <button onClick={handleLeave}
                className="px-8 py-2.5 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-black text-sm transition-colors shadow-lg">
                Wróć do lobby
              </button>
            </motion.div>
          )}
        </div>

        {/* ── Action bar ────────────────────────────────────────────── */}
        <div className="shrink-0 rounded-2xl border border-gray-800/80 bg-gray-950/90 backdrop-blur-sm p-3">
          <AnimatePresence mode="wait">

            {/* Lobby – waiting to start */}
            {gs.phase === 'lobby' && (
              <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="text-center text-xs text-gray-400">
                  Gracze:{' '}
                  <span className="text-emerald-400 font-bold">{gs.players.map(p => p.name).join(', ')}</span>
                </div>
                {isHost ? (
                  <button onClick={handleStart} disabled={gs.players.length < 2}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 font-black text-sm transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed">
                    🃏 ROZPOCZNIJ GRĘ ({gs.players.length} graczy)
                  </button>
                ) : (
                  <div className="text-center text-gray-500 text-xs py-2 animate-pulse">
                    ⏳ Czekam aż host rozpocznie grę...
                  </div>
                )}
              </motion.div>
            )}

            {/* My turn */}
            {isMyTurn && (
              <motion.div key="actions" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
                {/* Raise slider */}
                <AnimatePresence>
                  {showRaise && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="flex items-center gap-3 pb-2 px-1">
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">Podbicie:</span>
                        <input type="range" min={gs.minRaise} max={me?.chips ?? gs.minRaise} step={25}
                          value={raiseInput} onChange={e => setRaiseInput(+e.target.value)}
                          className="flex-1 accent-emerald-500 h-1.5" />
                        <span className="text-yellow-400 font-black text-sm min-w-[52px] text-right">${raiseInput}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button onClick={() => sendAction('fold')}
                    className="flex-1 py-3.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800/60 font-black text-red-300 text-sm transition-all shadow active:scale-95">
                    ✕ Fold
                  </button>
                  {toCall === 0 ? (
                    <button onClick={() => sendAction('check')}
                      className="flex-1 py-3.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600/60 font-black text-gray-100 text-sm transition-all shadow active:scale-95">
                      ✓ Check
                    </button>
                  ) : (
                    <button onClick={() => sendAction('call')}
                      className="flex-1 py-3.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700/60 font-black text-blue-200 text-sm transition-all shadow active:scale-95">
                      📞 Call <span className="text-blue-400">${toCall}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (showRaise) sendAction('raise', raiseInput);
                      else { setRaiseInput(Math.min(gs.minRaise * 2, me?.chips ?? gs.minRaise)); setShowRaise(true); }
                    }}
                    disabled={me?.chips <= toCall}
                    className="flex-1 py-3.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 font-black text-emerald-300 text-sm transition-all shadow active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
                    {showRaise ? '⚡ Potwierdź' : '⬆ Raise'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Waiting for opponent */}
            {!isMyTurn && gs.phase !== 'lobby' && gs.phase !== 'showdown' && gs.phase !== 'game_over' && (
              <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-3 text-gray-500 text-sm">
                <span className="animate-spin text-base">⟳</span>
                <span>{gs.players[gs.activeIdx]?.name ?? '...'} myśli...</span>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
