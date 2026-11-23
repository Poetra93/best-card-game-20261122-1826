// Deterministic screenshot states for Sigil Duel. Each ?shot= name builds a
// fixed game state from a fixed seed, so the four screenshots are
// reproducible: title, a mid-game table, the win screen and the loss screen.

import { buildDeck } from './cards.js';
import { mulberry32 } from './rng.js';

export const SHOT_SEEDS = {
  title: 20261122,
  play: 7,
  win: 11,
  loss: 13,
};

// A mid-game state: turn 4, both hands dealt, Vex telegraphing a Flame card,
// the player holding a Gale counter and a Gale chain already played.
// The log lines are built from the very cards on the table, so text and
// picture always agree.
export function buildPlayShot() {
  const rand = mulberry32(SHOT_SEEDS.play);
  const deck = buildDeck(rand);
  const playerHand = distinctCards(deck, 0, 5);
  const rivalHand = distinctCards(deck, 10, 5);
  const used = new Set([...playerHand, ...rivalHand].map((c) => c.uid));
  const unused = deck.filter((c) => !used.has(c.uid));
  // The telegraph is one of Vex's own hand cards, and it is a Flame card,
  // so the log's counter story matches the table.
  let telegraph = rivalHand.find((c) => c.suit === 'flame');
  if (!telegraph) {
    telegraph = unused.find((c) => c.suit === 'flame');
    rivalHand[2] = telegraph;
  }
  const galePair = [];
  const seenGale = new Set();
  for (const c of unused) {
    if (c.suit === 'gale' && !seenGale.has(c.id) && c.uid !== telegraph.uid) {
      seenGale.add(c.id);
      galePair.push(c);
      if (galePair.length === 2) break;
    }
  }
  return {
    phase: 'play',
    turn: 4,
    playerLife: 24,
    rivalLife: 19,
    playerWard: 3,
    rivalWard: 0,
    playerEmber: 2,
    maxEmber: 3,
    playerHand,
    rivalHand,
    telegraph,
    playedThisTurn: galePair,
    chainSuit: 'gale',
    chainCount: 2,
    log: [
      'Turn 4 — Vex is charging a Flame sigil.',
      'You played ' + galePair[0].name + ' (' + galePair[0].power + ') — chain x2!',
      'Counter ready: Gale beats Flame. +3 damage.',
    ],
  };
}

// Pick N cards with distinct definitions (no twin copies in one hand).
function distinctCards(deck, start, n) {
  const seen = new Set();
  const out = [];
  for (let i = start; i < deck.length && out.length < n; i++) {
    if (!seen.has(deck[i].id)) {
      seen.add(deck[i].id);
      out.push(deck[i]);
    }
  }
  return out;
}

// The win screen: Vex at 0, the player's final blow listed.
export function buildWinShot() {
  const rand = mulberry32(SHOT_SEEDS.win);
  const deck = buildDeck(rand);
  return {
    phase: 'won',
    turn: 6,
    playerLife: 17,
    rivalLife: 0,
    playerWard: 0,
    rivalWard: 0,
    playerEmber: 1,
    maxEmber: 3,
    playerHand: distinctCards(deck, 0, 4),
    rivalHand: distinctCards(deck, 12, 4),
    telegraph: null,
    playedThisTurn: distinctCards(deck, 24, 1),
    chainSuit: null,
    chainCount: 0,
    log: [
      'Turn 6 — Volcano Roar (7) + counter bonus (+3).',
      'Vex falls. The four winds are yours.',
    ],
  };
}

// The loss screen: the player at 0 after Vex's final strike.
export function buildLossShot() {
  const rand = mulberry32(SHOT_SEEDS.loss);
  const deck = buildDeck(rand);
  return {
    phase: 'lost',
    turn: 7,
    playerLife: 0,
    rivalLife: 12,
    playerWard: 0,
    rivalWard: 0,
    playerEmber: 0,
    maxEmber: 3,
    playerHand: distinctCards(deck, 0, 3),
    rivalHand: distinctCards(deck, 12, 4),
    telegraph: null,
    playedThisTurn: distinctCards(deck, 24, 1),
    chainSuit: null,
    chainCount: 0,
    log: [
      'Turn 7 — Cyclone Drake (7) breaks your ward.',
      'Your last sigil fades. Vex takes the duel.',
    ],
  };
}

export function buildShot(name) {
  if (name === 'play') return buildPlayShot();
  if (name === 'win') return buildWinShot();
  if (name === 'loss') return buildLossShot();
  return null; // title and anything else: the title screen
}
