const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { error: 'Zbyt wiele prób. Spróbuj za 15 minut.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane.' });
  }
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return res.status(400).json({ error: 'Nazwa użytkownika: 3-24 znaki, tylko litery, cyfry i _.' });
  }
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return res.status(400).json({ error: 'Hasło musi mieć od 6 do 128 znaków.' });
  }

  const exists = await User.findOne({ username });
  if (exists) {
    return res.status(409).json({ error: 'Nazwa użytkownika jest już zajęta.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ username, passwordHash });
  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: { id: user._id, username: user.username, balance: user.balance },
  });
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Nazwa użytkownika i hasło są wymagane.' });
  }

  const user = await User.findOne({ username });
  // Use constant-time comparison even when user doesn't exist
  const dummyHash = '$2a$12$invalidhashpadding000000000000000000000000000000000000';
  const valid = user
    ? await bcrypt.compare(password, user.passwordHash)
    : await bcrypt.compare(password, dummyHash);

  if (!user || !valid) {
    return res.status(401).json({ error: 'Nieprawidłowa nazwa użytkownika lub hasło.' });
  }

  const token = signToken(user._id);
  res.json({
    token,
    user: { id: user._id, username: user.username, balance: user.balance },
  });
});

module.exports = router;
