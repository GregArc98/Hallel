"use client";

import { Check, Download } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { pedirAoSW } from "@/lib/pwa/sw-cliente";

type Estado = { tipo: "verificando" } | { tipo: "livre"; salvos: number } | { tipo: "baixando" } | { tipo: "pronto" } | { tipo: "erro"; salvos: number };

/** Guarda no aparelho os áudios (enviados para o Hallel) das músicas do culto. */
export function BaixarAudios({ urls }: { urls: string[] }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "verificando" });
  const chave = urls.join("|");

  useEffect(() => {
    let ativo = true;
    pedirAoSW<{ salvos: number; total: number }>("audios-salvos", urls).then((r) => {
      if (!ativo) return;
      if (!r) setEstado({ tipo: "livre", salvos: 0 });
      else setEstado(r.salvos === r.total ? { tipo: "pronto" } : { tipo: "livre", salvos: r.salvos });
    });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reexecuta só quando a lista muda
  }, [chave]);

  if (urls.length === 0) return null;

  if (estado.tipo === "pronto") {
    return (
      <p className="flex items-center gap-1.5 text-sm text-primary">
        <Check className="size-4" /> Áudios salvos no aparelho ({urls.length})
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        disabled={estado.tipo === "baixando" || estado.tipo === "verificando"}
        onClick={async () => {
          setEstado({ tipo: "baixando" });
          const r = await pedirAoSW<{ salvos: number; total: number }>("audios", urls, 600_000);
          if (r && r.salvos === r.total) setEstado({ tipo: "pronto" });
          else setEstado({ tipo: "erro", salvos: r?.salvos ?? 0 });
        }}
      >
        <Download />
        {estado.tipo === "baixando"
          ? "Baixando áudios…"
          : `Baixar áudios deste culto (${urls.length})`}
      </Button>
      {estado.tipo === "erro" && (
        <p className="text-sm text-amber-700 dark:text-amber-400">
          {estado.salvos} de {urls.length} salvos. Confira a internet e tente de novo.
        </p>
      )}
      {estado.tipo === "livre" && estado.salvos > 0 && (
        <p className="text-xs text-muted-foreground">
          {estado.salvos} de {urls.length} já estão no aparelho.
        </p>
      )}
    </div>
  );
}
