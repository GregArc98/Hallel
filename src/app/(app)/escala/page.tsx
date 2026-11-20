import { CalendarPlus, ChevronLeft, ChevronRight, ListMusic, Pencil, Plus, Send, Undo2, UserX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { BotaoWhatsapp, OpcaoAvisar } from "@/components/avisos/publicacao";
import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { cultoParaWhatsapp, textoWhatsappEscala } from "@/lib/avisos/mensagens";
import { enderecoDoApp } from "@/lib/avisos/publicacao";
import { carregarMes } from "@/lib/escala/dados";
import {
  ICONE_PERIODO,
  NOME_PERIODO,
  chaveMes,
  dataCurta,
  domingosDoMes,
  hoje,
  lerMes,
  nomeDoMes,
  somarMeses,
} from "@/lib/escala/datas";
import { analisarCulto } from "@/lib/escala/regras";
import { cn } from "@/lib/utils";
import { gerarDomingos, publicarMes } from "./actions";

export const metadata: Metadata = { title: "Escala" };

export default async function EscalaPage({ searchParams }: PageProps<"/escala">) {
  const ctx = await exigirIntegrante();
  const params = await searchParams;
  const hojeStr = hoje();
  const mes = lerMes(typeof params.mes === "string" ? params.mes : null, hojeStr);
  const { cultos, funcoes, equipe, indisponibilidades } = await carregarMes(ctx.igreja.id, mes);

  const nome = new Map(equipe.map((m) => [m.id, m.nome]));
  const domingosSemCulto = domingosDoMes(mes).some(
    (d) => cultos.filter((c) => c.tipo === "regular" && c.data === d).length < 2,
  );
  const rascunhos = cultos.filter((c) => !c.escalaPublicada).length;
  const textoWhatsapp =
    ctx.admin && cultos.length > 0 && rascunhos === 0
      ? textoWhatsappEscala(
          `Escala de ${nomeDoMes(mes)}`,
          cultos.map((c) => cultoParaWhatsapp(c, funcoes, nome)),
          `${await enderecoDoApp()}/escala?mes=${chaveMes(mes)}`,
        )
      : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button asChild variant="ghost" size="icon" aria-label="Mês anterior">
          <Link href={`/escala?mes=${chaveMes(somarMeses(mes, -1))}`}>
            <ChevronLeft />
          </Link>
        </Button>
        <h1 className="text-center text-xl font-bold capitalize sm:text-2xl">Escala de {nomeDoMes(mes)}</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Próximo mês">
          <Link href={`/escala?mes=${chaveMes(somarMeses(mes, 1))}`}>
            <ChevronRight />
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/disponibilidade">
            <UserX /> Minha disponibilidade
          </Link>
        </Button>
        {ctx.admin && (
          <>
            {domingosSemCulto && (
              <form action={gerarDomingos}>
                <input type="hidden" name="mes" value={chaveMes(mes)} />
                <Button type="submit" variant="outline">
                  <CalendarPlus /> Criar cultos de domingo
                </Button>
              </form>
            )}
            <Button asChild variant="outline">
              <Link href={`/escala/novo?mes=${chaveMes(mes)}`}>
                <Plus /> Culto avulso
              </Link>
            </Button>
          </>
        )}
      </div>

      {ctx.admin && cultos.length > 0 && (
        <form action={publicarMes} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
          <input type="hidden" name="mes" value={chaveMes(mes)} />
          <p className="flex-1 text-sm">
            {rascunhos === 0
              ? "Escala do mês publicada: a equipe já vê."
              : `${rascunhos} culto${rascunhos > 1 ? "s" : ""} em rascunho (a equipe ainda não vê).`}
          </p>
          {rascunhos > 0 ? (
            <>
              <OpcaoAvisar />
              <Button type="submit" name="publicar" value="1">
                <Send /> Publicar escala do mês
              </Button>
            </>
          ) : (
            <>
              {textoWhatsapp && <BotaoWhatsapp texto={textoWhatsapp} />}
              <Button type="submit" name="publicar" value="0" variant="ghost">
                <Undo2 /> Voltar para rascunho
              </Button>
            </>
          )}
        </form>
      )}

      {cultos.length === 0 && (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          Nenhum culto neste mês.
          {ctx.admin && " Use \"Criar cultos de domingo\" para começar."}
        </p>
      )}

      <ul className="space-y-3">
        {cultos.map((c) => {
          const passou = c.data < hojeStr;
          const visivel = ctx.admin || c.escalaPublicada;
          const alertas = ctx.admin ? analisarCulto(c, funcoes, indisponibilidades, cultos) : null;
          const problemas = alertas
            ? [
                alertas.funcoesVazias.length > 0 &&
                  `${alertas.funcoesVazias.length} função${alertas.funcoesVazias.length > 1 ? "ões" : ""} sem ninguém`,
                alertas.repetidos.length > 0 && "pessoa em duas funções",
                alertas.indisponiveis.length > 0 && "escalado indisponível",
                alertas.outroCulto.length > 0 && "conflito de horário",
              ].filter(Boolean)
            : [];
          const euEscalado = c.vagas.some((v) => v.integranteId === ctx.integranteId);

          return (
            <li
              key={c.id}
              className={cn(
                "rounded-xl border",
                passou && "opacity-60",
                euEscalado && "border-primary ring-1 ring-primary/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
                <h2 className="font-semibold">
                  {dataCurta(c.data)} · {ICONE_PERIODO[c.periodo]} {NOME_PERIODO[c.periodo]}
                  {c.horario && <span className="font-normal text-muted-foreground"> · {c.horario}</span>}
                </h2>
                {c.titulo && <span className="text-sm text-muted-foreground">{c.titulo}</span>}
                <div className="ml-auto flex items-center gap-2">
                  {ctx.admin && !c.escalaPublicada && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">rascunho</span>
                  )}
                  {euEscalado && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      você está escalado
                    </span>
                  )}
                  {ctx.admin && (
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/escala/${c.id}`}>
                        <Pencil /> Editar
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {visivel ? (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3 text-sm">
                  {funcoes.map((f) => {
                    const pessoas = c.vagas
                      .filter((v) => v.funcaoId === f.id)
                      .sort((a, b) => a.posicao - b.posicao);
                    return (
                      <div key={f.id} className="contents">
                        <dt className="text-muted-foreground">{f.nome}</dt>
                        <dd>
                          {pessoas.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            pessoas.map((v, i) => (
                              <span key={v.posicao}>
                                {i > 0 && ", "}
                                <span
                                  className={cn(
                                    v.integranteId === ctx.integranteId && "rounded bg-primary/10 px-1 font-semibold text-primary",
                                  )}
                                >
                                  {nome.get(v.integranteId) ?? "?"}
                                </span>
                              </span>
                            ))
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              ) : (
                <p className="px-4 py-3 text-sm text-muted-foreground">Escala em preparação.</p>
              )}

              <div className="flex flex-wrap items-center gap-2 border-t px-4 py-2">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/culto/${c.id}`}>
                    <ListMusic />
                    {ctx.admin || c.repertorioPublicado
                      ? c.musicas > 0
                        ? `Repertório (${c.musicas} música${c.musicas > 1 ? "s" : ""})`
                        : "Repertório (vazio)"
                      : "Ver culto"}
                  </Link>
                </Button>
                {ctx.admin && c.musicas > 0 && !c.repertorioPublicado && (
                  <span className="text-xs text-muted-foreground">repertório em rascunho</span>
                )}
              </div>

              {problemas.length > 0 && !passou && (
                <p className="border-t px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
                  ⚠ {problemas.join(" · ")}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
