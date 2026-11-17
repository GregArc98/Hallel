/**
 * Leitura e escrita de acordes: raiz, sufixo (qualidade/extensões) e baixo.
 * Ex.: "E7/D", "F#m7(b5)", "A#°", "Bbsus4", "E/G#", "C7M", "D/E".
 */
import { NOTE_PATTERN, normalizeNote } from "./notes";

export interface Chord {
  root: string; // "F#"
  suffix: string; // "m7(b5)" — mantido como digitado
  bass: string | null; // "G#" em "E/G#"
}

/**
 * Sufixos aceitos: combinações de qualidades e extensões comuns em cifras
 * brasileiras (m, maj, M, 7M, dim, °, º, o, ø, aug, +, sus, add, 4, 7, 9, 11, 13,
 * (b5), (#9), 7/9 etc.). É restritivo de propósito para não confundir palavras
 * da letra com acordes.
 */
const SUFFIX_TOKEN =
  "(?:maj|min|dim|aug|sus|add|no|omit|alt|m|M|°|º|ø|o|\\+|-|\\d{1,2}|\\(|\\)|#|b|♯|♭|\\/(?=\\d))";

const CHORD_RE = new RegExp(
  `^(${NOTE_PATTERN})(${SUFFIX_TOKEN}*)(?:\\/(${NOTE_PATTERN}))?$`,
);

export function parseChord(text: string): Chord | null {
  const m = CHORD_RE.exec(text.trim());
  if (!m) return null;
  const suffix = m[2];
  // Parênteses precisam estar balanceados: "A(9" não é acorde.
  if (!parenthesesBalanced(suffix)) return null;
  return {
    root: normalizeNote(m[1]),
    suffix,
    bass: m[3] ? normalizeNote(m[3]) : null,
  };
}

export function isChord(text: string): boolean {
  return parseChord(text) !== null;
}

/**
 * Token de cifra: acorde possivelmente envolto em parênteses/pontuação,
 * como "(A" "B)" "(E7)". Retorna as partes para permitir transpor só o núcleo.
 */
export function splitChordToken(
  token: string,
): { before: string; chord: Chord; after: string } | null {
  // Primeiro o token inteiro: "F#m7(b5)" termina em ")" e é um acorde válido.
  const whole = parseChord(token);
  if (whole) return { before: "", chord: whole, after: "" };
  const m = /^([(\[{]*)(.*?)([)\]},.;:]*)$/.exec(token);
  if (!m) return null;
  const chord = parseChord(m[2]);
  return chord ? { before: m[1], chord, after: m[3] } : null;
}

export function isChordToken(token: string): boolean {
  return splitChordToken(token) !== null;
}

/** Marcas que podem aparecer numa linha de acordes sem serem acordes: | x2 (2x) - % */
export function isChordLineFiller(token: string): boolean {
  return /^(\|{1,2}|[-–—]|\/|%|\.{2,3}|:|x\d+|\d+x|\(\d+x\)|\(x\d+\)|\(|\))$/i.test(token);
}

export function formatChord(chord: Chord): string {
  return `${chord.root}${chord.suffix}${chord.bass ? `/${chord.bass}` : ""}`;
}

/** Acorde menor? (para tons: "Em", "C#m7" → true; "Cmaj7", "Cdim" → false) */
export function isMinorSuffix(suffix: string): boolean {
  return /^(m|min)(?!aj)/.test(suffix);
}

function parenthesesBalanced(s: string): boolean {
  let depth = 0;
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth < 0 || depth > 1) return false;
  }
  return depth === 0;
}
