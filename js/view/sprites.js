// VISTA · Sprites de pixel art dibujados a mano (originales, sin derechos de autor).
// Cada letra es un píxel que apunta a un color de la paleta; aquí no hay colores.
const COLOR_OF = { O: 'fox', W: 'foxLight', K: 'ink', S: 'shell', B: 'snailBody', H: 'acornCap', A: 'acorn' };

const FOX_BODY = [
  '..O..O......',
  '..OOOO......',
  '..OOOOOO....',
  '..OOOOOOK...',
  '..OOOOOOOWK.',
  '...OOOOOWW..',
  'OO.OOOOOO...',
  'OOOOOOOOO...',
  'WWOOOOOOO...',
  'WW.OOOOOO...',
];
const FOX = {
  idle: [...FOX_BODY, '...OO..OO...', '...KK..KK...'],
  run: [...FOX_BODY, '..OO....OO..', '..KK....KK..'],
  jump: [...FOX_BODY, '..OOOO.OOO..', '..KKKK.KKK..'],
};
const SNAIL = [
  '...SSSS.....',
  '..SKKKKS....',
  '.SKSSSSKS.B.',
  '.SKSKKSKS.BK',
  '.SKSSSSKSBBB',
  '..SKKKKSBBB.',
  'BBBBBBBBBBB.',
];
const ACORN = [
  '..HHHH..',
  '.HHHHHH.',
  '.AAAAAA.',
  '.AAAAAA.',
  '..AAAA..',
  '..AAAA..',
  '...AA...',
];

function render(rows, palette, scale) {
  const canvas = document.createElement('canvas');
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;
  const ctx = canvas.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((letter, x) => {
    const key = COLOR_OF[letter];
    if (!key) return;
    ctx.fillStyle = palette[key];
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }));
  return canvas;
}

export function buildSprites(palette) {
  return {
    fox: Object.fromEntries(Object.entries(FOX).map(([name, rows]) => [name, render(rows, palette, 3)])),
    snail: render(SNAIL, palette, 3),
    acorn: render(ACORN, palette, 2),
  };
}
