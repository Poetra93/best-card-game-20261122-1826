// Synthesised sounds for Sigil Duel: every sound is built with WebAudio
// oscillators and noise, so the game needs no audio files at all.

let ctx = null;
let muted = false;

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setMuted(value) {
  muted = !!value;
}

export function isMuted() {
  return muted;
}

// One short tone: frequency, duration, waveform, volume, slide-to frequency.
function tone(freq, dur, type, vol, slideTo, delay) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + (delay || 0);
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol || 0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A burst of filtered noise, for hits and shuffles.
function noiseBurst(dur, vol, delay) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t0 = ac.currentTime + (delay || 0);
  const len = Math.floor(ac.sampleRate * dur);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const gain = ac.createGain();
  gain.gain.value = vol || 0.15;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start(t0);
}

export const sfx = {
  click() {
    tone(660, 0.06, 'triangle', 0.08);
  },
  draw() {
    noiseBurst(0.09, 0.1);
    tone(520, 0.08, 'sine', 0.06, 760, 0.02);
  },
  playCard() {
    tone(392, 0.1, 'triangle', 0.12, 523);
    noiseBurst(0.06, 0.08, 0.02);
  },
  chain() {
    tone(523, 0.09, 'triangle', 0.12);
    tone(659, 0.09, 'triangle', 0.12, null, 0.07);
    tone(784, 0.14, 'triangle', 0.12, null, 0.14);
  },
  counter() {
    tone(880, 0.08, 'square', 0.07);
    tone(1174, 0.12, 'square', 0.07, null, 0.06);
  },
  hit() {
    noiseBurst(0.16, 0.22);
    tone(180, 0.18, 'sawtooth', 0.12, 70);
  },
  heal() {
    tone(523, 0.12, 'sine', 0.1);
    tone(784, 0.18, 'sine', 0.1, null, 0.09);
  },
  ward() {
    tone(330, 0.12, 'sine', 0.1, 440);
    tone(440, 0.16, 'sine', 0.08, null, 0.08);
  },
  turn() {
    tone(440, 0.08, 'triangle', 0.09);
    tone(554, 0.1, 'triangle', 0.09, null, 0.08);
  },
  error() {
    tone(160, 0.14, 'square', 0.08, 110);
  },
  win() {
    const notes = [523, 659, 784, 1046, 1318];
    notes.forEach((n, i) => tone(n, 0.28, 'triangle', 0.13, null, i * 0.12));
    tone(1046, 0.6, 'sine', 0.08, null, 0.6);
  },
  lose() {
    const notes = [392, 370, 349, 311];
    notes.forEach((n, i) => tone(n, 0.3, 'sawtooth', 0.07, null, i * 0.16));
  },
};
