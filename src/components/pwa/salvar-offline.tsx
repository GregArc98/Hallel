"use client";

import { CloudCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { pedirAoSW } from "@/lib/pwa/sw-cliente";

/** Salva no aparelho as páginas dos próximos cultos para abrirem sem internet. */
export function SalvarOffline({ urls }: { urls: string[] }) {
  const [salvo, setSalvo] = useState(false);
  const chave = urls.join("|");

  useEffect(() => {
    if (!navigator.onLine || urls.length === 0) return;
    let ativo = true;
    pedirAoSW<{ salvas: number }>("salvar", urls).then((r) => {
      if (ativo && r && r.salvas > 0) setSalvo(true);
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reexecuta só quando a lista muda
  }, [chave]);

  if (!salvo) return null;
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <CloudCheck className="size-4" /> Repertório salvo no aparelho: abre mesmo sem internet.
    </p>
  );
}
