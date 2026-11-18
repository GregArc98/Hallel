import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { carregarCultos, carregarIndisponibilidades } from "@/lib/escala/dados";
import { ICONE_PERIODO, NOME_PERIODO, dataCurta, hoje, proximosDomingos } from "@/lib/escala/datas";
import { estaIndisponivel } from "@/lib/escala/regras";
import { cn } from "@/lib/utils";
import { alternarIndisponibilidade } from "../escala/actions";

export const metadata: Metadata = { title: "Minha disponibilidade" };

const SEMANAS = 13; // ~3 meses

export default async function DisponibilidadePage() {
  const ctx = await exigirIntegrante();
  const hojeStr = hoje();
  const domingos = proximosDomingos(hojeStr, SEMANAS);
  const ate = domingos[domingos.length - 1];

  const [cultos, minhas] = await Promise.all([
    carregarCultos(ctx.igreja.id, hojeStr, ate),
    carregarIndisponibilidades(ctx.igreja.id, hojeStr, ate),
  ]);
  const minhasSo = minhas.filter((i) => i.integranteId === ctx.integranteId);

  // Domingos + datas de cultos avulsos no período.
  const avulsos = new Map<string, string | null>();
  for (const c of cultos) if (!domingos.includes(c.data)) avulsos.set(c.data, c.titulo);
  const datas = [...new Set([...domingos, ...avulsos.keys()])].sort();

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/escala">
          <ArrowLeft /> Escala
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Minha disponibilidade</h1>
        <p className="text-muted-foreground">
          Toque no período em que você <strong>não pode</strong>. O líder vê isso na hora de escalar.
        </p>
      </div>

      <ul className="divide-y rounded-xl border">
        {datas.map((data) => (
          <li key={data} id={`d-${data}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <div className="min-w-24 flex-1">
              <p className="font-medium">{dataCurta(data)}</p>
              {avulsos.has(data) && (
                <p className="text-xs text-muted-foreground">{avulsos.get(data) ?? "Culto avulso"}</p>
              )}
            </div>
            {(["manha", "noite"] as const).map((periodo) => {
              const naoPosso = estaIndisponivel(ctx.integranteId, data, periodo, minhasSo);
              return (
                <form key={periodo} action={alternarIndisponibilidade}>
                  <input type="hidden" name="data" value={data} />
                  <input type="hidden" name="periodo" value={periodo} />
                  <button
                    type="submit"
                    aria-pressed={naoPosso}
                    aria-label={`${dataCurta(data)} ${NOME_PERIODO[periodo]}: ${naoPosso ? "não posso (tocar para desfazer)" : "posso"}`}
                    className={cn(
                      "flex h-12 w-32 flex-col items-center justify-center rounded-lg border text-sm leading-tight transition-colors",
                      naoPosso
                        ? "border-destructive bg-destructive/10 font-semibold text-destructive"
                        : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    <span>
                      {ICONE_PERIODO[periodo]} {NOME_PERIODO[periodo]}
                    </span>
                    <span className="text-xs">{naoPosso ? "não posso" : "posso"}</span>
                  </button>
                </form>
              );
            })}
          </li>
        ))}
      </ul>
    </div>
  );
}
