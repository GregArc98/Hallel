/**
 * ChordPro: formato de armazenamento das cifras.
 *
 *   {title: Felicidade no Serviço}
 *   {key: E}
 *
 *   {start_of_verse: Estrofe 1}
 *   No [E]serviço do meu Rei eu sou feliz
 *   {end_of_verse}
 *
 * O usuário nunca precisa ver isto: o editor trabalha com "acorde em cima da letra"
 * (ver chords-over-lyrics.ts) e converte nos dois sentidos.
 */
import { isChord, isChordLineFiller, isChordToken } from "./chord";
import {
  type Line,
  type Section,
  type SectionKind,
  type Song,
  type SongMeta,
  sectionKindFromLabel,
} from "./song";

const KNOWN_KINDS: SectionKind[] = [
  "intro",
  "verse",
  "prechorus",
  "chorus",
  "bridge",
  "interlude",
  "solo",
  "outro",
  "tag",
];

const SHORT_SECTIONS: Record<string, SectionKind> = {
  sov: "verse",
  soc: "chorus",
  sob: "bridge",
};
const SHORT_SECTION_ENDS = new Set(["eov", "eoc", "eob"]);

const META_ALIASES: Record<string, keyof SongMeta> = {
  t: "title",
  title: "title",
  st: "artist",
  subtitle: "artist",
  artist: "artist",
  composer: "artist",
  key: "key",
  tempo: "tempo",
};

const DIRECTIVE_RE = /^\s*\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}\s*$/i;
const INLINE_CHORD_RE = /\[([^\]]*)\]/g;

/** Heurística: o texto parece ChordPro? (diretivas {..} ou acordes [E] colados na letra) */
export function looksLikeChordPro(text: string): boolean {
  for (const raw of text.split(/\r?\n/)) {
    if (DIRECTIVE_RE.test(raw)) return true;
    for (const m of raw.matchAll(INLINE_CHORD_RE)) {
      const next = raw[m.index! + m[0].length];
      if (isChord(m[1]) && next !== undefined && /\S/.test(next) && next !== "[") return true;
    }
  }
  return false;
}

function parseLabel(value: string | undefined): string | null {
  if (!value) return null;
  const labelAttr = /label\s*=\s*"([^"]*)"/.exec(value);
  const label = (labelAttr ? labelAttr[1] : value).trim();
  return label || null;
}

function parseInlineLine(raw: string): Line {
  const parts = raw.split(INLINE_CHORD_RE);
  // parts: [texto, acorde, texto, acorde, texto, ...]
  const textOnly = parts.filter((_, i) => i % 2 === 0).join("");
  const chords = parts.filter((_, i) => i % 2 === 1);
  const fillers = textOnly.trim() === "" ? [] : textOnly.trim().split(/\s+/);

  if (chords.length > 0 && fillers.every(isChordLineFiller)) {
    // Linha só de acordes, ex.: "[E] [D/E] | [A/E]"
    const tokens: string[] = [];
    raw.split(/\s+/).filter(Boolean).forEach((tok) => {
      const inner = /^\[([^\]]*)\]$/.exec(tok);
      if (inner) tokens.push(inner[1]);
      else tok.split(INLINE_CHORD_RE).filter(Boolean).forEach((t) => tokens.push(t));
    });
    return { type: "chords", chords: tokens };
  }

  const segments = [];
  if (parts[0] !== "") segments.push({ chord: null, lyric: parts[0] });
  for (let i = 1; i < parts.length; i += 2) {
    segments.push({ chord: parts[i], lyric: parts[i + 1] ?? "" });
  }
  return { type: "lyrics", segments };
}

export function parseChordPro(text: string): Song {
  const meta: SongMeta = {};
  const sections: Section[] = [];
  let current: Section | null = null;
  let explicit = false;

  const close = () => {
    if (current && (current.lines.length > 0 || current.label)) sections.push(current);
    current = null;
    explicit = false;
  };
  const ensure = (): Section => {
    if (!current) current = { kind: "other", label: null, lines: [] };
    return current;
  };

  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const directive = DIRECTIVE_RE.exec(raw);
    if (directive) {
      const name = directive[1].toLowerCase();
      const value = directive[2];

      const start = /^start_of_(\w+)$/.exec(name);
      if (start || SHORT_SECTIONS[name]) {
        close();
        const label = parseLabel(value);
        const kindName = start ? start[1] : SHORT_SECTIONS[name];
        const kind = (KNOWN_KINDS as string[]).includes(kindName)
          ? (kindName as SectionKind)
          : label
            ? sectionKindFromLabel(label)
            : "other";
        current = { kind, label, lines: [] };
        explicit = true;
        continue;
      }
      if (/^end_of_\w+$/.test(name) || SHORT_SECTION_ENDS.has(name)) {
        close();
        continue;
      }
      if (["c", "comment", "ci", "comment_italic", "cb", "comment_box"].includes(name)) {
        if (value) ensure().lines.push({ type: "comment", text: value });
        continue;
      }
      const metaKey = META_ALIASES[name] ?? name;
      if (value) meta[metaKey] = value;
      continue;
    }

    if (raw.trim() === "") {
      // Linha em branco fecha uma seção implícita (estrofes sem rótulo).
      if (!explicit && current) close();
      continue;
    }
    if (raw.trimStart().startsWith("#")) continue; // comentário de arquivo ChordPro

    ensure().lines.push(parseInlineLine(raw));
  }
  close();
  return { meta, sections };
}

const META_ORDER: Array<keyof SongMeta> = ["title", "artist", "key", "tempo"];

function serializeLine(line: Line): string {
  if (line.type === "comment") return `{comment: ${line.text}}`;
  if (line.type === "chords") {
    return line.chords.map((c) => (isChordToken(c) ? `[${c}]` : c)).join(" ");
  }
  return line.segments
    .map((s) => (s.chord !== null ? `[${s.chord}]${s.lyric}` : s.lyric))
    .join("")
    .trimEnd();
}

export function serializeChordPro(song: Song): string {
  const out: string[] = [];
  const keys = [
    ...META_ORDER.filter((k) => song.meta[k]),
    ...Object.keys(song.meta).filter((k) => !META_ORDER.includes(k) && song.meta[k]),
  ];
  for (const k of keys) out.push(`{${k}: ${song.meta[k]}}`);

  for (const section of song.sections) {
    if (out.length > 0) out.push("");
    const directive = section.kind === "other" ? "part" : section.kind;
    if (section.label !== null) {
      out.push(`{start_of_${directive}: ${section.label}}`);
    }
    for (const line of section.lines) out.push(serializeLine(line));
    if (section.label !== null) out.push(`{end_of_${directive}}`);
  }
  return out.join("\n") + "\n";
}
