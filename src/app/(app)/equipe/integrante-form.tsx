"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { chaveFuncao, NOME_PERIODO, PERIODOS } from "@/lib/equipe/formulario";
import { type EstadoIntegrante, salvarIntegrante } from "./actions";

const classeCampo =
  "h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive";

export interface ValoresIntegrante {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  papel: "admin" | "membro";
  ativo: boolean;
  /** chaves "funcao:<id>:<periodo>" marcadas */
  marcadas: string[];
}

export function IntegranteForm({
  funcoes,
  valores,
  euMesmo,
  aprovar = false,
}: {
  funcoes: Array<{ id: string; nome: string }>;
  valores: ValoresIntegrante;
  euMesmo: boolean;
  /** Cadastro feito pela pessoa pelo link: salvar = aprovar. */
  aprovar?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoIntegrante, FormData>(salvarIntegrante, {});
  const erros = estado.erros ?? {};
  const marcadas = new Set(valores.marcadas);

  return (
    <form action={acao} className="space-y-6" noValidate>
      {valores.id && <input type="hidden" name="id" value={valores.id} />}
      {aprovar && <input type="hidden" name="aprovar" value="1" />}

      <section className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Nome *</span>
          <input
            name="nome"
            defaultValue={valores.nome}
            required
            aria-invalid={erros.nome ? true : undefined}
            className={classeCampo}
          />
          {erros.nome && <span className="block text-sm text-destructive">{erros.nome}</span>}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">E-mail (para entrar no app)</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            defaultValue={valores.email}
            aria-invalid={erros.email ? true : undefined}
            className={classeCampo}
          />
          {erros.email ? (
            <span className="block text-sm text-destructive">{erros.email}</span>
          ) : (
            <span className="block text-xs text-muted-foreground">
              A pessoa cria a senha com este e-mail pelo link de convite da equipe e já entra aprovada.
            </span>
          )}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Telefone / WhatsApp</span>
          <input name="telefone" type="tel" inputMode="tel" defaultValue={valores.telefone} className={classeCampo} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Papel</span>
          <select name="papel" defaultValue={valores.papel} className={classeCampo}>
            <option value="membro">Membro</option>
            <option value="admin">Líder (admin)</option>
          </select>
          <span className="block text-xs text-muted-foreground">
            Líderes cadastram músicas, equipe, escalas e repertórios.
            {euMesmo && " Se você virar membro, perde esses acessos."}
          </span>
        </label>
        <label className={`flex items-center gap-3 self-center pt-4 sm:pt-6 ${aprovar ? "hidden" : ""}`}>
          <input type="checkbox" name="ativo" defaultChecked={valores.ativo} className="size-6 accent-primary" />
          <span>
            <span className="block font-medium">Ativo na equipe</span>
            <span className="block text-xs text-muted-foreground">
              Inativo não entra no app nem aparece para escalar.
            </span>
          </span>
        </label>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Funções</h2>
        <p className="text-sm text-muted-foreground">Marque o que a pessoa faz em cada período.</p>
        {funcoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma função cadastrada. <Link href="/equipe/funcoes" className="underline">Cadastrar funções</Link>
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead className="bg-muted/50 text-sm">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Função</th>
                  {PERIODOS.map((p) => (
                    <th key={p} className="w-24 px-2 py-2 text-center font-medium">
                      {p === "manha" ? "☀ " : "🌙 "}
                      {NOME_PERIODO[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {funcoes.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-1">{f.nome}</td>
                    {PERIODOS.map((p) => {
                      const chave = chaveFuncao(f.id, p);
                      return (
                        <td key={p} className="text-center">
                          <label className="flex h-12 cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              name={chave}
                              defaultChecked={marcadas.has(chave)}
                              aria-label={`${f.nome} — ${NOME_PERIODO[p]}`}
                              className="size-6 accent-primary"
                            />
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-[var(--nav-h,0px)] z-10 -mx-4 flex gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" disabled={salvando} className="flex-1 sm:flex-none">
          <Save /> {salvando ? "Salvando…" : aprovar ? "Aprovar e salvar" : "Salvar"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href="/equipe">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
