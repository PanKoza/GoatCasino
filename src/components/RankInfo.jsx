import { motion } from 'framer-motion';

const RANKS = [
  {
    label: 'NIEKLASYFIKOWANY', cardRank: '?', cardSuit: '✦',
    color: '#6b7280', threshold: null, thresholdEnd: 0,
    desc: 'Gracz który nie rozegrał jeszcze żadnej sesji.',
    tips: [],
  },
  {
    label: 'JOPEK', cardRank: 'J', cardSuit: '♣',
    color: '#fb923c', threshold: 0, thresholdEnd: 199,
    desc: 'Gracz stawiający pierwsze kroki. Mała liczba sesji lub niski win rate.',
    tips: ['Graj regularnie', 'Naucz się podstaw Blackjacka', 'Zacznij od poziomu Łatwego'],
  },
  {
    label: 'KRÓLOWA', cardRank: 'Q', cardSuit: '♦',
    color: '#34d399', threshold: 200, thresholdEnd: 799,
    desc: 'Ranga większości aktywnych graczy. Odzwierciedla solidne postępy i regularną grę.',
    tips: ['Spróbuj Duela na poziomie Średnim', 'Utrzymuj win rate powyżej 40%', 'Graj Pokera dla dodatkowych punktów'],
    highlight: true,
  },
  {
    label: 'KRÓL', cardRank: 'K', cardSuit: '♥',
    color: '#60a5fa', threshold: 800, thresholdEnd: 1999,
    desc: 'Gracz z dużym doświadczeniem i dobrą strategią. Wymaga regularnych wygranych.',
    tips: ['Mistrz Duela Średniego / Trudnego', 'Win rate 50%+', 'Aktywna gra w wielu trybach'],
  },
  {
    label: 'AS', cardRank: 'A', cardSuit: '♠',
    color: '#a855f7', threshold: 2000, thresholdEnd: 4999,
    desc: 'Ekspert. Doskonała znajomość strategii, wysokie wyniki we wszystkich trybach.',
    tips: ['Regularne wygrane w Duelu Trudnym (+40 pkt/win)', 'Win rate 55%+', 'Poker Online na wysokim poziomie'],
  },
  {
    label: 'JOKER', cardRank: 'JK', cardSuit: '★',
    color: '#fbbf24', threshold: 5000, thresholdEnd: null,
    desc: 'Elita. Najwyższa ranga wymagająca setek godzin doskonałej gry.',
    tips: ['Top tier we wszystkich trybach', 'Długa seria Trudnych Dueli', 'Elita rankingu globalnego'],
  },
];

const BONUSES = [
  { mode: '🃏 Blackjack',        win: +2,  loss: -1,  note: 'Podstawowy tryb' },
  { mode: '⚔️ Duel Łatwy',       win: +6,  loss: -12, note: 'Kara za przegraną z łatwym!' },
  { mode: '⚔️ Duel Średni',      win: +20, loss: -6,  note: 'Zbalansowany' },
  { mode: '⚔️ Duel Trudny',      win: +25, loss: 0,   note: 'Brak kary za przegraną' },
  { mode: '♠️ Poker 1v1',        win: +8,  loss: -2,  note: 'Vs bot AI' },
  { mode: '♠️ Poker 4 boty',     win: +15, loss: -3,  note: 'Trudniejszy stół' },
  { mode: '🌐 Online Duel BJ',   win: +35, loss: -5,  note: '⭐ Prawdziwy gracz – więcej pkt!' },
  { mode: '♠️ Poker Online',     win: +60, loss: -10, note: '🏆 Najwyższy bonus – długa gra online!' },
];

function MiniCard({ rank }) {
  const isRed = rank.cardSuit === '♥' || rank.cardSuit === '♦';
  const col = isRed ? '#dc2626' : rank.color === '#fbbf24' ? '#d97706' : '#111827';
  return (
    <div className="w-10 h-14 rounded-xl bg-white flex flex-col items-center justify-center font-black leading-none shadow-lg shrink-0"
      style={{ border: `2px solid ${rank.color}`, boxShadow: `0 0 12px ${rank.color}66`, color: col }}>
      <span className="text-sm">{rank.cardRank}</span>
      <span className="text-xs">{rank.cardSuit}</span>
    </div>
  );
}

export default function RankInfo({ user, onBack }) {
  const formula = 'winRate × 600 + wins × 4 + profit × 0.01 + rankBonus';

  return (
    <div className="min-h-screen text-white flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #0d1f14 0%, #060d08 100%)' }}>

      {/* Header */}
      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack}
            className="text-sm text-gray-400 hover:text-white transition-colors font-semibold">
            ← Lobby
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span className="text-emerald-400 font-black tracking-wider">SYSTEM RANG</span>
          </div>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="max-w-3xl mx-auto w-full px-4 py-8 space-y-8">

        {/* Formula */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-lg font-black text-yellow-400 mb-3 flex items-center gap-2">
            <span>📐</span> Jak obliczany jest wynik?
          </h2>
          <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl p-4">
            <div className="font-mono text-sm bg-black/40 rounded-xl px-4 py-3 text-emerald-300 mb-4 break-all">
              score = {formula}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { comp: 'winRate × 600', desc: 'Procent wygranych sesji (max 600 pkt przy 100% WR)', color: 'text-emerald-400' },
                { comp: 'wins × 4',     desc: 'Nagroda za każdą wygraną sesję (rośnie powoli)', color: 'text-blue-400' },
                { comp: 'profit × 0.01', desc: 'Łączny zysk netto z wszystkich sesji (marginalny)', color: 'text-yellow-400' },
                { comp: 'rankBonus',    desc: 'Kumulowane bonusy/kary za tryb i trudność gry', color: 'text-purple-400' },
              ].map(c => (
                <div key={c.comp} className="bg-gray-800/50 rounded-xl p-3">
                  <div className={`font-mono text-sm font-bold ${c.color}`}>{c.comp}</div>
                  <div className="text-xs text-gray-400 mt-1">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Ranks */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-black text-yellow-400 mb-3 flex items-center gap-2">
            <span>🃏</span> Rangi
          </h2>
          <div className="space-y-3">
            {RANKS.map((r, i) => (
              <motion.div key={r.label}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className={`rounded-2xl p-4 border flex gap-4 items-start relative overflow-hidden ${
                  r.highlight ? 'border-emerald-500/50' : 'border-gray-700/50'
                }`}
                style={{ background: `linear-gradient(135deg, ${r.color}12 0%, rgba(0,0,0,0.6) 100%)` }}>

                {r.highlight && (
                  <div className="absolute top-2 right-3 text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full tracking-widest">
                    WIĘKSZOŚĆ GRACZY
                  </div>
                )}

                <MiniCard rank={r} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="font-black text-base" style={{ color: r.color }}>{r.label}</span>
                    {r.threshold !== null ? (
                      <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-full">
                        {r.threshold} – {r.thresholdEnd ?? '∞'} pkt
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600 bg-gray-800/60 px-2 py-0.5 rounded-full">
                        brak rozegranych gier
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{r.desc}</p>
                  {r.tips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {r.tips.map(t => (
                        <span key={t} className="text-[10px] bg-gray-800/70 border border-gray-700/50 text-gray-400 px-2 py-0.5 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Bonus table */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-black text-yellow-400 mb-3 flex items-center gap-2">
            <span>⚡</span> Bonusy rankingowe per tryb
          </h2>
          <div className="bg-gray-900/70 border border-gray-700/60 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 text-[10px] text-gray-500 font-bold tracking-widest uppercase px-4 py-2 border-b border-gray-800">
              <span className="col-span-2">Tryb</span>
              <span className="text-center">Wygrana</span>
              <span className="text-center">Przegrana</span>
            </div>
            {BONUSES.map((b, i) => (
              <motion.div key={b.mode}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.04 }}
                className="grid grid-cols-4 items-center px-4 py-3 border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                <div className="col-span-2">
                  <div className="text-sm font-bold text-white">{b.mode}</div>
                  <div className="text-[10px] text-gray-500">{b.note}</div>
                </div>
                <div className="text-center font-black text-emerald-400 text-sm">+{b.win}</div>
                <div className={`text-center font-black text-sm ${b.loss < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {b.loss === 0 ? '0' : b.loss}
                </div>
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2 px-1">
            * Bonusy kumulują się w polu <span className="text-gray-400 font-mono">rankBonus</span> i są dodawane do ogólnego wyniku.
          </p>
        </motion.section>

        {/* Tips */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gray-900/60 border border-yellow-900/30 rounded-2xl p-5">
          <h2 className="text-base font-black text-yellow-400 mb-3 flex items-center gap-2">
            <span>💡</span> Porady na szybki awans
          </h2>
          <ul className="space-y-2 text-sm text-gray-300">
          <li className="flex gap-2"><span className="text-yellow-400 shrink-0">1.</span><span className="text-purple-400 font-bold mr-1">Poker Online</span> daje aż +60 pkt za wygraną – najdłuższa i najtrudniejsza gra</li>
            <li className="flex gap-2"><span className="text-yellow-400 shrink-0">2.</span><span className="text-blue-400 font-bold mr-1">Online Duel BJ</span> daje +35 pkt – nagradza grę z prawdziwymi ludźmi</li>
            <li className="flex gap-2"><span className="text-yellow-400 shrink-0">3.</span>Graj Duel na poziomie <span className="text-red-400 font-bold mx-1">Trudnym</span> (+25 pkt, 0 kary) – bezpieczny wybór dla botów</li>
            <li className="flex gap-2"><span className="text-yellow-400 shrink-0">4.</span>Unikaj poziomu <span className="text-orange-400 font-bold mx-1">Łatwego</span> – przegrana kosztuje -12 pkt!</li>
            <li className="flex gap-2"><span className="text-yellow-400 shrink-0">5.</span><span className="text-blue-400 font-bold mr-1">Win rate</span> to najważniejszy składnik (600 pkt max) – jakość {'>'} ilość</li>
          </ul>
        </motion.section>

      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600 mt-4">
        GoatCasino &copy; 2026 · System rang v2.0
      </footer>
    </div>
  );
}
