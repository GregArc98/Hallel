"use client";

import { Eye, PencilLine } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { ChordSheet } from "@/components/chord-sheet/chord-sheet";
import { Segmented } from "@/components/ui/segmented";
import { parseSongText } from "@/lib/music";
import { cn } from "@/lib/utils";

const EXEMPLO = `[Intro]
G  D/F#  Em  C

[Refrão]
G          D/F#
Grande é o Senhor`;

/**
 * Editor da cifra no formato "acorde em cima da letra" (fonte monoespaçada, para o
 * alinhamento bater) com prévia ao vivo. No celular alterna Escrever/Prévia; no
 * computador mostra lado a lado.
 */
export function CifraEditor({
  valor,
  onChange,
  erro,
}: {
  valor: string;
  onChange: (texto: string) => void;
  erro?: string;
}) {
  const [aba, setAba] = useState<"escrever" | "previa">("escrever");
  const adiado = useDeferredValue(valor);
  const song = useMemo(() => (adiado.trim() ? parseSongText(adiado) : null), [adiado]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="cifra_texto" className="text-sm font-medium">
          Cifra
        </label>
        <Segmented
          className="lg:hidden"
          ariaLabel="Escrever ou ver prévia"
          value={aba}
          onChange={setAba}
          options={[
            { value: "escrever", label: <><PencilLine /> Escrever</> },
            { value: "previa", label: <><Eye /> Prévia</> },
          ]}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Cole do Word/Google Docs como você já faz: acordes na linha de cima, letra embaixo, seções
        como <code>[Refrão]</code>. Uma linha <code>Tom: E</code> no início é reconhecida.
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        <textarea
          id="cifra_texto"
          name="cifra_texto"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          wrap="off"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={EXEMPLO}
          aria-invalid={erro ? true : undefined}
          className={cn(
            "w-full resize-y rounded-lg border bg-background p-3 font-mono text-sm leading-snug outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
            aba === "previa" && "hidden lg:block",
            erro && "border-destructive",
          )}
        />
        <div
          className={cn(
            "max-h-[32rem] min-h-40 overflow-y-auto rounded-lg border bg-card p-3",
            aba === "escrever" && "hidden lg:block",
          )}
          aria-label="Prévia da cifra"
        >
          {song && song.sections.length > 0 ? (
            <ChordSheet song={song} fontSize={15} />
          ) : (
            <p className="text-sm text-muted-foreground">A prévia aparece aqui.</p>
          )}
        </div>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
