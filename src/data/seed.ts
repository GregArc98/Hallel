/**
 * Dados de exemplo do seed (gera supabase/seed.sql via `npm run db:seed:gerar`).
 * Sem e-mails: cada integrante recebe o e-mail pelo app (ou pelo SQL do README).
 */
import { FELICIDADE_NO_SERVICO } from "./exemplos/felicidade-no-servico";

export type Periodo = "manha" | "noite";
const AMBOS: Periodo[] = ["manha", "noite"];

export const IGREJA = { nome: "Ministério de Louvor", slug: "louvor" };

/** Na ordem da planilha de escala. */
export const FUNCOES = [
  { nome: "Bateria", max: 1, modo: "cifra" },
  { nome: "Baixo", max: 1, modo: "cifra" },
  { nome: "Piano", max: 1, modo: "cifra" },
  { nome: "Guitarra", max: 1, modo: "cifra" },
  { nome: "Teclado", max: 1, modo: "cifra" },
  { nome: "Ministração", max: 1, modo: "letra" },
  { nome: "Vocal", max: 3, modo: "letra" },
] as const;

export type NomeFuncao = (typeof FUNCOES)[number]["nome"];

export const INTEGRANTES: Array<{
  nome: string;
  funcoes: Partial<Record<NomeFuncao, Periodo[]>>;
}> = [
  { nome: "Breno", funcoes: { Bateria: AMBOS } },
  {
    nome: "Matheus",
    funcoes: { Bateria: AMBOS, Baixo: AMBOS, Guitarra: AMBOS, Vocal: AMBOS, Ministração: AMBOS },
  },
  { nome: "Daniel", funcoes: { Piano: AMBOS, Teclado: AMBOS } },
  { nome: "Yan", funcoes: { Teclado: AMBOS, Piano: ["noite"], Guitarra: ["manha"] } },
  { nome: "Lucas", funcoes: { Ministração: AMBOS, Vocal: AMBOS, Baixo: ["manha"] } },
  { nome: "Sofia", funcoes: { Vocal: AMBOS, Ministração: ["manha"] } },
  { nome: "Grazi", funcoes: { Vocal: AMBOS } },
  { nome: "Mayara", funcoes: { Vocal: ["noite"], Teclado: ["manha"] } },
  { nome: "Taty", funcoes: { Vocal: ["manha"], Ministração: ["noite"] } },
  { nome: "Melissa", funcoes: { Vocal: AMBOS, Piano: ["manha"] } },
];

export const MUSICAS: Array<{
  titulo: string;
  tom: string;
  hinario?: { numero: number; sigla: string };
  tags?: string[];
  /** Cifra no formato "acorde em cima da letra". */
  cifraTexto?: string;
}> = [
  {
    titulo: "Felicidade no Serviço",
    tom: "E",
    hinario: { numero: 410, sigla: "CC" },
    tags: ["celebração"],
    cifraTexto: FELICIDADE_NO_SERVICO,
  },
  { titulo: "Exaltai", tom: "E" },
  { titulo: "Ao Que É Digno", tom: "E" },
  { titulo: "Quem Sou Eu", tom: "E" },
  { titulo: "Porque Ele Vive", tom: "E" },
  { titulo: "Grande É o Senhor", tom: "G" },
];

export const CULTOS: Array<{
  data: string;
  periodo: Periodo;
  escala: Partial<Record<NomeFuncao, string[]>>;
  setlist: Array<{ titulo: string; tom: string; observacao?: string }>;
}> = [
  {
    data: "2026-11-15",
    periodo: "noite",
    escala: {
      Bateria: ["Breno"],
      Baixo: ["Matheus"],
      Piano: ["Daniel"],
      Teclado: ["Yan"],
      Ministração: ["Lucas"],
    },
    setlist: [
      { titulo: "Felicidade no Serviço", tom: "E" },
      { titulo: "Exaltai", tom: "E" },
      { titulo: "Ao Que É Digno", tom: "E" },
      { titulo: "Quem Sou Eu", tom: "E" },
      { titulo: "Porque Ele Vive", tom: "E" },
      { titulo: "Grande É o Senhor", tom: "G" },
    ],
  },
];
