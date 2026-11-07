// VISTA · Dibujo con la geometría nativa de Canvas (trazados, elipses, curvas). Sin imágenes.
// Todas las funciones reciben la paleta: aquí no hay colores.
const TAU = Math.PI * 2;

function eyes(ctx, p, x, y) {
  ctx.fillStyle = p.charEye;
  ctx.beginPath(); ctx.arc(x - 3, y, 3, 0, TAU); ctx.arc(x + 3, y, 3, 0, TAU); ctx.fill();
  ctx.fillStyle = p.charPupil;
  ctx.beginPath(); ctx.arc(x - 2, y, 1.4, 0, TAU); ctx.arc(x + 4, y, 1.4, 0, TAU); ctx.fill();
}

function legs(ctx, p, y0, { step = 0, moving = false, airborne = false }) {
  const swing = airborne ? 3 : Math.sin(step * Math.PI) * 4 * (moving ? 1 : 0);
  ctx.strokeStyle = p.charTrim;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, y0); ctx.lineTo(-5 + swing, 18);
  ctx.moveTo(5, y0); ctx.lineTo(5 - swing, 18);
  ctx.stroke();
}

// Personaje jugable, centrado en (0, 0), caja de 26 x 36, mirando a la derecha
export function drawCharacter(ctx, p, kind, state = {}) {
  ctx.save();
  legs(ctx, p, 12, state);
  if (kind === 'sax') {
    ctx.strokeStyle = p.charBody; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-3, -13); ctx.lineTo(-3, 3);
    ctx.quadraticCurveTo(-3, 11, 5, 11);
    ctx.quadraticCurveTo(11, 11, 11, 3);
    ctx.stroke();
    ctx.fillStyle = p.charBody;
    ctx.beginPath(); ctx.ellipse(11, 1, 7, 3, -0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = p.charTrim;
    ctx.beginPath(); ctx.ellipse(11, 0.5, 4.5, 1.6, -0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.charTrim; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-3, -13); ctx.lineTo(4, -17); ctx.stroke();
    [-1, 4, 9].forEach((y) => { ctx.beginPath(); ctx.arc(-3, y, 1.6, 0, TAU); ctx.fill(); });
    eyes(ctx, p, -3, -9);
  } else {
    ctx.fillStyle = p.charBody; ctx.fillRect(-13, -15, 26, 13);
    ctx.fillStyle = p.charKey; ctx.fillRect(-13, -2, 26, 14);
    ctx.fillStyle = p.charTrim;
    [-9, -3, 3, 9].forEach((x) => ctx.fillRect(x - 1.5, -2, 3, 8));
    ctx.beginPath(); ctx.arc(9, -12, 1.5, 0, TAU); ctx.fill();
    eyes(ctx, p, -1, -9);
  }
  ctx.restore();
}

// Compañero a rescatar, centrado en (0, 0), caja de 30 x 44
export function drawCompanion(ctx, p, kind, { rescued = false, step = 0 } = {}) {
  ctx.save();
  legs(ctx, p, 16, { step, moving: rescued });
  if (kind === 'bass') {
    ctx.fillStyle = p.charTrim; ctx.fillRect(-2, -22, 4, 22);
    ctx.fillStyle = p.companionA;
    ctx.beginPath(); ctx.ellipse(0, 6, 11, 13, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = p.charTrim; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-1, -20); ctx.lineTo(-1, 14); ctx.moveTo(1, -20); ctx.lineTo(1, 14); ctx.stroke();
    eyes(ctx, p, 0, 2);
  } else {
    ctx.strokeStyle = p.companionB; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, 2); ctx.lineTo(7, 2); ctx.stroke();
    ctx.fillStyle = p.companionB;
    ctx.beginPath(); ctx.moveTo(6, 2); ctx.lineTo(16, -8); ctx.lineTo(16, 12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.charTrim;
    [-6, -1, 4].forEach((x) => { ctx.beginPath(); ctx.arc(x, -2, 1.6, 0, TAU); ctx.fill(); });
    eyes(ctx, p, -4, 9);
  }
  if (!rescued) {
    ctx.strokeStyle = p.cage; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = -16; x <= 16; x += 8) { ctx.moveTo(x, -24); ctx.lineTo(x, 22); }
    ctx.moveTo(-16, -24); ctx.lineTo(16, -24); ctx.moveTo(-16, 22); ctx.lineTo(16, 22);
    ctx.stroke();
  }
  ctx.restore();
}

// Corchea o semicorchea
export function drawNote(ctx, color, x, y, kind, scale = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(-3, 6, 5, 3.6, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(1.6, 5); ctx.lineTo(1.6, -9); ctx.stroke();
  const flags = kind === 'sixteenth' ? 2 : 1;
  for (let i = 0; i < flags; i++) {
    ctx.beginPath(); ctx.moveTo(1.6, -9 + i * 4); ctx.quadraticCurveTo(9, -6 + i * 4, 6, i * 4); ctx.stroke();
  }
  ctx.restore();
}

// Nota desafinada: cabeza partida, plica quebrada y color disonante
export function drawOffNote(ctx, p, x, y, spin) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(Math.sin(spin) * 0.35);
  ctx.fillStyle = p.bad; ctx.strokeStyle = p.bad2; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(-2, 6, 8, 5.5, -0.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-9, 4); ctx.lineTo(-3, 7); ctx.lineTo(-5, 3); ctx.lineTo(3, 9); ctx.stroke();
  ctx.strokeStyle = p.bad;
  ctx.beginPath(); ctx.moveTo(5, 5); ctx.lineTo(7, -2); ctx.lineTo(3, -5); ctx.lineTo(8, -11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -11); ctx.lineTo(14, -6); ctx.stroke();
  ctx.restore();
}

// Silencio de negra, como una sombra que bloquea el paso
export function drawRest(ctx, p, x, top) {
  ctx.save();
  ctx.translate(x, top);
  ctx.strokeStyle = p.rest; ctx.fillStyle = p.rest; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 2); ctx.lineTo(5, 11); ctx.lineTo(-5, 21); ctx.lineTo(4, 29);
  ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-1, 34, 6, 5, 0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

export function drawKey(ctx, p, platform) {
  const w = platform.x1 - platform.x0;
  const y = platform.top + platform.sink;
  ctx.fillStyle = p.keyWhite; ctx.fillRect(platform.x0, y, w, 14);
  ctx.strokeStyle = p.staff; ctx.lineWidth = 2; ctx.strokeRect(platform.x0, y, w, 14);
  ctx.fillStyle = p.keyBlack; ctx.fillRect(platform.x0 + w * 0.55, y, w * 0.3, 8);
}

export function drawCymbal(ctx, p, platform) {
  const cx = (platform.x0 + platform.x1) / 2;
  const squash = 1 - platform.sink * 0.04;
  ctx.strokeStyle = p.staff; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, platform.top + 4); ctx.lineTo(cx, platform.top + 10); ctx.stroke();
  ctx.fillStyle = p.cymbal;
  ctx.beginPath(); ctx.ellipse(cx, platform.top + 3 + platform.sink * 0.5, 28, 5 * squash, 0, 0, TAU); ctx.fill();
  ctx.stroke();
  ctx.fillStyle = p.staff;
  ctx.beginPath(); ctx.arc(cx, platform.top + 1, 2.5, 0, TAU); ctx.fill();
}

// Ráfaga de ruido blanco: líneas onduladas discontinuas que corren en el sentido del viento
export function drawGust(ctx, p, gust, time) {
  ctx.save();
  ctx.strokeStyle = p.gust; ctx.lineWidth = 2; ctx.setLineDash([14, 10]);
  ctx.lineDashOffset = -time * 70 * gust.dir;
  ctx.globalAlpha = 0.35 + 0.65 * gust.intensity(time);
  for (let i = 0; i < 9; i++) {
    const y = gust.y0 + ((gust.y1 - gust.y0) * i) / 8;
    ctx.beginPath();
    for (let x = gust.x0; x <= gust.x1; x += 10) {
      const yy = y + Math.sin(x * 0.06 + time * 9 + i) * 6;
      x === gust.x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Puerta del escenario al final del nivel
export function drawStageDoor(ctx, p, goal, time) {
  ctx.save();
  ctx.fillStyle = p.curtain;
  ctx.fillRect(goal.left - 6, goal.top, goal.width + 12, goal.height);
  ctx.strokeStyle = p.staff; ctx.lineWidth = 2;
  for (let x = goal.left; x <= goal.right; x += 10) { ctx.beginPath(); ctx.moveTo(x, goal.top); ctx.lineTo(x, goal.bottom); ctx.stroke(); }
  ctx.fillStyle = p.spot; ctx.globalAlpha = 0.25 + 0.15 * Math.sin(time * 3);
  ctx.beginPath(); ctx.moveTo(goal.x, goal.top - 60); ctx.lineTo(goal.left - 20, goal.bottom); ctx.lineTo(goal.right + 20, goal.bottom); ctx.closePath(); ctx.fill();
  ctx.restore();
}
