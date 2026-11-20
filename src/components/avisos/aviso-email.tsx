"use client";

import { useState, useTransition } from "react";

import { definirAvisosEmail } from "@/app/(app)/perfil/acoes";

/** Liga/desliga os avisos por e-mail (escala e repertório publicados). */
export function AvisoEmail({ ativo, email }: { ativo: boolean; email: string }) {
  const [ligado, setLigado] = useState(ativo);
  const [salvando, iniciar] = useTransition();
  const [erro, setErro] = useState(false);

  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        checked={ligado}
        disabled={salvando}
        onChange={(e) => {
          const novo = e.target.checked;
          setLigado(novo);
          setErro(false);
          iniciar(async () => {
            const ok = await definirAvisosEmail(novo);
            if (!ok) {
              setLigado(!novo);
              setErro(true);
            }
          });
        }}
        className="mt-0.5 size-5 accent-primary"
      />
      <span>
        Receber também por e-mail <span className="break-all text-muted-foreground">({email})</span>
        {erro && <span className="block text-destructive">Não foi possível salvar. Tente de novo.</span>}
      </span>
    </label>
  );
}
