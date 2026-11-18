import { ArrowLeft, Eye, Send, Undo2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { carregarCulto, carregarRepertorio } from "@/lib/escala/dados";
import { ICONE_PERIODO, NOME_PERIODO, dataCurta } from "@/lib/escala/datas";
import { createClient } from "@/lib/supabase/server";
import { publicarRepertorio } from "../../actions";
import { EditorRepertorio } from "./editor-repertorio";

export const metadata: Metadata = { title: "Repertório" };

export default async function RepertorioPage({ params }: PageProps<"/escala/[id]/repertorio">) {
  const ctx = await exigirAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const culto = await carregarCulto(ctx.igreja.id, id);
  if (!culto) notFound();

  const supabase = await createClient();
  const [itens, { data: musicas }] = await Promise.all([
    carregarRepertorio(id),
    supabase
      .from("musica")
      .select("id, titulo, tom_original, artista, hinario_numero, hinario_sigla")
      .eq("igreja_id", ctx.igreja.id)
      .order("titulo"),
  ]);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href={`/escala/${id}`}>
          <ArrowLeft /> Escala deste culto
        </Link>
      </Button>
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Repertório</h1>
        <p className="text-muted-foreground">
          {dataCurta(culto.data)} · {ICONE_PERIODO[culto.periodo]} {NOME_PERIODO[culto.periodo]}
          {culto.titulo && ` · ${culto.titulo}`}
        </p>
      </header>

      <EditorRepertorio
        cultoId={id}
        observacoesIniciais={culto.observacoes ?? ""}
        inicial={itens.map((i) => ({ musicaId: i.musicaId, tom: i.tom, observacao: i.observacao }))}
        musicas={(musicas ?? []).map((m) => ({
          id: m.id,
          titulo: m.titulo,
          tomOriginal: m.tom_original,
          extra: [m.hinario_numero, m.hinario_sigla, m.artista].filter(Boolean).join(" "),
        }))}
      />

      <form action={publicarRepertorio} className="flex flex-wrap items-center gap-3 rounded-xl border p-3">
        <input type="hidden" name="id" value={id} />
        <p className="flex-1 text-sm">
          {culto.repertorioPublicado
            ? "A equipe já vê este repertório."
            : "Rascunho: a equipe ainda não vê. Salve e depois publique."}
        </p>
        <Button asChild variant="ghost">
          <Link href={`/culto/${id}`}>
            <Eye /> Ver como a equipe
          </Link>
        </Button>
        {culto.repertorioPublicado ? (
          <Button type="submit" name="publicar" value="0" variant="ghost">
            <Undo2 /> Voltar para rascunho
          </Button>
        ) : (
          <Button type="submit" name="publicar" value="1">
            <Send /> Publicar repertório
          </Button>
        )}
      </form>
    </div>
  );
}
