/**
 * Prepara uma linha cifrada para exibição responsiva.
 *
 * Cada acorde fica numa "coluna" (acorde em cima, texto embaixo). Para a linha poder
 * quebrar em telas estreitas sem separar um acorde da sílaba onde ele cai, as colunas
 * são agrupadas em palavras: a quebra só acontece entre palavras.
 */
import type { Segment } from "@/lib/music";

export interface Column {
  chord: string | null;
  text: string;
}

/** Uma palavra = colunas que precisam ficar juntas na mesma linha. */
export type Word = Column[];

export function segmentsToWords(segments: Segment[]): Word[] {
  const columns: Column[] = [];
  for (const seg of segments) {
    // Quebra o texto em pedaços "palavra + espaços seguintes".
    const parts = seg.lyric.match(/\S*\s*/g)?.filter((p) => p !== "") ?? [];
    if (parts.length === 0) parts.push("");
    parts.forEach((text, i) => columns.push({ chord: i === 0 ? seg.chord : null, text }));
  }

  const words: Word[] = [];
  let current: Word = [];
  for (const col of columns) {
    const prev = current[current.length - 1];
    if (prev && /\s$/.test(prev.text)) {
      words.push(current);
      current = [];
    }
    current.push(col);
  }
  if (current.length > 0) words.push(current);
  return words;
}

export function lineHasChords(segments: Segment[]): boolean {
  return segments.some((s) => s.chord !== null);
}
