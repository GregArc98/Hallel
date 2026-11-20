import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { dadosDoCadastro } from "@/lib/acesso/senha";
import { caminhoSeguro } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Cliente = Awaited<ReturnType<typeof createClient>>;

/**
 * Conta criada pelo link da equipe: com o e-mail confirmado, envia o pedido de entrada
 * (nome e WhatsApp guardados no cadastro). Devolve para onde seguir, ou null se não se aplica.
 */
async function concluirConvite(supabase: Cliente): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  const cadastro = dadosDoCadastro(data.user?.user_metadata);
  if (!data.user || !cadastro.convite || !cadastro.nome) return null;
  // Já tem cadastro (pendente ou aprovado): nada a fazer — e não sobrescreve dados editados depois.
  const { count } = await supabase
    .from("integrante")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", data.user.id);
  if (count) return null;
  const { data: resultado, error } = await supabase.rpc("entrar_na_equipe", {
    p_codigo: cadastro.convite,
    p_nome: cadastro.nome,
    p_telefone: cadastro.telefone ?? "",
  });
  if (error) return `/convite/${cadastro.convite}`; // a página mostra o formulário (com os dados) e o motivo
  return resultado === "aprovado" ? "/" : "/aguardando";
}

/**
 * Retorno dos e-mails e do Google:
 *  • ?token_hash=…&type=…  → confirmação de cadastro ou nova senha, com os modelos de e-mail
 *                             do README (funciona em qualquer aparelho)
 *  • ?code=…               → Google, ou e-mail com o modelo padrão aberto no MESMO aparelho (PKCE)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const proximo = caminhoSeguro(searchParams.get("proximo"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let erro: string | null = null;

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) erro = "link";
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) erro = "link";
  } else {
    erro = searchParams.get("error_description") ? "provedor" : "link";
  }

  if (erro) {
    return NextResponse.redirect(`${origin}/entrar?erro=${erro}`);
  }
  if (type !== "recovery") {
    const destino = await concluirConvite(supabase);
    if (destino) return NextResponse.redirect(`${origin}${destino}`);
  }
  return NextResponse.redirect(`${origin}${proximo}`);
}
