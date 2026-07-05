import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, saveSession } from '../api';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Nazwa użytkownika może zawierać tylko litery, cyfry i _.');
        return;
      }
      if (username.length < 3) {
        setError('Nazwa użytkownika musi mieć co najmniej 3 znaki.');
        return;
      }
      if (password !== confirm) {
        setError('Hasła nie są identyczne.');
        return;
      }
      if (password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.');
        return;
      }
    }

    setLoading(true);
    try {
      const data =
        mode === 'login'
          ? await api.login(username, password)
          : await api.register(username, password);
      saveSession(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'radial-gradient(ellipse at 50% 40%, #0d2818 0%, #060d0a 100%)' }}
    >
      {/* Logo */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center mb-8"
      >
        <span className="text-6xl mb-2">🐐</span>
        <h1 className="text-3xl font-black tracking-widest text-emerald-400">
          GOAT<span className="text-white">CASINO</span>
        </h1>
        <p className="text-gray-500 text-xs tracking-widest mt-1">PLAY SMART. WIN BIG.</p>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="w-full max-w-sm bg-gray-900 border border-emerald-900/50 rounded-3xl p-7 shadow-2xl"
      >
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-6">
          {['login', 'register'].map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-black tracking-wider transition-colors ${
                mode === m
                  ? 'bg-emerald-700 text-white'
                  : 'bg-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {m === 'login' ? 'LOGOWANIE' : 'REJESTRACJA'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold tracking-widest mb-1.5">
              NAZWA UŻYTKOWNIKA
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={24}
              required
              autoComplete="username"
              placeholder="np. GoatPlayer99"
              className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder-gray-600"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold tracking-widest mb-1.5">
              HASŁO
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              placeholder="••••••••"
              className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder-gray-600"
            />
          </div>

          {/* Confirm password (register only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <label className="block text-xs text-gray-400 font-semibold tracking-widest mb-1.5">
                  POTWIERDŹ HASŁO
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required={!isLogin}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder-gray-600"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-900/40 border border-red-700/50 text-red-300 text-xs font-semibold rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bonus info */}
          {!isLogin && (
            <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl px-4 py-3 text-xs text-emerald-400 font-semibold flex items-center gap-2">
              🎁 Nowe konto startuje z <strong className="text-yellow-400">$1,000</strong> bonusem!
            </div>
          )}

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-base tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#065f46', boxShadow: '0 4px 24px rgba(16,185,129,0.35)' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                Ładowanie...
              </span>
            ) : isLogin ? 'ZALOGUJ SIĘ' : 'UTWÓRZ KONTO'}
          </motion.button>
        </form>
      </motion.div>

      <p className="mt-6 text-xs text-gray-600">
        GoatCasino &copy; 2026 · Tylko dla dorosłych · Graj odpowiedzialnie.
      </p>
    </div>
  );
}
