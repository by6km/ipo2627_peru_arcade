// VISTA · Captura de teclado. Traduce teclas a un estado simple y a comandos.
// No sabe qué significa "pausar": solo avisa de que se pidió.
const LEFT = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const JUMP = ['Space', 'ArrowUp', 'KeyW'];
const DOWN = ['ArrowDown', 'KeyS'];
const GAME_KEYS = new Set([...LEFT, ...RIGHT, ...JUMP, ...DOWN]);
const COMMANDS = { KeyP: 'pause', Escape: 'pause', KeyH: 'help' };

export class InputView {
  #pressed = new Set();
  #handler = () => {};

  constructor({ target = window } = {}) {
    target.addEventListener('keydown', (e) => this.#onKeyDown(e));
    target.addEventListener('keyup', (e) => this.#pressed.delete(e.code));
    target.addEventListener('blur', () => this.#lostFocus());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.#lostFocus(); });
  }

  onCommand(handler) { this.#handler = handler; }

  get state() {
    const down = (codes) => codes.some((code) => this.#pressed.has(code));
    return { direction: Number(down(RIGHT)) - Number(down(LEFT)), jump: down(JUMP), down: down(DOWN) };
  }

  #onKeyDown(event) {
    if (this.#ignored(event)) return;
    if (GAME_KEYS.has(event.code)) {
      event.preventDefault();
      this.#pressed.add(event.code);
    }
    const command = COMMANDS[event.code];
    if (command && !event.repeat) {
      event.preventDefault();
      this.#handler(command);
    }
  }

  #ignored(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return true;
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('dialog, input, select, textarea')) return true;
    return event.code === 'Space' && Boolean(target?.closest('button')); // Espacio activa botones
  }

  #lostFocus() {
    this.#pressed.clear();
    this.#handler('blur');
  }
}
