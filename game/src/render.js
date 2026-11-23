// Rendering for Sigil Duel: builds the card elements, the hands, the table
// and the end screens, and animates them (deal slides, play flips, damage
// floaters, the win flourish). No canvas: cards are DOM, so they stay crisp
// and legible at thumbnail size.

import { SUITS, suitIcon, effectText } from './cards.js';

function el(tag, cls, html) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined && html !== null) node.innerHTML = html;
  return node;
}

// One face-up card element. `playable` marks it clickable, `affordable`
// dims it when the player cannot pay its cost.
export function cardElement(card, opts) {
  const o = opts || {};
  const suit = SUITS[card.suit];
  const node = el('div', 'card suit-' + card.suit);
  if (o.playable) node.classList.add('playable');
  if (o.affordable === false) node.classList.add('unaffordable');
  if (o.selected) node.classList.add('selected');
  if (o.dealt) node.classList.add('dealt');
  node.dataset.uid = card.uid;
  const costPips = Array.from({ length: 3 }, (_, i) =>
    i < card.cost ? '<span class="pip on"></span>' : '<span class="pip"></span>',
  ).join('');
  node.innerHTML =
    '<div class="card-top"><span class="card-cost" title="Ember cost">' +
    costPips +
    '</span><span class="card-power">' +
    card.power +
    '</span></div>' +
    '<div class="card-art">' +
    suitIcon(card.suit, 54) +
    '</div>' +
    '<div class="card-name">' +
    card.name +
    '</div>' +
    '<div class="card-suit">' +
    suit.name +
    '</div>' +
    (card.effect
      ? '<div class="card-effect">' + effectText(card) + '</div>'
      : '<div class="card-effect none">Strike</div>');
  return node;
}

// A face-down card back, used for Vex's hand in live play.
export function cardBackElement() {
  const node = el('div', 'card card-back');
  node.innerHTML =
    '<div class="back-glyph">✦</div><div class="back-word">SIGIL</div>';
  return node;
}

// The telegraphed card: face-down, but its suit glyph shows through, so the
// player can read it and counter it.
export function telegraphElement(card) {
  const node = el('div', 'card telegraph suit-' + card.suit);
  node.innerHTML =
    '<div class="card-art">' +
    suitIcon(card.suit, 56) +
    '</div>' +
    '<div class="card-name">Vex is charging…</div>' +
    '<div class="card-suit">' +
    SUITS[card.suit].name +
    ' sigil — power hidden</div>' +
    '<div class="card-effect">Counter it: play ' +
    counterSuitName(card.suit) +
    '</div>';
  return node;
}

function counterSuitName(suitKey) {
  for (const key of Object.keys(SUITS)) {
    if (SUITS[key].beats === suitKey) return SUITS[key].name;
  }
  return '';
}

// A floating damage / heal number over a life bar.
export function floatNumber(parent, text, kind) {
  const node = el('div', 'float-num ' + kind, text);
  parent.appendChild(node);
  node.addEventListener('animationend', () => node.remove());
}

// Confetti burst for the win screen: pure CSS shapes, no images.
export function confettiBurst(parent, count) {
  const colors = ['#e5484d', '#2f9e6e', '#2f7fe0', '#d9930d', '#ffd9a0'];
  for (let i = 0; i < count; i++) {
    const piece = el('div', 'confetti');
    piece.style.background = colors[i % colors.length];
    piece.style.left = 5 + Math.random() * 90 + '%';
    piece.style.animationDelay = Math.random() * 0.6 + 's';
    piece.style.animationDuration = 1.8 + Math.random() * 1.4 + 's';
    parent.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// Suit legend: the four suits with colour, shape and what they beat.
export function legendElement() {
  const node = el('div', 'legend');
  const rows = Object.values(SUITS).map(
    (s) =>
      '<span class="legend-item"><span class="legend-icon">' +
      suitIcon(s.key, 22) +
      '</span>' +
      s.name +
      ' beats ' +
      SUITS[s.beats].name +
      '</span>',
  );
  node.innerHTML = rows.join('');
  return node;
}
