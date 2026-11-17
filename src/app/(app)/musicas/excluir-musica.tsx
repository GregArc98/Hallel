"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { arquivarMusica, excluirMusica } from "./actions";

/**
 * Arquivar (padrão, reversível) ou excluir de vez (pede confirmação e avisa em
 * quais cultos a música aparece).
 */
export function AcoesPerigosas({
  id,
  titulo,
  arquivada,
  cultos,
}: {
  id: string;
  titulo: string;
  arquivada: boolean;
  /** Datas dos cultos em que a música está no repertório, já formatadas. */
  cultos: string[];
}) {
  const aviso =
    cultos.length === 0
      ? `Excluir "${titulo}" de vez? A cifra, a letra e o áudio serão apagados. Não dá para desfazer.`
      : `"${titulo}" está no repertório de ${cultos.length} culto${cultos.length > 1 ? "s" : ""} (${cultos
          .slice(0, 5)
          .join(", ")}${cultos.length > 5 ? "…" : ""}).\n\nExcluindo de vez, ela também sai desses repertórios, e a cifra, a letra e o áudio são apagados. Não dá para desfazer.\n\nSe você só não quer mais usá-la, prefira Arquivar.`;

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="space-y-2">
        <form action={arquivarMusica}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="arquivar" value={arquivada ? "0" : "1"} />
          <Button type="submit" variant="outline">
            {arquivada ? <ArchiveRestore /> : <Archive />}
            {arquivada ? "Desarquivar música" : "Arquivar música"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          {arquivada
            ? "Ela volta a aparecer no acervo e na montagem de repertório."
            : "Some do acervo e da montagem de repertório, mas continua nos cultos antigos (com cifra e áudio). Dá para desarquivar."}
        </p>
      </div>

      <form
        action={excluirMusica}
        onSubmit={(e) => {
          if (!confirm(aviso)) e.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="ghost" className="text-destructive hover:text-destructive">
          <Trash2 /> Excluir de vez
        </Button>
      </form>
    </div>
  );
}
