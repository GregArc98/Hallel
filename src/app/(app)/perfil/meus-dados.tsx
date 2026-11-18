"use client";

import { Check, Save } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { type EstadoPerfil, atualizarMeuPerfil } from "./acoes";

const campo =
  "h-11 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function MeusDados({ nome, telefone, email }: { nome: string; telefone: string; email: string }) {
  const [estado, acao, salvando] = useActionState<EstadoPerfil, FormData>(atualizarMeuPerfil, {});
  return (
    <form action={acao} className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Nome</span>
        <input name="nome" defaultValue={nome} required maxLength={80} className={campo} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">WhatsApp</span>
        <input name="telefone" type="tel" inputMode="tel" defaultValue={telefone} className={campo} />
      </label>
      <div className="space-y-1.5">
        <span className="text-sm font-medium">E-mail (para entrar)</span>
        <p className="rounded-lg bg-muted px-3 py-2.5 break-all">{email}</p>
      </div>
      {estado.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={salvando}>
          <Save /> {salvando ? "Salvando…" : "Salvar meus dados"}
        </Button>
        {estado.ok && !salvando && (
          <span className="flex items-center gap-1 text-sm text-primary" role="status">
            <Check className="size-4" /> Salvo
          </span>
        )}
      </div>
    </form>
  );
}
