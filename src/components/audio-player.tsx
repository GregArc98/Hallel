import { CirclePlay, ExternalLink, Music2 } from "lucide-react";

import { PlayerEnsaio } from "@/components/player-ensaio";
import { Button } from "@/components/ui/button";
import { ehBlobDoVercel, tipoDeAudio } from "@/lib/musicas/audio";

/**
 * Áudio de referência: toca direto quando é arquivo; links do Drive e outros abrem fora.
 * Aceita o arquivo enviado e/ou o link externo.
 */
export function AudioReferencia({
  audioUrl,
  audioUrlExterno,
  youtubeUrl,
  titulo,
  tomOriginal,
}: {
  audioUrl: string | null;
  audioUrlExterno: string | null;
  youtubeUrl: string | null;
  titulo: string;
  tomOriginal: string | null;
}) {
  const tocavel = [audioUrl, audioUrlExterno].find((u) => u && tipoDeAudio(u) === "arquivo");
  const link = [audioUrlExterno, audioUrl].find((u) => u && u !== tocavel);
  if (!tocavel && !link && !youtubeUrl) return null;

  return (
    <div className="mb-5 space-y-2 rounded-xl border bg-card p-3">
      {tocavel &&
        (ehBlobDoVercel(tocavel) ? (
          <PlayerEnsaio url={tocavel} titulo={titulo} tomOriginal={tomOriginal} />
        ) : (
          <audio controls preload="none" src={tocavel} className="w-full" aria-label="Áudio de referência" />
        ))}
      {(link || youtubeUrl) && (
        <div className="flex flex-wrap gap-2">
          {link && (
            <Button asChild variant="outline" size="sm">
              <a href={link} target="_blank" rel="noopener noreferrer">
                {tipoDeAudio(link) === "drive" ? <Music2 /> : <ExternalLink />}
                {tipoDeAudio(link) === "drive" ? "Ouvir no Google Drive" : "Abrir áudio"}
              </a>
            </Button>
          )}
          {youtubeUrl && (
            <Button asChild variant="outline" size="sm">
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer">
                <CirclePlay /> Ver no YouTube
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
