import type { Periodo, Vaga } from "@/lib/escala/regras";

interface CultoBase {
  id: string;
  data: string;
  periodo: Periodo;
  horario: string | null;
  vagas: Vaga[];
  escalaPublicada: boolean;
  repertorioPublicado: boolean;
  musicas: number;
}

/** Cultos (a partir de hoje) em que a pessoa está escalada, em ordem, com as funções dela. */
export function minhasEscalas<C extends CultoBase>(cultos: C[], integranteId: string, hoje: string) {
  return cultos
    .filter((c) => c.data >= hoje && c.vagas.some((v) => v.integranteId === integranteId))
    .sort((a, b) => a.data.localeCompare(b.data) || a.periodo.localeCompare(b.periodo))
    .map((c) => ({
      culto: c,
      funcoes: [...new Set(c.vagas.filter((v) => v.integranteId === integranteId).map((v) => v.funcaoId))],
    }));
}

export interface Pendencia {
  cultoId: string;
  data: string;
  periodo: Periodo;
  itens: string[];
}

/** O que falta para os próximos cultos ficarem prontos (visão do líder). */
export function pendencias<C extends CultoBase>(cultos: C[], funcoes: Array<{ id: string }>, hoje: string): Pendencia[] {
  return cultos
    .filter((c) => c.data >= hoje)
    .map((c) => {
      const itens: string[] = [];
      const vazias = funcoes.filter((f) => !c.vagas.some((v) => v.funcaoId === f.id)).length;
      if (vazias > 0) itens.push(`${vazias} função${vazias > 1 ? "ões" : ""} sem ninguém`);
      if (!c.escalaPublicada) itens.push("escala não publicada");
      if (c.musicas === 0) itens.push("sem repertório");
      else if (!c.repertorioPublicado) itens.push("repertório não publicado");
      return { cultoId: c.id, data: c.data, periodo: c.periodo, itens };
    })
    .filter((p) => p.itens.length > 0);
}

/** Índice válido da música no modo culto. */
export function indiceValido(valor: string | undefined | null, total: number): number {
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 && n < total ? n : 0;
}
