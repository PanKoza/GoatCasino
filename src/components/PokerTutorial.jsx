import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Card helpers ──────────────────────────────────────────────────
function Card({ rank, suit, hidden }) {
  const isRed = suit === '♥' || suit === '♦';
  if (hidden) return (
    <div className="w-12 h-16 rounded-xl bg-emerald-900 border-2 border-emerald-600 flex items-center justify-center text-emerald-500 font-black shadow">🂠</div>
  );
  return (
    <div className="w-12 h-16 rounded-xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center font-black leading-none shadow-lg"
      style={{ color: isRed ? '#dc2626' : '#111827' }}>
      <span className="text-lg">{rank}</span>
      <span className="text-base">{suit}</span>
    </div>
  );
}

// ── Demo components ───────────────────────────────────────────────
function HandRankingsDemo() {
  const hands = [
    { name: 'Royal Flush',     cards: [['10','♠'],['J','♠'],['Q','♠'],['K','♠'],['A','♠']], color: 'text-yellow-400' },
    { name: 'Straight Flush',  cards: [['5','♥'],['6','♥'],['7','♥'],['8','♥'],['9','♥']], color: 'text-purple-400' },
    { name: 'Four of a Kind',  cards: [['K','♠'],['K','♥'],['K','♦'],['K','♣'],['3','♠']], color: 'text-red-400' },
    { name: 'Full House',      cards: [['Q','♠'],['Q','♥'],['Q','♦'],['J','♣'],['J','♠']], color: 'text-orange-400' },
    { name: 'Flush',           cards: [['2','♦'],['6','♦'],['9','♦'],['J','♦'],['K','♦']], color: 'text-blue-400' },
    { name: 'Straight',        cards: [['5','♣'],['6','♦'],['7','♥'],['8','♠'],['9','♣']], color: 'text-cyan-400' },
    { name: 'Three of a Kind', cards: [['8','♠'],['8','♥'],['8','♦'],['3','♣'],['K','♠']], color: 'text-emerald-400' },
    { name: 'Two Pair',        cards: [['A','♠'],['A','♥'],['K','♦'],['K','♣'],['7','♠']], color: 'text-green-400' },
    { name: 'Para',            cards: [['J','♠'],['J','♣'],['A','♥'],['8','♦'],['3','♠']], color: 'text-gray-300' },
    { name: 'Wysoka karta',    cards: [['2','♣'],['7','♦'],['9','♠'],['J','♥'],['A','♦']], color: 'text-gray-400' },
  ];
  return (
    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
      {hands.map((h, i) => (
        <div key={h.name} className="flex items-center gap-3 bg-gray-900/60 rounded-xl px-3 py-2 border border-gray-700/40">
          <span className="text-gray-500 text-xs w-3 font-bold">{i+1}</span>
          <div className="flex gap-0.5">
            {h.cards.map(([r,s], j) => (
              <div key={j} className="w-7 h-10 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center leading-none"
                style={{ color: s==='♥'||s==='♦' ? '#dc2626' : '#111827' }}>
                <span className="text-[9px] font-black">{r}</span>
                <span className="text-[9px]">{s}</span>
              </div>
            ))}
          </div>
          <span className={`text-sm font-black ${h.color}`}>{h.name}</span>
        </div>
      ))}
    </div>
  );
}

function BettingRoundsDemo() {
  const rounds = [
    { phase: 'Pre-flop',  color: '#6366f1', desc: 'Każdy gracz dostaje 2 karty zakryte. Small blind i big blind wstawiają obowiązkowe zakłady. Gracze mogą foldować, sprawdzać lub podbijać.' },
    { phase: 'Flop',      color: '#22c55e', desc: '3 karty wspólne odkryte na stole. Runda licytacji od lewej strony dealera.' },
    { phase: 'Turn',      color: '#f59e0b', desc: '4. karta wspólna odkryta. Kolejna runda licytacji.' },
    { phase: 'River',     color: '#ef4444', desc: '5. i ostatnia karta wspólna. Ostatnia runda licytacji.' },
    { phase: 'Showdown',  color: '#a855f7', desc: 'Gracze, którzy nie sfoldowali, odkrywają karty. Najlepszy układ z 5 kart (2 własne + 5 wspólnych) wygrywa pulę.' },
  ];
  return (
    <div className="mt-3 space-y-2">
      {rounds.map(r => (
        <div key={r.phase} className="flex gap-3 bg-gray-900/60 rounded-xl p-3 border border-gray-700/40">
          <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0 self-start"
            style={{ background: `${r.color}33`, color: r.color, border: `1px solid ${r.color}55` }}>
            {r.phase}
          </span>
          <p className="text-xs text-gray-300 leading-snug">{r.desc}</p>
        </div>
      ))}
    </div>
  );
}

function ActionsDemo() {
  const actions = [
    { name: 'FOLD',   icon: '✕', color: 'text-red-300',     bg: 'bg-red-900/40 border-red-700/40',     desc: 'Rezygnujesz z ręki i tracisz wpłacone do tej pory żetony. Wychodzisz z rundy.' },
    { name: 'CHECK',  icon: '✓', color: 'text-gray-200',    bg: 'bg-gray-800/60 border-gray-600/40',   desc: 'Nie stawiasz zakładu – przekazujesz ruch dalej. Możliwe tylko gdy nikt wcześniej nie postawił.' },
    { name: 'CALL',   icon: '📞', color: 'text-blue-300',   bg: 'bg-blue-900/40 border-blue-700/40',   desc: 'Wyrównujesz zakład poprzedniego gracza. Musisz wpłacić tyle samo co on.' },
    { name: 'RAISE',  icon: '⬆', color: 'text-emerald-300', bg: 'bg-emerald-900/40 border-emerald-700/40', desc: 'Zwiększasz stawkę o minimum tyle samo co poprzedni raise (lub big blind).' },
    { name: 'ALL IN', icon: '⚡', color: 'text-yellow-300', bg: 'bg-yellow-900/40 border-yellow-700/40', desc: 'Stawiasz wszystkie żetony. Nawet przegrywając możesz wygrać część puli (side pot).' },
  ];
  return (
    <div className="mt-3 space-y-2">
      {actions.map(a => (
        <div key={a.name} className={`flex items-start gap-3 border rounded-xl p-3 ${a.bg}`}>
          <span className="text-xl shrink-0">{a.icon}</span>
          <div>
            <div className={`font-black text-sm ${a.color}`}>{a.name}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-snug">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BlindsDemo() {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-3">
        {/* Table visual */}
        <div className="relative flex-1 bg-emerald-900/40 rounded-2xl border border-emerald-800/50 p-4 flex items-center justify-center min-h-[120px]">
          <div className="text-xs text-emerald-600 text-center tracking-widest">STÓŁ</div>
          {/* Dealer */}
          <div className="absolute top-2 right-2 flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-white text-gray-900 font-black text-[9px] flex items-center justify-center">D</div>
            <span className="text-[8px] text-gray-500">Dealer</span>
          </div>
          {/* SB */}
          <div className="absolute bottom-2 left-2 flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-blue-500 text-white font-black text-[9px] flex items-center justify-center">S</div>
            <span className="text-[8px] text-gray-500">SB $25</span>
          </div>
          {/* BB */}
          <div className="absolute bottom-2 right-10 flex flex-col items-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-black text-[9px] flex items-center justify-center">B</div>
            <span className="text-[8px] text-gray-500">BB $50</span>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {[
          { badge: 'D', bg: 'bg-white', tc: 'text-gray-900', label: 'Dealer (Button)', desc: 'Ostatni do akcji – najlepsza pozycja! Przesuwa się o jednego gracza po każdej ręce.' },
          { badge: 'S', bg: 'bg-blue-500', tc: 'text-white', label: 'Small Blind', desc: 'Gracz po lewej dealera. Obowiązkowy zakład $25. Drugi do akcji po pre-flopie.' },
          { badge: 'B', bg: 'bg-orange-500', tc: 'text-white', label: 'Big Blind', desc: 'Gracz dwa miejsca po dealerze. Obowiązkowy zakład $50. Na pre-flopie może raise lub check.' },
        ].map(r => (
          <div key={r.label} className="flex items-start gap-3 bg-gray-900/60 rounded-xl p-3 border border-gray-700/40">
            <span className={`w-6 h-6 rounded-full ${r.bg} ${r.tc} font-black text-[10px] flex items-center justify-center shrink-0`}>{r.badge}</span>
            <div>
              <div className="text-sm font-bold text-white">{r.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionDemo({ mode }) {
  return (
    <div className="mt-4 space-y-3">
      {mode === 'online' ? (
        <>
          <div className="bg-gray-900/60 border border-blue-800/50 rounded-xl p-4">
            <div className="text-xs text-blue-400 font-bold tracking-wide mb-2">🌐 POKER ONLINE</div>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li>• Utwórz pokój i ustal max graczy (2–5)</li>
              <li>• Podziel się kodem pokoju ze znajomymi</li>
              <li>• Host startuje grę gdy wszyscy dołączą</li>
              <li>• Karty innych graczy są ukryte – widoczne dopiero przy showdown</li>
              <li>• Auto-fold jeśli nie zagrasz w 30 sekund</li>
            </ul>
          </div>
          <div className="bg-gray-900/60 border border-emerald-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-400">Każdy gracz zaczyna z <span className="text-yellow-400 font-bold">$500 żetonów</span>. Gra toczy się aż zostanie jeden gracz z żetonami.</div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gray-900/60 border border-emerald-800/50 rounded-xl p-4">
            <div className="text-xs text-emerald-400 font-bold tracking-wide mb-2">
              {mode === '1v1' ? '⚔️ DUEL 1v1 vs BOT' : '🤖 STÓŁ Z 4 BOTAMI'}
            </div>
            <ul className="text-sm text-gray-300 space-y-1.5">
              <li>• Każdy gracz zaczyna z <span className="text-yellow-400 font-bold">$500</span></li>
              <li>• Boty grają strategicznie – blefują i podejmują decyzje</li>
              <li>• Gra kończy się gdy jeden gracz zbankrutuje</li>
              {mode === '1v1'
                ? <li>• Pokonaj bota – zostań jedynym graczem z żetonami!</li>
                : <li>• Pokonaj wszystkich 4 botów – zostań ostatnim!</li>
              }
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function StrategyDemo() {
  return (
    <div className="mt-3 space-y-2">
      {[
        { title: 'Pozycja to klucz', icon: '📍', desc: 'Granie po przeciwnikach (late position, np. Dealer) daje ogromną przewagę – widzisz ich akcje przed swoją decyzją.' },
        { title: 'Czytaj przeciwników', icon: '👁', desc: 'Obserwuj wzorce licytacji. Częste raise = silna ręka lub blef. Szybki check może oznaczać słabą kartę.' },
        { title: 'Pot Odds', icon: '📐', desc: 'Porównaj koszt calla do wielkości puli. Jeśli pula to $200 a call to $20 (10%), opłaca się sprawdzić nawet ze słabą ręką.' },
        { title: 'Nie graj każdej ręki', icon: '🧘', desc: 'Foldowanie to strategia, nie porażka. Słabe ręce jak 7-2 offsuit należy od razu składać.' },
        { title: 'Blef z umiarem', icon: '🎭', desc: 'Blefuj rzadko i tylko gdy masz powód (spójna historia licytacji). Zbyt częsty blef zostanie szybko odkryty.' },
      ].map(s => (
        <div key={s.title} className="flex gap-3 bg-gray-900/60 rounded-xl p-3 border border-gray-700/40">
          <span className="text-xl shrink-0">{s.icon}</span>
          <div>
            <div className="text-sm font-bold text-white">{s.title}</div>
            <div className="text-xs text-gray-400 mt-0.5 leading-snug">{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 'intro',
    title: 'Czym jest Texas Hold\'em?',
    icon: '♠️',
    content: `Texas Hold'em to najpopularniejsza odmiana pokera na świecie – grana w turniejach, kasynach i online.

Każdy gracz otrzymuje 2 karty zakryte (hole cards). Na środku stołu odkrywane jest 5 kart wspólnych (community cards).

Celem jest zbudowanie najlepszego możliwego układu 5 kart z kombinacji własnych 2 kart i 5 wspólnych.`,
    demo: null,
    tip: '🎯 Wygrywasz zgarniając pulę – albo najlepszym układem, albo zmuszając wszystkich do foldowania!',
  },
  {
    id: 'hand-rankings',
    title: 'Układy kart (od najsilniejszego)',
    icon: '🏆',
    content: `Siła ręki zależy od układu. Oto wszystkie układy od najsilniejszego:`,
    demo: 'hand-rankings',
    tip: '💡 Pamiętaj: zawsze możesz użyć tylko 5 kart z 7 dostępnych (2 własne + 5 wspólnych).',
  },
  {
    id: 'blinds',
    title: 'Blindy i pozycje',
    icon: '🪙',
    content: `Przed każdą ręką dwóch graczy musi postawić obowiązkowe zakłady zwane blindami:`,
    demo: 'blinds',
    tip: '🔄 Pozycje rotują się po każdej ręce – każdy gracz będzie kolejno Dealerem, SB i BB.',
  },
  {
    id: 'betting-rounds',
    title: 'Rundy licytacji',
    icon: '🔄',
    content: `Gra podzielona jest na 4 rundy licytacji, oddzielone odkryciem kart wspólnych:`,
    demo: 'betting-rounds',
    tip: '⚠️ Po każdym nowym odkryciu kart licytacja zaczyna się od nowa – zakłady z poprzedniej rundy wchodzą do puli.',
  },
  {
    id: 'actions',
    title: 'Dostępne akcje',
    icon: '🎮',
    content: `W swojej turze możesz wybrać jedną z akcji:`,
    demo: 'actions',
    tip: '⏰ Masz ograniczony czas na decyzję – w trybie online 30 sekund, potem automatyczny fold!',
  },
  {
    id: 'session',
    title: 'Jak działa ta gra?',
    icon: '💰',
    content: `Specyfika trybów gry w GoatCasino:`,
    demo: 'session',
    tip: '📊 Wyniki każdej skończonej gry wpływają na Twój ranking i statystyki!',
  },
  {
    id: 'strategy',
    title: 'Podstawowe wskazówki strategiczne',
    icon: '🧠',
    content: `Kilka zasad, które odróżniają dobrego gracza od początkującego:`,
    demo: 'strategy',
    tip: '🎓 Poker to gra długoterminowa – jedna zła ręka nie przegrywa partii. Graj cierpliwie!',
  },
  {
    id: 'ready',
    title: 'Gotowy do gry?',
    icon: '🚀',
    content: `Znasz już zasady Texas Hold'em! Oto szybkie podsumowanie:

✅ 2 karty własne + 5 wspólnych = najlepszy układ 5 kart
✅ 4 rundy licytacji: Pre-flop → Flop → Turn → River
✅ Akcje: Fold / Check / Call / Raise / All-In
✅ Wygrywasz pulę najlepszą ręką lub zmuszając wszystkich do fold
✅ Pozycja przy stole ma ogromne znaczenie
✅ Blefuj rzadko, graj cierpliwie

Do dzieła! 🍀`,
    demo: null,
    tip: null,
  },
];

// ── Main component ────────────────────────────────────────────────
export default function PokerTutorial({ mode, onBack, onPlay }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const demoMap = {
    'hand-rankings':  <HandRankingsDemo />,
    'blinds':         <BlindsDemo />,
    'betting-rounds': <BettingRoundsDemo />,
    'actions':        <ActionsDemo />,
    'session':        <SessionDemo mode={mode} />,
    'strategy':       <StrategyDemo />,
  };

  const modeLabel = mode === '1v1' ? '1v1 vs Bot' : mode === 'bots' ? 'vs 4 Boty' : 'Online';

  return (
    <div className="min-h-screen text-white flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0a1f14 0%, #050d08 100%)' }}>

      {/* Header */}
      <header className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">← Lobby</button>
          <div className="flex items-center gap-2">
            <span className="text-xl">♠️</span>
            <span className="text-emerald-400 font-black tracking-wider text-sm">SAMOUCZEK POKERA</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{modeLabel}</span>
          </div>
          <div className="text-xs text-gray-500 font-semibold">{step + 1} / {STEPS.length}</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-gray-800">
        <motion.div
          className="h-1 bg-emerald-500"
          animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto w-full px-4 py-6 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col">

            {/* Step header */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{current.icon}</span>
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase mb-0.5">
                  Krok {step + 1} z {STEPS.length}
                </div>
                <h2 className="text-2xl font-black">{current.title}</h2>
              </div>
            </div>

            {/* Card */}
            <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-5 mb-4 flex-1">
              <p className="text-gray-200 leading-relaxed whitespace-pre-line text-sm">{current.content}</p>
              {current.demo && demoMap[current.demo]}
            </div>

            {/* Tip */}
            {current.tip && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-200">
                {current.tip}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-2">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
            ← Poprzedni
          </button>
          {isLast ? (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onPlay}
              className="flex-1 py-3 rounded-xl font-black text-white transition-all shadow-lg"
              style={{ background: 'linear-gradient(135deg, #065f46, #059669)', boxShadow: '0 4px 20px rgba(5,150,105,0.4)' }}>
              ♠ ZAGRAJ TERAZ!
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-bold text-white transition-all">
              Następny →
            </motion.button>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <button key={i} onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'bg-emerald-400 w-5' : i < step ? 'bg-emerald-700 w-2' : 'bg-gray-700 w-2'
              }`} />
          ))}
        </div>
      </main>
    </div>
  );
}
