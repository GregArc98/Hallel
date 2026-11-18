"use client";

import { Check, Copy, Link2, MessageCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { alternarConvite, renovarConvite } from "./actions";

export function ConviteCard({ caminho, ativo, igreja }: { caminho: string; ativo: boolean; igreja: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window === "undefined" ? caminho : new URL(caminho, window.location.origin).toString();
  const mensagem = `Pessoal do louvor! 🎵 Entrem no Hallel, o app da escala e do repertório de ${igreja}: ${url}\nÉ só digitar seu e-mail, abrir o link que chegar e preencher nome e WhatsApp.`;

  return (
    <section id="convite" className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Link2 className="size-5 text-primary" />
        <h2 className="font-semibold">Link de convite da equipe</h2>
        {!ativo && <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">desativado</span>}
      </div>
      {ativo ? (
        <>
          <p className="text-sm text-muted-foreground">
            Mande no grupo do WhatsApp. Cada pessoa cria o próprio perfil e você aprova aqui.
          </p>
          <p className="rounded-lg bg-muted px-3 py-2 font-mono text-sm break-all" suppressHydrationWarning>
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopiado(true);
                  setTimeout(() => setCopiado(false), 2000);
                } catch {
                  /* sem permissão de copiar */
                }
              }}
            >
              {copiado ? <Check /> : <Copy />} {copiado ? "Copiado!" : "Copiar link"}
            </Button>
            <Button asChild variant="outline">
              <a href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Enviar no WhatsApp
              </a>
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Ninguém novo consegue se cadastrar enquanto o link estiver desativado.</p>
      )}
      <div className="flex flex-wrap gap-2 border-t pt-3">
        <form
          action={renovarConvite}
          onSubmit={(e) => {
            if (!confirm("Gerar um link novo? O link atual para de funcionar.")) e.preventDefault();
          }}
        >
          <Button type="submit" variant="ghost" size="sm">
            <RefreshCw /> Gerar link novo
          </Button>
        </form>
        <form action={alternarConvite}>
          <input type="hidden" name="ativo" value={ativo ? "0" : "1"} />
          <Button type="submit" variant="ghost" size="sm">
            {ativo ? "Desativar link" : "Ativar link"}
          </Button>
        </form>
      </div>
    </section>
  );
}
