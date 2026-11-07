// CONTROLADOR · Orquesta modelo y vistas. No dibuja, no toca el DOM ni conoce teclas ni notas:
// recibe comandos de las vistas, ordena cambios al modelo y traduce lo que el modelo avisa
// (nota recogida, compañero rescatado...) en órdenes para las vistas (marcador, tema, audio).
import { GameStatus } from '../model/GameModel.js';

const MAX_FRAME_SECONDS = 0.05; // evita saltos enormes tras cambiar de pestaña
const DEFAULT_STYLE = 'jazz';
const FINALE_LEVEL = 1;

export class GameController {
  #model;
  #views;
  #input;
  #lastTimestamp = null;
  #previousStatus = GameStatus.IDLE;

  constructor({ model, views, input }) {
    this.#model = model;
    this.#views = views;
    this.#input = input;
  }

  init() {
    const dispatch = (command) => this.#handleCommand(command);
    this.#views.panels.onCommand(dispatch);
    this.#input.onCommand(dispatch);
    this.#model.subscribe((type, payload) => this.#onModelEvent(type, payload));
    this.#sync(true);
    requestAnimationFrame((t) => this.#frame(t));
  }

  // Bucle principal: actualizar (modelo) y renderizar (vista) en cada fotograma
  #frame(timestamp) {
    const dt = this.#lastTimestamp === null
      ? 0
      : Math.min((timestamp - this.#lastTimestamp) / 1000, MAX_FRAME_SECONDS);
    this.#lastTimestamp = timestamp;

    this.#model.update(dt, this.#input.state);
    this.#views.game.render(this.#model.scene);
    requestAnimationFrame((t) => this.#frame(t));
  }

  #handleCommand(command) {
    switch (command) {
      case 'start':
      case 'restart':
        this.#model.configure(this.#views.panels.readSettings());
        this.#model.start();
        break;
      case 'pause': this.#model.togglePause(); break;
      case 'resume': this.#model.resume(); break;
      case 'finish': this.#model.finish(); break;
      case 'settings': this.#model.reset(); break;
      case 'help':
        this.#model.pause();
        this.#views.panels.openHelp();
        break;
      case 'blur': this.#model.pause(); break;
      default: break;
    }
  }

  #onModelEvent(type, payload) {
    const { audio } = this.#views;
    switch (type) {
      case 'status': this.#sync(true); break;
      case 'stats': this.#sync(false); break;
      case 'collect': audio.sfx('collect', payload); break;
      case 'key': audio.sfx('key', payload); break;
      case 'bounce': audio.sfx('bounce'); break;
      case 'hurt': audio.sfx('hurt'); break;
      case 'rescue': audio.sfx('rescue'); break;
      default: break;
    }
  }

  #sync(statusChanged) {
    const snapshot = this.#model.snapshot();
    const { hud, panels, game, audio, theme } = this.#views;
    hud.render(snapshot);
    if (snapshot.status === GameStatus.RUNNING) audio.setTracks(snapshot.tracks);
    if (!statusChanged) return;

    const previous = this.#previousStatus;
    this.#previousStatus = snapshot.status;
    panels.renderControls(snapshot.status);
    switch (snapshot.status) {
      case GameStatus.IDLE:
        audio.stop();
        theme.apply(DEFAULT_STYLE);
        game.refreshPalette();
        panels.showStart();
        break;
      case GameStatus.RUNNING:
        panels.hide();
        game.focus();
        if (previous === GameStatus.PAUSED) {
          audio.resume();
        } else {
          theme.apply(snapshot.style);
          game.refreshPalette();
          audio.start(snapshot.style, snapshot.tracks);
        }
        break;
      case GameStatus.PAUSED: audio.pause(); panels.showPaused(); break;
      case GameStatus.OVER: audio.stop(); panels.showOver(snapshot); break;
      case GameStatus.WON:
        audio.setTracks(snapshot.tracks);
        audio.setLevel(FINALE_LEVEL); // el concierto suena a pleno volumen
        panels.showWon(snapshot);
        break;
      default: break;
    }
  }
}
