"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdmin } from "@/lib/auth";
import {
  type ErrosIntegrante,
  type FuncaoPeriodo,
  diferencaFuncoes,
  esquemaFuncao,
  lerFuncoesMarcadas,
  mensagemErroIntegrante,
  prepararIntegrante,
} from "@/lib/equipe/formulario";
import { createClient } from "@/lib/supabase/server";

export interface EstadoIntegrante {
  erro?: string;
  erros?: ErrosIntegrante;
}

export async function salvarIntegrante(
  _anterior: EstadoIntegrante,
  formData: FormData,
): Promise<EstadoIntegrante> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "") || null;

  const aprovar = formData.get("aprovar") === "1";
  const preparo = prepararIntegrante({
    nome: String(formData.get("nome") ?? ""),
    email: String(formData.get("email") ?? ""),
    telefone: String(formData.get("telefone") ?? ""),
    papel: String(formData.get("papel") ?? ""),
    // Aprovar um cadastro novo já libera o acesso.
    ativo: aprovar || formData.get("ativo") === "on",
  });
  if (!preparo.ok) return { erro: "Confira os campos destacados.", erros: preparo.erros };

  const supabase = await createClient();
  const { data: funcoes } = await supabase.from("funcao").select("id").eq("igreja_id", ctx.igreja.id);
  const desejado = lerFuncoesMarcadas(formData.entries(), new Set((funcoes ?? []).map((f) => f.id)));

  let integranteId = id;
  let atual: FuncaoPeriodo[] = [];

  if (id) {
    const { error } = await supabase
      .from("integrante")
      .update(aprovar ? { ...preparo.dados, aprovado: true } : preparo.dados)
      .eq("id", id)
      .eq("igreja_id", ctx.igreja.id);
    if (error) return { erro: mensagemErroIntegrante(error) };
    const { data } = await supabase
      .from("integrante_funcao")
      .select("funcao_id, periodo")
      .eq("integrante_id", id);
    atual = (data ?? []).map((f) => ({ funcaoId: f.funcao_id, periodo: f.periodo }));
  } else {
    const { data, error } = await supabase
      .from("integrante")
      .insert({ ...preparo.dados, igreja_id: ctx.igreja.id })
      .select("id")
      .single();
    if (error) return { erro: mensagemErroIntegrante(error) };
    integranteId = data.id;
  }

  const { inserir, remover } = diferencaFuncoes(atual, desejado);
  for (const f of remover) {
    const { error } = await supabase
      .from("integrante_funcao")
      .delete()
      .eq("integrante_id", integranteId!)
      .eq("funcao_id", f.funcaoId)
      .eq("periodo", f.periodo);
    if (error) return { erro: `Dados salvos, mas falhou ao atualizar as funções: ${error.message}` };
  }
  if (inserir.length > 0) {
    const { error } = await supabase.from("integrante_funcao").insert(
      inserir.map((f) => ({
        igreja_id: ctx.igreja.id,
        integrante_id: integranteId!,
        funcao_id: f.funcaoId,
        periodo: f.periodo,
      })),
    );
    if (error) return { erro: `Dados salvos, mas falhou ao atualizar as funções: ${error.message}` };
  }

  revalidatePath("/equipe");
  revalidatePath("/");
  redirect("/equipe");
}

export async function excluirIntegrante(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (id === ctx.integranteId) redirect(`/equipe/${id}?erro=voce-mesmo`);

  const supabase = await createClient();
  const { error } = await supabase.from("integrante").delete().eq("id", id).eq("igreja_id", ctx.igreja.id);
  if (error) {
    redirect(`/equipe/${id}?erro=${/admin/i.test(error.message) ? "ultimo-lider" : "falha"}`);
  }
  revalidatePath("/equipe");
  redirect("/equipe");
}

// ---------------------------------------------------------------------------
// Funções (Bateria, Baixo, Vocal…)
// ---------------------------------------------------------------------------

function voltarFuncoes(erro?: string): never {
  revalidatePath("/equipe/funcoes");
  revalidatePath("/equipe");
  redirect(erro ? `/equipe/funcoes?erro=${erro}` : "/equipe/funcoes");
}

export async function salvarFuncao(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "") || null;
  const r = esquemaFuncao.safeParse({
    nome: formData.get("nome"),
    max_por_culto: formData.get("max_por_culto"),
    modo_padrao: formData.get("modo_padrao"),
  });
  if (!r.success) voltarFuncoes("invalida");

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("funcao")
      .update(r.data)
      .eq("id", id)
      .eq("igreja_id", ctx.igreja.id);
    if (error) voltarFuncoes(error.code === "23505" ? "repetida" : "falha");
  } else {
    const { data: ultima } = await supabase
      .from("funcao")
      .select("ordem")
      .eq("igreja_id", ctx.igreja.id)
      .order("ordem", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase
      .from("funcao")
      .insert({ ...r.data, igreja_id: ctx.igreja.id, ordem: (ultima?.ordem ?? 0) + 1 });
    if (error) voltarFuncoes(error.code === "23505" ? "repetida" : "falha");
  }
  voltarFuncoes();
}

export async function excluirFuncao(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase.from("funcao").delete().eq("id", id).eq("igreja_id", ctx.igreja.id);
  voltarFuncoes(error ? "falha" : undefined);
}

/** Sobe ou desce a função na ordem (troca com a vizinha). */
export async function moverFuncao(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const direcao = formData.get("direcao") === "cima" ? -1 : 1;

  const supabase = await createClient();
  const { data: funcoes } = await supabase
    .from("funcao")
    .select("id, ordem")
    .eq("igreja_id", ctx.igreja.id)
    .order("ordem")
    .order("nome");
  const lista = funcoes ?? [];
  const i = lista.findIndex((f) => f.id === id);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= lista.length) voltarFuncoes();

  // Renumera 1..n já com a troca, para não depender de ordens repetidas.
  [lista[i], lista[j]] = [lista[j], lista[i]];
  for (const [pos, f] of lista.entries()) {
    if (f.ordem !== pos + 1) {
      await supabase.from("funcao").update({ ordem: pos + 1 }).eq("id", f.id).eq("igreja_id", ctx.igreja.id);
    }
  }
  voltarFuncoes();
}

// ---------------------------------------------------------------------------
// Link de convite da equipe
// ---------------------------------------------------------------------------

export async function renovarConvite(): Promise<void> {
  const ctx = await exigirAdmin();
  const supabase = await createClient();
  await supabase.rpc("renovar_convite", { p_igreja: ctx.igreja.id });
  revalidatePath("/equipe");
  redirect("/equipe#convite");
}

export async function alternarConvite(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const ativo = formData.get("ativo") === "1";
  const supabase = await createClient();
  await supabase.from("igreja").update({ convite_ativo: ativo }).eq("id", ctx.igreja.id);
  revalidatePath("/equipe");
  redirect("/equipe#convite");
}

/** Recusa um cadastro feito pelo link (apaga o perfil pendente). */
export async function recusarCadastro(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from("integrante").delete().eq("id", id).eq("igreja_id", ctx.igreja.id).eq("aprovado", false);
  revalidatePath("/equipe");
  redirect("/equipe");
}
