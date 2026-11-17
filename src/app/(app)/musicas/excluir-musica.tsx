"use client";

import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { excluirMusica } from "./actions";

export function ExcluirMusica({ id, titulo }: { id: string; titulo: string }) {
  return (
    <form
      action={excluirMusica}
      onSubmit={(e) => {
        if (!confirm(`Excluir "${titulo}" do acervo? Isso não pode ser desfeito.`)) e.preventDefault();
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
