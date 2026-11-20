"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { exigirAdmin, exigirIntegrante } from "@/lib/auth";
import { avisarEscalaPublicada, avisarRepertorioPublicado } from "@/lib/avisos/publicacao";
import { carregarFuncoes } from "@/lib/equipe/dados";
import { carregarCulto } from "@/lib/escala/dados";
import { chaveMes, domingosDoMes, lerMes, mesDaData, primeiroEUltimoDia } from "@/lib/escala/datas";
import { diferencaVagas, lerVagas } from "@/lib/escala/regras";
import { esquemaRepertorio } from "@/lib/repertorio/regras";
import { createClient } from "@/lib/supabase/server";

function revalidarEscala() {
  revalidatePath("/escala", "layout");
  revalidatePath("/");
  revalidatePath("/disponibilidade");
}

/** Cria os cultos de domingo (manhã e noite) que ainda não existem no mês. */
export async function gerarDomingos(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const mes = lerMes(String(formData.get("mes") ?? ""), "");
  const [de, ate] = primeiroEUltimoDia(mes);
  const supabase = await createClient();

  const { data: existentes } = await supabase
    .from("culto")
    .select("data, periodo")
    .eq("igreja_id", ctx.igreja.id)
    .eq("tipo", "regular")
    .gte("data", de)
    .lte("data", ate);
  const jaTem = new Set((existentes ?? []).map((c) => `${c.data}:${c.periodo}`));

  const novos = domingosDoMes(mes).flatMap((data) =>
    (["manha", "noite"] as const)
      .filter((periodo) => !jaTem.has(`${data}:${periodo}`))
      .map((periodo) => ({ igreja_id: ctx.igreja.id, data, periodo, tipo: "regular" as const })),
  );
  if (novos.length > 0) {
    const { error } = await supabase.from("culto").insert(novos);
    if (error) redirect(`/escala?mes=${chaveMes(mes)}&erro=gerar`);
  }
  revalidarEscala();
  redirect(`/escala?mes=${chaveMes(mes)}`);
}

const esquemaCulto = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha a data"),
  periodo: z.enum(["manha", "noite"], { message: "Escolha o período" }),
  titulo: z
    .string()
    .trim()
    .max(80, "Título muito longo")
    .transform((v) => v || null),
  horario: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{2}:\d{2}$/.test(v), "Horário inválido")
    .transform((v) => v || null),
});

export interface EstadoCulto {
  erro?: string;
}

export async function criarCulto(_anterior: EstadoCulto, formData: FormData): Promise<EstadoCulto> {
  const ctx = await exigirAdmin();
  const r = esquemaCulto.safeParse(Object.fromEntries(formData));
  if (!r.success) return { erro: r.error.issues[0].message };
  const regular = formData.get("tipo") === "regular";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("culto")
    .insert({ ...r.data, igreja_id: ctx.igreja.id, tipo: regular ? "regular" : "avulso" })
    .select("id")
    .single();
  if (error) {
    return {
      erro:
        error.code === "23505"
          ? "Já existe um culto de domingo nessa data e período. Para um evento extra, desmarque \"culto regular\"."
          : `Não foi possível criar: ${error.message}`,
    };
  }
  revalidarEscala();
  redirect(`/escala/${data.id}`);
}

export async function salvarDetalhesCulto(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const r = esquemaCulto.pick({ titulo: true, horario: true }).safeParse(Object.fromEntries(formData));
  if (!r.success) redirect(`/escala/${id}?erro=detalhes`);
  const supabase = await createClient();
  await supabase.from("culto").update(r.data).eq("id", id).eq("igreja_id", ctx.igreja.id);
  revalidarEscala();
  redirect(`/escala/${id}?ok=detalhes`);
}

export interface EstadoEscala {
  erro?: string;
  ok?: boolean;
}

/** Salva todas as vagas do culto de uma vez. */
export async function salvarEscala(_anterior: EstadoEscala, formData: FormData): Promise<EstadoEscala> {
  const ctx = await exigirAdmin();
  const cultoId = String(formData.get("culto_id") ?? "");
  const culto = await carregarCulto(ctx.igreja.id, cultoId);
  if (!culto) return { erro: "Culto não encontrado." };

  const supabase = await createClient();
  const [funcoes, { data: integrantes }] = await Promise.all([
    carregarFuncoes(ctx.igreja.id),
    supabase.from("integrante").select("id").eq("igreja_id", ctx.igreja.id),
  ]);
  const desejado = lerVagas(
    formData.entries(),
    new Map(funcoes.map((f) => [f.id, f.max_por_culto])),
    new Set((integrantes ?? []).map((i) => i.id)),
  );
  const { remover, gravar } = diferencaVagas(culto.vagas, desejado);

  for (const v of remover) {
    const { error } = await supabase
      .from("escala_item")
      .delete()
      .eq("culto_id", cultoId)
      .eq("funcao_id", v.funcaoId)
      .eq("posicao", v.posicao);
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  }
  if (gravar.length > 0) {
    const { error } = await supabase.from("escala_item").upsert(
      gravar.map((v) => ({
        igreja_id: ctx.igreja.id,
        culto_id: cultoId,
        funcao_id: v.funcaoId,
        posicao: v.posicao,
        integrante_id: v.integranteId,
      })),
      { onConflict: "culto_id,funcao_id,posicao" },
    );
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  }

  revalidarEscala();
  return { ok: true };
}

export async function publicarCulto(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const publicar = formData.get("publicar") === "1";
  const supabase = await createClient();
  const { data: mudou } = await supabase
    .from("culto")
    .update({ escala_publicada: publicar })
    .eq("id", id)
    .eq("igreja_id", ctx.igreja.id)
    .eq("escala_publicada", !publicar)
    .select("id");
  if (publicar && formData.get("avisar") === "1") await avisarEscalaPublicada(ctx, (mudou ?? []).map((c) => c.id));
  revalidarEscala();
  redirect(String(formData.get("voltar") ?? "") === "mes" ? `/escala?mes=${formData.get("mes")}` : `/escala/${id}`);
}

/** Publica (ou volta para rascunho) a escala de todos os cultos do mês. */
export async function publicarMes(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const mes = lerMes(String(formData.get("mes") ?? ""), "");
  const publicar = formData.get("publicar") === "1";
  const [de, ate] = primeiroEUltimoDia(mes);
  const supabase = await createClient();
  const { data: mudaram } = await supabase
    .from("culto")
    .update({ escala_publicada: publicar })
    .eq("igreja_id", ctx.igreja.id)
    .gte("data", de)
    .lte("data", ate)
    .eq("escala_publicada", !publicar)
    .select("id");
  if (publicar && formData.get("avisar") === "1") await avisarEscalaPublicada(ctx, (mudaram ?? []).map((c) => c.id));
  revalidarEscala();
  redirect(`/escala?mes=${chaveMes(mes)}`);
}

export async function excluirCulto(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data } = await supabase
    .from("culto")
    .delete()
    .eq("id", id)
    .eq("igreja_id", ctx.igreja.id)
    .select("data")
    .maybeSingle();
  revalidarEscala();
  redirect(data ? `/escala?mes=${chaveMes(mesDaData(data.data))}` : "/escala");
}

/**
 * Marca/desmarca "não posso" num período. Um registro de dia todo (periodo nulo)
 * vira o período que continua indisponível.
 */
export async function alternarIndisponibilidade(formData: FormData): Promise<void> {
  const ctx = await exigirIntegrante();
  const data = String(formData.get("data") ?? "");
  const periodo = formData.get("periodo") === "manha" ? "manha" : "noite";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) redirect("/disponibilidade");

  const supabase = await createClient();
  const { data: registros } = await supabase
    .from("indisponibilidade")
    .select("id, periodo")
    .eq("integrante_id", ctx.integranteId)
    .eq("data", data);
  const lista = registros ?? [];
  const diaTodo = lista.find((r) => r.periodo === null);
  const desse = lista.find((r) => r.periodo === periodo);

  if (diaTodo) {
    await supabase.from("indisponibilidade").delete().eq("id", diaTodo.id);
    await supabase.from("indisponibilidade").insert({
      igreja_id: ctx.igreja.id,
      integrante_id: ctx.integranteId,
      data,
      periodo: periodo === "manha" ? "noite" : "manha",
    });
  } else if (desse) {
    await supabase.from("indisponibilidade").delete().eq("id", desse.id);
  } else {
    await supabase
      .from("indisponibilidade")
      .insert({ igreja_id: ctx.igreja.id, integrante_id: ctx.integranteId, data, periodo });
  }
  revalidarEscala();
  redirect(`/disponibilidade#d-${data}`);
}

export interface EstadoRepertorio {
  erro?: string;
  ok?: boolean;
}

/** Salva o repertório inteiro (ordem, tom, observações) numa única transação no banco. */
export async function salvarRepertorio(
  _anterior: EstadoRepertorio,
  formData: FormData,
): Promise<EstadoRepertorio> {
  await exigirAdmin();
  const cultoId = String(formData.get("culto_id") ?? "");
  let itens: unknown;
  try {
    itens = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    return { erro: "Repertório inválido." };
  }
  const r = esquemaRepertorio.safeParse({ itens, observacoes: String(formData.get("observacoes") ?? "") });
  if (!r.success) return { erro: r.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.rpc("salvar_repertorio", {
    p_culto: cultoId,
    p_itens: r.data.itens,
    p_observacoes: r.data.observacoes,
  });
  if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  revalidarEscala();
  revalidatePath(`/culto/${cultoId}`);
  return { ok: true };
}

export async function publicarRepertorio(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const publicar = formData.get("publicar") === "1";
  const supabase = await createClient();
  const { data: mudou } = await supabase
    .from("culto")
    .update({ repertorio_publicado: publicar })
    .eq("id", id)
    .eq("igreja_id", ctx.igreja.id)
    .eq("repertorio_publicado", !publicar)
    .select("id");
  if (publicar && mudou?.length && formData.get("avisar") === "1") await avisarRepertorioPublicado(ctx, id);
  revalidarEscala();
  revalidatePath(`/culto/${id}`);
  redirect(`/escala/${id}/repertorio`);
}
