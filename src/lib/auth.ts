import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import type { Enums } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Camada de acesso à sessão (Data Access Layer).
 * Toda tela/ação que precisa saber "quem é e de qual igreja" passa por aqui.
 */

export const COOKIE_IGREJA = "hallel-igreja";

export interface Vinculo {
  integranteId: string;
  nome: string;
  papel: Enums<"papel">;
  igreja: { id: string; nome: string; slug: string };
}

export interface Sessao {
  usuario: { id: string; email: string | null };
  vinculos: Vinculo[];
}

/** Usuário logado e seus vínculos com igrejas (null se não logado). Uma vez por requisição. */
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: linhas, error } = await supabase
    .from("integrante")
    .select("id, nome, papel, igreja:igreja!integrante_igreja_id_fkey (id, nome, slug)")
    .eq("usuario_id", claims.sub)
    .eq("ativo", true)
    .order("criado_em");
  if (error) throw new Error(`Falha ao carregar o cadastro: ${error.message}`);

  return {
    usuario: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null },
    vinculos: (linhas ?? [])
      .filter((l) => l.igreja)
      .map((l) => ({
        integranteId: l.id,
        nome: l.nome,
        papel: l.papel,
        igreja: l.igreja!,
      })),
  };
});

export interface Contexto extends Vinculo {
  usuario: Sessao["usuario"];
  admin: boolean;
  /** Todas as igrejas da pessoa (o seletor só aparece se houver mais de uma). */
  vinculos: Vinculo[];
}

/**
 * Exige login e cadastro numa igreja. Redireciona para /entrar ou /sem-acesso.
 * A igreja atual vem do cookie (se a pessoa estiver em mais de uma) ou é a primeira.
 */
export const exigirIntegrante = cache(async (): Promise<Contexto> => {
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  if (sessao.vinculos.length === 0) redirect("/sem-acesso");

  const preferida = (await cookies()).get(COOKIE_IGREJA)?.value;
  const atual =
    sessao.vinculos.find((v) => v.igreja.id === preferida) ?? sessao.vinculos[0];

  return {
    ...atual,
    usuario: sessao.usuario,
    admin: atual.papel === "admin",
    vinculos: sessao.vinculos,
  };
});

/** Para telas e ações só de admin. */
export async function exigirAdmin(): Promise<Contexto> {
  const ctx = await exigirIntegrante();
  if (!ctx.admin) redirect("/");
  return ctx;
}

/** Aceita só caminhos internos ("/algo"), evitando redirecionamento para outro site. */
export function caminhoSeguro(valor: string | null | undefined, padrao = "/"): string {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//") || valor.startsWith("/\\")) {
    return padrao;
  }
  return valor;
}
