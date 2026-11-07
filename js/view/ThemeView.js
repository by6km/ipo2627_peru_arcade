// VISTA · Aplica el tema (jazz | synth) a toda la página mediante data-theme.
export class ThemeView {
  apply(style) { document.documentElement.dataset.theme = style; }
}
