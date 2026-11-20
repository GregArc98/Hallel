"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { type SituacaoAvisos, lerSituacao } from "@/lib/avisos/cliente";
import { AtivarAvisos } from "./ativar-avisos";

const CHAVE_DISPENSADO = "hallel.avisos.dispensado";

function dispensado(): boolean {
  try {
    return localStorage.getItem(CHAVE_DISPENSADO) === "1";
  } catch {
    return false;
  }
}

/** Convite no Início para ligar os avisos (some depois de ligar ou de tocar no X). */
export function CartaoAvisos({ chave }: { chave: string }) {
  const [situacao, setSituacao] = useState<SituacaoAvisos | "oculto">("oculto");

  useEffect(() => {
    if (!chave || dispensado()) return;
    void lerSituacao().then((s) => setSituacao(s === "desligado" || s === "instalar-iphone" ? s : "oculto"));
  }, [chave]);

  if (situacao === "oculto" || situacao === "carregando") return null;

  function fechar() {
    try {
      localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      /* sem armazenamento: só esconde agora */
    }
    setSituacao("oculto");
  }

  return (
    <section className="relative space-y-3 rounded-2xl border p-4 pr-12">
      <Button type="button" variant="ghost" size="icon-sm" onClick={fechar} aria-label="Agora não" className="absolute top-2 right-2">
        <X />
      </Button>
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <div>
          <p className="font-semibold">Receba um aviso quando sair a escala</p>
          <p className="text-sm text-muted-foreground">E quando o repertório dos seus cultos for publicado.</p>
        </div>
      </div>
      <AtivarAvisos chave={chave} aoMudar={(ligado) => ligado && setTimeout(() => setSituacao("oculto"), 2000)} />
    </section>
  );
}
