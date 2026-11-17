/**
 * Regras da escala (puras): leitura do formulário, diferença com o que está salvo
 * e alertas de conflito.
 */
export type Periodo = "manha" | "noite";

export interface Vaga {
  funcaoId: string;
  posicao: number;
  integranteId: string;
}

export function chaveVaga(funcaoId: string, posicao: number): string {
  return `vaga:${funcaoId}:${posicao}`;
}

/**
 * Lê as vagas preenchidas do formulário ("vaga:<funcao>:<posicao>" = integrante).
 * Ignora funções/integrantes desconhecidos e posições acima do limite da função.
 */
export function lerVagas(
  campos: Iterable<[string, unknown]>,
  limites: Map<string, number>,
  integrantesValidos: Set<string>,
): Vaga[] {
  const vagas: Vaga[] = [];
  for (const [chave, valor] of campos) {
    const m = /^vaga:([0-9a-f-]{36}):(\d{1,2})$/i.exec(chave);
    if (!m || typeof valor !== "string" || !valor) continue;
    const posicao = Number(m[2]);
    const limite = limites.get(m[1]);
    if (!limite || posicao < 1 || posicao > limite || !integrantesValidos.has(valor)) continue;
    vagas.push({ funcaoId: m[1], posicao, integranteId: valor });
  }
  return compactar(vagas);
}

/** Remove buracos: se a vaga 1 ficou vazia e a 2 tem alguém, a pessoa sobe para a 1. */
export function compactar(vagas: Vaga[]): Vaga[] {
  const porFuncao = new Map<string, Vaga[]>();
  for (const v of vagas) porFuncao.set(v.funcaoId, [...(porFuncao.get(v.funcaoId) ?? []), v]);
  return [...porFuncao.values()].flatMap((lista) =>
    lista
      .sort((a, b) => a.posicao - b.posicao)
      .map((v, i) => ({ ...v, posicao: i + 1 })),
  );
}

/** O que mudar no banco: vagas a remover e vagas a gravar (inserir ou trocar a pessoa). */
export function diferencaVagas(atual: Vaga[], desejado: Vaga[]) {
  const k = (v: Vaga) => `${v.funcaoId}:${v.posicao}`;
  const atualPorVaga = new Map(atual.map((v) => [k(v), v]));
  const desejadoPorVaga = new Map(desejado.map((v) => [k(v), v]));
  return {
    remover: atual.filter((v) => !desejadoPorVaga.has(k(v))),
    gravar: desejado.filter((v) => atualPorVaga.get(k(v))?.integranteId !== v.integranteId),
  };
}

export interface Indisponibilidade {
  integranteId: string;
  data: string;
  periodo: Periodo | null; // null = o dia todo
}

export function estaIndisponivel(
  integranteId: string,
  data: string,
  periodo: Periodo,
  lista: Indisponibilidade[],
): boolean {
  return lista.some(
    (i) => i.integranteId === integranteId && i.data === data && (i.periodo === null || i.periodo === periodo),
  );
}

export interface CultoParaAnalise {
  id: string;
  data: string;
  periodo: Periodo;
  vagas: Vaga[];
}

export interface Alertas {
  /** Funções sem ninguém. */
  funcoesVazias: string[];
  /** Pessoa em mais de uma função no mesmo culto. */
  repetidos: string[];
  /** Escalado em data marcada como indisponível. */
  indisponiveis: string[];
  /** Escalado em outro culto na mesma data e período. */
  outroCulto: string[];
}

export function analisarCulto(
  culto: CultoParaAnalise,
  funcoes: Array<{ id: string }>,
  indisponibilidades: Indisponibilidade[],
  outrosCultos: CultoParaAnalise[],
): Alertas {
  const pessoas = culto.vagas.map((v) => v.integranteId);
  const contagem = new Map<string, number>();
  for (const p of pessoas) contagem.set(p, (contagem.get(p) ?? 0) + 1);

  const noMesmoHorario = new Set(
    outrosCultos
      .filter((c) => c.id !== culto.id && c.data === culto.data && c.periodo === culto.periodo)
      .flatMap((c) => c.vagas.map((v) => v.integranteId)),
  );

  const unicos = [...new Set(pessoas)];
  return {
    funcoesVazias: funcoes.filter((f) => !culto.vagas.some((v) => v.funcaoId === f.id)).map((f) => f.id),
    repetidos: unicos.filter((p) => (contagem.get(p) ?? 0) > 1),
    indisponiveis: unicos.filter((p) => estaIndisponivel(p, culto.data, culto.periodo, indisponibilidades)),
    outroCulto: unicos.filter((p) => noMesmoHorario.has(p)),
  };
}

/** Quantas vezes cada pessoa foi escalada (para o rodízio). */
export function contarEscalas(cultos: CultoParaAnalise[]): Map<string, number> {
  const contagem = new Map<string, number>();
  for (const c of cultos) {
    for (const p of new Set(c.vagas.map((v) => v.integranteId))) {
      contagem.set(p, (contagem.get(p) ?? 0) + 1);
    }
  }
  return contagem;
}
