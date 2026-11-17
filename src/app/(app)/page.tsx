import Link from "next/link";

import { Button } from "@/components/ui/button";
import { exigirIntegrante } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const PERIODO = { manha: "manhã", noite: "noite" } as const;

/** Início provisório (o "Seu próximo culto" chega na etapa 8). */
export default async function InicioPage() {
  const ctx = await exigirIntegrante();
  const supabase = await createClient();
  const { data: funcoes } = await supabase
    .from("integrante_funcao")
    .select("periodo, funcao:funcao!integrante_funcao_funcao_id_igreja_id_fkey (nome, ordem)")
    .eq("integrante_id", ctx.integranteId);

  const porFuncao = new Map<string, { ordem: number; periodos: string[] }>();
  for (const f of funcoes ?? []) {
    if (!f.funcao) continue;
    const item = porFuncao.get(f.funcao.nome) ?? { ordem: f.funcao.ordem, periodos: [] };
    item.periodos.push(PERIODO[f.periodo]);
    porFuncao.set(f.funcao.nome, item);
  }
  const lista = [...porFuncao.entries()].sort((a, b) => a[1].ordem - b[1].ordem);

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-bold">Olá, {ctx.nome}!</h1>
        <p className="text-muted-foreground">
          {ctx.admin ? "Você é líder (admin)" : "Você é membro"} de {ctx.igreja.nome}.
        </p>
      </section>

      <section className="rounded-xl border p-4">
        <h2 className="mb-2 font-semibold">Suas funções</h2>
        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma função cadastrada ainda.</p>
        ) : (
          <ul className="space-y-1">
            {lista.map(([nome, { periodos }]) => (
              <li key={nome} className="flex justify-between gap-3">
                <span>{nome}</span>
                <span className="text-sm text-muted-foreground">{periodos.sort().join(" e ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        Em breve aqui: seu próximo culto, o repertório e as cifras já no tom certo.
      </section>

      <Button asChild variant="outline">
        <Link href="/demo">Ver demonstração da cifra</Link>
      </Button>
    </div>
  );
}
