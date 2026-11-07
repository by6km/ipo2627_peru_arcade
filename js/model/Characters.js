// MODELO · Personajes jugables. Cada uno trae su "estilo" (clave de tema y de canción),
// pero el modelo solo guarda la clave: los colores y los sonidos viven en la vista.
export const CHARACTERS = Object.freeze({
  sax: Object.freeze({ id: 'sax', style: 'jazz' }),
  keys: Object.freeze({ id: 'keys', style: 'synth' }),
});
export const DEFAULT_CHARACTER = 'sax';
