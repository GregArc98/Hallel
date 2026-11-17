import { ArrowLeft, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AudioReferencia } from "@/components/audio-player";
import { SongViewer } from "@/components/chord-sheet/song-viewer";
import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function buscarMusica(id: string, igrejaId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("musica")
    .select("*")
    .eq("id", id)
    .eq("igreja_id", igrejaId)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/musicas/[id]">): Promise<Metadata> {
  const ctx = await exigirIntegrante();
  const musica = await buscarMusica((await params).id, ctx.igreja.id);
  return { title: musica?.titulo ?? "Música" };
}

export default async function MusicaPage({ params }: PageProps<"/musicas/[id]">) {
  const ctx = await exigirIntegrante();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const musica = await buscarMusica(id, ctx.igreja.id);
  if (!musica) notFound();

  const subtitulo = [
    musica.hinario_numero ? `${musica.hinario_sigla ?? "Hino"} ${musica.hinario_numero}` : null,
    musica.artista,
    musica.bpm ? `${musica.bpm} BPM` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const extras = (
    <>
      <AudioReferencia
        audioUrl={musica.audio_url}
        audioUrlExterno={musica.audio_url_externo}
        youtubeUrl={musica.youtube_url}
      />
      {(musica.tags.length > 0 || musica.observacoes) && (
        <div className="mb-5 space-y-2">
          {musica.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {musica.tags.map((t) => (
                <Link
                  key={t}
                  href={`/musicas?tag=${encodeURIComponent(t)}`}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground"
                >
                  {t}
                </Link>
              ))}
            </div>
          )}
          {musica.observacoes && (
            <p className="text-sm whitespace-pre-line text-muted-foreground">{musica.observacoes}</p>
          )}
        </div>
      )}
    </>
  );

  return (
    <div>
      {musica.arquivada && (
        <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Música arquivada: não aparece no acervo nem na montagem de repertório.
          {ctx.admin && " Para trazê-la de volta, use Editar → Desarquivar."}
        </p>
      )}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/musicas">
            <ArrowLeft /> Músicas
          </Link>
        </Button>
        {ctx.admin && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/musicas/${musica.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
        )}
      </div>

      {musica.cifra ? (
        <SongViewer
          title={musica.titulo}
          subtitle={subtitulo || undefined}
          chordpro={musica.cifra}
          originalKey={musica.tom_original}
        >
          {extras}
        </SongViewer>
      ) : (
        <div>
          <header className="mb-4">
            <h1 className="text-2xl font-bold tracking-tight">{musica.titulo}</h1>
            {subtitulo && <p className="text-muted-foreground">{subtitulo}</p>}
            {musica.tom_original && (
              <p className="mt-1 text-sm">
                Tom: <strong className="text-chord">{musica.tom_original}</strong>
              </p>
            )}
          </header>
          {extras}
          {musica.letra ? (
            <div className="space-y-4 text-lg leading-relaxed whitespace-pre-line">{musica.letra}</div>
          ) : (
            <p className="rounded-xl border border-dashed p-4 text-muted-foreground">
              Esta música ainda não tem cifra nem letra.
              {ctx.admin && " Toque em Editar para colar a cifra."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
