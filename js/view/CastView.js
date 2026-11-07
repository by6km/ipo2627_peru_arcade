// VISTA · Dibuja los personajes de la pantalla de inicio, cada uno con la paleta de su mitad.
import { readPalette } from './theme.js';
import { drawCharacter } from './art.js';

export class CastView {
  constructor({ root = document } = {}) {
    root.querySelectorAll('[data-preview]').forEach((canvas) => {
      const palette = readPalette(canvas.closest('[data-theme]'));
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(3, 3);
      drawCharacter(ctx, palette, canvas.dataset.preview, { step: 0.5, moving: false });
    });
  }
}
