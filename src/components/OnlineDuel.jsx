import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { handTotal, isBust } from '../utils/blackjack';
import { getSocket, disconnectSocket } from '../socket';
import { api } from '../api';

const SESSION_START = 500;
const WIN_TARGET    = 1000;

// ── Mini Card ────────────────────────────────────────────────────
function MiniCard({ card, hidden, delay = 0 }) {
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  if (hidden || !card) {
    return (
      <motion.div
        initial={{ x: 160, y: -80, rotate: 15, opacity: 0 }}
        animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
        transition={{ delay, duration: 0.4, type: 'spring', stiffness: 180, damping: 20 }}
        className="w-12 h-[68px] rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-300 shadow-md"
      >🂠</motion.div>
    );
  }
  return (
    <motion.div
      initial={{ x: 160, y: -80, rotate: 15, opacity: 0 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
      transition={{ delay, duration: 0.4, type: 'spring', stiffness: 180, damping: 20 }}
      className="w-12 h-[68px] rounded-lg bg-white border border-gray-200 flex flex-col justify-between p-1 shadow-md select-none"
    >
      <div className={`text-[10px] font-black leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{card.suit}</div>
      </div>
      <div className={`text-base text-center ${isRed ? 'text-red-600' : 'text-gray-900'}`}>{card.suit}</div>
      <div className={`text-[10px] font-black leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{card.suit}</div>
      </div>
    </motion.div>
  );
}

// ── Player Panel ─────────────────────────────────────────────────
function PlayerPanel({ data, isMe, highlight, phase }) {
  if (!data) return null;
  const { username, hand, total, bust, bet, balance, status, result } = data;
  const showScore = hand.length > 0;
  const done = status === 'done' || status === 'blackjack';

  const resultColors = {
    win:       { bg: 'bg-emerald-900/60', border: 'border-emerald-400/60', text: 'text-emerald-300', label: '🏆 WYGRANA' },
    blackjack: { bg: 'bg-yellow-900/60', border: 'border-yellow-400/60', text: 'text-yellow-300', label: '🎰 BLACKJACK' },
    lose:      { bg: 'bg-red-900/50', border: 'border-red-400/50', text: 'text-red-300', label: '💀 PRZEGRANA' },
    draw:      { bg: 'bg-gray-800/60', border: 'border-gray-500/60', text: 'text-gray-300', label: '🤝 REMIS' },
  };
  const rc = result ? resultColors[result] : null;

  return (
    <div className={`flex-1 min-w-0 flex flex-col items-center transition-opacity duration-300 relative ${(!highlight && hand.length > 0) ? 'opacity-60' : ''}`}>
      {/* Name + balance */}
      <div className={`flex items-center gap-1.5 mb-1 px-3 py-1 rounded-full border text-xs font-black ${
        isMe ? 'border-emerald-600/60 bg-emerald-900/30 text-emerald-300' : 'border-gray-700 bg-gray-900/30 text-gray-400'
      }`}>
        {isMe ? '🧑' : '👤'} {username}{isMe && ' (Ty)'}
      </div>

      {/* Balance + bet */}
      <div className="flex items-center gap-2 mb-1.5">
        <motion.span key={balance} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className={`text-sm font-black ${balance <= 50 ? 'text-red-400' : isMe ? 'text-yellow-400' : 'text-gray-300'}`}>
          ${balance?.toLocaleString()}
        </motion.span>
        {bet > 0 && hand.length > 0 && (
          <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">-${bet}</span>
        )}
      </div>

      {/* Status badge */}
      <div className="mb-1.5 min-h-5">
        {status === 'betting'   && phase === 'betting' && <span className="text-[10px] text-gray-500 animate-pulse">Wybiera zakład...</span>}
        {status === 'ready'     && phase === 'betting' && <span className="text-[10px] text-emerald-400 font-bold">✓ Gotowy!</span>}
        {status === 'playing'   && <span className="text-[10px] text-yellow-400 animate-pulse font-bold">{isMe ? '▶ Twoja tura' : '⏳ Gra...'}</span>}
        {done && !result        && <span className="text-[10px] text-gray-500">Czeka na wynik</span>}
        {status === 'blackjack' && !result && <span className="text-[10px] text-yellow-400 font-bold">BLACKJACK!</span>}
      </div>

      {/* Cards */}
      <div className="flex gap-1 justify-center flex-wrap min-h-[72px] relative">
        {hand.map((card, i) => (
          <MiniCard key={`${isMe ? 'me' : 'opp'}-${i}-${card?.rank}${card?.suit}`} card={card} delay={i * 0.18} />
        ))}
        {/* Thinking dots when playing */}
        {status === 'playing' && !isMe && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1 mt-2">
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ y:[0,-6,0] }} transition={{ duration:0.5, delay:i*0.15, repeat:Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            ))}
          </motion.div>
        )}
      </div>

      {/* Score */}
      {showScore && (
        <motion.div
          key={total}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`mt-1.5 text-3xl font-black ${bust ? 'text-red-400' : 'text-white'}`}
        >
          {total}{bust && <span className="text-sm ml-1 font-bold">BUST</span>}
        </motion.div>
      )}

      {/* Result overlay */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className={`absolute inset-x-0 top-12 bottom-0 flex flex-col items-center justify-center rounded-2xl border ${rc.bg} ${rc.border} backdrop-blur-sm`}
          >
            <div className={`text-base font-black ${rc.text}`}>{rc.label}</div>
            {result === 'win' && (
              <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                {[...Array(8)].map((_,i) => (
                  <motion.div key={i} initial={{ y:'100%', opacity:1 }} animate={{ y:'-110%', opacity:0 }}
                    transition={{ duration:0.9, delay:i*0.08, ease:'easeOut' }}
                    className="absolute w-1.5 h-1.5 rounded-full"
                    style={{ background:['#fbbf24','#34d399','#60a5fa'][i%3], bottom:0, left:`${12*i}%` }} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Session end overlay ──────────────────────────────────────────
function SessionEndOverlay({ state, onLobby, onPlayAgain }) {
  const meWon = state.me.balance >= WIN_TARGET || (state.opponent.balance <= 0 && state.me.balance > 0);
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background:'rgba(0,0,0,0.92)' }}>
      {meWon && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(30)].map((_,i) => (
            <motion.div key={i}
              initial={{ y:'-5%', x:`${Math.random()*100}%`, opacity:1, rotate:0 }}
              animate={{ y:'110%', opacity:[1,1,0], rotate:Math.random()*720 }}
              transition={{ duration:1.4+Math.random(), delay:Math.random()*0.8, ease:'easeIn' }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ background:['#fbbf24','#34d399','#60a5fa','#f87171','#a78bfa'][i%5] }} />
          ))}
        </div>
      )}
      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, damping:20 }}
        className="text-8xl mb-4">{meWon ? '🏆' : '💀'}</motion.div>
      <motion.h2 initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }}
        className={`text-4xl font-black tracking-widest mb-3 ${meWon ? 'text-yellow-400' : 'text-red-400'}`}>
        {meWon ? 'WYGRAŁEŚ!' : 'PRZEGRAŁEŚ!'}
      </motion.h2>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
        className="flex gap-10 mb-8 text-center">
        <div>
          <div className="text-2xl font-black text-yellow-400">${state.me.balance}</div>
          <div className="text-xs text-gray-400">{state.me.username}</div>
        </div>
        <div className="text-gray-600 text-2xl self-center">vs</div>
        <div>
          <div className="text-2xl font-black text-gray-400">${state.opponent.balance}</div>
          <div className="text-xs text-gray-500">{state.opponent.username}</div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}
        className="flex gap-4">
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={onPlayAgain}
          className="px-8 py-3 rounded-xl font-black text-sm tracking-wider"
          style={{ background:'#065f46', boxShadow:'0 4px 20px rgba(16,185,129,0.4)' }}>
          ZAGRAJ PONOWNIE
        </motion.button>
        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} onClick={onLobby}
          className="px-8 py-3 rounded-xl font-black text-sm tracking-wider bg-gray-800 border border-gray-600 text-gray-300">
          LOBBY
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────
export default function OnlineDuel({ onBack, username }) {
  const [screen, setScreen]     = useState('lobby'); // lobby | searching | game
  const [gameState, setGameState] = useState(null);
  const [localBet, setLocalBet] = useState(50);
  const [isReady, setIsReady]   = useState(false);
  const [error, setError]       = useState('');
  const [opponentLeft, setOpponentLeft] = useState(false);
  const socketRef = useRef(null);
  const savedRef  = useRef(false);

  // Save game result when session ends
  useEffect(() => {
    if (gameState?.phase === 'session_over' && !savedRef.current) {
      savedRef.current = true;
      const meWon = gameState.me.balance >= WIN_TARGET || (gameState.opponent.balance <= 0 && gameState.me.balance > 0);
      const profit = gameState.me.balance - SESSION_START;
      const rankBonus = meWon ? 35 : -5;
      api.saveGameResult(meWon, profit, gameState.me.balance, 'blackjack', rankBonus).catch(() => {});
    }
  }, [gameState?.phase]); // eslint-disable-line

  const initSocket = useCallback(() => {
    const token = localStorage.getItem('gc_token');
    if (!token) { setError('Brak sesji – zaloguj się ponownie.'); return null; }

    const s = getSocket(token);

    s.off('queue:waiting');
    s.off('game:matched');
    s.off('game:state');
    s.off('game:opponent-left');
    s.off('connect_error');

    s.on('queue:waiting', () => setScreen('searching'));
    s.on('game:matched', () => {
      setScreen('game');
      setIsReady(false);
      setOpponentLeft(false);
      savedRef.current = false;
    });
    s.on('game:state', (state) => {
      setGameState(state);
      // Auto-sync localBet with server bet when entering betting phase
      if (state.phase === 'betting') {
        setIsReady(state.me.status === 'ready');
      }
    });
    s.on('game:opponent-left', () => setOpponentLeft(true));
    s.on('connect_error', (e) => setError(`Błąd połączenia: ${e.message}`));

    socketRef.current = s;
    return s;
  }, []);

  const startSearch = useCallback(() => {
    setError('');
    const s = initSocket();
    if (s) s.emit('queue:join');
  }, [initSocket]);

  const cancelSearch = useCallback(() => {
    socketRef.current?.emit('queue:leave');
    setScreen('lobby');
  }, []);

  const sendBet = useCallback((bet) => {
    setLocalBet(bet);
    socketRef.current?.emit('game:bet', bet);
  }, []);

  const sendReady = useCallback(() => {
    socketRef.current?.emit('game:ready');
    setIsReady(true);
  }, []);

  const sendAction = useCallback((action) => {
    socketRef.current?.emit('game:action', action);
  }, []);

  const handleLeave = useCallback(() => {
    disconnectSocket();
    socketRef.current = null;
    onBack();
  }, [onBack]);

  const handlePlayAgain = useCallback(() => {
    setGameState(null);
    setScreen('searching');
    savedRef.current = false;
    const s = initSocket();
    if (s) s.emit('queue:join');
  }, [initSocket]);

  // ── Render helpers ─────────────────────────────────────────────
  const gs = gameState;
  const isMyTurn = gs?.me.status === 'playing';
  const canDouble = isMyTurn && gs?.me.hand.length === 2 && gs?.me.balance >= gs?.me.bet;
  const showDealer = gs && ['dealer','round_done','session_over'].includes(gs.phase);

  // ── LOBBY SCREEN ──────────────────────────────────────────────
  if (screen === 'lobby') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 px-4"
        style={{ background:'radial-gradient(ellipse at 50% 40%, #0d2818 0%, #060d0a 100%)' }}>
        <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={handleLeave}
          className="absolute top-4 left-5 text-emerald-400 font-bold text-sm hover:text-emerald-300">
          ← Lobby
        </motion.button>
        <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} className="text-center mb-8">
          <div className="text-6xl mb-3">🌐</div>
          <h1 className="text-3xl font-black text-white tracking-widest">ONLINE DUEL</h1>
          <p className="text-gray-400 text-sm mt-2 max-w-sm">
            Zagraj przeciwko prawdziwemu graczowi w czasie rzeczywistym.<br/>
            Obaj startujecie z <strong className="text-yellow-400">$500</strong>. Cel: <strong className="text-emerald-400">$1000</strong>!
          </p>
        </motion.div>
        {error && <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-700/30 rounded-xl px-4 py-2">{error}</div>}
        <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          onClick={startSearch}
          className="px-10 py-4 rounded-2xl font-black text-lg tracking-widest"
          style={{ background:'#065f46', boxShadow:'0 6px 30px rgba(16,185,129,0.45)' }}>
          🔍 SZUKAJ PRZECIWNIKA
        </motion.button>
        <p className="mt-6 text-xs text-gray-600">Gra w czasie rzeczywistym · WebSocket</p>
      </div>
    );
  }

  // ── SEARCHING SCREEN ──────────────────────────────────────────
  if (screen === 'searching') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-950 px-4"
        style={{ background:'radial-gradient(ellipse at 50% 40%, #0d2818 0%, #060d0a 100%)' }}>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div animate={{ rotate: 360 }} transition={{ duration:2, repeat:Infinity, ease:'linear' }}
              className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent" />
            <div className="absolute inset-3 rounded-full bg-emerald-900/40 flex items-center justify-center text-3xl">🎯</div>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Szukam przeciwnika...</h2>
          <p className="text-gray-500 text-sm mb-8">Czekam na innego gracza w kolejce</p>
          <motion.div className="flex gap-2 justify-center mb-8">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} animate={{ opacity:[0.2,1,0.2] }} transition={{ duration:1.5, delay:i*0.3, repeat:Infinity }}
                className="w-2 h-2 rounded-full bg-emerald-500" />
            ))}
          </motion.div>
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={cancelSearch}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-gray-400 border border-gray-700 hover:border-red-700 hover:text-red-400 transition-colors">
            Anuluj
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ── GAME SCREEN ───────────────────────────────────────────────
  if (screen === 'game') {
    return (
      <div className="h-screen flex flex-col overflow-hidden relative text-white" style={{ background:'#0a0f0c' }}>

        {/* Session end */}
        <AnimatePresence>
          {gs?.phase === 'session_over' && (
            <SessionEndOverlay state={gs} onLobby={handleLeave} onPlayAgain={handlePlayAgain} />
          )}
        </AnimatePresence>

        {/* Opponent left banner */}
        <AnimatePresence>
          {opponentLeft && (
            <motion.div initial={{ y:-60 }} animate={{ y:0 }} exit={{ y:-60 }}
              className="absolute top-12 inset-x-0 z-40 flex justify-center">
              <div className="bg-red-900 border border-red-600 text-red-200 text-sm font-bold px-6 py-3 rounded-xl shadow-2xl">
                ⚠️ Przeciwnik rozłączył się. Wygrywaś rundy domyślnie.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TOP BAR */}
        <motion.div initial={{ y:-44, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}
          className="shrink-0 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-blue-900/40 z-20">
          <motion.button whileHover={{ x:-3 }} whileTap={{ scale:0.95 }} onClick={handleLeave}
            className="text-emerald-400 hover:text-emerald-300 font-bold text-sm">← Opuść</motion.button>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="font-black tracking-widest text-sm text-white">🌐 ONLINE DUEL</span>
          </div>
          <div className="text-xs text-gray-500">Runda {gs?.round ?? 0}</div>
        </motion.div>

        {/* PROGRESS BARS */}
        {gs && (
          <div className="shrink-0 flex h-1.5 bg-gray-900 gap-px">
            <motion.div animate={{ width:`${Math.min(100,(gs.me.balance/WIN_TARGET)*100)}%` }} transition={{ duration:0.5 }}
              className="h-full" style={{ background: gs.me.balance <= 100 ? '#ef4444' : '#34d399' }} />
            <div className="flex-1 bg-gray-800" />
            <motion.div animate={{ width:`${Math.min(100,(gs.opponent.balance/WIN_TARGET)*100)}%` }} transition={{ duration:0.5 }}
              className="h-full" style={{ background: gs.opponent.balance <= 100 ? '#ef4444' : '#60a5fa', order:-1 }} />
          </div>
        )}

        {/* TABLE */}
        <div className="flex-1 relative flex flex-col overflow-hidden"
          style={{ background:'radial-gradient(ellipse at 50% 60%, #0d2818 0%, #050c08 100%)' }}>

          {/* Felt */}
          <div className="absolute inset-x-3 top-10 bottom-20 rounded-[50%_/_28%] pointer-events-none z-0"
            style={{ background:'radial-gradient(ellipse 80% 80% at 50% 40%, #1e6b3f 0%, #0f4226 60%, #072918 100%)',
              boxShadow:'inset 0 6px 60px rgba(0,0,0,0.7), 0 0 0 3px #0f3d22, 0 0 0 6px #c9a84c44' }} />
          <div className="absolute z-0 pointer-events-none select-none opacity-[0.05] text-center"
            style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
            <div className="text-yellow-300 text-xs font-black tracking-[0.3em] uppercase whitespace-nowrap">GoatCasino · Online</div>
          </div>

          {/* DEALER */}
          <div className="relative z-10 flex flex-col items-center pt-3 shrink-0">
            <div className="text-[10px] text-emerald-500/60 tracking-widest uppercase font-semibold mb-1.5">
              Krupier
              {showDealer && gs?.dealer.hand.length > 0 && (
                <strong className={`ml-1 ${gs.dealer.bust ? 'text-red-400' : 'text-white'}`}>
                  ({gs.dealer.total}{gs.dealer.bust ? ' - BUST' : ''})
                </strong>
              )}
            </div>
            <div className="flex gap-1.5 justify-center flex-wrap min-h-[72px]">
              {(gs?.dealer.hand ?? []).map((card, i) => (
                <MiniCard key={`dealer-${i}`} card={card} hidden={!showDealer && i === 1} delay={i * 0.15} />
              ))}
              {!gs && (
                <div className="text-gray-600 text-xs self-center">Czekam na start...</div>
              )}
            </div>
          </div>

          {/* Phase indicator */}
          {gs && (
            <div className="relative z-10 flex justify-center my-1 shrink-0">
              <AnimatePresence mode="wait">
                <motion.div key={gs.phase}
                  initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                  className={`text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full ${
                    gs.phase === 'playing'    ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/40' :
                    gs.phase === 'dealer'     ? 'bg-blue-900/50 text-blue-400 border border-blue-700/40' :
                    gs.phase === 'round_done' ? 'bg-gray-800 text-gray-400 border border-gray-700' :
                    gs.phase === 'betting'    ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-700/40' :
                    'bg-gray-800 text-gray-500 border border-gray-700'
                  }`}>
                  {gs.phase === 'betting'    && '💰 Faza zakładów'}
                  {gs.phase === 'playing'    && '🃏 Faza gry'}
                  {gs.phase === 'dealer'     && '🎲 Krupier gra...'}
                  {gs.phase === 'round_done' && `Runda ${gs.round} zakończona`}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* PLAYERS */}
          <div className="relative z-10 flex items-start justify-center gap-2 mt-auto mb-2 px-3 shrink-0">
            <PlayerPanel data={gs?.me}       isMe={true}  highlight={isMyTurn || gs?.phase === 'betting'} phase={gs?.phase} />
            <div className="flex flex-col items-center justify-center pt-8 shrink-0">
              <div className="w-px h-10 bg-gray-700" />
              <span className="text-xs text-gray-600 font-black my-1">VS</span>
              <div className="w-px h-10 bg-gray-700" />
            </div>
            <PlayerPanel data={gs?.opponent} isMe={false} highlight={gs?.opponent?.status === 'playing' || gs?.phase === 'betting'} phase={gs?.phase} />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="shrink-0 bg-gray-950 border-t-2 border-blue-900/30 px-4 py-2.5 z-20">
          <AnimatePresence mode="wait">

            {/* Betting phase */}
            {gs?.phase === 'betting' && (
              <motion.div key="betting" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.22 }}
                className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 tracking-widest uppercase">Twój zakład</span>
                  <span className="text-yellow-400 font-black text-sm">${localBet}</span>
                </div>
                <div className="flex gap-2 justify-center">
                  {[10,25,50,100,250].map(b => (
                    <motion.button key={b} whileTap={{ scale:0.82, rotate:-5 }} onClick={() => sendBet(b)}
                      disabled={isReady || b > (gs?.me.balance ?? 0)}
                      className="w-11 h-11 rounded-full border-4 font-black text-xs transition-all disabled:opacity-30"
                      style={localBet===b ? { borderColor:'#fbbf24', background:'#d97706', color:'#fef3c7', boxShadow:'0 0 16px rgba(234,179,8,0.6)' }
                        : { borderColor:'#374151', background:'#1f2937', color:'#9ca3af' }}>
                      ${b}
                    </motion.button>
                  ))}
                </div>
                {/* Quick bet shortcuts */}
                <div className="flex gap-2">
                  {[
                    { label: '1/3',    val: () => Math.max(10, Math.floor((gs?.me.balance ?? 0) / 3 / 5) * 5) },
                    { label: '1/2',    val: () => Math.max(10, Math.floor((gs?.me.balance ?? 0) / 2 / 5) * 5) },
                    { label: 'ALL IN', val: () => gs?.me.balance ?? 0 },
                  ].map(({ label, val }) => (
                    <motion.button key={label} whileTap={{ scale:0.92 }}
                      onClick={() => sendBet(Math.min(val(), gs?.me.balance ?? 0))}
                      disabled={isReady || (gs?.me.balance ?? 0) < 10}
                      className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-30"
                      style={{ background:'#1f2937', border:'1px solid #374151', color: label==='ALL IN' ? '#f87171' : '#34d399' }}>
                      {label}
                    </motion.button>
                  ))}
                </div>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={sendReady} disabled={isReady}
                  className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-50"
                  style={{ background: isReady ? '#065f2e' : '#065f46', boxShadow:'0 4px 20px rgba(16,185,129,0.35)' }}>
                  {isReady
                    ? <span className="flex items-center justify-center gap-2">✓ Gotowy! Czekam na przeciwnika
                        {[0,1,2].map(i => <motion.span key={i} animate={{ opacity:[0.3,1,0.3] }} transition={{ duration:1, delay:i*0.3, repeat:Infinity }} className="w-1 h-1 rounded-full bg-white inline-block" />)}
                      </span>
                    : 'GOTOWY / ROZDAJ'}
                </motion.button>
              </motion.div>
            )}

            {/* Playing phase */}
            {gs?.phase === 'playing' && (
              <motion.div key="playing" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.22 }}>
                {isMyTurn ? (
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={() => sendAction('hit')}
                      className="flex-1 py-4 rounded-2xl font-black text-sm tracking-wider border border-blue-500/30"
                      style={{ background:'#1d4ed8' }}>🃏 HIT</motion.button>
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={() => sendAction('stand')}
                      className="flex-1 py-4 rounded-2xl font-black text-sm tracking-wider border border-red-500/30"
                      style={{ background:'#991b1b' }}>✋ STAND</motion.button>
                    {canDouble && (
                      <motion.button initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                        whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={() => sendAction('double')}
                        className="flex-1 py-4 rounded-2xl font-black text-sm tracking-wider border border-yellow-500/30"
                        style={{ background:'#b45309' }}>x2 DBL</motion.button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 py-4">
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ y:[0,-10,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
                        className="w-3 h-3 rounded-full bg-blue-500" />
                    ))}
                    <span className="text-gray-400 text-sm ml-1">Czekam na {gs?.opponent.username}...</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Dealer / round done */}
            {(gs?.phase === 'dealer' || gs?.phase === 'round_done') && (
              <motion.div key="dealer" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="flex items-center justify-center gap-3 py-4">
                {gs.phase === 'dealer' ? (
                  <>
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ y:[0,-10,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
                        className="w-3 h-3 rounded-full bg-emerald-500" />
                    ))}
                    <span className="text-gray-400 text-sm ml-1">Krupier gra...</span>
                  </>
                ) : (
                  <span className="text-gray-500 text-sm">Następna runda startuje automatycznie...</span>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
