import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api';

const MEDAL = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ currentUserId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.leaderboard()
      .then(setEntries)
      .catch(() => setError('Nie udało się załadować rankingu.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-900/60 border border-yellow-900/30 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🏆</span>
        <h3 className="text-sm font-black tracking-widest text-yellow-400 uppercase">Ranking graczy</h3>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6">
          {[0,1,2].map(i => (
            <motion.div key={i} animate={{ y:[0,-8,0] }} transition={{ duration:0.6, delay:i*0.15, repeat:Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-500" />
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs text-center py-4">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-gray-500 text-xs text-center py-4">Brak graczy w rankingu. Zagraj pierwszy!</p>
      )}

      {!loading && entries.length > 0 && (
        <div className="space-y-1.5">
          {/* Header */}
          <div className="flex items-center text-[10px] text-gray-500 font-semibold tracking-widest uppercase pb-1 border-b border-gray-800">
            <span className="w-8">#</span>
            <span className="flex-1">Gracz</span>
            <span className="w-14 text-right">Wyg.</span>
            <span className="w-14 text-right">W/R</span>
            <span className="w-16 text-right">Zysk</span>
            <span className="w-14 text-right">Pkt</span>
          </div>

          <AnimatePresence>
            {entries.map((entry, i) => {
              const isMe = entry._id === currentUserId;
              return (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center py-2 px-2 rounded-xl text-sm transition-colors ${
                    isMe
                      ? 'bg-emerald-900/40 border border-emerald-700/40'
                      : i < 3 ? 'bg-yellow-900/10' : 'hover:bg-gray-800/40'
                  }`}
                >
                  <span className="w-8 text-center font-black text-base">
                    {i < 3 ? MEDAL[i] : <span className="text-gray-500 text-xs">{i + 1}</span>}
                  </span>
                  <span className={`flex-1 font-bold truncate ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                    {entry.username}{isMe && <span className="ml-1 text-xs text-emerald-500">(Ty)</span>}
                  </span>
                  <span className="w-14 text-right text-gray-300 text-xs">{entry.gamesWon}</span>
                  <span className="w-14 text-right text-xs font-semibold" style={{
                    color: entry.winRate >= 50 ? '#34d399' : entry.winRate >= 30 ? '#fbbf24' : '#f87171'
                  }}>{entry.winRate}%</span>
                  <span className={`w-16 text-right text-xs font-bold ${entry.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {entry.totalProfit >= 0 ? '+' : ''}{entry.totalProfit}$
                  </span>
                  <span className="w-14 text-right text-yellow-400 font-black text-xs">{entry.score}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>

          <p className="text-[10px] text-gray-600 text-center pt-2">
            Punkty = win_rate × 1000 + zysk × 0.1 + wygrane × 50
          </p>
        </div>
      )}
    </div>
  );
}
