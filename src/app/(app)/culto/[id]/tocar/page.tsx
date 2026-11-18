import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { carregarFuncoes } from "@/lib/equipe/dados";
import { carregarCulto, carregarRepertorioCompleto } from "@/lib/escala/dados";
import { NOME_PERIODO, dataCurta } from "@/lib/escala/datas";
import { indiceValido } from "@/lib/inicio/regras";
import { ModoCulto } from "./modo-culto";

export const metadata: Metadata = { title: "Modo culto" };

export default async function TocarPage({ params, searchParams }: PageProps<"/culto/[id]/tocar">) {
  const ctx = await exigirIntegrante();
  const { id } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const culto = await carregarCulto(ctx.igreja.id, id);
  if (!culto) notFound();

  const [musicas, funcoes] = await Promise.all([carregarRepertorioCompleto(id), carregarFuncoes(ctx.igreja.id)]);
  const minhas = culto.vagas.filter((v) => v.integranteId === ctx.integranteId).map((v) => v.funcaoId);
  const soCanta = minhas.length > 0 && minhas.every((f) => funcoes.find((x) => x.id === f)?.modo_padrao === "letra");

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-1">
        <Link href={`/culto/${id}`}>
          <ArrowLeft /> {dataCurta(culto.data)} · {NOME_PERIODO[culto.periodo]}
        </Link>
      </Button>
      {musicas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
          {ctx.admin || culto.repertorioPublicado ? "Este culto ainda não tem músicas." : "Repertório ainda não publicado."}
        </p>
      ) : (
        <ModoCulto
          musicas={musicas}
          inicial={indiceValido(typeof sp.i === "string" ? sp.i : null, musicas.length)}
          modo={soCanta ? "letra" : "cifra"}
        />
      )}
    </div>
  );
}
