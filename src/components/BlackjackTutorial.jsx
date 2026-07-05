import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayingCard from './PlayingCard';

const STEPS = [
  {
    id: 'intro',
    title: 'Czym jest Blackjack?',
    icon: '🃏',
    content: `Blackjack (zwany też "Dwudziestą jedynką") to najpopularniejsza gra karciana w kasynach na całym świecie. 
Twoim celem jest zebranie kart o łącznej wartości jak najbliższej 21 – ale nie przekraczając jej – oraz pokonanie krupiera.`,
    demo: null,
    tip: '🎯 Cel: mieć więcej punktów niż krupier, nie przekraczając 21.',
  },
  {
    id: 'card-values',
    title: 'Wartości kart',
    icon: '🔢',
    content: `Każda karta ma określoną wartość punktową:`,
    demo: 'card-values',
    tip: '💡 As jest kartą specjalną – możesz wybrać jego wartość: 1 lub 11.',
  },
  {
    id: 'dealing',
    title: 'Rozdanie kart',
    icon: '🤝',
    content: `Na początku każdej rundy:
• Ty otrzymujesz 2 karty odkryte (widoczne dla wszystkich)
• Krupier otrzymuje 2 karty – jedną odkrytą, jedną zakrytą (zwaną "hole card")

Zakryta karta krupiera jest ujawniana dopiero po tym, jak Ty zakończysz swój ruch.`,
    demo: 'dealing',
    tip: '🕵️ Staraj się odgadnąć zakrytą kartę krupiera na podstawie widocznej!',
  },
  {
    id: 'player-turn',
    title: 'Twoja tura – dostępne akcje',
    icon: '🎮',
    content: `W swojej turze możesz wykonać następujące akcje:`,
    demo: 'actions',
    tip: '⚡ Możesz dobierać karty tak długo, jak chcesz – dopóki nie przekroczysz 21.',
  },
  {
    id: 'dealer-turn',
    title: 'Tura krupiera',
    icon: '🎩',
    content: `Krupier gra według stałych, niezmiennych zasad – nie podejmuje decyzji jak Ty:
• Krupier dobiera kartę, gdy jego suma wynosi 16 lub mniej
• Krupier staje (nie dobiera), gdy jego suma wynosi 17 lub więcej
• Krupier musi dobierać do "miękkiego 17" (As + 6) w niektórych wersjach gry

To oznacza, że krupier nie może "blefować" ani zmieniać strategii!`,
    demo: null,
    tip: '📖 Zasada krupiera jest zawsze taka sama – możesz ją wykorzystać w swojej strategii.',
  },
  {
    id: 'winning',
    title: 'Warunki wygranej',
    icon: '🏆',
    content: `Wygrywasz gdy:
• Twoja suma jest bliższa 21 niż krupiera (bez przekroczenia)
• Krupier przekroczy 21 (bust) – nawet jeśli Ty masz np. 15
• Zdobędziesz Blackjacka (As + figura/10) – specjalna wygrana!

Przegrywasz gdy:
• Przekroczysz 21 (bust) – niezależnie od krupiera
• Krupier ma wyższą sumę niż Ty

Remis (push) – odzyskujesz zakład:
• Ty i krupier macie tę samą sumę`,
    demo: 'outcomes',
    tip: '🌟 Blackjack wypłaca zwykle 3:2 – za zakład $10 dostajesz $25!',
  },
  {
    id: 'blackjack',
    title: 'Blackjack – najlepsza ręka!',
    icon: '⭐',
    content: `Blackjack to specjalna ręka składająca się z:
• Asa (♠♥♦♣)
• Figury (Król, Dama, Walet) lub karty 10

Suma = 21 w dwóch kartach!

Blackjack bije zwykłe 21 (np. 7+7+7). Wypłata wynosi zazwyczaj 3:2.
Jeśli krupier też ma Blackjacka – jest remis.`,
    demo: 'blackjack-hand',
    tip: '🎉 Blackjack to najlepsza możliwa ręka – trzymaj kciuki!',
  },
  {
    id: 'session',
    title: 'Struktura sesji i cel gry',
    icon: '💰',
    content: `Każda sesja startuje z budżetem $500. Twoim celem jest podwoić go do $1000!

🃏 Blackjack (vs Krupier):
• Zaczynasz z $500
• Wygrywasz sesję gdy osiągniesz $1000 lub więcej
• Przegrywasz sesję gdy skończą Ci się środki ($0)
• Krupier nie ma własnego budżetu – po prostu wygrywasz lub przegrywasz zakład każdej rundy

⚔️ Duel vs Bot / 🌐 Online Duel:
• Obaj gracze startują z $500
• Wygrywasz gdy Twój budżet osiągnie $1000 (podwojenie)
• Wygrywasz również gdy przeciwnik zbankrutuje (spadnie do $0)
• Każda runda to osobna partia Blackjacka – Ty kontra Twój rywal`,
    demo: 'session',
    tip: '💡 W duelu lepiej grać agresywnie gdy przeciwnik ma mało środków – może zbankrutować szybciej niż Ty dojdziesz do $1000!',
  },
  {
    id: 'strategy',
    title: 'Podstawowa strategia',
    icon: '🧠',
    content: `Podstawowa strategia Blackjacka to matematycznie optymalne decyzje dla każdej kombinacji kart. Oto kluczowe zasady:

📊 Kiedy dobierać kartę (Hit):
• Suma 8 lub mniej – zawsze dobieraj
• Suma 12-16 gdy krupier ma 7 lub więcej – dobieraj
• Suma 12-16 gdy krupier ma 2-6 – stój (krupier może zbustować)

🛑 Kiedy stać (Stand):
• Suma 17 lub więcej – zawsze stój
• Suma 13-16 gdy krupier pokazuje 2-6

⚡ Double Down (gdy dostępne):
• Suma 11 – zawsze podwajaj
• Suma 10 gdy krupier nie ma 10 lub Asa`,
    demo: null,
    tip: '🎓 Stosując podstawową strategię, zmniejszasz przewagę kasyna do zaledwie ~0.5%!',
  },
  {
    id: 'practice',
    title: 'Gotowy do gry?',
    icon: '🚀',
    content: `Teraz znasz już podstawowe zasady Blackjacka! Czas je zastosować w praktyce.

Pamiętaj:
✅ Cel to 21, ale nie przekraczaj!
✅ Krupier musi dobierać do 17
✅ Blackjack (As + figura) to najlepsza ręka
✅ Stój przy 17+, dobieraj przy 8 lub mniej
✅ Zawsze obserwuj odkrytą kartę krupiera

Zacznij od małych zakładów i stosuj podstawową strategię. Powodzenia! 🍀`,
    demo: null,
    tip: null,
  },
];

function CardValueTable() {
  const rows = [
    { cards: ['2', '3', '4', '5', '6', '7', '8', '9'], label: '2–9', value: 'Wartość nominalna (2, 3, ... 9)' },
    { cards: ['10', 'J', 'Q', 'K'], label: '10, J, Q, K', value: '10 punktów' },
    { cards: ['A'], label: 'As (A)', value: '1 lub 11 punktów (Twój wybór)' },
  ];

  return (
    <div className="space-y-3 mt-3">
      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-3 bg-gray-900/60 rounded-xl p-3 border border-gray-700/50">
          <div className="flex gap-1 flex-wrap min-w-0">
            {row.cards.slice(0, 4).map(c => (
              <div key={c} className="w-8 h-11 bg-white rounded text-gray-900 text-xs font-black flex items-center justify-center shadow border border-gray-200 shrink-0">
                {c}
              </div>
            ))}
            {row.cards.length > 4 && <div className="w-8 h-11 flex items-center justify-center text-gray-400 text-xs">...</div>}
          </div>
          <div>
            <div className="text-xs text-gray-400">{row.label}</div>
            <div className="text-sm font-bold text-emerald-300">{row.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function DealingDemo() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="bg-gray-900/60 border border-emerald-800/50 rounded-xl p-4 text-center">
        <div className="text-xs text-gray-400 mb-2 font-semibold tracking-wide">TY (gracz)</div>
        <div className="flex justify-center gap-2">
          <div className="w-10 h-14 bg-white rounded-lg shadow text-gray-900 font-black text-sm flex items-center justify-center border border-gray-200">K♠</div>
          <div className="w-10 h-14 bg-white rounded-lg shadow text-gray-900 font-black text-sm flex items-center justify-center border border-gray-200">7♥</div>
        </div>
        <div className="mt-2 text-emerald-400 font-bold text-sm">Suma: 17</div>
        <div className="mt-1 text-xs text-gray-500">Obie odkryte ✅</div>
      </div>
      <div className="bg-gray-900/60 border border-red-800/50 rounded-xl p-4 text-center">
        <div className="text-xs text-gray-400 mb-2 font-semibold tracking-wide">KRUPIER</div>
        <div className="flex justify-center gap-2">
          <div className="w-10 h-14 bg-white rounded-lg shadow text-gray-900 font-black text-sm flex items-center justify-center border border-gray-200">9♦</div>
          <div className="w-10 h-14 bg-emerald-800 rounded-lg shadow text-emerald-800 font-black text-sm flex items-center justify-center border border-emerald-600">?</div>
        </div>
        <div className="mt-2 text-yellow-400 font-bold text-sm">Pokazuje: 9</div>
        <div className="mt-1 text-xs text-gray-500">Jedna zakryta 🎴</div>
      </div>
    </div>
  );
}

function ActionsDemo() {
  const actions = [
    {
      name: 'HIT',
      icon: '👆',
      color: 'bg-blue-700/60 border-blue-600/50 text-blue-300',
      desc: 'Dobierz kolejną kartę. Możesz to robić dowolną liczbę razy.',
    },
    {
      name: 'STAND',
      icon: '✋',
      color: 'bg-gray-700/60 border-gray-600/50 text-gray-300',
      desc: 'Zatrzymaj się. Nie dobierasz więcej kart – tura krupiera.',
    },
    {
      name: 'DOUBLE DOWN',
      icon: '⚡',
      color: 'bg-yellow-700/60 border-yellow-600/50 text-yellow-300',
      desc: 'Podwój zakład i dobierz dokładnie jedną kartę. Dostępne tylko na 2 kartach.',
    },
    {
      name: 'SPLIT',
      icon: '✂️',
      color: 'bg-purple-700/60 border-purple-600/50 text-purple-300',
      desc: 'Podziel parę kart na dwie osobne ręce. Dostępne tylko przy parze.',
    },
  ];

  return (
    <div className="mt-3 space-y-2">
      {actions.map(a => (
        <div key={a.name} className={`flex items-start gap-3 border rounded-xl p-3 ${a.color}`}>
          <span className="text-xl shrink-0">{a.icon}</span>
          <div>
            <div className="font-black text-sm">{a.name}</div>
            <div className="text-xs opacity-80 mt-0.5">{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OutcomesDemo() {
  const outcomes = [
    { label: 'Twoja wygrana', you: '18', dealer: 'Bust (23)', color: 'text-emerald-400', icon: '🏆', result: '+$10' },
    { label: 'Przegrana', you: 'Bust (23)', dealer: '17', color: 'text-red-400', icon: '💸', result: '-$10' },
    { label: 'Remis (Push)', you: '19', dealer: '19', color: 'text-yellow-400', icon: '🤝', result: '±$0' },
  ];
  return (
    <div className="mt-3 space-y-2">
      {outcomes.map(o => (
        <div key={o.label} className="flex items-center gap-3 bg-gray-900/60 border border-gray-700/50 rounded-xl p-3">
          <span className="text-2xl">{o.icon}</span>
          <div className="flex-1">
            <div className={`text-sm font-bold ${o.color}`}>{o.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">Ty: {o.you} · Krupier: {o.dealer}</div>
          </div>
          <div className={`font-black text-sm ${o.color}`}>{o.result}</div>
        </div>
      ))}
    </div>
  );
}

function BlackjackHandDemo() {
  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex gap-3">
        <div className="w-14 h-20 bg-white rounded-xl shadow-lg text-red-500 font-black text-xl flex flex-col items-center justify-center border-2 border-gray-200">
          <div>A</div><div>♥</div>
        </div>
        <div className="w-14 h-20 bg-white rounded-xl shadow-lg text-gray-900 font-black text-xl flex flex-col items-center justify-center border-2 border-gray-200">
          <div>K</div><div>♠</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-2xl font-black text-yellow-400">BLACKJACK! ⭐</div>
        <div className="text-sm text-gray-400 mt-1">As (11) + Król (10) = 21</div>
        <div className="text-emerald-400 font-bold mt-1">Wypłata 3:2 → Za $10 dostajesz $25!</div>
      </div>
    </div>
  );
}

function SessionDemo() {
  return (
    <div className="mt-4 space-y-3">
      {/* Blackjack solo */}
      <div className="bg-gray-900/60 border border-emerald-800/50 rounded-xl p-4">
        <div className="text-xs text-emerald-400 font-bold tracking-wide mb-2">🃏 BLACKJACK vs KRUPIER</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-3 bg-emerald-500 rounded-full" style={{ width: '50%' }} />
          </div>
          <span className="text-xs text-gray-300 font-bold w-16 text-right">$500 → $1000</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>$0 (koniec)</span>
          <span className="text-yellow-400 font-bold">🏆 $1000 (wygrana!)</span>
        </div>
      </div>

      {/* Duel */}
      <div className="bg-gray-900/60 border border-orange-800/50 rounded-xl p-4">
        <div className="text-xs text-orange-400 font-bold tracking-wide mb-3">⚔️ DUEL (Ty vs Rywal)</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-400 mb-1">Ty</div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-2.5 bg-emerald-500 rounded-full" style={{ width: '70%' }} />
            </div>
            <div className="text-xs text-emerald-400 font-bold mt-1">$700</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Rywal</div>
            <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-2.5 bg-red-500 rounded-full" style={{ width: '20%' }} />
            </div>
            <div className="text-xs text-red-400 font-bold mt-1">$200</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          <span className="bg-emerald-900/50 border border-emerald-700/50 text-emerald-300 px-2 py-1 rounded-lg">Ty do $1000 → wygrana</span>
          <span className="bg-red-900/50 border border-red-700/50 text-red-300 px-2 py-1 rounded-lg">Rywal do $0 → wygrana</span>
        </div>
      </div>
    </div>
  );
}

const DEMO_MAP = {
  'card-values': <CardValueTable />,
  'dealing': <DealingDemo />,
  'actions': <ActionsDemo />,
  'outcomes': <OutcomesDemo />,
  'blackjack-hand': <BlackjackHandDemo />,
  'session': <SessionDemo />,
};

export default function BlackjackTutorial({ onBack, onPlay }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-emerald-950 to-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            ← Wróć do lobby
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <span className="text-emerald-400 font-black tracking-wider">SAMOUCZEK BLACKJACK</span>
          </div>
          <div className="text-xs text-gray-500 font-semibold">
            {step + 1} / {STEPS.length}
          </div>
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
      <main className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            {/* Step header */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl">{current.icon}</span>
              <div>
                <div className="text-xs text-emerald-400 font-bold tracking-widest uppercase mb-0.5">
                  Krok {step + 1} z {STEPS.length}
                </div>
                <h2 className="text-2xl font-black">{current.title}</h2>
              </div>
            </div>

            {/* Main card */}
            <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-5 mb-4 flex-1">
              <p className="text-gray-200 leading-relaxed whitespace-pre-line text-sm">
                {current.content}
              </p>
              {current.demo && DEMO_MAP[current.demo]}
            </div>

            {/* Tip */}
            {current.tip && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-yellow-900/30 border border-yellow-700/40 rounded-xl px-4 py-3 mb-4 text-sm text-yellow-200"
              >
                {current.tip}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
            className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Poprzedni
          </button>
          {isLast ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onPlay}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-black text-white transition-all shadow-lg shadow-emerald-900/40"
            >
              🎮 ZAGRAJ TERAZ!
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStep(s => s + 1)}
              className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 font-bold text-white transition-all"
            >
              Następny →
            </motion.button>
          )}
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mt-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-emerald-400 w-5' : i < step ? 'bg-emerald-700' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
