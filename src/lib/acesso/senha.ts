/**
 * Regras do login com e-mail e senha (sem dependências, testadas).
 */

export const SENHA_MINIMA = 8;
/** Limite do bcrypt usado pelo Supabase. */
export const SENHA_MAXIMA = 72;

/** Problema com a senha digitada (ou com a repetição dela), ou null se está boa. */
export function problemaNaSenha(senha: string, repetida?: string): string | null {
  if (senha.length < SENHA_MINIMA) return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
  if (senha.length > SENHA_MAXIMA) return `A senha pode ter no máximo ${SENHA_MAXIMA} caracteres.`;
  if (repetida !== undefined && senha !== repetida) return "As duas senhas não são iguais.";
  return null;
}

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type MomentoDoAcesso = "entrar" | "cadastro" | "recuperar" | "nova-senha";

interface ErroDoSupabase {
  code?: string;
  status?: number;
  message?: string;
}

/** Versões antigas do Supabase Auth mandam só a mensagem em inglês, sem o código. */
function codigoPelaMensagem(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return "invalid_credentials";
  if (/email not confirmed/i.test(mensagem)) return "email_not_confirmed";
  if (/already registered/i.test(mensagem)) return "user_already_exists";
  if (/should be different/i.test(mensagem)) return "same_password";
  return "";
}

/** Mensagem em português (para qualquer idade) para um erro do Supabase Auth. */
export function mensagemDoErro(erro: ErroDoSupabase, momento: MomentoDoAcesso): string {
  const codigo = erro.code || codigoPelaMensagem(erro.message ?? "");
  if (erro.status === 429 || codigo.startsWith("over_"))
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  switch (codigo) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos. Se esqueceu a senha, toque em “Esqueci minha senha”.";
    case "email_not_confirmed":
      return "Falta confirmar seu e-mail: abra a mensagem que enviamos e toque no botão dela.";
    case "weak_password":
      return `Senha fraca. Use pelo menos ${SENHA_MINIMA} caracteres, misturando letras e números.`;
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    case "user_already_exists":
    case "email_exists":
      return "Este e-mail já tem conta. Entre com sua senha.";
    case "email_address_invalid":
      return "Confira o e-mail: ele parece estar incorreto.";
    case "signup_disabled":
      return "Novos cadastros estão desativados no momento. Fale com o líder.";
  }
  switch (momento) {
    case "entrar":
      return "Não foi possível entrar. Confira os dados e tente de novo.";
    case "cadastro":
      return "Não foi possível criar sua conta. Tente de novo.";
    case "recuperar":
      return "Não foi possível enviar o e-mail. Confira o endereço e tente de novo.";
    case "nova-senha":
      return "Não foi possível salvar a nova senha. Tente de novo.";
  }
}

/** Dados guardados na conta no cadastro pelo convite (para concluir a entrada na equipe). */
export interface DadosDoCadastro {
  nome?: string;
  telefone?: string;
  convite?: string;
}

export function dadosDoCadastro(metadados: unknown): DadosDoCadastro {
  if (!metadados || typeof metadados !== "object") return {};
  const m = metadados as Record<string, unknown>;
  const texto = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const convite = texto(m.convite);
  return {
    nome: texto(m.nome),
    telefone: texto(m.telefone),
    convite: convite && /^[A-Za-z0-9]{8,64}$/.test(convite) ? convite : undefined,
  };
}
