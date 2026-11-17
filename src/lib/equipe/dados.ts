import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";
import type { Periodo } from "./formulario";

export interface Funcao {
  id: string;
  nome: string;
  ordem: number;
  max_por_culto: number;
  modo_padrao: Enums<"modo_exibicao">;
}

export interface MembroEquipe {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  papel: Enums<"papel">;
  ativo: boolean;
  entrouNoApp: boolean;
  funcoes: Array<{ funcaoId: string; periodo: Periodo }>;
}

export async function carregarFuncoes(igrejaId: string): Promise<Funcao[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("funcao")
    .select("id, nome, ordem, max_por_culto, modo_padrao")
    .eq("igreja_id", igrejaId)
    .order("ordem")
    .order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function carregarEquipe(igrejaId: string, apenasId?: string): Promise<MembroEquipe[]> {
  const supabase = await createClient();
  let consulta = supabase
    .from("integrante")
    .select(
      "id, nome, email, telefone, papel, ativo, usuario_id, integrante_funcao!integrante_funcao_integrante_id_igreja_id_fkey (funcao_id, periodo)",
    )
    .eq("igreja_id", igrejaId)
    .order("nome");
  if (apenasId) consulta = consulta.eq("id", apenasId);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return (data ?? []).map((i) => ({
    id: i.id,
    nome: i.nome,
    email: i.email,
    telefone: i.telefone,
    papel: i.papel,
    ativo: i.ativo,
    entrouNoApp: i.usuario_id !== null,
    funcoes: i.integrante_funcao.map((f) => ({ funcaoId: f.funcao_id, periodo: f.periodo })),
  }));
}

/** "Bateria", "Baixo (manhã)", "Vocal (noite)" — na ordem das funções. */
export function resumoFuncoes(membro: MembroEquipe, funcoes: Funcao[]): string[] {
  return funcoes.flatMap((f) => {
    const periodos = membro.funcoes.filter((x) => x.funcaoId === f.id).map((x) => x.periodo);
    if (periodos.length === 0) return [];
    if (periodos.length === 2) return [f.nome];
    return [`${f.nome} (${periodos[0] === "manha" ? "manhã" : "noite"})`];
  });
}
