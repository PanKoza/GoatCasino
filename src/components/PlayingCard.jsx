import { motion } from 'framer-motion';

// dealDelay: seconds to wait before animating (for staggered dealing)
// fromDeck: if true, card flies in from top-right (deck position); otherwise simple pop-in
export default function PlayingCard({ card, hidden = false, index = 0, dealDelay = 0, fromDeck = false }) {
  const isRed = card.suit === '♥' || card.suit === '♦';

  const deckInitial = { x: 420, y: -220, rotate: 25, opacity: 0, scale: 0.75 };
  const deckAnimate = { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 };
  const deckTransition = { delay: dealDelay, duration: 0.48, type: 'spring', stiffness: 180, damping: 20 };

  const popInitial = { scale: 0.6, opacity: 0, y: -12 };
  const popAnimate = { scale: 1, opacity: 1, y: 0 };
  const popTransition = { delay: dealDelay, duration: 0.3, type: 'spring', stiffness: 300, damping: 22 };

  const initial   = fromDeck ? deckInitial   : popInitial;
  const animateTo = fromDeck ? deckAnimate   : popAnimate;
  const transition = fromDeck ? deckTransition : popTransition;

  if (hidden) {
    return (
      <motion.div
        initial={initial}
        animate={animateTo}
        transition={transition}
        className="w-20 h-28 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 border-2 border-emerald-600 flex items-center justify-center shadow-lg"
      >
        <span className="text-emerald-400 text-3xl">🂠</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={initial}
      animate={animateTo}
      transition={transition}
      className="w-20 h-28 rounded-xl bg-white border-2 border-gray-200 flex flex-col justify-between p-2 shadow-lg select-none"
    >
      <div className={`text-sm font-bold leading-none ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
      <div className={`text-2xl text-center ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        {card.suit}
      </div>
      <div className={`text-sm font-bold leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-gray-900'}`}>
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    </motion.div>
  );
}
