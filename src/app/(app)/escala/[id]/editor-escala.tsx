"use client";

import { Check, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { chaveVaga } from "@/lib/escala/regras";
import { cn } from "@/lib/utils";
import { type EstadoEscala, salvarEscala } from "../actions";

export interface PessoaEditor {
  id: string;
  nome: string;
  ativo: boolean;
  /** ids das funções que exerce no período deste culto */
  funcoes: string[];
  indisponivel: boolean;
  emOutroCulto: boolean;
  vezesNoMes: number;
}

export function EditorEscala({
  cultoId,
  periodoNome,
  funcoes,
  pessoas,
  inicial,
}: {
  cultoId: string;
  periodoNome: string;
  funcoes: Array<{ id: string; nome: string; max: number }>;
  pessoas: PessoaEditor[];
  /** chaveVaga → integranteId */
  inicial: Record<string, string>;
}) {
  const [vagas, setVagas] = useState<Record<string, string>>(inicial);
  const [estado, acao, salvando] = useActionState<EstadoEscala, FormData>(salvarEscala, {});
  const [alterado, setAlterado] = useState(false);

  const porId = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas]);
  const nomeFuncao = useMemo(() => new Map(funcoes.map((f) => [f.id, f.nome])), [funcoes]);

  /** Em quais funções cada pessoa está neste culto (estado atual do formulário). */
  const funcoesDaPessoa = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const [chave, pessoa] of Object.entries(vagas)) {
      if (!pessoa) continue;
      const funcaoId = chave.split(":")[1];
      m.set(pessoa, [...(m.get(pessoa) ?? []), funcaoId]);
    }
    return m;
  }, [vagas]);

  const vazias = funcoes.filter((f) => !Object.entries(vagas).some(([k, v]) => v && k.split(":")[1] === f.id));
  const avisos: string[] = [];
  if (vazias.length > 0) avisos.push(`Sem ninguém: ${vazias.map((f) => f.nome).join(", ")}`);
  for (const [pessoa, fs] of funcoesDaPessoa) {
    const p = porId.get(pessoa);
    if (!p) continue;
    if (fs.length > 1) avisos.push(`${p.nome} está em ${fs.map((f) => nomeFuncao.get(f)).join(" e ")}`);
    if (p.indisponivel) avisos.push(`${p.nome} marcou que não pode neste culto`);
    if (p.emOutroCulto) avisos.push(`${p.nome} já está em outro culto no mesmo horário`);
  }

  function rotulo(p: PessoaEditor, funcaoId: string) {
    const marcas: string[] = [];
    if (p.indisponivel) marcas.push("⛔ não pode");
    const outras = (funcoesDaPessoa.get(p.id) ?? []).filter((f) => f !== funcaoId);
    if (outras.length > 0) marcas.push(`já em ${outras.map((f) => nomeFuncao.get(f)).join(", ")}`);
    if (p.emOutroCulto) marcas.push("em outro culto");
    if (p.vezesNoMes > 0) marcas.push(`${p.vezesNoMes}× no mês`);
    return marcas.length ? `${p.nome} — ${marcas.join(" · ")}` : p.nome;
  }

  return (
    <form
      action={(fd) => {
        setAlterado(false);
        acao(fd);
      }}
      className="space-y-4"
    >
      <input type="hidden" name="culto_id" value={cultoId} />

      <div className="space-y-3">
        {funcoes.map((f) => {
          const qualificadas = pessoas
            .filter((p) => p.ativo && p.funcoes.includes(f.id))
            .sort((a, b) => Number(a.indisponivel) - Number(b.indisponivel) || a.vezesNoMes - b.vezesNoMes || a.nome.localeCompare(b.nome, "pt-BR"));
          const outras = pessoas
            .filter((p) => p.ativo && !p.funcoes.includes(f.id))
            .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

          return (
            <fieldset key={f.id} className="rounded-xl border p-3">
              <legend className="px-1 font-semibold">{f.nome}</legend>
              <div className="space-y-2">
                {Array.from({ length: f.max }, (_, i) => i + 1).map((pos) => {
                  const chave = chaveVaga(f.id, pos);
                  const escolhido = vagas[chave] ?? "";
                  const pessoa = porId.get(escolhido);
                  const problema =
                    pessoa &&
                    (pessoa.indisponivel
                      ? "Marcou que não pode neste culto."
                      : (funcoesDaPessoa.get(pessoa.id)?.length ?? 0) > 1
                        ? "Também está em outra função neste culto."
                        : pessoa.emOutroCulto
                          ? "Já está em outro culto no mesmo horário."
                          : !pessoa.funcoes.includes(f.id)
                            ? `Não costuma fazer ${f.nome} à ${periodoNome.toLowerCase()}.`
                            : null);
                  return (
                    <div key={pos}>
                      <label className="sr-only" htmlFor={chave}>
                        {f.nome} {f.max > 1 ? pos : ""}
                      </label>
                      <select
                        id={chave}
                        name={chave}
                        value={escolhido}
                        onChange={(e) => {
                          setVagas((v) => ({ ...v, [chave]: e.target.value }));
                          setAlterado(true);
                        }}
                        className={cn(
                          "h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          problema && "border-amber-500",
                        )}
                      >
                        <option value="">{f.max > 1 ? `— ${f.nome} ${pos}: ninguém —` : "— ninguém —"}</option>
                        <optgroup label={`Fazem ${f.nome} (${periodoNome.toLowerCase()})`}>
                          {qualificadas.map((p) => (
                            <option key={p.id} value={p.id}>
                              {rotulo(p, f.id)}
                            </option>
                          ))}
                        </optgroup>
                        {outras.length > 0 && (
                          <optgroup label="Outros da equipe">
                            {outras.map((p) => (
                              <option key={p.id} value={p.id}>
                                {rotulo(p, f.id)}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {pessoa && !pessoa.ativo && <option value={pessoa.id}>{pessoa.nome} (inativo)</option>}
                      </select>
                      {problema && <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">⚠ {problema}</p>}
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}
      </div>

      {avisos.length > 0 && (
        <ul className="space-y-1 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-300">
          {avisos.map((a) => (
            <li key={a}>⚠ {a}</li>
          ))}
        </ul>
      )}

      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}

      <div className="sticky bottom-[var(--nav-h,0px)] z-10 -mx-4 flex items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" disabled={salvando} className="flex-1 sm:flex-none">
          <Save /> {salvando ? "Salvando…" : "Salvar escala"}
        </Button>
        {estado.ok && !alterado && !salvando && (
          <span className="flex items-center gap-1 text-sm text-primary" role="status">
            <Check className="size-4" /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
