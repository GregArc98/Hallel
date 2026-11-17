import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exigirAdmin } from "@/lib/auth";
import { carregarFuncoes } from "@/lib/equipe/dados";
import { excluirFuncao, moverFuncao, salvarFuncao } from "../actions";
import { ConfirmarExclusaoFuncao } from "./confirmar";

export const metadata: Metadata = { title: "Funções" };

const ERROS: Record<string, string> = {
  invalida: "Confira o nome e o limite por culto (de 1 a 10).",
  repetida: "Já existe uma função com esse nome.",
  falha: "Não foi possível salvar. Tente de novo.",
};

const campo =
  "h-10 rounded-lg border bg-background px-2 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

function CamposFuncao({
  nome = "",
  max = 1,
  modo = "cifra",
}: {
  nome?: string;
  max?: number;
  modo?: string;
}) {
  return (
    <>
      <label className="min-w-0 flex-1 basis-40">
        <span className="sr-only">Nome</span>
        <input name="nome" defaultValue={nome} placeholder="Ex.: Violão" required className={`${campo} w-full`} />
      </label>
      <label className="flex items-center gap-1 text-sm text-muted-foreground">
        até
        <select name="max_por_culto" defaultValue={max} className={campo} aria-label="Pessoas por culto">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        por culto
      </label>
      <label>
        <span className="sr-only">Abre a música em</span>
        <select name="modo_padrao" defaultValue={modo} className={campo}>
          <option value="cifra">abre na cifra</option>
          <option value="letra">abre na letra</option>
        </select>
      </label>
    </>
  );
}

export default async function FuncoesPage({ searchParams }: PageProps<"/equipe/funcoes">) {
  const ctx = await exigirAdmin();
  const { erro } = await searchParams;
  const funcoes = await carregarFuncoes(ctx.igreja.id);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/equipe">
          <ArrowLeft /> Equipe
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">Funções</h1>
        <p className="text-sm text-muted-foreground">
          A ordem aqui é a ordem da escala. &quot;Abre na letra&quot; é para quem canta (Vocal,
          Ministração).
        </p>
      </div>
      {typeof erro === "string" && ERROS[erro] && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {ERROS[erro]}
        </p>
      )}

      <ul className="space-y-2">
        {funcoes.map((f, i) => (
          <li key={f.id} className="rounded-xl border p-3">
            <form action={salvarFuncao} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={f.id} />
              <CamposFuncao nome={f.nome} max={f.max_por_culto} modo={f.modo_padrao} />
              <Button type="submit" size="sm" variant="secondary">
                <Save /> Salvar
              </Button>
            </form>
            <div className="mt-2 flex items-center gap-1">
              <form action={moverFuncao}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="direcao" value="cima" />
                <Button type="submit" variant="ghost" size="icon-sm" disabled={i === 0} aria-label={`Subir ${f.nome}`}>
                  <ArrowUp />
                </Button>
              </form>
              <form action={moverFuncao}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="direcao" value="baixo" />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === funcoes.length - 1}
                  aria-label={`Descer ${f.nome}`}
                >
                  <ArrowDown />
                </Button>
              </form>
              <ConfirmarExclusaoFuncao action={excluirFuncao} id={f.id} nome={f.nome}>
                <Button type="submit" variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive">
                  <Trash2 /> Excluir
                </Button>
              </ConfirmarExclusaoFuncao>
            </div>
          </li>
        ))}
      </ul>

      <section className="space-y-2 rounded-xl border border-dashed p-3">
        <h2 className="font-semibold">Nova função</h2>
        <form action={salvarFuncao} className="flex flex-wrap items-center gap-2">
          <CamposFuncao />
          <Button type="submit" size="sm">
            <Plus /> Adicionar
          </Button>
        </form>
      </section>
    </div>
  );
}
