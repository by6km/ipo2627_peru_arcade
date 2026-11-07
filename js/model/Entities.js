// MODELO · Entidades. Solo datos y reglas: nada de DOM, canvas, sonido ni colores.
import { GRAVITY, MAX_FALL, moveWithWorld } from './physics.js';

export class Entity {
  constructor(x, y, width, height) {
    Object.assign(this, { x, y, width, height, vx: 0, vy: 0, alive: true });
  }
  get left() { return this.x - this.width / 2; }
  get right() { return this.x + this.width / 2; }
  get top() { return this.y - this.height / 2; }
  get bottom() { return this.y + this.height / 2; }
  overlaps(o) {
    return this.left < o.right && this.right > o.left && this.top < o.bottom && this.bottom > o.top;
  }
}

// Plataforma de un solo sentido. kind: 'line' (pentagrama) | 'key' (tecla) | 'cymbal' (plato)
export class Platform {
  constructor(kind, x0, x1, top, extra = {}) {
    Object.assign(this, { kind, x0, x1, top, sink: 0, ...extra });
  }
}

const RUN = { accel: 1500, brake: 1800, max: 230 };
const JUMP_SPEED = 700;
const COYOTE_TIME = 0.1;
const BUFFER_TIME = 0.12;
const DROP_TIME = 0.2;

export class Player extends Entity {
  constructor(x, y) {
    super(x, y, 22, 34);
    Object.assign(this, {
      facing: 1, grounded: false, landedOn: null, justLanded: false, coyote: 0, jumpBuffer: 0,
      jumpHeld: false, dropTimer: 0, invulnerableFor: 0, runCycle: 0,
    });
  }
  get isInvulnerable() { return this.invulnerableFor > 0; }

  respawn(x, y, invulnerableFor) {
    Object.assign(this, { x, y, vx: 0, vy: 0, invulnerableFor });
  }

  // pushAx: aceleración externa (ráfagas de ruido blanco)
  update(dt, { direction, jump, down }, world, pushAx = 0) {
    if (direction !== 0) {
      const turning = Math.sign(this.vx) === -direction;
      this.vx += direction * (turning ? RUN.brake : RUN.accel) * dt;
      this.facing = direction;
    } else {
      const slow = RUN.brake * dt;
      this.vx = Math.abs(this.vx) <= slow ? 0 : this.vx - Math.sign(this.vx) * slow;
    }
    this.vx = Math.max(-RUN.max, Math.min(RUN.max, this.vx)) + pushAx * dt;

    if (jump && !this.jumpHeld) this.jumpBuffer = BUFFER_TIME;
    this.jumpHeld = jump;
    this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.vy = -JUMP_SPEED;
      this.jumpBuffer = 0;
      this.coyote = 0;
    }
    if (down && this.grounded && this.landedOn?.kind === 'line') this.dropTimer = DROP_TIME;
    this.dropTimer = Math.max(0, this.dropTimer - dt);

    // Salto variable: si sueltas la tecla mientras subes, la gravedad aumenta
    const gravity = GRAVITY * (this.vy < 0 && !jump ? 2.2 : 1);
    this.vy = Math.min(MAX_FALL, this.vy + gravity * dt);

    const hit = moveWithWorld(this, world, dt, { dropThrough: this.dropTimer > 0 });
    this.justLanded = hit.grounded && !this.grounded;
    this.grounded = hit.grounded;
    this.landedOn = hit.landedOn;
    if (hit.grounded) this.coyote = COYOTE_TIME;
    this.runCycle += (Math.abs(this.vx) / 40) * dt;
    this.invulnerableFor = Math.max(0, this.invulnerableFor - dt);
  }
}

const OFFNOTE_BOUNCE = 430;
export class OffNote extends Entity {
  constructor(x, y, zone, speed) {
    super(x, y, 22, 24);
    Object.assign(this, { zone, speed, dir: 1, spin: Math.random() * 6 });
  }
  update(dt, world) {
    this.vx = this.dir * this.speed;
    this.vy = Math.min(MAX_FALL, this.vy + GRAVITY * dt);
    const hit = moveWithWorld(this, { width: world.width, solids: [], platforms: world.lines }, dt);
    if (hit.grounded) this.vy = -OFFNOTE_BOUNCE;
    if (this.x < this.zone[0]) this.dir = 1;
    if (this.x > this.zone[1]) this.dir = -1;
    this.spin += dt * 6;
  }
}

export class Silence extends Entity {
  constructor(x, y) { super(x, y, 22, 40); }
}

export class Note extends Entity {
  constructor(x, y, index) {
    super(x, y, 20, 22);
    this.index = index;
    this.age = index;
  }
  update(dt) { this.age += dt; }
}

export class Companion extends Entity {
  constructor(x, y, kind) {
    super(x, y, 30, 44);
    Object.assign(this, { kind, rescued: false });
  }
}

export class Goal extends Entity {
  constructor(x, y) { super(x, y, 40, 80); }
}

// Zona de ruido blanco que empuja en horizontal con una fuerza que respira
export class Gust {
  constructor(x0, x1, dir, phase) {
    Object.assign(this, { x0, x1, y0: 90, y1: 430, dir, phase });
  }
  intensity(time) { return 0.5 + 0.5 * Math.sin(time * 1.8 + this.phase); }
  contains(e) { return e.x > this.x0 && e.x < this.x1 && e.y > this.y0 && e.y < this.y1; }
}
