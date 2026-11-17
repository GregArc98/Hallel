import "server-only";

import { del } from "@vercel/blob";

import { ehBlobDoVercel } from "@/lib/musicas/audio";

/**
 * Armazenamento dos áudios de referência (hoje: Vercel Blob).
 * Todo acesso ao provedor passa por aqui — para trocar por R2/B2, só este módulo
 * e a rota /api/audio/upload mudam.
 */

export const AUDIO_TIPOS_PERMITIDOS = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
];
export const AUDIO_TAMANHO_MAXIMO = 25 * 1024 * 1024; // 25 MB

/** O upload só aparece quando o token do Blob está configurado. */
export function uploadDeAudioHabilitado(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Pasta dos áudios de cada igreja (o upload só é autorizado dentro dela). */
export function pastaDeAudios(igrejaId: string): string {
  return `audios/${igrejaId}/`;
}

/** Remove um áudio que não é mais usado. Ignora links externos e falhas (não bloqueia o salvamento). */
export async function apagarAudio(url: string | null | undefined): Promise<void> {
  if (!ehBlobDoVercel(url) || !uploadDeAudioHabilitado()) return;
  try {
    await del(url!);
  } catch (e) {
    console.error("Falha ao apagar áudio antigo", e);
  }
}
