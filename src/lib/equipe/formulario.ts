/**
 * Regras do cadastro de integrantes (puro: usado no servidor e nos testes).
 */
import { z } from "zod";

export type Periodo = "manha" | "noite";
export const PERIODOS: Periodo[] = ["manha", "noite"];
export const NOME_PERIODO: Record<Periodo, string> = { manha: "Manhã", noite: "Noite" };

/** Chave de uma caixinha da grade função × período no formulário. */
export function chaveFuncao(funcaoId: string, periodo: Periodo): string {
  return `funcao:${funcaoId}:${periodo}`;
}

export interface FuncaoPeriodo {
  funcaoId: string;
  periodo: Periodo;
}

/** Lê as caixinhas marcadas (só aceita funções conhecidas). */
export function lerFuncoesMarcadas(
  campos: Iterable<[string, unknown]>,
  funcoesValidas: Set<string>,
): FuncaoPeriodo[] {
  const marcadas = new Map<string, FuncaoPeriodo>();
  for (const [chave] of campos) {
    const m = /^funcao:([0-9a-f-]{36}):(manha|noite)$/i.exec(chave);
    if (m && funcoesValidas.has(m[1])) {
      marcadas.set(chave, { funcaoId: m[1], periodo: m[2] as Periodo });
    }
  }
  return [...marcadas.values()];
}

/** O que inserir e o que remover para a grade ficar como a desejada. */
export function diferencaFuncoes(atual: FuncaoPeriodo[], desejado: FuncaoPeriodo[]) {
  const k = (f: FuncaoPeriodo) => `${f.funcaoId}:${f.periodo}`;
  const atualSet = new Set(atual.map(k));
  const desejadoSet = new Set(desejado.map(k));
  return {
    inserir: desejado.filter((f) => !atualSet.has(k(f))),
    remover: atual.filter((f) => !desejadoSet.has(k(f))),
  };
}

export const esquemaIntegrante = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(80, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .transform((v) => (v === "" ? null : v))
    .refine((v) => v === null || z.email().safeParse(v).success, "E-mail inválido"),
  telefone: z
    .string()
    .trim()
    .max(30, "Telefone muito longo")
    .transform((v) => (v === "" ? null : v)),
  papel: z.enum(["admin", "membro"], { message: "Escolha o papel" }),
  ativo: z.boolean(),
});

export type DadosIntegrante = z.output<typeof esquemaIntegrante>;
export type ErrosIntegrante = Partial<Record<keyof DadosIntegrante, string>>;

export function prepararIntegrante(entrada: {
  nome: string;
  email: string;
  telefone: string;
  papel: string;
  ativo: boolean;
}): { ok: true; dados: DadosIntegrante } | { ok: false; erros: ErrosIntegrante } {
  const r = esquemaIntegrante.safeParse(entrada);
  if (r.success) return { ok: true, dados: r.data };
  const erros: ErrosIntegrante = {};
  for (const issue of r.error.issues) {
    const campo = issue.path[0] as keyof DadosIntegrante;
    erros[campo] ??= issue.message;
  }
  return { ok: false, erros };
}

/** Mensagem amigável para erros do banco ao salvar integrante. */
export function mensagemErroIntegrante(erro: { code?: string; message: string }): string {
  if (erro.code === "23505") return "Já existe alguém da equipe com esse e-mail.";
  if (/pelo menos um admin/i.test(erro.message)) {
    return "A equipe precisa ter pelo menos um líder ativo. Promova outra pessoa antes.";
  }
  return `Não foi possível salvar: ${erro.message}`;
}

export const esquemaFuncao = z.object({
  nome: z.string().trim().min(1, "Informe o nome").max(40, "Nome muito longo"),
  max_por_culto: z.coerce
    .number({ message: "Número inválido" })
    .int("Número inválido")
    .min(1, "Mínimo 1")
    .max(10, "Máximo 10"),
  modo_padrao: z.enum(["cifra", "letra"]),
});

/** "hoje", "ontem", "há 5 dias", "há 2 meses" — para o último acesso. */
export function tempoDesde(iso: string, agora = new Date()): string {
  const dias = Math.floor((agora.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}
