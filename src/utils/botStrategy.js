import { handTotal } from './blackjack';

function cardValue(card) {
  if (['J', 'Q', 'K'].includes(card.rank)) return 10;
  if (card.rank === 'A') return 11;
  return parseInt(card.rank);
}

// Returns 'hit' | 'stand' | 'double'
export function getBotDecision(difficulty, hand, dealerUpcard, bet, balance) {
  switch (difficulty) {
    case 'easy':   return easyDecision(hand);
    case 'medium': return mediumDecision(hand, bet, balance);
    case 'hard':   return hardDecision(hand, dealerUpcard, bet, balance);
    default:       return mediumDecision(hand, bet, balance);
  }
}

// ── Easy: random-ish, hits below 15 ─────────────────────────────
function easyDecision(hand) {
  const total = handTotal(hand);
  if (total >= 17) return 'stand';
  if (total <= 11) return 'hit';
  // 13-16: 50/50
  return Math.random() < 0.5 ? 'hit' : 'stand';
}

// ── Medium: simplified basic strategy ──────────────────────────
function mediumDecision(hand, bet, balance) {
  const total = handTotal(hand);
  const canDouble = hand.length === 2 && balance >= bet;
  if (canDouble && (total === 10 || total === 11)) return 'double';
  if (total < 17) return 'hit';
  return 'stand';
}

// ── Hard: full basic strategy (hard totals + dealer upcard) ─────
function hardDecision(hand, dealerUpcard, bet, balance) {
  const total = handTotal(hand);
  const dv = Math.min(cardValue(dealerUpcard), 10); // cap at 10
  const canDouble = hand.length === 2 && balance >= bet;
  const hasAce = hand.some(c => c.rank === 'A');

  // Soft hands (ace counted as 11)
  if (hasAce && hand.length === 2) {
    const other = hand.find(c => c.rank !== 'A');
    const otherVal = other ? cardValue(other) : 0;
    // Soft 13-18
    if (otherVal === 2 || otherVal === 3) return (dv >= 5 && dv <= 6 && canDouble) ? 'double' : 'hit';
    if (otherVal === 4 || otherVal === 5) return (dv >= 4 && dv <= 6 && canDouble) ? 'double' : 'hit';
    if (otherVal === 6) return (dv >= 3 && dv <= 6 && canDouble) ? 'double' : 'hit';
    if (otherVal === 7) {
      if (dv >= 3 && dv <= 6 && canDouble) return 'double';
      if (dv <= 8) return 'stand';
      return 'hit';
    }
    if (otherVal >= 8) return 'stand';
  }

  // Hard totals
  if (total >= 17) return 'stand';
  if (total <= 8)  return 'hit';
  if (total === 9)  return (dv >= 3 && dv <= 6 && canDouble) ? 'double' : 'hit';
  if (total === 10) return (dv <= 9 && canDouble) ? 'double' : 'hit';
  if (total === 11) return canDouble ? 'double' : 'hit';
  if (total === 12) return (dv >= 4 && dv <= 6) ? 'stand' : 'hit';
  if (total <= 16)  return (dv >= 2 && dv <= 6) ? 'stand' : 'hit';
  return 'stand';
}

// Pre-compute the full sequence of bot moves for instant animation scheduling
export function simulateBotTurn(difficulty, initialHand, dealerUpcard, initialDeck, bet, balance) {
  let hand = [...initialHand];
  let dk   = [...initialDeck];
  let bal  = balance;
  let currentBet = bet;
  const moves = []; // { card, hand, deck, type }
  let safety = 0;

  while (safety++ < 12) {
    const decision = getBotDecision(difficulty, hand, dealerUpcard, currentBet, bal);
    if (decision === 'stand') break;

    const card = { ...dk.pop(), dealDelay: 0 };
    hand = [...hand, card];

    if (decision === 'double') {
      bal -= currentBet;
      currentBet *= 2;
      moves.push({ card, hand: [...hand], deck: [...dk], type: 'double' });
      break; // one card then stand
    }
    moves.push({ card, hand: [...hand], deck: [...dk], type: 'hit' });

    const total = handTotal(hand);
    if (total >= 21) break;
  }

  return { moves, finalHand: hand, finalDeck: dk, finalBet: currentBet };
}
