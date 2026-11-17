"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { excluirIntegrante } from "./actions";

export function ExcluirIntegrante({ id, nome }: { id: string; nome: string }) {
  return (
    <form
      action={excluirIntegrante}
      onSubmit={(e) => {
        const ok = confirm(
          `Remover ${nome} da equipe?\n\nA pessoa perde o acesso e sai das escalas em que estava. Não dá para desfazer.\n\nSe for algo temporário, prefira desmarcar "Ativo na equipe".`,
        );
        if (!ok) e.preventDefault();
      }}
      className="border-t pt-6"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
        <Trash2 /> Remover da equipe
      </Button>
    </form>
  );
}
