import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Blackjack from './components/Blackjack';
import DuelGame from './components/DuelGame';
import OnlineDuel from './components/OnlineDuel';
import AuthScreen from './components/AuthScreen';
import { api, hasToken, clearSession } from './api';

export default function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    if (!hasToken()) { setAuthReady(true); return; }
    api.me()
      .then((u) => setUser(u))
      .catch(() => clearSession())
      .finally(() => setAuthReady(true));
  }, []);

  function handleAuth(userData) { setUser(userData); }
  function handleLogout() { clearSession(); setUser(null); setCurrentGame(null); }

  async function handleBackToLobby() {
    setCurrentGame(null);
    try { const u = await api.me(); setUser(u); } catch {}
  }

  if (!authReady) return null;
  if (!user) return <AuthScreen onAuth={handleAuth} />;

  if (currentGame === 'blackjack') return <Blackjack    onBack={handleBackToLobby} username={user.username} />;
  if (currentGame === 'duel')      return <DuelGame     onBack={handleBackToLobby} username={user.username} />;
  if (currentGame === 'online')    return <OnlineDuel   onBack={handleBackToLobby} username={user.username} />;

  return <Lobby user={user} onSelectGame={setCurrentGame} onLogout={handleLogout} />;
}

