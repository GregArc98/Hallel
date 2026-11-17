/**
 * Estrutura interna de uma música cifrada (AST).
 * É o que o visualizador renderiza e o que os conversores produzem/consomem.
 * O formato persistido no banco é ChordPro (ver chordpro.ts).
 */

export type SectionKind =
  | "intro"
  | "verse"
  | "prechorus"
  | "chorus"
  | "bridge"
  | "interlude"
  | "solo"
  | "outro"
  | "tag"
  | "other";

/** Pedaço de uma linha: acorde (opcional) que começa sobre o início do texto. */
export interface Segment {
  chord: string | null;
  lyric: string;
}

export type Line =
  | { type: "lyrics"; segments: Segment[] }
  /** Linha só de acordes (intro, passagem instrumental). */
  | { type: "chords"; chords: string[] }
  /** Observação ("repetir 2x", "só piano"). */
  | { type: "comment"; text: string };

export interface Section {
  kind: SectionKind;
  /** Rótulo como o usuário escreveu: "Estrofe 1", "Refrão". null = sem seção. */
  label: string | null;
  lines: Line[];
}

export interface SongMeta {
  title?: string;
  artist?: string;
  key?: string;
  tempo?: string;
  [extra: string]: string | undefined;
}

export interface Song {
  meta: SongMeta;
  sections: Section[];
}

const SECTION_KEYWORDS: Array<[RegExp, SectionKind]> = [
  [/^(intro|introdu[cç][aã]o)\b/i, "intro"],
  [/^(pr[eé][- ]?refr[aã]o|pr[eé][- ]?coro|pre[- ]?chorus)\b/i, "prechorus"],
  [/^(refr[aã]o|coro|chorus)\b/i, "chorus"],
  [/^(estrofe|verso|parte|verse|estrofe)\b/i, "verse"],
  [/^(ponte|bridge)\b/i, "bridge"],
  [/^(interl[uú]dio|interlude|passagem|instrumental)\b/i, "interlude"],
  [/^(solo)\b/i, "solo"],
  [/^(final|fim|outro|encerramento|finaliza[cç][aã]o)\b/i, "outro"],
  [/^(tag)\b/i, "tag"],
];

/** "Refrão" → chorus, "Estrofe 2" → verse, "Intro" → intro, "Ministração" → other. */
export function sectionKindFromLabel(label: string): SectionKind {
  const trimmed = label.trim();
  for (const [re, kind] of SECTION_KEYWORDS) {
    if (re.test(trimmed)) return kind;
  }
  return "other";
}

/** Texto da letra de uma linha (sem acordes). */
export function lineLyrics(line: Line): string {
  if (line.type !== "lyrics") return "";
  return line.segments.map((s) => s.lyric).join("");
}

/** Letra completa, sem acordes — usado no "modo letra" e na busca. */
export function songToPlainLyrics(song: Song): string {
  const blocks: string[] = [];
  for (const section of song.sections) {
    const lines = section.lines
      .filter((l) => l.type === "lyrics")
      .map((l) => lineLyrics(l).replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (lines.length === 0) continue;
    blocks.push([section.label ? `[${section.label}]` : null, ...lines].filter(Boolean).join("\n"));
  }
  return blocks.join("\n\n");
}

/** Aplica uma função a todos os acordes da música (base da transposição). */
export function mapChords(song: Song, fn: (chord: string) => string): Song {
  return {
    meta: { ...song.meta },
    sections: song.sections.map((section) => ({
      ...section,
      lines: section.lines.map((line): Line => {
        if (line.type === "lyrics") {
          return {
            type: "lyrics",
            segments: line.segments.map((s) => ({
              chord: s.chord === null ? null : fn(s.chord),
              lyric: s.lyric,
            })),
          };
        }
        if (line.type === "chords") {
          return { type: "chords", chords: line.chords.map(fn) };
        }
        return line;
      }),
    })),
  };
}
