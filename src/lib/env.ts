/** Variáveis públicas (vão para o navegador). Falha cedo e com mensagem clara se faltarem. */
function obrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} não definida. Copie .env.example para .env.local e preencha.`,
    );
  }
  return valor;
}

export const SUPABASE_URL = obrigatoria(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);
export const SUPABASE_PUBLISHABLE_KEY = obrigatoria(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
/** Mostra o botão "Entrar com Google" (exige configurar o provedor no Supabase). */
export const LOGIN_GOOGLE = process.env.NEXT_PUBLIC_LOGIN_GOOGLE === "1";
