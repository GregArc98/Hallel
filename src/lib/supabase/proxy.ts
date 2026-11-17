import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "./database.types";

/** Rotas abertas (sem login). */
const ROTAS_PUBLICAS = ["/entrar", "/auth", "/demo"];

function ehPublica(pathname: string) {
  return ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Renova a sessão do Supabase a cada requisição (cookies) e manda para /entrar
 * quem não está logado. É só uma checagem otimista: a autorização de verdade
 * acontece no servidor (getSessao) e no banco (RLS).
 */
export async function atualizarSessao(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Não colocar código entre a criação do cliente e getClaims(): é ele que renova o token.
  const { data } = await supabase.auth.getClaims();
  const logado = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  if (!logado && !ehPublica(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("proximo", pathname + search);
    const redirect = NextResponse.redirect(url);
    // Mantém cookies de sessão eventualmente limpos/renovados.
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return redirect;
  }

  return response;
}
