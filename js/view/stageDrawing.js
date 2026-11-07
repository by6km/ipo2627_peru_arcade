// VISTA · Composición de la escena (nivel y concierto final) a partir de las piezas de art.js.
import {
  drawCharacter, drawCompanion, drawNote, drawOffNote, drawRest, drawKey, drawCymbal, drawGust, drawStageDoor,
} from './art.js';

const TAU = Math.PI * 2;
const STAFF_YS = [150, 214, 278, 342, 406];

export function drawAll(ctx, p, background, size, theme, scene) {
  if (scene.finale) drawConcert(ctx, p, background, size, scene);
  else drawLevel(ctx, p, background, size, theme, scene);
}

function drawBackdrop(ctx, p, background, size, theme, camX) {
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, size.width, size.height);
  if (theme === 'synth') { // rejilla de neón que se desplaza con paralaje
    ctx.strokeStyle = p.grid; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -((camX * 0.5) % 60); x < size.width; x += 60) { ctx.moveTo(x, 0); ctx.lineTo(x, size.height); }
    for (let y = 20; y < size.height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(size.width, y); }
    ctx.stroke();
  } else { // manchas de papel envejecido
    ctx.fillStyle = p.staffFaint;
    for (let i = 0; i < 12; i++) {
      const x = (((i * 263 - camX * 0.5) % 760) + 760) % 760 - 60;
      ctx.beginPath(); ctx.arc(x, (i * 97) % 440 + 20, 18 + (i % 3) * 14, 0, TAU); ctx.fill();
    }
  }
}

function drawLevel(ctx, p, background, size, theme, scene) {
  const { camera, world, player, time } = scene;
  drawBackdrop(ctx, p, background, size, theme, camera.x);
  ctx.save();
  ctx.translate(-Math.round(camera.x), 0);
  const left = camera.x - 60;
  const right = camera.x + size.width + 60;
  const visible = (x) => x > left && x < right;

  // Pentagrama tenue de fondo y líneas divisorias de compás
  ctx.strokeStyle = p.staffFaint; ctx.lineWidth = 1;
  ctx.beginPath();
  STAFF_YS.forEach((y) => { ctx.moveTo(camera.x, y); ctx.lineTo(camera.x + size.width, y); });
  for (let x = Math.floor(left / 400) * 400; x < right; x += 400) { ctx.moveTo(x, STAFF_YS[0]); ctx.lineTo(x, STAFF_YS[4]); }
  ctx.stroke();

  scene.gusts.forEach((g) => { if (g.x1 > left && g.x0 < right) drawGust(ctx, p, g, time); });

  // Plataformas: líneas del pentagrama, teclas de piano y platos de batería
  ctx.strokeStyle = p.staff; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (const plat of world.platforms) {
    if (plat.x1 < left || plat.x0 > right) continue;
    if (plat.kind === 'line') { ctx.beginPath(); ctx.moveTo(plat.x0, plat.top); ctx.lineTo(plat.x1, plat.top); ctx.stroke(); }
    else if (plat.kind === 'key') drawKey(ctx, p, plat);
    else drawCymbal(ctx, p, plat);
  }

  world.solids.forEach((s) => { if (visible(s.x)) drawRest(ctx, p, s.x, s.top); });
  drawStageDoor(ctx, p, scene.goal, time);
  scene.companions.forEach((c) => {
    if (visible(c.x)) { ctx.save(); ctx.translate(c.x, c.y); drawCompanion(ctx, p, c.kind, { rescued: c.rescued, step: time * 3 }); ctx.restore(); }
  });

  ctx.save();
  ctx.shadowColor = p.noteGlow; ctx.shadowBlur = 10;
  scene.notes.forEach((n) => {
    if (n.alive && visible(n.x)) drawNote(ctx, p.note, n.x, n.y + Math.sin(n.age * 4) * 3, n.index % 2 ? 'sixteenth' : 'eighth');
  });
  ctx.restore();
  scene.offNotes.forEach((n) => { if (visible(n.x)) drawOffNote(ctx, p, n.x, n.y, n.spin); });

  drawPlayer(ctx, p, scene);
  ctx.restore();
}

function drawPlayer(ctx, p, { player, character, collected, time }) {
  if (!(player.isInvulnerable && Math.floor(player.invulnerableFor * 12) % 2 === 0)) {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (player.facing < 0) ctx.scale(-1, 1);
    drawCharacter(ctx, p, character, { step: player.runCycle, moving: Math.abs(player.vx) > 20, airborne: !player.grounded });
    ctx.restore();
  }
  // Las notas recogidas orbitan alrededor del personaje
  const count = Math.min(collected, 10);
  ctx.save();
  ctx.shadowColor = p.noteGlow; ctx.shadowBlur = 8;
  for (let i = 0; i < count; i++) {
    const angle = time * 2.5 + (i * TAU) / count;
    const radius = 28 + (i % 2) * 9;
    drawNote(ctx, p.note, player.x + Math.cos(angle) * radius, player.y - 4 + Math.sin(angle) * radius * 0.6, i % 2 ? 'sixteenth' : 'eighth', 0.7);
  }
  ctx.restore();
}

// Escenario de concierto: todos los instrumentos rescatados tocan juntos
function drawConcert(ctx, p, background, size, scene) {
  const t = performance.now() / 1000;
  const { width, height } = size;
  ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = p.spot;
  [[120, 0.14], [320, 0.2], [520, 0.14]].forEach(([x, alpha], i) => {
    ctx.globalAlpha = alpha + 0.05 * Math.sin(t * 2 + i);
    ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + 110, 380); ctx.lineTo(x - 110, 380); ctx.closePath(); ctx.fill();
  });
  ctx.globalAlpha = 1;

  ctx.fillStyle = p.stageFloor; ctx.fillRect(0, 380, width, height - 380);
  ctx.strokeStyle = p.staff; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 380); ctx.lineTo(width, 380); ctx.stroke();
  ctx.fillStyle = p.curtain;
  ctx.fillRect(0, 0, 80, 380); ctx.fillRect(width - 80, 0, 80, 380);
  ctx.strokeStyle = p.staffFaint;
  for (let x = 10; x < 80; x += 14) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 380); ctx.moveTo(width - x, 0); ctx.lineTo(width - x, 380); ctx.stroke(); }

  // Batería al fondo: bombo y dos platos
  ctx.fillStyle = p.cymbal; ctx.strokeStyle = p.staff; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(320, 350, 40, 28, 0, 0, TAU); ctx.fill(); ctx.stroke();
  [[250, 300], [390, 300]].forEach(([x, y]) => { ctx.beginPath(); ctx.ellipse(x, y + Math.sin(t * 8 + x) * 2, 26, 5, 0, 0, TAU); ctx.fill(); ctx.stroke(); });

  const band = [{ x: 320, kind: scene.character, player: true }, ...scene.companions.filter((c) => c.rescued).map((c, i) => ({ x: i ? 470 : 170, kind: c.kind }))];
  band.forEach((m, i) => {
    ctx.save();
    ctx.translate(m.x, 340 - Math.abs(Math.sin(t * 4 + i)) * 8);
    ctx.scale(2.2, 2.2);
    if (m.player) drawCharacter(ctx, p, m.kind, { step: t * 4, moving: true });
    else drawCompanion(ctx, p, m.kind, { rescued: true, step: t * 4 });
    ctx.restore();
  });

  ctx.save();
  ctx.shadowColor = p.noteGlow; ctx.shadowBlur = 10;
  for (let i = 0; i < 14; i++) {
    const y = 360 - ((t * 50 + i * 47) % 340);
    const x = 110 + ((i * 83) % 420) + Math.sin(t + i) * 14;
    drawNote(ctx, i % 2 ? p.note : p.spot, x, y, i % 3 ? 'eighth' : 'sixteenth', 1.1);
  }
  ctx.restore();
}
