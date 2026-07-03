import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createDeck, handTotal, isBlackjack, isBust } from '../utils/blackjack';
import { simulateBotTurn } from '../utils/botStrategy';
import PlayingCard from './PlayingCard';
import { api } from '../api';

const SESSION_START = 500;
const WIN_TARGET    = 1000;
const DEAL_DELAYS   = [0, 0.32, 0.64, 0.96];

const PHASE = {
  SELECT:       'select',
  IDLE:         'idle',
  DEALING:      'dealing',
  PLAYER_TURN:  'player_turn',
  BOT_TURN:     'bot_turn',
  DEALER_TURN:  'dealer_turn',
  ROUND_DONE:   'round_done',
  DUEL_WIN:     'duel_win',
  DUEL_LOSE:    'duel_lose',
};

const DIFFICULTIES = [
  { id: 'easy',   label: 'Łatwy',   icon: '🐣', color: '#22c55e', desc: 'Bot gra losowo – idealny dla początkujących' },
  { id: 'medium', label: 'Średni',  icon: '🦊', color: '#f59e0b', desc: 'Podstawowa strategia – dobry wyzwanie' },
  { id: 'hard',   label: 'Trudny',  icon: '🦈', color: '#ef4444', desc: 'Pełna basic strategy – prawie nie do pokonania' },
];

const BOT_NAMES = { easy: 'GoatBot Jr.', medium: 'GoatBot Pro', hard: 'GoatBot Shark' };

function SmallCard({ card, hidden }) {
  const isRed = card?.suit === '♥' || card?.suit === '♦';
  if (hidden || !card) {
    return (
      <div className="w-14 h-20 rounded-lg bg-gradient-to-br from-emerald-800 to-emerald-950 border border-emerald-600 flex items-center justify-center text-emerald-300 text-lg shadow-md">
        🂠
      </div>
    );
  }
  return (
    <motion.div
      initial={{ x: 200, y: -100, rotate: 20, opacity: 0, scale: 0.7 }}
      animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
      transition={{ delay: card.dealDelay ?? 0, duration: 0.42, type: 'spring', stiffness: 180, damping: 20 }}
      className="w-14 h-20 rounded-lg bg-white border border-gray-200 flex flex-col justify-between p-1.5 shadow-md select-none"
    >
      <div className={`text-xs font-black leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{card.suit}</div>
      </div>
      <div className={`text-lg text-center ${isRed ? 'text-red-600' : 'text-gray-900'}`}>{card.suit}</div>
      <div className={`text-xs font-black leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div><div>{card.suit}</div>
      </div>
    </motion.div>
  );
}

function PlayerZone({ label, hand, score, bust, balance, bet, isActive, avatar, colorClass, isBot, thinking }) {
  return (
    <div className={`flex flex-col items-center transition-all duration-300 flex-1 min-w-0 ${!isActive && hand.length > 0 ? 'opacity-60' : ''}`}>
      {/* Avatar + name */}
      <div className={`flex items-center gap-1.5 mb-1.5 px-3 py-1 rounded-full border ${isActive ? 'border-yellow-400/60 bg-yellow-900/20' : 'border-gray-700 bg-transparent'}`}>
        <span className="text-lg">{avatar}</span>
        <span className={`text-xs font-black tracking-wide ${isActive ? 'text-yellow-300' : 'text-gray-400'}`}>{label}</span>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-2 mb-1">
        <motion.span key={balance} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
          className={`text-sm font-black ${balance <= 50 ? 'text-red-400' : colorClass}`}>
          ${balance.toLocaleString()}
        </motion.span>
        {bet > 0 && hand.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full">-${bet}</span>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-1.5 justify-center flex-wrap min-h-[84px] relative">
        {thinking && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-0 flex items-center justify-center gap-1.5 z-10">
            {[0,1,2].map(i => (
              <motion.div key={i} animate={{ y:[0,-8,0] }} transition={{ duration:0.5, delay:i*0.15, repeat:Infinity }}
                className="w-2 h-2 rounded-full bg-yellow-400" />
            ))}
          </motion.div>
        )}
        {hand.map((card, i) => (
          <SmallCard key={`${label}-${i}-${card.rank}${card.suit}`} card={card} />
        ))}
      </div>

      {/* Score */}
      {score != null && (
        <motion.div
          key={score}
          initial={{ scale: 1.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`mt-1.5 text-3xl font-black ${bust ? 'text-red-400' : 'text-white'}`}
        >
          {score}{bust && <span className="text-sm ml-1 font-bold">BUST</span>}
        </motion.div>
      )}
    </div>
  );
}

// ── Difficulty selection screen ───────────────────────────────────
function DifficultySelect({ onSelect, onBack }) {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-950 px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d2818 0%, #060d0a 100%)' }}>
      <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={onBack}
        className="absolute top-4 left-5 text-emerald-400 font-bold text-sm hover:text-emerald-300">
        ← Lobby
      </motion.button>

      <motion.div initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} className="text-center mb-8">
        <div className="text-5xl mb-3">⚔️</div>
        <h1 className="text-3xl font-black text-white tracking-widest">TRYB DUEL</h1>
        <p className="text-gray-400 text-sm mt-2">Zagraj przeciwko botowi. Pierwszy do $1000 wygrywa!</p>
      </motion.div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {DIFFICULTIES.map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity:0, x:-30 }}
            animate={{ opacity:1, x:0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            whileHover={{ scale: 1.03, x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(d.id)}
            className="flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all"
            style={{ borderColor: `${d.color}44`, background: `${d.color}11` }}
          >
            <span className="text-4xl">{d.icon}</span>
            <div className="flex-1">
              <div className="font-black text-white text-base">{d.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{d.desc}</div>
            </div>
            <div className="text-xs font-black px-2 py-1 rounded-lg" style={{ background: `${d.color}33`, color: d.color }}>
              WYBIERZ
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ── Session end overlay ───────────────────────────────────────────
function DuelEndOverlay({ playerWon, playerBalance, botBalance, difficulty, onPlayAgain, onLobby }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.9)' }}>
      {playerWon ? (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(28)].map((_,i) => (
            <motion.div key={i}
              initial={{ y:'-10%', x:`${Math.random()*100}%`, opacity:1, rotate:0 }}
              animate={{ y:'110%', opacity:[1,1,0], rotate: Math.random()*720 }}
              transition={{ duration: 1.4+Math.random(), delay: Math.random()*0.8, ease:'easeIn' }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ background:['#fbbf24','#34d399','#60a5fa','#f87171','#a78bfa','#fb923c'][i%6] }}
            />
          ))}
        </div>
      ) : null}

      <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:300, damping:20 }}
        className="text-8xl mb-4">{playerWon ? '🏆' : '💀'}</motion.div>
      <motion.h2 initial={{ y:30, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:0.2 }}
        className={`text-4xl font-black tracking-widest mb-2 ${playerWon ? 'text-yellow-400' : 'text-red-400'}`}>
        {playerWon ? 'WYGRAŁEŚ DUEL!' : 'PRZEGRAŁEŚ DUEL!'}
      </motion.h2>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
        className="flex gap-8 mb-8 text-center">
        <div>
          <div className="text-2xl font-black text-white">${playerBalance}</div>
          <div className="text-xs text-gray-400">Twoje saldo</div>
        </div>
        <div className="text-gray-600 text-2xl self-center">vs</div>
        <div>
          <div className="text-2xl font-black text-gray-400">${botBalance}</div>
          <div className="text-xs text-gray-500">{BOT_NAMES[difficulty]}</div>
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

// ── Main DuelGame component ───────────────────────────────────────
export default function DuelGame({ onBack, username }) {
  const [phase, setPhase]         = useState(PHASE.SELECT);
  const [difficulty, setDifficulty] = useState('medium');

  const [playerBal, setPlayerBal] = useState(SESSION_START);
  const [botBal, setBotBal]       = useState(SESSION_START);
  const [bet, setBet]             = useState(50);
  const [deck, setDeck]           = useState([]);

  const [playerHand, setPlayerHand] = useState([]);
  const [botHand, setBotHand]       = useState([]);
  const [dealerHand, setDealerHand] = useState([]);

  const [botThinking, setBotThinking] = useState(false);
  const [botBet, setBotBet]           = useState(50);

  const [roundMsg, setRoundMsg]   = useState(null);
  const [botSpeech, setBotSpeech] = useState('');

  const savedRef = useRef(false);

  const dealerReveal = [PHASE.DEALER_TURN, PHASE.ROUND_DONE, PHASE.DUEL_WIN, PHASE.DUEL_LOSE].includes(phase);

  // ── Session end effects ──────────────────────────────────────────
  useEffect(() => {
    if (phase === PHASE.ROUND_DONE) {
      // Check win conditions after round
      const pWin = playerBal >= WIN_TARGET;
      const bWin = botBal >= WIN_TARGET;
      const pBust = playerBal <= 0;
      const bBust = botBal <= 0;

      if (pWin || bBust) {
        setTimeout(() => setPhase(PHASE.DUEL_WIN), 1800);
      } else if (bWin || pBust) {
        setTimeout(() => setPhase(PHASE.DUEL_LOSE), 1800);
      }
    }
  }, [phase, playerBal, botBal]);

  useEffect(() => {
    if ((phase === PHASE.DUEL_WIN || phase === PHASE.DUEL_LOSE) && !savedRef.current) {
      savedRef.current = true;
      const won = phase === PHASE.DUEL_WIN;
      api.saveGameResult(won, playerBal - SESSION_START, playerBal).catch(() => {});
    }
  }, [phase]); // eslint-disable-line

  // ── Deal ──────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    if (bet > playerBal || bet > botBal) return;
    const newDeck = createDeck();
    const d0 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[0] };
    const p0 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[1] };
    const d1 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[2] };
    const p1 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[3] };
    // Bot cards dealt slightly after
    const b0 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[1] + 0.1 };
    const b1 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[3] + 0.1 };

    setDeck(newDeck);
    setPlayerHand([p0, p1]);
    setBotHand([b0, b1]);
    setDealerHand([d0, d1]);
    setRoundMsg(null);
    setBotSpeech('');
    setBotBet(bet);
    setPhase(PHASE.DEALING);

    setTimeout(() => {
      setPlayerBal(b => b - bet);
      setBotBal(b => b - bet);

      const player = [p0, p1];
      const dealer = [d0, d1];
      const bot = [b0, b1];

      // Check instant blackjacks
      if (isBlackjack(player) || isBlackjack(bot) || isBlackjack(dealer)) {
        resolveRound(newDeck, bot, dealer, player, bet, bet);
      } else {
        setPhase(PHASE.PLAYER_TURN);
      }
    }, DEAL_DELAYS[3] * 1000 + 700);
  }, [bet, playerBal, botBal]); // eslint-disable-line

  // ── Player actions ───────────────────────────────────────────────
  const hit = useCallback(() => {
    const newDeck = [...deck];
    const card = { ...newDeck.pop(), dealDelay: 0 };
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);
    if (isBust(newHand) || handTotal(newHand) === 21) {
      startBotPhase(newDeck, newHand);
    }
  }, [deck, playerHand]); // eslint-disable-line

  const stand = useCallback(() => {
    startBotPhase(deck, playerHand);
  }, [deck, playerHand]); // eslint-disable-line

  const double = useCallback(() => {
    if (playerBal < bet) return;
    setPlayerBal(b => b - bet);
    const newBet = bet * 2;
    const newDeck = [...deck];
    const card = { ...newDeck.pop(), dealDelay: 0 };
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);
    startBotPhase(newDeck, newHand, newBet);
  }, [playerBal, bet, deck, playerHand]); // eslint-disable-line

  // ── Bot phase ────────────────────────────────────────────────────
  function startBotPhase(currentDeck, currentPlayerHand, currentPlayerBet = bet) {
    setPhase(PHASE.BOT_TURN);
    setBotThinking(true);

    // Pre-compute bot moves
    const { moves, finalHand, finalDeck, finalBet } = simulateBotTurn(
      difficulty, botHand, dealerHand[0], currentDeck, botBet, botBal
    );

    const baseDelay = 700;
    const perMove = 850;

    if (moves.length === 0) {
      setBotSpeech('Stand!');
      setTimeout(() => {
        setBotThinking(false);
        resolveRound(finalDeck, botHand, dealerHand, currentPlayerHand, currentPlayerBet, finalBet);
      }, baseDelay + 400);
    } else {
      moves.forEach((move, i) => {
        setTimeout(() => {
          setBotHand([...move.hand]);
          setDeck([...move.deck]);
          setBotSpeech(move.type === 'double' ? 'Double Down!' : 'Hit!');
          if (i === moves.length - 1) {
            // deduct extra bet for double
            if (move.type === 'double') setBotBal(b => b - botBet);
            setTimeout(() => {
              setBotThinking(false);
              setBotSpeech('Stand.');
              resolveRound(move.deck, move.hand, dealerHand, currentPlayerHand, currentPlayerBet, finalBet);
            }, perMove);
          }
        }, baseDelay + i * perMove);
      });
    }
  }

  // ── Dealer + resolve ─────────────────────────────────────────────
  function resolveRound(currentDeck, finalBotHand, currentDealerHand, currentPlayerHand, playerCurrentBet, botCurrentBet) {
    setPhase(PHASE.DEALER_TURN);

    let dk = [...currentDeck];
    let dc = [...currentDealerHand];
    while (handTotal(dc) < 17) dc.push({ ...dk.pop(), dealDelay: 0 });
    setDeck(dk);
    setDealerHand(dc);

    setTimeout(() => {
      const dt = handTotal(dc);
      const pt = handTotal(currentPlayerHand);
      const bt = handTotal(finalBotHand);

      function compare(handTotal, bet, isBustHand) {
        if (isBustHand) return { delta: 0, type: 'lose' };
        if (isBust(dc) || handTotal > dt) return { delta: bet * 2, type: 'win' };
        if (handTotal < dt) return { delta: 0, type: 'lose' };
        return { delta: bet, type: 'draw' };
      }

      const pResult = compare(pt, playerCurrentBet, isBust(currentPlayerHand));
      const bResult = compare(bt, botCurrentBet, isBust(finalBotHand));

      setPlayerBal(b => b + pResult.delta);
      setBotBal(b => b + bResult.delta);

      const msgs = {
        win:  ['Wygrałeś!', '🎉 Wygrana!', 'Dobra ręka!'],
        lose: ['Krupier wygrywa.', '😞 Przegrana', 'Pech...'],
        draw: ['Remis!', '🤝 Remis', 'Wyrównanie!'],
      };
      const m = msgs[pResult.type];
      setRoundMsg({
        text: m[Math.floor(Math.random() * m.length)],
        pType: pResult.type,
        bType: bResult.type,
      });
      setBotSpeech(bResult.type === 'win' ? 'Wygram!' : bResult.type === 'lose' ? 'Tym razem Twoje...' : 'Remis!');
      setPhase(PHASE.ROUND_DONE);
    }, 700);
  }

  // ── Reset session ─────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setPlayerBal(SESSION_START);
    setBotBal(SESSION_START);
    setBet(50);
    setDeck([]);
    setPlayerHand([]);
    setBotHand([]);
    setDealerHand([]);
    setRoundMsg(null);
    setBotSpeech('');
    setBotThinking(false);
    savedRef.current = false;
    setPhase(PHASE.IDLE);
  }, []);

  // ── SELECT SCREEN ─────────────────────────────────────────────────
  if (phase === PHASE.SELECT) {
    return <DifficultySelect onSelect={(d) => { setDifficulty(d); setPhase(PHASE.IDLE); }} onBack={onBack} />;
  }

  const isPlayerTurn = phase === PHASE.PLAYER_TURN;
  const isWaiting    = phase === PHASE.DEALING || phase === PHASE.DEALER_TURN || phase === PHASE.BOT_TURN;
  const canDouble    = isPlayerTurn && playerHand.length === 2 && playerBal >= bet;
  const diff = DIFFICULTIES.find(d => d.id === difficulty);

  const pProgress = Math.min(100, (playerBal / WIN_TARGET) * 100);
  const bProgress = Math.min(100, (botBal / WIN_TARGET) * 100);

  return (
    <div className="h-screen flex flex-col overflow-hidden relative text-white" style={{ background: '#0a0f0c' }}>

      {/* End overlays */}
      <AnimatePresence>
        {phase === PHASE.DUEL_WIN && (
          <DuelEndOverlay playerWon difficulty={difficulty} playerBalance={playerBal} botBalance={botBal}
            onPlayAgain={resetSession} onLobby={onBack} />
        )}
        {phase === PHASE.DUEL_LOSE && (
          <DuelEndOverlay playerWon={false} difficulty={difficulty} playerBalance={playerBal} botBalance={botBal}
            onPlayAgain={resetSession} onLobby={onBack} />
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <motion.div initial={{ y:-44, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.4 }}
        className="shrink-0 flex items-center justify-between px-4 py-2 bg-black/80 border-b border-yellow-900/40 z-20">
        <motion.button whileHover={{ x:-3 }} whileTap={{ scale:0.95 }} onClick={onBack}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-sm">← Lobby</motion.button>
        <div className="flex items-center gap-1.5">
          <span className="text-base">⚔️</span>
          <span className="font-black tracking-widest text-sm text-white">DUEL</span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: `${diff.color}33`, color: diff.color }}>
            {diff.icon} {diff.label}
          </span>
        </div>
        <div className="text-xs text-gray-500">Cel: ${WIN_TARGET.toLocaleString()}</div>
      </motion.div>

      {/* PROGRESS BARS */}
      <div className="shrink-0 flex h-1.5 bg-gray-900">
        <motion.div animate={{ width:`${pProgress}%` }} transition={{ duration:0.5 }} className="h-full"
          style={{ background: playerBal <= 100 ? '#ef4444' : '#34d399' }} />
        <div className="flex-1 bg-gray-800" />
        <motion.div animate={{ width:`${bProgress}%` }} transition={{ duration:0.5 }} className="h-full"
          style={{ background: botBal <= 100 ? '#ef4444' : diff.color, order:-1 }} />
      </div>

      {/* TABLE */}
      <div className="flex-1 relative flex flex-col overflow-hidden"
        style={{ background:'radial-gradient(ellipse at 50% 60%, #0d2818 0%, #050c08 100%)' }}>

        {/* Felt */}
        <div className="absolute inset-x-3 top-12 bottom-20 rounded-[50%_/_28%] pointer-events-none z-0"
          style={{ background:'radial-gradient(ellipse 80% 80% at 50% 40%, #1e6b3f 0%, #0f4226 60%, #072918 100%)',
            boxShadow:'inset 0 6px 60px rgba(0,0,0,0.7), 0 0 0 3px #0f3d22, 0 0 0 6px #c9a84c44' }} />

        {/* Divider line */}
        <div className="absolute top-1/2 left-[48%] w-[4%] h-0.5 bg-yellow-800/40 pointer-events-none z-0 -translate-y-1/2"
          style={{ top:'55%' }} />
        <div className="absolute z-0 pointer-events-none select-none opacity-[0.06] text-center"
          style={{ top:'50%', left:'50%', transform:'translate(-50%,-50%)' }}>
          <div className="text-yellow-300 text-xs font-black tracking-[0.3em] uppercase whitespace-nowrap">GoatCasino</div>
        </div>

        {/* DEALER */}
        <div className="relative z-10 flex flex-col items-center pt-2 shrink-0">
          <div className="text-[10px] text-emerald-500/60 tracking-widest uppercase font-semibold mb-1">
            Krupier{dealerReveal && dealerHand.length > 0 && <motion.strong key={handTotal(dealerHand)} initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }} className="ml-2 text-2xl text-white font-black"> {handTotal(dealerHand)}</motion.strong>}
          </div>
          <div className="flex gap-1.5 justify-center flex-wrap min-h-[84px]">
            {dealerHand.map((card, i) => (
              <SmallCard key={`dealer-${i}-${card.rank}${card.suit}`} card={card} hidden={!dealerReveal && i === 1} />
            ))}
          </div>
        </div>

        {/* ROUND RESULT POPUP */}
        <AnimatePresence>
          {roundMsg && phase === PHASE.ROUND_DONE && (
            <motion.div
              initial={{ scale:0.3, opacity:0, y:-20 }} animate={{ scale:1, opacity:1, y:0 }}
              exit={{ scale:0.8, opacity:0 }}
              transition={{ type:'spring', stiffness:380, damping:22 }}
              className="absolute left-1/2 -translate-x-1/2 z-30 top-[35%] -translate-y-1/2 text-center"
            >
              <div className={`text-xl font-black px-5 py-3 rounded-2xl border backdrop-blur-sm ${
                roundMsg.pType === 'win' ? 'bg-emerald-900/80 border-emerald-400/60 text-emerald-200'
                : roundMsg.pType === 'lose' ? 'bg-red-900/80 border-red-400/60 text-red-200'
                : 'bg-yellow-900/80 border-yellow-400/60 text-yellow-200'
              }`}>
                {roundMsg.text}
              </div>
              {/* Bot result */}
              <div className={`mt-1 text-xs font-bold px-3 py-1 rounded-xl mx-auto inline-block ${
                roundMsg.bType === 'win' ? 'bg-gray-800 text-gray-400' : roundMsg.bType === 'lose' ? 'bg-gray-800 text-emerald-500' : 'bg-gray-800 text-gray-500'
              }`}>
                {BOT_NAMES[difficulty]}: {roundMsg.bType === 'win' ? 'Wygrał' : roundMsg.bType === 'lose' ? 'Przegrał' : 'Remis'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLAYER HANDS — side by side */}
        <div className="relative z-10 flex items-start justify-center gap-2 mt-auto mb-1 px-3 shrink-0">
          {/* PLAYER */}
          <PlayerZone
            label={username || 'Ty'}
            hand={playerHand}
            score={playerHand.length > 0 ? handTotal(playerHand) : null}
            bust={isBust(playerHand)}
            balance={playerBal}
            bet={isPlayerTurn || phase === PHASE.BOT_TURN || phase === PHASE.DEALER_TURN || phase === PHASE.ROUND_DONE ? bet : 0}
            isActive={isPlayerTurn}
            avatar="🧑"
            colorClass="text-emerald-400"
            isBot={false}
            thinking={false}
          />

          {/* VS */}
          <div className="flex flex-col items-center justify-center pt-8 shrink-0">
            <div className="w-px h-12 bg-gray-700" />
            <span className="text-xs text-gray-600 font-black my-1">VS</span>
            <div className="w-px h-12 bg-gray-700" />
          </div>

          {/* BOT */}
          <PlayerZone
            label={BOT_NAMES[difficulty]}
            hand={botHand}
            score={botHand.length > 0 ? handTotal(botHand) : null}
            bust={isBust(botHand)}
            balance={botBal}
            bet={phase === PHASE.BOT_TURN || phase === PHASE.DEALER_TURN || phase === PHASE.ROUND_DONE ? botBet : 0}
            isActive={phase === PHASE.BOT_TURN}
            avatar={diff.icon}
            colorClass={`text-[${diff.color}]`}
            isBot
            thinking={botThinking}
          />
        </div>

        {/* Bot speech */}
        <AnimatePresence>
          {botSpeech && (
            <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
              className="absolute bottom-24 right-6 z-20 bg-gray-900/90 border border-gray-700 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-xl rounded-br-none shadow-lg max-w-32 text-center">
              {botSpeech}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTROLS */}
      <div className="shrink-0 bg-gray-950 border-t-2 border-yellow-900/30 px-4 py-2.5 z-20">
        <AnimatePresence mode="wait">

          {(phase === PHASE.IDLE || phase === PHASE.ROUND_DONE) && (
            <motion.div key="bet" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.22 }} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 tracking-widest uppercase">Zakład</span>
                <span className="text-yellow-400 font-black text-sm">${bet}</span>
              </div>
              <div className="flex gap-2 justify-center">
                {[10,25,50,100,250].map(b => (
                  <motion.button key={b} whileTap={{ scale:0.82, rotate:-5 }} onClick={() => setBet(b)}
                    disabled={b > playerBal || b > botBal}
                    className="w-11 h-11 rounded-full border-4 font-black text-xs transition-all disabled:opacity-30"
                    style={bet===b ? { borderColor:'#fbbf24', background:'#d97706', color:'#fef3c7', boxShadow:'0 0 16px rgba(234,179,8,0.6)' }
                      : { borderColor:'#374151', background:'#1f2937', color:'#9ca3af' }}>
                    ${b}
                  </motion.button>
                ))}
              </div>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={deal} disabled={bet > playerBal || bet > botBal}
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={phase === PHASE.ROUND_DONE
                  ? { background:'#10b981', boxShadow:'0 4px 28px rgba(16,185,129,0.6)', color:'#fff' }
                  : { background:'#065f46', boxShadow:'0 4px 20px rgba(16,185,129,0.35)' }}>
                {phase === PHASE.ROUND_DONE ? 'NASTĘPNA RUNDA' : 'ROZDAJ KARTY'}
              </motion.button>
            </motion.div>
          )}

          {isPlayerTurn && (
            <motion.div key="actions" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.22 }} className="flex gap-2">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={hit}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-blue-500/30"
                style={{ background:'#1d4ed8' }}>🃏 HIT</motion.button>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={stand}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-red-500/30"
                style={{ background:'#991b1b' }}>✋ STAND</motion.button>
              {canDouble && (
                <motion.button initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={double}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-yellow-500/30"
                  style={{ background:'#b45309' }}>x2 DBL</motion.button>
              )}
            </motion.div>
          )}

          {isWaiting && (
            <motion.div key="wait" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex items-center justify-center gap-3 py-3.5">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y:[0,-10,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
                  className="w-3 h-3 rounded-full bg-emerald-500" />
              ))}
              <span className="text-gray-400 text-sm ml-1">
                {phase === PHASE.DEALING ? 'Rozdawanie kart...'
                  : phase === PHASE.BOT_TURN ? `${BOT_NAMES[difficulty]} gra...`
                  : 'Krupier gra...'}
              </span>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
