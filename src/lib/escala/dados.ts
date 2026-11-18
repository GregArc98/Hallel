import "server-only";

import { carregarEquipe, carregarFuncoes } from "@/lib/equipe/dados";
import { parseChordsOverLyrics, serializeChordPro } from "@/lib/music";
import { createClient } from "@/lib/supabase/server";
import { type Mes, primeiroEUltimoDia } from "./datas";
import type { CultoParaAnalise, Indisponibilidade, Periodo } from "./regras";

export interface Culto extends CultoParaAnalise {
  tipo: "regular" | "avulso";
  titulo: string | null;
  horario: string | null;
  escalaPublicada: boolean;
  repertorioPublicado: boolean;
  observacoes: string | null;
  /** Quantas músicas no repertório (membros: só conta se publicado). */
  musicas: number;
}

const SELECT_CULTO =
  "id, data, periodo, tipo, titulo, horario, observacoes, escala_publicada, repertorio_publicado, escala_item!escala_item_culto_id_igreja_id_fkey (funcao_id, posicao, integrante_id), setlist_item!setlist_item_culto_id_igreja_id_fkey (count)";

type LinhaCulto = {
  id: string;
  data: string;
  periodo: Periodo;
  tipo: "regular" | "avulso";
  titulo: string | null;
  horario: string | null;
  escala_publicada: boolean;
  repertorio_publicado: boolean;
  observacoes: string | null;
  setlist_item: Array<{ count: number }>;
  escala_item: Array<{ funcao_id: string; posicao: number; integrante_id: string }>;
};

function paraCulto(l: LinhaCulto): Culto {
  return {
    id: l.id,
    data: l.data,
    periodo: l.periodo,
    tipo: l.tipo,
    titulo: l.titulo,
    horario: l.horario?.slice(0, 5) ?? null,
    escalaPublicada: l.escala_publicada,
    repertorioPublicado: l.repertorio_publicado,
    observacoes: l.observacoes,
    musicas: l.setlist_item[0]?.count ?? 0,
    vagas: l.escala_item.map((v) => ({
      funcaoId: v.funcao_id,
      posicao: v.posicao,
      integranteId: v.integrante_id,
    })),
  };
}

/** Cultos entre duas datas (inclusive), em ordem. RLS: membros só recebem vagas publicadas. */
export async function carregarCultos(igrejaId: string, de: string, ate: string): Promise<Culto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("culto")
    .select(SELECT_CULTO)
    .eq("igreja_id", igrejaId)
    .gte("data", de)
    .lte("data", ate)
    .order("data")
    .order("periodo")
    .order("horario", { nullsFirst: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => paraCulto(l as LinhaCulto));
}

export async function carregarCulto(igrejaId: string, id: string): Promise<Culto | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("culto")
    .select(SELECT_CULTO)
    .eq("igreja_id", igrejaId)
    .eq("id", id)
    .maybeSingle();
  return data ? paraCulto(data as LinhaCulto) : null;
}

/** RLS: admins recebem de todos; membros, só as próprias. */
export async function carregarIndisponibilidades(
  igrejaId: string,
  de: string,
  ate: string,
): Promise<Indisponibilidade[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("indisponibilidade")
    .select("integrante_id, data, periodo")
    .eq("igreja_id", igrejaId)
    .gte("data", de)
    .lte("data", ate);
  if (error) throw new Error(error.message);
  return (data ?? []).map((i) => ({ integranteId: i.integrante_id, data: i.data, periodo: i.periodo }));
}

/** Tudo o que a tela do mês precisa. */
export async function carregarMes(igrejaId: string, mes: Mes) {
  const [de, ate] = primeiroEUltimoDia(mes);
  const [cultos, funcoes, equipe, indisponibilidades] = await Promise.all([
    carregarCultos(igrejaId, de, ate),
    carregarFuncoes(igrejaId),
    carregarEquipe(igrejaId),
    carregarIndisponibilidades(igrejaId, de, ate),
  ]);
  return { cultos, funcoes, equipe, indisponibilidades };
}

export interface ItemRepertorio {
  musicaId: string;
  titulo: string;
  tomOriginal: string | null;
  tom: string | null;
  observacao: string | null;
  temCifra: boolean;
  modoLetra: boolean;
}

/** Repertório do culto em ordem. RLS: membros só recebem se publicado. */
export async function carregarRepertorio(cultoId: string): Promise<ItemRepertorio[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("setlist_item")
    .select(
      "ordem, tom, observacao, musica:musica!setlist_item_musica_id_igreja_id_fkey (id, titulo, tom_original, tem_cifra)",
    )
    .eq("culto_id", cultoId)
    .order("ordem");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((i) => i.musica)
    .map((i) => ({
      musicaId: i.musica!.id,
      titulo: i.musica!.titulo,
      tomOriginal: i.musica!.tom_original,
      tom: i.tom,
      observacao: i.observacao,
      temCifra: Boolean(i.musica!.tem_cifra),
      modoLetra: false,
    }));
}

export interface MusicaDoCulto {
  musicaId: string;
  titulo: string;
  subtitulo: string | null;
  tomOriginal: string | null;
  tom: string | null;
  observacao: string | null;
  cifra: string | null;
  letra: string | null;
  audioUrl: string | null;
  audioUrlExterno: string | null;
  youtubeUrl: string | null;
}

/** Repertório com tudo o que o modo culto precisa (cifra, letra, áudio). */
export async function carregarRepertorioCompleto(cultoId: string): Promise<MusicaDoCulto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("setlist_item")
    .select(
      "ordem, tom, observacao, musica:musica!setlist_item_musica_id_igreja_id_fkey (id, titulo, artista, hinario_numero, hinario_sigla, tom_original, cifra, letra, audio_url, audio_url_externo, youtube_url)",
    )
    .eq("culto_id", cultoId)
    .order("ordem");
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((i) => i.musica)
    .map((i) => {
      const m = i.musica!;
      return {
        musicaId: m.id,
        titulo: m.titulo,
        subtitulo:
          [m.hinario_numero ? `${m.hinario_sigla ?? "Hino"} ${m.hinario_numero}` : null, m.artista]
            .filter(Boolean)
            .join(" · ") || null,
        tomOriginal: m.tom_original,
        tom: i.tom,
        observacao: i.observacao,
        // Só letra: vira uma "cifra sem acordes" para ter palco, fonte e rolagem iguais.
        cifra: m.cifra || (m.letra ? serializeChordPro(parseChordsOverLyrics(m.letra, { detectTitle: false })) : null),
        letra: m.letra,
        audioUrl: m.audio_url,
        audioUrlExterno: m.audio_url_externo,
        youtubeUrl: m.youtube_url,
      };
    });
}
