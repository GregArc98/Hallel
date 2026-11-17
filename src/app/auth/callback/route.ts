import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { caminhoSeguro } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Retorno do login:
 *  • ?code=…               → Google ou link mágico aberto no MESMO aparelho (PKCE)
 *  • ?token_hash=…&type=…  → link mágico com o modelo de e-mail do README (funciona em qualquer aparelho)
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
  return NextResponse.redirect(`${origin}${proximo}`);
}
