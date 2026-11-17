import type { Metadata } from "next";

import { SongViewer } from "@/components/chord-sheet/song-viewer";
import { FELICIDADE_NO_SERVICO } from "@/data/exemplos/felicidade-no-servico";
import { parseChordsOverLyrics, serializeChordPro } from "@/lib/music";
import { PasteTester } from "./paste-tester";

export const metadata: Metadata = { title: "Demonstração da cifra" };

// Simula o que virá do banco: a cifra já convertida para ChordPro.
const chordpro = serializeChordPro(parseChordsOverLyrics(FELICIDADE_NO_SERVICO));

export default function DemoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <p className="mb-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Demonstração do visualizador de cifra. Aqui a música abre em <strong>G</strong>, como se
        fosse o tom definido para o culto (original: E).
      </p>

      <SongViewer
        title="Felicidade no Serviço"
        subtitle="Hinário CC 410"
        chordpro={chordpro}
        originalKey="E"
        initialKey="G"
      />

      <section className="mt-12 border-t pt-8">
        <h2 className="mb-4 text-xl font-bold">Testar minha cifra</h2>
        <PasteTester />
      </section>
    </main>
  );
}
