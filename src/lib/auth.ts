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
  /** Igrejas em que a pessoa é integrante aprovado e ativo. */
  vinculos: Vinculo[];
  /** Cadastros feitos pelo link da equipe, ainda aguardando o líder. */
  pendentes: Array<{ nome: string; igreja: string }>;
}

/** Usuário logado e seus vínculos com igrejas (null se não logado). Uma vez por requisição. */
export const getSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const { data: linhas, error } = await supabase
    .from("integrante")
    .select("id, nome, papel, ativo, aprovado, igreja:igreja!integrante_igreja_id_fkey (id, nome, slug)")
    .eq("usuario_id", claims.sub)
    .order("criado_em");
  if (error) throw new Error(`Falha ao carregar o cadastro: ${error.message}`);

  return {
    usuario: { id: claims.sub, email: typeof claims.email === "string" ? claims.email : null },
    pendentes: (linhas ?? [])
      .filter((l) => !l.aprovado)
      .map((l) => ({ nome: l.nome, igreja: l.igreja?.nome ?? "" })),
    vinculos: (linhas ?? [])
      .filter((l) => l.igreja && l.ativo && l.aprovado)
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
 * Contexto da pessoa logada na igreja atual, ou null (sem login ou sem cadastro).
 * A igreja atual vem do cookie (se a pessoa estiver em mais de uma) ou é a primeira.
 */
export const obterContexto = cache(async (): Promise<Contexto | null> => {
  const sessao = await getSessao();
  if (!sessao || sessao.vinculos.length === 0) return null;

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

/** Exige login e cadastro numa igreja. Redireciona para /entrar ou /sem-acesso. */
export async function exigirIntegrante(): Promise<Contexto> {
  const ctx = await obterContexto();
  if (ctx) return ctx;
  const sessao = await getSessao();
  if (!sessao) redirect("/entrar");
  redirect(sessao.pendentes.length > 0 ? "/aguardando" : "/sem-acesso");
}

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
