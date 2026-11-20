import { CalendarDays, ChevronRight, Library, Play, UserX } from "lucide-react";
import Link from "next/link";

import { CartaoAvisos } from "@/components/avisos/cartao-avisos";
import { SalvarOffline } from "@/components/pwa/salvar-offline";
import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { VAPID_PUBLICA } from "@/lib/env";
import { carregarFuncoes } from "@/lib/equipe/dados";
import { carregarCultos, carregarRepertorio } from "@/lib/escala/dados";
import { ICONE_PERIODO, NOME_PERIODO, dataCurta, hoje, paraUTC } from "@/lib/escala/datas";
import { minhasEscalas, pendencias } from "@/lib/inicio/regras";
import { tomDoCulto } from "@/lib/repertorio/regras";

const DIAS_A_FRENTE = 70;

function somarDias(data: string, dias: number) {
  const d = paraUTC(data);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function InicioPage() {
  const ctx = await exigirIntegrante();
  const hojeStr = hoje();
  const [cultos, funcoes] = await Promise.all([
    carregarCultos(ctx.igreja.id, hojeStr, somarDias(hojeStr, DIAS_A_FRENTE)),
    carregarFuncoes(ctx.igreja.id),
  ]);
  const nomeFuncao = new Map(funcoes.map((f) => [f.id, f.nome]));
  const escalas = minhasEscalas(cultos, ctx.integranteId, hojeStr);
  const proxima = escalas[0];
  const repertorio = proxima && proxima.culto.repertorioPublicado ? await carregarRepertorio(proxima.culto.id) : [];
  const alertas = ctx.admin ? pendencias(cultos.filter((c) => c.data <= somarDias(hojeStr, 28)), funcoes, hojeStr) : [];

  // Páginas que ficam salvas no aparelho para abrir sem internet.
  const paraOffline = [
    "/",
    ...escalas.slice(0, 3).flatMap(({ culto }) => [`/culto/${culto.id}`, `/culto/${culto.id}/tocar`]),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Olá, {ctx.nome}!</h1>
      <CartaoAvisos chave={VAPID_PUBLICA} />

      {proxima ? (
        <section className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium text-primary">Seu próximo culto</p>
          <div>
            <p className="text-2xl font-bold">
              {dataCurta(proxima.culto.data)} · {ICONE_PERIODO[proxima.culto.periodo]} {NOME_PERIODO[proxima.culto.periodo]}
              {proxima.culto.horario && <span className="font-normal text-muted-foreground"> · {proxima.culto.horario}</span>}
            </p>
            <p className="text-lg">
              Você: <strong>{proxima.funcoes.map((f) => nomeFuncao.get(f)).join(" e ")}</strong>
            </p>
          </div>

          {!proxima.culto.repertorioPublicado ? (
            <p className="rounded-lg bg-background/60 px-3 py-2 text-sm text-muted-foreground">
              O repertório ainda não foi publicado.
            </p>
          ) : repertorio.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem músicas no repertório.</p>
          ) : (
            <>
              <ol className="divide-y overflow-hidden rounded-xl border bg-background">
                {repertorio.map((m, i) => {
                  const tom = tomDoCulto(m.tom, m.tomOriginal);
                  return (
                    <li key={`${m.musicaId}-${i}`}>
                      <Link href={`/culto/${proxima.culto.id}/tocar?i=${i}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50">
                        <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{m.titulo}</span>
                          {m.observacao && <span className="block text-sm text-muted-foreground">{m.observacao}</span>}
                        </span>
                        {tom && <span className="rounded-md bg-muted px-2 py-0.5 font-bold text-chord">{tom}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <Button asChild size="lg" className="w-full">
                <Link href={`/culto/${proxima.culto.id}/tocar`}>
                  <Play /> Modo culto
                </Link>
              </Button>
            </>
          )}
          <Link href={`/culto/${proxima.culto.id}`} className="inline-block text-sm text-primary underline-offset-4 hover:underline">
            Ver escala completa deste culto
          </Link>
          <SalvarOffline urls={paraOffline} />
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed p-4 text-muted-foreground">
          Você não está escalado nos próximos cultos.
        </section>
      )}

      {escalas.length > 1 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Suas próximas escalas</h2>
          <ul className="divide-y rounded-xl border">
            {escalas.slice(1).map(({ culto, funcoes: fs }) => (
              <li key={culto.id}>
                <Link href={`/culto/${culto.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {dataCurta(culto.data)} · {ICONE_PERIODO[culto.periodo]} {NOME_PERIODO[culto.periodo]}
                    </span>
                    <span className="block text-sm text-muted-foreground">{fs.map((f) => nomeFuncao.get(f)).join(" e ")}</span>
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {alertas.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold">Pendências das próximas semanas</h2>
          <ul className="divide-y rounded-xl border">
            {alertas.map((p) => (
              <li key={p.cultoId}>
                <Link href={`/escala/${p.cultoId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">
                      {dataCurta(p.data)} · {NOME_PERIODO[p.periodo]}
                    </span>
                    <span className="block text-sm text-amber-700 dark:text-amber-400">⚠ {p.itens.join(" · ")}</span>
                  </span>
                  <ChevronRight className="size-5 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button asChild variant="outline" size="lg">
          <Link href="/escala">
            <CalendarDays /> Escala do mês
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/disponibilidade">
            <UserX /> Minha disponibilidade
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/musicas">
            <Library /> Músicas
          </Link>
        </Button>
      </section>
    </div>
  );
}
