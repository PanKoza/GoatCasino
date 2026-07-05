import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createDeck, handTotal, isBlackjack, isBust } from "../utils/blackjack";
import PlayingCard from "./PlayingCard";
import { api } from "../api";

const SESSION_START = 500;
const WIN_TARGET    = 1000;

const STATUS = {
  IDLE:        "idle",
  DEALING:     "dealing",
  PLAYER_TURN: "player_turn",
  DEALER_TURN: "dealer_turn",
  DONE:        "done",
  SESSION_WIN: "session_win",
  SESSION_LOSE:"session_lose",
};

const DEAL_DELAYS = [0, 0.38, 0.76, 1.14];
const DEAL_DONE_MS = 1600;

const PHRASES = {
  idle:        ["Zapraszam do gry!", "Postaw zaklad!", "Szczescie czeka na Ciebie!"],
  dealing:     ["Rozdaje karty...", "Prosze, oto karty!"],
  player_turn: ["Twoj ruch, graczu.", "Hit czy Stand?", "Ostroznie z decyzja!"],
  dealer_turn: ["Teraz ja...", "Dobieramy karty..."],
  split:       ["Split! Dwie rece!", "Ciekawy ruch!", "Gramy na dwie rece!"],
  win:         ["Gratulacje! Wygrales!", "Niezle grasz!", "Dobra reka!"],
  lose:        ["Tym razem moje!", "Moze nastepnym razem!", "Kasyno wygrywa!"],
  draw:        ["Remis. Zwrot zakladu.", "Rowno! Zaklad wraca."],
  blackjack:   ["BLACKJACK! Niesamowite!", "Ach, Blackjack! Gratulacje!"],
  session_win: ["NIESAMOWITE! Podwoiles budzet!", "Jestes mistrzem!", "Wygrales sesje!"],
  session_lose:["Budzetkoniec... Moze nastepnym razem?", "Wszystko stracone!", "Sprobuj jeszcze raz!"],
};

function getPhrase(key) {
  const arr = PHRASES[key] || PHRASES.idle;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── SVG Dealer Face ──────────────────────────────────────────────
function DealerFace({ mood }) {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="14" y="14" width="52" height="6" rx="3" fill="#1a1a2e" />
      <rect x="22" y="0" width="36" height="18" rx="4" fill="#111128" />
      <rect x="22" y="13" width="36" height="4" rx="1" fill="#c9a84c" opacity="0.7" />
      <circle cx="40" cy="52" r="26" fill="url(#skinG)" />
      <defs>
        <radialGradient id="skinG" cx="40%" cy="35%" r="65%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5c07a" />
          <stop offset="100%" stopColor="#d9923a" />
        </radialGradient>
      </defs>
      {mood === "shocked" ? (
        <><circle cx="30" cy="47" r="5" fill="#fff"/><circle cx="50" cy="47" r="5" fill="#fff"/>
          <circle cx="30" cy="47" r="3" fill="#2d1a00"/><circle cx="50" cy="47" r="3" fill="#2d1a00"/></>
      ) : mood === "thinking" ? (
        <><ellipse cx="30" cy="47" rx="5" ry="4" fill="#fff"/><ellipse cx="50" cy="47" rx="5" ry="4" fill="#fff"/>
          <ellipse cx="31" cy="46" rx="3" ry="3" fill="#2d1a00"/><ellipse cx="51" cy="46" rx="3" ry="3" fill="#2d1a00"/>
          <path d="M45 39 Q50 36 55 38" stroke="#2d1a00" strokeWidth="2" strokeLinecap="round" fill="none"/></>
      ) : mood === "happy" ? (
        <><path d="M25 47 Q30 43 35 47" stroke="#2d1a00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <path d="M45 47 Q50 43 55 47" stroke="#2d1a00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
          <ellipse cx="23" cy="55" rx="5" ry="3" fill="#f87171" opacity="0.35"/>
          <ellipse cx="57" cy="55" rx="5" ry="3" fill="#f87171" opacity="0.35"/></>
      ) : (
        <><circle cx="30" cy="47" r="5" fill="#fff"/><circle cx="50" cy="47" r="5" fill="#fff"/>
          <circle cx="30" cy="47" r="3" fill="#2d1a00"/><circle cx="50" cy="47" r="3" fill="#2d1a00"/>
          <circle cx="31" cy="46" r="1" fill="#fff" opacity="0.6"/><circle cx="51" cy="46" r="1" fill="#fff" opacity="0.6"/></>
      )}
      {mood === "happy"
        ? <path d="M28 63 Q40 73 52 63" stroke="#2d1a00" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        : mood === "shocked" ? <ellipse cx="40" cy="65" rx="5" ry="6" fill="#2d1a00"/>
        : mood === "thinking" ? <path d="M32 64 Q40 62 48 64" stroke="#2d1a00" strokeWidth="2" strokeLinecap="round" fill="none"/>
        : <path d="M30 64 Q40 70 50 64" stroke="#2d1a00" strokeWidth="2" strokeLinecap="round" fill="none"/>
      }
    </svg>
  );
}

function DealerTorso() {
  return (
    <svg width="96" height="56" viewBox="0 0 96 56" fill="none">
      <rect x="0" y="0" width="96" height="56" rx="12" fill="#1a1a2e"/>
      <path d="M48 0 L28 24 L48 18 Z" fill="#16213e"/>
      <path d="M48 0 L68 24 L48 18 Z" fill="#16213e"/>
      <rect x="39" y="4" width="18" height="30" rx="2" fill="#f8f8f8"/>
      <circle cx="48" cy="12" r="1.5" fill="#ccc"/><circle cx="48" cy="19" r="1.5" fill="#ccc"/><circle cx="48" cy="26" r="1.5" fill="#ccc"/>
      <polygon points="39,3 48,9 39,15" fill="#dc2626"/>
      <polygon points="57,3 48,9 57,15" fill="#dc2626"/>
      <circle cx="48" cy="9" r="3" fill="#b91c1c"/>
    </svg>
  );
}

// ── Hand display component ────────────────────────────────────────
function HandArea({ cards, label, score, bust, active, isDealer, hidden2 }) {
  return (
    <div className={`flex flex-col items-center transition-opacity duration-300 ${!active && !isDealer ? "opacity-50" : ""}`}>
      <div className={`flex flex-col items-center mb-2`}>
        <div className={`text-[10px] tracking-widest uppercase font-semibold ${bust ? "text-red-400" : "text-emerald-400/70"}`}>
          {label}
          {active && !isDealer && <span className="ml-1.5 text-yellow-400">◄</span>}
        </div>
        {score != null && (
          <motion.div
            key={score}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className={`text-3xl font-black mt-0.5 ${bust ? "text-red-400" : "text-white"}`}
          >
            {score}{bust ? <span className="text-base ml-1 font-bold">BUST</span> : ""}
          </motion.div>
        )}
      </div>
      {active && !isDealer && (
        <motion.div
          animate={{ scaleX: [1, 1.02, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="absolute -inset-2 rounded-2xl border-2 border-yellow-400/40 pointer-events-none"
        />
      )}
      <div className="flex gap-2 justify-center flex-wrap min-h-[7rem] relative">
        {cards.map((card, i) => (
          <PlayingCard
            key={`${label}-${i}-${card.rank}${card.suit}`}
            card={card}
            hidden={isDealer && i === 1 && hidden2}
            fromDeck
            dealDelay={card.dealDelay ?? 0}
          />
        ))}
      </div>
    </div>
  );
}

// ── Session End Overlay ───────────────────────────────────────────
function SessionOverlay({ won, balance, peakBalance, onPlayAgain, onLobby }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.88)" }}
    >
      {won ? (
        <>
          {/* Confetti */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div key={i}
                initial={{ y: "-10%", x: `${Math.random() * 100}%`, opacity: 1, rotate: 0 }}
                animate={{ y: "110%", opacity: [1,1,0], rotate: Math.random() * 720 }}
                transition={{ duration: 1.5 + Math.random(), delay: Math.random() * 0.8, ease: "easeIn" }}
                className="absolute w-3 h-3 rounded-sm"
                style={{ background: ["#fbbf24","#34d399","#60a5fa","#f87171","#a78bfa","#fb923c"][i % 6] }}
              />
            ))}
          </div>
          <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-8xl mb-4">🏆</motion.div>
          <motion.h2 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-4xl font-black text-yellow-400 tracking-widest mb-2">WYGRALES!</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-emerald-300 text-lg font-bold mb-1">Osiagnales cel ${WIN_TARGET.toLocaleString()}!</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-gray-400 text-sm mb-8">Saldo koncowe: <strong className="text-white">${balance.toLocaleString()}</strong></motion.p>
        </>
      ) : (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-8xl mb-4">💸</motion.div>
          <motion.h2 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-4xl font-black text-red-400 tracking-widest mb-2">BANKRUT!</motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-gray-300 text-lg font-bold mb-1">Straciłes cały budzet.</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="text-gray-500 text-sm mb-8">Najwyzsze saldo tej sesji: <strong className="text-white">${peakBalance.toLocaleString()}</strong></motion.p>
        </>
      )}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="flex gap-4">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onPlayAgain}
          className="px-8 py-3 rounded-xl font-black text-base tracking-wider"
          style={{ background: "#065f46", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}>
          ZAGRAJ PONOWNIE
        </motion.button>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={onLobby}
          className="px-8 py-3 rounded-xl font-black text-base tracking-wider bg-gray-800 border border-gray-600 text-gray-300">
          LOBBY
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Blackjack Component ──────────────────────────────────────
export default function Blackjack({ onBack, username }) {
  const [balance, setBalance]       = useState(SESSION_START);
  const [peakBalance, setPeakBalance] = useState(SESSION_START);
  const [bet, setBet]               = useState(50);
  const [deck, setDeck]             = useState([]);

  // Multi-hand support for split (dynamic, supports re-split)
  const [hands, setHands]           = useState([[]]);
  const [handBets, setHandBets]     = useState([0]);
  const [activeHand, setActiveHand] = useState(0);

  const [dealerHand, setDealerHand] = useState([]);
  const [status, setStatus]         = useState(STATUS.IDLE);
  const [roundResult, setRoundResult] = useState(null);         // per-round popup
  const [speech, setSpeech]         = useState(getPhrase("idle"));
  const [mood, setMood]             = useState("idle");
  const [armAngle, setArmAngle]     = useState(0);

  // Track session result saved flag
  const sessionSavedRef = useRef(false);

  // Derived split flag – must be defined before any useCallback that uses it
  const isSplit = hands.length > 1;

  const say = useCallback((key) => setSpeech(getPhrase(key)), []);
  const swingArm = useCallback((t) => { setArmAngle(t); setTimeout(() => setArmAngle(0), 380); }, []);

  // Update peak balance
  useEffect(() => {
    if (balance > peakBalance) setPeakBalance(balance);
  }, [balance]); // eslint-disable-line

  // Check session win/loss after balance changes
  useEffect(() => {
    if (status === STATUS.DONE) {
      if (balance >= WIN_TARGET) {
        say("session_win"); setMood("shocked");
        setTimeout(() => setStatus(STATUS.SESSION_WIN), 1200);
      } else if (balance <= 0) {
        say("session_lose"); setMood("happy");
        setTimeout(() => setStatus(STATUS.SESSION_LOSE), 1200);
      }
    }
  }, [balance, status]); // eslint-disable-line

  // Save result when session ends
  useEffect(() => {
    if ((status === STATUS.SESSION_WIN || status === STATUS.SESSION_LOSE) && !sessionSavedRef.current) {
      sessionSavedRef.current = true;
      const won = status === STATUS.SESSION_WIN;
      const profit = balance - SESSION_START;
      api.saveGameResult(won, profit, peakBalance).catch(() => {});
    }
  }, [status]); // eslint-disable-line

  // ── Helpers ──────────────────────────────────────────────────────
  const currentHand = hands[activeHand] ?? [];
  const isPlaying   = status === STATUS.PLAYER_TURN;
  const dealerReveal = status === STATUS.DONE || status === STATUS.DEALER_TURN
    || status === STATUS.SESSION_WIN || status === STATUS.SESSION_LOSE;
  const waiting = status === STATUS.DEALING || status === STATUS.DEALER_TURN;

  function applyRoundResult(newBal, dealerCards, pHand, currentBet) {
    const pt = handTotal(pHand);
    const dt = handTotal(dealerCards);
    let delta = 0;
    let resultType;

    if (isBust(pHand)) {
      resultType = "lose"; delta = 0; // already deducted
    } else if (isBust(dealerCards) || pt > dt) {
      delta = currentBet * 2; resultType = "win";
    } else if (pt < dt) {
      delta = 0; resultType = "lose";
    } else {
      delta = currentBet; resultType = "draw";
    }

    const finalBal = newBal + delta;
    setBalance(finalBal);
    return resultType;
  }

  // ── DEAL ─────────────────────────────────────────────────────────
  const deal = useCallback(() => {
    if (bet > balance) return;
    const newDeck = createDeck();
    const d0 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[0] };
    const p0 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[1] };
    const d1 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[2] };
    const p1 = { ...newDeck.pop(), dealDelay: DEAL_DELAYS[3] };

    const playerCards = [p0, p1];
    const dealerCards = [d0, d1];

    setDeck(newDeck);
    setHands([playerCards]);
    setHandBets([bet]);
    setActiveHand(0);
    setDealerHand(dealerCards);
    setRoundResult(null);
    say("dealing"); setMood("thinking");
    setStatus(STATUS.DEALING);

    setTimeout(() => swingArm(1), 0);
    setTimeout(() => swingArm(2), 380);
    setTimeout(() => swingArm(1), 760);
    setTimeout(() => swingArm(2), 1140);

    setTimeout(() => {
      if (isBlackjack(playerCards)) {
        if (isBlackjack(dealerCards)) {
          setBalance((b) => { const nb = b - bet + bet; return nb; }); // net 0
          setRoundResult({ msg: "Remis! Oboje macie Blackjacka!", color: "yellow", type: "draw" });
          say("draw"); setMood("idle");
        } else {
          setBalance((b) => b - bet + Math.floor(bet * 2.5));
          setRoundResult({ msg: "BLACKJACK! Wygrywasz 1.5x zaklad!", color: "green", type: "win" });
          say("blackjack"); setMood("shocked");
        }
        setStatus(STATUS.DONE);
      } else {
        setBalance((b) => b - bet);
        say("player_turn"); setMood("idle");
        setStatus(STATUS.PLAYER_TURN);
      }
    }, DEAL_DONE_MS);
  }, [bet, balance, say, swingArm]);

  // ── HIT ──────────────────────────────────────────────────────────
  const hit = useCallback(() => {
    const newDeck = [...deck];
    const card = { ...newDeck.pop(), dealDelay: 0 };
    const newHands = hands.map((h, i) => i === activeHand ? [...h, card] : h);
    setDeck(newDeck);
    setHands(newHands);
    swingArm(2);

    if (isBust(newHands[activeHand])) {
      // Bust on this hand
      if (activeHand < newHands.length - 1) {
        // Move to next hand
        say("player_turn");
        setActiveHand(activeHand + 1);
      } else {
        say("lose"); setMood("happy");
        setBalance((b) => b); // already deducted at deal
        setRoundResult({ msg: "Przebicie! Przegrywasz!", color: "red", type: "lose" });
        setStatus(STATUS.DONE);
      }
    }
  }, [deck, hands, activeHand, isSplit, say, swingArm]);

  // ── STAND ─────────────────────────────────────────────────────────
  const stand = useCallback(() => {
    if (activeHand < hands.length - 1) {
      // Move to next hand
      say("player_turn");
      setActiveHand(activeHand + 1);
      return;
    }
    // Dealer plays
    setStatus(STATUS.DEALER_TURN);
    say("dealer_turn"); setMood("thinking");

    let dk = [...deck];
    let dc = [...dealerHand];
    while (handTotal(dc) < 17) dc.push({ ...dk.pop(), dealDelay: 0 });
    setDeck(dk);
    setDealerHand(dc);

    setTimeout(() => {
      // Calculate results for all played hands
      let totalDelta = 0;
      const msgs = [];

      const playedHands = isSplit ? hands : [hands[0]];
      playedHands.forEach((hand, hi) => {
        const hBet = handBets[hi] || bet;
        const pt = handTotal(hand);
        const dt = handTotal(dc);
        if (isBust(hand)) {
          msgs.push(`Reka ${hi + 1}: Przebicie`);
        } else if (isBust(dc) || pt > dt) {
          totalDelta += hBet * 2;
          msgs.push(isSplit ? `Reka ${hi + 1}: Wygrana!` : null);
        } else if (pt < dt) {
          msgs.push(isSplit ? `Reka ${hi + 1}: Przegrana` : null);
        } else {
          totalDelta += hBet;
          msgs.push(isSplit ? `Reka ${hi + 1}: Remis` : null);
        }
      });

      setBalance((b) => b + totalDelta);

      // Main result message
      let mainMsg, mainType;
      if (isSplit) {
        mainMsg = msgs.filter(Boolean).join(" | ");
        mainType = totalDelta > 0 ? "win" : totalDelta === 0 ? "draw" : "lose";
      } else {
        const dt2 = handTotal(dc);
        const pt2 = handTotal(hands[0]);
        if (isBust(hands[0])) { mainMsg = "Przebicie! Przegrywasz!"; mainType = "lose"; }
        else if (isBust(dc) || pt2 > dt2) { mainMsg = isBust(dc) ? "Krupier sie przebil! Wygrywasz!" : "Wygrywasz!"; mainType = "win"; }
        else if (pt2 < dt2) { mainMsg = "Krupier wygrywa!"; mainType = "lose"; }
        else { mainMsg = "Remis! Zaklad zwrocony."; mainType = "draw"; }
      }

      setRoundResult({ msg: mainMsg, color: mainType === "win" ? "green" : mainType === "lose" ? "red" : "yellow", type: mainType });
      say(mainType === "win" ? "win" : mainType === "lose" ? "lose" : "draw");
      setMood(mainType === "win" ? "shocked" : mainType === "lose" ? "happy" : "idle");
      setStatus(STATUS.DONE);
    }, 600);
  }, [deck, dealerHand, hands, handBets, bet, isSplit, activeHand, say]);

  // ── DOUBLE ────────────────────────────────────────────────────────
  const double = useCallback(() => {
    if (balance < handBets[activeHand]) return;
    const extraBet = handBets[activeHand];
    setBalance((b) => b - extraBet);
    const newHandBets = handBets.map((hb, i) => i === activeHand ? hb * 2 : hb);
    setHandBets(newHandBets);

    const newDeck = [...deck];
    const card = { ...newDeck.pop(), dealDelay: 0 };
    const newHands = hands.map((h, i) => i === activeHand ? [...h, card] : h);
    setDeck(newDeck);
    setHands(newHands);
    swingArm(2);

    if (isBust(newHands[activeHand])) {
      if (activeHand < newHands.length - 1) {
        say("player_turn"); setActiveHand(activeHand + 1);
      } else {
        setRoundResult({ msg: "Przebicie! Przegrywasz!", color: "red", type: "lose" });
        say("lose"); setMood("happy"); setStatus(STATUS.DONE);
      }
      return;
    }
    // Auto-stand after double
    if (activeHand < newHands.length - 1) {
      say("player_turn"); setActiveHand(activeHand + 1);
    } else {
      // Trigger stand logic inline
      setStatus(STATUS.DEALER_TURN);
      say("dealer_turn"); setMood("thinking");
      let dk = [...newDeck];
      let dc = [...dealerHand];
      while (handTotal(dc) < 17) dc.push({ ...dk.pop(), dealDelay: 0 });
      setDeck(dk);
      setDealerHand(dc);
      setTimeout(() => {
        let totalDelta = 0;
        newHands.forEach((hand, hi) => {
          const hBet = newHandBets[hi] || bet;
          const pt = handTotal(hand);
          const dt = handTotal(dc);
          if (!isBust(hand)) {
            if (isBust(dc) || pt > dt) totalDelta += hBet * 2;
            else if (pt === dt) totalDelta += hBet;
          }
        });
        setBalance((b) => b + totalDelta);
        const pt = handTotal(newHands[activeHand]);
        const dt = handTotal(dc);
        let mainMsg, mainType;
        if (isBust(newHands[activeHand])) { mainMsg = "Przebicie!"; mainType = "lose"; }
        else if (isBust(dc) || pt > dt) { mainMsg = isBust(dc) ? "Krupier sie przebil! Wygrywasz!" : "Wygrywasz!"; mainType = "win"; }
        else if (pt < dt) { mainMsg = "Krupier wygrywa!"; mainType = "lose"; }
        else { mainMsg = "Remis!"; mainType = "draw"; }
        setRoundResult({ msg: mainMsg, color: mainType === "win" ? "green" : mainType === "lose" ? "red" : "yellow", type: mainType });
        say(mainType); setMood(mainType === "win" ? "shocked" : mainType === "lose" ? "happy" : "idle");
        setStatus(STATUS.DONE);
      }, 600);
    }
  }, [balance, handBets, activeHand, deck, hands, dealerHand, bet, isSplit, say, swingArm]);

  // ── SPLIT ─────────────────────────────────────────────────────────
  const splitHand = useCallback(() => {
    const currentBet = handBets[activeHand] ?? bet;
    if (balance < currentBet) return;
    const [c1, c2] = hands[activeHand];
    const newDeck = [...deck];
    const n1 = { ...newDeck.pop(), dealDelay: 0.1 };
    const n2 = { ...newDeck.pop(), dealDelay: 0.4 };
    // Insert two new hands at activeHand position
    const newHands = [...hands];
    const newBets = [...handBets];
    newHands.splice(activeHand, 1, [c1, n1], [c2, n2]);
    newBets.splice(activeHand, 1, currentBet, currentBet);
    setDeck(newDeck);
    setHands(newHands);
    setHandBets(newBets);
    setBalance((b) => b - currentBet);
    // activeHand stays the same (first of the two new hands)
    say("split"); setMood("thinking");
    swingArm(2);
  }, [hands, handBets, deck, bet, balance, activeHand, say, swingArm]);

  // ── Reset session ─────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    setBalance(SESSION_START);
    setPeakBalance(SESSION_START);
    setBet(50);
    setDeck([]);
    setHands([[]]);
    setHandBets([0]);
    setActiveHand(0);
    setDealerHand([]);
    setStatus(STATUS.IDLE);
    setRoundResult(null);
    setSpeech(getPhrase("idle"));
    setMood("idle");
    sessionSavedRef.current = false;
  }, []);

  // ── Can split? ────────────────────────────────────────────────────
  const currentHandForSplit = hands[activeHand] ?? [];
  const canSplit = isPlaying
    && currentHandForSplit.length === 2
    && currentHandForSplit[0]?.rank === currentHandForSplit[1]?.rank
    && balance >= (handBets[activeHand] ?? bet)
    && hands.length < 4; // max 4 hands

  const RC = {
    green:  { ring: "#34d399", bg: "rgba(6,78,59,0.85)",  text: "#6ee7b7" },
    red:    { ring: "#f87171", bg: "rgba(127,29,29,0.85)", text: "#fca5a5" },
    yellow: { ring: "#fbbf24", bg: "rgba(120,53,15,0.85)", text: "#fde68a" },
  };

  // Progress bar
  const progress = Math.min(100, (balance / WIN_TARGET) * 100);
  const progressColor = balance <= 100 ? "#ef4444" : balance >= 800 ? "#34d399" : "#fbbf24";

  return (
    <div className="h-screen flex flex-col overflow-hidden relative" style={{ background: "#0a0f0c" }}>

      {/* Session overlays */}
      <AnimatePresence>
        {status === STATUS.SESSION_WIN && (
          <SessionOverlay won peakBalance={peakBalance} balance={balance}
            onPlayAgain={resetSession} onLobby={onBack} />
        )}
        {status === STATUS.SESSION_LOSE && (
          <SessionOverlay won={false} peakBalance={peakBalance} balance={balance}
            onPlayAgain={resetSession} onLobby={onBack} />
        )}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <motion.div initial={{ y: -44, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="shrink-0 flex items-center justify-between px-5 py-2 bg-black/80 border-b border-yellow-900/40 z-20">
        <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.95 }} onClick={onBack}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-sm">← Lobby</motion.button>
        <div className="flex items-center gap-1.5 text-yellow-500 font-black tracking-widest text-sm">
          ♠ <span className="text-white">BLACKJACK</span> ♠
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 leading-none">SESJA</div>
          <motion.div key={balance} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.25 }}
            className={`text-base font-black leading-tight ${balance <= 100 ? "text-red-400" : "text-yellow-400"}`}>
            ${balance.toLocaleString()}
          </motion.div>
        </div>
      </motion.div>

      {/* Progress bar */}
      <div className="shrink-0 h-1.5 bg-gray-900 relative">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full rounded-r-full"
          style={{ background: progressColor, boxShadow: `0 0 8px ${progressColor}88` }}
        />
        <div className="absolute right-2 top-2 text-[9px] text-gray-600 font-semibold">
          Cel: ${WIN_TARGET.toLocaleString()}
        </div>
      </div>

      {/* ── TABLE ── */}
      <div className="flex-1 relative flex flex-col overflow-hidden"
        style={{ background: "radial-gradient(ellipse at 50% 60%, #0d2818 0%, #050c08 100%)" }}>

        {/* Felt */}
        <div className="absolute inset-x-4 top-14 bottom-24 rounded-[50%_/_30%] pointer-events-none z-0"
          style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 40%, #1e6b3f 0%, #0f4226 60%, #072918 100%)",
            boxShadow: "inset 0 6px 60px rgba(0,0,0,0.7), 0 0 0 3px #0f3d22, 0 0 0 6px #c9a84c44, 0 0 0 10px #0a2916",
          }}
        />
        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 text-center opacity-[0.06] select-none">
          <div className="text-yellow-300 text-sm font-black tracking-[0.35em] uppercase whitespace-nowrap">GoatCasino</div>
          <div className="text-yellow-300 text-xs tracking-[0.2em] whitespace-nowrap">Blackjack pays 3 to 2</div>
        </div>

        {/* Deck */}
        <div className="absolute top-16 right-5 z-10">
          <div className="relative w-9 h-12">
            {[3,2,1,0].map(i => (
              <div key={i} className="absolute w-9 h-12 rounded-lg border border-emerald-700"
                style={{ top: i*1.5, left: i*1.5, zIndex: 4-i, background: "linear-gradient(135deg,#1a5c35,#0a2916)" }} />
            ))}
            <div className="absolute inset-0 rounded-lg border-2 border-emerald-500 z-10 flex items-center justify-center text-emerald-300 text-xs font-bold"
              style={{ background: "linear-gradient(135deg,#1e6b3f,#0d3d22)", boxShadow: "0 0 12px rgba(52,211,153,0.2)" }}>
              🂠
            </div>
          </div>
          <div className="text-center text-xs text-emerald-700 font-semibold mt-1">{deck.length}</div>
        </div>

        {/* DEALER */}
        <div className="relative z-10 flex flex-col items-center pt-3 shrink-0">
          <AnimatePresence mode="wait">
            <motion.div key={speech}
              initial={{ opacity: 0, scale: 0.85, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
              className="relative mb-1 bg-white text-gray-800 text-xs font-semibold px-4 py-2 rounded-2xl rounded-bl-none shadow-xl max-w-[220px] text-center">
              {speech}
              <span className="absolute -bottom-2.5 left-4 border-l-[10px] border-r-[6px] border-t-[10px] border-l-transparent border-r-transparent border-t-white" />
            </motion.div>
          </AnimatePresence>
          <motion.div
            animate={mood === "happy" ? { rotate: [0,-6,6,-4,4,0] } : mood === "shocked" ? { y:[0,-8,0], scale:[1,1.07,1] } : mood === "thinking" ? { rotate:[0,-2,2,0] } : {}}
            transition={{ duration: 0.55 }}
            className="flex flex-col items-center relative">
            <DealerFace mood={mood} />
            <DealerTorso />
            {/* Arm */}
            <AnimatePresence>
              {armAngle !== 0 && (
                <motion.div key="arm"
                  initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: armAngle === 1 ? -30 : 55, x: armAngle === 1 ? -28 : 42, y: armAngle === 1 ? 8 : 18 }}
                  exit={{ opacity: 0 }} transition={{ duration: 0.28, type: "spring", stiffness: 260, damping: 18 }}
                  className="absolute bottom-2 right-4 origin-top-left pointer-events-none">
                  <svg width="60" height="30" viewBox="0 0 60 30" fill="none">
                    <rect x="0" y="10" width="44" height="10" rx="5" fill="#1a1a2e"/>
                    <ellipse cx="50" cy="15" rx="9" ry="7" fill="#e8a84a"/>
                    <rect x="44" y="4" width="14" height="18" rx="2" fill="white" stroke="#ccc" strokeWidth="1"/>
                    <line x1="51" y1="6" x2="51" y2="20" stroke="#e5e7eb" strokeWidth="0.8"/>
                    <line x1="46" y1="13" x2="56" y2="13" stroke="#e5e7eb" strokeWidth="0.8"/>
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <p className="text-[9px] text-yellow-600/50 font-bold tracking-widest uppercase mt-0.5">Krupier Max</p>
        </div>

        {/* DEALER CARDS */}
        <div className="relative z-10 flex justify-center mt-1 shrink-0">
          <HandArea
            cards={dealerHand}
            label="Krupier"
            score={dealerReveal && dealerHand.length > 0 ? handTotal(dealerHand) : null}
            bust={dealerReveal && isBust(dealerHand)}
            active={false}
            isDealer
            hidden2={!dealerReveal}
          />
        </div>

        {/* BET CHIPS */}
        <AnimatePresence>
          {(isPlaying || status === STATUS.DEALER_TURN) && (
            <motion.div initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ scale:0, opacity:0 }}
              className="relative z-10 flex items-center justify-center gap-1 my-0.5">
              {[...Array(Math.min(5, Math.ceil(bet/50)))].map((_,i) => (
                <motion.div key={i} initial={{ y:-20, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ delay:i*0.07 }}
                  className="w-6 h-6 rounded-full border-4 border-yellow-400 bg-yellow-600 flex items-center justify-center text-[9px] font-black text-yellow-100"
                  style={{ boxShadow:"0 2px 8px rgba(0,0,0,0.5)" }}>$</motion.div>
              ))}
              <span className="ml-1 text-yellow-400 font-black text-xs">${bet}{isSplit ? ` x${hands.length}` : ""}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PLAYER HANDS */}
        <div className="relative z-10 flex justify-center gap-4 mt-auto mb-1 shrink-0 px-2 flex-wrap">
          {isSplit ? (
            hands.map((hand, hi) => (
              <HandArea
                key={hi}
                cards={hand}
                label={`Reka ${hi + 1}`}
                score={hand.length > 0 ? handTotal(hand) : null}
                bust={isBust(hand)}
                active={isPlaying && activeHand === hi}
                isDealer={false}
                hidden2={false}
              />
            ))
          ) : (
            <HandArea
              cards={hands[0]}
              label="Twoja reka"
              score={hands[0].length > 0 ? handTotal(hands[0]) : null}
              bust={isBust(hands[0])}
              active={isPlaying}
              isDealer={false}
              hidden2={false}
            />
          )}
        </div>

        {/* ROUND RESULT POPUP */}
        <AnimatePresence>
          {roundResult && status === STATUS.DONE && (() => {
            const c = RC[roundResult.color];
            return (
              <motion.div key={roundResult.msg}
                initial={{ scale:0.2, opacity:0, rotate:-6 }} animate={{ scale:1, opacity:1, rotate:0 }}
                exit={{ scale:0.7, opacity:0, y:-20 }}
                transition={{ type:"spring", stiffness:370, damping:22 }}
                className="absolute inset-x-8 z-30 rounded-3xl p-5 text-center overflow-hidden"
                style={{ top:"38%", transform:"translateY(-50%)", background: c.bg, border:`2px solid ${c.ring}`, boxShadow:`0 0 40px ${c.ring}55` }}>
                {roundResult?.type === "win" && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(12)].map((_,i) => (
                      <motion.div key={i} initial={{ y:"100%", opacity:1 }} animate={{ y:"-130%", opacity:0 }}
                        transition={{ duration:1.1, delay:i*0.06, ease:"easeOut" }}
                        className="absolute w-2 h-2 rounded-full"
                        style={{ background:["#fbbf24","#34d399","#60a5fa","#f87171","#a78bfa"][i%5], bottom:0, left:`${8*i}%` }} />
                    ))}
                  </div>
                )}
                <div className="text-3xl mb-1.5">
                  {roundResult.type === "win" ? "🎉" : roundResult.type === "lose" ? "😞" : "🤝"}
                </div>
                <div className="text-lg font-black leading-snug" style={{ color: c.text }}>{roundResult.msg}</div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* ── CONTROLS ── */}
      <div className="shrink-0 bg-gray-950 border-t-2 border-yellow-900/30 px-4 py-2.5 z-20">
        <AnimatePresence mode="wait">

          {(status === STATUS.IDLE || status === STATUS.DONE) && (
            <motion.div key="bet" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.22 }} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 tracking-widest uppercase">Zaklad</span>
                <span className="text-yellow-400 font-black text-sm">${bet}</span>
              </div>
              <div className="flex gap-2 justify-center">
                {[10,25,50,100,250].map(b => (
                  <motion.button key={b} whileTap={{ scale:0.82, rotate:-5 }} onClick={() => setBet(b)}
                    disabled={b > balance}
                    className="w-11 h-11 rounded-full border-4 font-black text-xs transition-all disabled:opacity-30"
                    style={bet===b ? { borderColor:"#fbbf24", background:"#d97706", color:"#fef3c7", boxShadow:"0 0 16px rgba(234,179,8,0.6)" }
                      : { borderColor:"#374151", background:"#1f2937", color:"#9ca3af" }}>
                    ${b}
                  </motion.button>
                ))}
              </div>
              {/* Quick bet shortcuts */}
              <div className="flex gap-2">
                {[
                  { label: '1/3', getValue: () => Math.max(10, Math.floor(balance / 3 / 5) * 5) },
                  { label: '1/2', getValue: () => Math.max(10, Math.floor(balance / 2 / 5) * 5) },
                  { label: 'ALL IN', getValue: () => balance },
                ].map(({ label, getValue }) => (
                  <motion.button key={label} whileTap={{ scale:0.92 }}
                    onClick={() => setBet(Math.min(getValue(), balance))}
                    disabled={balance < 10}
                    className="flex-1 py-1.5 rounded-lg text-xs font-black transition-all disabled:opacity-30"
                    style={{ background:"#1f2937", border:"1px solid #374151", color: label==='ALL IN' ? '#f87171' : '#34d399' }}>
                    {label}
                  </motion.button>
                ))}
              </div>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                onClick={deal} disabled={bet > balance}
                className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={status === STATUS.DONE
                  ? { background:"#10b981", boxShadow:"0 4px 28px rgba(16,185,129,0.6)", color:"#fff" }
                  : { background:"#065f46", boxShadow:"0 4px 20px rgba(16,185,129,0.35)" }}>
                {status === STATUS.DONE ? "NASTEPNA RUNDA" : "ROZDAJ KARTY"}
              </motion.button>
            </motion.div>
          )}

          {isPlaying && (
            <motion.div key="actions" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }} transition={{ duration:0.22 }}
              className="flex gap-2">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={hit}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-blue-500/30"
                style={{ background:"#1d4ed8" }}>🃏 HIT</motion.button>
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={stand}
                className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-red-500/30"
                style={{ background:"#991b1b" }}>
                {isSplit && activeHand === 0 ? "✋ NEXT" : "✋ STAND"}
              </motion.button>
              {currentHand.length === 2 && balance >= handBets[activeHand] && (
                <motion.button initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={double}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-yellow-500/30"
                  style={{ background:"#b45309" }}>x2 DBL</motion.button>
              )}
              {canSplit && (
                <motion.button initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                  whileHover={{ scale:1.05 }} whileTap={{ scale:0.92 }} onClick={splitHand}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm tracking-wider border border-purple-500/30"
                  style={{ background:"#7e22ce" }}>✂ SPLIT</motion.button>
              )}
            </motion.div>
          )}

          {waiting && (
            <motion.div key="wait" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="flex items-center justify-center gap-3 py-3.5">
              {[0,1,2].map(i => (
                <motion.div key={i} animate={{ y:[0,-10,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
                  className="w-3 h-3 rounded-full bg-emerald-500" />
              ))}
              <span className="text-gray-400 text-sm ml-1">
                {status === STATUS.DEALING ? "Rozdawanie kart..." : "Krupier mysli..."}
              </span>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
