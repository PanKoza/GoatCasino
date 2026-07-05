import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket, disconnectSocket } from '../socket';
import { api } from '../api';
import { suitColor, evaluateHand } from '../utils/poker';

const BIG_BLIND = 50;
const PHASE_LABEL = { preflop:'Pre-flop', flop:'Flop', turn:'Turn', river:'River', showdown:'Showdown', lobby:'Lobby', game_over:'Koniec gry' };

// ── Card ──────────────────────────────────────────────────────────
function Card({ card, small }) {
  const sz = small ? 'w-8 h-11 text-xs' : 'w-10 h-14 text-sm';
  if (!card) return <div className={`${sz} rounded-lg bg-emerald-800 border-2 border-emerald-600 flex items-center justify-center text-emerald-500 font-black shadow`}>🂠</div>;
  return (
    <div className={`${sz} rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center shadow font-black leading-tight`}
      style={{ color: suitColor(card.suit) }}>
      <span>{card.rank}</span>
      <span>{card.suit}</span>
    </div>
  );
}

// ── Player seat ───────────────────────────────────────────────────
function Seat({ player, isMe, isActive, community, phase }) {
  const handEv = isMe && player.hand?.filter(Boolean).length === 2 && community.length >= 3
    ? evaluateHand([...player.hand, ...community])
    : null;
  return (
    <div className={`flex flex-col items-center gap-1 transition-opacity ${player.folded ? 'opacity-30' : ''}`}>
      <div className={`relative rounded-2xl p-2 border transition-all ${
        isActive && !player.folded ? 'border-yellow-400 shadow-lg shadow-yellow-400/30 bg-yellow-900/20' : 'border-gray-700/50 bg-gray-900/40'
      }`}>
        <div className="flex gap-1 justify-center">
          {[0,1].map(i => <Card key={i} card={player.hand?.[i] || null} small={!isMe} />)}
        </div>
        <div className="absolute -top-2 -right-2 flex gap-0.5">
          {player.isDealer && <span className="text-[9px] bg-white text-gray-900 font-black rounded-full w-4 h-4 flex items-center justify-center">D</span>}
          {player.isSB && <span className="text-[9px] bg-blue-500 text-white font-black rounded-full w-4 h-4 flex items-center justify-center">S</span>}
          {player.isBB && <span className="text-[9px] bg-orange-500 text-white font-black rounded-full w-4 h-4 flex items-center justify-center">B</span>}
        </div>
        {player.allIn && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded-full whitespace-nowrap">ALL-IN</div>}
      </div>
      <div className="text-center">
        <div className={`text-xs font-bold truncate max-w-[80px] ${isMe ? 'text-emerald-400' : 'text-gray-300'}`}>{player.name}{isMe ? ' (Ty)' : ''}</div>
        <div className="text-xs text-yellow-400 font-black">${player.chips}</div>
        {player.currentBet > 0 && <div className="text-[10px] text-blue-300">Bet: ${player.currentBet}</div>}
      </div>
      {handEv && !player.folded && (
        <div className="text-[9px] text-purple-300 font-bold bg-purple-900/40 px-1.5 py-0.5 rounded-full">{handEv.name}</div>
      )}
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
  const socketRef = useRef(null);
  const savedRef  = useRef(false);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-green-950 to-gray-950 text-white flex flex-col">
      <header className="border-b border-green-800/40 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={handleLeave} className="text-sm text-gray-400 hover:text-white transition-colors">← Opuść</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">♠️</span>
            <span className="text-emerald-400 font-black text-sm">POKER ONLINE</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {PHASE_LABEL[gs.phase] ?? gs.phase}
            </span>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Żetony</div>
            <div className="text-sm font-black text-yellow-400">${me?.chips ?? 0}</div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-3 py-4 gap-4">

        {/* Opponents */}
        <div className="flex justify-center gap-4 flex-wrap">
          {opponents.map((p, i) => (
            <Seat key={p.id} player={p} isMe={false}
              isActive={gs.players.indexOf(p) === gs.activeIdx}
              community={gs.community} phase={gs.phase} />
          ))}
        </div>

        {/* Felt */}
        <div className="relative rounded-3xl flex flex-col items-center justify-center gap-3 py-6 px-4"
          style={{ background:'radial-gradient(ellipse at 50% 50%, #1e5c3a 0%, #0d3322 100%)', border:'4px solid #0a2918', boxShadow:'inset 0 4px 40px rgba(0,0,0,0.5), 0 0 0 2px #c9a84c44' }}>

          {gs.pot > 0 && (
            <motion.div key={gs.pot} initial={{ scale:1.2 }} animate={{ scale:1 }}
              className="absolute top-3 right-3 bg-black/50 border border-yellow-700/50 px-3 py-1 rounded-full text-yellow-400 font-black text-sm">
              POT: ${gs.pot}
            </motion.div>
          )}

          {/* Community cards */}
          <div className="flex gap-2 justify-center min-h-[56px] items-center">
            {gs.phase === 'lobby' ? (
              <div className="text-gray-500 text-sm font-semibold tracking-widest">STÓŁ</div>
            ) : (
              Array.from({ length:5 }).map((_,i) => (
                gs.community[i]
                  ? <motion.div key={i} initial={{ rotateY:90,opacity:0 }} animate={{ rotateY:0,opacity:1 }} transition={{ delay:i*0.1 }}>
                      <Card card={gs.community[i]} />
                    </motion.div>
                  : <div key={i} className="w-10 h-14 rounded-lg border-2 border-dashed border-emerald-700/30" />
              ))
            )}
          </div>

          {gs.log?.length > 0 && (
            <div className="text-[10px] text-gray-400 text-center max-w-xs">{gs.log[gs.log.length-1]}</div>
          )}
        </div>

        {/* My seat */}
        <div className="flex flex-col items-center gap-2">
          {me && (
            <Seat player={me} isMe={true} isActive={isMyTurn} community={gs.community} phase={gs.phase} />
          )}

          {/* Winner banner */}
          <AnimatePresence>
            {gs.winners?.length > 0 && gs.phase === 'showdown' && (
              <motion.div initial={{ scale:0.8,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.8,opacity:0 }}
                className={`text-center rounded-2xl px-6 py-3 border font-black ${
                  gs.winners.includes(me?.id)
                    ? 'bg-emerald-900/80 border-emerald-500 text-emerald-300'
                    : 'bg-red-900/60 border-red-700 text-red-300'
                }`}>
                {gs.winners.includes(me?.id) ? '🏆 Wygrywasz tę rękę!' : `😞 ${gs.players.find(p=>gs.winners.includes(p.id))?.name} wygrywa`}
              </motion.div>
            )}
          </AnimatePresence>

          {gs.phase === 'game_over' && (
            <div className="text-center">
              <div className="text-xl font-black text-yellow-400 mb-2">Gra zakończona!</div>
              <button onClick={handleLeave} className="px-6 py-2 bg-emerald-700 hover:bg-emerald-600 rounded-xl font-bold transition-colors">
                Wróć do lobby
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="shrink-0 bg-gray-950 border-t border-gray-800 rounded-2xl p-3">
          <AnimatePresence mode="wait">
            {/* Lobby waiting */}
            {gs.phase === 'lobby' && (
              <motion.div key="lobby" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
                <div className="text-center text-sm text-gray-400">
                  Gracze: {gs.players.length} / {/* maxPlayers not in state, host knows */}
                  <span className="text-emerald-400 font-bold">{gs.players.map(p=>p.name).join(', ')}</span>
                </div>
                {isHost ? (
                  <button onClick={handleStart} disabled={gs.players.length < 2}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-sm transition-colors disabled:opacity-40">
                    🃏 ROZPOCZNIJ GRĘ ({gs.players.length} graczy)
                  </button>
                ) : (
                  <div className="text-center text-gray-500 text-sm py-2">Czekam aż host rozpocznie grę...</div>
                )}
              </motion.div>
            )}

            {/* My turn */}
            {isMyTurn && (
              <motion.div key="actions" initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="space-y-2">
                <AnimatePresence>
                  {showRaise && (
                    <motion.div initial={{ height:0,opacity:0 }} animate={{ height:'auto',opacity:1 }} exit={{ height:0,opacity:0 }} className="overflow-hidden">
                      <div className="flex items-center gap-2 pb-2">
                        <span className="text-xs text-gray-400 w-16">Podbicie:</span>
                        <input type="range" min={gs.minRaise} max={me?.chips ?? gs.minRaise} step={25}
                          value={raiseInput} onChange={e => setRaiseInput(+e.target.value)}
                          className="flex-1 accent-emerald-500" />
                        <span className="text-yellow-400 font-black text-sm w-16 text-right">${raiseInput}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-2">
                  <button onClick={() => sendAction('fold')}
                    className="flex-1 py-3 rounded-xl bg-red-900/60 hover:bg-red-800/80 border border-red-700/50 font-bold text-red-300 text-sm transition-colors">
                    ✕ Fold
                  </button>
                  {toCall === 0 ? (
                    <button onClick={() => sendAction('check')}
                      className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-600 font-bold text-gray-200 text-sm transition-colors">
                      ✓ Check
                    </button>
                  ) : (
                    <button onClick={() => sendAction('call')}
                      className="flex-1 py-3 rounded-xl bg-blue-900/70 hover:bg-blue-800/80 border border-blue-700/50 font-bold text-blue-300 text-sm transition-colors">
                      📞 Call ${toCall}
                    </button>
                  )}
                  <button
                    onClick={() => { if (showRaise) sendAction('raise', raiseInput); else { setRaiseInput(Math.min(gs.minRaise*2, me?.chips??gs.minRaise)); setShowRaise(true); } }}
                    disabled={me?.chips <= toCall}
                    className="flex-1 py-3 rounded-xl bg-emerald-800/70 hover:bg-emerald-700/80 border border-emerald-600/50 font-bold text-emerald-300 text-sm transition-colors disabled:opacity-40">
                    {showRaise ? '⚡ Potwierdź' : '⬆ Raise'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Waiting for others */}
            {!isMyTurn && gs.phase !== 'lobby' && gs.phase !== 'showdown' && gs.phase !== 'game_over' && (
              <motion.div key="wait" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="text-center py-3 text-gray-500 text-sm">
                {gs.players[gs.activeIdx]?.name ?? '...'} myśli...
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
