/**
 * Validação e preparo do formulário de música (puro: usado no servidor e nos testes).
 * A cifra chega no formato "acorde em cima da letra" e é salva em ChordPro.
 */
import { z } from "zod";

import {
  parseChordPro,
  parseKey,
  parseSongText,
  serializeChordPro,
  serializeChordsOverLyrics,
  songToPlainLyrics,
} from "@/lib/music";
import { idDoYoutube } from "./audio";

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres`)
    .transform((v) => (v === "" ? null : v));

const urlOpcional = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), "Link inválido (deve começar com https://)");

const inteiroOpcional = (min: number, max: number, msg: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v)))
    .refine((v) => v === null || (Number.isInteger(v) && v >= min && v <= max), msg);

export const esquemaMusica = z.object({
  titulo: z.string().trim().min(1, "Informe o título").max(200, "Título muito longo"),
  artista: textoOpcional(200),
  hinario_numero: inteiroOpcional(1, 9999, "Número do hinário inválido"),
  hinario_sigla: textoOpcional(20).transform((v) => v?.toUpperCase() ?? null),
  tom_original: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v[0].toUpperCase() + v.slice(1)))
    .refine((v) => v === null || parseKey(v) !== null, "Tom inválido (ex.: E, F#, Bb, C#m)"),
  bpm: inteiroOpcional(20, 300, "BPM deve ficar entre 20 e 300"),
  tags: z
    .string()
    .transform((v) =>
      [...new Set(v.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))].slice(0, 12),
    ),
  cifra_texto: z.string().max(50_000, "Cifra muito longa"),
  letra_texto: z.string().max(50_000, "Letra muito longa"),
  audio_url: urlOpcional,
  audio_url_externo: urlOpcional,
  youtube_url: urlOpcional.refine(
    (v) => v === null || idDoYoutube(v) !== null,
    "Não parece um link do YouTube",
  ),
  observacoes: textoOpcional(2000),
});

export type CamposMusica = keyof z.input<typeof esquemaMusica>;
export type ErrosMusica = Partial<Record<CamposMusica, string>>;

export interface MusicaPreparada {
  titulo: string;
  artista: string | null;
  hinario_numero: number | null;
  hinario_sigla: string | null;
  tom_original: string | null;
  bpm: number | null;
  tags: string[];
  cifra: string | null;
  letra: string | null;
  audio_url: string | null;
  audio_url_externo: string | null;
  youtube_url: string | null;
  observacoes: string | null;
}

export type ResultadoPreparo =
  | { ok: true; musica: MusicaPreparada }
  | { ok: false; erros: ErrosMusica };

/** Valida os campos e converte a cifra colada para ChordPro (+ letra sem acordes). */
export function prepararMusica(entrada: Record<string, string>): ResultadoPreparo {
  const r = esquemaMusica.safeParse(entrada);
  if (!r.success) {
    const erros: ErrosMusica = {};
    for (const issue of r.error.issues) {
      const campo = issue.path[0] as CamposMusica;
      erros[campo] ??= issue.message;
    }
    return { ok: false, erros };
  }
  const d = r.data;

  let cifra: string | null = null;
  let letra: string | null = d.letra_texto.trim() || null;
  let tom = d.tom_original;

  if (d.cifra_texto.trim()) {
    const song = parseSongText(d.cifra_texto);
    if (song.sections.length === 0) {
      return { ok: false, erros: { cifra_texto: "Não encontrei nada na cifra" } };
    }
    tom ??= song.meta.key && parseKey(song.meta.key) ? song.meta.key : null;
    song.meta = { title: d.titulo, ...(tom ? { key: tom } : {}) };
    cifra = serializeChordPro(song);
    letra = songToPlainLyrics(song) || null;
  }

  return {
    ok: true,
    musica: {
      titulo: d.titulo,
      artista: d.artista,
      hinario_numero: d.hinario_numero,
      hinario_sigla: d.hinario_sigla,
      tom_original: tom,
      bpm: d.bpm,
      tags: d.tags,
      cifra,
      letra,
      audio_url: d.audio_url,
      audio_url_externo: d.audio_url_externo,
      youtube_url: d.youtube_url,
      observacoes: d.observacoes,
    },
  };
}

/** ChordPro salvo → texto "acorde em cima da letra" para o editor (sem título/tom, que têm campos próprios). */
export function cifraParaEdicao(chordpro: string | null): string {
  if (!chordpro) return "";
  const song = parseChordPro(chordpro);
  song.meta = {};
  return serializeChordsOverLyrics(song).replace(/^\n+/, "");
}
