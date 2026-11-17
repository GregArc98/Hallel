"use client";

import type { ReactNode } from "react";

/** Formulário de exclusão de função com confirmação (afeta escalas existentes). */
export function ConfirmarExclusaoFuncao({
  action,
  id,
  nome,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  nome: string;
  children: ReactNode;
}) {
  return (
    <form
      action={action}
      className="ml-auto"
      onSubmit={(e) => {
        const ok = confirm(
          `Excluir a função "${nome}"?\n\nEla sai do cadastro de todos e das escalas em que aparece. Não dá para desfazer.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      {children}
    </form>
  );
}
