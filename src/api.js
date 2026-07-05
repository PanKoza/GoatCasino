const BASE = import.meta.env.PROD
  ? '/api'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001') + '/api';

function getToken() {
  return localStorage.getItem('gc_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Błąd serwera');
  return data;
}

export const api = {
  register: (username, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),

  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  me: () => request('/user/me'),

  saveGameResult: (won, profit, peakBalance, gameType = 'blackjack', rankBonus = 0) =>
    request('/user/game-result', {
      method: 'POST',
      body: JSON.stringify({ won, profit, peakBalance, gameType, rankBonus }),
    }),

  leaderboard: () => request('/user/leaderboard'),
};

export function saveSession(token) {
  localStorage.setItem('gc_token', token);
}

export function clearSession() {
  localStorage.removeItem('gc_token');
}

export function hasToken() {
  return !!getToken();
}

