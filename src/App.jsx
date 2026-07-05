import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Blackjack from './components/Blackjack';
import DuelGame from './components/DuelGame';
import OnlineDuel from './components/OnlineDuel';
import AuthScreen from './components/AuthScreen';
import Stats from './components/Stats';
import BlackjackTutorial from './components/BlackjackTutorial';
import PokerGame from './components/PokerGame';
import PokerOnline from './components/PokerOnline';
import PokerTutorial from './components/PokerTutorial';
import RankInfo from './components/RankInfo';
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
  if (currentGame === 'blackjack_tutorial') return <BlackjackTutorial onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('blackjack')} />;
  if (currentGame === 'duel_tutorial')      return <BlackjackTutorial onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('duel')} />;
  if (currentGame === 'online_tutorial')    return <BlackjackTutorial onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('online')} />;
  if (currentGame === 'duel')      return <DuelGame     onBack={handleBackToLobby} username={user.username} />;
  if (currentGame === 'online')    return <OnlineDuel   onBack={handleBackToLobby} username={user.username} />;
  if (currentGame === 'poker_1v1')    return <PokerGame mode="1v1"    onBack={handleBackToLobby} />;
  if (currentGame === 'poker_bots')   return <PokerGame mode="bots"   onBack={handleBackToLobby} />;
  if (currentGame === 'poker_online') return <PokerOnline              onBack={handleBackToLobby} username={user.username} />;
  if (currentGame === 'poker_1v1_tutorial')    return <PokerTutorial mode="1v1"    onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('poker_1v1')} />;
  if (currentGame === 'poker_bots_tutorial')   return <PokerTutorial mode="bots"   onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('poker_bots')} />;
  if (currentGame === 'poker_online_tutorial') return <PokerTutorial mode="online" onBack={() => setCurrentGame(null)} onPlay={() => setCurrentGame('poker_online')} />;
  if (currentGame === 'stats')     return <Stats        user={user} onBack={() => setCurrentGame(null)} />;
  if (currentGame === 'rankinfo')  return <RankInfo     user={user} onBack={() => setCurrentGame(null)} />;

  return <Lobby user={user} onSelectGame={setCurrentGame} onLogout={handleLogout} />;
}

