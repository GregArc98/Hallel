/**
 * Como tocar um áudio de referência a partir da URL.
 *  • "arquivo": dá para tocar direto no player (Vercel Blob ou link para .mp3/.m4a…)
 *  • "drive":   link do Google Drive — abre no Drive (o Drive não permite tocar embutido)
 *  • "link":    qualquer outro link — abre em outra aba
 */
export type TipoAudio = "arquivo" | "drive" | "link";

const EXTENSOES_AUDIO = /\.(mp3|m4a|aac|ogg|oga|opus|wav|webm|flac)$/i;

export function tipoDeAudio(url: string): TipoAudio {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return "link";
  }
  if (u.hostname.endsWith(".blob.vercel-storage.com")) return "arquivo";
  if (u.hostname === "drive.google.com" || u.hostname === "docs.google.com") return "drive";
  if (EXTENSOES_AUDIO.test(u.pathname)) return "arquivo";
  return "link";
}

export function ehBlobDoVercel(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return new URL(url).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/** ID do vídeo a partir de links youtube.com/watch?v=, youtu.be/, /shorts/, /embed/. */
export function idDoYoutube(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "music.youtube.com") {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const m = /^\/(shorts|embed|live)\/([^/?]+)/.exec(u.pathname);
      return m ? m[2] : null;
    }
  } catch {
    // não é URL
  }
  return null;
}
