"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { type EstadoCulto, criarCulto } from "../actions";

const campo =
  "h-12 w-full rounded-lg border bg-background px-3 text-base outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function FormularioCulto({ dataInicial, voltar }: { dataInicial: string; voltar: string }) {
  const [estado, acao, criando] = useActionState<EstadoCulto, FormData>(criarCulto, {});
  return (
    <form action={acao} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Data *</span>
          <input type="date" name="data" required defaultValue={dataInicial} className={campo} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Período *</span>
          <select name="periodo" defaultValue="noite" className={campo}>
            <option value="manha">☀ Manhã</option>
            <option value="noite">🌙 Noite</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Título</span>
          <input name="titulo" placeholder="Ex.: Vigília, Culto de jovens" className={campo} />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Horário</span>
          <input name="horario" type="time" className={campo} />
        </label>
      </div>
      <label className="flex items-center gap-3">
        <input type="checkbox" name="tipo" value="regular" className="size-6 accent-primary" />
        <span className="text-sm">
          É um culto regular de domingo (normalmente use &quot;Criar cultos de domingo&quot; na escala)
        </span>
      </label>
      {estado.erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {estado.erro}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={criando}>
          <Plus /> {criando ? "Criando…" : "Criar culto"}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={voltar}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
