const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/me
router.get('/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });
  res.json({
    id: user._id,
    username: user.username,
    gamesPlayed: user.gamesPlayed,
    gamesWon: user.gamesWon,
    totalProfit: user.totalProfit,
    bestSession: user.bestSession,
    rankBonus: user.rankBonus ?? 0,
    bjPlayed: user.bjPlayed ?? 0,
    bjWon: user.bjWon ?? 0,
    bjProfit: user.bjProfit ?? 0,
    pokerPlayed: user.pokerPlayed ?? 0,
    pokerWon: user.pokerWon ?? 0,
    pokerProfit: user.pokerProfit ?? 0,
  });
});

// POST /api/user/game-result — record result after a session ends
router.post('/game-result', authMiddleware, async (req, res) => {
  const { won, profit, peakBalance, gameType = 'blackjack', rankBonus = 0 } = req.body;
  if (typeof won !== 'boolean' || typeof profit !== 'number' || typeof peakBalance !== 'number') {
    return res.status(400).json({ error: 'Nieprawidłowe dane wyniku.' });
  }

  const inc = {
    gamesPlayed: 1,
    gamesWon: won ? 1 : 0,
    totalProfit: profit,
    rankBonus: typeof rankBonus === 'number' ? rankBonus : 0,
  };

  if (gameType === 'poker') {
    inc.pokerPlayed = 1;
    inc.pokerWon = won ? 1 : 0;
    inc.pokerProfit = profit;
  } else {
    // blackjack (default)
    inc.bjPlayed = 1;
    inc.bjWon = won ? 1 : 0;
    inc.bjProfit = profit;
  }

  const update = { $inc: inc };

  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje.' });

  if (peakBalance > user.bestSession) {
    update.$set = { bestSession: peakBalance };
  }

  const updated = await User.findByIdAndUpdate(req.userId, update, {
    new: true,
    select: '-passwordHash',
  });

  res.json({
    id: updated._id,
    username: updated.username,
    gamesPlayed: updated.gamesPlayed,
    gamesWon: updated.gamesWon,
    totalProfit: updated.totalProfit,
    bestSession: updated.bestSession,
    rankBonus: updated.rankBonus ?? 0,
    bjPlayed: updated.bjPlayed ?? 0,
    bjWon: updated.bjWon ?? 0,
    bjProfit: updated.bjProfit ?? 0,
    pokerPlayed: updated.pokerPlayed ?? 0,
    pokerWon: updated.pokerWon ?? 0,
    pokerProfit: updated.pokerProfit ?? 0,
  });
});

// GET /api/leaderboard — top 20 players by rank score
router.get('/leaderboard', async (_req, res) => {
  const users = await User.find({ gamesPlayed: { $gt: 0 } })
    .select('-passwordHash')
    .lean();

  const ranked = users
    .map((u) => {
      const winRate = u.gamesPlayed > 0 ? u.gamesWon / u.gamesPlayed : 0;
      const score = Math.round(winRate * 600 + u.gamesWon * 4 + u.totalProfit * 0.01 + (u.rankBonus ?? 0));
      return { ...u, winRate: Math.round(winRate * 100), score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json(ranked);
});

module.exports = router;

