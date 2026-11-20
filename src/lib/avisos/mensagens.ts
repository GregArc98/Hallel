/**
 * Textos dos avisos (celular, e-mail e WhatsApp) — sem dependências de servidor, testados.
 */
import { NOME_PERIODO, dataCurta } from "@/lib/escala/datas";

export interface CultoDoAviso {
  id: string;
  data: string;
  periodo: "manha" | "noite";
  titulo: string | null;
  horario: string | null;
}

/** Uma pessoa escalada numa função de um culto (vem de avisos_destinatarios). */
export interface Escalacao {
  integranteId: string;
  nome: string;
  email: string | null;
  cultoId: string;
  funcao: string;
  ordem: number;
}

export interface Aviso {
  integranteId: string;
  nome: string;
  email: string | null;
  /** Notificação do celular. */
  titulo: string;
  corpo: string;
  /** Caminho aberto ao tocar (relativo ao app). */
  url: string;
  /** E-mail (texto simples). */
  assunto: string;
  texto: string;
}

/** "a", "a e b", "a, b e c" */
export function listaPt(itens: string[]): string {
  if (itens.length <= 1) return itens.join("");
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

/** "Dom 15/11 · Noite (19:30) — Santa Ceia" */
export function rotuloCulto(c: Pick<CultoDoAviso, "data" | "periodo" | "titulo" | "horario">): string {
  const hora = c.horario ? ` (${c.horario.slice(0, 5)})` : "";
  const titulo = c.titulo ? ` — ${c.titulo}` : "";
  return `${dataCurta(c.data)} · ${NOME_PERIODO[c.periodo]}${hora}${titulo}`;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function rodapeEmail(base: string): string {
  return `\n\n—\nHallel · ${base}\nPara não receber estes e-mails, desligue em Perfil → Avisos.`;
}

function agruparPorPessoa(escalacoes: Escalacao[]) {
  const pessoas = new Map<string, { nome: string; email: string | null; porCulto: Map<string, Escalacao[]> }>();
  for (const e of escalacoes) {
    const p = pessoas.get(e.integranteId) ?? { nome: e.nome, email: e.email, porCulto: new Map() };
    const doCulto = p.porCulto.get(e.cultoId) ?? [];
    doCulto.push(e);
    p.porCulto.set(e.cultoId, doCulto);
    pessoas.set(e.integranteId, p);
  }
  return pessoas;
}

function funcoesDe(lista: Escalacao[]): string {
  return listaPt([...new Set([...lista].sort((a, b) => a.ordem - b.ordem).map((e) => e.funcao))]);
}

/** Um aviso por pessoa com os cultos em que foi escalada (escala publicada). */
export function avisosDeEscala(cultos: CultoDoAviso[], escalacoes: Escalacao[], base: string): Aviso[] {
  const porId = new Map(cultos.map((c) => [c.id, c]));
  const ordenados = (ids: Iterable<string>) =>
    [...ids].filter((id) => porId.has(id)).sort((a, b) => {
      const ca = porId.get(a)!;
      const cb = porId.get(b)!;
      return ca.data.localeCompare(cb.data) || ca.periodo.localeCompare(cb.periodo);
    });

  const avisos: Aviso[] = [];
  for (const [integranteId, p] of agruparPorPessoa(escalacoes)) {
    const ids = ordenados(p.porCulto.keys());
    if (ids.length === 0) continue;
    const linhas = ids.map((id) => `${rotuloCulto(porId.get(id)!)}: ${funcoesDe(p.porCulto.get(id)!)}`);
    const unico = ids.length === 1;
    const url = unico ? `/culto/${ids[0]}` : "/";
    avisos.push({
      integranteId,
      nome: p.nome,
      email: p.email,
      titulo: unico ? "Você está na escala" : `Você está na escala de ${ids.length} cultos`,
      corpo: linhas.join("\n"),
      url,
      assunto: unico ? `Escala: ${rotuloCulto(porId.get(ids[0])!)}` : "Sua escala no louvor",
      texto:
        `Olá, ${primeiroNome(p.nome)}!\n\nA escala do louvor foi publicada e você está em:\n\n` +
        linhas.map((l) => `• ${l}`).join("\n") +
        `\n\nVeja os detalhes no Hallel: ${base}${url}` +
        rodapeEmail(base),
    });
  }
  return avisos;
}

/** Um aviso por pessoa escalada no culto, com as músicas do repertório. */
export function avisosDeRepertorio(
  culto: CultoDoAviso,
  musicas: Array<{ titulo: string; tom: string | null }>,
  escalacoes: Escalacao[],
  base: string,
): Aviso[] {
  const rotulo = rotuloCulto(culto);
  const nomes = musicas.map((m) => m.titulo);
  const resumo = nomes.length > 3 ? `${nomes.slice(0, 3).join(", ")} e mais ${nomes.length - 3}` : listaPt(nomes);
  const url = `/culto/${culto.id}`;
  const lista = musicas.map((m, i) => `${i + 1}. ${m.titulo}${m.tom ? ` (${m.tom})` : ""}`).join("\n");

  const avisos: Aviso[] = [];
  for (const [integranteId, p] of agruparPorPessoa(escalacoes.filter((e) => e.cultoId === culto.id))) {
    avisos.push({
      integranteId,
      nome: p.nome,
      email: p.email,
      titulo: "Repertório publicado",
      corpo: `${rotulo}\n${resumo || "Veja as músicas no Hallel."}`,
      url,
      assunto: `Repertório: ${rotulo}`,
      texto:
        `Olá, ${primeiroNome(p.nome)}!\n\nO repertório do culto ${rotulo} foi publicado:\n\n${lista}` +
        `\n\nCifras, tons e áudios no Hallel: ${base}${url}` +
        rodapeEmail(base),
    });
  }
  return avisos;
}

/** Escala de um ou mais cultos, pronta para o grupo do WhatsApp. */
export function textoWhatsappEscala(
  titulo: string,
  cultos: Array<CultoDoAviso & { vagas: Array<{ funcao: string; ordem: number; posicao: number; nome: string }> }>,
  url: string,
): string {
  const blocos = [...cultos]
    .sort((a, b) => a.data.localeCompare(b.data) || a.periodo.localeCompare(b.periodo))
    .map((c) => {
      const porFuncao = new Map<string, { ordem: number; nomes: Array<{ posicao: number; nome: string }> }>();
      for (const v of c.vagas) {
        const f = porFuncao.get(v.funcao) ?? { ordem: v.ordem, nomes: [] };
        f.nomes.push({ posicao: v.posicao, nome: v.nome });
        porFuncao.set(v.funcao, f);
      }
      const linhas = [...porFuncao.entries()]
        .sort((a, b) => a[1].ordem - b[1].ordem)
        .map(([funcao, f]) => `${funcao}: ${listaPt(f.nomes.sort((a, b) => a.posicao - b.posicao).map((n) => n.nome))}`);
      return `*${rotuloCulto(c)}*\n${linhas.length ? linhas.join("\n") : "(ainda sem escala)"}`;
    });
  return `🎵 *${titulo}*\n\n${blocos.join("\n\n")}\n\nVeja no Hallel: ${url}`;
}

/** Repertório de um culto, pronto para o grupo do WhatsApp. */
export function textoWhatsappRepertorio(
  culto: CultoDoAviso,
  musicas: Array<{ titulo: string; tom: string | null }>,
  url: string,
): string {
  const lista = musicas.map((m, i) => `${i + 1}. ${m.titulo}${m.tom ? ` (${m.tom})` : ""}`).join("\n");
  return `🎵 *Repertório — ${rotuloCulto(culto)}*\n\n${lista || "(sem músicas)"}\n\nCifras e áudios no Hallel: ${url}`;
}

/** Link que abre o WhatsApp com o texto (a pessoa escolhe o grupo). */
export function linkWhatsapp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/** Culto do app (com vagas por id) no formato do texto do WhatsApp. */
export function cultoParaWhatsapp(
  c: CultoDoAviso & { vagas: Array<{ funcaoId: string; posicao: number; integranteId: string }> },
  funcoes: Array<{ id: string; nome: string; ordem: number }>,
  nomes: Map<string, string>,
) {
  const funcao = new Map(funcoes.map((f) => [f.id, f]));
  return {
    ...c,
    vagas: c.vagas
      .filter((v) => funcao.has(v.funcaoId) && nomes.has(v.integranteId))
      .map((v) => ({
        funcao: funcao.get(v.funcaoId)!.nome,
        ordem: funcao.get(v.funcaoId)!.ordem,
        posicao: v.posicao,
        nome: nomes.get(v.integranteId)!,
      })),
  };
}
