// MODELO · Física compartida: gravedad, bloques sólidos (silencios) y plataformas
// "de un solo sentido" (líneas, teclas, platos): se atraviesan desde abajo y se pisan desde arriba.
export const GRAVITY = 1800;
export const MAX_FALL = 950;

export function moveWithWorld(e, world, dt, { dropThrough = false } = {}) {
  const result = { grounded: false, wall: false, landedOn: null };
  const prevBottom = e.bottom;

  e.x += e.vx * dt;
  const half = e.width / 2;
  if (e.x < half) { e.x = half; e.vx = 0; result.wall = true; }
  if (e.x > world.width - half) { e.x = world.width - half; e.vx = 0; result.wall = true; }
  for (const solid of world.solids) {
    if (!e.overlaps(solid)) continue;
    e.x = e.vx > 0 ? solid.left - half : solid.right + half;
    e.vx = 0;
    result.wall = true;
  }

  e.y += e.vy * dt;
  for (const solid of world.solids) {
    if (!e.overlaps(solid)) continue;
    if (e.vy > 0) { e.y = solid.top - e.height / 2; result.grounded = true; }
    else e.y = solid.bottom + e.height / 2;
    e.vy = 0;
  }
  if (e.vy >= 0) {
    for (const p of world.platforms) {
      if (dropThrough && p.kind === 'line') continue;
      const above = prevBottom <= p.top + 3 && e.bottom >= p.top;
      if (above && e.right > p.x0 && e.left < p.x1) {
        e.y = p.top - e.height / 2;
        e.vy = 0;
        result.grounded = true;
        result.landedOn = p;
        break;
      }
    }
  }
  return result;
}
