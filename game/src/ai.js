// Vex, the rival duelist: a readable opponent. Vex telegraphs one card each
// turn (its suit shown, its power hidden), then plays it when the turn ends.
// The telegraph is the whole mind game: play a card whose suit beats Vex's
// telegraphed suit and you counter it for bonus damage.

import { suitBeats } from './cards.js';
import { pickOne } from './rng.js';

// Choose which card Vex telegraphs for the coming turn: the strongest card
// Vex can afford, with a small preference for a suit that beats the card
// the player played last turn (so Vex feels like it is answering you).
export function chooseTelegraph(hand, ember, playerLastSuit, rand) {
  const affordable = hand.filter((c) => c.cost <= ember);
  if (affordable.length === 0) return null;
  const scored = affordable.map((card) => {
    let score = card.power * 2 - card.cost;
    if (playerLastSuit && suitBeats(card.suit, playerLastSuit)) score += 3;
    if (card.effect === 'heal') score += 1;
    return { card, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0].score;
  const ties = scored.filter((s) => s.score >= best - 1).map((s) => s.card);
  return pickOne(ties, rand);
}

// After the player ends their turn, Vex plays the telegraphed card (if it can
// still afford it). Returns the card played, or null when Vex passes.
export function resolveTelegraph(telegraph, hand, ember) {
  if (!telegraph) return null;
  const idx = hand.findIndex((c) => c.uid === telegraph.uid);
  if (idx === -1) return null;
  if (telegraph.cost > ember) return null;
  hand.splice(idx, 1);
  return telegraph;
}

// Vex's taunts, one per turn, picked by the seeded random function.
export const TAUNTS = [
  'Vex is charging a sigil… read it, and answer it.',
  'The winds favour the bold. Play something.',
  'Vex grins. That telegraph is no bluff.',
  'Four winds, one winner. Make it you.',
  'Vex shuffles, watching your hand.',
];

export function pickTaunt(rand) {
  return pickOne(TAUNTS, rand);
}
