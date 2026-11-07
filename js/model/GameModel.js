// MODELO · Estado, progreso y reglas del juego. No conoce DOM, canvas, teclas, colores ni audio:
// solo avisa de lo que pasa (colección de notas, rescates, golpes...) y decide qué pistas se desbloquean.
import { LEVEL, WORLD, STAFF_Y } from './Level.js';
import { CHARACTERS, DEFAULT_CHARACTER } from './Characters.js';
import { Player, Platform, Silence, OffNote, Note, Companion, Gust, Goal } from './Entities.js';

export const VIEW = Object.freeze({ width: 640, height: 480 });
export const GameStatus = Object.freeze({
  IDLE: 'idle', RUNNING: 'running', PAUSED: 'paused', OVER: 'over', WON: 'won',
});
export const TRACKS = Object.freeze(['drums', 'chords', 'bass', 'lead']);

// Reglas de progreso: la batería suena desde el principio; el resto se desbloquea
const NOTES_FOR_CHORDS = 8;
const TRACK_PER_COMPANION = ['bass', 'lead']; // al rescatar al 1.º y al 2.º compañero
const OFFNOTE_SPEED = Object.freeze({ easy: 45, normal: 70, hard: 100 });
const GUST_FORCE = 900;
const CYMBAL_BOUNCE = 1000;
const STOMP_BOUNCE = 430;
const NOTES_LOST_ON_HIT = 2;
const INVULNERABLE_SECONDS = 1.5;
const FALL_LIMIT = 540;

export class GameModel {
  #listeners = new Set();
  #status = GameStatus.IDLE;
  #settings = { character: DEFAULT_CHARACTER, difficulty: 'normal' };
  #collected = 0;
  #unlocked = new Set(['drums']);
  #clock = 0;
  #camera = { x: 0 };
  #checkpoint = null;
  #world = null;
  #player = null;
  #notes = [];
  #offNotes = [];
  #companions = [];
  #gusts = [];
  #goal = null;

  constructor() { this.#buildWorld(); }

  get view() { return VIEW; }
  get status() { return this.#status; }
  get style() { return CHARACTERS[this.#settings.character].style; }

  get scene() {
    return {
      view: VIEW, world: this.#world, camera: this.#camera, player: this.#player,
      notes: this.#notes, offNotes: this.#offNotes, companions: this.#companions,
      gusts: this.#gusts, goal: this.#goal, collected: this.#collected, time: this.#clock,
      character: this.#settings.character, finale: this.#status === GameStatus.WON,
    };
  }
  snapshot() {
    const rescued = this.#companions.filter((c) => c.rescued).length;
    return {
      status: this.#status,
      character: this.#settings.character,
      style: this.style,
      notes: this.#collected,
      totalNotes: this.#notes.length,
      tracks: Object.fromEntries(TRACKS.map((id) => [id, this.#unlocked.has(id)])),
      rescued,
      band: 1 + rescued,
    };
  }

  // Patrón observador: el modelo avisa de lo ocurrido; no sabe quién escucha
  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }
  #emit(type, payload) { this.#listeners.forEach((listener) => listener(type, payload)); }
  #setStatus(status) {
    if (this.#status === status) return;
    this.#status = status;
    this.#emit('status');
  }

  // ---------- Ciclo de partida ----------
  configure({ character, difficulty }) {
    this.#settings = {
      character: Object.hasOwn(CHARACTERS, character) ? character : DEFAULT_CHARACTER,
      difficulty: Object.hasOwn(OFFNOTE_SPEED, difficulty) ? difficulty : 'normal',
    };
  }
  start() {
    if (this.#status === GameStatus.RUNNING || this.#status === GameStatus.PAUSED) return;
    this.#buildWorld();
    this.#emit('stats');
    this.#setStatus(GameStatus.RUNNING);
  }
  pause() { if (this.#status === GameStatus.RUNNING) this.#setStatus(GameStatus.PAUSED); }
  resume() { if (this.#status === GameStatus.PAUSED) this.#setStatus(GameStatus.RUNNING); }
  togglePause() { this.#status === GameStatus.PAUSED ? this.resume() : this.pause(); }
  finish() {
    if (this.#status === GameStatus.RUNNING || this.#status === GameStatus.PAUSED) {
      this.#setStatus(GameStatus.OVER);
    }
  }
  reset() {
    if (this.#status === GameStatus.OVER || this.#status === GameStatus.WON) {
      this.#setStatus(GameStatus.IDLE);
    }
  }

  #buildWorld() {
    const lines = LEVEL.lines.map(([row, x0, x1]) => new Platform('line', x0, x1, STAFF_Y[row]));
    const keys = LEVEL.keys.map(([x, top], i) => new Platform('key', x - 18, x + 18, top, { chord: i }));
    const cymbals = LEVEL.cymbals.map((x) => new Platform('cymbal', x - 28, x + 28, STAFF_Y[4] - 10));
    this.#world = {
      width: WORLD.width,
      lines,
      platforms: [...lines, ...keys, ...cymbals],
      solids: LEVEL.silences.map(([x, row]) => new Silence(x, STAFF_Y[row] - 20)),
    };
    const speed = OFFNOTE_SPEED[this.#settings.difficulty];
    this.#player = new Player(LEVEL.start.x, STAFF_Y[LEVEL.start.line] - 17);
    this.#notes = LEVEL.notes.map(([x, y], i) => new Note(x, y, i));
    this.#offNotes = LEVEL.offNotes.map((o) => new OffNote(o.x, STAFF_Y[o.line] - 30, o.zone, speed));
    this.#companions = LEVEL.companions.map((c) => new Companion(c.x, STAFF_Y[c.line] - 22, c.kind));
    this.#gusts = LEVEL.gusts.map(([x0, x1, dir], i) => new Gust(x0, x1, dir, i * 2));
    this.#goal = new Goal(LEVEL.goal.x, STAFF_Y[LEVEL.goal.line] - 40);
    this.#checkpoint = { x: LEVEL.start.x, y: STAFF_Y[LEVEL.start.line] - 17 };
    this.#collected = 0;
    this.#unlocked = new Set(['drums']);
    this.#clock = 0;
    this.#camera.x = 0;
  }

  // ---------- Actualización por fotograma ----------
  // input = { direction: -1|0|1, jump: boolean, down: boolean } (traducido por el controlador)
  update(dt, input) {
    if (this.#status !== GameStatus.RUNNING) return;
    this.#clock += dt;
    const player = this.#player;

    const gust = this.#gusts.find((g) => g.contains(player));
    const pushAx = gust ? gust.dir * GUST_FORCE * gust.intensity(this.#clock) : 0;
    player.update(dt, input, this.#world, pushAx);
    this.#offNotes.forEach((n) => n.update(dt, this.#world));
    this.#notes.forEach((n) => n.update(dt));
    this.#updatePlatforms();

    this.#interact();
    this.#offNotes = this.#offNotes.filter((n) => n.alive);
    this.#updateCamera();
  }

  #updatePlatforms() {
    const player = this.#player;
    for (const p of this.#world.platforms) {
      if (p.kind === 'line') continue;
      const standing = player.landedOn === p;
      p.sink += ((standing ? 5 : 0) - p.sink) * 0.25;
    }
    if (!player.justLanded || !player.landedOn) return;
    if (player.landedOn.kind === 'key') this.#emit('key', player.landedOn.chord);
    if (player.landedOn.kind === 'cymbal') {
      player.vy = -CYMBAL_BOUNCE;
      this.#emit('bounce');
    }
  }

  #interact() {
    const player = this.#player;

    for (const note of this.#notes) {
      if (note.alive && player.overlaps(note)) {
        note.alive = false;
        this.#collected += 1;
        this.#emit('collect', this.#collected);
        if (this.#collected >= NOTES_FOR_CHORDS) this.#unlock('chords');
        this.#emit('stats');
      }
    }
    for (const [index, companion] of this.#companions.entries()) {
      if (companion.rescued || !player.overlaps(companion)) continue;
      companion.rescued = true;
      this.#checkpoint = { x: companion.x, y: companion.y };
      this.#unlock(TRACK_PER_COMPANION[index]);
      this.#emit('rescue');
      this.#emit('stats');
    }
    for (const enemy of this.#offNotes) {
      if (!enemy.alive || !player.overlaps(enemy)) continue;
      if (player.vy > 0 && player.bottom - enemy.top < 18) {
        enemy.alive = false;
        player.vy = -STOMP_BOUNCE;
      } else {
        this.#hurt();
      }
    }
    if (player.top > FALL_LIMIT) this.#fall();
    if (player.overlaps(this.#goal)) {
      this.#notes.forEach((n) => { n.alive = false; });
      this.#setStatus(GameStatus.WON);
    }
  }

  #unlock(track) {
    if (this.#unlocked.has(track)) return;
    this.#unlocked.add(track);
    this.#emit('unlock', track);
  }

  #loseNotes() {
    this.#collected = Math.max(0, this.#collected - NOTES_LOST_ON_HIT);
    this.#emit('stats');
  }

  #hurt() {
    const player = this.#player;
    if (player.isInvulnerable) return;
    this.#loseNotes();
    player.invulnerableFor = INVULNERABLE_SECONDS;
    player.vy = -320;
    player.vx = -player.facing * 220;
    this.#emit('hurt');
  }

  #fall() {
    this.#loseNotes();
    this.#player.respawn(this.#checkpoint.x, this.#checkpoint.y, INVULNERABLE_SECONDS);
    this.#emit('hurt');
  }

  // Desplazamiento lateral: la cámara sigue al jugador sin salirse del nivel
  #updateCamera() {
    const target = this.#player.x - VIEW.width * 0.4;
    this.#camera.x = Math.max(0, Math.min(WORLD.width - VIEW.width, target));
  }
}
