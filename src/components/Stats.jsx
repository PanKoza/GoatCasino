import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

function StatCard({ label, value, color, icon }) {
  return (
    <motion.div variants={item}
      className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 flex flex-col items-center gap-1 text-center">
      <div className="text-2xl mb-0.5">{icon}</div>
      <motion.div key={String(value)}
        initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`text-2xl font-black ${color}`}>{value}</motion.div>
      <div className="text-xs text-gray-500 tracking-widest uppercase font-semibold leading-tight">{label}</div>
    </motion.div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-2.5 rounded-full ${color}`} />
    </div>
  );
}

function SectionHeader({ icon, title, color }) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-800">
      <span className="text-2xl">{icon}</span>
      <h3 className={`text-lg font-black tracking-wider ${color}`}>{title}</h3>
    </div>
  );
}

const TABS = [
  { id: 'overall',   label: '🎲 Ogólne' },
  { id: 'blackjack', label: '🃏 Blackjack' },
  { id: 'poker',     label: '♠️ Poker' },
];

export default function Stats({ user, onBack }) {
  const [tab, setTab] = useState('overall');

  const {
    username,
    balance = 0,
    gamesPlayed = 0,
    gamesWon = 0,
    totalProfit = 0,
    bestSession = 0,
    rankBonus = 0,
    bjPlayed = 0,
    bjWon = 0,
    bjProfit = 0,
    pokerPlayed = 0,
    pokerWon = 0,
    pokerProfit = 0,
  } = user;

  const gamesLost  = gamesPlayed - gamesWon;
  const winRate    = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const avgProfit  = gamesPlayed > 0 ? Math.round(totalProfit / gamesPlayed) : 0;
  const rankScore  = gamesPlayed > 0
    ? Math.round((gamesWon / gamesPlayed) * 600 + gamesWon * 4 + totalProfit * 0.01 + rankBonus)
    : 0;

  const tier =
    gamesPlayed === 0    ? { label: 'NIEKLASYFIKOWANY', color: 'text-gray-500',   icon: '❓' } :
    rankScore >= 5000    ? { label: 'JOKER',            color: 'text-yellow-300', icon: '🃏' } :
    rankScore >= 2000    ? { label: 'AS',               color: 'text-purple-400', icon: '🂡' } :
    rankScore >= 800     ? { label: 'KRÓL',             color: 'text-blue-400',   icon: '♚'  } :
    rankScore >= 200     ? { label: 'KRÓLOWA',          color: 'text-emerald-400',icon: '♛'  } :
                           { label: 'JOPEK',            color: 'text-orange-400', icon: '🎴' };

  const bjLost    = bjPlayed - bjWon;
  const bjWinRate = bjPlayed > 0 ? Math.round((bjWon / bjPlayed) * 100) : 0;
  const bjAvg     = bjPlayed > 0 ? Math.round(bjProfit / bjPlayed) : 0;

  const pkLost    = pokerPlayed - pokerWon;
  const pkWinRate = pokerPlayed > 0 ? Math.round((pokerWon / pokerPlayed) * 100) : 0;
  const pkAvg     = pokerPlayed > 0 ? Math.round(pokerProfit / pokerPlayed) : 0;

  return (
    <div className="min-h-screen text-white flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #0d2818 0%, #060d0a 100%)' }}>

      <motion.header initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐐</span>
            <h1 className="text-xl font-black tracking-widest text-emerald-400">
              GOAT<span className="text-white">CASINO</span>
            </h1>
          </div>
          <button onClick={onBack}
            className="text-sm text-gray-400 hover:text-emerald-400 font-semibold transition-colors border border-gray-700 hover:border-emerald-700 rounded-lg px-4 py-1.5">
            ← Lobby
          </button>
        </div>
      </motion.header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">

        {/* Title + tier */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="text-center mb-6">
          <div className="text-5xl mb-2">{tier.icon}</div>
          <h2 className="text-3xl font-black mb-1">
            Statystyki gracza <span className="text-emerald-400">{username}</span>
          </h2>
          <div className={`text-sm font-bold tracking-widest ${tier.color}`}>{tier.label}</div>
          <div className="text-xs text-gray-500 mt-1">
            Rank Score: <span className="text-yellow-400 font-bold">{rankScore}</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
          className="flex gap-2 mb-6">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                tab === t.id
                  ? 'bg-emerald-700 border-emerald-500 text-white shadow-lg'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-emerald-800 hover:text-emerald-300'
              }`}>
              {t.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ── OGÓLNE ── */}
          {tab === 'overall' && (
            <motion.div key="overall" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              transition={{ duration: 0.2 }} className="space-y-5">
              <SectionHeader icon="🎲" title="Statystyki ogólne" color="text-white" />
              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon="🎮" label="Rozegrane" value={gamesPlayed}    color="text-white" />
                <StatCard icon="🏆" label="Wygrane"   value={gamesWon}       color="text-emerald-400" />
                <StatCard icon="💀" label="Przegrane" value={gamesLost}      color="text-red-400" />
                <StatCard icon="🎯" label="Win Rate"  value={`${winRate}%`}  color="text-yellow-400" />
              </motion.div>

              {gamesPlayed > 0 && (
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                    <span>Wygrane <span className="text-emerald-400">{gamesWon}</span></span>
                    <span>{winRate}% Win Rate</span>
                    <span>Przegrane <span className="text-red-400">{gamesLost}</span></span>
                  </div>
                  <ProgressBar value={gamesWon} max={gamesPlayed} color="bg-emerald-500" />
                </div>
              )}

              <motion.div variants={container} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon="" label="Zysk netto"    value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit}`}
                  color={totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                <StatCard icon="🚀" label="Szczyt sesji"  value={`$${bestSession.toLocaleString()}`} color="text-purple-400" />
                <StatCard icon="📊" label="Śr. zysk/sesja" value={`${avgProfit >= 0 ? '+' : ''}$${avgProfit}`}
                  color={avgProfit >= 0 ? 'text-yellow-400' : 'text-red-400'} />
                <StatCard icon="⭐" label="Rank Score"    value={rankScore}   color="text-yellow-300" />
                <StatCard icon="🏅" label="Ranga"         value={tier.label}  color={tier.color} />
              </motion.div>

              {gamesPlayed > 0 && (bjPlayed > 0 || pokerPlayed > 0) && (
                <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4 space-y-3">
                  <div className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-2">Rozgrywki wg gry</div>
                  {bjPlayed > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-base w-5">🃏</span>
                      <span className="text-sm text-gray-300 w-24 shrink-0">Blackjack</span>
                      <ProgressBar value={bjPlayed} max={gamesPlayed} color="bg-emerald-500" />
                      <span className="text-xs text-gray-400 w-8 text-right">{bjPlayed}</span>
                    </div>
                  )}
                  {pokerPlayed > 0 && (
                    <div className="flex items-center gap-3">
                      <span className="text-base w-5">♠️</span>
                      <span className="text-sm text-gray-300 w-24 shrink-0">Poker</span>
                      <ProgressBar value={pokerPlayed} max={gamesPlayed} color="bg-purple-500" />
                      <span className="text-xs text-gray-400 w-8 text-right">{pokerPlayed}</span>
                    </div>
                  )}
                </div>
              )}

              {gamesPlayed === 0 && (
                <div className="text-center py-12 text-gray-600">
                  <div className="text-5xl mb-3">🎲</div>
                  <p className="text-sm">Nie rozegrałeś jeszcze żadnej sesji.<br />Zacznij grać, aby zobaczyć statystyki!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── BLACKJACK ── */}
          {tab === 'blackjack' && (
            <motion.div key="blackjack" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              transition={{ duration: 0.2 }} className="space-y-5">
              <SectionHeader icon="🃏" title="Blackjack" color="text-emerald-400" />
              {bjPlayed === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <div className="text-5xl mb-3">🃏</div>
                  <p className="text-sm">Nie rozegrałeś jeszcze żadnej sesji Blackjacka!</p>
                </div>
              ) : (
                <>
                  <motion.div variants={container} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon="🎮" label="Rozegrane" value={bjPlayed}        color="text-white" />
                    <StatCard icon="🏆" label="Wygrane"   value={bjWon}          color="text-emerald-400" />
                    <StatCard icon="💀" label="Przegrane" value={bjLost}         color="text-red-400" />
                    <StatCard icon="🎯" label="Win Rate"  value={`${bjWinRate}%`} color="text-yellow-400" />
                  </motion.div>
                  <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                      <span>Wygrane <span className="text-emerald-400">{bjWon}</span></span>
                      <span>{bjWinRate}% Win Rate</span>
                      <span>Przegrane <span className="text-red-400">{bjLost}</span></span>
                    </div>
                    <ProgressBar value={bjWon} max={bjPlayed} color="bg-emerald-500" />
                  </div>
                  <motion.div variants={container} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard icon="📈" label="Zysk netto"     value={`${bjProfit >= 0 ? '+' : ''}$${bjProfit}`}
                      color={bjProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                    <StatCard icon="📊" label="Śr. zysk/sesja" value={`${bjAvg >= 0 ? '+' : ''}$${bjAvg}`}
                      color={bjAvg >= 0 ? 'text-yellow-400' : 'text-red-400'} />
                    <StatCard icon="🎴" label="Sesje total"    value={bjPlayed}   color="text-blue-400" />
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

          {/* ── POKER ── */}
          {tab === 'poker' && (
            <motion.div key="poker" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
              transition={{ duration: 0.2 }} className="space-y-5">
              <SectionHeader icon="♠️" title="Texas Hold'em Poker" color="text-purple-400" />
              {pokerPlayed === 0 ? (
                <div className="text-center py-16 text-gray-600">
                  <div className="text-5xl mb-3">♠️</div>
                  <p className="text-sm">Nie rozegrałeś jeszcze żadnej sesji Pokera!</p>
                </div>
              ) : (
                <>
                  <motion.div variants={container} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon="🎮" label="Rozegrane" value={pokerPlayed}      color="text-white" />
                    <StatCard icon="🏆" label="Wygrane"   value={pokerWon}        color="text-purple-400" />
                    <StatCard icon="💀" label="Przegrane" value={pkLost}          color="text-red-400" />
                    <StatCard icon="🎯" label="Win Rate"  value={`${pkWinRate}%`} color="text-yellow-400" />
                  </motion.div>
                  <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
                      <span>Wygrane <span className="text-purple-400">{pokerWon}</span></span>
                      <span>{pkWinRate}% Win Rate</span>
                      <span>Przegrane <span className="text-red-400">{pkLost}</span></span>
                    </div>
                    <ProgressBar value={pokerWon} max={pokerPlayed} color="bg-purple-500" />
                  </div>
                  <motion.div variants={container} initial="hidden" animate="show"
                    className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatCard icon="📈" label="Zysk netto"     value={`${pokerProfit >= 0 ? '+' : ''}$${pokerProfit}`}
                      color={pokerProfit >= 0 ? 'text-emerald-400' : 'text-red-400'} />
                    <StatCard icon="📊" label="Śr. zysk/sesja" value={`${pkAvg >= 0 ? '+' : ''}$${pkAvg}`}
                      color={pkAvg >= 0 ? 'text-yellow-400' : 'text-red-400'} />
                    <StatCard icon="🃏" label="Sesje total"    value={pokerPlayed} color="text-blue-400" />
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        GoatCasino &copy; 2026 · Tylko dla dorosłych · Graj odpowiedzialnie.
      </footer>
    </div>
  );
}
