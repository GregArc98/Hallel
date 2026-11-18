"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AudioReferencia } from "@/components/audio-player";
import { SongViewer } from "@/components/chord-sheet/song-viewer";
import type { SheetMode } from "@/components/chord-sheet/chord-sheet";
import { Button } from "@/components/ui/button";
import { useWakeLock } from "@/hooks/use-wake-lock";
import type { MusicaDoCulto } from "@/lib/escala/dados";
import { tomDoCulto } from "@/lib/repertorio/regras";
import { cn } from "@/lib/utils";

const DISTANCIA_SWIPE = 70;

/** Repertório do culto, uma música por vez: ‹ › , setas do teclado ou arrastar para o lado. */
export function ModoCulto({
  musicas,
  inicial,
  modo,
}: {
  musicas: MusicaDoCulto[];
  inicial: number;
  modo: SheetMode;
}) {
  const [indice, setIndice] = useState(inicial);
  const [palco, setPalco] = useState(false);
  const toque = useRef<{ x: number; y: number } | null>(null);
  useWakeLock(true); // durante o culto a tela não apaga

  const irPara = useCallback(
    (i: number) => {
      if (i < 0 || i >= musicas.length) return;
      setIndice(i);
      window.scrollTo({ top: 0 });
      const url = new URL(window.location.href);
      url.searchParams.set("i", String(i));
      window.history.replaceState(null, "", url);
    },
    [musicas.length],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, select, textarea")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") irPara(indice + 1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") irPara(indice - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [indice, irPara]);

  const atual = musicas[indice];
  const proxima = musicas[indice + 1];
  const tom = tomDoCulto(atual.tom, atual.tomOriginal);

  const extras = (
    <>
      {atual.observacao && (
        <p className="mb-4 rounded-xl bg-accent px-3 py-2 font-medium">📝 {atual.observacao}</p>
      )}
      <AudioReferencia audioUrl={atual.audioUrl} audioUrlExterno={atual.audioUrlExterno} youtubeUrl={atual.youtubeUrl} />
    </>
  );

  return (
    <div
      onTouchStart={(e) => {
        if ((e.target as HTMLElement).closest("button, select, input, textarea, a, audio")) return;
        toque.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const inicio = toque.current;
        toque.current = null;
        if (!inicio) return;
        const dx = e.changedTouches[0].clientX - inicio.x;
        const dy = e.changedTouches[0].clientY - inicio.y;
        if (Math.abs(dx) > DISTANCIA_SWIPE && Math.abs(dx) > Math.abs(dy) * 1.5) irPara(indice + (dx < 0 ? 1 : -1));
      }}
    >
      <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
        Música {indice + 1} de {musicas.length}
        {proxima && <> · Próxima: <strong className="text-foreground">{proxima.titulo}</strong></>}
      </p>

      {atual.cifra ? (
        <SongViewer
          key={indice}
          title={atual.titulo}
          subtitle={atual.subtitulo ?? undefined}
          chordpro={atual.cifra}
          originalKey={atual.tomOriginal}
          initialKey={tom}
          defaultMode={modo}
          palcoInicial={palco}
          onPalcoChange={setPalco}
        >
          {extras}
        </SongViewer>
      ) : (
        <div key={indice} className="pb-28">
          <h1 className="text-2xl font-bold tracking-tight">{atual.titulo}</h1>
          {atual.subtitulo && <p className="text-muted-foreground">{atual.subtitulo}</p>}
          {tom && (
            <p className="mt-1 mb-4">
              Tom: <strong className="text-chord">{tom}</strong>
            </p>
          )}
          {extras}
          {atual.letra ? (
            <div className="text-lg leading-relaxed whitespace-pre-line">{atual.letra}</div>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-muted-foreground">Esta música ainda não tem cifra nem letra.</p>
          )}
        </div>
      )}

      {/* Navegação entre músicas: fica por cima até do modo palco. */}
      <div
        className={cn(
          "fixed z-[60] flex items-center gap-1 rounded-full border bg-background/95 p-1 text-foreground shadow-lg backdrop-blur",
          // No palco os cantos têm os controles de fonte e rolagem: as setas vão para o centro.
          palco
            ? "dark bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2"
            : "bottom-[calc(1rem+var(--nav-h,0px))] left-4",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => irPara(indice - 1)}
          disabled={indice === 0}
          aria-label="Música anterior"
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-10 text-center text-sm font-semibold tabular-nums text-foreground">
          {indice + 1}/{musicas.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => irPara(indice + 1)}
          disabled={indice === musicas.length - 1}
          aria-label="Próxima música"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
