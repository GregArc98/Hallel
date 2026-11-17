"use client";

import { useMemo, useState } from "react";

import { SongViewer } from "@/components/chord-sheet/song-viewer";
import { Button } from "@/components/ui/button";
import { parseSongText, serializeChordPro } from "@/lib/music";

/**
 * Cole uma cifra no formato "acorde em cima da letra" e veja como o app a entende.
 * Prévia do editor de cifras que entra na etapa 4.
 */
export function PasteTester() {
  const [text, setText] = useState("");
  const [showChordPro, setShowChordPro] = useState(false);

  const parsed = useMemo(() => {
    if (!text.trim()) return null;
    const song = parseSongText(text);
    return { song, chordpro: serializeChordPro(song) };
  }, [text]);

  return (
    <div className="space-y-4">
      <label className="block space-y-2">
        <span className="text-sm font-medium">
          Cole aqui uma cifra (copie do Word/Google Docs). Use [Intro], [Refrão] etc. para as
          seções e &quot;Tom: X&quot; no início.
        </span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          spellCheck={false}
          className="w-full rounded-lg border bg-background p-3 font-mono text-sm leading-snug outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          placeholder={"Tom: G\n\n[Refrão]\nG          D/F#\nGrande é o Senhor"}
        />
      </label>

      {parsed && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {parsed.song.sections.length} seç{parsed.song.sections.length === 1 ? "ão" : "ões"} ·
              tom {parsed.song.meta.key ?? "não informado"}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowChordPro((v) => !v)}>
              {showChordPro ? "Esconder" : "Ver"} formato salvo (ChordPro)
            </Button>
          </div>
          {showChordPro && (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{parsed.chordpro}</pre>
          )}
          <div className="border-t pt-6">
            <SongViewer
              key={parsed.chordpro}
              title={parsed.song.meta.title ?? "Sua cifra"}
              chordpro={parsed.chordpro}
              originalKey={parsed.song.meta.key ?? null}
            />
          </div>
        </>
      )}
    </div>
  );
}
