// VISTA · Partituras de cada estilo. Notas en MIDI (60 = do central), posiciones en "pasos".
// jazz: corcheas con swing, ii-V-I-VI en do.  synth: semicorcheas rectas, vi-IV-I-V en la menor.
const pulses = (root) => [[0, root], [2, root], [4, root], [6, root + 12], [8, root], [10, root], [12, root], [14, root + 12]];

export const SONGS = Object.freeze({
  jazz: {
    bpm: 126, stepsPerBeat: 2, stepsPerBar: 8, bars: 4, swing: 0.28,
    voices: { bass: 'jazzBass', chords: 'epiano', lead: 'sax' },
    drums: { kick: [0, 4], snare: [6], hat: [0, 2, 3, 4, 6, 7], kickLevel: 0.45, snareLevel: 0.25, hatLevel: 0.16 },
    bass: [
      [[0, 38], [2, 41], [4, 45], [6, 44]],
      [[0, 43], [2, 47], [4, 50], [6, 49]],
      [[0, 36], [2, 40], [4, 43], [6, 42]],
      [[0, 45], [2, 49], [4, 52], [6, 51]],
    ],
    chords: [
      { tones: [53, 57, 60, 64], hits: [0, 3], len: 1.5 },
      { tones: [53, 59, 62, 65], hits: [0, 3], len: 1.5 },
      { tones: [52, 55, 59, 64], hits: [0, 3], len: 1.5 },
      { tones: [55, 61, 64, 67], hits: [0, 3], len: 1.5 },
    ],
    lead: [
      [[0, 69, 1], [1, 72, 1], [2, 74, 2], [4, 72, 1], [5, 69, 1], [6, 65, 2]],
      [[0, 67, 1], [1, 71, 1], [2, 74, 2], [4, 71, 1], [5, 67, 1], [6, 65, 2]],
      [[0, 64, 2], [2, 67, 1], [3, 71, 1], [4, 72, 3]],
      [[0, 69, 1], [1, 73, 1], [2, 76, 2], [4, 73, 1], [5, 69, 1], [6, 67, 2]],
    ],
  },
  synth: {
    bpm: 118, stepsPerBeat: 4, stepsPerBar: 16, bars: 4, swing: 0,
    voices: { bass: 'popBass', chords: 'pad', lead: 'squareLead' },
    drums: { kick: [0, 4, 8, 12], snare: [4, 12], hat: [2, 6, 10, 14], kickLevel: 0.9, snareLevel: 0.5, hatLevel: 0.22 },
    bass: [pulses(33), pulses(29), pulses(36), pulses(31)],
    chords: [
      { tones: [57, 60, 64], hits: [0], len: 16 },
      { tones: [53, 57, 60], hits: [0], len: 16 },
      { tones: [55, 60, 64], hits: [0], len: 16 },
      { tones: [55, 59, 62], hits: [0], len: 16 },
    ],
    lead: [
      [[0, 76, 2], [2, 72, 2], [4, 69, 2], [6, 72, 2], [8, 76, 4], [12, 74, 2], [14, 72, 2]],
      [[0, 77, 2], [2, 72, 2], [4, 69, 2], [6, 72, 2], [8, 77, 4], [12, 76, 2], [14, 72, 2]],
      [[0, 76, 2], [2, 79, 2], [4, 76, 2], [6, 72, 2], [8, 76, 4], [12, 79, 2], [14, 76, 2]],
      [[0, 74, 2], [2, 71, 2], [4, 67, 2], [6, 71, 2], [8, 74, 4], [12, 71, 2], [14, 67, 2]],
    ],
  },
});
