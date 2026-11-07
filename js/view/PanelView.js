// VISTA · Paneles, formulario de ajustes, ayuda y botones de partida.
// Emite "comandos" (strings) y nunca decide qué hacer con ellos: eso es del controlador.
import { GameStatus } from '../model/GameModel.js';

export class PanelView {
  #panels;
  #form;
  #help;
  #controls;
  #buttons;

  constructor({ root = document } = {}) {
    this.#panels = new Map([...root.querySelectorAll('[data-panel]')].map((p) => [p.dataset.panel, p]));
    this.#form = root.querySelector('[data-form="settings"]');
    this.#help = root.querySelector('[data-view="help"]');
    this.#controls = root.querySelector('[data-view="controls"]');
    this.#buttons = {
      start: this.#controls.querySelector('[data-command="start"]'),
      pause: this.#controls.querySelector('[data-command="pause"]'),
      finish: this.#controls.querySelector('[data-command="finish"]'),
    };
  }

  onCommand(handler) {
    const forward = (event) => {
      const button = event.target.closest('[data-command]');
      if (button && !button.disabled) handler(button.dataset.command);
    };
    this.#panels.forEach((panel) => panel.addEventListener('click', forward));
    this.#controls.addEventListener('click', forward);
    this.#form.addEventListener('submit', (event) => {
      event.preventDefault();
      handler('start');
    });
  }

  readSettings() {
    const data = new FormData(this.#form);
    return { character: data.get('character'), difficulty: data.get('difficulty') };
  }

  renderControls(status) {
    const active = status === GameStatus.RUNNING || status === GameStatus.PAUSED;
    this.#buttons.start.disabled = active;
    this.#buttons.pause.disabled = !active;
    this.#buttons.finish.disabled = !active;
    this.#buttons.pause.textContent = status === GameStatus.PAUSED ? 'Reanudar' : 'Pausar';
  }

  showStart() { this.#show('start'); }
  showPaused() { this.#show('paused'); }
  hide() { this.#show(null); }
  showOver({ notes }) {
    this.#panels.get('over').querySelector('[data-field="over-notes"]').textContent = notes;
    this.#show('over');
  }
  showWon({ notes, band }) {
    const panel = this.#panels.get('won');
    panel.querySelector('[data-field="won-notes"]').textContent = notes;
    panel.querySelector('[data-field="won-band"]').textContent = band;
    this.#show('won');
  }

  openHelp() { if (!this.#help.open) this.#help.showModal(); }

  #show(name) {
    this.#panels.forEach((panel, key) => { panel.hidden = key !== name; });
    const panel = this.#panels.get(name);
    if (!panel) return;
    // Pequeña espera: evita que un Espacio aún pulsado active el botón enfocado
    const delay = name === 'over' || name === 'won' ? 500 : 0;
    setTimeout(() => {
      if (!panel.hidden) panel.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
    }, delay);
  }
}
