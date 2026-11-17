/**
 * Notas, acidentes e grafia (sustenido x bemol).
 * Módulo puro, sem dependências — base do motor de transposição.
 */

export type Accidental = "sharp" | "flat";
/** "auto" escolhe a grafia pelo tom de destino (ex.: F, Bb, Eb usam bemóis). */
export type AccidentalPreference = Accidental | "auto";

const SHARP_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NAMES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

const NATURAL_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

/** Regex de uma nota: letra + acidente opcional (aceita #, b, ♯, ♭). */
export const NOTE_PATTERN = "[A-G](?:#|b|♯|♭)?";

export function mod12(n: number): number {
  return ((n % 12) + 12) % 12;
}

/** "C#" → 1, "Db" → 1, "E#" → 5, "Cb" → 11. Retorna null se inválido. */
export function noteToSemitone(note: string): number | null {
  const m = /^([A-G])(#|b|♯|♭)?$/.exec(note);
  if (!m) return null;
  let value = NATURAL_SEMITONES[m[1]];
  if (m[2] === "#" || m[2] === "♯") value += 1;
  if (m[2] === "b" || m[2] === "♭") value -= 1;
  return mod12(value);
}

export function semitoneToNote(semitone: number, accidental: Accidental): string {
  const names = accidental === "flat" ? FLAT_NAMES : SHARP_NAMES;
  return names[mod12(semitone)];
}

/** Grafia que a própria nota usa ("Bb" → flat, "F#" → sharp, "E" → null). */
export function accidentalOf(note: string): Accidental | null {
  if (/[#♯]/.test(note)) return "sharp";
  if (/[b♭]/.test(note.slice(1))) return "flat";
  return null;
}

/** Normaliza ♯/♭ para #/b. */
export function normalizeNote(note: string): string {
  return note.replace("♯", "#").replace("♭", "b");
}
