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
  });
});

// POST /api/user/game-result — record result after a session ends
router.post('/game-result', authMiddleware, async (req, res) => {
  const { won, profit, peakBalance } = req.body;
  if (typeof won !== 'boolean' || typeof profit !== 'number' || typeof peakBalance !== 'number') {
    return res.status(400).json({ error: 'Nieprawidłowe dane wyniku.' });
  }

  const update = {
    $inc: {
      gamesPlayed: 1,
      gamesWon: won ? 1 : 0,
      totalProfit: profit,
    },
  };

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
      const score = Math.round(winRate * 1000 + u.totalProfit * 0.1 + u.gamesWon * 50);
      return { ...u, winRate: Math.round(winRate * 100), score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  res.json(ranked);
});

module.exports = router;

