"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { exigirAdmin } from "@/lib/auth";
import { type ErrosMusica, prepararMusica } from "@/lib/musicas/formulario";
import { apagarAudio, pastaDeAudios } from "@/lib/storage/audio";
import { ehBlobDoVercel } from "@/lib/musicas/audio";
import { createClient } from "@/lib/supabase/server";

export interface EstadoFormulario {
  erro?: string;
  erros?: ErrosMusica;
}

const CAMPOS = [
  "titulo",
  "artista",
  "hinario_numero",
  "hinario_sigla",
  "tom_original",
  "bpm",
  "tags",
  "cifra_texto",
  "letra_texto",
  "audio_url",
  "audio_url_externo",
  "youtube_url",
  "observacoes",
] as const;

export async function salvarMusica(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "") || null;

  const entrada = Object.fromEntries(CAMPOS.map((c) => [c, String(formData.get(c) ?? "")]));
  const preparo = prepararMusica(entrada);
  if (!preparo.ok) {
    return { erro: "Confira os campos destacados.", erros: preparo.erros };
  }
  const musica = preparo.musica;

  // Só aceita arquivos do Blob que estejam na pasta desta igreja.
  if (ehBlobDoVercel(musica.audio_url)) {
    const caminho = new URL(musica.audio_url!).pathname.slice(1);
    if (!caminho.startsWith(pastaDeAudios(ctx.igreja.id))) {
      return { erro: "Áudio inválido. Envie o arquivo de novo." };
    }
  } else if (musica.audio_url) {
    // audio_url é reservado para arquivos enviados; links vão em audio_url_externo.
    musica.audio_url_externo ??= musica.audio_url;
    musica.audio_url = null;
  }

  const supabase = await createClient();
  let musicaId = id;
  let audioAntigo: string | null = null;

  if (id) {
    const { data: atual } = await supabase
      .from("musica")
      .select("audio_url")
      .eq("id", id)
      .eq("igreja_id", ctx.igreja.id)
      .maybeSingle();
    if (!atual) return { erro: "Música não encontrada." };
    audioAntigo = atual.audio_url;

    const { error } = await supabase
      .from("musica")
      .update(musica)
      .eq("id", id)
      .eq("igreja_id", ctx.igreja.id);
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("musica")
      .insert({ ...musica, igreja_id: ctx.igreja.id, criado_por: ctx.usuario.id })
      .select("id")
      .single();
    if (error) return { erro: `Não foi possível salvar: ${error.message}` };
    musicaId = data.id;
  }

  if (audioAntigo && audioAntigo !== musica.audio_url) await apagarAudio(audioAntigo);

  revalidatePath("/musicas");
  revalidatePath(`/musicas/${musicaId}`);
  redirect(`/musicas/${musicaId}`);
}

export async function excluirMusica(formData: FormData): Promise<void> {
  const ctx = await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: atual } = await supabase
    .from("musica")
    .select("audio_url")
    .eq("id", id)
    .eq("igreja_id", ctx.igreja.id)
    .maybeSingle();
  if (!atual) redirect("/musicas");

  const { error } = await supabase.from("musica").delete().eq("id", id).eq("igreja_id", ctx.igreja.id);
  if (error) {
    // 23503 = música usada em algum culto (o histórico é preservado).
    const motivo = error.code === "23503" ? "em-uso" : "falha";
    redirect(`/musicas/${id}/editar?erro=${motivo}`);
  }

  await apagarAudio(atual.audio_url);
  revalidatePath("/musicas");
  redirect("/musicas");
}
