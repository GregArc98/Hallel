"use client";

import { upload } from "@vercel/blob/client";
import { Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";

function nomeSeguro(nome: string) {
  const [base, ext = "mp3"] = (() => {
    const i = nome.lastIndexOf(".");
    return i > 0 ? [nome.slice(0, i), nome.slice(i + 1)] : [nome, "mp3"];
  })();
  const limpo = base
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${limpo || "audio"}.${ext.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

/** Envio do áudio de referência direto do navegador para o armazenamento. */
export function AudioCampo({
  igrejaId,
  inicial,
  habilitado,
}: {
  igrejaId: string;
  inicial: string;
  habilitado: boolean;
}) {
  const [url, setUrl] = useState(inicial);
  const [progresso, setProgresso] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    setErro(null);
    if (arquivo.size > 25 * 1024 * 1024) {
      setErro("Arquivo maior que 25 MB. Exporte o mp3 em qualidade menor (128 kbps é suficiente).");
      return;
    }
    setProgresso(0);
    try {
      const blob = await upload(`audios/${igrejaId}/${nomeSeguro(arquivo.name)}`, arquivo, {
        access: "public",
        handleUploadUrl: "/api/audio/upload",
        multipart: arquivo.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgresso(Math.round(percentage)),
      });
      setUrl(blob.url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar o áudio.");
    } finally {
      setProgresso(null);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium">Áudio de referência (arquivo)</span>
      <input type="hidden" name="audio_url" value={url} />
      {url && (
        <div className="flex items-center gap-2">
          <audio controls preload="none" src={url} className="min-w-0 flex-1" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setUrl("")}
            aria-label="Remover áudio"
            title="Remover áudio"
          >
            <Trash2 />
          </Button>
        </div>
      )}
      {habilitado ? (
        <>
          <input
            ref={input}
            type="file"
            accept="audio/*"
            className="sr-only"
            id="audio-arquivo"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void enviar(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={progresso !== null}
            onClick={() => input.current?.click()}
          >
            <Upload /> {progresso !== null ? `Enviando… ${progresso}%` : url ? "Trocar arquivo" : "Enviar arquivo (mp3, m4a…)"}
          </Button>
          {url && url !== inicial && (
            <p className="text-xs text-muted-foreground">Arquivo enviado. Salve a música para confirmar.</p>
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          O envio de arquivos ainda não está configurado (falta o BLOB_READ_WRITE_TOKEN). Por
          enquanto, use o campo de link abaixo.
        </p>
      )}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
