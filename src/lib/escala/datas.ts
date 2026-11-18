/**
 * Datas da escala. Trabalhamos com strings "AAAA-MM-DD" (datas civis, sem fuso) e
 * só usamos Date em UTC para calcular — assim não há "dia anterior" por causa de fuso.
 */

export const FUSO_PADRAO = "America/Sao_Paulo";

export interface Mes {
  ano: number;
  mes: number; // 1..12
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function formatarData(ano: number, mes: number, dia: number): string {
  return `${ano}-${pad(mes)}-${pad(dia)}`;
}

export function paraUTC(data: string): Date {
  const [a, m, d] = data.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

/** Data de hoje no fuso da igreja (padrão: São Paulo). */
export function hoje(fuso = FUSO_PADRAO, agora = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

export function mesDaData(data: string): Mes {
  const [ano, mes] = data.split("-").map(Number);
  return { ano, mes };
}

/** "2026-12" → {2026, 12}; inválido → mês de `padrao`. */
export function lerMes(param: string | undefined | null, padrao: string): Mes {
  const m = /^(\d{4})-(\d{2})$/.exec(param ?? "");
  if (m) {
    const mes = Number(m[2]);
    if (mes >= 1 && mes <= 12) return { ano: Number(m[1]), mes };
  }
  return mesDaData(padrao);
}

export function chaveMes({ ano, mes }: Mes): string {
  return `${ano}-${pad(mes)}`;
}

export function somarMeses({ ano, mes }: Mes, n: number): Mes {
  const total = ano * 12 + (mes - 1) + n;
  return { ano: Math.floor(total / 12), mes: (total % 12) + 1 };
}

export function primeiroEUltimoDia({ ano, mes }: Mes): [string, string] {
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return [formatarData(ano, mes, 1), formatarData(ano, mes, ultimo)];
}

/** Todos os domingos do mês. */
export function domingosDoMes({ ano, mes }: Mes): string[] {
  const dias: string[] = [];
  const ultimo = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  for (let d = 1; d <= ultimo; d++) {
    if (new Date(Date.UTC(ano, mes - 1, d)).getUTCDay() === 0) dias.push(formatarData(ano, mes, d));
  }
  return dias;
}

/** Próximos domingos a partir de `inicio` (inclusive), `quantidade` deles. */
export function proximosDomingos(inicio: string, quantidade: number): string[] {
  const d = paraUTC(inicio);
  d.setUTCDate(d.getUTCDate() + ((7 - d.getUTCDay()) % 7));
  return Array.from({ length: quantidade }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i * 7);
    return x.toISOString().slice(0, 10);
  });
}

const fmtMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
const fmtDiaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" });

/** "dezembro de 2026" */
export function nomeDoMes({ ano, mes }: Mes): string {
  return fmtMes.format(new Date(Date.UTC(ano, mes - 1, 1)));
}

/** "Dom 15/11" */
export function dataCurta(data: string): string {
  const d = paraUTC(data);
  const semana = fmtDiaSemana.format(d).replace(".", "");
  return `${semana[0].toUpperCase()}${semana.slice(1)} ${data.slice(8, 10)}/${data.slice(5, 7)}`;
}

/** "15/11/2026" */
export function dataNumerica(data: string): string {
  return `${data.slice(8, 10)}/${data.slice(5, 7)}/${data.slice(0, 4)}`;
}

export const NOME_PERIODO = { manha: "Manhã", noite: "Noite" } as const;
export const ICONE_PERIODO = { manha: "☀", noite: "🌙" } as const;
