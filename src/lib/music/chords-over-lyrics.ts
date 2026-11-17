/**
 * Formato "acorde em cima da letra" — como as cifras são escritas no Word/Drive:
 *
 *   [Refrão]
 *          E           A/E
 *   No serviço do meu Rei
 *
 * A posição (coluna) de cada acorde na linha de cima define sobre qual letra ele cai.
 * Atenção: no Word com fonte proporcional o alinhamento visual não é o da contagem
 * de caracteres; por isso o editor do app usa fonte monoespaçada e mostra prévia.
 */
import { isChord, isChordLineFiller, isChordToken } from "./chord";
import { type Line, type Section, type Segment, type Song, type SongMeta, sectionKindFromLabel } from "./song";

const TAB_WIDTH = 8;

function expandTabs(line: string): string {
  let out = "";
  for (const ch of line) {
    if (ch === "\t") out += " ".repeat(TAB_WIDTH - (out.length % TAB_WIDTH));
    else out += ch;
  }
  return out;
}

/** Linha composta só de acordes (e marcas como "|" ou "x2"), com ao menos um acorde. */
export function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  let chords = 0;
  for (const t of tokens) {
    if (isChordToken(t)) chords++;
    else if (!isChordLineFiller(t)) return false;
  }
  return chords > 0;
}

/** "[Refrão]" / "[Intro] E D/E" → { label, rest }. Não confunde com acorde "[E]". */
function parseSectionHeader(line: string): { label: string; rest: string } | null {
  const m = /^\s*\[([^\]]+)\]\s*(.*)$/.exec(line);
  if (!m || isChord(m[1].trim())) return null;
  return { label: m[1].trim(), rest: m[2] };
}

const META_PATTERNS: Array<[RegExp, keyof SongMeta]> = [
  [/^\s*tom\s*[:\-]?\s*([A-G](?:#|b|♯|♭)?m?)\s*$/i, "key"],
  [/^\s*(?:autor|artista|compositor|letra e m[uú]sica)\s*:\s*(.+?)\s*$/i, "artist"],
  [/^\s*(?:bpm|andamento)\s*[:\-]?\s*(\d+)\s*(?:bpm)?\s*$/i, "tempo"],
];

function matchMeta(line: string): [keyof SongMeta, string] | null {
  for (const [re, key] of META_PATTERNS) {
    const m = re.exec(line);
    if (m) {
      const value = key === "key" ? m[1][0].toUpperCase() + m[1].slice(1) : m[1];
      return [key, value];
    }
  }
  return null;
}

/** Junta a linha de acordes com a linha de letra de baixo, pela coluna de cada acorde. */
export function mergeChordAndLyricLines(chordLine: string, lyricLine: string): Segment[] {
  const positions: Array<{ col: number; chord: string }> = [];
  for (const m of chordLine.matchAll(/\S+/g)) positions.push({ col: m.index!, chord: m[0] });
  if (positions.length === 0) return [{ chord: null, lyric: lyricLine }];

  const lastCol = positions[positions.length - 1].col;
  const lyric = lyricLine.length <= lastCol ? lyricLine.padEnd(lastCol) : lyricLine;

  const segments: Segment[] = [];
  if (positions[0].col > 0) segments.push({ chord: null, lyric: lyric.slice(0, positions[0].col) });
  positions.forEach((p, i) => {
    const end = i + 1 < positions.length ? positions[i + 1].col : lyric.length;
    segments.push({ chord: p.chord, lyric: lyric.slice(p.col, end) });
  });
  // Espaços de preenchimento no fim não fazem parte da letra.
  const last = segments[segments.length - 1];
  last.lyric = last.lyric.trimEnd();
  return segments;
}

export interface ParseOptions {
  /** Título encontrado antes da primeira seção vira meta.title (padrão: true). */
  detectTitle?: boolean;
}

export function parseChordsOverLyrics(text: string, options: ParseOptions = {}): Song {
  const detectTitle = options.detectTitle ?? true;
  const lines = text.replace(/\r/g, "").split("\n").map((l) => expandTabs(l).trimEnd());
  const hasHeaders = lines.some((l) => parseSectionHeader(l) !== null);

  const meta: SongMeta = {};
  const sections: Section[] = [];
  let current: Section | null = null;
  let explicit = false;
  let started = false; // já apareceu conteúdo musical?

  const close = () => {
    if (current && (current.lines.length > 0 || current.label)) sections.push(current);
    current = null;
    explicit = false;
  };
  const push = (line: Line) => {
    if (!current) current = { kind: "other", label: null, lines: [] };
    current.lines.push(line);
    started = true;
  };
  const chordTokens = (line: string) => line.trim().split(/\s+/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === "") {
      if (!explicit && current) close();
      continue;
    }

    const header = parseSectionHeader(line);
    if (header) {
      close();
      current = { kind: sectionKindFromLabel(header.label), label: header.label, lines: [] };
      explicit = true;
      started = true;
      if (header.rest.trim()) {
        push(
          isChordLine(header.rest)
            ? { type: "chords", chords: chordTokens(header.rest) }
            : { type: "lyrics", segments: [{ chord: null, lyric: header.rest.trim() }] },
        );
      }
      continue;
    }

    if (!started) {
      const metaMatch = matchMeta(line);
      if (metaMatch) {
        meta[metaMatch[0]] = metaMatch[1];
        continue;
      }
      if (detectTitle && hasHeaders && !meta.title && !isChordLine(line)) {
        meta.title = line.trim();
        continue;
      }
    }

    if (isChordLine(line)) {
      const next = lines[i + 1];
      const nextIsLyric =
        next !== undefined &&
        next.trim() !== "" &&
        !parseSectionHeader(next) &&
        !isChordLine(next);
      if (nextIsLyric) {
        push({ type: "lyrics", segments: mergeChordAndLyricLines(line, next) });
        i++;
      } else {
        push({ type: "chords", chords: chordTokens(line) });
      }
      continue;
    }

    const comment = /^\s*\((.+)\)\s*$/.exec(line);
    if (comment) {
      push({ type: "comment", text: comment[1].trim() });
      continue;
    }

    push({ type: "lyrics", segments: [{ chord: null, lyric: line.trimStart() }] });
  }
  close();
  return { meta, sections };
}

/** Gera as duas linhas (acordes + letra) de uma linha cifrada. */
export function lyricsLineToText(segments: Segment[]): { chords: string; lyrics: string } {
  let chords = "";
  let lyrics = "";
  for (const seg of segments) {
    if (seg.chord !== null) {
      // Se o acorde anterior ainda "ocupa" a posição, empurra a letra para manter o alinhamento.
      const needed = chords.length > 0 ? chords.length + 1 : 0;
      if (lyrics.length < needed) lyrics = lyrics.padEnd(needed);
      chords = chords.padEnd(lyrics.length) + seg.chord;
    }
    lyrics += seg.lyric;
  }
  return { chords: chords.trimEnd(), lyrics: lyrics.trimEnd() };
}

/** Song → texto "acorde em cima da letra" (usado no editor e na exportação). */
export function serializeChordsOverLyrics(song: Song): string {
  const out: string[] = [];
  if (song.meta.title) out.push(song.meta.title);
  if (song.meta.key) out.push(`Tom: ${song.meta.key}`);
  if (song.meta.artist) out.push(`Autor: ${song.meta.artist}`);
  if (song.meta.tempo) out.push(`BPM: ${song.meta.tempo}`);

  for (const section of song.sections) {
    if (out.length > 0) out.push("");
    if (section.label !== null) out.push(`[${section.label}]`);
    for (const line of section.lines) {
      if (line.type === "comment") out.push(`(${line.text})`);
      else if (line.type === "chords") out.push(line.chords.join("  "));
      else {
        const { chords, lyrics } = lyricsLineToText(line.segments);
        if (chords) out.push(chords);
        out.push(lyrics);
      }
    }
  }
  return out.join("\n") + "\n";
}
