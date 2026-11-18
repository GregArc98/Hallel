/** Regras do player de ensaio (puras). */

export const LIMITE_SEMITONS = 6;
export const VELOCIDADES = [0.5, 0.75, 0.9, 1, 1.1, 1.25] as const;
export const PULO_SEGUNDOS = 10;

/** Normaliza para -6..+6 (o caminho mais curto, como na cifra). */
export function normalizarSemitons(n: number): number {
  const m = ((n % 12) + 12) % 12;
  return m > 6 ? m - 12 : m;
}

/** Semitons aplicados no áudio: seguem a cifra ou o ajuste manual, sempre dentro do limite. */
export function semitonsDoAudio(acompanhaCifra: boolean, offsetCifra: number | null, manual: number): number {
  const valor = acompanhaCifra && offsetCifra !== null ? normalizarSemitons(offsetCifra) : manual;
  return Math.max(-LIMITE_SEMITONS, Math.min(LIMITE_SEMITONS, valor));
}

/** 65 → "1:05"; 3725 → "1:02:05". */
export function formatarTempo(segundos: number): string {
  if (!Number.isFinite(segundos) || segundos < 0) return "0:00";
  const s = Math.floor(segundos);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

export function rotuloSemitons(n: number): string {
  if (n === 0) return "original";
  return `${n > 0 ? "+" : "−"}${Math.abs(n)}`;
}

/** "Felicidade no Serviço - E.mp3" (sem caracteres que atrapalham em celular/Windows). */
export function nomeDoArquivo(titulo: string, tom: string | null, url: string): string {
  const ext = /\.([a-z0-9]{2,5})(?:\?|$)/i.exec(new URL(url).pathname)?.[1]?.toLowerCase() ?? "mp3";
  const base = `${titulo}${tom ? ` - ${tom}` : ""}`.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
  return `${base || "audio"}.${ext}`;
}

/** Avança/volta sem sair dos limites da música. */
export function pular(atual: number, delta: number, duracao: number): number {
  const alvo = atual + delta;
  if (!Number.isFinite(duracao) || duracao <= 0) return Math.max(0, alvo);
  return Math.max(0, Math.min(duracao - 0.25, alvo));
}
