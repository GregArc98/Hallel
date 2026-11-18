"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface EstadoConvite {
  erro?: string;
}

/** Cria o perfil pendente da pessoa (ou liga a um cadastro que o líder já fez com o e-mail dela). */
export async function entrarNaEquipe(_anterior: EstadoConvite, formData: FormData): Promise<EstadoConvite> {
  const codigo = String(formData.get("codigo") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome) return { erro: "Informe seu nome." };
  if (nome.length > 80) return { erro: "Nome muito longo." };
  if (telefone.length > 30) return { erro: "WhatsApp inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("entrar_na_equipe", {
    p_codigo: codigo,
    p_nome: nome,
    p_telefone: telefone,
  });
  if (error) {
    return {
      erro: /convite/i.test(error.message)
        ? "Este link de convite não vale mais. Peça o link novo ao líder."
        : "Não foi possível concluir o cadastro. Tente de novo.",
    };
  }
  redirect(data === "aprovado" ? "/" : "/aguardando");
}
