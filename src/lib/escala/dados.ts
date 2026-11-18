import "server-only";

import { carregarEquipe, carregarFuncoes } from "@/lib/equipe/dados";
import { createClient } from "@/lib/supabase/server";
import { type Mes, primeiroEUltimoDia } from "./datas";
import type { CultoParaAnalise, Indisponibilidade, Periodo } from "./regras";

export interface Culto extends CultoParaAnalise {
  tipo: "regular" | "avulso";
  titulo: string | null;
  horario: string | null;
  escalaPublicada: boolean;
}

const SELECT_CULTO =
  "id, data, periodo, tipo, titulo, horario, escala_publicada, escala_item!escala_item_culto_id_igreja_id_fkey (funcao_id, posicao, integrante_id)";

type LinhaCulto = {
  id: string;
  data: string;
  periodo: Periodo;
  tipo: "regular" | "avulso";
  titulo: string | null;
  horario: string | null;
  escala_publicada: boolean;
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
