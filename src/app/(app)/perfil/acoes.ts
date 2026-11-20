"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { exigirIntegrante } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface EstadoPerfil {
  erro?: string;
  ok?: boolean;
}

/** Cada pessoa edita o próprio nome e WhatsApp. */
export async function atualizarMeuPerfil(_anterior: EstadoPerfil, formData: FormData): Promise<EstadoPerfil> {
  const ctx = await exigirIntegrante();
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome) return { erro: "Informe seu nome." };
  if (nome.length > 80 || telefone.length > 30) return { erro: "Confira o nome e o WhatsApp." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("atualizar_meu_perfil", {
    p_igreja: ctx.igreja.id,
    p_nome: nome,
    p_telefone: telefone,
  });
  if (error) return { erro: "Não foi possível salvar. Tente de novo." };
  revalidatePath("/", "layout");
  return { ok: true };
}

const esquemaInscricao = z.object({
  endpoint: z.string().url().startsWith("https://").max(1000),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});

/** Guarda a inscrição de avisos deste aparelho. "ocupada" = o aparelho já está ligado a outra conta. */
export async function salvarInscricaoPush(inscricao: unknown): Promise<"ok" | "ocupada" | "erro"> {
  await exigirIntegrante();
  const r = esquemaInscricao.safeParse(inscricao);
  if (!r.success) return "erro";
  const supabase = await createClient();
  const { error } = await supabase
    .from("inscricao_push")
    .upsert({ endpoint: r.data.endpoint, p256dh: r.data.keys.p256dh, auth: r.data.keys.auth }, { onConflict: "endpoint" });
  if (!error) return "ok";
  // Chave repetida que não é desta conta (aparelho usado por outra pessoa antes).
  return error.code === "23505" || error.code === "42501" ? "ocupada" : "erro";
}

export async function removerInscricaoPush(endpoint: string): Promise<void> {
  await exigirIntegrante();
  const supabase = await createClient();
  await supabase.from("inscricao_push").delete().eq("endpoint", endpoint);
}

export async function definirAvisosEmail(ativo: boolean): Promise<boolean> {
  const ctx = await exigirIntegrante();
  const supabase = await createClient();
  const { error } = await supabase.rpc("definir_avisos_email", { p_igreja: ctx.igreja.id, p_ativo: ativo });
  revalidatePath("/perfil");
  return !error;
}
