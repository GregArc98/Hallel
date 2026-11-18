import { ChevronRight, Plus, Settings2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { carregarEquipe, carregarFuncoes, carregarUltimosAcessos, resumoFuncoes } from "@/lib/equipe/dados";
import { tempoDesde } from "@/lib/equipe/formulario";
import { createClient } from "@/lib/supabase/server";
import { recusarCadastro } from "./actions";
import { ConviteCard } from "./convite-card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Equipe" };

export default async function EquipePage() {
  const ctx = await exigirIntegrante();
  const supabase = await createClient();
  const [equipe, funcoes, acessos, { data: igreja }] = await Promise.all([
    carregarEquipe(ctx.igreja.id),
    carregarFuncoes(ctx.igreja.id),
    ctx.admin ? carregarUltimosAcessos(ctx.igreja.id) : Promise.resolve(new Map<string, string>()),
    ctx.admin
      ? supabase.from("igreja").select("codigo_convite, convite_ativo").eq("id", ctx.igreja.id).single()
      : Promise.resolve({ data: null }),
  ]);
  const pendentes = equipe.filter((m) => !m.aprovado);
  const ativos = equipe.filter((m) => m.aprovado && m.ativo);
  const inativos = equipe.filter((m) => m.aprovado && !m.ativo);

  const lista = (membros: typeof equipe) => (
    <ul className="divide-y rounded-xl border">
      {membros.map((m) => {
        const conteudo = (
          <>
            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {m.nome}
                {m.papel === "admin" && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    Líder
                  </span>
                )}
                {ctx.admin && !m.email && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    sem e-mail
                  </span>
                )}
                {ctx.admin && m.email && !m.entrouNoApp && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    ainda não entrou
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {resumoFuncoes(m, funcoes).join(" · ") || "Nenhuma função"}
              </p>
              {ctx.admin && m.entrouNoApp && (
                <p className="text-xs text-muted-foreground">
                  Último acesso: {acessos.has(m.id) ? tempoDesde(acessos.get(m.id)!) : "ainda não registrado"}
                </p>
              )}
            </div>
            {ctx.admin && <ChevronRight className="size-5 shrink-0 text-muted-foreground" />}
          </>
        );
        return (
          <li key={m.id}>
            {ctx.admin ? (
              <Link href={`/equipe/${m.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                {conteudo}
              </Link>
            ) : (
              <div className={cn("flex items-center gap-3 px-4 py-3")}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Equipe</h1>
        {ctx.admin && (
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/equipe/funcoes">
                <Settings2 /> Funções
              </Link>
            </Button>
            <Button asChild>
              <Link href="/equipe/novo">
                <Plus /> Novo integrante
              </Link>
            </Button>
          </div>
        )}
      </div>
      {ctx.admin && pendentes.length > 0 && (
        <section className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 p-4">
          <h2 className="font-semibold">
            Novos cadastros ({pendentes.length})
          </h2>
          <p className="text-sm text-muted-foreground">Confira quem é, escolha as funções e aprove.</p>
          <ul className="divide-y rounded-lg border bg-background">
            {pendentes.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{m.nome}</p>
                  <p className="text-sm break-all text-muted-foreground">
                    {[m.email, m.telefone].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href={`/equipe/${m.id}`}>Aprovar</Link>
                </Button>
                <form action={recusarCadastro}>
                  <input type="hidden" name="id" value={m.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                    Recusar
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted-foreground">
        {ativos.length} integrante{ativos.length === 1 ? "" : "s"}
      </p>
      {ativos.length > 0 ? lista(ativos) : <p className="text-muted-foreground">Ninguém cadastrado ainda.</p>}
      {ctx.admin && igreja && (
        <ConviteCard
          caminho={`/convite/${igreja.codigo_convite}`}
          ativo={igreja.convite_ativo}
          igreja={ctx.igreja.nome}
        />
      )}
      {ctx.admin && inativos.length > 0 && (
        <section className="space-y-2 pt-4">
          <h2 className="font-semibold text-muted-foreground">Inativos</h2>
          {lista(inativos)}
        </section>
      )}
    </div>
  );
}
