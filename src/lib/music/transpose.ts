/**
 * Transposição de acordes e tons.
 */
import { type Chord, formatChord, isMinorSuffix, parseChord, splitChordToken } from "./chord";
import {
  type Accidental,
  type AccidentalPreference,
  accidentalOf,
  mod12,
  noteToSemitone,
  semitoneToNote,
} from "./notes";

/** Tons maiores (pela tônica, em semitons) cuja grafia convencional usa bemóis: F, Bb, Eb, Ab, Db. F# é preferido a Gb. */
const FLAT_MAJOR_TONICS = new Set([5, 10, 3, 8, 1]);
/** Tons menores com bemóis: Dm, Gm, Cm, Fm, Bbm, Ebm. */
const FLAT_MINOR_TONICS = new Set([2, 7, 0, 5, 10, 3]);

export interface ParsedKey {
  tonic: string;
  minor: boolean;
}

/** "E" → {E, maior}; "C#m" → {C#, menor}; "Bbm" → {Bb, menor}. */
export function parseKey(key: string): ParsedKey | null {
  const chord = parseChord(key.trim());
  if (!chord || chord.bass) return null;
  if (chord.suffix && !/^(m|min)$/.test(chord.suffix)) return null;
  return { tonic: chord.root, minor: isMinorSuffix(chord.suffix) };
}

export function formatKey(key: ParsedKey): string {
  return `${key.tonic}${key.minor ? "m" : ""}`;
}

/** Grafia convencional de um tom: "F" → flat, "E" → sharp, "Dm" → flat. */
export function accidentalForKey(key: string): Accidental {
  const parsed = parseKey(key);
  if (!parsed) return "sharp";
  // Respeita a grafia explícita do tom: "Gb" usa bemol, "F#" usa sustenido.
  const explicit = accidentalOf(parsed.tonic);
  if (explicit) return explicit;
  return conventionalAccidental(noteToSemitone(parsed.tonic)!, parsed.minor);
}

/** Grafia convencional pela posição da tônica, ignorando como ela foi escrita. */
function conventionalAccidental(tonicSemitone: number, minor: boolean): Accidental {
  const flats = minor ? FLAT_MINOR_TONICS : FLAT_MAJOR_TONICS;
  return flats.has(mod12(tonicSemitone)) ? "flat" : "sharp";
}

/** Distância em semitons de um tom a outro, normalizada para -5..+6. */
export function semitonesBetween(fromKey: string, toKey: string): number {
  const from = parseKey(fromKey);
  const to = parseKey(toKey);
  if (!from || !to) return 0;
  const diff = mod12(noteToSemitone(to.tonic)! - noteToSemitone(from.tonic)!);
  return diff > 6 ? diff - 12 : diff;
}

export interface TransposeOptions {
  /** Grafia desejada. "auto" decide pelo tom de destino (ou mantém a original). */
  accidental?: AccidentalPreference;
  /** Tom de destino, usado quando accidental = "auto". */
  targetKey?: string | null;
}

function resolveAccidental(
  original: string,
  semitones: number,
  opts: TransposeOptions,
): Accidental | "keep" {
  const pref = opts.accidental ?? "auto";
  if (pref !== "auto") return pref;
  if (opts.targetKey) return accidentalForKey(opts.targetKey);
  if (semitones === 0) return "keep";
  return accidentalOf(original) ?? "sharp";
}

function transposeNote(note: string, semitones: number, opts: TransposeOptions): string {
  const value = noteToSemitone(note);
  if (value === null) return note;
  const acc = resolveAccidental(note, semitones, opts);
  if (acc === "keep") return note;
  return semitoneToNote(value + semitones, acc);
}

export function transposeChordObject(
  chord: Chord,
  semitones: number,
  opts: TransposeOptions = {},
): Chord {
  return {
    root: transposeNote(chord.root, semitones, opts),
    suffix: chord.suffix,
    bass: chord.bass ? transposeNote(chord.bass, semitones, opts) : null,
  };
}

/**
 * Transpõe um acorde em texto. Se não for um acorde reconhecido, devolve o texto intacto.
 * transposeChord("E/G#", 3) → "G/B"; transposeChord("A#°", -2) → "G#°"
 */
export function transposeChord(
  text: string,
  semitones: number,
  opts: TransposeOptions = {},
): string {
  const chord = parseChord(text);
  if (!chord) return text;
  return formatChord(transposeChordObject(chord, semitones, opts));
}

/**
 * Transpõe um token de cifra preservando parênteses/pontuação: "(A" → "(B".
 * Tokens que não são acordes ("|", "x2") voltam intactos.
 */
export function transposeToken(
  token: string,
  semitones: number,
  opts: TransposeOptions = {},
): string {
  const parts = splitChordToken(token);
  if (!parts) return token;
  return `${parts.before}${formatChord(transposeChordObject(parts.chord, semitones, opts))}${parts.after}`;
}

/** transposeKey("E", 3) → "G"; transposeKey("C#m", 1, {accidental:"flat"}) → "Dm" */
export function transposeKey(
  key: string,
  semitones: number,
  opts: TransposeOptions = {},
): string {
  const parsed = parseKey(key);
  if (!parsed) return key;
  const value = noteToSemitone(parsed.tonic)! + semitones;
  const pref = opts.accidental ?? "auto";
  let tonic: string;
  if (pref !== "auto") {
    tonic = semitoneToNote(value, pref);
  } else if (semitones === 0) {
    tonic = parsed.tonic;
  } else {
    // Escolhe a grafia mais convencional para o tom resultante.
    tonic = semitoneToNote(value, conventionalAccidental(value, parsed.minor));
  }
  return formatKey({ tonic, minor: parsed.minor });
}

/** Lista dos 12 tons (para seletores de tom). */
export function allKeys(minor = false): string[] {
  return Array.from({ length: 12 }, (_, i) =>
    formatKey({ tonic: semitoneToNote(i, conventionalAccidental(i, minor)), minor }),
  );
}
