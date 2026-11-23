// Sigil Duel: the game itself. State machine, turn flow and input.
// Title -> play -> won / lost. Keyboard and mouse both work.
//   1-5 play a card from your hand · E end turn · Enter start / play again · M mute

import { CARD_DEFS, SUITS, buildDeck, suitBeats, effectText } from './cards.js';
import { mulberry32 } from './rng.js';
import { chooseTelegraph, resolveTelegraph, pickTaunt } from './ai.js';
import { sfx, setMuted, isMuted } from './audio.js';
import {
  cardElement,
  cardBackElement,
  telegraphElement,
  floatNumber,
  confettiBurst,
  legendElement,
} from './render.js';
import { buildShot } from './shots.js';

const START_LIFE = 30;
const MAX_HAND = 7;
const EMBER_PER_TURN = 3;

const $ = (sel) => document.querySelector(sel);

let state = null;
let shotMode = false;

function freshState(seed) {
  const rand = mulberry32(seed);
  return {
    phase: 'title',
    turn: 1,
    playerLife: START_LIFE,
    rivalLife: START_LIFE,
    playerWard: 0,
    rivalWard: 0,
    playerEmber: EMBER_PER_TURN,
    maxEmber: EMBER_PER_TURN,
    playerDeck: buildDeck(rand),
    rivalDeck: buildDeck(rand),
    playerHand: [],
    rivalHand: [],
    telegraph: null,
    playedThisTurn: [],
    chainSuit: null,
    chainCount: 0,
    playerLastSuit: null,
    log: [],
    rand,
    seed,
    taunt: pickTaunt(rand),
  };
}

function drawCards(hand, deck, n) {
  for (let i = 0; i < n && deck.length > 0 && hand.length < MAX_HAND; i++) {
    hand.push(deck.shift());
  }
}

function logLine(text) {
  state.log.unshift(text);
  if (state.log.length > 5) state.log.length = 5;
}

export function startGame(seed) {
  state = freshState(seed === undefined ? (Date.now() % 2147483647) : seed);
  state.phase = 'play';
  drawCards(state.playerHand, state.playerDeck, 5);
  drawCards(state.rivalHand, state.rivalDeck, 5);
  state.telegraph = chooseTelegraph(state.rivalHand, EMBER_PER_TURN, null, state.rand);
  logLine('The duel begins. Vex is charging a ' + SUITS[state.telegraph.suit].name + ' sigil.');
  sfx.turn();
  renderAll(true);
}

// --- Playing a card -------------------------------------------------------

function chainBonus(card) {
  if (state.chainSuit === card.suit) return state.chainCount * 2;
  return 0;
}

function counterBonus(card) {
  if (state.telegraph && suitBeats(card.suit, state.telegraph.suit)) return 3;
  return 0;
}

export function playCard(uid) {
  if (!state || state.phase !== 'play') return;
  const idx = state.playerHand.findIndex((c) => c.uid === uid);
  if (idx === -1) return;
  const card = state.playerHand[idx];
  if (card.cost > state.playerEmber) {
    sfx.error();
    logLine('Not enough ember for ' + card.name + ' (' + card.cost + ' needed).');
    renderAll(false);
    return;
  }
  state.playerHand.splice(idx, 1);
  state.playerEmber -= card.cost;
  const chain = chainBonus(card);
  const counter = counterBonus(card);
  if (state.chainSuit === card.suit) state.chainCount += 1;
  else {
    state.chainSuit = card.suit;
    state.chainCount = 1;
  }
  state.playerLastSuit = card.suit;
  state.playedThisTurn.push(card);

  let damage = card.power + chain + counter;
  if (state.rivalWard > 0) {
    const blocked = Math.min(state.rivalWard, damage);
    state.rivalWard -= blocked;
    damage -= blocked;
    if (blocked > 0) logLine('Vex’s ward blocks ' + blocked + '.');
  }
  state.rivalLife = Math.max(0, state.rivalLife - damage);

  let note = 'You played ' + card.name + ' (' + card.power + ')';
  if (chain > 0) note += ' — chain +' + chain;
  if (counter > 0) note += ' — COUNTER +' + counter;
  note += '.';
  logLine(note);

  if (card.effect === 'draw') {
    drawCards(state.playerHand, state.playerDeck, card.effectValue);
    logLine('Drew ' + card.effectValue + ' card' + (card.effectValue > 1 ? 's' : '') + '.');
    sfx.draw();
  } else if (card.effect === 'heal') {
    state.playerLife = Math.min(START_LIFE, state.playerLife + card.effectValue);
    logLine('Healed ' + card.effectValue + ' life.');
    sfx.heal();
  } else if (card.effect === 'ward') {
    state.playerWard += card.effectValue;
    logLine('Ward +' + card.effectValue + '.');
    sfx.ward();
  }
  if (chain > 0) sfx.chain();
  else if (counter > 0) sfx.counter();
  else sfx.playCard();
  if (damage > 0) sfx.hit();

  renderAll(false);
  if (state.rivalLife <= 0) endGame(true);
}

export function endTurn() {
  if (!state || state.phase !== 'play') return;
  const played = resolveTelegraph(state.telegraph, state.rivalHand, EMBER_PER_TURN);
  if (played) {
    let damage = played.power;
    if (state.playerWard > 0) {
      const blocked = Math.min(state.playerWard, damage);
      state.playerWard -= blocked;
      damage -= blocked;
      if (blocked > 0) logLine('Your ward blocks ' + blocked + '.');
    }
    state.playerLife = Math.max(0, state.playerLife - damage);
    logLine('Vex plays ' + played.name + ' (' + played.power + ') — you take ' + damage + '.');
    if (played.effect === 'heal') {
      state.rivalLife = Math.min(START_LIFE, state.rivalLife + played.effectValue);
      logLine('Vex heals ' + played.effectValue + '.');
    } else if (played.effect === 'ward') {
      state.rivalWard += played.effectValue;
      logLine('Vex wards ' + played.effectValue + '.');
    } else if (played.effect === 'draw') {
      drawCards(state.rivalHand, state.rivalDeck, played.effectValue);
    }
    if (damage > 0) sfx.hit();
  } else {
    logLine('Vex passes — no sigil to play.');
  }
  if (state.playerLife <= 0) {
    renderAll(false);
    endGame(false);
    return;
  }
  state.turn += 1;
  state.playerEmber = EMBER_PER_TURN;
  state.playedThisTurn = [];
  state.chainSuit = null;
  state.chainCount = 0;
  state.taunt = pickTaunt(state.rand);
  drawCards(state.playerHand, state.playerDeck, 1);
  drawCards(state.rivalHand, state.rivalDeck, 1);
  state.telegraph = chooseTelegraph(state.rivalHand, EMBER_PER_TURN, state.playerLastSuit, state.rand);
  if (state.telegraph) {
    logLine('Turn ' + state.turn + ' — Vex is charging a ' + SUITS[state.telegraph.suit].name + ' sigil.');
  }
  sfx.turn();
  renderAll(false);
}

function endGame(won) {
  state.phase = won ? 'won' : 'lost';
  if (won) sfx.win();
  else sfx.lose();
  renderAll(false);
}

// --- Rendering ------------------------------------------------------------

function lifeBar(life, ward) {
  const pct = Math.max(0, Math.min(100, (life / START_LIFE) * 100));
  return (
    '<div class="life-track"><div class="life-fill" style="width:' +
    pct +
    '%"></div></div>' +
    '<div class="life-num">' +
    life +
    ' <span class="life-max">/ ' +
    START_LIFE +
    '</span>' +
    (ward > 0 ? ' <span class="ward">🛡 ' + ward + '</span>' : '') +
    '</div>'
  );
}

function renderAll(dealt) {
  const app = $('#app');
  app.classList.toggle('phase-play', state.phase === 'play');
  app.classList.toggle('phase-won', state.phase === 'won');
  app.classList.toggle('phase-lost', state.phase === 'lost');

  $('#turn-label').textContent = 'Turn ' + state.turn;
  $('#player-life').innerHTML = lifeBar(state.playerLife, state.playerWard);
  $('#rival-life').innerHTML = lifeBar(state.rivalLife, state.rivalWard);
  $('#ember-label').textContent = 'Ember ' + state.playerEmber + ' / ' + state.maxEmber;
  $('#ember-pips').innerHTML = Array.from({ length: state.maxEmber }, (_, i) =>
    i < state.playerEmber ? '<span class="pip on"></span>' : '<span class="pip"></span>',
  ).join('');
  $('#taunt').textContent = state.taunt || '';

  // Rival hand: face-down backs in live play, face-up in the play screenshot.
  const rivalZone = $('#rival-hand');
  rivalZone.innerHTML = '';
  const revealRival = shotMode && state.phase === 'play';
  state.rivalHand.forEach((card, i) => {
    const node = revealRival ? cardElement(card, {}) : cardBackElement();
    if (dealt) {
      node.style.animationDelay = i * 0.06 + 's';
      node.classList.add('dealt');
    }
    rivalZone.appendChild(node);
  });
  $('#rival-count').textContent = state.rivalHand.length + ' cards';

  // Telegraph slot.
  const tele = $('#telegraph-slot');
  tele.innerHTML = '';
  if (state.telegraph && state.phase === 'play') {
    tele.appendChild(telegraphElement(state.telegraph));
  } else {
    const empty = document.createElement('div');
    empty.className = 'tele-empty';
    empty.textContent = state.phase === 'play' ? 'Vex is thinking…' : '—';
    tele.appendChild(empty);
  }

  // Cards played this turn, on the table.
  const field = $('#field-cards');
  field.innerHTML = '';
  state.playedThisTurn.forEach((card) => {
    field.appendChild(cardElement(card, {}));
  });
  if (state.playedThisTurn.length === 0 && state.phase === 'play') {
    const hint = document.createElement('div');
    hint.className = 'field-hint';
    hint.textContent = 'Your played cards land here. Chain one suit for +2, +4… · Counter Vex’s telegraphed suit for +3.';
    field.appendChild(hint);
  }

  // Player hand.
  const hand = $('#player-hand');
  hand.innerHTML = '';
  state.playerHand.forEach((card, i) => {
    const node = cardElement(card, {
      playable: state.phase === 'play',
      affordable: card.cost <= state.playerEmber,
      dealt,
    });
    if (dealt) node.style.animationDelay = 0.1 + i * 0.06 + 's';
    node.addEventListener('click', () => playCard(card.uid));
    node.title = card.name + ' — ' + SUITS[card.suit].name + ' · ' + card.power + ' power, ' + card.cost + ' ember' + (card.effect ? ' · ' + effectText(card) : '');
    hand.appendChild(node);
  });

  // Log.
  const log = $('#log');
  log.innerHTML = '';
  state.log.forEach((line) => {
    const li = document.createElement('li');
    li.textContent = line;
    log.appendChild(li);
  });

  // Chain indicator.
  const chain = $('#chain-label');
  if (state.chainCount > 1 && state.chainSuit) {
    chain.textContent = 'Chain: ' + SUITS[state.chainSuit].name + ' x' + state.chainCount + ' (+' + (state.chainCount - 1) * 2 + ' next)';
  } else {
    chain.textContent = '';
  }

  renderOverlays();
}

function renderOverlays() {
  const title = $('#title-overlay');
  const end = $('#end-overlay');
  if (state.phase === 'title') {
    title.classList.remove('hidden');
    end.classList.add('hidden');
    return;
  }
  title.classList.add('hidden');
  if (state.phase === 'won' || state.phase === 'lost') {
    const won = state.phase === 'won';
    $('#end-title').textContent = won ? 'YOU WIN' : 'VEX WINS';
    $('#end-title').className = won ? 'end-title win' : 'end-title lose';
    $('#end-sub').textContent = won
      ? 'The four winds bow to you. Vex’s sigils scatter like leaves.'
      : 'Your last sigil fades. Vex takes the duel — rematch and read the telegraphs.';
    $('#end-stats').textContent =
      'Duel lasted ' + state.turn + ' turns · You finished with ' + state.playerLife + ' life · Vex with ' + state.rivalLife + '.';
    end.classList.remove('hidden');
    if (won && !shotMode) confettiBurst($('#confetti-layer'), 40);
    else if (won) confettiBurst($('#confetti-layer'), 24);
  } else {
    end.classList.add('hidden');
  }
}

// --- Input ----------------------------------------------------------------

function bindInput() {
  $('#start-btn').addEventListener('click', () => startGame());
  $('#again-btn').addEventListener('click', () => startGame());
  $('#end-turn-btn').addEventListener('click', () => endTurn());
  $('#mute-btn').addEventListener('click', () => {
    setMuted(!isMuted());
    $('#mute-btn').textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on';
  });
  document.addEventListener('keydown', (e) => {
    if (!state) return;
    if (e.key === 'Enter' && state.phase !== 'play') {
      startGame();
      return;
    }
    if (state.phase !== 'play') return;
    if (e.key >= '1' && e.key <= '7') {
      const idx = Number(e.key) - 1;
      const card = state.playerHand[idx];
      if (card) playCard(card.uid);
    } else if (e.key === 'e' || e.key === 'E') {
      endTurn();
    } else if (e.key === 'm' || e.key === 'M') {
      setMuted(!isMuted());
      $('#mute-btn').textContent = isMuted() ? '🔇 Sound off' : '🔊 Sound on';
    }
  });
}

// --- Boot -----------------------------------------------------------------

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  shotMode = !!shot;
  const legendSlot = $('#legend-slot');
  if (legendSlot) legendSlot.appendChild(legendElement());
  bindInput();
  if (shot === 'title' || !shot) {
    state = freshState(20261122);
    state.phase = 'title';
    state.playerHand = state.playerDeck.slice(0, 5);
    state.rivalHand = state.rivalDeck.slice(5, 10);
    renderAll(true);
    return;
  }
  const shotState = buildShot(shot);
  if (!shotState) {
    state = freshState(20261122);
    state.phase = 'title';
    renderAll(true);
    return;
  }
  state = freshState(20261122);
  Object.assign(state, shotState);
  renderAll(false);
}

document.addEventListener('DOMContentLoaded', boot);
