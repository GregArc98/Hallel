"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { type EstadoConvite, entrarNaEquipe } from "./acoes";

const campo =
  "h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Para quem já tem conta (ou criou pelo Google): confirma nome e WhatsApp e pede a entrada. */
export function FormularioPerfil({
  codigo,
  email,
  nome,
  telefone,
}: {
  codigo: string;
  email: string;
  nome: string;
  telefone: string;
}) {
  const [estado, acao, enviando] = useActionState<EstadoConvite, FormData>(entrarNaEquipe, {});
  return (
    <form action={acao} className="space-y-4">
      <input type="hidden" name="codigo" value={codigo} />
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Seu nome *</span>
        <input name="nome" required autoComplete="name" maxLength={80} defaultValue={nome} placeholder="Como a equipe te chama" className={campo} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">WhatsApp</span>
        <input name="telefone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} defaultValue={telefone} placeholder="(11) 90000-0000" className={campo} />
      </label>
      <div className="space-y-1.5">
        <span className="text-sm font-medium">E-mail</span>
        <p className="rounded-lg bg-muted px-3 py-3 text-base break-all">{email}</p>
      </div>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        <UserPlus /> {enviando ? "Enviando…" : "Pedir para entrar na equipe"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        O líder confirma seu cadastro e define suas funções.
      </p>
    </form>
  );
}
