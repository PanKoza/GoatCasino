// ── Texas Hold'em poker utilities ────────────────────────────────

export const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
export const SUITS = ['♠','♥','♦','♣'];
const SUIT_COLOR = { '♠':'#e2e8f0','♥':'#f87171','♦':'#f87171','♣':'#e2e8f0' };

export function suitColor(suit) { return SUIT_COLOR[suit] || '#e2e8f0'; }

export function createPokerDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function rankVal(rank) { return RANKS.indexOf(rank); }

// ── Hand evaluation ───────────────────────────────────────────────

function choose5(cards) {
  const r = [];
  const n = cards.length;
  for (let a = 0; a < n-4; a++)
  for (let b = a+1; b < n-3; b++)
  for (let c = b+1; c < n-2; c++)
  for (let d = c+1; d < n-1; d++)
  for (let e = d+1; e < n;   e++)
    r.push([cards[a],cards[b],cards[c],cards[d],cards[e]]);
  return r;
}

function checkStraight(vals) {
  const u = [...new Set(vals)].sort((a,b) => b-a);
  for (let i = 0; i <= u.length-5; i++) {
    if (u[i]-u[i+4] === 4) return { is:true, high: u[i] };
  }
  // Wheel A-2-3-4-5
  if (u.includes(12)&&u.includes(0)&&u.includes(1)&&u.includes(2)&&u.includes(3))
    return { is:true, high:3 };
  return { is:false };
}

function eval5(cards) {
  const s = [...cards].sort((a,b) => rankVal(b.rank)-rankVal(a.rank));
  const vals = s.map(c => rankVal(c.rank));
  const suits = s.map(c => c.suit);
  const flush = suits.every(x => x===suits[0]);
  const str   = checkStraight(vals);
  const cnt = {};
  for (const v of vals) cnt[v] = (cnt[v]||0)+1;
  const g = Object.entries(cnt).sort((a,b) => b[1]-a[1] || b[0]-a[0]).map(([k,v])=>({v:+k,c:v}));
  if (flush && str.is) return { rank:8, name: str.high===12?'Royal Flush':'Straight Flush', tb:[str.high] };
  if (g[0].c===4) return { rank:7, name:'Four of a Kind',    tb:[g[0].v, g[1].v] };
  if (g[0].c===3&&g[1]?.c===2) return { rank:6, name:'Full House',   tb:[g[0].v, g[1].v] };
  if (flush)      return { rank:5, name:'Flush',             tb:vals };
  if (str.is)     return { rank:4, name:'Straight',          tb:[str.high] };
  if (g[0].c===3) return { rank:3, name:'Three of a Kind',   tb:[g[0].v, g[1].v, g[2]?.v] };
  if (g[0].c===2&&g[1]?.c===2) return { rank:2, name:'Two Pair',     tb:[Math.max(g[0].v,g[1].v),Math.min(g[0].v,g[1].v),g[2]?.v] };
  if (g[0].c===2) return { rank:1, name:'Pair',              tb:[g[0].v, g[1].v, g[2]?.v, g[3]?.v] };
  return           { rank:0, name:'High Card',               tb:vals };
}

function cmpEval(a, b) {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < Math.max(a.tb.length, b.tb.length); i++) {
    const d = (a.tb[i]??-1) - (b.tb[i]??-1);
    if (d !== 0) return d;
  }
  return 0;
}

export function evaluateHand(cards) {
  if (cards.length < 5) return null;
  const combos = cards.length === 5 ? [cards] : choose5(cards);
  return combos.reduce((best, c) => {
    const e = eval5(c);
    return !best || cmpEval(e, best) > 0 ? e : best;
  }, null);
}

export function determineWinners(players, community) {
  const active = players.filter(p => !p.folded);
  if (active.length === 1) return [active[0].id];
  const evs = active.map(p => ({ id: p.id, ev: evaluateHand([...p.hand, ...community]) }));
  const best = evs.reduce((b,e) => cmpEval(e.ev, b.ev) > 0 ? e : b, evs[0]);
  return evs.filter(e => cmpEval(e.ev, best.ev) === 0).map(e => e.id);
}

// ── Pre-flop hand strength (Chen formula approximation) ──────────
export function preFlopStrength(hand) {
  if (hand.length < 2) return 0;
  const [a, b] = hand.map(c => rankVal(c.rank));
  const suited = hand[0].suit === hand[1].suit;
  const hi = Math.max(a,b), lo = Math.min(a,b);
  const isPair = a === b;
  let score = 0;
  if (isPair) score = Math.max(5, hi * 2);
  else {
    if (hi === 12) score = 10;
    else score = hi / 2 + 1;
    const gap = hi - lo - 1;
    if (gap === 0) score += 1;
    else if (gap === 1) score -= 1;
    else if (gap === 2) score -= 2;
    else score -= 4;
    if (suited) score += 2;
  }
  return Math.max(0, Math.min(20, score)) / 20; // 0..1
}

// ── Bot decision ──────────────────────────────────────────────────
export function botDecide({ hand, community, toCall, pot, chips, phase, raiseCount }) {
  let strength;
  if (community.length === 0) {
    strength = preFlopStrength(hand);
  } else {
    const ev = evaluateHand([...hand, ...community]);
    strength = ev ? (ev.rank / 8) * 0.8 + preFlopStrength(hand) * 0.2 : preFlopStrength(hand);
  }

  const potOdds = toCall > 0 ? toCall / (pot + toCall) : 0;
  const aggression = 0.3 + Math.random() * 0.3; // variability

  if (toCall === 0) {
    // check or bet
    if (strength + aggression > 0.7) {
      const raise = Math.min(chips, Math.max(pot * 0.5, 50));
      return { action: 'raise', amount: Math.floor(raise / 25) * 25 || 25 };
    }
    return { action: 'check' };
  }

  if (strength < potOdds - 0.1) return { action: 'fold' };
  if (strength + aggression > 0.75 && raiseCount < 3) {
    const raise = Math.min(chips, Math.max(toCall * 2, pot * 0.6));
    return { action: 'raise', amount: Math.floor(raise / 25) * 25 || toCall * 2 };
  }
  if (chips <= toCall) return { action: 'call' };
  return { action: 'call' };
}
