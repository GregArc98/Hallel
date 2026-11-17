/**
 * Renderiza uma música cifrada (já transposta) — acorde em cima da sílaba,
 * seções destacadas. Sem estado: funciona como Server ou Client Component.
 */
import { type Line, type Section, type Song, lineLyrics } from "@/lib/music";
import { cn } from "@/lib/utils";
import { lineHasChords, segmentsToWords } from "./layout";

export type SheetMode = "cifra" | "letra";

const NBSP = " ";

function ChordLine({ line }: { line: Extract<Line, { type: "lyrics" }> }) {
  const withChords = lineHasChords(line.segments);
  if (!withChords) {
    return <p className="whitespace-pre-wrap">{lineLyrics(line).trim() || NBSP}</p>;
  }
  return (
    <p className="flex flex-wrap items-end">
      {segmentsToWords(line.segments).map((word, w) =>
        // Palavra sem acorde não reserva a linha de acorde: se a frase quebrar,
        // a continuação não fica com um vão em cima (items-end alinha pela letra).
        word.every((col) => col.chord === null) ? (
          <span key={w} className="whitespace-pre">
            {word.map((col) => col.text).join("")}
          </span>
        ) : (
        <span key={w} className="inline-flex">
          {word.map((col, c) => (
            <span key={c} className="inline-flex flex-col">
              <span
                className={cn(
                  "font-bold leading-tight text-chord",
                  col.chord && "pr-[0.4em]",
                )}
              >
                {col.chord ?? NBSP}
              </span>
              <span className="whitespace-pre">{col.text || NBSP}</span>
            </span>
          ))}
        </span>
        ),
      )}
    </p>
  );
}

function SheetLine({ line, mode }: { line: Line; mode: SheetMode }) {
  if (line.type === "comment") {
    return <p className="text-[0.85em] italic text-muted-foreground">({line.text})</p>;
  }
  if (line.type === "chords") {
    if (mode === "letra") return null;
    return (
      <p className="flex flex-wrap gap-x-[1em] font-bold text-chord">
        {line.chords.map((c, i) => (
          <span key={i}>{c}</span>
        ))}
      </p>
    );
  }
  if (mode === "letra") {
    const text = lineLyrics(line).replace(/\s+/g, " ").trim();
    return text ? <p>{text}</p> : null;
  }
  return <ChordLine line={line} />;
}

function SheetSection({ section, mode }: { section: Section; mode: SheetMode }) {
  const visible =
    mode === "cifra" ? section.lines : section.lines.filter((l) => l.type !== "chords");
  if (visible.length === 0 && mode === "letra") return null;
  const isChorus = section.kind === "chorus";
  return (
    <section
      className={cn(
        "space-y-1.5 rounded-lg",
        isChorus && "border-l-4 border-section-chorus-border bg-section-chorus py-2 pr-2 pl-3",
      )}
    >
      {section.label && (
        <h3
          className={cn(
            "text-[0.75em] font-semibold tracking-wide uppercase",
            isChorus ? "text-primary" : "text-muted-foreground",
          )}
        >
          {section.label}
        </h3>
      )}
      {visible.map((line, i) => (
        <SheetLine key={i} line={line} mode={mode} />
      ))}
    </section>
  );
}

export function ChordSheet({
  song,
  mode = "cifra",
  fontSize = 18,
  className,
}: {
  song: Song;
  mode?: SheetMode;
  /** Tamanho da letra em px; acordes e rótulos escalam junto. */
  fontSize?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-5 leading-snug", className)}
      style={{ fontSize }}
      data-mode={mode}
    >
      {song.sections.map((section, i) => (
        <SheetSection key={i} section={section} mode={mode} />
      ))}
    </div>
  );
}
