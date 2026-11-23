// The cards of Sigil Duel: four suits in a beats-cycle, 24 original cards.
// Suits are told apart by colour AND shape, never by text alone: each suit has
// its own colour pair and its own drawn glyph (flame, swirl, wave, gem).

export const SUITS = {
  flame: {
    key: 'flame',
    name: 'Flame',
    color: '#e5484d',
    dark: '#8f1d22',
    light: '#ffd9a0',
    // A flame glyph, drawn as an SVG path.
    glyph:
      '<path d="M32 6 C38 16 48 22 48 36 a16 16 0 1 1 -32 0 C16 28 22 24 24 18 C26 22 28 24 30 24 C28 16 28 10 32 6 Z"/>',
    beats: 'gale',
  },
  gale: {
    key: 'gale',
    name: 'Gale',
    color: '#2f9e6e',
    dark: '#14532d',
    light: '#b8f0d0',
    // A swirl glyph: three sweeping arcs.
    glyph:
      '<path d="M32 10 a22 22 0 1 1 -20 12 a16 16 0 1 0 16 -6 a10 10 0 1 1 -8 4" fill="none" stroke-width="5" stroke-linecap="round"/>',
    beats: 'tide',
  },
  tide: {
    key: 'tide',
    name: 'Tide',
    color: '#2f7fe0',
    dark: '#123a6e',
    light: '#bcd9ff',
    // A wave glyph: two stacked wave strokes.
    glyph:
      '<path d="M8 28 q8 -12 16 0 t16 0 t16 0" fill="none" stroke-width="6" stroke-linecap="round"/><path d="M8 44 q8 -12 16 0 t16 0 t16 0" fill="none" stroke-width="6" stroke-linecap="round"/>',
    beats: 'stone',
  },
  stone: {
    key: 'stone',
    name: 'Stone',
    color: '#d9930d',
    dark: '#6b4303',
    light: '#ffe9b0',
    // A faceted gem glyph.
    glyph:
      '<path d="M32 8 L52 24 L32 56 L12 24 Z"/><path d="M12 24 L52 24 M32 8 L24 24 L32 56 M32 8 L40 24 L32 56" fill="none" stroke-width="2.5"/>',
    beats: 'flame',
  },
};

export const SUIT_ORDER = ['flame', 'gale', 'tide', 'stone'];

// Does suit A beat suit B in the cycle Flame > Gale > Tide > Stone > Flame?
export function suitBeats(a, b) {
  return SUITS[a].beats === b;
}

// Inline SVG for a suit glyph. `fill` defaults to the suit colour.
export function suitIcon(suitKey, size) {
  const suit = SUITS[suitKey];
  const s = size || 64;
  return (
    '<svg viewBox="0 0 64 64" width="' +
    s +
    '" height="' +
    s +
    '" aria-hidden="true"><g fill="' +
    suit.color +
    '" stroke="' +
    suit.color +
    '">' +
    suit.glyph +
    '</g></svg>'
  );
}

// One card: id, name, suit, cost in ember, power, optional effect.
// Effects: draw (draw N cards), heal (restore N life), ward (block N damage).
// power 0 cards are pure effect cards.
export const CARD_DEFS = [
  // Flame — fast, hot, hits hard.
  { id: 'cinder-imp', name: 'Cinder Imp', suit: 'flame', cost: 1, power: 2 },
  { id: 'ember-lash', name: 'Ember Lash', suit: 'flame', cost: 1, power: 3 },
  { id: 'bonfire-sprite', name: 'Bonfire Sprite', suit: 'flame', cost: 2, power: 4 },
  { id: 'pyre-hound', name: 'Pyre Hound', suit: 'flame', cost: 2, power: 5 },
  { id: 'ash-phoenix', name: 'Ash Phoenix', suit: 'flame', cost: 3, power: 6, effect: 'draw', effectValue: 1 },
  { id: 'volcano-roar', name: 'Volcano Roar', suit: 'flame', cost: 3, power: 7 },
  // Gale — quick, tricksy, draws cards.
  { id: 'zephyr-wisp', name: 'Zephyr Wisp', suit: 'gale', cost: 1, power: 2, effect: 'draw', effectValue: 1 },
  { id: 'storm-kite', name: 'Storm Kite', suit: 'gale', cost: 1, power: 3 },
  { id: 'gale-falcon', name: 'Gale Falcon', suit: 'gale', cost: 2, power: 4 },
  { id: 'whirlwind-fox', name: 'Whirlwind Fox', suit: 'gale', cost: 2, power: 4, effect: 'draw', effectValue: 1 },
  { id: 'tempest-owl', name: 'Tempest Owl', suit: 'gale', cost: 3, power: 6 },
  { id: 'cyclone-drake', name: 'Cyclone Drake', suit: 'gale', cost: 3, power: 7 },
  // Tide — deep, patient, heals.
  { id: 'ripple-eel', name: 'Ripple Eel', suit: 'tide', cost: 1, power: 2, effect: 'heal', effectValue: 2 },
  { id: 'coral-knight', name: 'Coral Knight', suit: 'tide', cost: 1, power: 3 },
  { id: 'tide-serpent', name: 'Tide Serpent', suit: 'tide', cost: 2, power: 4, effect: 'heal', effectValue: 2 },
  { id: 'foam-sprite', name: 'Foam Sprite', suit: 'tide', cost: 2, power: 3, effect: 'heal', effectValue: 4 },
  { id: 'deep-kraken', name: 'Deep Kraken', suit: 'tide', cost: 3, power: 6 },
  { id: 'moonpool-leviathan', name: 'Moonpool Leviathan', suit: 'tide', cost: 3, power: 7, effect: 'heal', effectValue: 2 },
  // Stone — heavy, stubborn, wards.
  { id: 'pebble-golem', name: 'Pebble Golem', suit: 'stone', cost: 1, power: 2, effect: 'ward', effectValue: 3 },
  { id: 'granite-ox', name: 'Granite Ox', suit: 'stone', cost: 1, power: 3 },
  { id: 'quarry-bear', name: 'Quarry Bear', suit: 'stone', cost: 2, power: 4, effect: 'ward', effectValue: 3 },
  { id: 'obsidian-wolf', name: 'Obsidian Wolf', suit: 'stone', cost: 2, power: 5 },
  { id: 'mountain-titan', name: 'Mountain Titan', suit: 'stone', cost: 3, power: 6, effect: 'ward', effectValue: 4 },
  { id: 'crystal-colossus', name: 'Crystal Colossus', suit: 'stone', cost: 3, power: 7 },
];

// A fresh deck: two copies of every card, shuffled by the supplied random fn.
export function buildDeck(rand) {
  const cards = [];
  for (const def of CARD_DEFS) {
    cards.push({ ...def, uid: def.id + '-a' });
    cards.push({ ...def, uid: def.id + '-b' });
  }
  const shuffled = [];
  const pool = cards.slice();
  while (pool.length > 0) {
    const i = Math.floor(rand() * pool.length);
    shuffled.push(pool.splice(i, 1)[0]);
  }
  return shuffled;
}

export function effectText(card) {
  if (!card.effect) return '';
  if (card.effect === 'draw') return 'Draw ' + card.effectValue + ' card' + (card.effectValue > 1 ? 's' : '');
  if (card.effect === 'heal') return 'Heal ' + card.effectValue + ' life';
  if (card.effect === 'ward') return 'Ward ' + card.effectValue;
  return '';
}
