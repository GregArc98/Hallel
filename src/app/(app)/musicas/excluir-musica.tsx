"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { excluirMusica } from "./actions";

export function ExcluirMusica({ id, titulo }: { id: string; titulo: string }) {
  const aviso = `Excluir "${titulo}"?\n\nEla também sai do repertório dos cultos em que foi usada, e a cifra, a letra e o áudio serão apagados. Não dá para desfazer.`;

  return (
    <form
      action={excluirMusica}
      onSubmit={(e) => {
        if (!confirm(aviso)) e.preventDefault();
      }}
      className="border-t pt-6"
    >
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
        <Trash2 /> Excluir música
      </Button>
    </form>
  );
}
