// VISTA · Renderizado del canvas. Solo dibuja lo que le da el modelo; no modifica estado.
import { readPalette } from './theme.js';
import { drawAll } from './stageDrawing.js';

export class GameView {
  #canvas;
  #ctx;
  #palette;
  #background;
  #size;

  constructor({ view, root = document }) {
    this.#canvas = root.querySelector('[data-view="game"]');
    this.#ctx = this.#canvas.getContext('2d');
    this.#size = view;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.#canvas.width = view.width * ratio;
    this.#canvas.height = view.height * ratio;
    this.#ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.refreshPalette();
  }

  // Se llama tras cambiar de tema: vuelve a leer los colores del CSS
  refreshPalette() {
    this.#palette = readPalette();
    this.#background = this.#ctx.createLinearGradient(0, 0, 0, this.#size.height);
    this.#background.addColorStop(0, this.#palette.bgTop);
    this.#background.addColorStop(1, this.#palette.bgBottom);
  }

  focus() { this.#canvas.focus({ preventScroll: true }); }

  render(scene) {
    drawAll(this.#ctx, this.#palette, this.#background, this.#size, document.documentElement.dataset.theme, scene);
  }
}
