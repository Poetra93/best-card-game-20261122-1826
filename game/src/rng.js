// Seeded random numbers for Sigil Duel: one tiny generator, used everywhere a
// shuffle or a die roll is needed, so a ?shot= screenshot is reproducible.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by a supplied random function.
export function shuffle(deck, rand) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Pick one element of an array with a supplied random function.
export function pickOne(list, rand) {
  return list[Math.floor(rand() * list.length)];
}
