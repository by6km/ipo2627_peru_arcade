// VISTA · Marcador de progreso (notas y pistas activas). Solo pinta el snapshot que recibe.
export class HudView {
  #notes;
  #tracks;

  constructor({ root = document } = {}) {
    const hud = root.querySelector('[data-view="hud"]');
    this.#notes = hud.querySelector('[data-hud="notes"]');
    this.#tracks = [...hud.querySelectorAll('[data-track]')];
  }

  render({ notes, totalNotes, tracks }) {
    this.#notes.textContent = `${notes} / ${totalNotes}`;
    this.#tracks.forEach((item) => {
      const on = Boolean(tracks[item.dataset.track]);
      item.dataset.on = String(on);
      item.title = on ? 'Activa' : 'Bloqueada';
    });
  }
}
