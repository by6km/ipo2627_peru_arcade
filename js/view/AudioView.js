// VISTA · Motor de audio con Web Audio API nativa (osciladores y ruido, sin muestras ni librerías).
// Todas las pistas se programan siempre a la vez y en sincronía; "desmutear" solo sube su ganancia.
import { SONGS } from './songs.js';

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);
const TRACK_IDS = ['drums', 'chords', 'bass', 'lead'];
const LOOKAHEAD = 0.12; // segundos que se programan por adelantado
const PLAY_LEVEL = 0.5;

export class AudioView {
  #ctx = null;
  #master = null;
  #noise = null;
  #gains = {};
  #song = null;
  #timer = null;
  #origin = 0;
  #step = 0;

  #ensure() {
    if (this.#ctx) return true;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return false;
    this.#ctx = new Context();
    const compressor = this.#ctx.createDynamicsCompressor();
    this.#master = this.#ctx.createGain();
    this.#master.connect(compressor);
    compressor.connect(this.#ctx.destination);
    const rate = this.#ctx.sampleRate;
    this.#noise = this.#ctx.createBuffer(1, rate, rate);
    const data = this.#noise.getChannelData(0);
    for (let i = 0; i < rate; i++) data[i] = Math.random() * 2 - 1;
    return true;
  }

  // Debe llamarse dentro de un gesto del usuario (clic o tecla) por la política de autoplay
  start(style, tracks) {
    if (!this.#ensure()) return;
    this.stop();
    this.#ctx.resume();
    this.#song = SONGS[style];
    for (const id of TRACK_IDS) {
      this.#gains[id] = this.#ctx.createGain();
      this.#gains[id].gain.value = tracks[id] ? 1 : 0;
      this.#gains[id].connect(this.#master);
    }
    this.#master.gain.cancelScheduledValues(0);
    this.#master.gain.value = PLAY_LEVEL;
    this.#origin = this.#ctx.currentTime + 0.15;
    this.#step = 0;
    this.#timer = setInterval(() => this.#tick(), 25);
  }

  stop() {
    clearInterval(this.#timer);
    this.#timer = null;
    this.#song = null;
    if (this.#ctx) this.#master.gain.setTargetAtTime(0, this.#ctx.currentTime, 0.08);
  }

  pause() { this.#ctx?.suspend(); }
  resume() { this.#ctx?.resume(); }

  setTracks(tracks) {
    if (!this.#ctx) return;
    for (const id of TRACK_IDS) this.#gains[id]?.gain.setTargetAtTime(tracks[id] ? 1 : 0, this.#ctx.currentTime, 0.06);
  }
  setLevel(level) { if (this.#ctx) this.#master.gain.setTargetAtTime(level, this.#ctx.currentTime, 0.4); }

  // ---------- Secuenciador ----------
  #tick() {
    const song = this.#song;
    if (!song) return;
    const stepDuration = 60 / song.bpm / song.stepsPerBeat;
    const timeOf = (n) => this.#origin + n * stepDuration + (n % 2 ? song.swing * stepDuration : 0);
    while (timeOf(this.#step) < this.#ctx.currentTime + LOOKAHEAD) {
      this.#playStep(this.#step, timeOf(this.#step), stepDuration);
      this.#step += 1;
    }
  }

  #playStep(n, t, stepDuration) {
    const song = this.#song;
    const bar = Math.floor(n / song.stepsPerBar) % song.bars;
    const step = n % song.stepsPerBar;
    const { drums } = song;
    if (drums.kick.includes(step)) this.#kick(t, drums.kickLevel);
    if (drums.snare.includes(step)) this.#snare(t, drums.snareLevel);
    if (drums.hat.includes(step)) this.#noiseHit(t, this.#gains.drums, 'highpass', 7500, drums.hatLevel, 0.05);

    for (const [at, midi, len = 2] of song.bass[bar]) {
      if (at === step) this.#voice(song.voices.bass, midiToHz(midi), t, len * stepDuration, this.#gains.bass);
    }
    const chord = song.chords[bar];
    if (chord.hits.includes(step)) {
      chord.tones.forEach((m) => this.#voice(song.voices.chords, midiToHz(m), t, chord.len * stepDuration, this.#gains.chords));
    }
    for (const [at, midi, len] of song.lead[bar]) {
      if (at === step) this.#voice(song.voices.lead, midiToHz(midi), t, len * stepDuration, this.#gains.lead);
    }
  }

  // ---------- Sonidos básicos ----------
  #tone(type, freq, t, dur, dest, { peak = 0.3, attack = 0.01, release = 0.08, filter = null, detune = 0 } = {}) {
    const osc = this.#ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const gain = this.#ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(peak, t + attack);
    gain.gain.setTargetAtTime(0.0001, t + dur, release / 3);
    if (filter) {
      const biquad = this.#ctx.createBiquadFilter();
      biquad.type = filter.type;
      biquad.frequency.value = filter.freq;
      biquad.Q.value = filter.q ?? 1;
      osc.connect(biquad);
      biquad.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + dur + release * 2);
    return osc;
  }

  #noiseHit(t, dest, type, freq, peak, dur) {
    const source = this.#ctx.createBufferSource();
    source.buffer = this.#noise;
    const filter = this.#ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    const gain = this.#ctx.createGain();
    gain.gain.setValueAtTime(peak, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    source.start(t);
    source.stop(t + dur + 0.05);
  }

  #kick(t, level) {
    const osc = this.#ctx.createOscillator();
    const gain = this.#ctx.createGain();
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.connect(gain);
    gain.connect(this.#gains.drums);
    osc.start(t);
    osc.stop(t + 0.3);
  }

  #snare(t, level) {
    this.#noiseHit(t, this.#gains.drums, 'highpass', 1800, level, 0.14);
    this.#tone('triangle', 190, t, 0.06, this.#gains.drums, { peak: level * 0.6, release: 0.05 });
  }

  #voice(name, freq, t, dur, dest) {
    switch (name) {
      case 'jazzBass':
        this.#tone('triangle', freq, t, dur * 0.9, dest, { peak: 0.5, release: 0.12, filter: { type: 'lowpass', freq: 700 } });
        break;
      case 'popBass':
        this.#tone('sawtooth', freq, t, dur * 0.85, dest, { peak: 0.3, release: 0.06, filter: { type: 'lowpass', freq: 500 } });
        break;
      case 'epiano':
        this.#tone('sine', freq, t, 0.45, dest, { peak: 0.14, release: 0.4 });
        this.#tone('triangle', freq * 2, t, 0.2, dest, { peak: 0.04, release: 0.2 });
        break;
      case 'pad':
        [-7, 7].forEach((detune) => this.#tone('sawtooth', freq, t, dur, dest, { peak: 0.06, attack: 0.25, release: 0.4, detune, filter: { type: 'lowpass', freq: 1400 } }));
        break;
      case 'sax': {
        const osc = this.#tone('sawtooth', freq, t, dur * 0.95, dest, { peak: 0.2, attack: 0.05, release: 0.1, filter: { type: 'lowpass', freq: 2200, q: 2 } });
        const lfo = this.#ctx.createOscillator();
        const depth = this.#ctx.createGain();
        lfo.frequency.value = 5.5;
        depth.gain.value = 12;
        lfo.connect(depth);
        depth.connect(osc.detune);
        lfo.start(t);
        lfo.stop(t + dur + 0.3);
        break;
      }
      case 'squareLead':
        this.#tone('square', freq, t, dur * 0.9, dest, { peak: 0.1, attack: 0.005, release: 0.08, filter: { type: 'lowpass', freq: 3000 } });
        break;
      default: break;
    }
  }

  // ---------- Efectos de sonido ----------
  sfx(name, arg = 0) {
    if (!this.#ctx || this.#ctx.state !== 'running') return;
    const t = this.#ctx.currentTime;
    const out = this.#master;
    switch (name) {
      case 'collect': {
        const f = [523, 587, 659, 784, 880][arg % 5];
        this.#tone('sine', f, t, 0.08, out, { peak: 0.25, release: 0.1 });
        this.#tone('sine', f * 2, t + 0.05, 0.08, out, { peak: 0.12, release: 0.1 });
        break;
      }
      case 'key': {
        const chords = this.#song?.chords;
        if (!chords) break;
        chords[arg % chords.length].tones.forEach((m) => this.#tone('triangle', midiToHz(m + 12), t, 0.4, out, { peak: 0.1, release: 0.3 }));
        break;
      }
      case 'bounce':
        this.#noiseHit(t, out, 'highpass', 3500, 0.3, 0.35);
        this.#tone('sine', 300, t, 0.1, out, { peak: 0.2 });
        break;
      case 'hurt':
        this.#tone('square', 196, t, 0.2, out, { peak: 0.14 });
        this.#tone('square', 277, t, 0.2, out, { peak: 0.14 });
        break;
      case 'rescue':
        [60, 64, 67, 72].forEach((m, i) => this.#tone('sine', midiToHz(m + 12), t + i * 0.09, 0.15, out, { peak: 0.22, release: 0.2 }));
        break;
      default: break;
    }
  }
}
