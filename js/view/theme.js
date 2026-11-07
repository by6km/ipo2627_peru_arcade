// VISTA · Lee la paleta desde las variables CSS (css/theme-color.css) del elemento dado.
// Al leerla de un elemento concreto, respeta su data-theme (jazz o synth).
const TOKENS = Object.freeze({
  bgTop: '--color-game-bg-top', bgBottom: '--color-game-bg-bottom',
  staff: '--color-game-staff', staffFaint: '--color-game-staff-faint', grid: '--color-game-grid',
  keyWhite: '--color-game-key-white', keyBlack: '--color-game-key-black', cymbal: '--color-game-cymbal',
  note: '--color-game-note', noteGlow: '--color-game-note-glow', rest: '--color-game-rest',
  bad: '--color-game-bad', bad2: '--color-game-bad-2', gust: '--color-game-gust',
  charBody: '--color-game-char-body', charTrim: '--color-game-char-trim', charKey: '--color-game-char-key',
  charEye: '--color-game-char-eye', charPupil: '--color-game-char-pupil',
  companionA: '--color-game-companion-a', companionB: '--color-game-companion-b', cage: '--color-game-cage',
  spot: '--color-game-spot', curtain: '--color-game-curtain', stageFloor: '--color-game-stage-floor',
});

export function readPalette(element = document.documentElement) {
  const styles = getComputedStyle(element);
  return Object.freeze(Object.fromEntries(
    Object.entries(TOKENS).map(([name, token]) => [name, styles.getPropertyValue(token).trim()]),
  ));
}
