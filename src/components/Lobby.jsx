import { motion } from 'framer-motion';
import Leaderboard from './Leaderboard';

const games = [
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Klasyczna gra karciana. Zbierz 21 i pokonaj krupiera!',
    icon: '🃏',
    badge: 'DOSTĘPNE',
    badgeColor: 'bg-emerald-500',
    available: true,
  },
  {
    id: 'duel',
    name: 'Duel vs Bot',
    description: 'Zagraj przeciwko botowi! Pierwszy do $1000 wygrywa duel.',
    icon: '⚔️',
    badge: 'DOSTĘPNE',
    badgeColor: 'bg-orange-500',
    available: true,
  },
  {
    id: 'online',
    name: 'Online Duel',
    description: 'Graj z prawdziwym graczem w czasie rzeczywistym!',
    icon: '🌐',
    badge: 'ONLINE',
    badgeColor: 'bg-blue-500',
    available: true,
  },
  {
    id: 'roulette',
    name: 'Ruletka',
    description: 'Europejska ruletka z żywym krupierem.',
    icon: '🎡',
    badge: 'WKRÓTCE',
    badgeColor: 'bg-gray-600',
    available: false,
  },
  {
    id: 'slots',
    name: 'Sloty',
    description: 'Lucky Goat – trzęsienie bębnów, ogromne wygrane!',
    icon: '🎰',
    badge: 'WKRÓTCE',
    badgeColor: 'bg-gray-600',
    available: false,
  },
];

export default function Lobby({ onSelectGame, user, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-emerald-950 to-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="border-b border-emerald-800/40 bg-black/50 backdrop-blur-sm"
      >
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐐</span>
            <div>
              <h1 className="text-2xl font-black tracking-widest text-emerald-400">GOAT<span className="text-white">CASINO</span></h1>
              <p className="text-xs text-gray-500 tracking-widest">PLAY SMART. WIN BIG.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/40 px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm text-emerald-400 font-semibold">Na żywo</span>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500 leading-none">👤 {user.username}</div>
                  <div className="text-sm font-black text-yellow-400 leading-tight">${user.balance?.toLocaleString()}</div>
                </div>
                <button
                  onClick={() => onSelectGame('stats')}
                  className="text-xs text-gray-400 hover:text-emerald-400 font-semibold transition-colors border border-gray-700 hover:border-emerald-700 rounded-lg px-3 py-1.5"
                >
                  📊 Statystyki
                </button>
                <button
                  onClick={onLogout}
                  className="text-xs text-gray-500 hover:text-red-400 font-semibold transition-colors border border-gray-700 hover:border-red-700/50 rounded-lg px-3 py-1.5"
                >
                  Wyloguj
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="text-center py-10 px-4"
      >
        <h2 className="text-4xl sm:text-5xl font-black mb-2 tracking-tight">
          Witaj w <span className="text-emerald-400">GoatCasino</span>
          {user && <span className="text-white">, {user.username}!</span>}
        </h2>
        <p className="text-gray-400 text-base max-w-xl mx-auto">
          Zacznij z $500 · Cel: $1000 · Wygraj ranking!
        </p>
      </motion.div>

      {/* Stats bar */}
      {user && (user.gamesPlayed > 0) && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.35 }}
          className="max-w-5xl mx-auto w-full px-6 mb-6">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Rozegrane', value: user.gamesPlayed, color: 'text-white' },
              { label: 'Wygrane', value: user.gamesWon, color: 'text-emerald-400' },
              { label: 'Win Rate', value: user.gamesPlayed > 0 ? `${Math.round(user.gamesWon/user.gamesPlayed*100)}%` : '—', color: 'text-yellow-400' },
              { label: 'Zysk netto', value: `${user.totalProfit >= 0 ? '+' : ''}${user.totalProfit}$`, color: user.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
                <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Game Grid */}
      <main className="max-w-5xl mx-auto w-full px-6 pb-6">
        <h3 className="text-xs text-gray-500 tracking-widest uppercase mb-4 font-semibold">Wybierz grę</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {games.map((game, i) => (
            <motion.button
              key={game.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
              whileHover={game.available ? { scale: 1.04, y: -4 } : {}}
              whileTap={game.available ? { scale: 0.97 } : {}}
              onClick={() => game.available && onSelectGame(game.id)}
              disabled={!game.available}
              className={`group relative flex flex-col items-center text-center rounded-2xl border p-6 transition-colors duration-200 ${
                game.available
                  ? 'border-emerald-700/50 bg-emerald-950/60 hover:border-emerald-400 hover:bg-emerald-900/60 cursor-pointer'
                  : 'border-gray-800 bg-gray-900/40 opacity-60 cursor-not-allowed'
              }`}
            >
              <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${game.badgeColor} text-white`}>
                {game.badge}
              </span>
              <div className="text-5xl mb-4">{game.icon}</div>
              <h4 className="text-lg font-bold mb-1">{game.name}</h4>
              <p className="text-gray-400 text-sm leading-snug">{game.description}</p>
              {game.available && (
                <div className="mt-4 px-5 py-2 rounded-xl bg-emerald-600 group-hover:bg-emerald-500 text-sm font-bold transition-colors">
                  ZAGRAJ
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Leaderboard */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
          <Leaderboard currentUserId={user?.id} />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        GoatCasino &copy; 2026 · Tylko dla dorosłych · Graj odpowiedzialnie.
      </footer>
    </div>
  );
}
