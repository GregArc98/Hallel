/**
 * Motor musical do Hallel — módulo isolado, sem dependências de UI ou banco.
 *
 * Fluxo típico:
 *   texto colado (acorde em cima)  ──parseSongText──▶ Song ──serializeChordPro──▶ banco
 *   banco (ChordPro) ──parseChordPro──▶ Song ──transposeSong──▶ visualizador
 */
import { looksLikeChordPro, parseChordPro } from "./chordpro";
import { parseChordsOverLyrics } from "./chords-over-lyrics";
import { type Song, mapChords } from "./song";
import { type TransposeOptions, semitonesBetween, transposeKey, transposeToken } from "./transpose";

export * from "./notes";
export * from "./chord";
export * from "./transpose";
export * from "./song";
export * from "./chordpro";
export * from "./chords-over-lyrics";
export * from "./filename";

/** Aceita tanto "acorde em cima da letra" quanto ChordPro. */
export function parseSongText(text: string): Song {
  return looksLikeChordPro(text) ? parseChordPro(text) : parseChordsOverLyrics(text);
}

/** Transpõe todos os acordes e o tom (meta.key) da música. */
export function transposeSong(song: Song, semitones: number, opts: TransposeOptions = {}): Song {
  // Sem mudança de tom e sem preferência de grafia: mantém a cifra como foi escrita.
  if (semitones === 0 && (opts.accidental ?? "auto") === "auto") return mapChords(song, (c) => c);
  const targetKey =
    opts.targetKey ?? (song.meta.key ? transposeKey(song.meta.key, semitones, opts) : null);
  const effective: TransposeOptions = { ...opts, targetKey };
  const result = mapChords(song, (c) => transposeToken(c, semitones, effective));
  if (song.meta.key) result.meta.key = targetKey ?? song.meta.key;
  return result;
}

/** Leva a música do tom original para o tom pedido (ex.: tom do culto). */
export function transposeSongToKey(
  song: Song,
  fromKey: string,
  toKey: string,
  opts: Omit<TransposeOptions, "targetKey"> = {},
): Song {
  return transposeSong(song, semitonesBetween(fromKey, toKey), { ...opts, targetKey: toKey });
}
