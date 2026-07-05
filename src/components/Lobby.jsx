import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Leaderboard from './Leaderboard';

// ── Rank config ───────────────────────────────────────────────────
function getRank(user) {
  const { gamesPlayed = 0, gamesWon = 0, totalProfit = 0, rankBonus = 0 } = user ?? {};
  const score = gamesPlayed > 0
    ? Math.round((gamesWon / gamesPlayed) * 600 + gamesWon * 4 + totalProfit * 0.01 + rankBonus)
    : 0;
  if (gamesPlayed === 0)  return { label: 'NIEKLASYFIKOWANY', color: '#6b7280', glow: '#6b7280', cardRank: '?',  cardSuit: '✦', score };
  if (score >= 5000)      return { label: 'JOKER',            color: '#fbbf24', glow: '#f59e0b', cardRank: 'JK', cardSuit: '★', score };
  if (score >= 2000)      return { label: 'AS',               color: '#a855f7', glow: '#9333ea', cardRank: 'A',  cardSuit: '♠', score };
  if (score >= 800)       return { label: 'KRÓL',             color: '#60a5fa', glow: '#3b82f6', cardRank: 'K',  cardSuit: '♥', score };
  if (score >= 200)       return { label: 'KRÓLOWA',          color: '#34d399', glow: '#10b981', cardRank: 'Q',  cardSuit: '♦', score };
  return                         { label: 'JOPEK',            color: '#fb923c', glow: '#f97316', cardRank: 'J',  cardSuit: '♣', score };
}

const RANK_NEXT = [
  { threshold: 200,  label: 'KRÓLOWA' },
  { threshold: 800,  label: 'KRÓL' },
  { threshold: 2000, label: 'AS' },
  { threshold: 5000, label: 'JOKER' },
];

// ── Animated rank card ────────────────────────────────────────────
function RankCard({ rank }) {
  const isRed = rank.cardSuit === '♥' || rank.cardSuit === '♦';
  const col = isRed ? '#dc2626' : rank.color === '#fbbf24' ? '#d97706' : '#111827';

  return (
    <motion.div
      initial={{ rotateY: 180, scale: 0.7, opacity: 0 }}
      animate={{ rotateY: 0,   scale: 1,   opacity: 1 }}
      transition={{ duration: 0.7, type: 'spring', stiffness: 160, damping: 18 }}
      whileHover={{ scale: 1.08, rotateZ: 3 }}
      className="relative select-none cursor-default"
      style={{ perspective: 800 }}
    >
      <div
        className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-white flex flex-col items-center justify-center font-black shadow-2xl"
        style={{
          border: `3px solid ${rank.color}`,
          boxShadow: `0 0 30px ${rank.glow}88, 0 8px 24px rgba(0,0,0,0.5)`,
          color: col,
        }}
      >
        {/* Top-left */}
        <div className="absolute top-1.5 left-2 flex flex-col items-center leading-none">
          <span className="text-xs font-black" style={{ color: col }}>{rank.cardRank}</span>
          <span className="text-[10px]" style={{ color: col }}>{rank.cardSuit}</span>
        </div>
        {/* Center */}
        <span className="text-4xl sm:text-5xl leading-none" style={{ color: col }}>{rank.cardSuit}</span>
        {/* Bottom-right rotated */}
        <div className="absolute bottom-1.5 right-2 flex flex-col items-center leading-none rotate-180">
          <span className="text-xs font-black" style={{ color: col }}>{rank.cardRank}</span>
          <span className="text-[10px]" style={{ color: col }}>{rank.cardSuit}</span>
        </div>
        {/* Glow overlay */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: `radial-gradient(circle at 50% 40%, ${rank.color}, transparent 70%)` }}
        />
      </div>
    </motion.div>
  );
}

// ── Rank banner ───────────────────────────────────────────────────
function RankBanner({ user, onRankInfo }) {
  const rank = getRank(user);
  const gamesPlayed = user?.gamesPlayed ?? 0;
  const nextRank = RANK_NEXT.find(r => rank.score < r.threshold);
  const prevThreshold = nextRank
    ? (RANK_NEXT[RANK_NEXT.indexOf(nextRank) - 1]?.threshold ?? 0)
    : null;
  const progress = nextRank && prevThreshold !== null
    ? Math.min(100, Math.round(((rank.score - prevThreshold) / (nextRank.threshold - prevThreshold)) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="max-w-5xl mx-auto w-full px-6 mb-6"
    >
      <div
        className="rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${rank.glow}22 0%, rgba(5,15,10,0.95) 60%)`,
          border: `1px solid ${rank.color}66`,
          boxShadow: `0 0 40px ${rank.glow}33, inset 0 1px 0 ${rank.color}22`,
        }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 0% 50%, ${rank.glow}28 0%, transparent 55%)` }} />

        {/* Card */}
        <RankCard rank={rank} />

        {/* Info */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="text-[10px] text-gray-500 tracking-widest uppercase font-semibold mb-0.5">Twoja ranga</div>

          <motion.div
            key={rank.label}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-black tracking-widest mb-1 drop-shadow-lg"
            style={{ color: rank.color, textShadow: `0 0 20px ${rank.glow}88` }}
          >
            {rank.label}
          </motion.div>

          {/* Score */}
          <div className="flex items-center gap-2 mb-3">
            <motion.span key={rank.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }}
              className="text-yellow-400 font-black text-xl">{rank.score}</motion.span>
            <span className="text-gray-400 text-xs">pkt rankingowych</span>
            <button onClick={onRankInfo}
              className="ml-auto text-[10px] text-gray-500 hover:text-emerald-400 transition-colors border border-gray-700/50 hover:border-emerald-700/50 rounded-lg px-2 py-1">
              ℹ️ System rang
            </button>
          </div>

          {/* Progress to next rank */}
          {nextRank ? (
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Postęp do <span className="font-black" style={{ color: rank.color }}>{nextRank.label}</span></span>
                <span className="font-bold" style={{ color: rank.color }}>{progress}%</span>
              </div>
              <div className="h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-2.5 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${rank.color}88, ${rank.color})`, boxShadow: `0 0 8px ${rank.glow}` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                Brakuje <span className="text-gray-300 font-bold">{nextRank.threshold - rank.score} pkt</span>
              </div>
            </div>
          ) : (
            <div className="text-sm font-black tracking-widest" style={{ color: rank.color }}>
              ✦ NAJWYŻSZA RANGA OSIĄGNIĘTA ✦
            </div>
          )}
        </div>

        {/* Games played badge */}
        {gamesPlayed > 0 && (
          <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 bg-gray-900/50 border border-gray-700/40 rounded-xl px-4 py-3">
            <span className="text-2xl font-black text-white">{gamesPlayed}</span>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest">sesji</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const CATEGORIES = [
  { id: 'all', label: '🎲 Wszystkie' },
  { id: 'cards', label: '🃏 Blackjack' },
  { id: 'poker', label: '♠️ Poker' },
  { id: 'roulette', label: '🎡 Ruletka' },
  { id: 'slots', label: '🎰 Sloty' },
];

const games = [
  {
    id: 'blackjack',
    category: 'cards',
    name: 'Blackjack',
    description: 'Klasyczna gra karciana. Zbierz 21 i pokonaj krupiera!',
    icon: '🃏',
    badge: 'DOSTĘPNE',
    badgeColor: 'bg-emerald-500',
    available: true,
    tutorial: true,
  },
  {
    id: 'duel',
    category: 'cards',
    name: 'Duel vs Bot',
    description: 'Blackjack 1v1 z botem! Pierwszy do $1000 wygrywa duel.',
    icon: '⚔️',
    badge: 'DOSTĘPNE',
    badgeColor: 'bg-orange-500',
    available: true,
    tag: 'Blackjack',
    tutorial: true,
  },
  {
    id: 'online',
    category: 'cards',
    name: 'Online Duel',
    description: 'Blackjack 1v1 z prawdziwym graczem w czasie rzeczywistym!',
    icon: '🌐',
    badge: 'ONLINE',
    badgeColor: 'bg-blue-500',
    available: true,
    tag: 'Blackjack',
    tutorial: true,
  },
  {
    id: 'roulette',
    category: 'roulette',
    name: 'Ruletka',
    description: 'Europejska ruletka z żywym krupierem.',
    icon: '🎡',
    badge: 'WKRÓTCE',
    badgeColor: 'bg-gray-600',
    available: false,
  },
  {
    id: 'slots',
    category: 'slots',
    name: 'Sloty',
    description: 'Lucky Goat – trzęsienie bębnów, ogromne wygrane!',
    icon: '🎰',
    badge: 'WKRÓTCE',
    badgeColor: 'bg-gray-600',
    available: false,
  },
  {
    id: 'poker_1v1',
    category: 'poker',
    name: 'Poker 1v1',
    description: 'Texas Hold\'em jeden na jeden z botem AI.',
    icon: '🂡',
    badge: 'NOWE',
    badgeColor: 'bg-purple-600',
    available: true,
    tutorial: true,
  },
  {
    id: 'poker_bots',
    category: 'poker',
    name: 'Poker vs 4 boty',
    description: 'Stół z 4 botami. Texas Hold\'em – pełny turniej!',
    icon: '♠️',
    badge: 'NOWE',
    badgeColor: 'bg-purple-600',
    available: true,
    tutorial: true,
  },
  {
    id: 'poker_online',
    category: 'poker',
    name: 'Poker Online',
    description: 'Stwórz pokój lub dołącz. Do 5 graczy. Texas Hold\'em na żywo!',
    icon: '🌐',
    badge: 'ONLINE',
    badgeColor: 'bg-blue-500',
    available: true,
    tutorial: true,
  },
];

export default function Lobby({ onSelectGame, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('all');
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleGames = activeTab === 'all'
    ? games
    : games.filter(g => g.category === activeTab);

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
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-900/40 border border-emerald-700/40 px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-sm text-emerald-400 font-semibold">Na żywo</span>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-gray-500 leading-none">👤 {user.username}</div>
                  <div className="text-sm font-black text-yellow-400 leading-tight">
                    {user.totalProfit >= 0 ? '+' : ''}{user.totalProfit}$ netto
                  </div>
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
          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-xl border border-gray-700 bg-gray-900/60 hover:border-emerald-700 transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
          >
            <motion.span animate={menuOpen ? { rotate: 45, y: 7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="block w-5 h-0.5 bg-gray-300 rounded-full origin-center" />
            <motion.span animate={menuOpen ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.15 }} className="block w-5 h-0.5 bg-gray-300 rounded-full" />
            <motion.span animate={menuOpen ? { rotate: -45, y: -7 } : { rotate: 0, y: 0 }} transition={{ duration: 0.2 }} className="block w-5 h-0.5 bg-gray-300 rounded-full origin-center" />
          </button>
        </div>
        {/* Mobile dropdown menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              className="sm:hidden overflow-hidden border-t border-emerald-900/40 bg-black/60 backdrop-blur-sm"
            >
              <div className="px-6 py-4 flex flex-col gap-3">
                {user && (
                  <>
                    <div className="flex items-center gap-3 bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3">
                      <span className="text-2xl">👤</span>
                      <div>
                        <div className="text-sm font-bold text-white">{user.username}</div>
                        <div className="text-sm font-black text-yellow-400">{user.totalProfit >= 0 ? '+' : ''}{user.totalProfit}$ netto</div>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5 bg-emerald-900/40 border border-emerald-700/40 px-3 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs text-emerald-400 font-semibold">Na żywo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); onSelectGame('stats'); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/40 hover:border-emerald-700 hover:bg-emerald-950/60 text-sm font-semibold text-gray-300 hover:text-emerald-300 transition-all"
                    >
                      <span className="text-lg">📊</span> Statystyki konta
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/40 hover:border-red-700/60 hover:bg-red-950/40 text-sm font-semibold text-gray-400 hover:text-red-400 transition-all"
                    >
                      <span className="text-lg">🚪</span> Wyloguj się
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

      {/* Rank banner */}
      {user && <RankBanner user={user} onRankInfo={() => onSelectGame('rankinfo')} />}

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
        {/* Category Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 border ${
                activeTab === cat.id
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-emerald-700 hover:text-emerald-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8"
          >
            {visibleGames.map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className={`group relative flex flex-col items-center text-center rounded-2xl border p-6 transition-colors duration-200 ${
                  game.available
                    ? 'border-emerald-700/50 bg-emerald-950/60'
                    : 'border-gray-800 bg-gray-900/40 opacity-60'
                }`}
              >
                <span className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${game.badgeColor} text-white`}>
                  {game.badge}
                </span>
                <div className="text-5xl mb-4">{game.icon}</div>
                <h4 className="text-lg font-bold mb-1">{game.name}</h4>
                <p className="text-gray-400 text-sm leading-snug mb-4">{game.description}</p>
                {game.available && (
                  <div className="flex gap-2 mt-auto">
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onSelectGame(game.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold transition-colors"
                    >
                      ZAGRAJ
                    </motion.button>
                    {game.tutorial && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelectGame(`${game.id}_tutorial`)}
                        className="px-4 py-2 rounded-xl bg-yellow-700/60 hover:bg-yellow-600/70 border border-yellow-600/50 text-sm font-bold text-yellow-300 transition-colors"
                      >
                        📖 Samouczek
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

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
