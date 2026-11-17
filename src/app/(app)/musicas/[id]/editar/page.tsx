import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { exigirAdmin } from "@/lib/auth";
import { cifraParaEdicao } from "@/lib/musicas/formulario";
import { uploadDeAudioHabilitado } from "@/lib/storage/audio";
import { createClient } from "@/lib/supabase/server";
import { ExcluirMusica } from "../../excluir-musica";
import { MusicaForm } from "../../musica-form";

export const metadata: Metadata = { title: "Editar música" };

const ERROS: Record<string, string> = {
  falha: "Não foi possível excluir a música. Tente de novo.",
};

export default async function EditarMusicaPage({
  params,
  searchParams,
}: PageProps<"/musicas/[id]/editar">) {
  const ctx = await exigirAdmin();
  const { id } = await params;
  const { erro } = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: musica } = await supabase
    .from("musica")
    .select("*")
    .eq("id", id)
    .eq("igreja_id", ctx.igreja.id)
    .maybeSingle();
  if (!musica) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Editar música</h1>
      {typeof erro === "string" && ERROS[erro] && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERROS[erro]}
        </p>
      )}
      <MusicaForm
        igrejaId={ctx.igreja.id}
        uploadHabilitado={uploadDeAudioHabilitado()}
        musica={{
          id: musica.id,
          titulo: musica.titulo,
          artista: musica.artista ?? "",
          hinario_numero: musica.hinario_numero?.toString() ?? "",
          hinario_sigla: musica.hinario_sigla ?? "",
          tom_original: musica.tom_original ?? "",
          bpm: musica.bpm?.toString() ?? "",
          tags: musica.tags.join(", "),
          cifra_texto: cifraParaEdicao(musica.cifra),
          letra_texto: musica.cifra ? "" : (musica.letra ?? ""),
          audio_url: musica.audio_url ?? "",
          audio_url_externo: musica.audio_url_externo ?? "",
          youtube_url: musica.youtube_url ?? "",
          observacoes: musica.observacoes ?? "",
        }}
      />
      <ExcluirMusica id={musica.id} titulo={musica.titulo} />
    </div>
  );
}
