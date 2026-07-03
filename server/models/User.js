const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24,
      match: /^[a-zA-Z0-9_]+$/,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    // Stats
    gamesPlayed: { type: Number, default: 0 },
    gamesWon:    { type: Number, default: 0 },
    totalProfit: { type: Number, default: 0 }, // net $ won across all sessions
    bestSession: { type: Number, default: 0 }, // highest balance reached in a single session
  },
  { timestamps: true }
);

// Computed rank score: win-rate weighted by volume + profit
userSchema.virtual('rankScore').get(function () {
  if (this.gamesPlayed === 0) return 0;
  const winRate = this.gamesWon / this.gamesPlayed;
  return Math.round(winRate * 1000 + this.totalProfit * 0.1 + this.gamesWon * 50);
});

module.exports = mongoose.model('User', userSchema);

