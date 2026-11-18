"use server";

import { revalidatePath } from "next/cache";

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
