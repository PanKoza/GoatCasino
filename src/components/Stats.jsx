import { motion } from 'framer-motion';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

function StatCard({ label, value, color, icon, delay = 0 }) {
  return (
    <motion.div
      variants={item}
      className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 flex flex-col items-center gap-1 text-center"
    >
      <div className="text-2xl mb-1">{icon}</div>
      <motion.div
        key={String(value)}
        initial={{ scale: 1.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className={`text-3xl font-black ${color}`}
      >
        {value}
      </motion.div>
      <div className="text-xs text-gray-500 tracking-widest uppercase font-semibold">{label}</div>
    </motion.div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-2 rounded-full ${color}`}
      />
    </div>
  );
}

export default function Stats({ user, onBack }) {
  const {
    username,
    balance = 0,
    gamesPlayed = 0,
    gamesWon = 0,
    totalProfit = 0,
    bestSession = 0,
  } = user;

  const gamesLost = gamesPlayed - gamesWon;
  const winRate = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const avgProfit = gamesPlayed > 0 ? Math.round(totalProfit / gamesPlayed) : 0;
  const rankScore = gamesPlayed > 0
    ? Math.round((gamesWon / gamesPlayed) * 1000 + totalProfit * 0.1 + gamesWon * 50)
    : 0;

  const tier =
    rankScore >= 3000 ? { label: 'LEGENDA', color: 'text-yellow-300', icon: '👑' } :
    rankScore >= 1500 ? { label: 'EKSPERT',  color: 'text-purple-400', icon: '💎' } :
    rankScore >= 700  ? { label: 'ZAAWANSOWANY', color: 'text-blue-400', icon: '🔷' } :
    rankScore >= 200  ? { label: 'GRACZ',    color: 'text-emerald-400', icon: '🃏' } :
                        { label: 'NOWICJUSZ', color: 'text-gray-400',   icon: '🎲' };

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{ background: 'radial-gradient(ellipse at 50% 20%, #0d2818 0%, #060d0a 100%)' }}
    >
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm"
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐐</span>
            <h1 className="text-xl font-black tracking-widest text-emerald-400">
              GOAT<span className="text-white">CASINO</span>
            </h1>
          </div>
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-emerald-400 font-semibold transition-colors border border-gray-700 hover:border-emerald-700 rounded-lg px-4 py-1.5"
          >
            ← Lobby
          </button>
        </div>
      </motion.header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        {/* Title + tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-2">{tier.icon}</div>
          <h2 className="text-3xl font-black mb-1">
            Statystyki gracza{' '}
            <span className="text-emerald-400">{username}</span>
          </h2>
          <div className={`text-sm font-bold tracking-widest ${tier.color}`}>{tier.label}</div>
          <div className="text-xs text-gray-500 mt-1">Rank Score: {rankScore}</div>
        </motion.div>

        {/* Main stat cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          <StatCard icon="🎮" label="Rozegrane" value={gamesPlayed} color="text-white" />
          <StatCard icon="🏆" label="Wygrane"   value={gamesWon}    color="text-emerald-400" />
          <StatCard icon="💀" label="Przegrane" value={gamesLost}   color="text-red-400" />
          <StatCard icon="🎯" label="Win Rate"  value={`${winRate}%`} color="text-yellow-400" />
        </motion.div>

        {/* Win rate bar */}
        {gamesPlayed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5 mb-6"
          >
            <div className="flex justify-between text-xs text-gray-400 mb-2 font-semibold">
              <span>Wygrane <span className="text-emerald-400">{gamesWon}</span></span>
              <span>Win Rate</span>
              <span>Przegrane <span className="text-red-400">{gamesLost}</span></span>
            </div>
            <ProgressBar value={gamesWon} max={gamesPlayed} color="bg-emerald-500" />
          </motion.div>
        )}

        {/* Financial stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6"
        >
          <StatCard
            icon="💰"
            label="Saldo"
            value={`$${balance.toLocaleString()}`}
            color={balance >= 500 ? 'text-emerald-400' : 'text-red-400'}
          />
          <StatCard
            icon="📈"
            label="Zysk netto"
            value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit}`}
            color={totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}
          />
          <StatCard
            icon="🚀"
            label="Szczyt sesji"
            value={`$${bestSession.toLocaleString()}`}
            color="text-purple-400"
          />
          <StatCard
            icon="📊"
            label="Śr. zysk/sesja"
            value={`${avgProfit >= 0 ? '+' : ''}$${avgProfit}`}
            color={avgProfit >= 0 ? 'text-yellow-400' : 'text-red-400'}
          />
          <StatCard
            icon="⭐"
            label="Rank Score"
            value={rankScore}
            color="text-yellow-300"
          />
          <StatCard
            icon="🏅"
            label="Ranga"
            value={tier.label}
            color={tier.color}
          />
        </motion.div>

        {/* No games placeholder */}
        {gamesPlayed === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-12 text-gray-600"
          >
            <div className="text-5xl mb-3">🎲</div>
            <p className="text-sm">Nie rozegrałeś jeszcze żadnej sesji.<br />Zacznij grać, aby zobaczyć statystyki!</p>
          </motion.div>
        )}
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        GoatCasino &copy; 2026 · Tylko dla dorosłych · Graj odpowiedzialnie.
      </footer>
    </div>
  );
}
