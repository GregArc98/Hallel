import { FileMusic, Headphones, Plus, Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { padraoContem } from "@/lib/musicas/busca";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Músicas" };

function urlCom(params: { q?: string; tag?: string }) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.tag) sp.set("tag", params.tag);
  const s = sp.toString();
  return s ? `/musicas?${s}` : "/musicas";
}

export default async function MusicasPage({ searchParams }: PageProps<"/musicas">) {
  const ctx = await exigirIntegrante();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const tag = typeof params.tag === "string" ? params.tag : "";

  const supabase = await createClient();
  let consulta = supabase
    .from("musica")
    .select(
      "id, titulo, artista, hinario_numero, hinario_sigla, tom_original, tags, tem_cifra, audio_url, audio_url_externo",
    )
    .eq("igreja_id", ctx.igreja.id)
    .order("titulo");
  if (q) consulta = consulta.ilike("busca", padraoContem(q));
  if (tag) consulta = consulta.contains("tags", [tag]);

  const [{ data, error }, { data: todasTags }] = await Promise.all([
    consulta,
    supabase.from("musica").select("tags").eq("igreja_id", ctx.igreja.id),
  ]);
  if (error) throw new Error(error.message);
  const musicas = data ?? [];

  const tags = [...new Set((todasTags ?? []).flatMap((m) => m.tags))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Músicas</h1>
        {ctx.admin && (
          <Button asChild>
            <Link href="/musicas/nova">
              <Plus /> Nova música
            </Link>
          </Button>
        )}
      </div>

      <form action="/musicas" role="search" className="relative">
        {tag && <input type="hidden" name="tag" value={tag} />}
        <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Buscar por título, artista, número ou trecho da letra"
          aria-label="Buscar músicas"
          className="h-12 w-full rounded-lg border bg-background pr-3 pl-10 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </form>

      {tags.length > 0 && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" aria-label="Filtrar por tag">
          <Link
            href={urlCom({ q })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm",
              !tag ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            Todas
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={urlCom({ q, tag: t === tag ? undefined : t })}
              aria-current={t === tag ? "true" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm",
                t === tag ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {musicas.length === 0
          ? q || tag
            ? "Nenhuma música encontrada."
            : "O acervo ainda está vazio."
          : `${musicas.length} música${musicas.length > 1 ? "s" : ""}`}
      </p>

      <ul className="divide-y rounded-xl border">
        {musicas.map((m) => (
          <li key={m.id}>
            <Link
              href={`/musicas/${m.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.titulo}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[
                    m.hinario_numero ? `${m.hinario_sigla ?? "Hino"} ${m.hinario_numero}` : null,
                    m.artista,
                  ]
                    .filter(Boolean)
                    .join(" · ") || " "}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-muted-foreground">
                {m.tem_cifra && <FileMusic className="size-4" aria-label="Tem cifra" />}
                {(m.audio_url || m.audio_url_externo) && (
                  <Headphones className="size-4" aria-label="Tem áudio" />
                )}
                {m.tom_original && (
                  <span className="min-w-8 rounded-md bg-muted px-1.5 py-0.5 text-center text-sm font-bold text-chord">
                    {m.tom_original}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
